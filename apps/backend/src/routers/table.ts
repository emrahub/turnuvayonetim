import { router, organizationProcedure, hasRole } from '../utils/trpc';
import { z } from 'zod';
import { TableStatus, EntryStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { ROLE_PERMISSIONS } from '../middleware/auth';
import { EventStoreFactory, AggregateType } from '../services/event-store';

// Validation schemas
const tableCreateSchema = z.object({
  organizationId: z.string(),
  tournamentId: z.string(),
  tableNumber: z.number().min(1),
  maxSeats: z.number().min(2).max(10).default(9),
  name: z.string().optional(),
});

const balanceConfigSchema = z.object({
  maxPlayersPerTable: z.number().min(4).max(10).default(9),
  minPlayersPerTable: z.number().min(2).max(8).default(6),
  balanceThreshold: z.number().min(1).max(5).default(2),
});

export const tableRouter = router({
  create: organizationProcedure
    .input(tableCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // Check permission - TABLE_MANAGEMENT includes STAFF role
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TABLE_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create tables',
        });
      }

      // Verify tournament access
      const tournament = await ctx.prisma.tournament.findFirst({
        where: {
          id: input.tournamentId,
          organizationId: input.organizationId,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        });
      }

      // Check if table number already exists
      const existingTable = await ctx.prisma.table.findFirst({
        where: {
          tournamentId: input.tournamentId,
          tableNumber: input.tableNumber,
        },
      });

      if (existingTable) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Table number already exists',
        });
      }

      // Create table with seats in transaction
      const result = await ctx.prisma.$transaction(async (tx) => {
        const table = await tx.table.create({
          data: {
            tournamentId: input.tournamentId,
            tableNumber: input.tableNumber,
            maxSeats: input.maxSeats,
            status: TableStatus.ACTIVE,
          },
        });

        // Create seats
        const seats = await tx.seat.createMany({
          data: Array.from({ length: input.maxSeats }, (_, i) => ({
            tableId: table.id,
            seatNumber: i + 1,
          })),
        });

        return { table, seatCount: seats.count };
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        result.table.id,
        AggregateType.TABLE,
        'TableCreated',
        {
          tableId: result.table.id,
          tournamentId: input.tournamentId,
          tableNumber: input.tableNumber,
          maxSeats: input.maxSeats,
        },
        {
          userId: ctx.user.id,
          tournamentId: input.tournamentId,
        }
      );

      return result;
    }),

  list: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const tables = await ctx.prisma.table.findMany({
        where: {
          tournamentId: input.tournamentId,
        },
        include: {
          seats: {
            include: {
              entry: true,
            },
            orderBy: { seatNumber: 'asc' },
          },
          _count: {
            select: {
              entries: true,
            },
          },
        },
        orderBy: { tableNumber: 'asc' },
      });

      return tables;
    }),

  assignSeat: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      entryId: z.string(),
      tableId: z.string(),
      seatNumber: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission - TABLE_MANAGEMENT includes STAFF role
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TABLE_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to assign seats',
        });
      }

      // Check if seat is available
      const seat = await ctx.prisma.seat.findUnique({
        where: {
          tableId_seatNumber: {
            tableId: input.tableId,
            seatNumber: input.seatNumber,
          },
        },
      });

      if (!seat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Seat not found',
        });
      }

      if (seat.entryId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Seat is already occupied',
        });
      }

      // Free any previous seat
      await ctx.prisma.seat.updateMany({
        where: { entryId: input.entryId },
        data: { entryId: null },
      });

      // Assign new seat
      const updatedSeat = await ctx.prisma.seat.update({
        where: { id: seat.id },
        data: { entryId: input.entryId },
      });

      // Update entry
      await ctx.prisma.entry.update({
        where: { id: input.entryId },
        data: {
          tableId: input.tableId,
          seatNumber: input.seatNumber,
          status: 'ACTIVE',
        },
      });

      return updatedSeat;
    }),

  balance: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permission - TABLE_MANAGEMENT includes STAFF role
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TABLE_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to balance tables',
        });
      }

      // Get all tables with their player counts
      const tables = await ctx.prisma.table.findMany({
        where: {
          tournamentId: input.tournamentId,
          status: TableStatus.ACTIVE,
        },
        include: {
          seats: {
            include: {
              entry: true,
            },
          },
        },
      });

      // Calculate player distribution
      const tableCounts = tables.map(table => ({
        id: table.id,
        count: table.seats.filter(s => s.entry).length,
        seats: table.seats,
      }));

      const totalPlayers = tableCounts.reduce((sum, t) => sum + t.count, 0);
      const avgPlayers = Math.floor(totalPlayers / tables.length);

      // Find imbalanced tables
      const moves = [];
      const overloaded = tableCounts.filter(t => t.count > avgPlayers + 1);
      const underloaded = tableCounts.filter(t => t.count < avgPlayers);

      // Create balancing moves
      for (const over of overloaded) {
        for (const under of underloaded) {
          if (over.count > avgPlayers + 1 && under.count < avgPlayers) {
            const playerSeat = over.seats.find(s => s.entry);
            const emptySeat = under.seats.find(s => !s.entry);

            if (playerSeat && emptySeat) {
              moves.push({
                entryId: playerSeat.entryId,
                fromSeatId: playerSeat.id,
                toSeatId: emptySeat.id,
              });

              over.count--;
              under.count++;
            }
          }
        }
      }

      // Execute moves
      for (const move of moves) {
        await ctx.prisma.seat.update({
          where: { id: move.fromSeatId },
          data: { entryId: null },
        });

        await ctx.prisma.seat.update({
          where: { id: move.toSeatId },
          data: { entryId: move.entryId },
        });
      }

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.tournamentId,
        AggregateType.TABLE,
        'TablesBalanced',
        {
          tournamentId: input.tournamentId,
          movesExecuted: moves.length,
          tableCount: tables.length,
        },
        {
          userId: ctx.user.id,
          tournamentId: input.tournamentId,
        }
      );

      return { moves: moves.length };
    }),

  // Table management
  update: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tableId: z.string(),
      tableNumber: z.number().optional(),
      maxSeats: z.number().min(2).max(10).optional(),
      status: z.nativeEnum(TableStatus).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TABLE_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update tables',
        });
      }

      const { organizationId, tableId, ...updateData } = input;

      // Verify table access
      const table = await ctx.prisma.table.findFirst({
        where: {
          id: tableId,
          tournament: {
            organizationId,
          },
        },
        include: {
          tournament: true,
        },
      });

      if (!table) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Table not found',
        });
      }

      // Check table number conflict if updating
      if (updateData.tableNumber && updateData.tableNumber !== table.tableNumber) {
        const existingTable = await ctx.prisma.table.findFirst({
          where: {
            tournamentId: table.tournamentId,
            tableNumber: updateData.tableNumber,
            id: { not: tableId },
          },
        });

        if (existingTable) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Table number already exists',
          });
        }
      }

      const updatedTable = await ctx.prisma.table.update({
        where: { id: tableId },
        data: updateData,
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        organizationId,
        tableId,
        AggregateType.TABLE,
        'TableUpdated',
        {
          tableId,
          tournamentId: table.tournamentId,
          changes: Object.keys(updateData),
          updateData,
        },
        {
          userId: ctx.user.id,
          tournamentId: table.tournamentId,
        }
      );

      return updatedTable;
    }),

  delete: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tableId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.ADMIN_ONLY)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete tables',
        });
      }

      // Verify table access and check for players
      const table = await ctx.prisma.table.findFirst({
        where: {
          id: input.tableId,
          tournament: {
            organizationId: input.organizationId,
          },
        },
        include: {
          tournament: true,
          seats: {
            include: {
              entry: true,
            },
          },
        },
      });

      if (!table) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Table not found',
        });
      }

      // Check if table has active players
      const activePlayers = table.seats.filter(seat =>
        seat.entry && seat.entry.status === EntryStatus.ACTIVE
      );

      if (activePlayers.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete table with active players',
        });
      }

      await ctx.prisma.table.delete({
        where: { id: input.tableId },
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.tableId,
        AggregateType.TABLE,
        'TableDeleted',
        {
          tableId: input.tableId,
          tournamentId: table.tournamentId,
          tableNumber: table.tableNumber,
        },
        {
          userId: ctx.user.id,
          tournamentId: table.tournamentId,
        }
      );

      return { success: true };
    }),

  get: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tableId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const table = await ctx.prisma.table.findFirst({
        where: {
          id: input.tableId,
          tournament: {
            organizationId: input.organizationId,
          },
        },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          seats: {
            include: {
              entry: {
                include: {
                  player: true,
                },
              },
            },
            orderBy: { seatNumber: 'asc' },
          },
          entries: {
            where: {
              status: EntryStatus.ACTIVE,
            },
            include: {
              player: true,
            },
          },
        },
      });

      if (!table) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Table not found',
        });
      }

      // Calculate table statistics
      const activeSeats = table.seats.filter(seat => seat.entry?.status === EntryStatus.ACTIVE);
      const totalChips = activeSeats.reduce((sum, seat) => sum + (seat.entry?.chipCount || 0), 0);
      const averageChips = activeSeats.length > 0 ? Math.floor(totalChips / activeSeats.length) : 0;

      return {
        ...table,
        stats: {
          activePlayers: activeSeats.length,
          totalChips,
          averageChips,
          occupancyRate: (activeSeats.length / table.maxSeats) * 100,
        },
      };
    }),

  // Advanced table operations
  breakTable: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tableId: z.string(),
      redistributePlayers: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TABLE_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to break tables',
        });
      }

      // Get table with players
      const table = await ctx.prisma.table.findFirst({
        where: {
          id: input.tableId,
          tournament: {
            organizationId: input.organizationId,
          },
        },
        include: {
          tournament: true,
          seats: {
            include: {
              entry: true,
            },
            where: {
              entry: {
                status: EntryStatus.ACTIVE,
              },
            },
          },
        },
      });

      if (!table) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Table not found',
        });
      }

      const activePlayers = table.seats.filter(seat => seat.entry);

      const result = await ctx.prisma.$transaction(async (tx) => {
        // Mark table as breaking
        await tx.table.update({
          where: { id: input.tableId },
          data: { status: TableStatus.BREAKING },
        });

        // Clear all seats
        await tx.seat.updateMany({
          where: { tableId: input.tableId },
          data: { entryId: null },
        });

        // Clear entry table assignments
        await tx.entry.updateMany({
          where: { tableId: input.tableId },
          data: {
            tableId: null,
            seatNumber: null,
          },
        });

        if (input.redistributePlayers && activePlayers.length > 0) {
          // Find available seats in other tables
          const availableTables = await tx.table.findMany({
            where: {
              tournamentId: table.tournamentId,
              status: TableStatus.ACTIVE,
              id: { not: input.tableId },
            },
            include: {
              seats: {
                where: { entryId: null },
                orderBy: { seatNumber: 'asc' },
              },
            },
          });

          const allAvailableSeats = availableTables.flatMap(t =>
            t.seats.map(seat => ({ ...seat, tableId: t.id, tableNumber: t.tableNumber }))
          );

          // Redistribute players
          for (let i = 0; i < activePlayers.length && i < allAvailableSeats.length; i++) {
            const player = activePlayers[i];
            const newSeat = allAvailableSeats[i];

            await tx.seat.update({
              where: { id: newSeat.id },
              data: { entryId: player.entryId },
            });

            await tx.entry.update({
              where: { id: player.entryId! },
              data: {
                tableId: newSeat.tableId,
                seatNumber: newSeat.seatNumber,
              },
            });
          }
        }

        return {
          redistributedPlayers: input.redistributePlayers ? activePlayers.length : 0,
        };
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.tableId,
        AggregateType.TABLE,
        'TableBroken',
        {
          tableId: input.tableId,
          tournamentId: table.tournamentId,
          tableNumber: table.tableNumber,
          playerCount: activePlayers.length,
          redistributed: input.redistributePlayers,
        },
        {
          userId: ctx.user.id,
          tournamentId: table.tournamentId,
        }
      );

      return result;
    }),

  consolidateTables: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
      targetTableCount: z.number().min(1).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TABLE_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to consolidate tables',
        });
      }

      // Get all active tables with player counts
      const tables = await ctx.prisma.table.findMany({
        where: {
          tournamentId: input.tournamentId,
          tournament: {
            organizationId: input.organizationId,
          },
          status: TableStatus.ACTIVE,
        },
        include: {
          seats: {
            include: {
              entry: {
                where: {
                  status: EntryStatus.ACTIVE,
                },
              },
            },
          },
        },
        orderBy: { tableNumber: 'asc' },
      });

      const totalActivePlayers = tables.reduce((sum, table) =>
        sum + table.seats.filter(seat => seat.entry).length, 0
      );

      const maxPlayersPerTable = Math.max(...tables.map(t => t.maxSeats));
      const minTablesNeeded = Math.ceil(totalActivePlayers / maxPlayersPerTable);
      const targetTables = input.targetTableCount || minTablesNeeded;

      if (targetTables >= tables.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Target table count must be less than current table count',
        });
      }

      // Sort tables by player count (ascending) to identify tables to break
      const tablesByPlayerCount = tables
        .map(table => ({
          ...table,
          playerCount: table.seats.filter(seat => seat.entry).length,
        }))
        .sort((a, b) => a.playerCount - b.playerCount);

      const tablesToBreak = tablesByPlayerCount.slice(0, tables.length - targetTables);
      const tablesToKeep = tablesByPlayerCount.slice(tables.length - targetTables);

      let redistributedPlayers = 0;

      // Break tables and redistribute players
      for (const tableToBreak of tablesToBreak) {
        const activePlayers = tableToBreak.seats.filter(seat => seat.entry);

        await ctx.prisma.$transaction(async (tx) => {
          // Mark table as broken
          await tx.table.update({
            where: { id: tableToBreak.id },
            data: { status: TableStatus.BROKEN },
          });

          // Clear seats
          await tx.seat.updateMany({
            where: { tableId: tableToBreak.id },
            data: { entryId: null },
          });

          // Find available seats in remaining tables
          for (const player of activePlayers) {
            let seatAssigned = false;

            for (const keepTable of tablesToKeep) {
              const availableSeat = await tx.seat.findFirst({
                where: {
                  tableId: keepTable.id,
                  entryId: null,
                },
                orderBy: { seatNumber: 'asc' },
              });

              if (availableSeat) {
                await tx.seat.update({
                  where: { id: availableSeat.id },
                  data: { entryId: player.entryId },
                });

                await tx.entry.update({
                  where: { id: player.entryId! },
                  data: {
                    tableId: keepTable.id,
                    seatNumber: availableSeat.seatNumber,
                  },
                });

                redistributedPlayers++;
                seatAssigned = true;
                break;
              }
            }

            if (!seatAssigned) {
              // This shouldn't happen if calculations are correct
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Unable to find seat for player during consolidation',
              });
            }
          }
        });
      }

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.tournamentId,
        AggregateType.TABLE,
        'TablesConsolidated',
        {
          tournamentId: input.tournamentId,
          tablesRemoved: tablesToBreak.length,
          playersRedistributed: redistributedPlayers,
          finalTableCount: targetTables,
        },
        {
          userId: ctx.user.id,
          tournamentId: input.tournamentId,
        }
      );

      return {
        tablesRemoved: tablesToBreak.length,
        playersRedistributed: redistributedPlayers,
        finalTableCount: targetTables,
      };
    }),

  // Player movement between tables
  movePlayer: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      entryId: z.string(),
      fromTableId: z.string(),
      toTableId: z.string(),
      toSeatNumber: z.number().min(1).max(10),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.TABLE_MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to move players',
        });
      }

      // Verify entry and tables
      const [entry, fromTable, toTable] = await Promise.all([
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
            id: input.fromTableId,
            tournament: {
              organizationId: input.organizationId,
            },
          },
        }),
        ctx.prisma.table.findFirst({
          where: {
            id: input.toTableId,
            tournament: {
              organizationId: input.organizationId,
            },
          },
        }),
      ]);

      if (!entry || !fromTable || !toTable) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Entry or table not found',
        });
      }

      // Check if target seat is available
      const targetSeat = await ctx.prisma.seat.findFirst({
        where: {
          tableId: input.toTableId,
          seatNumber: input.toSeatNumber,
        },
      });

      if (!targetSeat) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target seat not found',
        });
      }

      if (targetSeat.entryId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Target seat is occupied',
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        // Clear current seat
        await tx.seat.updateMany({
          where: { entryId: input.entryId },
          data: { entryId: null },
        });

        // Assign new seat
        await tx.seat.update({
          where: { id: targetSeat.id },
          data: { entryId: input.entryId },
        });

        // Update entry
        await tx.entry.update({
          where: { id: input.entryId },
          data: {
            tableId: input.toTableId,
            seatNumber: input.toSeatNumber,
          },
        });
      });

      // Record event
      const eventStore = EventStoreFactory.getInstance();
      await eventStore.append(
        input.organizationId,
        input.entryId,
        AggregateType.TABLE,
        'PlayerMoved',
        {
          entryId: input.entryId,
          fromTableId: input.fromTableId,
          toTableId: input.toTableId,
          toSeatNumber: input.toSeatNumber,
          fromTableNumber: fromTable.tableNumber,
          toTableNumber: toTable.tableNumber,
        },
        {
          userId: ctx.user.id,
          tournamentId: entry.tournamentId,
        }
      );

      return { success: true };
    }),

  // Real-time table status
  getTableStatus: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      tournamentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const tables = await ctx.prisma.table.findMany({
        where: {
          tournamentId: input.tournamentId,
          tournament: {
            organizationId: input.organizationId,
          },
        },
        include: {
          seats: {
            include: {
              entry: {
                where: {
                  status: EntryStatus.ACTIVE,
                },
                select: {
                  id: true,
                  displayName: true,
                  chipCount: true,
                  status: true,
                },
              },
            },
            orderBy: { seatNumber: 'asc' },
          },
        },
        orderBy: { tableNumber: 'asc' },
      });

      // Calculate statistics for each table
      const tablesWithStats = tables.map(table => {
        const activePlayers = table.seats.filter(seat => seat.entry);
        const totalChips = activePlayers.reduce((sum, seat) => sum + (seat.entry?.chipCount || 0), 0);
        const averageChips = activePlayers.length > 0 ? Math.floor(totalChips / activePlayers.length) : 0;

        return {
          ...table,
          stats: {
            activePlayers: activePlayers.length,
            totalChips,
            averageChips,
            occupancyRate: (activePlayers.length / table.maxSeats) * 100,
            isBalanced: activePlayers.length >= Math.floor(table.maxSeats * 0.6),
          },
        };
      });

      // Overall tournament table statistics
      const totalActivePlayers = tablesWithStats.reduce((sum, table) => sum + table.stats.activePlayers, 0);
      const averagePlayersPerTable = tables.length > 0 ? totalActivePlayers / tables.length : 0;
      const imbalancedTables = tablesWithStats.filter(table =>
        Math.abs(table.stats.activePlayers - averagePlayersPerTable) > 1
      );

      return {
        tables: tablesWithStats,
        summary: {
          totalTables: tables.length,
          activeTables: tables.filter(t => t.status === TableStatus.ACTIVE).length,
          totalActivePlayers,
          averagePlayersPerTable: Math.round(averagePlayersPerTable * 100) / 100,
          imbalancedTables: imbalancedTables.length,
          needsRebalancing: imbalancedTables.length > 0,
        },
      };
    }),
});