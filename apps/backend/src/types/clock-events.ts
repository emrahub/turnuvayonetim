import { BaseEvent } from '../services/event-store';
import { v4 as uuidv4 } from 'uuid';

// Clock Event Types for Event Store
export enum ClockEventType {
  // Clock Lifecycle Events
  CLOCK_INITIALIZED = 'ClockInitialized',
  CLOCK_STARTED = 'ClockStarted',
  CLOCK_PAUSED = 'ClockPaused',
  CLOCK_RESUMED = 'ClockResumed',
  CLOCK_STOPPED = 'ClockStopped',
  CLOCK_COMPLETED = 'ClockCompleted',
  CLOCK_RESET = 'ClockReset',

  // Level Management Events
  LEVEL_ADVANCED = 'LevelAdvanced',
  LEVEL_CHANGED = 'LevelChanged',
  LEVEL_EXTENDED = 'LevelExtended',
  LEVEL_SHORTENED = 'LevelShortened',

  // Break Management Events
  BREAK_STARTED = 'BreakStarted',
  BREAK_ENDED = 'BreakEnded',
  BREAK_EXTENDED = 'BreakExtended',
  BREAK_SHORTENED = 'BreakShortened',

  // Time Synchronization Events
  TIME_SYNC_REQUESTED = 'TimeSyncRequested',
  TIME_SYNC_CORRECTED = 'TimeSyncCorrected',
  DRIFT_DETECTED = 'DriftDetected',
  DRIFT_CORRECTED = 'DriftCorrected',

  // Configuration Events
  BLIND_STRUCTURE_UPDATED = 'BlindStructureUpdated',
  CLOCK_SETTINGS_UPDATED = 'ClockSettingsUpdated',

  // Administrative Events
  CLOCK_MANUALLY_ADJUSTED = 'ClockManuallyAdjusted',
  CLOCK_ERROR_OCCURRED = 'ClockErrorOccurred',
  CLOCK_WARNING_ISSUED = 'ClockWarningIssued'
}

// Event Data Interfaces
export interface ClockInitializedData {
  tournamentId: string;
  organizationId: string;
  blindStructureId?: string;
  initialLevel: number;
  totalLevels: number;
  clockSettings: {
    autoAdvance: boolean;
    warningMinutes: number[];
    allowManualControl: boolean;
    driftCorrectionThreshold: number; // milliseconds
    syncInterval: number; // milliseconds
  };
  initializedBy: string;
}

export interface ClockStartedData {
  tournamentId: string;
  startedAt: Date;
  currentLevel: number;
  levelStartTime: number; // timestamp
  blindLevel: {
    idx: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    durationSeconds: number;
    isBreak: boolean;
    breakName?: string;
  };
  playersRemaining: number;
  averageChipStack: number;
  totalChipsInPlay: number;
  startedBy: string;
}

export interface ClockPausedData {
  tournamentId: string;
  pausedAt: Date;
  currentLevel: number;
  timeRemaining: number; // milliseconds
  pauseReason: 'MANUAL' | 'SYSTEM_ERROR' | 'TECHNICAL_ISSUE' | 'FLOOR_DECISION' | 'PLAYER_DISPUTE';
  pausedBy: string;
  notes?: string;
}

export interface ClockResumedData {
  tournamentId: string;
  resumedAt: Date;
  currentLevel: number;
  timeRemaining: number; // milliseconds
  pauseDuration: number; // milliseconds
  resumedBy: string;
  notes?: string;
}

export interface LevelAdvancedData {
  tournamentId: string;
  advancedAt: Date;
  previousLevel: {
    idx: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    duration: number;
    actualDuration: number; // including pauses
  };
  newLevel: {
    idx: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    durationSeconds: number;
    isBreak: boolean;
    breakName?: string;
  };
  playersRemaining: number;
  averageChipStack: number;
  totalChipsInPlay: number;
  autoAdvanced: boolean;
  advancedBy?: string;
}

export interface LevelChangedData {
  tournamentId: string;
  changedAt: Date;
  fromLevel: number;
  toLevel: number;
  timeRemaining: number;
  reason: 'MANUAL_ADVANCE' | 'MANUAL_REVERT' | 'CORRECTION' | 'ADMIN_OVERRIDE';
  changedBy: string;
  notes?: string;
}

export interface BreakStartedData {
  tournamentId: string;
  startedAt: Date;
  breakLevel: number;
  breakName: string;
  breakDuration: number; // seconds
  scheduledEndTime: Date;
  playersRemaining: number;
  startedBy?: string;
}

export interface BreakEndedData {
  tournamentId: string;
  endedAt: Date;
  breakLevel: number;
  breakName: string;
  actualDuration: number; // seconds
  nextLevel: {
    idx: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    durationSeconds: number;
  };
  playersRemaining: number;
  endedBy?: string;
}

export interface TimeSyncRequestedData {
  tournamentId: string;
  requestedAt: Date;
  clientId: string;
  clientTime: number;
  requestId: string;
}

export interface TimeSyncCorrectedData {
  tournamentId: string;
  correctedAt: Date;
  clientId: string;
  serverTime: number;
  clientTime: number;
  drift: number; // milliseconds
  correctionApplied: number; // milliseconds
  requestId: string;
}

export interface DriftDetectedData {
  tournamentId: string;
  detectedAt: Date;
  clientId: string;
  expectedTime: number;
  actualTime: number;
  driftAmount: number; // milliseconds
  threshold: number; // milliseconds
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DriftCorrectedData {
  tournamentId: string;
  correctedAt: Date;
  clientId: string;
  originalDrift: number; // milliseconds
  correctionApplied: number; // milliseconds
  newDrift: number; // milliseconds
  correctionMethod: 'GRADUAL' | 'IMMEDIATE' | 'RESET';
}

export interface ClockManuallyAdjustedData {
  tournamentId: string;
  adjustedAt: Date;
  adjustmentType: 'TIME_ADDED' | 'TIME_REMOVED' | 'LEVEL_SKIPPED' | 'LEVEL_REPEATED' | 'COMPLETE_RESET';
  previousState: {
    level: number;
    timeRemaining: number;
    status: string;
  };
  newState: {
    level: number;
    timeRemaining: number;
    status: string;
  };
  adjustedBy: string;
  reason: string;
  notes?: string;
}

export interface ClockErrorOccurredData {
  tournamentId: string;
  occurredAt: Date;
  errorType: 'SYNC_FAILURE' | 'LEVEL_CALCULATION_ERROR' | 'WEBSOCKET_DISCONNECTION' | 'DATABASE_ERROR' | 'UNKNOWN';
  errorMessage: string;
  errorStack?: string;
  clockState: {
    level: number;
    timeRemaining: number;
    status: string;
    lastSync: Date;
  };
  affectedClients: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoRecovered: boolean;
}

export interface ClockWarningIssuedData {
  tournamentId: string;
  issuedAt: Date;
  warningType: 'TIME_WARNING' | 'SYNC_WARNING' | 'PERFORMANCE_WARNING' | 'CONNECTIVITY_WARNING';
  warningMessage: string;
  timeRemaining?: number;
  level?: number;
  affectedClients?: string[];
  threshold?: number;
  currentValue?: number;
}

export interface BlindStructureUpdatedData {
  tournamentId: string;
  updatedAt: Date;
  previousStructureId?: string;
  newStructureId?: string;
  levelChanges: Array<{
    levelIdx: number;
    previousLevel?: {
      smallBlind: number;
      bigBlind: number;
      ante: number;
      durationSeconds: number;
    };
    newLevel: {
      smallBlind: number;
      bigBlind: number;
      ante: number;
      durationSeconds: number;
      isBreak: boolean;
      breakName?: string;
    };
    changeType: 'ADDED' | 'MODIFIED' | 'REMOVED';
  }>;
  updatedBy: string;
  reason: string;
}

export interface ClockSettingsUpdatedData {
  tournamentId: string;
  updatedAt: Date;
  previousSettings: {
    autoAdvance: boolean;
    warningMinutes: number[];
    allowManualControl: boolean;
    driftCorrectionThreshold: number;
    syncInterval: number;
  };
  newSettings: {
    autoAdvance: boolean;
    warningMinutes: number[];
    allowManualControl: boolean;
    driftCorrectionThreshold: number;
    syncInterval: number;
  };
  updatedBy: string;
  reason?: string;
}

// Event Builder Functions
export class ClockEventBuilder {
  static createClockInitialized(
    organizationId: string,
    data: ClockInitializedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Clock',
      eventType: ClockEventType.CLOCK_INITIALIZED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.initializedBy,
        tournamentId: data.tournamentId,
        correlationId: uuidv4(),
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createClockStarted(
    organizationId: string,
    data: ClockStartedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Clock',
      eventType: ClockEventType.CLOCK_STARTED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.startedBy,
        tournamentId: data.tournamentId,
        correlationId: uuidv4(),
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createClockPaused(
    organizationId: string,
    data: ClockPausedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Clock',
      eventType: ClockEventType.CLOCK_PAUSED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.pausedBy,
        tournamentId: data.tournamentId,
        correlationId: uuidv4(),
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createClockResumed(
    organizationId: string,
    data: ClockResumedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Clock',
      eventType: ClockEventType.CLOCK_RESUMED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.resumedBy,
        tournamentId: data.tournamentId,
        correlationId: uuidv4(),
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createLevelAdvanced(
    organizationId: string,
    data: LevelAdvancedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Clock',
      eventType: ClockEventType.LEVEL_ADVANCED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.advancedBy,
        tournamentId: data.tournamentId,
        correlationId: uuidv4(),
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createBreakStarted(
    organizationId: string,
    data: BreakStartedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Clock',
      eventType: ClockEventType.BREAK_STARTED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.startedBy,
        tournamentId: data.tournamentId,
        correlationId: uuidv4(),
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createBreakEnded(
    organizationId: string,
    data: BreakEndedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Clock',
      eventType: ClockEventType.BREAK_ENDED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        userId: data.endedBy,
        tournamentId: data.tournamentId,
        correlationId: uuidv4(),
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createTimeSyncRequested(
    organizationId: string,
    data: TimeSyncRequestedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Clock',
      eventType: ClockEventType.TIME_SYNC_REQUESTED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        tournamentId: data.tournamentId,
        correlationId: data.requestId,
        sourceId: data.clientId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createDriftDetected(
    organizationId: string,
    data: DriftDetectedData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Clock',
      eventType: ClockEventType.DRIFT_DETECTED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        tournamentId: data.tournamentId,
        correlationId: uuidv4(),
        sourceId: data.clientId,
        ...metadata
      },
      timestamp: new Date()
    };
  }

  static createClockError(
    organizationId: string,
    data: ClockErrorOccurredData,
    metadata?: Partial<BaseEvent['metadata']>
  ): BaseEvent {
    return {
      id: uuidv4(),
      organizationId,
      aggregateId: data.tournamentId,
      aggregateType: 'Clock',
      eventType: ClockEventType.CLOCK_ERROR_OCCURRED,
      version: 1,
      eventData: data,
      metadata: {
        timestamp: new Date(),
        tournamentId: data.tournamentId,
        correlationId: uuidv4(),
        ...metadata
      },
      timestamp: new Date()
    };
  }
}

// Event Type Guards
export function isClockEvent(event: BaseEvent): event is BaseEvent {
  return event.aggregateType === 'Clock' &&
         Object.values(ClockEventType).includes(event.eventType as ClockEventType);
}

export function isClockLifecycleEvent(event: BaseEvent): boolean {
  const lifecycleEvents = [
    ClockEventType.CLOCK_INITIALIZED,
    ClockEventType.CLOCK_STARTED,
    ClockEventType.CLOCK_PAUSED,
    ClockEventType.CLOCK_RESUMED,
    ClockEventType.CLOCK_STOPPED,
    ClockEventType.CLOCK_COMPLETED,
    ClockEventType.CLOCK_RESET
  ];
  return lifecycleEvents.includes(event.eventType as ClockEventType);
}

export function isLevelEvent(event: BaseEvent): boolean {
  const levelEvents = [
    ClockEventType.LEVEL_ADVANCED,
    ClockEventType.LEVEL_CHANGED,
    ClockEventType.LEVEL_EXTENDED,
    ClockEventType.LEVEL_SHORTENED
  ];
  return levelEvents.includes(event.eventType as ClockEventType);
}

export function isBreakEvent(event: BaseEvent): boolean {
  const breakEvents = [
    ClockEventType.BREAK_STARTED,
    ClockEventType.BREAK_ENDED,
    ClockEventType.BREAK_EXTENDED,
    ClockEventType.BREAK_SHORTENED
  ];
  return breakEvents.includes(event.eventType as ClockEventType);
}

export function isSyncEvent(event: BaseEvent): boolean {
  const syncEvents = [
    ClockEventType.TIME_SYNC_REQUESTED,
    ClockEventType.TIME_SYNC_CORRECTED,
    ClockEventType.DRIFT_DETECTED,
    ClockEventType.DRIFT_CORRECTED
  ];
  return syncEvents.includes(event.eventType as ClockEventType);
}

export function isAdministrativeEvent(event: BaseEvent): boolean {
  const adminEvents = [
    ClockEventType.CLOCK_MANUALLY_ADJUSTED,
    ClockEventType.CLOCK_ERROR_OCCURRED,
    ClockEventType.CLOCK_WARNING_ISSUED,
    ClockEventType.BLIND_STRUCTURE_UPDATED,
    ClockEventType.CLOCK_SETTINGS_UPDATED
  ];
  return adminEvents.includes(event.eventType as ClockEventType);
}

