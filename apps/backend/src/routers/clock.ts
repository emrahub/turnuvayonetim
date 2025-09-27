import { router, organizationProcedure, hasRole } from '../utils/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { ROLE_PERMISSIONS } from '../middleware/auth';

export const clockRouter = router({
  getState: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const clockState = await ctx.prisma.clockState.findFirst({
        where: {
          tournamentId: input.tournamentId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!clockState) {
        // Return default state
        return {
          tournamentId: input.tournamentId,
          currentLevelIdx: 0,
          status: 'idle',
          levelStartTime: BigInt(Date.now()),
          pausedDuration: BigInt(0),
          serverTime: BigInt(Date.now()),
        };
      }

      return clockState;
    }),

  updateState: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      currentLevelIdx: z.number(),
      status: z.string(),
      levelStartTime: z.bigint(),
      pausedDuration: z.bigint(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to control the clock',
        });
      }

      const clockState = await ctx.prisma.clockState.create({
        data: {
          tournamentId: input.tournamentId,
          currentLevelIdx: input.currentLevelIdx,
          status: input.status,
          levelStartTime: input.levelStartTime,
          pausedDuration: input.pausedDuration,
          serverTime: BigInt(Date.now()),
        },
      });

      return clockState;
    }),

  createBlindStructure: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      name: z.string().optional(),
      levels: z.array(z.object({
        idx: z.number(),
        smallBlind: z.number(),
        bigBlind: z.number(),
        ante: z.number().default(0),
        durationSeconds: z.number().default(900),
        isBreak: z.boolean().default(false),
        breakName: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create blind structures',
        });
      }

      // Delete existing structure if any
      await ctx.prisma.blindStructure.deleteMany({
        where: { tournamentId: input.tournamentId },
      });

      // Create new structure
      const structure = await ctx.prisma.blindStructure.create({
        data: {
          tournamentId: input.tournamentId,
          name: input.name,
          levels: {
            createMany: {
              data: input.levels,
            },
          },
        },
        include: {
          levels: {
            orderBy: { idx: 'asc' },
          },
        },
      });

      return structure;
    }),

  // Advanced clock features
  addTime: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      seconds: z.number().min(1).max(3600), // Max 1 hour
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify clock time',
        });
      }

      const currentState = await ctx.prisma.clockState.findFirst({
        where: { tournamentId: input.tournamentId },
        orderBy: { createdAt: 'desc' },
      });

      if (!currentState) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No clock state found',
        });
      }

      const serverTime = BigInt(Date.now());
      const addedTime = BigInt(input.seconds * 1000);

      // Extend level by moving start time back
      const newState = await ctx.prisma.clockState.create({
        data: {
          tournamentId: input.tournamentId,
          currentLevelIdx: currentState.currentLevelIdx,
          status: currentState.status,
          levelStartTime: currentState.levelStartTime - addedTime,
          pausedDuration: currentState.pausedDuration,
          serverTime,
        },
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.tournamentId,
        AggregateType.CLOCK,
        'TimeAdded',
        {
          tournamentId: input.tournamentId,
          secondsAdded: input.seconds,
          level: currentState.currentLevelIdx,
        },
        {
          userId: ctx.user.id,
          tournamentId: input.tournamentId,
        }
      );

      return newState;
    }),

  removeTime: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      seconds: z.number().min(1).max(3600),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify clock time',
        });
      }

      const currentState = await ctx.prisma.clockState.findFirst({
        where: { tournamentId: input.tournamentId },
        orderBy: { createdAt: 'desc' },
      });

      if (!currentState) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No clock state found',
        });
      }

      const serverTime = BigInt(Date.now());
      const removedTime = BigInt(input.seconds * 1000);

      // Reduce level time by moving start time forward
      const newState = await ctx.prisma.clockState.create({
        data: {
          tournamentId: input.tournamentId,
          currentLevelIdx: currentState.currentLevelIdx,
          status: currentState.status,
          levelStartTime: currentState.levelStartTime + removedTime,
          pausedDuration: currentState.pausedDuration,
          serverTime,
        },
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.tournamentId,
        AggregateType.CLOCK,
        'TimeRemoved',
        {
          tournamentId: input.tournamentId,
          secondsRemoved: input.seconds,
          level: currentState.currentLevelIdx,
        },
        {
          userId: ctx.user.id,
          tournamentId: input.tournamentId,
        }
      );

      return newState;
    }),

  // Clock history and analytics
  getClockHistory: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      const history = await ctx.prisma.clockState.findMany({
        where: {
          tournamentId: input.tournamentId,
          tournament: {
            organizationId: input.organizationId,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
      });

      return history;
    }),

  // Real-time clock sync
  syncClock: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      clientTime: z.bigint(),
    }))
    .query(async ({ input, ctx }) => {
      const serverTime = BigInt(Date.now());
      const timeDrift = serverTime - input.clientTime;

      const currentState = await ctx.prisma.clockState.findFirst({
        where: {
          tournamentId: input.tournamentId,
          tournament: {
            organizationId: input.organizationId,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!currentState) {
        return {
          serverTime,
          timeDrift,
          clockState: null,
        };
      }

      // Calculate precise time remaining in current level
      let timeInLevel = BigInt(0);
      if (currentState.status === 'running') {
        timeInLevel = serverTime - currentState.levelStartTime - currentState.pausedDuration;
      } else if (currentState.status === 'paused') {
        timeInLevel = currentState.serverTime - currentState.levelStartTime - currentState.pausedDuration;
      }

      return {
        serverTime,
        timeDrift,
        clockState: {
          ...currentState,
          timeInLevel,
        },
      };
    }),

  // Clock settings and configuration
  updateSettings: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      settings: z.object({
        autoAdvance: z.boolean().default(false),
        warningThresholds: z.array(z.number()).default([300, 60, 10]), // 5min, 1min, 10sec
        soundEnabled: z.boolean().default(true),
        displayFormat: z.enum(['mm:ss', 'hh:mm:ss']).default('mm:ss'),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update clock settings',
        });
      }

      // In a real implementation, this would store clock settings
      // For now, we'll just record the event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.tournamentId,
        AggregateType.CLOCK,
        'ClockSettingsUpdated',
        {
          tournamentId: input.tournamentId,
          settings: input.settings,
        },
        {
          userId: ctx.user.id,
          tournamentId: input.tournamentId,
        }
      );

      return {
        success: true,
        settings: input.settings,
      };
    }),

  getBlindStructure: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const structure = await ctx.prisma.blindStructure.findUnique({
        where: { tournamentId: input.tournamentId },
        include: {
          levels: {
            orderBy: { idx: 'asc' },
          },
        },
      });

      if (!structure) {
        // Return default structure
        return {
          tournamentId: input.tournamentId,
          name: 'Standard',
          levels: [
            { idx: 0, smallBlind: 2500, bigBlind: 5000, ante: 0, durationSeconds: 900, isBreak: false },
            { idx: 1, smallBlind: 5000, bigBlind: 10000, ante: 0, durationSeconds: 900, isBreak: false },
            { idx: 2, smallBlind: 7500, bigBlind: 15000, ante: 2500, durationSeconds: 900, isBreak: false },
            { idx: 3, smallBlind: 10000, bigBlind: 20000, ante: 2500, durationSeconds: 900, isBreak: false },
            { idx: 4, smallBlind: 0, bigBlind: 0, ante: 0, durationSeconds: 600, isBreak: true, breakName: '10 Minute Break' },
            { idx: 5, smallBlind: 15000, bigBlind: 30000, ante: 5000, durationSeconds: 900, isBreak: false },
            { idx: 6, smallBlind: 20000, bigBlind: 40000, ante: 5000, durationSeconds: 900, isBreak: false },
            { idx: 7, smallBlind: 30000, bigBlind: 60000, ante: 10000, durationSeconds: 900, isBreak: false },
          ],
        };
      }

      return structure;
    }),
});