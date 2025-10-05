import { Router } from 'express';
import { router, publicProcedure, protectedProcedure } from '../utils/trpc';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import { AuthController, createAuthController } from '../controllers/auth-controller';
import { AuthService, createAuthService } from '../services/auth-service';
import { EventStore } from '../services/event-store';
import { PrismaClient } from '@prisma/client';
import {
  createAuthenticationMiddleware,
  requireRole,
  requirePermission,
  createRateLimitMiddleware,
  securityHeaders,
  createCorsMiddleware,
  validateSession,
  createAuditLogMiddleware,
  RATE_LIMITS
} from '../middleware/auth-middleware';
import { AuthConfig, UserRole, AuthAction, AuthResource } from '../types/auth-types';

// ================================================================
// EXPRESS ROUTER FOR REST API ENDPOINTS
// ================================================================

export function createAuthExpressRouter(
  authService: AuthService,
  prisma: PrismaClient,
  eventStore?: EventStore
): Router {
  const router = Router();
  const authController = createAuthController(authService, prisma, eventStore);

  // Apply security headers to all routes
  router.use(securityHeaders());

  // Apply CORS for auth routes
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3005'];
  router.use(createCorsMiddleware(allowedOrigins));

  // Apply rate limiting
  router.use('/login', createRateLimitMiddleware(RATE_LIMITS.auth));
  router.use('/register', createRateLimitMiddleware(RATE_LIMITS.registration));
  router.use('/forgot-password', createRateLimitMiddleware(RATE_LIMITS.passwordReset));
  router.use('/reset-password', createRateLimitMiddleware(RATE_LIMITS.passwordReset));

  // Apply audit logging
  if (eventStore) {
    router.use(createAuditLogMiddleware(eventStore));
  }

  // Create authentication middleware
  const authMiddleware = createAuthenticationMiddleware({
    authService,
    prisma,
    eventStore,
    skipPaths: ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
  });

  // ================================================================
  // PUBLIC ROUTES (No authentication required)
  // ================================================================

  // User registration
  router.post('/register', authController.register);

  // User login
  router.post('/login', authController.login);

  // Password reset request
  router.post('/forgot-password', authController.forgotPassword);

  // Password reset completion
  router.post('/reset-password', authController.resetPassword);

  // Email verification
  router.post('/verify-email', authController.verifyEmail);

  // Token refresh
  router.post('/refresh', authController.refreshToken);

  // ================================================================
  // PROTECTED ROUTES (Authentication required)
  // ================================================================

  // Apply authentication middleware for protected routes
  router.use(authMiddleware);
  router.use(validateSession());

  // User logout
  router.post('/logout', authController.logout);

  // Logout from all sessions
  router.post('/logout-all', authController.logoutAll);

  // Get user profile
  router.get('/profile', authController.getProfile);

  // Update user profile
  router.put('/profile', authController.updateProfile);

  // Change password
  router.post('/change-password', authController.changePassword);

  // Resend verification email
  router.post('/resend-verification', authController.resendVerificationEmail);

  // ================================================================
  // TWO-FACTOR AUTHENTICATION ROUTES
  // ================================================================

  // Setup 2FA
  router.post('/2fa/setup', authController.setupTwoFactor);

  // Verify 2FA setup
  router.post('/2fa/verify', authController.verifyTwoFactor);

  // Disable 2FA
  router.post('/2fa/disable', authController.disableTwoFactor);

  // ================================================================
  // SESSION MANAGEMENT ROUTES
  // ================================================================

  // Get user sessions
  router.get('/sessions', authController.getSessions);

  // Revoke specific session
  router.delete('/sessions/:sessionId', authController.revokeSession);

  // ================================================================
  // ORGANIZATION MANAGEMENT ROUTES
  // ================================================================

  // Switch organization context
  router.post('/organization/:organizationSlug/switch', authController.switchOrganization);

  // ================================================================
  // ADMIN ROUTES (Admin role required)
  // ================================================================

  // Admin-only routes with role-based access
  router.use('/admin', requireRole([UserRole.ADMIN]));

  // Get all users (admin only)
  router.get('/admin/users', requirePermission(AuthResource.USER, AuthAction.READ), (req, res) => {
    res.json({ message: 'Admin users endpoint - not implemented yet' });
  });

  // Lock/unlock user account (admin only)
  router.post('/admin/users/:userId/lock', requirePermission(AuthResource.USER, AuthAction.MANAGE), (req, res) => {
    res.json({ message: 'Admin lock user endpoint - not implemented yet' });
  });

  return router;
}

// ================================================================
// TRPC ROUTER (Keep existing TRPC implementation for backward compatibility)
// ================================================================

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      organizationSlug: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { email, password, firstName, lastName, organizationSlug } = input;

      // Check if user exists
      const existing = await ctx.prisma.user.findUnique({
        where: { email }
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
        });
      }

      // Find organization
      let organizationId: string;
      if (organizationSlug) {
        const organization = await ctx.prisma.organization.findUnique({
          where: { slug: organizationSlug }
        });
        if (!organization) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Organization not found',
          });
        }
        organizationId = organization.id;
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization slug is required',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await ctx.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          organizationId,
          role: UserRole.PLAYER,
        },
        include: {
          organization: true
        }
      });

      // Create token with organization context
      const token = jwt.sign(
        {
          userId: user.id,
          organizationId: user.organizationId,
          role: user.role
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug
          }
        },
        token,
      };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
      organizationSlug: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { email, password, organizationSlug } = input;

      // Find user
      const user = await ctx.prisma.user.findUnique({
        where: { email },
        include: { organization: true }
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Check password
      const valid = await bcrypt.compare(password, user.passwordHash || '');
      if (!valid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Account is deactivated',
        });
      }

      // Check organization context
      if (organizationSlug && user.organization.slug !== organizationSlug) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid organization context',
        });
      }

      // Create token with organization context
      const token = jwt.sign(
        {
          userId: user.id,
          organizationId: user.organizationId,
          role: user.role
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Update last login
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug
          }
        },
        token,
      };
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      // This would integrate with the new auth service for proper session management
      return { success: true };
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: { organization: true }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          isActive: user.organization.isActive
        }
      };
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      avatarUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
      });

      return {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        avatarUrl: updated.avatarUrl,
      };
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      const { currentPassword, newPassword } = input;

      // Get user with password hash
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify current password
      const valid = await bcrypt.compare(currentPassword, user.passwordHash || '');
      if (!valid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { passwordHash },
      });

      return { success: true };
    }),
});

// ================================================================
// FACTORY FUNCTION
// ================================================================

export function createAuthRoutes(
  prisma: PrismaClient,
  authConfig: AuthConfig,
  eventStore?: EventStore
) {
  // Create auth service
  const authService = createAuthService(prisma, {
    jwtSecret: process.env.JWT_SECRET!,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
    pepper: process.env.PASSWORD_PEPPER,
    eventStore,
    config: authConfig
  });

  // Create Express router
  const expressRouter = createAuthExpressRouter(authService, prisma, eventStore);

  return {
    expressRouter,
    trpcRouter: authRouter,
    authService
  };
}