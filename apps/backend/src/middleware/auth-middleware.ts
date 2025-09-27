import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { PrismaClient, UserRole } from '@prisma/client';
import {
  AuthContext,
  OrganizationContext,
  UserInfo,
  SessionInfo,
  RateLimitConfig,
  Permission,
  AuthAction,
  AuthResource,
  AuthErrorCode,
  SecurityEventType
} from '../types/auth-types';
import { AuthService } from '../services/auth-service';
import { EventStore } from '../services/event-store';

// ================================================================
// MIDDLEWARE CONFIGURATION
// ================================================================

export interface AuthMiddlewareConfig {
  authService: AuthService;
  prisma: PrismaClient;
  eventStore?: EventStore;
  skipPaths?: string[];
  rateLimiting?: {
    [key: string]: RateLimitConfig;
  };
}

// ================================================================
// JWT AUTHENTICATION MIDDLEWARE
// ================================================================

export function createAuthenticationMiddleware(config: AuthMiddlewareConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip authentication for certain paths
      if (config.skipPaths?.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        return res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'Authentication token required'
        });
      }

      // Validate token
      const validation = await config.authService.validateAccessToken(token);
      if (!validation.isValid) {
        const statusCode = validation.isExpired ? 401 :
                          validation.isBlacklisted ? 403 : 401;

        return res.status(statusCode).json({
          error: validation.error,
          message: 'Invalid or expired token'
        });
      }

      const payload = validation.payload!;

      // Get user details
      const user = await config.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { organization: true }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          error: AuthErrorCode.TOKEN_INVALID,
          message: 'User not found or inactive'
        });
      }

      // Create auth context
      const authContext: AuthContext = {
        user: mapUserToUserInfo(user),
        organization: {
          organizationId: user.organizationId,
          role: user.role,
          permissions: await getPermissionsForRole(user.role),
          isActive: user.organization.isActive
        },
        session: {
          id: payload.sessionId,
          userId: user.id,
          tokenFamily: '',
          lastAccessedAt: new Date(),
          expiresAt: new Date(payload.exp * 1000),
          isActive: true
        },
        permissions: await getPermissionsForRole(user.role),
        isAuthenticated: true
      };

      // Attach to request
      req.user = authContext.user;
      req.organization = authContext.organization;
      req.session = authContext.session;
      req.authContext = authContext;

      next();

    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Authentication error'
      });
    }
  };
}

// ================================================================
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// ================================================================

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: AuthErrorCode.TOKEN_INVALID,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Insufficient permissions for this operation'
      });
    }

    next();
  };
}

// ================================================================
// PERMISSION-BASED AUTHORIZATION MIDDLEWARE
// ================================================================

export function requirePermission(resource: AuthResource, action: AuthAction) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authContext) {
      return res.status(401).json({
        error: AuthErrorCode.TOKEN_INVALID,
        message: 'Authentication required'
      });
    }

    const hasPermission = checkPermission(req.authContext.permissions, resource, action);
    if (!hasPermission) {
      return res.status(403).json({
        error: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        message: `Permission denied for ${action} on ${resource}`
      });
    }

    next();
  };
}

// ================================================================
// ORGANIZATION CONTEXT MIDDLEWARE
// ================================================================

export function requireOrganization() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.organization || !req.organization.isActive) {
      return res.status(403).json({
        error: AuthErrorCode.ORGANIZATION_NOT_FOUND,
        message: 'Valid organization context required'
      });
    }

    next();
  };
}

// ================================================================
// RATE LIMITING MIDDLEWARE
// ================================================================

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.maxAttempts,
    message: {
      error: AuthErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    skipFailedRequests: config.skipFailedRequests,
    keyGenerator: config.keyGenerator || ((req) => {
      return req.ip + ':' + req.path;
    }),
    onLimitReached: (req, res, options) => {
      console.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
    }
  });
}

// ================================================================
// SECURITY HEADERS MIDDLEWARE
// ================================================================

export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    );

    next();
  };
}

// ================================================================
// CORS MIDDLEWARE
// ================================================================

export function createCorsMiddleware(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  };
}

// ================================================================
// SESSION VALIDATION MIDDLEWARE
// ================================================================

export function validateSession() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      return next();
    }

    // Check if session is expired
    if (req.session.expiresAt < new Date()) {
      return res.status(401).json({
        error: AuthErrorCode.TOKEN_EXPIRED,
        message: 'Session has expired'
      });
    }

    // Check if session is still active
    if (!req.session.isActive) {
      return res.status(401).json({
        error: AuthErrorCode.TOKEN_INVALID,
        message: 'Session is no longer active'
      });
    }

    next();
  };
}

// ================================================================
// AUDIT LOGGING MIDDLEWARE
// ================================================================

export function createAuditLogMiddleware(eventStore?: EventStore) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!eventStore) {
      return next();
    }

    // Store original res.json to intercept response
    const originalJson = res.json;
    let responseBody: any;

    res.json = function(body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Log after response is sent
    res.on('finish', async () => {
      try {
        const shouldLog = shouldLogRequest(req, res);
        if (!shouldLog) return;

        const logData = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          userId: req.user?.id,
          organizationId: req.organization?.organizationId,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'],
          requestBody: getSanitizedBody(req.body),
          responseBody: getSanitizedResponse(responseBody),
          timestamp: new Date()
        };

        await eventStore.append(
          req.organization?.organizationId || 'system',
          req.user?.id || 'anonymous',
          'AuditLog',
          'API_REQUEST',
          logData,
          {
            userId: req.user?.id,
            timestamp: new Date()
          }
        );
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    });

    next();
  };
}

// ================================================================
// IP WHITELIST MIDDLEWARE
// ================================================================

export function createIpWhitelistMiddleware(allowedIps: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);

    if (!allowedIps.includes(clientIp)) {
      return res.status(403).json({
        error: 'IP_NOT_ALLOWED',
        message: 'Access denied from this IP address'
      });
    }

    next();
  };
}

// ================================================================
// DEVICE FINGERPRINTING MIDDLEWARE
// ================================================================

export function deviceFingerprinting() {
  return (req: Request, res: Response, next: NextFunction) => {
    const deviceFingerprint = {
      userAgent: req.headers['user-agent'],
      acceptLanguage: req.headers['accept-language'],
      acceptEncoding: req.headers['accept-encoding'],
      ip: getClientIp(req)
    };

    // Attach device fingerprint to request
    (req as any).deviceFingerprint = deviceFingerprint;

    next();
  };
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function mapUserToUserInfo(user: any): UserInfo {
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

async function getPermissionsForRole(role: UserRole): Promise<Permission[]> {
  // Define role-based permissions
  const rolePermissions: { [key in UserRole]: Permission[] } = {
    [UserRole.ADMIN]: [
      { resource: '*', action: '*' } // Admin has all permissions
    ],
    [UserRole.MANAGER]: [
      { resource: AuthResource.TOURNAMENT, action: AuthAction.MANAGE },
      { resource: AuthResource.PLAYER, action: AuthAction.MANAGE },
      { resource: AuthResource.TABLE, action: AuthAction.MANAGE },
      { resource: AuthResource.CLOCK, action: AuthAction.MANAGE },
      { resource: AuthResource.PAYOUT, action: AuthAction.MANAGE }
    ],
    [UserRole.DEALER]: [
      { resource: AuthResource.TABLE, action: AuthAction.UPDATE },
      { resource: AuthResource.PLAYER, action: AuthAction.VIEW },
      { resource: AuthResource.TOURNAMENT, action: AuthAction.VIEW }
    ],
    [UserRole.PLAYER]: [
      { resource: AuthResource.TOURNAMENT, action: AuthAction.VIEW },
      { resource: AuthResource.PLAYER, action: AuthAction.VIEW },
      { resource: AuthResource.USER, action: AuthAction.UPDATE, conditions: { ownResource: true } }
    ],
    [UserRole.VIEWER]: [
      { resource: AuthResource.TOURNAMENT, action: AuthAction.VIEW },
      { resource: AuthResource.PLAYER, action: AuthAction.VIEW }
    ]
  };

  return rolePermissions[role] || [];
}

function checkPermission(permissions: Permission[], resource: AuthResource, action: AuthAction): boolean {
  return permissions.some(permission => {
    // Check for wildcard permissions
    if (permission.resource === '*' || permission.action === '*') {
      return true;
    }

    // Check for exact match
    if (permission.resource === resource && permission.action === action) {
      return true;
    }

    // Check for resource wildcard with specific action
    if (permission.resource === '*' && permission.action === action) {
      return true;
    }

    // Check for specific resource with action wildcard
    if (permission.resource === resource && permission.action === '*') {
      return true;
    }

    return false;
  });
}

function shouldLogRequest(req: Request, res: Response): boolean {
  // Don't log health checks or static assets
  const skipPaths = ['/health', '/favicon.ico', '/robots.txt'];
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return false;
  }

  // Don't log successful GET requests to reduce noise
  if (req.method === 'GET' && res.statusCode < 400) {
    return false;
  }

  return true;
}

function getSanitizedBody(body: any): any {
  if (!body) return undefined;

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

function getSanitizedResponse(response: any): any {
  if (!response) return undefined;

  // Only log error responses to reduce data size
  if (response.error) {
    return {
      error: response.error,
      message: response.message
    };
  }

  return undefined;
}

function getClientIp(req: Request): string {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    'unknown'
  ) as string;
}

// ================================================================
// RATE LIMIT CONFIGURATIONS
// ================================================================

export const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    skipSuccessfulRequests: true
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100,
    skipSuccessfulRequests: true
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    skipSuccessfulRequests: false
  },
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 5,
    skipSuccessfulRequests: false
  }
} as const;

// ================================================================
// EXPORTS
// ================================================================


export type { AuthMiddlewareConfig };