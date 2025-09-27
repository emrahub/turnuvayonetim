import { AuthConfig } from '../types/auth-types';

// ================================================================
// DEFAULT AUTHENTICATION CONFIGURATION
// ================================================================

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  jwt: {
    algorithm: 'RS256', // Use RS256 for better security in distributed systems
    accessTokenExpiresIn: '15m', // Short-lived access tokens
    refreshTokenExpiresIn: '7d', // Longer-lived refresh tokens
    issuer: 'turnuvayonetim-auth',
    audience: 'turnuvayonetim-api'
  },
  passwords: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 // 90 days before password expires
  },
  sessions: {
    maxPerUser: 5, // Maximum concurrent sessions per user
    absoluteTimeout: 86400, // 24 hours maximum session duration
    inactivityTimeout: 3600 // 1 hour inactivity timeout
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15, // 15 minutes lockout
    twoFactorRequired: false, // Optional 2FA by default
    emailVerificationRequired: true
  },
  rateLimiting: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
      skipSuccessfulRequests: true,
      skipFailedRequests: false
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 5,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    twoFactor: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxAttempts: 3,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    }
  }
};

// ================================================================
// DEVELOPMENT CONFIGURATION
// ================================================================

export const DEVELOPMENT_AUTH_CONFIG: AuthConfig = {
  ...DEFAULT_AUTH_CONFIG,
  jwt: {
    ...DEFAULT_AUTH_CONFIG.jwt,
    algorithm: 'HS256', // Use HS256 for development simplicity
    accessTokenExpiresIn: '1h', // Longer tokens for development
    refreshTokenExpiresIn: '30d'
  },
  security: {
    ...DEFAULT_AUTH_CONFIG.security,
    maxLoginAttempts: 10, // More lenient for development
    lockoutDuration: 5, // Shorter lockout for development
    emailVerificationRequired: false // Skip email verification in development
  }
};

// ================================================================
// PRODUCTION CONFIGURATION
// ================================================================

export const PRODUCTION_AUTH_CONFIG: AuthConfig = {
  ...DEFAULT_AUTH_CONFIG,
  security: {
    ...DEFAULT_AUTH_CONFIG.security,
    twoFactorRequired: true, // Require 2FA in production
    maxLoginAttempts: 3, // Stricter limits in production
    lockoutDuration: 30 // Longer lockout in production
  },
  rateLimiting: {
    ...DEFAULT_AUTH_CONFIG.rateLimiting,
    login: {
      ...DEFAULT_AUTH_CONFIG.rateLimiting.login,
      maxAttempts: 3 // Stricter rate limiting in production
    }
  }
};

// ================================================================
// CONFIGURATION FACTORY
// ================================================================

export function getAuthConfig(environment: string = 'development'): AuthConfig {
  switch (environment.toLowerCase()) {
    case 'production':
      return PRODUCTION_AUTH_CONFIG;
    case 'development':
    case 'dev':
      return DEVELOPMENT_AUTH_CONFIG;
    case 'test':
      return {
        ...DEVELOPMENT_AUTH_CONFIG,
        security: {
          ...DEVELOPMENT_AUTH_CONFIG.security,
          emailVerificationRequired: false,
          maxLoginAttempts: 100 // Very lenient for testing
        }
      };
    default:
      return DEFAULT_AUTH_CONFIG;
  }
}

// ================================================================
// ENVIRONMENT VARIABLE VALIDATION
// ================================================================

export function validateAuthEnvironment(): {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
} {
  const requiredVars = [
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET'
  ];

  const optionalVars = [
    'JWT_PRIVATE_KEY', // For RS256
    'JWT_PUBLIC_KEY',  // For RS256
    'PASSWORD_PEPPER',
    'ALLOWED_ORIGINS'
  ];

  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // Check optional variables and add warnings
  if (!process.env.JWT_PRIVATE_KEY && !process.env.JWT_PUBLIC_KEY) {
    warnings.push('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY not set - using HS256 instead of RS256');
  }

  if (!process.env.PASSWORD_PEPPER) {
    warnings.push('PASSWORD_PEPPER not set - passwords will not have additional pepper protection');
  }

  if (!process.env.ALLOWED_ORIGINS) {
    warnings.push('ALLOWED_ORIGINS not set - using default localhost origins');
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long for security');
  }

  if (process.env.REFRESH_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET.length < 32) {
    warnings.push('REFRESH_TOKEN_SECRET should be at least 32 characters long for security');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings
  };
}

// ================================================================
// JWT KEY GENERATION HELPERS
// ================================================================

export function generateJWTSecrets(): {
  jwtSecret: string;
  refreshTokenSecret: string;
  pepper: string;
} {
  const crypto = require('crypto');

  return {
    jwtSecret: crypto.randomBytes(64).toString('hex'),
    refreshTokenSecret: crypto.randomBytes(64).toString('hex'),
    pepper: crypto.randomBytes(32).toString('hex')
  };
}

export function generateRSAKeyPair(): {
  privateKey: string;
  publicKey: string;
} {
  const crypto = require('crypto');
  const { generateKeyPairSync } = crypto;

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { privateKey, publicKey };
}

// ================================================================
// EXPORTS
// ================================================================

