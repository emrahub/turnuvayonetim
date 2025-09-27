import { Player } from '../stores/tournamentStore';
import { Table, Seat, SeatingRule, SeatingAlgorithm } from '../types/seating';

export class SeatingUtils {
  /**
   * Calculate optimal table configuration for given number of players
   */
  static calculateOptimalTableConfiguration(playerCount: number, rules: SeatingRule[]) {
    const maxPlayersPerTable = rules.find(r => r.type === 'max_players_per_table')?.value || 9;
    const minPlayersPerTable = rules.find(r => r.type === 'min_players_per_table')?.value || 6;

    // Calculate ideal players per table to minimize variance
    let playersPerTable = Math.min(maxPlayersPerTable, Math.max(minPlayersPerTable,
      Math.floor(playerCount / Math.ceil(playerCount / maxPlayersPerTable))));

    const tableCount = Math.ceil(playerCount / playersPerTable);

    return {
      tableCount,
      playersPerTable,
      configuration: this.getTableTypeFromPlayerCount(playersPerTable)
    };
  }

  /**
   * Get table type based on player count
   */
  static getTableTypeFromPlayerCount(playerCount: number): Table['type'] {
    if (playerCount <= 2) return 'heads-up';
    if (playerCount <= 6) return '6-max';
    if (playerCount <= 9) return '9-max';
    return '10-max';
  }

  /**
   * Calculate table balance variance
   */
  static calculateTableBalance(tables: Table[]) {
    const activeTables = tables.filter(t => t.status === 'active');
    if (activeTables.length === 0) return { balanced: true, variance: 0, suggestions: [] };

    const playerCounts = activeTables.map(table =>
      table.seats.filter(s => !s.isEmpty).length
    );

    const maxPlayers = Math.max(...playerCounts);
    const minPlayers = Math.min(...playerCounts);
    const variance = maxPlayers - minPlayers;
    const averagePlayers = playerCounts.reduce((sum, count) => sum + count, 0) / playerCounts.length;

    const suggestions = [];
    if (variance > 2) {
      suggestions.push(`High variance (${variance}). Consider rebalancing tables.`);
    }
    if (minPlayers < 6 && activeTables.length > 1) {
      suggestions.push(`Table with ${minPlayers} players should be broken.`);
    }

    return {
      balanced: variance <= 1,
      variance,
      averagePlayers: Math.round(averagePlayers * 10) / 10,
      maxPlayers,
      minPlayers,
      suggestions
    };
  }

  /**
   * Generate seating assignment using specified algorithm
   */
  static generateSeatingAssignment(
    players: Player[],
    tables: Table[],
    algorithm: SeatingAlgorithm
  ): { tableId: string; seatNumber: number; playerId: string }[] {
    const assignments: { tableId: string; seatNumber: number; playerId: string }[] = [];
    const availableSeats = this.getAvailableSeats(tables);
    let playersToAssign = [...players.filter(p => p.status === 'active')];

    switch (algorithm.type) {
      case 'random':
        playersToAssign = this.shuffleArray(playersToAssign);
        break;

      case 'chip_stack':
        playersToAssign.sort((a, b) => b.chipCount - a.chipCount);
        break;

      case 'balanced':
        playersToAssign = this.balancedSort(playersToAssign);
        break;

      case 'snake_draft':
        playersToAssign.sort((a, b) => b.chipCount - a.chipCount);
        return this.snakeDraftAssignment(playersToAssign, tables);
    }

    // Round-robin assignment
    let seatIndex = 0;
    for (const player of playersToAssign) {
      if (seatIndex < availableSeats.length) {
        const seat = availableSeats[seatIndex];
        assignments.push({
          tableId: seat.tableId,
          seatNumber: seat.number,
          playerId: player.id
        });
        seatIndex++;
      }
    }

    return assignments;
  }

  /**
   * Snake draft assignment for balanced chip distribution
   */
  static snakeDraftAssignment(players: Player[], tables: Table[]) {
    const assignments: { tableId: string; seatNumber: number; playerId: string }[] = [];
    const tableQueues = tables.map(table => ({
      tableId: table.id,
      seats: table.seats.filter(s => s.isEmpty).map(s => s.number),
      direction: 1
    }));

    let playerIndex = 0;
    let tableIndex = 0;

    while (playerIndex < players.length) {
      const currentTable = tableQueues[tableIndex];

      if (currentTable.seats.length > 0) {
        const seatNumber = currentTable.direction === 1
          ? currentTable.seats.shift()!
          : currentTable.seats.pop()!;

        assignments.push({
          tableId: currentTable.tableId,
          seatNumber,
          playerId: players[playerIndex].id
        });

        playerIndex++;
      }

      // Move to next table and potentially reverse direction
      tableIndex++;
      if (tableIndex >= tableQueues.length) {
        tableIndex = 0;
        tableQueues.forEach(queue => queue.direction *= -1); // Reverse direction for snake pattern
      }
    }

    return assignments;
  }

  /**
   * Get all available seats across tables
   */
  static getAvailableSeats(tables: Table[]) {
    const seats: { tableId: string; number: number }[] = [];

    tables.forEach(table => {
      if (table.status === 'active') {
        table.seats.forEach(seat => {
          if (seat.isEmpty) {
            seats.push({ tableId: table.id, number: seat.number });
          }
        });
      }
    });

    return seats;
  }

  /**
   * Balanced sorting that distributes similar chip stacks
   */
  static balancedSort(players: Player[]): Player[] {
    // Group players by chip count ranges
    const ranges = [
      { min: 0, max: 5000, players: [] as Player[] },
      { min: 5001, max: 10000, players: [] as Player[] },
      { min: 10001, max: 15000, players: [] as Player[] },
      { min: 15001, max: Infinity, players: [] as Player[] }
    ];

    players.forEach(player => {
      const range = ranges.find(r => player.chipCount >= r.min && player.chipCount <= r.max);
      if (range) range.players.push(player);
    });

    // Shuffle within each range and interleave
    const result: Player[] = [];
    ranges.forEach(range => {
      range.players = this.shuffleArray(range.players);
    });

    const maxLength = Math.max(...ranges.map(r => r.players.length));
    for (let i = 0; i < maxLength; i++) {
      ranges.forEach(range => {
        if (range.players[i]) {
          result.push(range.players[i]);
        }
      });
    }

    return result;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Calculate chip distribution statistics
   */
  static calculateChipDistribution(players: Player[]) {
    const activePlayers = players.filter(p => p.status === 'active');
    if (activePlayers.length === 0) return null;

    const chipCounts = activePlayers.map(p => p.chipCount).sort((a, b) => a - b);
    const totalChips = chipCounts.reduce((sum, count) => sum + count, 0);
    const averageStack = totalChips / activePlayers.length;

    const median = chipCounts.length % 2 === 0
      ? (chipCounts[chipCounts.length / 2 - 1] + chipCounts[chipCounts.length / 2]) / 2
      : chipCounts[Math.floor(chipCounts.length / 2)];

    // Calculate standard deviation
    const variance = chipCounts.reduce((sum, count) =>
      sum + Math.pow(count - averageStack, 2), 0) / activePlayers.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      totalChips,
      averageStack: Math.round(averageStack),
      median: Math.round(median),
      standardDeviation: Math.round(standardDeviation),
      min: chipCounts[0],
      max: chipCounts[chipCounts.length - 1],
      q1: Math.round(chipCounts[Math.floor(chipCounts.length * 0.25)]),
      q3: Math.round(chipCounts[Math.floor(chipCounts.length * 0.75)])
    };
  }

  /**
   * Suggest table breaking opportunities
   */
  static suggestTableBreaking(tables: Table[], rules: SeatingRule[]) {
    const minPlayers = rules.find(r => r.type === 'min_players_per_table')?.value || 6;
    const balanceThreshold = rules.find(r => r.type === 'balance_threshold')?.value || 2;

    const suggestions: {
      type: 'break' | 'combine' | 'rebalance';
      tableNumbers: number[];
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }[] = [];

    // Find tables that should be broken
    tables.forEach(table => {
      const occupiedSeats = table.seats.filter(s => !s.isEmpty).length;

      if (occupiedSeats < minPlayers && table.status === 'active') {
        suggestions.push({
          type: 'break',
          tableNumbers: [table.number],
          reason: `Table has only ${occupiedSeats} players (minimum: ${minPlayers})`,
          priority: 'high'
        });
      }
    });

    // Check for rebalancing opportunities
    const activeTables = tables.filter(t => t.status === 'active');
    if (activeTables.length > 1) {
      const playerCounts = activeTables.map(t => ({
        number: t.number,
        count: t.seats.filter(s => !s.isEmpty).length
      }));

      const maxCount = Math.max(...playerCounts.map(pc => pc.count));
      const minCount = Math.min(...playerCounts.map(pc => pc.count));

      if (maxCount - minCount > balanceThreshold) {
        const maxTable = playerCounts.find(pc => pc.count === maxCount)!;
        const minTable = playerCounts.find(pc => pc.count === minCount)!;

        suggestions.push({
          type: 'rebalance',
          tableNumbers: [maxTable.number, minTable.number],
          reason: `Tables have ${maxCount} vs ${minCount} players (threshold: ${balanceThreshold})`,
          priority: 'medium'
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Format chip count for display
   */
  static formatChipCount(chips: number): string {
    if (chips >= 1000000) return `${(chips / 1000000).toFixed(1)}M`;
    if (chips >= 1000) return `${(chips / 1000).toFixed(1)}K`;
    return chips.toString();
  }

  /**
   * Validate seating move
   */
  static validateSeatingMove(
    playerId: string,
    fromTable: number | undefined,
    fromSeat: number | undefined,
    toTable: number,
    toSeat: number,
    tables: Table[],
    players: Player[]
  ): { valid: boolean; reason?: string } {
    const player = players.find(p => p.id === playerId);
    if (!player) return { valid: false, reason: 'Player not found' };

    if (player.status !== 'active') {
      return { valid: false, reason: 'Player is not active' };
    }

    const table = tables.find(t => t.number === toTable);
    if (!table) return { valid: false, reason: 'Target table not found' };

    if (table.status !== 'active') {
      return { valid: false, reason: 'Target table is not active' };
    }

    const seat = table.seats.find(s => s.number === toSeat);
    if (!seat) return { valid: false, reason: 'Target seat not found' };

    if (!seat.isEmpty && seat.player?.id !== playerId) {
      return { valid: false, reason: 'Target seat is occupied' };
    }

    // Additional validations can be added here
    return { valid: true };
  }
}