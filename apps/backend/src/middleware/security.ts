import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Security middleware using helmet.js
 * Protects against common web vulnerabilities
 */
export const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

/**
 * Rate limiting for API endpoints
 */

// General API rate limit: 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.',
      },
    });
  },
});

// Strict rate limit for authentication: 5 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Çok fazla giriş denemesi yapıldı, 15 dakika sonra tekrar deneyin.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'AUTH_RATE_LIMITED',
        message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
      },
    });
  },
});

// Moderate rate limit for write operations: 30 requests per minute
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Çok fazla güncelleme isteği gönderildi.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        code: 'WRITE_RATE_LIMITED',
        message: 'Çok fazla güncelleme isteği. Lütfen biraz bekleyin.',
      },
    });
  },
});

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3005',
      'http://localhost:3000',
    ];

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * Custom error handler for security errors
 */
export const securityErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log security errors
  if (err.message?.includes('CORS') || err.message?.includes('CSP')) {
    console.error('Security Error:', {
      type: err.message,
      origin: req.headers.origin,
      path: req.path,
      ip: req.ip,
    });
  }

  // Don't expose detailed security errors to clients
  res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message: 'Access denied',
    },
  });
};
