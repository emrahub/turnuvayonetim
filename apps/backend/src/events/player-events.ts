import { BaseEvent } from '../services/event-store';
import { v4 as uuidv4 } from 'uuid';

// Player Event Types
export enum PlayerEventType {
  // Profile Events
  PLAYER_PROFILE_CREATED = 'PlayerProfileCreated',
  PLAYER_PROFILE_UPDATED = 'PlayerProfileUpdated',
  PLAYER_PROFILE_DELETED = 'PlayerProfileDeleted',
  PLAYER_NICKNAME_CHANGED = 'PlayerNicknameChanged',
  PLAYER_PREFERENCES_UPDATED = 'PlayerPreferencesUpdated',

  // Tournament Entry Events
  PLAYER_REGISTERED_FOR_TOURNAMENT = 'PlayerRegisteredForTournament',
  PLAYER_UNREGISTERED_FROM_TOURNAMENT = 'PlayerUnregisteredFromTournament',
  PLAYER_ENTRY_CONFIRMED = 'PlayerEntryConfirmed',
  PLAYER_ENTRY_CANCELLED = 'PlayerEntryCancelled',

  // Tournament Participation Events
  PLAYER_SEATED = 'PlayerSeated',
  PLAYER_MOVED_TABLES = 'PlayerMovedTables',
  PLAYER_CHANGED_SEATS = 'PlayerChangedSeats',
  PLAYER_LEFT_SEAT = 'PlayerLeftSeat',
  PLAYER_RETURNED_TO_SEAT = 'PlayerReturnedToSeat',

  // Chip Events
  PLAYER_CHIPS_UPDATED = 'PlayerChipsUpdated',
  PLAYER_REBOUGHT = 'PlayerRebought',
  PLAYER_ADDON_PURCHASED = 'PlayerAddonPurchased',
  PLAYER_CHIPS_CORRECTED = 'PlayerChipsCorrected',

  // Elimination Events
  PLAYER_ELIMINATED = 'PlayerEliminated',
  PLAYER_DISQUALIFIED = 'PlayerDisqualified',
  PLAYER_BUSTED_OUT = 'PlayerBustedOut',
  PLAYER_VOLUNTARILY_LEFT = 'PlayerVoluntarilyLeft',

  // Statistics Events
  PLAYER_STATISTICS_UPDATED = 'PlayerStatisticsUpdated',
  PLAYER_TOURNAMENT_FINISHED = 'PlayerTournamentFinished',
  PLAYER_ACHIEVEMENT_UNLOCKED = 'PlayerAchievementUnlocked',

  // Financial Events
  PLAYER_PAYOUT_EARNED = 'PlayerPayoutEarned',
  PLAYER_PAYOUT_RECEIVED = 'PlayerPayoutReceived',
  PLAYER_REFUND_ISSUED = 'PlayerRefundIssued',

  // Behavior Events
  PLAYER_WARNING_ISSUED = 'PlayerWarningIssued',
  PLAYER_PENALTY_APPLIED = 'PlayerPenaltyApplied',
  PLAYER_TIMEOUT_TAKEN = 'PlayerTimeoutTaken',

  // Status Events
  PLAYER_STATUS_CHANGED = 'PlayerStatusChanged',
  PLAYER_WENT_AWAY = 'PlayerWentAway',
  PLAYER_RETURNED = 'PlayerReturned'
}

// Event Data Interfaces
export interface PlayerProfileCreatedData {
  playerId: string;
  userId: string;
  organizationId?: string;
  nickname?: string;
  createdAt: Date;
  createdBy: string;
  initialPreferences?: any;
}

export interface PlayerProfileUpdatedData {
  playerId: string;
  changes: {
    nickname?: string;
    preferences?: any;
    [key: string]: any;
  };
  updatedAt: Date;
  updatedBy: string;
  updateReason?: string;
}

export interface PlayerRegisteredForTournamentData {
  playerId: string;
  tournamentId: string;
  entryId: string;
  entryNumber: number;
  buyInAmount: number;
  feeAmount: number;
  registeredAt: Date;
  registeredBy?: string;
  paymentMethod?: string;
  isLateRegistration?: boolean;
  registrationSource: 'ONLINE' | 'ONSITE' | 'ADMIN';
}

export interface PlayerEntryConfirmedData {
  playerId: string;
  tournamentId: string;
  entryId: string;
  confirmedAt: Date;
  confirmedBy: string;
  startingChips: number;
  startingTableId?: string;
  startingSeatNumber?: number;
}

export interface PlayerSeatedData {
  playerId: string;
  tournamentId: string;
  tableId: string;
  seatNumber: number;
  chipCount: number;
  seatedAt: Date;
  seatedBy: string;
  isInitialSeating: boolean;
  previousTableId?: string;
  previousSeatNumber?: number;
}

export interface PlayerMovedTablesData {
  playerId: string;
  tournamentId: string;
  fromTable: {
    tableId: string;
    tableNumber: number;
    seatNumber: number;
  };
  toTable: {
    tableId: string;
    tableNumber: number;
    seatNumber: number;
  };
  chipCount: number;
  movedAt: Date;
  movedBy: string;
  reason: 'BALANCING' | 'BREAKING' | 'REDRAW' | 'MANUAL' | 'FINAL_TABLE';
  isBreakingTable: boolean;
}

export interface PlayerChipsUpdatedData {
  playerId: string;
  tournamentId: string;
  tableId: string;
  seatNumber: number;
  previousChipCount: number;
  newChipCount: number;
  chipChange: number;
  updatedAt: Date;
  updatedBy: string;
  reason: 'MANUAL' | 'SYSTEM' | 'CORRECTION' | 'REBUY' | 'ADDON' | 'PENALTY' | 'AWARD';
  notes?: string;
  relatedTransactionId?: string;
}

export interface PlayerReboughtData {
  playerId: string;
  tournamentId: string;
  entryId: string;
  rebuyNumber: number;
  rebuyAmount: number;
  feeAmount: number;
  chipsReceived: number;
  reboughtAt: Date;
  processedBy: string;
  paymentMethod?: string;
  currentChipCount: number;
  totalRebuyCount: number;
}

export interface PlayerAddonPurchasedData {
  playerId: string;
  tournamentId: string;
  addonAmount: number;
  chipsReceived: number;
  purchasedAt: Date;
  processedBy: string;
  paymentMethod?: string;
  currentChipCount: number;
  isLastAddon?: boolean;
}

export interface PlayerEliminatedData {
  playerId: string;
  tournamentId: string;
  entryId: string;
  position: number;
  eliminatedAt: Date;
  eliminatedBy?: string; // Player who eliminated them
  finalChipCount: number;
  tableId: string;
  seatNumber: number;
  eliminationType: 'BUSTED' | 'BLINDED_OUT' | 'DISQUALIFIED' | 'VOLUNTARY';
  handDetails?: {
    handNumber?: number;
    cards?: string[];
    boardCards?: string[];
    finalAction?: string;
  };
  prizeMoney?: number;
  playTime: number; // in minutes
}

export interface PlayerDisqualifiedData {
  playerId: string;
  tournamentId: string;
  disqualifiedAt: Date;
  disqualifiedBy: string;
  reason: string;
  ruleViolation?: string;
  chipCount: number;
  tableId: string;
  seatNumber: number;
  isRefundable: boolean;
  witnesses?: string[];
}

export interface PlayerStatisticsUpdatedData {
  playerId: string;
  tournamentId?: string;
  statistics: {
    totalTournaments?: number;
    totalWins?: number;
    totalCashes?: number;
    totalEarnings?: number;
    bestFinish?: number;
    averageFinish?: number;
    roi?: number; // Return on investment
    itm?: number; // In the money percentage
  };
  updatedAt: Date;
  calculatedBy: string;
  calculationReason: 'TOURNAMENT_FINISH' | 'MANUAL_UPDATE' | 'SYSTEM_RECALC';
}

export interface PlayerTournamentFinishedData {
  playerId: string;
  tournamentId: string;
  finalPosition: number;
  prizeMoney: number;
  totalBuyIn: number;
  profit: number;
  playTime: number; // in minutes
  finishedAt: Date;
  rebuysUsed: number;
  addonsUsed: number;
  performanceMetrics: {
    bigBlindsWon?: number;
    handsPlayed?: number;
    vpip?: number; // Voluntarily put in pot
    pfr?: number; // Pre-flop raise
    aggression?: number;
  };
}

export interface PlayerPayoutEarnedData {
  playerId: string;
  tournamentId: string;
  payoutId: string;
  position: number;
  amount: number;
  percentage: number;
  earnedAt: Date;
  currency: string;
  taxWithholding?: number;
  netAmount: number;
}

export interface PlayerPayoutReceivedData {
  playerId: string;
  tournamentId: string;
  payoutId: string;
  amount: number;
  receivedAt: Date;
  receivedBy: string;
  paymentMethod: string;
  transactionId?: string;
  processingFee?: number;
  netReceived: number;
}

export interface PlayerWarningIssuedData {
  playerId: string;
  tournamentId: string;
  tableId: string;
  warningId: string;
  issuedAt: Date;
  issuedBy: string;
  reason: string;
  ruleViolation?: string;
  severity: 'MINOR' | 'MAJOR' | 'SEVERE';
  warningCount: number;
  description?: string;
}

export interface PlayerPenaltyAppliedData {
  playerId: string;
  tournamentId: string;
  tableId: string;
  penaltyId: string;
  appliedAt: Date;
  appliedBy: string;
  penaltyType: 'TIME_PENALTY' | 'CHIP_PENALTY' | 'DISQUALIFICATION';
  reason: string;
  ruleViolation: string;
  severity: 'MINOR' | 'MAJOR' | 'SEVERE';
  chipsPenalized?: number;
  timePenalty?: number; // in minutes
  description?: string;
}

export interface PlayerStatusChangedData {
  playerId: string;
  tournamentId?: string;
  tableId?: string;
  fromStatus: string;
  toStatus: string;
  changedAt: Date;
  changedBy: string;
  reason?: string;
  metadata?: any;
}

// Event Builder Functions
export class PlayerEventBuilder {
  static createPlayerProfileCreated(
    organizationId: string,
    data: PlayerProfileCreatedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.playerId,
      aggregateType: 'Player',
      eventType: PlayerEventType.PLAYER_PROFILE_CREATED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.createdBy,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createPlayerRegisteredForTournament(
    organizationId: string,
    data: PlayerRegisteredForTournamentData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.playerId,
      aggregateType: 'Player',
      eventType: PlayerEventType.PLAYER_REGISTERED_FOR_TOURNAMENT,
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

  static createPlayerSeated(
    organizationId: string,
    data: PlayerSeatedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.playerId,
      aggregateType: 'Player',
      eventType: PlayerEventType.PLAYER_SEATED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.seatedBy,
        tournamentId: data.tournamentId,
        tableId: data.tableId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createPlayerChipsUpdated(
    organizationId: string,
    data: PlayerChipsUpdatedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.playerId,
      aggregateType: 'Player',
      eventType: PlayerEventType.PLAYER_CHIPS_UPDATED,
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

  static createPlayerEliminated(
    organizationId: string,
    data: PlayerEliminatedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.playerId,
      aggregateType: 'Player',
      eventType: PlayerEventType.PLAYER_ELIMINATED,
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

  static createPlayerRebought(
    organizationId: string,
    data: PlayerReboughtData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.playerId,
      aggregateType: 'Player',
      eventType: PlayerEventType.PLAYER_REBOUGHT,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.processedBy,
        tournamentId: data.tournamentId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createPlayerStatisticsUpdated(
    organizationId: string,
    data: PlayerStatisticsUpdatedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.playerId,
      aggregateType: 'Player',
      eventType: PlayerEventType.PLAYER_STATISTICS_UPDATED,
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

  static createPlayerPayoutEarned(
    organizationId: string,
    data: PlayerPayoutEarnedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.playerId,
      aggregateType: 'Player',
      eventType: PlayerEventType.PLAYER_PAYOUT_EARNED,
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
}

// Event Type Guards
export function isPlayerEvent(event: BaseEvent): event is BaseEvent {
  return event.aggregateType === 'Player' &&
         Object.values(PlayerEventType).includes(event.eventType as PlayerEventType);
}

export function isPlayerProfileEvent(event: BaseEvent): boolean {
  const profileEvents = [
    PlayerEventType.PLAYER_PROFILE_CREATED,
    PlayerEventType.PLAYER_PROFILE_UPDATED,
    PlayerEventType.PLAYER_PROFILE_DELETED,
    PlayerEventType.PLAYER_NICKNAME_CHANGED,
    PlayerEventType.PLAYER_PREFERENCES_UPDATED
  ];
  return profileEvents.includes(event.eventType as PlayerEventType);
}

export function isPlayerTournamentEvent(event: BaseEvent): boolean {
  const tournamentEvents = [
    PlayerEventType.PLAYER_REGISTERED_FOR_TOURNAMENT,
    PlayerEventType.PLAYER_UNREGISTERED_FROM_TOURNAMENT,
    PlayerEventType.PLAYER_ENTRY_CONFIRMED,
    PlayerEventType.PLAYER_ENTRY_CANCELLED,
    PlayerEventType.PLAYER_SEATED,
    PlayerEventType.PLAYER_MOVED_TABLES,
    PlayerEventType.PLAYER_ELIMINATED,
    PlayerEventType.PLAYER_TOURNAMENT_FINISHED
  ];
  return tournamentEvents.includes(event.eventType as PlayerEventType);
}

export function isPlayerChipEvent(event: BaseEvent): boolean {
  const chipEvents = [
    PlayerEventType.PLAYER_CHIPS_UPDATED,
    PlayerEventType.PLAYER_REBOUGHT,
    PlayerEventType.PLAYER_ADDON_PURCHASED,
    PlayerEventType.PLAYER_CHIPS_CORRECTED
  ];
  return chipEvents.includes(event.eventType as PlayerEventType);
}

export function isPlayerFinancialEvent(event: BaseEvent): boolean {
  const financialEvents = [
    PlayerEventType.PLAYER_PAYOUT_EARNED,
    PlayerEventType.PLAYER_PAYOUT_RECEIVED,
    PlayerEventType.PLAYER_REFUND_ISSUED,
    PlayerEventType.PLAYER_REBOUGHT,
    PlayerEventType.PLAYER_ADDON_PURCHASED
  ];
  return financialEvents.includes(event.eventType as PlayerEventType);
}

export function isPlayerBehaviorEvent(event: BaseEvent): boolean {
  const behaviorEvents = [
    PlayerEventType.PLAYER_WARNING_ISSUED,
    PlayerEventType.PLAYER_PENALTY_APPLIED,
    PlayerEventType.PLAYER_TIMEOUT_TAKEN,
    PlayerEventType.PLAYER_DISQUALIFIED
  ];
  return behaviorEvents.includes(event.eventType as PlayerEventType);
}

// Utility Functions
export function getPlayerEventsByTournament(events: BaseEvent[], tournamentId: string): BaseEvent[] {
  return events.filter(event =>
    isPlayerEvent(event) &&
    event.metadata.tournamentId === tournamentId
  );
}

export function getPlayerEventsByType(events: BaseEvent[], eventType: PlayerEventType): BaseEvent[] {
  return events.filter(event =>
    isPlayerEvent(event) &&
    event.eventType === eventType
  );
}

export function calculatePlayerTournamentStats(events: BaseEvent[], playerId: string, tournamentId: string) {
  const playerEvents = events.filter(event =>
    event.aggregateId === playerId &&
    event.metadata.tournamentId === tournamentId
  );

  let totalBuyIn = 0;
  let rebuysCount = 0;
  let addonsCount = 0;
  let finalPosition: number | null = null;
  let prizeMoney = 0;
  let playTime = 0;

  for (const event of playerEvents) {
    switch (event.eventType) {
      case PlayerEventType.PLAYER_REGISTERED_FOR_TOURNAMENT:
        totalBuyIn += (event.eventData as PlayerRegisteredForTournamentData).buyInAmount;
        break;
      case PlayerEventType.PLAYER_REBOUGHT:
        totalBuyIn += (event.eventData as PlayerReboughtData).rebuyAmount;
        rebuysCount++;
        break;
      case PlayerEventType.PLAYER_ADDON_PURCHASED:
        totalBuyIn += (event.eventData as PlayerAddonPurchasedData).addonAmount;
        addonsCount++;
        break;
      case PlayerEventType.PLAYER_ELIMINATED:
        finalPosition = (event.eventData as PlayerEliminatedData).position;
        playTime = (event.eventData as PlayerEliminatedData).playTime;
        break;
      case PlayerEventType.PLAYER_PAYOUT_EARNED:
        prizeMoney = (event.eventData as PlayerPayoutEarnedData).amount;
        break;
    }
  }

  return {
    totalBuyIn,
    rebuysCount,
    addonsCount,
    finalPosition,
    prizeMoney,
    profit: prizeMoney - totalBuyIn,
    playTime
  };
}

// Export all types
export type PlayerEvent = BaseEvent;
// Note: All data types are already exported via their interface declarations above