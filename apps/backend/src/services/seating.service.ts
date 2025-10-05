import { PrismaClient, Entry, Table } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export interface SeatingConfig {
  maxPlayersPerTable: number;
  minPlayersPerTable: number;
  balanceThreshold: number; // Maximum difference in players between tables
}

export interface SeatingResult {
  assignments: Array<{
    entryId: string;
    tableId: string;
    seatNumber: number;
  }>;
  tablesCreated: number;
  totalPlayers: number;
  averagePlayersPerTable: number;
}

export class SeatingService {
  constructor(private prisma: PrismaClient) {}

  async seatPlayers(
    tournamentId: string,
    config: SeatingConfig = {
      maxPlayersPerTable: 9,
      minPlayersPerTable: 6,
      balanceThreshold: 2
    }
  ): Promise<SeatingResult> {
    // Get all active entries for the tournament
    const activeEntries = await this.prisma.entry.findMany({
      where: {
        tournamentId,
        status: { in: ['REGISTERED', 'ACTIVE'] }
      },
      orderBy: [
        { registeredAt: 'asc' }, // FIFO seating
        { id: 'asc' }
      ]
    });

    if (activeEntries.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No active players to seat'
      });
    }

    // Calculate optimal table count
    const tableCount = this.calculateOptimalTableCount(
      activeEntries.length,
      config
    );

    // Create or get existing tables
    const tables = await this.ensureTables(tournamentId, tableCount, config.maxPlayersPerTable);

    // Clear existing seating
    await this.clearExistingSeating(tournamentId);

    // Perform balanced seating
    const assignments = this.balancedSeatingAlgorithm(
      activeEntries,
      tables,
      config
    );

    // Save assignments to database
    await this.saveSeatingAssignments(assignments);

    return {
      assignments,
      tablesCreated: tables.length,
      totalPlayers: activeEntries.length,
      averagePlayersPerTable: activeEntries.length / tables.length
    };
  }

  async rebalanceTables(
    tournamentId: string,
    config: SeatingConfig = {
      maxPlayersPerTable: 9,
      minPlayersPerTable: 6,
      balanceThreshold: 2
    }
  ): Promise<SeatingResult> {
    // Get current table player counts
    const tableStats = await this.getTableStats(tournamentId);

    // Check if rebalancing is needed
    const needsRebalancing = this.needsRebalancing(tableStats, config);

    if (!needsRebalancing) {
      const currentAssignments = await this.getCurrentAssignments(tournamentId);
      return {
        assignments: currentAssignments,
        tablesCreated: tableStats.length,
        totalPlayers: currentAssignments.length,
        averagePlayersPerTable: currentAssignments.length / tableStats.length
      };
    }

    // Perform rebalancing
    return this.seatPlayers(tournamentId, config);
  }

  async eliminatePlayer(entryId: string): Promise<void> {
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: { seat: true }
    });

    if (!entry) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Player entry not found'
      });
    }

    // Update entry status
    await this.prisma.entry.update({
      where: { id: entryId },
      data: {
        status: 'ELIMINATED',
        eliminatedAt: new Date()
      }
    });

    // Clear seat
    if (entry.seat) {
      await this.prisma.seat.update({
        where: { id: entry.seat.id },
        data: { entryId: null }
      });
    }

    // Check if table needs rebalancing
    if (entry.seat) {
      const tableStats = await this.getTableStats(entry.tournamentId);
      const needsRebalancing = this.needsRebalancing(tableStats, {
        maxPlayersPerTable: 9,
        minPlayersPerTable: 6,
        balanceThreshold: 2
      });

      if (needsRebalancing) {
        await this.rebalanceTables(entry.tournamentId);
      }
    }
  }

  private calculateOptimalTableCount(
    playerCount: number,
    config: SeatingConfig
  ): number {
    // Try to keep tables balanced and within player limits
    const maxTables = Math.ceil(playerCount / config.minPlayersPerTable);
    const minTables = Math.ceil(playerCount / config.maxPlayersPerTable);

    // Find the table count that gives the most balanced distribution
    let bestTableCount = minTables;
    let bestImbalance = Infinity;

    for (let tableCount = minTables; tableCount <= maxTables; tableCount++) {
      const basePlayersPerTable = Math.floor(playerCount / tableCount);
      const extraPlayers = playerCount % tableCount;

      const maxPlayersInAnyTable = basePlayersPerTable + (extraPlayers > 0 ? 1 : 0);
      const minPlayersInAnyTable = basePlayersPerTable;
      const imbalance = maxPlayersInAnyTable - minPlayersInAnyTable;

      if (imbalance < bestImbalance &&
          maxPlayersInAnyTable <= config.maxPlayersPerTable &&
          minPlayersInAnyTable >= config.minPlayersPerTable) {
        bestImbalance = imbalance;
        bestTableCount = tableCount;
      }
    }

    return bestTableCount;
  }

  private async ensureTables(
    tournamentId: string,
    tableCount: number,
    maxSeatsPerTable: number
  ): Promise<Table[]> {
    const existingTables = await this.prisma.table.findMany({
      where: { tournamentId },
      orderBy: { tableNumber: 'asc' },
      include: { seats: true }
    });

    const tables: Table[] = [...existingTables];

    // Create additional tables if needed
    for (let i = existingTables.length; i < tableCount; i++) {
      const table = await this.prisma.table.create({
        data: {
          tournamentId,
          tableNumber: i + 1,
          status: 'ACTIVE',
          maxSeats: maxSeatsPerTable
        }
      });

      // Create seats for this table according to configuration
      for (let seatNum = 1; seatNum <= maxSeatsPerTable; seatNum++) {
        await this.prisma.seat.create({
          data: {
            tableId: table.id,
            seatNumber: seatNum
          }
        });
      }

      tables.push(table);
    }

    // Ensure existing tables have enough seats and correct maxSeats
    for (const table of tables.slice(0, tableCount)) {
      if ((table as any).maxSeats && (table as any).maxSeats < maxSeatsPerTable) {
        await this.prisma.table.update({
          where: { id: table.id },
          data: { maxSeats: maxSeatsPerTable }
        });
      }

      const existingSeatCount = existingTables.find(t => t.id === table.id)?.seats?.length ?? 0;
      for (let seatNum = existingSeatCount + 1; seatNum <= maxSeatsPerTable; seatNum++) {
        await this.prisma.seat.upsert({
          where: {
            tableId_seatNumber: {
              tableId: table.id,
              seatNumber: seatNum
            }
          },
          update: {},
          create: {
            tableId: table.id,
            seatNumber: seatNum
          }
        });
      }
    }

    return tables.slice(0, tableCount);
  }

  private async clearExistingSeating(tournamentId: string): Promise<void> {
    // Clear all seat assignments for this tournament
    await this.prisma.seat.updateMany({
      where: {
        table: { tournamentId }
      },
      data: { entryId: null }
    });
  }

  private balancedSeatingAlgorithm(
    entries: Entry[],
    tables: Table[],
    config: SeatingConfig
  ): Array<{ entryId: string; tableId: string; seatNumber: number }> {
    const assignments: Array<{ entryId: string; tableId: string; seatNumber: number }> = [];
    const tableCounts = new Map<string, number>();
    const seatCounters = new Map<string, number>();

    // Initialize counters
    tables.forEach(table => {
      tableCounts.set(table.id, 0);
      seatCounters.set(table.id, 1);
    });

    // Distribute players using round-robin with balance consideration
    for (const entry of entries) {
      // Find table with minimum players that hasn't reached max capacity
      let targetTable = tables[0];
      let minPlayers = Number.POSITIVE_INFINITY;

      for (const table of tables) {
        const currentCount = tableCounts.get(table.id) || 0;
        if (currentCount < minPlayers && currentCount < config.maxPlayersPerTable) {
          targetTable = table;
          minPlayers = currentCount;
        }
      }

      const currentSeat = seatCounters.get(targetTable.id) || 1;

      assignments.push({
        entryId: entry.id,
        tableId: targetTable.id,
        seatNumber: currentSeat
      });

      // Update counters
      tableCounts.set(targetTable.id, (tableCounts.get(targetTable.id) || 0) + 1);
      seatCounters.set(targetTable.id, currentSeat + 1);
    }

    return assignments;
  }

  private async saveSeatingAssignments(
    assignments: Array<{ entryId: string; tableId: string; seatNumber: number }>
  ): Promise<void> {
    for (const assignment of assignments) {
      // Assign the seat
      await this.prisma.seat.updateMany({
        where: {
          tableId: assignment.tableId,
          seatNumber: assignment.seatNumber
        },
        data: {
          entryId: assignment.entryId
        }
      });

      // Update entry with table and seat info and set ACTIVE status
      await this.prisma.entry.update({
        where: { id: assignment.entryId },
        data: {
          tableId: assignment.tableId,
          seatNumber: assignment.seatNumber,
          status: 'ACTIVE'
        }
      });
    }
  }

  private async getTableStats(tournamentId: string) {
    return this.prisma.table.findMany({
      where: { tournamentId },
      include: {
        _count: {
          select: {
            seats: {
              where: {
                entryId: { not: null }
              }
            }
          }
        }
      }
    });
  }

  private async getCurrentAssignments(tournamentId: string) {
    const seats = await this.prisma.seat.findMany({
      where: {
        table: { tournamentId },
        entryId: { not: null }
      },
      include: {
        table: true
      }
    });

    return seats.map(seat => ({
      entryId: seat.entryId!,
      tableId: seat.tableId,
      seatNumber: seat.seatNumber
    }));
  }

  private needsRebalancing(
    tableStats: any[],
    config: SeatingConfig
  ): boolean {
    if (tableStats.length <= 1) return false;

    const playerCounts = tableStats.map(table => table._count.seats);
    const maxPlayers = Math.max(...playerCounts);
    const minPlayers = Math.min(...playerCounts);

    return (maxPlayers - minPlayers) > config.balanceThreshold;
  }
}
