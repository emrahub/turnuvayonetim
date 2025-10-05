import { BaseEvent } from '../services/event-store';
import { v4 as uuidv4 } from 'uuid';

// Tournament Event Types
export enum TournamentEventType {
  // Lifecycle Events
  TOURNAMENT_CREATED = 'TournamentCreated',
  TOURNAMENT_UPDATED = 'TournamentUpdated',
  TOURNAMENT_STARTED = 'TournamentStarted',
  TOURNAMENT_PAUSED = 'TournamentPaused',
  TOURNAMENT_RESUMED = 'TournamentResumed',
  TOURNAMENT_COMPLETED = 'TournamentCompleted',
  TOURNAMENT_CANCELLED = 'TournamentCancelled',
  TOURNAMENT_DELETED = 'TournamentDeleted',

  // Registration Events
  REGISTRATION_OPENED = 'RegistrationOpened',
  REGISTRATION_CLOSED = 'RegistrationClosed',
  REGISTRATION_EXTENDED = 'RegistrationExtended',

  // Structure Events
  BLIND_STRUCTURE_ASSIGNED = 'BlindStructureAssigned',
  PAYOUT_SCHEME_ASSIGNED = 'PayoutSchemeAssigned',
  SETTINGS_UPDATED = 'SettingsUpdated',

  // Player Management Events
  PLAYER_REGISTERED = 'PlayerRegistered',
  PLAYER_UNREGISTERED = 'PlayerUnregistered',
  PLAYER_REBOUGHT = 'PlayerRebought',
  PLAYER_ADDED_ON = 'PlayerAddedOn',
  PLAYER_ELIMINATED = 'PlayerEliminated',
  PLAYER_DISQUALIFIED = 'PlayerDisqualified',
  PLAYER_MOVED = 'PlayerMoved',

  // Table Management Events
  TABLE_CREATED = 'TableCreated',
  TABLE_REMOVED = 'TableRemoved',
  TABLE_BALANCED = 'TableBalanced',
  TABLE_BROKEN = 'TableBroken',
  TABLE_CONSOLIDATED = 'TableConsolidated',

  // Clock Events
  CLOCK_STARTED = 'ClockStarted',
  CLOCK_PAUSED = 'ClockPaused',
  CLOCK_RESUMED = 'ClockResumed',
  CLOCK_LEVEL_CHANGED = 'ClockLevelChanged',
  CLOCK_TIME_UPDATED = 'ClockTimeUpdated',
  CLOCK_BREAK_STARTED = 'ClockBreakStarted',
  CLOCK_BREAK_ENDED = 'ClockBreakEnded',

  // Payout Events
  PAYOUT_CALCULATED = 'PayoutCalculated',
  PAYOUT_DISTRIBUTED = 'PayoutDistributed',
  PAYOUT_ADJUSTED = 'PayoutAdjusted',
  PAYOUT_APPROVED = 'PayoutApproved',

  // Chip Management Events
  CHIP_COUNT_UPDATED = 'ChipCountUpdated',
  CHIP_COUNT_CORRECTED = 'ChipCountCorrected',
  REBUY_PROCESSED = 'RebuyProcessed',
  ADDON_PROCESSED = 'AddonProcessed'
}

// Event Data Interfaces
export interface TournamentCreatedData {
  tournamentId: string;
  organizationId: string;
  name: string;
  description?: string;
  type: string;
  buyIn: number;
  fee: number;
  stack: number;
  maxPlayers?: number;
  minPlayers: number;
  playersPerTable: number;
  scheduledAt: Date;
  registrationStart?: Date;
  registrationEnd?: Date;
  blindStructureId?: string;
  payoutSchemeId?: string;
  leagueId?: string;
  seasonId?: string;
  settings?: any;
  createdById: string;
}

export interface TournamentUpdatedData {
  tournamentId: string;
  changes: Partial<TournamentCreatedData>;
  updatedBy: string;
  updateReason?: string;
}

export interface TournamentStartedData {
  tournamentId: string;
  startedAt: Date;
  initialPlayerCount: number;
  initialTables: number;
  totalPrizePool: number;
  startedBy: string;
}

export interface TournamentPausedData {
  tournamentId: string;
  pausedAt: Date;
  pausedBy: string;
  reason?: string;
  currentLevel: number;
  timeRemaining: number;
}

export interface TournamentResumedData {
  tournamentId: string;
  resumedAt: Date;
  resumedBy: string;
  currentLevel: number;
  timeRemaining: number;
}

export interface TournamentCompletedData {
  tournamentId: string;
  completedAt: Date;
  duration: number; // in minutes
  totalPlayers: number;
  totalPrizePool: number;
  winnerId: string;
  finalTablePlayers: string[];
  statistics: {
    averageStack: number;
    totalHands?: number;
    rebuysCount: number;
    addonsCount: number;
  };
}

export interface TournamentCancelledData {
  tournamentId: string;
  cancelledAt: Date;
  cancelledBy: string;
  reason: string;
  refundPolicy: 'FULL' | 'PARTIAL' | 'NONE';
  affectedPlayers: string[];
}

export interface PlayerRegisteredData {
  tournamentId: string;
  playerId: string;
  playerProfileId: string;
  entryNumber: number;
  buyInAmount: number;
  feeAmount: number;
  registeredAt: Date;
  registeredBy?: string;
  paymentMethod?: string;
  isRebuy?: boolean;
  isAddon?: boolean;
}

export interface PlayerEliminatedData {
  tournamentId: string;
  playerId: string;
  playerProfileId: string;
  position: number;
  eliminatedAt: Date;
  eliminatedBy?: string;
  finalChipCount: number;
  tableId: string;
  seatNumber: number;
  prizeMoney?: number;
}

export interface PlayerMovedData {
  tournamentId: string;
  playerId: string;
  playerProfileId: string;
  fromTable: {
    tableId: string;
    seatNumber: number;
  };
  toTable: {
    tableId: string;
    seatNumber: number;
  };
  chipCount: number;
  movedAt: Date;
  movedBy: string;
  reason: 'BALANCING' | 'BREAKING' | 'MANUAL' | 'REDRAW';
}

export interface TableCreatedData {
  tournamentId: string;
  tableId: string;
  tableNumber: number;
  maxSeats: number;
  createdAt: Date;
  createdBy: string;
  initialPlayers?: Array<{
    playerId: string;
    seatNumber: number;
    chipCount: number;
  }>;
}

export interface TableBalancedData {
  tournamentId: string;
  affectedTables: Array<{
    tableId: string;
    tableNumber: number;
    beforeCount: number;
    afterCount: number;
    playersAdded: Array<{
      playerId: string;
      seatNumber: number;
      chipCount: number;
    }>;
    playersRemoved: Array<{
      playerId: string;
      chipCount: number;
    }>;
  }>;
  balancedAt: Date;
  balancedBy: string;
  reason: string;
}

export interface TableBrokenData {
  tournamentId: string;
  tableId: string;
  tableNumber: number;
  brokenAt: Date;
  brokenBy: string;
  playersRedistributed: Array<{
    playerId: string;
    chipCount: number;
    newTableId: string;
    newSeatNumber: number;
  }>;
  reason: string;
}

export interface ClockLevelChangedData {
  tournamentId: string;
  fromLevel: number;
  toLevel: number;
  changedAt: Date;
  levelDuration: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  isBreak: boolean;
  breakDuration?: number;
  playersRemaining: number;
  averageChips: number;
  totalChips: number;
}

export interface ClockTimeUpdatedData {
  tournamentId: string;
  currentLevel: number;
  timeRemaining: number;
  updatedAt: Date;
  isRunning: boolean;
  isPaused: boolean;
}

export interface PayoutCalculatedData {
  tournamentId: string;
  totalPrizePool: number;
  totalEntries: number;
  finishedPositions: number;
  payouts: Array<{
    position: number;
    playerId: string;
    amount: number;
    percentage: number;
  }>;
  calculatedAt: Date;
  calculatedBy: string;
  payoutSchemeId?: string;
}

export interface PayoutDistributedData {
  tournamentId: string;
  payoutId: string;
  playerId: string;
  position: number;
  amount: number;
  distributedAt: Date;
  distributedBy: string;
  paymentMethod: string;
  transactionId?: string;
}

export interface ChipCountUpdatedData {
  tournamentId: string;
  playerId: string;
  tableId: string;
  seatNumber: number;
  previousChipCount: number;
  newChipCount: number;
  updatedAt: Date;
  updatedBy: string;
  reason: 'MANUAL' | 'SYSTEM' | 'CORRECTION' | 'REBUY' | 'ADDON';
  notes?: string;
}

// Event Builder Functions
export class TournamentEventBuilder {
  static createTournamentCreated(
    organizationId: string,
    data: TournamentCreatedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Tournament',
      eventType: TournamentEventType.TOURNAMENT_CREATED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.createdById,
        tournamentId: data.tournamentId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createTournamentStarted(
    organizationId: string,
    data: TournamentStartedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Tournament',
      eventType: TournamentEventType.TOURNAMENT_STARTED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.startedBy,
        tournamentId: data.tournamentId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createPlayerRegistered(
    organizationId: string,
    data: PlayerRegisteredData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Tournament',
      eventType: TournamentEventType.PLAYER_REGISTERED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.registeredBy,
        tournamentId: data.tournamentId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createPlayerEliminated(
    organizationId: string,
    data: PlayerEliminatedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Tournament',
      eventType: TournamentEventType.PLAYER_ELIMINATED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.eliminatedBy,
        tournamentId: data.tournamentId,
        tableId: data.tableId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createTableCreated(
    organizationId: string,
    data: TableCreatedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Tournament',
      eventType: TournamentEventType.TABLE_CREATED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.createdBy,
        tournamentId: data.tournamentId,
        tableId: data.tableId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createClockLevelChanged(
    organizationId: string,
    data: ClockLevelChangedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Tournament',
      eventType: TournamentEventType.CLOCK_LEVEL_CHANGED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        tournamentId: data.tournamentId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createPayoutCalculated(
    organizationId: string,
    data: PayoutCalculatedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Tournament',
      eventType: TournamentEventType.PAYOUT_CALCULATED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.calculatedBy,
        tournamentId: data.tournamentId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createChipCountUpdated(
    organizationId: string,
    data: ChipCountUpdatedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Tournament',
      eventType: TournamentEventType.CHIP_COUNT_UPDATED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.updatedBy,
        tournamentId: data.tournamentId,
        tableId: data.tableId,
        ...metadata
      },
      timestamp: new Date()
    };
  }
}

// Event Type Guards
export function isTournamentEvent(event: BaseEvent): event is BaseEvent {
  return event.aggregateType === 'Tournament' &&
         Object.values(TournamentEventType).includes(event.eventType as TournamentEventType);
}

export function isTournamentLifecycleEvent(event: BaseEvent): boolean {
  const lifecycleEvents = [
    TournamentEventType.TOURNAMENT_CREATED,
    TournamentEventType.TOURNAMENT_STARTED,
    TournamentEventType.TOURNAMENT_PAUSED,
    TournamentEventType.TOURNAMENT_RESUMED,
    TournamentEventType.TOURNAMENT_COMPLETED,
    TournamentEventType.TOURNAMENT_CANCELLED
  ];
  return lifecycleEvents.includes(event.eventType as TournamentEventType);
}

export function isPlayerEvent(event: BaseEvent): boolean {
  const playerEvents = [
    TournamentEventType.PLAYER_REGISTERED,
    TournamentEventType.PLAYER_UNREGISTERED,
    TournamentEventType.PLAYER_REBOUGHT,
    TournamentEventType.PLAYER_ADDED_ON,
    TournamentEventType.PLAYER_ELIMINATED,
    TournamentEventType.PLAYER_DISQUALIFIED,
    TournamentEventType.PLAYER_MOVED
  ];
  return playerEvents.includes(event.eventType as TournamentEventType);
}

export function isTableEvent(event: BaseEvent): boolean {
  const tableEvents = [
    TournamentEventType.TABLE_CREATED,
    TournamentEventType.TABLE_REMOVED,
    TournamentEventType.TABLE_BALANCED,
    TournamentEventType.TABLE_BROKEN,
    TournamentEventType.TABLE_CONSOLIDATED
  ];
  return tableEvents.includes(event.eventType as TournamentEventType);
}

export function isClockEvent(event: BaseEvent): boolean {
  const clockEvents = [
    TournamentEventType.CLOCK_STARTED,
    TournamentEventType.CLOCK_PAUSED,
    TournamentEventType.CLOCK_RESUMED,
    TournamentEventType.CLOCK_LEVEL_CHANGED,
    TournamentEventType.CLOCK_TIME_UPDATED,
    TournamentEventType.CLOCK_BREAK_STARTED,
    TournamentEventType.CLOCK_BREAK_ENDED
  ];
  return clockEvents.includes(event.eventType as TournamentEventType);
}

export function isPayoutEvent(event: BaseEvent): boolean {
  const payoutEvents = [
    TournamentEventType.PAYOUT_CALCULATED,
    TournamentEventType.PAYOUT_DISTRIBUTED,
    TournamentEventType.PAYOUT_ADJUSTED,
    TournamentEventType.PAYOUT_APPROVED
  ];
  return payoutEvents.includes(event.eventType as TournamentEventType);
}

// Export all types
export type TournamentEvent = BaseEvent;
// Note: All data types are already exported via their interface declarations above