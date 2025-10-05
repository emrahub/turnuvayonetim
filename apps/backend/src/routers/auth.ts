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
import { AuthConfig } from '../types/auth-types';

// ================================================================
// EXPRESS ROUTER FOR REST API ENDPOINTS
// ================================================================

export function createAuthExpressRouter(
  authService: AuthService,
  authController: AuthController,
  config: AuthConfig,
  prisma: PrismaClient,
  eventStore?: EventStore
): Router {
  const router = Router();

  // Simple authentication middleware
  const authMiddleware = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // Public routes
  router.post('/login', authController.login);
  router.post('/register', authController.register);
  router.post('/refresh', authController.refreshToken);
  router.post('/forgot-password', authController.forgotPassword);
  router.post('/reset-password', authController.resetPassword);
  router.post('/verify-email', authController.verifyEmail);

  // Protected routes (require authentication)
  router.use(authMiddleware);

  router.post('/logout', authController.logout);
  router.get('/me', authController.getCurrentUser);
  router.post('/change-password', authController.changePassword);
  router.post('/2fa/setup', authController.setup2FA);
  router.post('/2fa/verify', authController.verify2FA);
  router.post('/2fa/disable', authController.disable2FA);

  return router;
}

// ================================================================
// TRPC ROUTER
// ================================================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
  organizationId: z.string().optional(),
});

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const { email, password, rememberMe } = input;

      // Find user
      const user = await ctx.prisma.user.findUnique({
        where: { email },
        include: {
          UserOrganization: {
            include: {
              Organization: true
            }
          }
        }
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Account is disabled',
        });
      }

      // Generate tokens
      const tokenExpiry = rememberMe ? '30d' : '24h';
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          organizationId: user.UserOrganization[0]?.organizationId
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: tokenExpiry }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '30d' }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          organization: user.UserOrganization[0]?.Organization
        },
        accessToken,
        refreshToken,
      };
    }),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { email, password, firstName, lastName, organizationId } = input;

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await ctx.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          isActive: true,
        },
      });

      // If organizationId provided, create association
      if (organizationId) {
        await ctx.prisma.userOrganization.create({
          data: {
            userId: user.id,
            organizationId,
            role: 'STAFF',
            isActive: true,
          },
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '30d' }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        accessToken,
        refreshToken,
      };
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      // In a real app, you might want to invalidate the token here
      // For now, the client will just remove the token
      return { success: true };
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: {
          UserOrganization: {
            include: {
              Organization: true
            }
          }
        }
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
        avatarUrl: user.avatarUrl,
        organization: user.UserOrganization[0]?.Organization
      };
    }),

  refreshToken: publicProcedure
    .input(z.object({
      refreshToken: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const decoded = jwt.verify(
          input.refreshToken,
          process.env.JWT_SECRET || 'fallback-secret'
        ) as any;

        const user = await ctx.prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            UserOrganization: {
              include: {
                Organization: true
              }
            }
          }
        });

        if (!user || !user.isActive) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          });
        }

        const accessToken = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            organizationId: user.UserOrganization[0]?.organizationId
          },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        );

        return {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            organization: user.UserOrganization[0]?.Organization
          }
        };
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        });
      }
    }),
});

export type AuthRouter = typeof authRouter;

// ================================================================
// CONVENIENCE EXPORTS
// ================================================================

export { createAuthController } from '../controllers/auth-controller';
export { createAuthService } from '../services/auth-service';