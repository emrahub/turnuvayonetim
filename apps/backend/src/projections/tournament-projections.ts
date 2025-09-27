import { BaseEvent, EventStore } from '../services/event-store';
import { TournamentEventType } from '../events/tournament-events';
import { PlayerEventType } from '../events/player-events';
import { PrismaClient } from '@prisma/client';

// Tournament Projection Interfaces
export interface TournamentProjection {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: string;
  status: string;

  // Configuration
  buyIn: number;
  fee: number;
  stack: number;
  maxPlayers?: number;
  minPlayers: number;
  playersPerTable: number;

  // Timing
  scheduledAt: Date;
  registrationStart?: Date;
  registrationEnd?: Date;
  startedAt?: Date;
  pausedAt?: Date;
  endedAt?: Date;

  // Structure
  blindStructureId?: string;
  payoutSchemeId?: string;
  leagueId?: string;
  seasonId?: string;

  // Current State
  currentLevel: number;
  timeRemaining: number;
  isClockRunning: boolean;
  isPaused: boolean;

  // Player Statistics
  totalRegistered: number;
  confirmedPlayers: number;
  activePlayers: number;
  eliminatedPlayers: number;

  // Financial
  totalPrizePool: number;
  totalFees: number;

  // Tables
  totalTables: number;
  activeTables: number;

  // Chip Statistics
  totalChips: number;
  averageChips: number;
  chipLeader?: {
    playerId: string;
    chipCount: number;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface TournamentPlayerProjection {
  playerId: string;
  playerProfileId: string;
  tournamentId: string;
  entryId: string;
  entryNumber: number;

  // Status
  status: 'REGISTERED' | 'CONFIRMED' | 'PLAYING' | 'ELIMINATED' | 'DISQUALIFIED' | 'CANCELLED';

  // Financial
  buyInAmount: number;
  feeAmount: number;
  totalInvested: number;

  // Seating
  currentTableId?: string;
  currentSeatNumber?: number;
  chipCount: number;

  // Tournament Progress
  registeredAt: Date;
  confirmedAt?: Date;
  eliminatedAt?: Date;
  finalPosition?: number;

  // Rebuys/Addons
  rebuysUsed: number;
  addonsUsed: number;

  // Payout
  prizeMoney?: number;
  payoutReceived?: boolean;

  // Statistics
  playTime?: number; // in minutes

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface TournamentTableProjection {
  tableId: string;
  tournamentId: string;
  tableNumber: number;
  maxSeats: number;
  status: 'WAITING' | 'ACTIVE' | 'BALANCING' | 'BREAKING' | 'FINISHED';

  // Seating
  occupiedSeats: number;
  availableSeats: number;

  // Players
  players: Array<{
    playerId: string;
    seatNumber: number;
    chipCount: number;
    status: string;
  }>;

  // Statistics
  totalChips: number;
  averageChips: number;
  bigBlindSeat?: number;
  smallBlindSeat?: number;

  // Dealer
  dealerId?: string;
  dealerSession?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface TournamentClockProjection {
  tournamentId: string;
  currentLevel: number;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;

  // Level Details
  smallBlind: number;
  bigBlind: number;
  ante: number;
  isBreak: boolean;
  levelDuration: number;

  // Statistics
  playersRemaining: number;
  averageChips: number;
  totalChips: number;

  // Break Information
  breakDuration?: number;
  nextLevel?: {
    level: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    duration: number;
  };

  // Metadata
  lastUpdated: Date;
  version: number;
}

export interface TournamentStatisticsProjection {
  tournamentId: string;

  // Player Statistics
  totalRegistered: number;
  confirmedPlayers: number;
  activePlayers: number;
  eliminatedPlayers: number;

  // Financial Statistics
  totalPrizePool: number;
  totalFees: number;
  averageBuyIn: number;
  totalRebuys: number;
  totalAddons: number;

  // Chip Statistics
  totalChips: number;
  averageChips: number;
  medianChips: number;
  chipLeader: {
    playerId: string;
    chipCount: number;
    percentage: number;
  };
  shortStack: {
    playerId: string;
    chipCount: number;
    bigBlinds: number;
  };

  // Table Statistics
  totalTables: number;
  activeTables: number;
  averagePlayersPerTable: number;

  // Timing Statistics
  duration: number; // in minutes
  averageEliminationTime: number;
  levelsPlayed: number;

  // Recent Activity
  recentEliminations: Array<{
    playerId: string;
    position: number;
    eliminatedAt: Date;
    chipCount: number;
  }>;

  recentRebuys: Array<{
    playerId: string;
    rebuyAt: Date;
    amount: number;
    chipCount: number;
  }>;

  // Metadata
  lastUpdated: Date;
  version: number;
}

// Projection Handlers
export class TournamentProjectionHandler {
  constructor(
    private eventStore: EventStore,
    private prisma: PrismaClient
  ) {}

  // Main tournament projection
  async projectTournament(organizationId: string, tournamentId: string): Promise<TournamentProjection> {
    return this.eventStore.project(
      organizationId,
      tournamentId,
      this.getInitialTournamentState(tournamentId),
      this.tournamentProjector.bind(this)
    );
  }

  private getInitialTournamentState(tournamentId: string): TournamentProjection {
    return {
      id: tournamentId,
      organizationId: '',
      name: '',
      type: '',
      status: 'SCHEDULED',
      buyIn: 0,
      fee: 0,
      stack: 0,
      minPlayers: 2,
      playersPerTable: 9,
      scheduledAt: new Date(),
      currentLevel: 1,
      timeRemaining: 0,
      isClockRunning: false,
      isPaused: false,
      totalRegistered: 0,
      confirmedPlayers: 0,
      activePlayers: 0,
      eliminatedPlayers: 0,
      totalPrizePool: 0,
      totalFees: 0,
      totalTables: 0,
      activeTables: 0,
      totalChips: 0,
      averageChips: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0
    };
  }

  private tournamentProjector(state: TournamentProjection, event: BaseEvent): TournamentProjection {
    const newState = { ...state, version: event.version, updatedAt: event.timestamp };

    switch (event.eventType) {
      case TournamentEventType.TOURNAMENT_CREATED:
        return {
          ...newState,
          ...event.eventData,
          status: 'SCHEDULED',
          createdAt: event.timestamp
        };

      case TournamentEventType.TOURNAMENT_STARTED:
        return {
          ...newState,
          status: 'RUNNING',
          startedAt: event.eventData.startedAt,
          confirmedPlayers: event.eventData.initialPlayerCount,
          activePlayers: event.eventData.initialPlayerCount,
          totalTables: event.eventData.initialTables,
          activeTables: event.eventData.initialTables,
          totalPrizePool: event.eventData.totalPrizePool,
          isClockRunning: true
        };

      case TournamentEventType.TOURNAMENT_PAUSED:
        return {
          ...newState,
          status: 'PAUSED',
          pausedAt: event.eventData.pausedAt,
          isClockRunning: false,
          isPaused: true,
          currentLevel: event.eventData.currentLevel,
          timeRemaining: event.eventData.timeRemaining
        };

      case TournamentEventType.TOURNAMENT_RESUMED:
        return {
          ...newState,
          status: 'RUNNING',
          pausedAt: undefined,
          isClockRunning: true,
          isPaused: false,
          currentLevel: event.eventData.currentLevel,
          timeRemaining: event.eventData.timeRemaining
        };

      case TournamentEventType.TOURNAMENT_COMPLETED:
        return {
          ...newState,
          status: 'FINISHED',
          endedAt: event.eventData.completedAt,
          isClockRunning: false,
          isPaused: false,
          activePlayers: 0,
          activeTables: 0
        };

      case TournamentEventType.TOURNAMENT_CANCELLED:
        return {
          ...newState,
          status: 'CANCELLED',
          endedAt: event.eventData.cancelledAt,
          isClockRunning: false,
          isPaused: false
        };

      case TournamentEventType.PLAYER_REGISTERED:
        return {
          ...newState,
          totalRegistered: newState.totalRegistered + 1,
          totalPrizePool: newState.totalPrizePool + event.eventData.buyInAmount,
          totalFees: newState.totalFees + event.eventData.feeAmount
        };

      case TournamentEventType.PLAYER_ELIMINATED:
        return {
          ...newState,
          activePlayers: Math.max(0, newState.activePlayers - 1),
          eliminatedPlayers: newState.eliminatedPlayers + 1
        };

      case TournamentEventType.TABLE_CREATED:
        return {
          ...newState,
          totalTables: newState.totalTables + 1,
          activeTables: newState.activeTables + 1
        };

      case TournamentEventType.TABLE_BROKEN:
        return {
          ...newState,
          activeTables: Math.max(0, newState.activeTables - 1)
        };

      case TournamentEventType.CLOCK_LEVEL_CHANGED:
        return {
          ...newState,
          currentLevel: event.eventData.toLevel,
          timeRemaining: event.eventData.levelDuration * 60, // Convert to seconds
          totalChips: event.eventData.totalChips,
          averageChips: event.eventData.averageChips,
          activePlayers: event.eventData.playersRemaining
        };

      case TournamentEventType.CLOCK_TIME_UPDATED:
        return {
          ...newState,
          currentLevel: event.eventData.currentLevel,
          timeRemaining: event.eventData.timeRemaining,
          isClockRunning: event.eventData.isRunning,
          isPaused: event.eventData.isPaused
        };

      case TournamentEventType.CHIP_COUNT_UPDATED:
        // Recalculate chip statistics would require additional logic
        return newState;

      default:
        return newState;
    }
  }

  // Tournament player projection
  async projectTournamentPlayer(
    organizationId: string,
    playerId: string,
    tournamentId: string
  ): Promise<TournamentPlayerProjection | null> {
    const events = await this.eventStore.getTournamentEvents(
      organizationId,
      tournamentId,
      [
        TournamentEventType.PLAYER_REGISTERED,
        TournamentEventType.PLAYER_ELIMINATED,
        TournamentEventType.PLAYER_MOVED,
        TournamentEventType.CHIP_COUNT_UPDATED,
        PlayerEventType.PLAYER_REBOUGHT,
        PlayerEventType.PLAYER_ADDON_PURCHASED,
        PlayerEventType.PLAYER_SEATED,
        PlayerEventType.PLAYER_ELIMINATED
      ]
    );

    const playerEvents = events.filter(e =>
      e.eventData.playerId === playerId ||
      e.eventData.playerProfileId === playerId ||
      e.aggregateId === playerId
    );

    if (playerEvents.length === 0) {
      return null;
    }

    return this.projectPlayerInTournament(playerId, tournamentId, playerEvents);
  }

  private projectPlayerInTournament(
    playerId: string,
    tournamentId: string,
    events: BaseEvent[]
  ): TournamentPlayerProjection {
    let state: TournamentPlayerProjection = {
      playerId,
      playerProfileId: '',
      tournamentId,
      entryId: '',
      entryNumber: 1,
      status: 'REGISTERED',
      buyInAmount: 0,
      feeAmount: 0,
      totalInvested: 0,
      chipCount: 0,
      registeredAt: new Date(),
      rebuysUsed: 0,
      addonsUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0
    };

    for (const event of events) {
      state = this.playerInTournamentProjector(state, event);
    }

    return state;
  }

  private playerInTournamentProjector(
    state: TournamentPlayerProjection,
    event: BaseEvent
  ): TournamentPlayerProjection {
    const newState = { ...state, version: event.version, updatedAt: event.timestamp };

    switch (event.eventType) {
      case TournamentEventType.PLAYER_REGISTERED:
      case PlayerEventType.PLAYER_REGISTERED_FOR_TOURNAMENT:
        return {
          ...newState,
          entryId: event.eventData.entryId,
          entryNumber: event.eventData.entryNumber || 1,
          buyInAmount: event.eventData.buyInAmount,
          feeAmount: event.eventData.feeAmount,
          totalInvested: event.eventData.buyInAmount + event.eventData.feeAmount,
          registeredAt: event.eventData.registeredAt || event.timestamp,
          createdAt: event.timestamp
        };

      case PlayerEventType.PLAYER_ENTRY_CONFIRMED:
        return {
          ...newState,
          status: 'CONFIRMED',
          confirmedAt: event.eventData.confirmedAt,
          chipCount: event.eventData.startingChips
        };

      case PlayerEventType.PLAYER_SEATED:
        return {
          ...newState,
          status: 'PLAYING',
          currentTableId: event.eventData.tableId,
          currentSeatNumber: event.eventData.seatNumber,
          chipCount: event.eventData.chipCount
        };

      case PlayerEventType.PLAYER_MOVED_TABLES:
        return {
          ...newState,
          currentTableId: event.eventData.toTable.tableId,
          currentSeatNumber: event.eventData.toTable.seatNumber,
          chipCount: event.eventData.chipCount
        };

      case PlayerEventType.PLAYER_CHIPS_UPDATED:
      case TournamentEventType.CHIP_COUNT_UPDATED:
        return {
          ...newState,
          chipCount: event.eventData.newChipCount
        };

      case PlayerEventType.PLAYER_REBOUGHT:
        return {
          ...newState,
          rebuysUsed: newState.rebuysUsed + 1,
          totalInvested: newState.totalInvested + event.eventData.rebuyAmount,
          chipCount: event.eventData.currentChipCount
        };

      case PlayerEventType.PLAYER_ADDON_PURCHASED:
        return {
          ...newState,
          addonsUsed: newState.addonsUsed + 1,
          totalInvested: newState.totalInvested + event.eventData.addonAmount,
          chipCount: event.eventData.currentChipCount
        };

      case PlayerEventType.PLAYER_ELIMINATED:
      case TournamentEventType.PLAYER_ELIMINATED:
        return {
          ...newState,
          status: 'ELIMINATED',
          eliminatedAt: event.eventData.eliminatedAt,
          finalPosition: event.eventData.position,
          chipCount: 0,
          playTime: event.eventData.playTime
        };

      case PlayerEventType.PLAYER_DISQUALIFIED:
        return {
          ...newState,
          status: 'DISQUALIFIED',
          eliminatedAt: event.eventData.disqualifiedAt,
          chipCount: 0
        };

      case PlayerEventType.PLAYER_PAYOUT_EARNED:
        return {
          ...newState,
          prizeMoney: event.eventData.amount
        };

      case PlayerEventType.PLAYER_PAYOUT_RECEIVED:
        return {
          ...newState,
          payoutReceived: true
        };

      default:
        return newState;
    }
  }

  // Tournament statistics projection
  async projectTournamentStatistics(
    organizationId: string,
    tournamentId: string
  ): Promise<TournamentStatisticsProjection> {
    const events = await this.eventStore.getTournamentEvents(organizationId, tournamentId);

    return this.calculateTournamentStatistics(tournamentId, events);
  }

  private calculateTournamentStatistics(
    tournamentId: string,
    events: BaseEvent[]
  ): TournamentStatisticsProjection {
    const stats: TournamentStatisticsProjection = {
      tournamentId,
      totalRegistered: 0,
      confirmedPlayers: 0,
      activePlayers: 0,
      eliminatedPlayers: 0,
      totalPrizePool: 0,
      totalFees: 0,
      averageBuyIn: 0,
      totalRebuys: 0,
      totalAddons: 0,
      totalChips: 0,
      averageChips: 0,
      medianChips: 0,
      chipLeader: { playerId: '', chipCount: 0, percentage: 0 },
      shortStack: { playerId: '', chipCount: 0, bigBlinds: 0 },
      totalTables: 0,
      activeTables: 0,
      averagePlayersPerTable: 0,
      duration: 0,
      averageEliminationTime: 0,
      levelsPlayed: 0,
      recentEliminations: [],
      recentRebuys: [],
      lastUpdated: new Date(),
      version: 0
    };

    const playerChips: Map<string, number> = new Map();
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    let currentBigBlind = 0;

    for (const event of events) {
      switch (event.eventType) {
        case TournamentEventType.TOURNAMENT_STARTED:
          startTime = event.eventData.startedAt;
          stats.totalPrizePool = event.eventData.totalPrizePool;
          break;

        case TournamentEventType.TOURNAMENT_COMPLETED:
          endTime = event.eventData.completedAt;
          break;

        case TournamentEventType.PLAYER_REGISTERED:
          stats.totalRegistered++;
          stats.totalPrizePool += event.eventData.buyInAmount;
          stats.totalFees += event.eventData.feeAmount;
          break;

        case PlayerEventType.PLAYER_ENTRY_CONFIRMED:
          stats.confirmedPlayers++;
          stats.activePlayers++;
          playerChips.set(event.eventData.playerId, event.eventData.startingChips);
          break;

        case PlayerEventType.PLAYER_ELIMINATED:
          stats.eliminatedPlayers++;
          stats.activePlayers = Math.max(0, stats.activePlayers - 1);
          playerChips.delete(event.eventData.playerId);

          stats.recentEliminations.unshift({
            playerId: event.eventData.playerId,
            position: event.eventData.position,
            eliminatedAt: event.eventData.eliminatedAt,
            chipCount: event.eventData.finalChipCount
          });

          // Keep only last 10 eliminations
          if (stats.recentEliminations.length > 10) {
            stats.recentEliminations.pop();
          }
          break;

        case PlayerEventType.PLAYER_REBOUGHT:
          stats.totalRebuys++;
          stats.totalPrizePool += event.eventData.rebuyAmount;

          stats.recentRebuys.unshift({
            playerId: event.eventData.playerId,
            rebuyAt: event.eventData.reboughtAt,
            amount: event.eventData.rebuyAmount,
            chipCount: event.eventData.currentChipCount
          });

          // Keep only last 10 rebuys
          if (stats.recentRebuys.length > 10) {
            stats.recentRebuys.pop();
          }
          break;

        case PlayerEventType.PLAYER_ADDON_PURCHASED:
          stats.totalAddons++;
          stats.totalPrizePool += event.eventData.addonAmount;
          break;

        case TournamentEventType.TABLE_CREATED:
          stats.totalTables++;
          stats.activeTables++;
          break;

        case TournamentEventType.TABLE_BROKEN:
          stats.activeTables = Math.max(0, stats.activeTables - 1);
          break;

        case TournamentEventType.CLOCK_LEVEL_CHANGED:
          stats.levelsPlayed = Math.max(stats.levelsPlayed, event.eventData.toLevel);
          stats.totalChips = event.eventData.totalChips;
          stats.averageChips = event.eventData.averageChips;
          currentBigBlind = event.eventData.bigBlind;
          break;

        case PlayerEventType.PLAYER_CHIPS_UPDATED:
          playerChips.set(event.eventData.playerId, event.eventData.newChipCount);
          break;
      }
    }

    // Calculate duration
    if (startTime && endTime) {
      stats.duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }

    // Calculate average buy-in
    if (stats.totalRegistered > 0) {
      stats.averageBuyIn = stats.totalPrizePool / stats.totalRegistered;
    }

    // Calculate chip statistics
    const chipCounts = Array.from(playerChips.values());
    if (chipCounts.length > 0) {
      stats.totalChips = chipCounts.reduce((sum, chips) => sum + chips, 0);
      stats.averageChips = Math.round(stats.totalChips / chipCounts.length);

      // Find chip leader
      const maxChips = Math.max(...chipCounts);
      const chipLeaderEntry = Array.from(playerChips.entries()).find(([_, chips]) => chips === maxChips);
      if (chipLeaderEntry) {
        stats.chipLeader = {
          playerId: chipLeaderEntry[0],
          chipCount: maxChips,
          percentage: Math.round((maxChips / stats.totalChips) * 100)
        };
      }

      // Find short stack
      const minChips = Math.min(...chipCounts);
      const shortStackEntry = Array.from(playerChips.entries()).find(([_, chips]) => chips === minChips);
      if (shortStackEntry && currentBigBlind > 0) {
        stats.shortStack = {
          playerId: shortStackEntry[0],
          chipCount: minChips,
          bigBlinds: Math.round(minChips / currentBigBlind * 10) / 10
        };
      }

      // Calculate median chips
      const sortedChips = chipCounts.sort((a, b) => a - b);
      const mid = Math.floor(sortedChips.length / 2);
      stats.medianChips = sortedChips.length % 2 === 0
        ? Math.round((sortedChips[mid - 1] + sortedChips[mid]) / 2)
        : sortedChips[mid];
    }

    // Calculate players per table
    if (stats.activeTables > 0) {
      stats.averagePlayersPerTable = Math.round((stats.activePlayers / stats.activeTables) * 10) / 10;
    }

    stats.lastUpdated = new Date();
    return stats;
  }

  // Projection maintenance methods
  async rebuildTournamentProjection(organizationId: string, tournamentId: string): Promise<void> {
    const projection = await this.projectTournament(organizationId, tournamentId);

    // Save projection to database for faster access
    await this.saveTournamentProjection(projection);
  }

  private async saveTournamentProjection(projection: TournamentProjection): Promise<void> {
    // This would save the projection to a read model table
    // For now, we'll use a simple JSON storage approach
    try {
      await this.prisma.$executeRaw`
        INSERT INTO tournament_projections (tournament_id, organization_id, data, version, updated_at)
        VALUES (${projection.id}, ${projection.organizationId}, ${JSON.stringify(projection)}, ${projection.version}, NOW())
        ON CONFLICT (tournament_id)
        DO UPDATE SET data = ${JSON.stringify(projection)}, version = ${projection.version}, updated_at = NOW()
      `;
    } catch (error) {
      console.warn('Failed to save tournament projection:', error);
    }
  }
}

export default TournamentProjectionHandler;