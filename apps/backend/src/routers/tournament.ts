import { router, organizationProcedure, hasRole } from '../utils/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { TournamentStatus } from '@prisma/client';
import { SeatingService } from '../services/seating.service';
import { ROLE_PERMISSIONS } from '../middleware/auth';
import { EventStoreFactory, AggregateType } from '../services/event-store';

// Validation schemas
const blindLevelSchema = z.object({
  idx: z.number().min(0),
  smallBlind: z.number().min(0),
  bigBlind: z.number().min(1),
  ante: z.number().min(0).default(0),
  durationSeconds: z.number().min(60).default(900),
  isBreak: z.boolean().default(false),
  breakName: z.string().optional(),
});

const blindStructureSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  levels: z.array(blindLevelSchema).min(1),
});

const tournamentCreateSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  buyIn: z.number().min(0),
  startingStack: z.number().min(1000),
  rebuyAllowed: z.boolean().default(false),
  rebuyAmount: z.number().optional(),
  addonAllowed: z.boolean().default(false),
  addonAmount: z.number().optional(),
  maxPlayers: z.number().optional(),
  lateRegMinutes: z.number().default(0),
  guaranteedPrize: z.number().optional(),
  blindStructure: blindStructureSchema.optional(),
});

export const tournamentRouter = router({
  create: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      startDate: z.date(),
      buyIn: z.number().min(0),
      startingStack: z.number().min(1000),
      rebuyAllowed: z.boolean().default(false),
      rebuyAmount: z.number().optional(),
      addonAllowed: z.boolean().default(false),
      addonAmount: z.number().optional(),
      maxPlayers: z.number().optional(),
      lateRegMinutes: z.number().default(0),
      guaranteedPrize: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission - TOURNAMENT_OPERATIONS includes STAFF role
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create tournaments',
        });
      }

      const tournament = await ctx.prisma.tournament.create({
        data: {
          ...input,
          status: TournamentStatus.SCHEDULED,
        },
        include: {
          blindStructure: true,
        },
      });

      return tournament;
    }),

  list: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      status: z.nativeEnum(TournamentStatus).optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { organizationId, status, limit, cursor } = input;

      const tournaments = await ctx.prisma.tournament.findMany({
        where: {
          organizationId,
          ...(status && { status }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { startDate: 'desc' },
        include: {
          _count: {
            select: {
              entries: true,
              tables: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (tournaments.length > limit) {
        const nextItem = tournaments.pop();
        nextCursor = nextItem!.id;
      }

      return {
        tournaments,
        nextCursor,
      };
    }),

  get: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.prisma.tournament.findFirst({
        where: {
          id: input.tournamentId,
          organizationId: input.organizationId,
        },
        include: {
          blindStructure: {
            include: {
              levels: {
                orderBy: { idx: 'asc' },
              },
            },
          },
          _count: {
            select: {
              entries: true,
              tables: true,
              eliminations: true,
            },
          },
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        });
      }

      // Get active player count
      const activeEntries = await ctx.prisma.entry.count({
        where: {
          tournamentId: tournament.id,
          status: 'ACTIVE',
        },
      });

      // Get prize pool
      const prizePool = await ctx.prisma.transaction.aggregate({
        where: {
          tournamentId: tournament.id,
        },
        _sum: {
          amount: true,
        },
      });

      return {
        ...tournament,
        activeEntries,
        prizePool: prizePool._sum.amount || 0,
      };
    }),

  update: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      startDate: z.date().optional(),
      status: z.nativeEnum(TournamentStatus).optional(),
      buyIn: z.number().optional(),
      startingStack: z.number().optional(),
      rebuyAllowed: z.boolean().optional(),
      rebuyAmount: z.number().optional(),
      addonAllowed: z.boolean().optional(),
      addonAmount: z.number().optional(),
      maxPlayers: z.number().optional(),
      lateRegMinutes: z.number().optional(),
      guaranteedPrize: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update tournaments',
        });
      }

      const { organizationId, tournamentId, ...updateData } = input;

      // Verify tournament belongs to organization
      const existing = await ctx.prisma.tournament.findFirst({
        where: {
          id: tournamentId,
          organizationId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        });
      }

      const tournament = await ctx.prisma.tournament.update({
        where: { id: tournamentId },
        data: updateData,
      });

      return tournament;
    }),

  delete: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission - DELETE operations are admin-only
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.ADMIN_ONLY)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete tournaments',
        });
      }

      // Verify tournament belongs to organization
      const existing = await ctx.prisma.tournament.findFirst({
        where: {
          id: input.tournamentId,
          organizationId: input.organizationId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        });
      }

      // Check if tournament has started
      if (existing.status !== TournamentStatus.SCHEDULED) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete a tournament that has already started',
        });
      }

      await ctx.prisma.tournament.delete({
        where: { id: input.tournamentId },
      });

      return { success: true };
    }),

  start: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to start tournaments',
        });
      }

      const tournament = await ctx.prisma.tournament.update({
        where: { id: input.tournamentId },
        data: {
          status: TournamentStatus.LIVE,
        },
      });

      return tournament;
    }),

  pause: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to pause tournaments',
        });
      }

      const tournament = await ctx.prisma.tournament.update({
        where: { id: input.tournamentId },
        data: {
          status: TournamentStatus.PAUSED,
        },
      });

      return tournament;
    }),

  complete: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to complete tournaments',
        });
      }

      const tournament = await ctx.prisma.tournament.update({
        where: { id: input.tournamentId },
        data: {
          status: TournamentStatus.COMPLETED,
          endDate: new Date(),
        },
      });

      return tournament;
    }),

  stats: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { tournamentId } = input;

      // Get various statistics
      const [
        totalEntries,
        activeEntries,
        eliminatedEntries,
        totalRebuys,
        totalAddons,
        prizePool,
        averageStack,
      ] = await Promise.all([
        ctx.prisma.entry.count({
          where: { tournamentId },
        }),
        ctx.prisma.entry.count({
          where: { tournamentId, status: 'ACTIVE' },
        }),
        ctx.prisma.entry.count({
          where: { tournamentId, status: 'ELIMINATED' },
        }),
        ctx.prisma.transaction.count({
          where: { tournamentId, type: 'REBUY' },
        }),
        ctx.prisma.transaction.count({
          where: { tournamentId, type: 'ADDON' },
        }),
        ctx.prisma.transaction.aggregate({
          where: { tournamentId },
          _sum: { amount: true },
        }),
        ctx.prisma.entry.aggregate({
          where: { tournamentId, status: 'ACTIVE' },
          _avg: { chipCount: true },
        }),
      ]);

      return {
        totalEntries,
        activeEntries,
        eliminatedEntries,
        totalRebuys,
        totalAddons,
        prizePool: prizePool._sum.amount || 0,
        averageStack: Math.floor(averageStack._avg.chipCount || 0),
      };
    }),

  seatPlayers: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      maxPlayersPerTable: z.number().min(4).max(10).default(9),
      minPlayersPerTable: z.number().min(2).max(8).default(6),
      balanceThreshold: z.number().min(1).max(5).default(2),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to manage seating',
        });
      }

      const { organizationId, tournamentId, ...config } = input;

      // Verify tournament belongs to organization
      const tournament = await ctx.prisma.tournament.findFirst({
        where: {
          id: tournamentId,
          organizationId,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        });
      }

      const seatingService = new SeatingService(ctx.prisma);
      const result = await seatingService.seatPlayers(tournamentId, config);

      return result;
    }),

  rebalanceTables: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      maxPlayersPerTable: z.number().min(4).max(10).default(9),
      minPlayersPerTable: z.number().min(2).max(8).default(6),
      balanceThreshold: z.number().min(1).max(5).default(2),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to manage seating',
        });
      }

      const { organizationId, tournamentId, ...config } = input;

      const seatingService = new SeatingService(ctx.prisma);
      const result = await seatingService.rebalanceTables(tournamentId, config);

      return result;
    }),

  eliminatePlayer: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      entryId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to eliminate players',
        });
      }

      const seatingService = new SeatingService(ctx.prisma);
      await seatingService.eliminatePlayer(input.entryId);

      return { success: true };
    }),

  // Blind structure management
  createBlindStructure: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      ...blindStructureSchema.shape,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to manage blind structures',
        });
      }

      const { organizationId, tournamentId, ...structureData } = input;

      // Verify tournament belongs to organization
      const tournament = await ctx.prisma.tournament.findFirst({
        where: {
          id: tournamentId,
          organizationId,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        });
      }

      const blindStructure = await ctx.prisma.$transaction(async (tx) => {
        // Delete existing structure if any
        await tx.blindStructure.deleteMany({
          where: { tournamentId },
        });

        // Create new structure
        return tx.blindStructure.create({
          data: {
            tournamentId,
            name: structureData.name,
            description: structureData.description,
            levels: {
              create: structureData.levels.map((level, index) => ({
                ...level,
                idx: index,
              })),
            },
          },
          include: {
            levels: {
              orderBy: { idx: 'asc' },
            },
          },
        });
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        organizationId,
        tournamentId,
        AggregateType.TOURNAMENT,
        'BlindStructureCreated',
        {
          tournamentId,
          structureId: blindStructure.id,
          levelCount: structureData.levels.length,
        },
        {
          userId: ctx.user.id,
          tournamentId,
        }
      );

      return blindStructure;
    }),

  getBlindStructure: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const blindStructure = await ctx.prisma.blindStructure.findFirst({
        where: {
          tournamentId: input.tournamentId,
          tournament: {
            organizationId: input.organizationId,
          },
        },
        include: {
          levels: {
            orderBy: { idx: 'asc' },
          },
        },
      });

      return blindStructure;
    }),

  // Prize pool and payout management
  calculatePayouts: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      payoutStructure: z.array(z.object({
        place: z.number(),
        percentage: z.number(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to calculate payouts',
        });
      }

      const { organizationId, tournamentId, payoutStructure } = input;

      // Basic validation: percentages must sum to ~100 and be non-negative
      const totalPct = payoutStructure.reduce((sum, p) => sum + p.percentage, 0);
      if (payoutStructure.some(p => p.percentage < 0)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payout percentages cannot be negative' });
      }
      if (Math.abs(totalPct - 100) > 0.01) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payout percentages must sum to 100%' });
      }

      // Get total prize pool
      const prizePoolData = await ctx.prisma.transaction.aggregate({
        where: {
          tournamentId,
          type: { in: ['BUYIN', 'REBUY', 'ADDON'] },
        },
        _sum: {
          amount: true,
        },
      });

      const totalPrizePool = prizePoolData._sum.amount || 0;

      // Clear existing payouts
      await ctx.prisma.payout.deleteMany({
        where: { tournamentId },
      });

      // Create new payouts
      const payouts = await Promise.all(
        payoutStructure.map((payout) =>
          ctx.prisma.payout.create({
            data: {
              tournamentId,
              place: payout.place,
              percentage: payout.percentage,
              amount: Math.floor((totalPrizePool * payout.percentage) / 100),
            },
          })
        )
      );

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        organizationId,
        tournamentId,
        AggregateType.TOURNAMENT,
        'PayoutsCalculated',
        {
          tournamentId,
          totalPrizePool,
          payoutCount: payouts.length,
        },
        {
          userId: ctx.user.id,
          tournamentId,
        }
      );

      return {
        payouts,
        totalPrizePool,
      };
    }),

  markPayoutPaid: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      place: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to mark payouts as paid',
        });
      }

      const payout = await ctx.prisma.payout.update({
        where: {
          tournamentId_place: {
            tournamentId: input.tournamentId,
            place: input.place,
          },
        },
        data: {
          paid: true,
          paidAt: new Date(),
        },
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.tournamentId,
        AggregateType.TOURNAMENT,
        'PayoutMarkedPaid',
        {
          tournamentId: input.tournamentId,
          place: input.place,
          amount: payout.amount,
        },
        {
          userId: ctx.user.id,
          tournamentId: input.tournamentId,
        }
      );

      return payout;
    }),
});
