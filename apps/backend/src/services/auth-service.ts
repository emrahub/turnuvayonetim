import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient, UserRole } from '@prisma/client';
import Redis from 'ioredis';
import {
  JWTPayload,
  RefreshTokenPayload,
  TokenValidationResult,
  TokenBlacklistEntry,
  SessionInfo,
  DeviceInfo,
  SecurityEvent,
  SecurityEventType,
  AuthErrorCode,
  UserInfo,
  OrganizationInfo,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  AuthConfig
} from '../types/auth-types';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateSessionId,
  generateJwtId,
  calculateLockoutState,
  isAccountLocked,
  LockoutPolicy,
  DEFAULT_LOCKOUT_POLICY,
  addRandomDelay,
  constantTimeCompare
} from '../utils/password-utils';
import { EventStore } from './event-store';

// ================================================================
// AUTHENTICATION SERVICE CONFIGURATION
// ================================================================

export interface AuthServiceConfig {
  jwtSecret: string;
  jwtPrivateKey?: string; // For RS256
  jwtPublicKey?: string;  // For RS256
  refreshTokenSecret: string;
  pepper?: string;
  redis?: Redis;
  eventStore?: EventStore;
  config: AuthConfig;
}

// ================================================================
// AUTHENTICATION SERVICE
// ================================================================

export class AuthService {
  private redis?: Redis;
  private eventStore?: EventStore;
  private tokenBlacklist = new Set<string>();

  constructor(
    private prisma: PrismaClient,
    private config: AuthServiceConfig
  ) {
    this.redis = config.redis;
    this.eventStore = config.eventStore;

    // Load token blacklist from Redis if available
    this.loadTokenBlacklist();
  }

  // ================================================================
  // USER REGISTRATION
  // ================================================================

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const { email, password, firstName, lastName, organizationSlug, inviteToken } = request;

    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        await this.logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILED,
          details: { email, reason: 'User already exists' }
        });
        throw new Error(AuthErrorCode.EMAIL_ALREADY_EXISTS);
      }

      // Validate invite token if provided
      let organizationId: string;
      let role: UserRole = UserRole.PLAYER;

      if (inviteToken) {
        const invite = await this.validateInviteToken(inviteToken);
        organizationId = invite.organizationId;
        role = invite.role;
      } else if (organizationSlug) {
        const organization = await this.prisma.organization.findUnique({
          where: { slug: organizationSlug }
        });
        if (!organization) {
          throw new Error(AuthErrorCode.ORGANIZATION_NOT_FOUND);
        }
        organizationId = organization.id;
      } else {
        throw new Error('Organization slug or invite token required');
      }

      // Hash password
      const passwordHash = await hashPassword(password, { pepper: this.config.pepper });

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          organizationId,
          role,
          emailVerified: !this.config.config.security.emailVerificationRequired
        },
        include: {
          organization: true
        }
      });

      // Mark invite as used if provided
      if (inviteToken) {
        await this.markInviteAsUsed(inviteToken, user.id);
      }

      // Generate email verification token if required
      if (this.config.config.security.emailVerificationRequired) {
        await this.generateEmailVerificationToken(user.id, email);
      }

      // Create session and tokens
      const sessionId = generateSessionId();
      const { accessToken, refreshToken } = await this.generateTokens(user, sessionId);

      // Create session record
      await this.createSession(user.id, sessionId, {});

      await this.logSecurityEvent({
        type: SecurityEventType.LOGIN_SUCCESS,
        userId: user.id,
        organizationId: user.organizationId,
        details: { email, registrationFlow: true }
      });

      return {
        user: this.mapUserToUserInfo(user),
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpirationSeconds(),
        tokenType: 'Bearer',
        emailVerificationRequired: this.config.config.security.emailVerificationRequired
      };

    } catch (error) {
      await this.logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILED,
        details: { email, error: error.message }
      });
      throw error;
    }
  }

  // ================================================================
  // USER LOGIN
  // ================================================================

  async login(request: LoginRequest, clientInfo?: { ipAddress?: string; userAgent?: string }): Promise<LoginResponse> {
    const { email, password, organizationSlug, rememberMe, twoFactorCode } = request;

    try {
      // Add random delay to prevent timing attacks
      await addRandomDelay(100, 300);

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { organization: true }
      });

      if (!user) {
        await this.logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILED,
          details: { email, reason: 'User not found' },
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent
        });
        throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
      }

      // Check account lockout
      const lockoutState = await this.checkAccountLockout(user.id);
      if (isAccountLocked(lockoutState)) {
        await this.logSecurityEvent({
          type: SecurityEventType.LOGIN_LOCKED,
          userId: user.id,
          organizationId: user.organizationId,
          details: { email, lockoutUntil: lockoutState.lockoutUntil },
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent
        });
        throw new Error(AuthErrorCode.ACCOUNT_LOCKED);
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash || '', this.config.pepper);
      if (!isPasswordValid) {
        await this.recordFailedLoginAttempt(user.id);
        await this.logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILED,
          userId: user.id,
          organizationId: user.organizationId,
          details: { email, reason: 'Invalid password' },
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent
        });
        throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
      }

      // Check if account is active
      if (!user.isActive) {
        await this.logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILED,
          userId: user.id,
          organizationId: user.organizationId,
          details: { email, reason: 'Account disabled' },
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent
        });
        throw new Error(AuthErrorCode.ACCOUNT_DISABLED);
      }

      // Check email verification
      if (this.config.config.security.emailVerificationRequired && !user.emailVerified) {
        await this.logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILED,
          userId: user.id,
          organizationId: user.organizationId,
          details: { email, reason: 'Email not verified' },
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent
        });
        throw new Error(AuthErrorCode.EMAIL_NOT_VERIFIED);
      }

      // Handle organization switching
      if (organizationSlug && user.organization.slug !== organizationSlug) {
        const targetOrganization = await this.switchOrganization(user.id, organizationSlug);
        user.organizationId = targetOrganization.id;
        user.organization = targetOrganization;
      }

      // Check two-factor authentication
      if (this.config.config.security.twoFactorRequired || user.twoFactorEnabled) {
        if (!twoFactorCode) {
          return {
            requiresTwoFactor: true,
            user: this.mapUserToUserInfo(user),
            organizations: await this.getUserOrganizations(user.id)
          } as LoginResponse;
        }

        const isTwoFactorValid = await this.verifyTwoFactorCode(user.id, twoFactorCode);
        if (!isTwoFactorValid) {
          await this.logSecurityEvent({
            type: SecurityEventType.TWO_FACTOR_FAILED,
            userId: user.id,
            organizationId: user.organizationId,
            details: { email },
            ipAddress: clientInfo?.ipAddress,
            userAgent: clientInfo?.userAgent
          });
          throw new Error(AuthErrorCode.INVALID_TWO_FACTOR);
        }
      }

      // Reset failed login attempts on successful login
      await this.resetFailedLoginAttempts(user.id);

      // Create session and tokens
      const sessionId = generateSessionId();
      const { accessToken, refreshToken } = await this.generateTokens(user, sessionId, rememberMe);

      // Create session record
      const deviceInfo = this.parseDeviceInfo(clientInfo?.userAgent);
      await this.createSession(user.id, sessionId, {
        ipAddress: clientInfo?.ipAddress,
        userAgent: clientInfo?.userAgent,
        deviceInfo
      });

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      await this.logSecurityEvent({
        type: SecurityEventType.LOGIN_SUCCESS,
        userId: user.id,
        organizationId: user.organizationId,
        details: { email },
        ipAddress: clientInfo?.ipAddress,
        userAgent: clientInfo?.userAgent
      });

      return {
        user: this.mapUserToUserInfo(user),
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpirationSeconds(rememberMe),
        tokenType: 'Bearer'
      };

    } catch (error) {
      if (error.message !== AuthErrorCode.INVALID_CREDENTIALS) {
        await this.logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILED,
          details: { email, error: error.message },
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent
        });
      }
      throw error;
    }
  }

  // ================================================================
  // TOKEN MANAGEMENT
  // ================================================================

  async generateTokens(
    user: any,
    sessionId: string,
    rememberMe: boolean = false
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = generateJwtId();
    const refreshJti = generateJwtId();
    const tokenFamily = generateSecureToken(16);

    const accessTokenPayload: JWTPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.getTokenExpirationSeconds(rememberMe),
      jti
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      sub: user.id,
      sessionId,
      tokenFamily,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.getRefreshTokenExpirationSeconds(rememberMe),
      jti: refreshJti
    };

    const accessToken = this.signToken(accessTokenPayload);
    const refreshToken = this.signRefreshToken(refreshTokenPayload);

    // Store refresh token info
    await this.storeRefreshToken(user.id, refreshJti, tokenFamily, rememberMe);

    return { accessToken, refreshToken };
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const payload = this.verifyRefreshToken(request.refreshToken);

      // Check if refresh token is blacklisted
      if (await this.isTokenBlacklisted(payload.jti)) {
        throw new Error(AuthErrorCode.TOKEN_BLACKLISTED);
      }

      // Get user and session
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { organization: true }
      });

      if (!user || !user.isActive) {
        throw new Error(AuthErrorCode.TOKEN_INVALID);
      }

      // Validate session
      const session = await this.getSession(payload.sessionId);
      if (!session || !session.isActive) {
        throw new Error(AuthErrorCode.TOKEN_INVALID);
      }

      // Check token family for rotation
      const refreshTokenRecord = await this.getRefreshToken(payload.jti);
      if (!refreshTokenRecord || refreshTokenRecord.tokenFamily !== payload.tokenFamily) {
        // Possible token theft - blacklist all tokens for this user
        await this.blacklistAllUserTokens(user.id, 'Refresh token family mismatch');
        throw new Error(AuthErrorCode.TOKEN_INVALID);
      }

      // Blacklist old refresh token
      await this.blacklistToken(payload.jti, 'refresh', 'Token refreshed');

      // Generate new tokens
      const { accessToken, refreshToken } = await this.generateTokens(user, payload.sessionId);

      return {
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpirationSeconds(),
        tokenType: 'Bearer'
      };

    } catch (error) {
      throw new Error(AuthErrorCode.TOKEN_INVALID);
    }
  }

  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      const payload = this.verifyToken(token) as JWTPayload;

      // Check if token is blacklisted
      if (await this.isTokenBlacklisted(payload.jti)) {
        return {
          isValid: false,
          error: AuthErrorCode.TOKEN_BLACKLISTED,
          isBlacklisted: true
        };
      }

      // Check if user and session are still valid
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub }
      });

      if (!user || !user.isActive) {
        return {
          isValid: false,
          error: AuthErrorCode.TOKEN_INVALID
        };
      }

      const session = await this.getSession(payload.sessionId);
      if (!session || !session.isActive) {
        return {
          isValid: false,
          error: AuthErrorCode.TOKEN_INVALID
        };
      }

      return {
        isValid: true,
        payload
      };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          isValid: false,
          error: AuthErrorCode.TOKEN_EXPIRED,
          isExpired: true
        };
      }

      return {
        isValid: false,
        error: AuthErrorCode.TOKEN_INVALID
      };
    }
  }

  // ================================================================
  // LOGOUT AND SESSION MANAGEMENT
  // ================================================================

  async logout(userId: string, sessionId?: string): Promise<void> {
    try {
      if (sessionId) {
        // Logout specific session
        await this.deactivateSession(sessionId);
        await this.blacklistSessionTokens(sessionId, 'User logout');
      } else {
        // Logout all sessions
        await this.deactivateAllUserSessions(userId);
        await this.blacklistAllUserTokens(userId, 'User logout all sessions');
      }

      await this.logSecurityEvent({
        type: SecurityEventType.LOGOUT,
        userId,
        details: { sessionId, logoutType: sessionId ? 'single' : 'all' }
      });

    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    // Implementation would fetch from database
    // This is a simplified version
    return [];
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.deactivateSession(sessionId);
    await this.blacklistSessionTokens(sessionId, 'Session revoked by user');

    await this.logSecurityEvent({
      type: SecurityEventType.LOGOUT,
      userId,
      details: { sessionId, revokedByUser: true }
    });
  }

  // ================================================================
  // ORGANIZATION MANAGEMENT
  // ================================================================

  async switchOrganization(userId: string, organizationSlug: string): Promise<any> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug: organizationSlug }
    });

    if (!organization) {
      throw new Error(AuthErrorCode.ORGANIZATION_NOT_FOUND);
    }

    // Check if user has access to this organization
    const userOrg = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: organization.id
      }
    });

    if (!userOrg) {
      throw new Error(AuthErrorCode.INSUFFICIENT_PERMISSIONS);
    }

    await this.logSecurityEvent({
      type: SecurityEventType.ORGANIZATION_SWITCHED,
      userId,
      organizationId: organization.id,
      details: { organizationSlug }
    });

    return organization;
  }

  async getUserOrganizations(userId: string): Promise<OrganizationInfo[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) {
      return [];
    }

    return [{
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
      role: user.role,
      isActive: user.organization.isActive
    }];
  }

  // ================================================================
  // PRIVATE HELPER METHODS
  // ================================================================

  private signToken(payload: JWTPayload): string {
    const algorithm = this.config.config.jwt.algorithm;
    const secret = algorithm === 'RS256' ? this.config.jwtPrivateKey! : this.config.jwtSecret;

    return jwt.sign(payload, secret, {
      algorithm,
      issuer: this.config.config.jwt.issuer,
      audience: this.config.config.jwt.audience
    });
  }

  private signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, this.config.refreshTokenSecret, {
      algorithm: 'HS256',
      expiresIn: this.config.config.jwt.refreshTokenExpiresIn
    });
  }

  private verifyToken(token: string): JWTPayload {
    const algorithm = this.config.config.jwt.algorithm;
    const secret = algorithm === 'RS256' ? this.config.jwtPublicKey! : this.config.jwtSecret;

    return jwt.verify(token, secret, {
      algorithms: [algorithm],
      issuer: this.config.config.jwt.issuer,
      audience: this.config.config.jwt.audience
    }) as JWTPayload;
  }

  private verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, this.config.refreshTokenSecret, {
      algorithms: ['HS256']
    }) as RefreshTokenPayload;
  }

  private getTokenExpirationSeconds(rememberMe: boolean = false): number {
    const duration = rememberMe ? '30d' : this.config.config.jwt.accessTokenExpiresIn;
    return this.parseDurationToSeconds(duration);
  }

  private getRefreshTokenExpirationSeconds(rememberMe: boolean = false): number {
    const duration = rememberMe ? '90d' : this.config.config.jwt.refreshTokenExpiresIn;
    return this.parseDurationToSeconds(duration);
  }

  private parseDurationToSeconds(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }

  private mapUserToUserInfo(user: any): UserInfo {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      twoFactorEnabled: user.twoFactorEnabled || false,
      currentOrganization: user.organization ? {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        role: user.role,
        isActive: user.organization.isActive
      } : undefined
    };
  }

  private parseDeviceInfo(userAgent?: string): DeviceInfo {
    if (!userAgent) {
      return { type: 'unknown' };
    }

    // Simple device detection - in production, use a proper library
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Tablet/.test(userAgent);

    return {
      type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
      os: this.extractOS(userAgent),
      browser: this.extractBrowser(userAgent)
    };
  }

  private extractOS(userAgent: string): string {
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac OS/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iOS/.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private extractBrowser(userAgent: string): string {
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  // ================================================================
  // ACCOUNT LOCKOUT METHODS
  // ================================================================

  private async checkAccountLockout(userId: string): Promise<any> {
    // Implement account lockout checking logic
    // This would query the database for failed login attempts
    return { isLocked: false, failedAttempts: 0 };
  }

  private async recordFailedLoginAttempt(userId: string): Promise<void> {
    // Implement failed login attempt recording
  }

  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    // Implement reset of failed login attempts
  }

  // ================================================================
  // TOKEN BLACKLIST METHODS
  // ================================================================

  private async loadTokenBlacklist(): Promise<void> {
    if (this.redis) {
      try {
        const blacklistedTokens = await this.redis.smembers('auth:blacklist');
        this.tokenBlacklist = new Set(blacklistedTokens);
      } catch (error) {
        console.error('Failed to load token blacklist from Redis:', error);
      }
    }
  }

  private async isTokenBlacklisted(jti: string): Promise<boolean> {
    if (this.redis) {
      return await this.redis.sismember('auth:blacklist', jti) === 1;
    }
    return this.tokenBlacklist.has(jti);
  }

  private async blacklistToken(jti: string, tokenType: 'access' | 'refresh', reason: string): Promise<void> {
    if (this.redis) {
      await this.redis.sadd('auth:blacklist', jti);
      await this.redis.expire('auth:blacklist', 86400 * 7); // 7 days
    } else {
      this.tokenBlacklist.add(jti);
    }

    await this.logSecurityEvent({
      type: SecurityEventType.TOKEN_BLACKLISTED,
      details: { jti, tokenType, reason }
    });
  }

  private async blacklistAllUserTokens(userId: string, reason: string): Promise<void> {
    // Implementation would blacklist all active tokens for a user
  }

  private async blacklistSessionTokens(sessionId: string, reason: string): Promise<void> {
    // Implementation would blacklist all tokens for a specific session
  }

  // ================================================================
  // SESSION MANAGEMENT METHODS
  // ================================================================

  private async createSession(userId: string, sessionId: string, metadata: any): Promise<void> {
    // Implementation would create session record in database
  }

  private async getSession(sessionId: string): Promise<SessionInfo | null> {
    // Implementation would fetch session from database
    return null;
  }

  private async deactivateSession(sessionId: string): Promise<void> {
    // Implementation would deactivate session in database
  }

  private async deactivateAllUserSessions(userId: string): Promise<void> {
    // Implementation would deactivate all user sessions
  }

  private async storeRefreshToken(userId: string, jti: string, tokenFamily: string, rememberMe: boolean): Promise<void> {
    // Implementation would store refresh token info
  }

  private async getRefreshToken(jti: string): Promise<any> {
    // Implementation would fetch refresh token record
    return null;
  }

  // ================================================================
  // TWO-FACTOR AUTHENTICATION METHODS
  // ================================================================

  private async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    // Implementation would verify 2FA code
    return true;
  }

  // ================================================================
  // INVITE TOKEN METHODS
  // ================================================================

  private async validateInviteToken(token: string): Promise<any> {
    // Implementation would validate invite token
    throw new Error(AuthErrorCode.INVITE_TOKEN_INVALID);
  }

  private async markInviteAsUsed(token: string, userId: string): Promise<void> {
    // Implementation would mark invite as used
  }

  // ================================================================
  // EMAIL VERIFICATION METHODS
  // ================================================================

  private async generateEmailVerificationToken(userId: string, email: string): Promise<void> {
    // Implementation would generate and send email verification token
  }

  // ================================================================
  // SECURITY EVENT LOGGING
  // ================================================================

  private async logSecurityEvent(event: Partial<SecurityEvent>): Promise<void> {
    if (this.eventStore) {
      try {
        await this.eventStore.append(
          event.organizationId || 'system',
          event.userId || 'anonymous',
          'SecurityEvent',
          event.type!,
          {
            ...event.details,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent
          },
          {
            userId: event.userId,
            timestamp: new Date()
          }
        );
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    }
  }
}

// ================================================================
// FACTORY FUNCTION
// ================================================================

export function createAuthService(
  prisma: PrismaClient,
  config: AuthServiceConfig
): AuthService {
  return new AuthService(prisma, config);
}

export default AuthService;