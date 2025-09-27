import { TRPCError } from '@trpc/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';
import { ValidationError, mapPrismaError } from '../utils/validation';

// Error types for better error handling
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL',
}

// Custom error classes
export class BusinessLogicError extends Error {
  constructor(
    message: string,
    public code: string = 'BUSINESS_LOGIC_ERROR',
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public statusCode: number = 503
  ) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Rate limit exceeded',
    public resetTime?: Date
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Error context for better debugging
interface ErrorContext {
  userId?: string;
  organizationId?: string;
  tournamentId?: string;
  operation?: string;
  input?: any;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
}

// Centralized error handler
export class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Main error handling method
  handleError(error: any, context?: Partial<ErrorContext>): TRPCError {
    const fullContext: ErrorContext = {
      ...context,
      timestamp: new Date(),
    };

    // Log error for monitoring
    this.logError(error, fullContext);

    // Convert to appropriate TRPC error
    return this.convertToTRPCError(error, fullContext);
  }

  private convertToTRPCError(error: any, context: ErrorContext): TRPCError {
    // Handle known error types
    if (error instanceof TRPCError) {
      return error;
    }

    if (error instanceof ValidationError) {
      return new TRPCError({
        code: 'BAD_REQUEST',
        message: error.message,
        cause: {
          type: ErrorType.VALIDATION,
          field: error.field,
          code: error.code,
        },
      });
    }

    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return new TRPCError({
        code: 'BAD_REQUEST',
        message: `Validation failed: ${firstError.message}`,
        cause: {
          type: ErrorType.VALIDATION,
          field: firstError.path.join('.'),
          code: firstError.code,
          details: error.flatten(),
        },
      });
    }

    if (error instanceof BusinessLogicError) {
      return new TRPCError({
        code: 'BAD_REQUEST',
        message: error.message,
        cause: {
          type: ErrorType.BUSINESS_LOGIC,
          code: error.code,
        },
      });
    }

    if (error instanceof RateLimitError) {
      return new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: error.message,
        cause: {
          type: ErrorType.RATE_LIMIT,
          resetTime: error.resetTime,
        },
      });
    }

    if (error instanceof ExternalServiceError) {
      return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'External service error',
        cause: {
          type: ErrorType.EXTERNAL_SERVICE,
          service: error.service,
        },
      });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      return mapPrismaError(error);
    }

    // Handle authorization errors
    if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      return new TRPCError({
        code: 'FORBIDDEN',
        message: error.message,
        cause: {
          type: ErrorType.AUTHORIZATION,
        },
      });
    }

    // Handle not found errors
    if (error.message?.includes('not found')) {
      return new TRPCError({
        code: 'NOT_FOUND',
        message: error.message,
        cause: {
          type: ErrorType.NOT_FOUND,
        },
      });
    }

    // Default to internal server error
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      cause: {
        type: ErrorType.INTERNAL,
        originalMessage: error.message,
      },
    });
  }

  private logError(error: any, context: ErrorContext): void {
    const logEntry = {
      level: this.getLogLevel(error),
      message: error.message,
      error: {
        name: error.name,
        stack: error.stack,
        code: error.code,
      },
      context,
      timestamp: context.timestamp,
    };

    // In production, you'd send this to your logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to external logging service (e.g., DataDog, LogRocket, etc.)
      this.sendToLoggingService(logEntry);
    } else {
      // Development logging
      console.error('Error occurred:', logEntry);
    }

    // Send critical errors to alerting system
    if (this.isCriticalError(error)) {
      this.sendAlert(logEntry);
    }
  }

  private getLogLevel(error: any): 'error' | 'warn' | 'info' {
    if (error instanceof ValidationError || error instanceof BusinessLogicError) {
      return 'warn';
    }

    if (error instanceof RateLimitError) {
      return 'info';
    }

    return 'error';
  }

  private isCriticalError(error: any): boolean {
    // Define what constitutes a critical error
    return (
      error instanceof ExternalServiceError ||
      error.message?.includes('database') ||
      error.message?.includes('connection') ||
      error.name === 'InternalServerError'
    );
  }

  private sendToLoggingService(logEntry: any): void {
    // Implementation would depend on your logging service
    // Example: DataDog, LogRocket, Winston, etc.
    console.log('Would send to logging service:', logEntry);
  }

  private sendAlert(logEntry: any): void {
    // Implementation would depend on your alerting system
    // Example: PagerDuty, Slack, email, etc.
    console.error('CRITICAL ERROR ALERT:', logEntry);
  }
}

// Middleware factory for common error scenarios
export const errorMiddleware = {
  // Tournament-specific error handling
  tournament: (operation: string) => (error: any, context?: Partial<ErrorContext>) => {
    const handler = ErrorHandler.getInstance();

    // Add tournament-specific context
    const enhancedContext = {
      ...context,
      operation: `tournament.${operation}`,
    };

    // Handle common tournament errors
    if (error.message?.includes('tournament not found')) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Tournament not found or you do not have access to it',
      });
    }

    if (error.message?.includes('tournament is full')) {
      throw new BusinessLogicError(
        'Tournament has reached maximum capacity',
        'TOURNAMENT_FULL'
      );
    }

    if (error.message?.includes('late registration closed')) {
      throw new BusinessLogicError(
        'Late registration period has ended',
        'LATE_REGISTRATION_CLOSED'
      );
    }

    return handler.handleError(error, enhancedContext);
  },

  // Player-specific error handling
  player: (operation: string) => (error: any, context?: Partial<ErrorContext>) => {
    const handler = ErrorHandler.getInstance();

    const enhancedContext = {
      ...context,
      operation: `player.${operation}`,
    };

    // Handle common player errors
    if (error.message?.includes('already registered')) {
      throw new BusinessLogicError(
        'Player is already registered for this tournament',
        'PLAYER_ALREADY_REGISTERED'
      );
    }

    if (error.message?.includes('seat occupied')) {
      throw new BusinessLogicError(
        'The requested seat is already occupied',
        'SEAT_OCCUPIED'
      );
    }

    return handler.handleError(error, enhancedContext);
  },

  // Organization-specific error handling
  organization: (operation: string) => (error: any, context?: Partial<ErrorContext>) => {
    const handler = ErrorHandler.getInstance();

    const enhancedContext = {
      ...context,
      operation: `organization.${operation}`,
    };

    // Handle common organization errors
    if (error.message?.includes('slug already exists')) {
      throw new BusinessLogicError(
        'An organization with this identifier already exists',
        'ORGANIZATION_SLUG_EXISTS'
      );
    }

    if (error.message?.includes('last owner')) {
      throw new BusinessLogicError(
        'Cannot remove the last owner from an organization',
        'CANNOT_REMOVE_LAST_OWNER'
      );
    }

    return handler.handleError(error, enhancedContext);
  },

  // Generic error handling with operation context
  generic: (operation: string) => (error: any, context?: Partial<ErrorContext>) => {
    const handler = ErrorHandler.getInstance();

    const enhancedContext = {
      ...context,
      operation,
    };

    return handler.handleError(error, enhancedContext);
  },
};

// Helper functions for error handling in routes
export const withErrorHandling = (operation: string, handler: (error: any) => TRPCError = errorMiddleware.generic(operation)) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        throw handler(error, {
          operation: `${target.constructor.name}.${propertyName}`,
        });
      }
    };

    return descriptor;
  };
};

// Error reporting utilities
export const errorReporting = {
  // Report user-facing errors that don't require immediate attention
  reportUserError: (error: any, context: Partial<ErrorContext>) => {
    const handler = ErrorHandler.getInstance();
    handler.handleError(error, { ...context, operation: 'user_error' });
  },

  // Report system errors that may require investigation
  reportSystemError: (error: any, context: Partial<ErrorContext>) => {
    const handler = ErrorHandler.getInstance();
    handler.handleError(error, { ...context, operation: 'system_error' });
  },

  // Report critical errors that require immediate attention
  reportCriticalError: (error: any, context: Partial<ErrorContext>) => {
    const handler = ErrorHandler.getInstance();
    const enhancedContext = { ...context, operation: 'critical_error' };
    handler.handleError(error, enhancedContext);

    // Immediately send alert for critical errors
    console.error('CRITICAL ERROR REPORTED:', { error, context: enhancedContext });
  },
};

export default ErrorHandler;