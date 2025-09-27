import express from 'express';
import { PrismaClient } from '@prisma/client';
import { EventStore, EventStoreFactory } from '../services/event-store';
import { createAuthRoutes } from '../routers/auth';
import { getAuthConfig, validateAuthEnvironment } from '../config/auth-config';
import { createAuthAuditService } from '../services/auth-audit-service';
import {
  createAuthenticationMiddleware,
  requireRole,
  securityHeaders,
  createCorsMiddleware
} from '../middleware/auth-middleware';
import { UserRole } from '../types/auth-types';

// ================================================================
// AUTHENTICATION SYSTEM INTEGRATION EXAMPLE
// ================================================================

export async function setupAuthenticationSystem() {
  // Validate environment variables
  const envValidation = validateAuthEnvironment();
  if (!envValidation.isValid) {
    console.error('Missing required environment variables:', envValidation.missingVars);
    process.exit(1);
  }

  // Log warnings for optional variables
  envValidation.warnings.forEach(warning => {
    console.warn(`Warning: ${warning}`);
  });

  // Initialize database
  const prisma = new PrismaClient();

  // Initialize event store
  const eventStore = EventStoreFactory.create(prisma, {
    enableRedis: process.env.REDIS_URL ? true : false,
    redisConfig: process.env.REDIS_URL ? {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    } : undefined
  });

  // Get auth configuration based on environment
  const authConfig = getAuthConfig(process.env.NODE_ENV || 'development');

  // Create auth routes and services
  const { expressRouter: authRouter, authService } = createAuthRoutes(
    prisma,
    authConfig,
    eventStore
  );

  // Create audit service
  const auditService = createAuthAuditService(eventStore);

  // Create Express app
  const app = express();

  // ================================================================
  // GLOBAL MIDDLEWARE
  // ================================================================

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Security headers
  app.use(securityHeaders());

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  app.use(createCorsMiddleware(allowedOrigins));

  // ================================================================
  // AUTHENTICATION ROUTES
  // ================================================================

  // Mount auth routes
  app.use('/auth', authRouter);

  // ================================================================
  // PROTECTED API ROUTES
  // ================================================================

  // Create authentication middleware for protected routes
  const authMiddleware = createAuthenticationMiddleware({
    authService,
    prisma,
    eventStore
  });

  // Apply authentication to all API routes
  app.use('/api', authMiddleware);

  // Example protected routes with role-based access
  app.get('/api/admin/users',
    requireRole([UserRole.ADMIN]),
    async (req, res) => {
      // Admin-only endpoint
      const users = await prisma.user.findMany({
        where: { organizationId: req.organization!.organizationId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true
        }
      });

      res.json({ users });
    }
  );

  app.get('/api/tournaments', async (req, res) => {
    // Any authenticated user can view tournaments
    const tournaments = await prisma.tournament.findMany({
      where: { organizationId: req.organization!.organizationId },
      include: {
        creator: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.json({ tournaments });
  });

  app.post('/api/tournaments',
    requireRole([UserRole.ADMIN, UserRole.MANAGER]),
    async (req, res) => {
      // Only admins and managers can create tournaments
      const tournament = await prisma.tournament.create({
        data: {
          ...req.body,
          organizationId: req.organization!.organizationId,
          createdById: req.user!.id
        }
      });

      // Log tournament creation event
      await eventStore.append(
        req.organization!.organizationId,
        tournament.id,
        'Tournament',
        'TournamentCreated',
        {
          tournamentId: tournament.id,
          name: tournament.name,
          createdBy: req.user!.id
        },
        {
          userId: req.user!.id,
          timestamp: new Date()
        }
      );

      res.status(201).json({ tournament });
    }
  );

  // ================================================================
  // SECURITY MONITORING ENDPOINTS
  // ================================================================

  app.get('/api/admin/security/events',
    requireRole([UserRole.ADMIN]),
    async (req, res) => {
      const events = await auditService.getOrganizationSecurityEvents(
        req.organization!.organizationId,
        {
          limit: parseInt(req.query.limit as string) || 100
        }
      );

      res.json({ events });
    }
  );

  app.get('/api/admin/security/summary',
    requireRole([UserRole.ADMIN]),
    async (req, res) => {
      const summary = await auditService.getSuspiciousActivitySummary(
        req.organization!.organizationId
      );

      res.json({ summary });
    }
  );

  // ================================================================
  // SESSION MANAGEMENT ENDPOINTS
  // ================================================================

  app.get('/api/user/sessions', async (req, res) => {
    const sessions = await authService.getUserSessions(req.user!.id);
    res.json({ sessions });
  });

  app.delete('/api/user/sessions/:sessionId', async (req, res) => {
    await authService.revokeSession(req.user!.id, req.params.sessionId);
    res.json({ success: true });
  });

  // ================================================================
  // HEALTH CHECK ENDPOINT
  // ================================================================

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      features: {
        authentication: true,
        eventStore: true,
        auditLogging: true,
        multiTenant: true
      }
    });
  });

  // ================================================================
  // ERROR HANDLING
  // ================================================================

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Application error:', err);

    // Log security-related errors
    if (err.name === 'UnauthorizedError' || err.status === 401) {
      auditService.logSuspiciousActivity(
        req.organization?.organizationId || 'unknown',
        {
          activityType: 'suspicious_activity',
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { error: err.message }
        }
      );
    }

    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      timestamp: new Date().toISOString()
    });
  });

  // ================================================================
  // GRACEFUL SHUTDOWN
  // ================================================================

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, starting graceful shutdown...');

    try {
      await eventStore.disconnect();
      await prisma.$disconnect();
      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, starting graceful shutdown...');

    try {
      await eventStore.disconnect();
      await prisma.$disconnect();
      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  return {
    app,
    prisma,
    eventStore,
    authService,
    auditService
  };
}

// ================================================================
// WEBSOCKET AUTHENTICATION INTEGRATION
// ================================================================

export function setupWebSocketAuthentication(io: any, authService: any) {
  // WebSocket authentication middleware
  io.use(async (socket: any, next: any) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const validation = await authService.validateAccessToken(token);
      if (!validation.isValid) {
        return next(new Error('Invalid or expired token'));
      }

      // Attach user info to socket
      socket.user = validation.payload;
      socket.organizationId = validation.payload!.organizationId;

      // Join organization room for multi-tenant isolation
      socket.join(`org:${validation.payload!.organizationId}`);

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Handle WebSocket connections
  io.on('connection', (socket: any) => {
    console.log(`User ${socket.user.sub} connected to organization ${socket.organizationId}`);

    // Handle tournament events
    socket.on('join_tournament', (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
    });

    socket.on('leave_tournament', (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.sub} disconnected`);
    });
  });

  return io;
}

// ================================================================
// EXAMPLE USAGE
// ================================================================

if (require.main === module) {
  setupAuthenticationSystem()
    .then(({ app }) => {
      const port = process.env.PORT || 3001;
      app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`🔒 Authentication system enabled`);
        console.log(`📊 Event store and audit logging active`);
        console.log(`🏢 Multi-tenant support enabled`);
      });
    })
    .catch(error => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

export default setupAuthenticationSystem;