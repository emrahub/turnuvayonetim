import { router, organizationProcedure, hasRole, publicProcedure } from '../utils/trpc';
import { z } from 'zod';
import { EntryStatus, TransactionType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { ROLE_PERMISSIONS } from '../middleware/auth';
import { EventStoreFactory, AggregateType } from '../services/event-store';

// Validation schemas
const playerCreateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  nickname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  photoUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

const playerUpdateSchema = playerCreateSchema.partial();

const registrationSchema = z.object({
  organizationId: z.string(),
  tournamentId: z.string(),
  displayName: z.string().min(1),
  playerId: z.string().optional(),
  playerData: playerCreateSchema.optional(),
  buyIn: z.number().min(0),
  seatRequest: z.object({
    tableNumber: z.number().optional(),
    seatNumber: z.number().optional(),
  }).optional(),
});

export const playerRouter = router({
  register: organizationProcedure
    .input(registrationSchema)
    .mutation(async ({ input, ctx }) => {
      // Check permission - PLAYER_MANAGEMENT includes DISPLAY and STAFF roles
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.PLAYER_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to register players',
        });
      }

      // Get tournament
      const tournament = await ctx.prisma.tournament.findUnique({
        where: { id: input.tournamentId },
      });

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        });
      }

      // Create or find player
      let player = null;
      if (input.playerData?.email || input.playerId) {
        if (input.playerId) {
          player = await ctx.prisma.player.findUnique({
            where: { id: input.playerId },
          });
          if (!player) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Player not found',
            });
          }
        } else if (input.playerData?.email) {
          player = await ctx.prisma.player.upsert({
            where: { email: input.playerData.email },
            update: input.playerData,
            create: input.playerData,
          });
        }
      }

      // Check if already registered
      const existingEntry = await ctx.prisma.entry.findFirst({
        where: {
          tournamentId: input.tournamentId,
          ...(player?.id && { playerId: player.id }),
          displayName: input.displayName,
          status: { not: EntryStatus.WITHDRAWN },
        },
      });

      if (existingEntry) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Player is already registered for this tournament',
        });
      }

      // Check max players limit
      if (tournament.maxPlayers) {
        const currentEntries = await ctx.prisma.entry.count({
          where: {
            tournamentId: input.tournamentId,
            status: { not: EntryStatus.WITHDRAWN },
          },
        });

        if (currentEntries >= tournament.maxPlayers) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Tournament is full',
          });
        }
      }

      // Create entry
      const entry = await ctx.prisma.entry.create({
        data: {
          tournamentId: input.tournamentId,
          playerId: player?.id,
          displayName: input.displayName,
          chipCount: tournament.startingStack,
          status: EntryStatus.REGISTERED,
        },
        include: {
          player: true,
        },
      });

      // Record buy-in transaction
      if (input.buyIn > 0) {
        await ctx.prisma.transaction.create({
          data: {
            tournamentId: input.tournamentId,
            entryId: entry.id,
            type: TransactionType.BUYIN,
            amount: input.buyIn,
          },
        });
      }

      // Record event for audit trail
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        entry.id,
        AggregateType.PLAYER,
        'PlayerRegistered',
        {
          entryId: entry.id,
          tournamentId: input.tournamentId,
          playerId: player?.id,
          displayName: input.displayName,
          buyIn: input.buyIn,
          startingStack: tournament.startingStack,
        },
        {
          userId: ctx.user.id,
          tournamentId: input.tournamentId,
        }
      );

      return entry;
    }),

  list: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      status: z.nativeEnum(EntryStatus).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const entries = await ctx.prisma.entry.findMany({
        where: {
          tournamentId: input.tournamentId,
          ...(input.status && { status: input.status }),
        },
        include: {
          player: true,
          table: true,
          seat: true,
        },
        orderBy: [
          { status: 'asc' },
          { chipCount: 'desc' },
        ],
      });

      return entries;
    }),

  eliminate: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      entryId: z.string(),
      place: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission - PLAYER_MANAGEMENT includes DISPLAY and STAFF roles
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.PLAYER_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to eliminate players',
        });
      }

      // Update entry
      const entry = await ctx.prisma.entry.update({
        where: { id: input.entryId },
        data: {
          status: EntryStatus.ELIMINATED,
          position: input.place,
          eliminatedAt: new Date(),
        },
      });

      // Create elimination record
      await ctx.prisma.elimination.create({
        data: {
          tournamentId: input.tournamentId,
          entryId: input.entryId,
          place: input.place,
        },
      });

      // Free the seat
      await ctx.prisma.seat.updateMany({
        where: { entryId: input.entryId },
        data: { entryId: null },
      });

      return entry;
    }),

  rebuy: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      entryId: z.string(),
      amount: z.number(),
      chips: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission - PLAYER_MANAGEMENT includes DISPLAY and STAFF roles
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.PLAYER_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to process rebuys',
        });
      }

      // Update chip count
      const entry = await ctx.prisma.entry.update({
        where: { id: input.entryId },
        data: {
          chipCount: {
            increment: input.chips,
          },
        },
      });

      // Record transaction
      await ctx.prisma.transaction.create({
        data: {
          tournamentId: input.tournamentId,
          entryId: input.entryId,
          type: TransactionType.REBUY,
          amount: input.amount,
        },
      });

      return entry;
    }),

  // Player profile management
  createPlayer: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      ...playerCreateSchema.shape,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.PLAYER_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create players',
        });
      }

      const { organizationId, ...playerData } = input;

      const player = await ctx.prisma.player.create({
        data: playerData,
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        organizationId,
        player.id,
        AggregateType.PLAYER,
        'PlayerCreated',
        {
          playerId: player.id,
          email: player.email,
          firstName: player.firstName,
          lastName: player.lastName,
        },
        {
          userId: ctx.user.id,
        }
      );

      return player;
    }),

  updatePlayer: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      playerId: z.string(),
      ...playerUpdateSchema.shape,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.PLAYER_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update players',
        });
      }

      const { organizationId, playerId, ...updateData } = input;

      const player = await ctx.prisma.player.update({
        where: { id: playerId },
        data: updateData,
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        organizationId,
        playerId,
        AggregateType.PLAYER,
        'PlayerUpdated',
        {
          playerId,
          changes: Object.keys(updateData),
        },
        {
          userId: ctx.user.id,
        }
      );

      return player;
    }),

  getPlayer: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      playerId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const player = await ctx.prisma.player.findUnique({
        where: { id: input.playerId },
        include: {
          entries: {
            include: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  status: true,
                },
              },
            },
            orderBy: {
              registeredAt: 'desc',
            },
          },
        },
      });

      if (!player) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Player not found',
        });
      }

      return player;
    }),

  searchPlayers: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      query: z.string().min(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const players = await ctx.prisma.player.findMany({
        where: {
          OR: [
            { firstName: { contains: input.query, mode: 'insensitive' } },
            { lastName: { contains: input.query, mode: 'insensitive' } },
            { nickname: { contains: input.query, mode: 'insensitive' } },
            { email: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        take: input.limit,
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
      });

      return players;
    }),

  // Entry management
  updateEntry: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      entryId: z.string(),
      displayName: z.string().optional(),
      chipCount: z.number().min(0).optional(),
      status: z.nativeEnum(EntryStatus).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.PLAYER_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update entries',
        });
      }

      const { organizationId, entryId, ...updateData } = input;

      // Verify entry access
      const entry = await ctx.prisma.entry.findFirst({
        where: {
          id: entryId,
          tournament: {
            organizationId,
          },
        },
        include: {
          tournament: true,
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Entry not found',
        });
      }

      const updatedEntry = await ctx.prisma.entry.update({
        where: { id: entryId },
        data: updateData,
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        organizationId,
        entryId,
        AggregateType.PLAYER,
        'EntryUpdated',
        {
          entryId,
          tournamentId: entry.tournamentId,
          changes: Object.keys(updateData),
          updateData,
        },
        {
          userId: ctx.user.id,
          tournamentId: entry.tournamentId,
        }
      );

      return updatedEntry;
    }),

  removeEntry: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      entryId: z.string(),
      refund: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.PLAYER_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to remove entries',
        });
      }

      // Verify entry access
      const entry = await ctx.prisma.entry.findFirst({
        where: {
          id: input.entryId,
          tournament: {
            organizationId: input.organizationId,
          },
        },
        include: {
          tournament: true,
          transactions: true,
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Entry not found',
        });
      }

      const updatedEntry = await ctx.prisma.$transaction(async (tx) => {
        // Update entry status
        const updated = await tx.entry.update({
          where: { id: input.entryId },
          data: {
            status: EntryStatus.WITHDRAWN,
            eliminatedAt: new Date(),
          },
        });

        // Free up the seat
        await tx.seat.updateMany({
          where: { entryId: input.entryId },
          data: { entryId: null },
        });

        // Handle refund if requested
        if (input.refund) {
          const totalPaid = entry.transactions
            .filter(t => ['BUYIN', 'REBUY', 'ADDON'].includes(t.type))
            .reduce((sum, t) => sum + t.amount, 0);

          if (totalPaid > 0) {
            await tx.transaction.create({
              data: {
                tournamentId: entry.tournamentId,
                entryId: input.entryId,
                type: TransactionType.CASHOUT,
                amount: -totalPaid, // Negative amount for refund
              },
            });
          }
        }

        return updated;
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.entryId,
        AggregateType.PLAYER,
        'EntryRemoved',
        {
          entryId: input.entryId,
          tournamentId: entry.tournamentId,
          refunded: input.refund,
        },
        {
          userId: ctx.user.id,
          tournamentId: entry.tournamentId,
        }
      );

      return updatedEntry;
    }),

  // Seat assignment
  assignSeat: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      entryId: z.string(),
      tableId: z.string(),
      seatNumber: z.number().min(1).max(10),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TABLE_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to assign seats',
        });
      }

      // Verify entry and table access
      const [entry, table] = await Promise.all([
        ctx.prisma.entry.findFirst({
          where: {
            id: input.entryId,
            tournament: {
              organizationId: input.organizationId,
            },
          },
        }),
        ctx.prisma.table.findFirst({
          where: {
            id: input.tableId,
            tournament: {
              organizationId: input.organizationId,
            },
          },
        }),
      ]);

      if (!entry || !table) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Entry or table not found',
        });
      }

      // Check if seat is available
      const existingSeat = await ctx.prisma.seat.findFirst({
        where: {
          tableId: input.tableId,
          seatNumber: input.seatNumber,
        },
      });

      if (existingSeat?.entryId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Seat is already occupied',
        });
      }

      const seat = await ctx.prisma.$transaction(async (tx) => {
        // Clear any existing seat assignment for this entry
        await tx.seat.updateMany({
          where: { entryId: input.entryId },
          data: { entryId: null },
        });

        // Update entry with table assignment
        await tx.entry.update({
          where: { id: input.entryId },
          data: {
            tableId: input.tableId,
            seatNumber: input.seatNumber,
          },
        });

        // Assign the seat
        return tx.seat.upsert({
          where: {
            tableId_seatNumber: {
              tableId: input.tableId,
              seatNumber: input.seatNumber,
            },
          },
          update: {
            entryId: input.entryId,
          },
          create: {
            tableId: input.tableId,
            seatNumber: input.seatNumber,
            entryId: input.entryId,
          },
        });
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.entryId,
        AggregateType.PLAYER,
        'SeatAssigned',
        {
          entryId: input.entryId,
          tableId: input.tableId,
          seatNumber: input.seatNumber,
        },
        {
          userId: ctx.user.id,
          tournamentId: entry.tournamentId,
        }
      );

      return seat;
    }),

  // Chip count management
  updateChipCount: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      entryId: z.string(),
      chipCount: z.number().min(0),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TOURNAMENT_OPERATIONS)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update chip counts',
        });
      }

      // Verify entry access
      const entry = await ctx.prisma.entry.findFirst({
        where: {
          id: input.entryId,
          tournament: {
            organizationId: input.organizationId,
          },
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Entry not found',
        });
      }

      const previousChipCount = entry.chipCount;

      const updatedEntry = await ctx.prisma.entry.update({
        where: { id: input.entryId },
        data: {
          chipCount: input.chipCount,
        },
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.entryId,
        AggregateType.PLAYER,
        'ChipCountUpdated',
        {
          entryId: input.entryId,
          tournamentId: entry.tournamentId,
          previousChipCount,
          newChipCount: input.chipCount,
          reason: input.reason,
        },
        {
          userId: ctx.user.id,
          tournamentId: entry.tournamentId,
        }
      );

      return updatedEntry;
    }),

  // Player history and statistics
  getPlayerHistory: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      playerId: z.string(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const entries = await ctx.prisma.entry.findMany({
        where: {
          playerId: input.playerId,
          tournament: {
            organizationId: input.organizationId,
          },
        },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              startDate: true,
              buyIn: true,
              status: true,
            },
          },
          eliminations: true,
          transactions: true,
        },
        orderBy: {
          registeredAt: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      });

      // Calculate statistics
      const stats = {
        totalTournaments: entries.length,
        totalBuyIns: entries.reduce((sum, entry) =>
          sum + entry.transactions
            .filter(t => t.type === TransactionType.BUYIN)
            .reduce((tSum, t) => tSum + t.amount, 0), 0
        ),
        averageFinish: entries.filter(e => e.position).length > 0
          ? entries.filter(e => e.position).reduce((sum, e) => sum + (e.position || 0), 0) / entries.filter(e => e.position).length
          : null,
        bestFinish: Math.min(...entries.filter(e => e.position).map(e => e.position || Infinity)) || null,
      };

      return {
        entries,
        stats,
      };
    }),
});