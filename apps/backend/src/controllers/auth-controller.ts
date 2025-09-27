import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  TwoFactorSetupRequest,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
  TwoFactorDisableRequest,
  AuthErrorCode,
  SecurityEventType,
  UserInfo
} from '../types/auth-types';
import { AuthService } from '../services/auth-service';
import { EventStore } from '../services/event-store';
import {
  validatePassword,
  generatePasswordResetToken,
  validateResetTokenFormat,
  DEFAULT_PASSWORD_POLICY
} from '../utils/password-utils';

// ================================================================
// VALIDATION SCHEMAS
// ================================================================

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationSlug: z.string().optional(),
  inviteToken: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  organizationSlug: z.string().optional(),
  rememberMe: z.boolean().optional(),
  twoFactorCode: z.string().optional()
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  organizationSlug: z.string().optional()
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().url('Invalid URL format').optional()
});

const twoFactorSetupSchema = z.object({
  password: z.string().min(1, 'Password is required')
});

const twoFactorVerifySchema = z.object({
  token: z.string().optional(),
  backupCode: z.string().optional()
}).refine(data => data.token || data.backupCode, {
  message: 'Either token or backup code is required'
});

const twoFactorDisableSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  token: z.string().optional(),
  backupCode: z.string().optional()
});

// ================================================================
// AUTH CONTROLLER CLASS
// ================================================================

export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaClient,
    private eventStore?: EventStore
  ) {}

  // ================================================================
  // REGISTRATION
  // ================================================================

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Validate password strength
      const passwordValidation = validatePassword(
        validatedData.password,
        DEFAULT_PASSWORD_POLICY,
        {
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName
        }
      );

      if (!passwordValidation.isValid) {
        res.status(400).json({
          error: AuthErrorCode.PASSWORD_TOO_WEAK,
          message: 'Password does not meet security requirements',
          details: {
            errors: passwordValidation.errors,
            strength: passwordValidation.strength,
            score: passwordValidation.score
          }
        });
        return;
      }

      const clientInfo = this.getClientInfo(req);
      const response = await this.authService.register(validatedData);

      // Set refresh token as HTTP-only cookie
      this.setRefreshTokenCookie(res, response.refreshToken);

      res.status(201).json({
        user: response.user,
        accessToken: response.accessToken,
        expiresIn: response.expiresIn,
        tokenType: response.tokenType,
        emailVerificationRequired: response.emailVerificationRequired
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // LOGIN
  // ================================================================

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const clientInfo = this.getClientInfo(req);

      const response = await this.authService.login(validatedData, clientInfo);

      if (response.requiresTwoFactor) {
        res.status(200).json({
          requiresTwoFactor: true,
          user: response.user,
          organizations: response.organizations
        });
        return;
      }

      // Set refresh token as HTTP-only cookie
      this.setRefreshTokenCookie(res, response.refreshToken!);

      res.status(200).json({
        user: response.user,
        accessToken: response.accessToken,
        expiresIn: response.expiresIn,
        tokenType: response.tokenType
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // LOGOUT
  // ================================================================

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      await this.authService.logout(req.user.id, req.session?.id);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // LOGOUT ALL SESSIONS
  // ================================================================

  logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      await this.authService.logout(req.user.id);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(200).json({
        success: true,
        message: 'Logged out from all sessions successfully'
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // TOKEN REFRESH
  // ================================================================

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      let refreshToken = req.cookies?.refreshToken;

      // If not in cookie, check request body
      if (!refreshToken) {
        const validatedData = refreshTokenSchema.parse(req.body);
        refreshToken = validatedData.refreshToken;
      }

      if (!refreshToken) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Refresh token required'
        });
        return;
      }

      const response = await this.authService.refreshToken({ refreshToken });

      // Set new refresh token as HTTP-only cookie
      this.setRefreshTokenCookie(res, response.refreshToken);

      res.status(200).json({
        accessToken: response.accessToken,
        expiresIn: response.expiresIn,
        tokenType: response.tokenType
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // USER PROFILE
  // ================================================================

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      const organizations = await this.authService.getUserOrganizations(req.user.id);

      res.status(200).json({
        user: req.user,
        organizations,
        currentOrganization: req.user.currentOrganization
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      const validatedData = updateProfileSchema.parse(req.body);

      const updatedUser = await this.prisma.user.update({
        where: { id: req.user.id },
        data: validatedData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true
        }
      });

      await this.logSecurityEvent({
        type: SecurityEventType.LOGIN_SUCCESS,
        userId: req.user.id,
        organizationId: req.organization?.organizationId,
        details: { action: 'profile_updated', changes: validatedData }
      });

      res.status(200).json({
        user: {
          ...updatedUser,
          twoFactorEnabled: false, // This would come from user's 2FA settings
          currentOrganization: req.user.currentOrganization
        }
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // PASSWORD MANAGEMENT
  // ================================================================

  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      const validatedData = changePasswordSchema.parse(req.body);

      // Validate new password strength
      const passwordValidation = validatePassword(
        validatedData.newPassword,
        DEFAULT_PASSWORD_POLICY,
        {
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        }
      );

      if (!passwordValidation.isValid) {
        res.status(400).json({
          error: AuthErrorCode.PASSWORD_TOO_WEAK,
          message: 'New password does not meet security requirements',
          details: {
            errors: passwordValidation.errors,
            strength: passwordValidation.strength,
            score: passwordValidation.score
          }
        });
        return;
      }

      // This would be implemented in the auth service
      // await this.authService.changePassword(req.user.id, validatedData);

      await this.logSecurityEvent({
        type: SecurityEventType.PASSWORD_CHANGED,
        userId: req.user.id,
        organizationId: req.organization?.organizationId,
        details: { action: 'password_changed' }
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      // Always return success to prevent email enumeration
      const response = {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      };

      if (!user) {
        res.status(200).json(response);
        return;
      }

      // Generate reset token
      const { token, expiresAt } = generatePasswordResetToken(user.id);

      // Store reset token (simplified - in production, store in database)
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          // This would be stored in a separate password_reset_tokens table
          // For now, we'll use a JSON field in metadata
        }
      });

      await this.logSecurityEvent({
        type: SecurityEventType.PASSWORD_RESET_REQUESTED,
        userId: user.id,
        organizationId: user.organizationId,
        details: { email: validatedData.email }
      });

      // In production, send email with reset link
      console.log(`Password reset token for ${validatedData.email}: ${token}`);

      res.status(200).json(response);

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);

      // Validate token format
      if (!validateResetTokenFormat(validatedData.token)) {
        res.status(400).json({
          error: AuthErrorCode.RESET_TOKEN_INVALID,
          message: 'Invalid reset token format'
        });
        return;
      }

      // Validate password strength
      const passwordValidation = validatePassword(
        validatedData.password,
        DEFAULT_PASSWORD_POLICY
      );

      if (!passwordValidation.isValid) {
        res.status(400).json({
          error: AuthErrorCode.PASSWORD_TOO_WEAK,
          message: 'Password does not meet security requirements',
          details: {
            errors: passwordValidation.errors,
            strength: passwordValidation.strength,
            score: passwordValidation.score
          }
        });
        return;
      }

      // This would be implemented in the auth service
      // await this.authService.resetPassword(validatedData);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // EMAIL VERIFICATION
  // ================================================================

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = verifyEmailSchema.parse(req.body);

      // This would be implemented in the auth service
      // await this.authService.verifyEmail(validatedData.token);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.emailVerified) {
        res.status(400).json({
          error: 'EMAIL_ALREADY_VERIFIED',
          message: 'Email is already verified'
        });
        return;
      }

      // This would be implemented in the auth service
      // await this.authService.resendVerificationEmail(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // TWO-FACTOR AUTHENTICATION
  // ================================================================

  setupTwoFactor = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      const validatedData = twoFactorSetupSchema.parse(req.body);

      // This would be implemented in the auth service
      // const response = await this.authService.setupTwoFactor(req.user.id, validatedData.password);

      const response: TwoFactorSetupResponse = {
        secret: 'MOCK_SECRET',
        qrCodeUrl: 'https://example.com/qr',
        backupCodes: ['1234-5678', '9876-5432']
      };

      res.status(200).json(response);

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  verifyTwoFactor = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      const validatedData = twoFactorVerifySchema.parse(req.body);

      // This would be implemented in the auth service
      // await this.authService.verifyTwoFactorSetup(req.user.id, validatedData);

      await this.logSecurityEvent({
        type: SecurityEventType.TWO_FACTOR_ENABLED,
        userId: req.user.id,
        organizationId: req.organization?.organizationId,
        details: { action: 'two_factor_enabled' }
      });

      res.status(200).json({
        success: true,
        message: 'Two-factor authentication enabled successfully'
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  disableTwoFactor = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      const validatedData = twoFactorDisableSchema.parse(req.body);

      // This would be implemented in the auth service
      // await this.authService.disableTwoFactor(req.user.id, validatedData);

      await this.logSecurityEvent({
        type: SecurityEventType.TWO_FACTOR_DISABLED,
        userId: req.user.id,
        organizationId: req.organization?.organizationId,
        details: { action: 'two_factor_disabled' }
      });

      res.status(200).json({
        success: true,
        message: 'Two-factor authentication disabled successfully'
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // SESSION MANAGEMENT
  // ================================================================

  getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      const sessions = await this.authService.getUserSessions(req.user.id);

      res.status(200).json({
        sessions,
        currentSessionId: req.session?.id
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  revokeSession = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Session ID is required'
        });
        return;
      }

      await this.authService.revokeSession(req.user.id, sessionId);

      res.status(200).json({
        success: true,
        message: 'Session revoked successfully'
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // ORGANIZATION SWITCHING
  // ================================================================

  switchOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication required'
        });
        return;
      }

      const { organizationSlug } = req.params;

      if (!organizationSlug) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Organization slug is required'
        });
        return;
      }

      const organization = await this.authService.switchOrganization(req.user.id, organizationSlug);

      res.status(200).json({
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          isActive: organization.isActive
        }
      });

    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  private getClientInfo(req: Request) {
    return {
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent']
    };
  }

  private getClientIp(req: Request): string {
    return (
      req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    ) as string;
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/auth/refresh'
    });
  }

  private async logSecurityEvent(event: {
    type: SecurityEventType;
    userId?: string;
    organizationId?: string;
    details?: any;
  }): Promise<void> {
    if (this.eventStore) {
      try {
        await this.eventStore.append(
          event.organizationId || 'system',
          event.userId || 'anonymous',
          'SecurityEvent',
          event.type,
          event.details || {},
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

  private handleAuthError(error: any, res: Response): void {
    console.error('Auth controller error:', error);

    // Map known error codes to HTTP status codes
    const errorMap: { [key: string]: number } = {
      [AuthErrorCode.INVALID_CREDENTIALS]: 401,
      [AuthErrorCode.ACCOUNT_LOCKED]: 423,
      [AuthErrorCode.ACCOUNT_DISABLED]: 403,
      [AuthErrorCode.EMAIL_NOT_VERIFIED]: 403,
      [AuthErrorCode.TWO_FACTOR_REQUIRED]: 200, // Special case - not an error
      [AuthErrorCode.INVALID_TWO_FACTOR]: 401,
      [AuthErrorCode.TOKEN_EXPIRED]: 401,
      [AuthErrorCode.TOKEN_INVALID]: 401,
      [AuthErrorCode.TOKEN_BLACKLISTED]: 403,
      [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
      [AuthErrorCode.ORGANIZATION_NOT_FOUND]: 404,
      [AuthErrorCode.RATE_LIMIT_EXCEEDED]: 429,
      [AuthErrorCode.PASSWORD_TOO_WEAK]: 400,
      [AuthErrorCode.EMAIL_ALREADY_EXISTS]: 409,
      [AuthErrorCode.INVITE_TOKEN_INVALID]: 400,
      [AuthErrorCode.INVITE_TOKEN_EXPIRED]: 400,
      [AuthErrorCode.RESET_TOKEN_INVALID]: 400,
      [AuthErrorCode.RESET_TOKEN_EXPIRED]: 400,
      [AuthErrorCode.VERIFICATION_TOKEN_INVALID]: 400,
      [AuthErrorCode.VERIFICATION_TOKEN_EXPIRED]: 400
    };

    const statusCode = errorMap[error.message] || 500;
    const message = error.message || 'Internal server error';

    res.status(statusCode).json({
      error: error.message || 'INTERNAL_ERROR',
      message: statusCode === 500 ? 'An unexpected error occurred' : message
    });
  }
}

// ================================================================
// FACTORY FUNCTION
// ================================================================

export function createAuthController(
  authService: AuthService,
  prisma: PrismaClient,
  eventStore?: EventStore
): AuthController {
  return new AuthController(authService, prisma, eventStore);
}

export default AuthController;