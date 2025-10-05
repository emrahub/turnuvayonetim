import { UserRole } from '@prisma/client';

// ================================================================
// JWT TYPES
// ================================================================

export interface JWTPayload {
  sub: string; // User ID
  email: string;
  organizationId: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
  jti: string; // JWT ID for blacklisting
}

export interface RefreshTokenPayload {
  sub: string; // User ID
  sessionId: string;
  tokenFamily: string; // For refresh token rotation
  iat: number;
  exp: number;
  jti: string;
}

// ================================================================
// AUTHENTICATION REQUEST/RESPONSE TYPES
// ================================================================

export interface LoginRequest {
  email: string;
  password: string;
  organizationSlug?: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface LoginResponse {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  requiresTwoFactor?: boolean;
  organizations?: OrganizationInfo[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationSlug?: string;
  inviteToken?: string;
}

export interface RegisterResponse {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  emailVerificationRequired: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface ForgotPasswordRequest {
  email: string;
  organizationSlug?: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

// ================================================================
// USER AND ORGANIZATION INFO
// ================================================================

export interface UserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  twoFactorEnabled: boolean;
  currentOrganization?: OrganizationInfo;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  role: UserRole;
  isActive: boolean;
}

// ================================================================
// SESSION MANAGEMENT
// ================================================================

export interface SessionInfo {
  id: string;
  userId: string;
  tokenFamily: string;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
  userAgent?: string;
  lastAccessedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os?: string;
  browser?: string;
  version?: string;
}

// ================================================================
// TWO-FACTOR AUTHENTICATION
// ================================================================

export interface TwoFactorSetupRequest {
  password: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  token: string;
  backupCode?: string;
}

export interface TwoFactorDisableRequest {
  password: string;
  token?: string;
  backupCode?: string;
}

// ================================================================
// SECURITY AND AUDIT
// ================================================================

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_LOCKED = 'LOGIN_LOCKED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
  TWO_FACTOR_FAILED = 'TWO_FACTOR_FAILED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  TOKEN_BLACKLISTED = 'TOKEN_BLACKLISTED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ORGANIZATION_SWITCHED = 'ORGANIZATION_SWITCHED'
}

export interface AccountLockInfo {
  isLocked: boolean;
  lockedAt?: Date;
  unlockAt?: Date;
  failedAttempts: number;
  lastFailedAt?: Date;
  lockReason?: string;
}

// ================================================================
// PERMISSIONS AND ROLES
// ================================================================

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  organizationId?: string;
}

export enum AuthAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  VIEW = 'view'
}

export enum AuthResource {
  USER = 'user',
  ORGANIZATION = 'organization',
  TOURNAMENT = 'tournament',
  PLAYER = 'player',
  TABLE = 'table',
  CLOCK = 'clock',
  PAYOUT = 'payout',
  SETTINGS = 'settings',
  AUDIT_LOG = 'audit_log'
}

// ================================================================
// RATE LIMITING
// ================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

// ================================================================
// TOKEN MANAGEMENT
// ================================================================

export interface TokenBlacklistEntry {
  jti: string;
  tokenType: 'access' | 'refresh';
  userId: string;
  organizationId: string;
  expiresAt: Date;
  blacklistedAt: Date;
  reason: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
  isBlacklisted?: boolean;
  isExpired?: boolean;
}

// ================================================================
// ORGANIZATION CONTEXT
// ================================================================

export interface OrganizationContext {
  organizationId: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
}

export interface AuthContext {
  user: UserInfo;
  organization: OrganizationContext;
  session: SessionInfo;
  permissions: Permission[];
  isAuthenticated: boolean;
}

// ================================================================
// EMAIL VERIFICATION
// ================================================================

export interface EmailVerificationToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
  usedAt?: Date;
}

// ================================================================
// INVITE SYSTEM
// ================================================================

export interface InviteToken {
  token: string;
  organizationId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
  usedAt?: Date;
  usedBy?: string;
}

// ================================================================
// API ERROR TYPES
// ================================================================

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  INVALID_TWO_FACTOR = 'INVALID_TWO_FACTOR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_BLACKLISTED = 'TOKEN_BLACKLISTED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVITE_TOKEN_INVALID = 'INVITE_TOKEN_INVALID',
  INVITE_TOKEN_EXPIRED = 'INVITE_TOKEN_EXPIRED',
  RESET_TOKEN_INVALID = 'RESET_TOKEN_INVALID',
  RESET_TOKEN_EXPIRED = 'RESET_TOKEN_EXPIRED',
  VERIFICATION_TOKEN_INVALID = 'VERIFICATION_TOKEN_INVALID',
  VERIFICATION_TOKEN_EXPIRED = 'VERIFICATION_TOKEN_EXPIRED'
}

// ================================================================
// CONFIGURATION TYPES
// ================================================================

export interface AuthConfig {
  jwt: {
    algorithm: 'RS256' | 'HS256';
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
    issuer: string;
    audience: string;
  };
  passwords: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // Days before password expires
  };
  sessions: {
    maxPerUser: number;
    absoluteTimeout: number; // Maximum session duration
    inactivityTimeout: number; // Session timeout due to inactivity
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number; // Minutes
    twoFactorRequired: boolean;
    emailVerificationRequired: boolean;
  };
  rateLimiting: {
    login: RateLimitConfig;
    registration: RateLimitConfig;
    passwordReset: RateLimitConfig;
    twoFactor: RateLimitConfig;
  };
}

// ================================================================
// EXPRESS REQUEST EXTENSIONS
// ================================================================

declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
      organization?: OrganizationContext;
      session?: SessionInfo;
      authContext?: AuthContext;
      rateLimitInfo?: RateLimitInfo;
    }
  }
}

// ================================================================
// EXPORTS
// ================================================================
// All types are already exported via their declarations above

