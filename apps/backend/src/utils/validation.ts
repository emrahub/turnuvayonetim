import { z } from 'zod';
import { TRPCError } from '@trpc/server';

// Common validation schemas
export const commonSchemas = {
  // IDs
  id: z.string().cuid(),
  email: z.string().email(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/),
  url: z.string().url(),

  // Pagination
  pagination: z.object({
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
    cursor: z.string().optional(),
  }),

  // Date ranges
  dateRange: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }).refine(
    (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
    { message: 'Start date must be before end date' }
  ),

  // Monetary amounts
  amount: z.number().min(0).max(1000000), // Max $10,000 for safety
  chipCount: z.number().min(0).max(10000000), // Max 10M chips

  // Text fields
  shortText: z.string().min(1).max(100).trim(),
  mediumText: z.string().min(1).max(500).trim(),
  longText: z.string().min(1).max(2000).trim(),

  // Slugs and identifiers
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50),
  displayName: z.string().min(1).max(50).trim(),

  // Numbers with ranges
  seatNumber: z.number().min(1).max(10),
  tableNumber: z.number().min(1).max(1000),
  blindLevel: z.number().min(0).max(1000),
};

// Tournament-specific schemas
export const tournamentSchemas = {
  buyIn: commonSchemas.amount,
  startingStack: z.number().min(1000).max(1000000),
  maxPlayers: z.number().min(2).max(10000),
  lateRegMinutes: z.number().min(0).max(1440), // Max 24 hours

  blindLevel: z.object({
    idx: z.number().min(0),
    smallBlind: z.number().min(0),
    bigBlind: z.number().min(1),
    ante: z.number().min(0).default(0),
    durationSeconds: z.number().min(60).max(7200).default(900), // 1min to 2hours
    isBreak: z.boolean().default(false),
    breakName: z.string().optional(),
  }),

  payoutStructure: z.array(z.object({
    place: z.number().min(1),
    percentage: z.number().min(0).max(100),
  })).refine(
    (payouts) => {
      const total = payouts.reduce((sum, p) => sum + p.percentage, 0);
      return Math.abs(total - 100) < 0.01; // Allow for floating point precision
    },
    { message: 'Payout percentages must sum to 100%' }
  ),
};

// Player-specific schemas
export const playerSchemas = {
  name: z.object({
    firstName: z.string().min(1).max(50).trim().optional(),
    lastName: z.string().min(1).max(50).trim().optional(),
    nickname: z.string().min(1).max(30).trim().optional(),
  }).refine(
    (data) => data.firstName || data.lastName || data.nickname,
    { message: 'At least one name field must be provided' }
  ),

  contact: z.object({
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional(),
  }).refine(
    (data) => data.email || data.phone,
    { message: 'At least one contact method must be provided' }
  ),
};

// Organization-specific schemas
export const organizationSchemas = {
  settings: z.object({
    timezone: z.string().default('UTC'),
    currency: z.string().length(3).default('USD'),
    dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).default('MM/DD/YYYY'),
    timeFormat: z.enum(['12h', '24h']).default('12h'),
    defaultBuyIn: commonSchemas.amount.optional(),
    defaultStartingStack: tournamentSchemas.startingStack.optional(),
  }),
};

// Validation helpers
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.message,
        firstError.path.join('.'),
        firstError.code
      );
    }
    throw error;
  }
}

// Custom validation functions
export const customValidations = {
  // Check if tournament dates are valid
  validateTournamentDates: (startDate: Date, endDate?: Date) => {
    if (startDate < new Date()) {
      throw new ValidationError('Tournament start date cannot be in the past');
    }

    if (endDate && endDate <= startDate) {
      throw new ValidationError('Tournament end date must be after start date');
    }
  },

  // Validate blind structure progression
  validateBlindStructure: (levels: Array<{ smallBlind: number; bigBlind: number; ante: number; isBreak: boolean }>) => {
    let lastSmallBlind = 0;
    let lastBigBlind = 0;

    for (const level of levels) {
      if (level.isBreak) continue;

      if (level.smallBlind <= 0 || level.bigBlind <= 0) {
        throw new ValidationError('Blind levels must be greater than 0');
      }

      if (level.bigBlind <= level.smallBlind) {
        throw new ValidationError('Big blind must be greater than small blind');
      }

      if (level.smallBlind < lastSmallBlind || level.bigBlind < lastBigBlind) {
        throw new ValidationError('Blind levels should generally increase');
      }

      lastSmallBlind = level.smallBlind;
      lastBigBlind = level.bigBlind;
    }

    if (levels.length === 0) {
      throw new ValidationError('Blind structure must have at least one level');
    }
  },

  // Validate chip count updates
  validateChipCount: (oldChipCount: number, newChipCount: number, maxIncrease: number = 1000000) => {
    if (newChipCount < 0) {
      throw new ValidationError('Chip count cannot be negative');
    }

    const increase = newChipCount - oldChipCount;
    if (increase > maxIncrease) {
      throw new ValidationError(`Chip increase cannot exceed ${maxIncrease}`);
    }
  },

  // Validate seat assignment
  validateSeatAssignment: (tableMaxSeats: number, seatNumber: number, occupiedSeats: number[]) => {
    if (seatNumber < 1 || seatNumber > tableMaxSeats) {
      throw new ValidationError(`Seat number must be between 1 and ${tableMaxSeats}`);
    }

    if (occupiedSeats.includes(seatNumber)) {
      throw new ValidationError('Seat is already occupied');
    }
  },

  // Validate payout calculations
  validatePayouts: (
    totalPrizePool: number,
    payouts: Array<{ place: number; amount: number; percentage?: number }>
  ) => {
    const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0);

    if (totalAmount > totalPrizePool * 1.01) { // Allow 1% tolerance
      throw new ValidationError('Total payouts exceed prize pool');
    }

    // Check for duplicate places
    const places = payouts.map(p => p.place);
    const uniquePlaces = new Set(places);
    if (places.length !== uniquePlaces.size) {
      throw new ValidationError('Duplicate payout places detected');
    }

    // Ensure payouts are in descending order by amount
    for (let i = 1; i < payouts.length; i++) {
      if (payouts[i].amount > payouts[i - 1].amount) {
        throw new ValidationError('Payouts should be in descending order by amount');
      }
    }
  },
};

// Rate limiting helpers
export const rateLimits = {
  // Standard operations
  standard: { requests: 100, window: 60 }, // 100 requests per minute

  // Expensive operations
  expensive: { requests: 10, window: 60 }, // 10 requests per minute

  // Authentication operations
  auth: { requests: 5, window: 60 }, // 5 requests per minute

  // Real-time operations (clock updates, etc.)
  realtime: { requests: 300, window: 60 }, // 300 requests per minute
};

// Error mapping for consistent API responses
export function mapPrismaError(error: any): TRPCError {
  // Prisma error codes
  switch (error.code) {
    case 'P2002':
      return new TRPCError({
        code: 'CONFLICT',
        message: 'A record with this value already exists',
      });

    case 'P2025':
      return new TRPCError({
        code: 'NOT_FOUND',
        message: 'Record not found',
      });

    case 'P2003':
      return new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Foreign key constraint failed',
      });

    case 'P2014':
      return new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid relation operation',
      });

    default:
      return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database operation failed',
      });
  }
}

// Input sanitization
export const sanitize = {
  // Remove HTML tags and dangerous characters
  text: (input: string): string => {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim();
  },

  // Sanitize for use in SQL LIKE queries
  searchTerm: (input: string): string => {
    return input
      .replace(/[%_\\]/g, '\\$&') // Escape SQL wildcards
      .trim()
      .toLowerCase();
  },

  // Sanitize URLs
  url: (input: string): string => {
    try {
      const url = new URL(input);
      // Only allow http and https
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      throw new ValidationError('Invalid URL format');
    }
  },
};

// Export all schemas for easy importing
export const schemas = {
  common: commonSchemas,
  tournament: tournamentSchemas,
  player: playerSchemas,
  organization: organizationSchemas,
};