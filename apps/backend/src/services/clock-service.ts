import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { EventStore } from './event-store';
import {
  ClockEventType,
  ClockEventBuilder,
  ClockInitializedData,
  ClockStartedData,
  ClockPausedData,
  ClockResumedData,
  LevelAdvancedData,
  BreakStartedData,
  BreakEndedData,
  TimeSyncRequestedData,
  DriftDetectedData,
  ClockErrorOccurredData,
  ClockWarningIssuedData,
  ClockManuallyAdjustedData
} from '../types/clock-events';

// Clock State Interface
export interface ClockState {
  tournamentId: string;
  organizationId: string;
  status: 'idle' | 'running' | 'paused' | 'break' | 'completed' | 'error';
  currentLevelIdx: number;
  levelStartTime: number; // timestamp
  pausedDuration: number; // accumulated pause time in ms
  totalPausedTime: number; // total pause time for current level
  breakStartTime?: number; // timestamp when break started
  lastSyncTime: number; // last synchronization timestamp
  serverTime: number; // current server timestamp
  version: number; // for optimistic locking
  settings: ClockSettings;
  blindStructure: BlindLevel[];
  statistics: ClockStatistics;
}

export interface BlindLevel {
  idx: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationSeconds: number;
  isBreak: boolean;
  breakName?: string;
}

export interface ClockSettings {
  autoAdvance: boolean;
  warningMinutes: number[]; // [5, 2, 1] for warnings at 5, 2, 1 minutes
  allowManualControl: boolean;
  driftCorrectionThreshold: number; // milliseconds
  syncInterval: number; // milliseconds
  pauseOnDisconnect: boolean;
  enableBreaks: boolean;
  breakExtension: number; // seconds
}

export interface ClockStatistics {
  playersRemaining: number;
  averageChipStack: number;
  totalChipsInPlay: number;
  eliminations: number;
  rebuys: number;
  addons: number;
  handsPlayed?: number;
}

export interface TimeSyncRequest {
  clientId: string;
  clientTime: number;
  requestId: string;
  timestamp: number;
}

export interface TimeSyncResponse {
  serverTime: number;
  drift: number;
  correction: number;
  requestId: string;
}

export interface ClientConnection {
  id: string;
  socketId: string;
  userId?: string;
  lastSync: number;
  drift: number;
  isController: boolean;
  connectedAt: number;
}

export class ClockService extends EventEmitter {
  private clockStates = new Map<string, ClockState>();
  private clockIntervals = new Map<string, NodeJS.Timer>();
  private clientConnections = new Map<string, ClientConnection>();
  private syncIntervals = new Map<string, NodeJS.Timer>();
  private warningTimers = new Map<string, NodeJS.Timer[]>();

  constructor(
    private prisma: PrismaClient,
    private eventStore: EventStore
  ) {
    super();
    this.setupEventListeners();
  }

  // Initialize clock for a tournament
  async initializeClock(
    organizationId: string,
    tournamentId: string,
    blindStructure: BlindLevel[],
    settings: Partial<ClockSettings> = {},
    userId: string
  ): Promise<ClockState> {
    const defaultSettings: ClockSettings = {
      autoAdvance: true,
      warningMinutes: [5, 2, 1],
      allowManualControl: true,
      driftCorrectionThreshold: 1000, // 1 second
      syncInterval: 5000, // 5 seconds
      pauseOnDisconnect: false,
      enableBreaks: true,
      breakExtension: 0
    };

    const clockSettings = { ...defaultSettings, ...settings };

    const initialState: ClockState = {
      tournamentId,
      organizationId,
      status: 'idle',
      currentLevelIdx: 0,
      levelStartTime: 0,
      pausedDuration: 0,
      totalPausedTime: 0,
      lastSyncTime: Date.now(),
      serverTime: Date.now(),
      version: 1,
      settings: clockSettings,
      blindStructure,
      statistics: {
        playersRemaining: 0,
        averageChipStack: 0,
        totalChipsInPlay: 0,
        eliminations: 0,
        rebuys: 0,
        addons: 0
      }
    };

    this.clockStates.set(tournamentId, initialState);

    // Create initialization event
    const initEvent: ClockInitializedData = {
      tournamentId,
      organizationId,
      blindStructureId: `${tournamentId}-structure`,
      initialLevel: 0,
      totalLevels: blindStructure.length,
      clockSettings,
      initializedBy: userId
    };

    await this.eventStore.append(
      organizationId,
      tournamentId,
      'Clock',
      ClockEventType.CLOCK_INITIALIZED,
      initEvent,
      { userId, tournamentId }
    );

    // Store in database
    await this.persistClockState(initialState);

    this.emit('clock:initialized', { tournamentId, state: initialState });
    return initialState;
  }

  // Start the clock
  async startClock(
    tournamentId: string,
    userId: string,
    statistics?: Partial<ClockStatistics>
  ): Promise<ClockState> {
    const state = this.clockStates.get(tournamentId);
    if (!state) {
      throw new Error(`Clock not found for tournament ${tournamentId}`);
    }

    if (state.status !== 'idle' && state.status !== 'paused') {
      throw new Error(`Cannot start clock in status: ${state.status}`);
    }

    const now = Date.now();
    const waspaused = state.status === 'paused';

    // Update state
    state.status = 'running';
    state.levelStartTime = now - state.pausedDuration;
    state.lastSyncTime = now;
    state.serverTime = now;
    state.version++;

    if (statistics) {
      state.statistics = { ...state.statistics, ...statistics };
    }

    this.clockStates.set(tournamentId, state);

    // Start clock interval
    this.startClockInterval(tournamentId);

    // Start sync interval
    this.startSyncInterval(tournamentId);

    // Setup warning timers
    this.setupWarningTimers(tournamentId);

    // Create event
    const startEvent: ClockStartedData = {
      tournamentId,
      startedAt: new Date(now),
      currentLevel: state.currentLevelIdx,
      levelStartTime: state.levelStartTime,
      blindLevel: state.blindStructure[state.currentLevelIdx],
      playersRemaining: state.statistics.playersRemaining,
      averageChipStack: state.statistics.averageChipStack,
      totalChipsInPlay: state.statistics.totalChipsInPlay,
      startedBy: userId
    };

    await this.eventStore.append(
      state.organizationId,
      tournamentId,
      'Clock',
      ClockEventType.CLOCK_STARTED,
      startEvent,
      { userId, tournamentId }
    );

    await this.persistClockState(state);

    this.emit('clock:started', { tournamentId, state, waspaused });
    return state;
  }

  // Pause the clock
  async pauseClock(
    tournamentId: string,
    userId: string,
    reason: ClockPausedData['pauseReason'] = 'MANUAL',
    notes?: string
  ): Promise<ClockState> {
    const state = this.clockStates.get(tournamentId);
    if (!state) {
      throw new Error(`Clock not found for tournament ${tournamentId}`);
    }

    if (state.status !== 'running' && state.status !== 'break') {
      throw new Error(`Cannot pause clock in status: ${state.status}`);
    }

    const now = Date.now();
    const elapsed = now - state.levelStartTime;

    // Update state
    state.status = 'paused';
    state.pausedDuration = elapsed;
    state.lastSyncTime = now;
    state.serverTime = now;
    state.version++;

    this.clockStates.set(tournamentId, state);

    // Stop intervals
    this.stopClockInterval(tournamentId);
    this.clearWarningTimers(tournamentId);

    // Calculate time remaining
    const currentLevel = state.blindStructure[state.currentLevelIdx];
    const timeRemaining = (currentLevel.durationSeconds * 1000) - elapsed;

    // Create event
    const pauseEvent: ClockPausedData = {
      tournamentId,
      pausedAt: new Date(now),
      currentLevel: state.currentLevelIdx,
      timeRemaining: Math.max(0, timeRemaining),
      pauseReason: reason,
      pausedBy: userId,
      notes
    };

    await this.eventStore.append(
      state.organizationId,
      tournamentId,
      'Clock',
      ClockEventType.CLOCK_PAUSED,
      pauseEvent,
      { userId, tournamentId }
    );

    await this.persistClockState(state);

    this.emit('clock:paused', { tournamentId, state, reason, notes });
    return state;
  }

  // Resume the clock
  async resumeClock(
    tournamentId: string,
    userId: string,
    notes?: string
  ): Promise<ClockState> {
    const state = this.clockStates.get(tournamentId);
    if (!state) {
      throw new Error(`Clock not found for tournament ${tournamentId}`);
    }

    if (state.status !== 'paused') {
      throw new Error(`Cannot resume clock in status: ${state.status}`);
    }

    const now = Date.now();
    const pauseDuration = state.pausedDuration;

    // Update state
    state.status = 'running';
    state.levelStartTime = now - pauseDuration;
    state.totalPausedTime += pauseDuration;
    state.pausedDuration = 0;
    state.lastSyncTime = now;
    state.serverTime = now;
    state.version++;

    this.clockStates.set(tournamentId, state);

    // Restart intervals
    this.startClockInterval(tournamentId);
    this.setupWarningTimers(tournamentId);

    // Calculate time remaining
    const currentLevel = state.blindStructure[state.currentLevelIdx];
    const timeRemaining = (currentLevel.durationSeconds * 1000) - pauseDuration;

    // Create event
    const resumeEvent: ClockResumedData = {
      tournamentId,
      resumedAt: new Date(now),
      currentLevel: state.currentLevelIdx,
      timeRemaining: Math.max(0, timeRemaining),
      pauseDuration,
      resumedBy: userId,
      notes
    };

    await this.eventStore.append(
      state.organizationId,
      tournamentId,
      'Clock',
      ClockEventType.CLOCK_RESUMED,
      resumeEvent,
      { userId, tournamentId }
    );

    await this.persistClockState(state);

    this.emit('clock:resumed', { tournamentId, state, pauseDuration, notes });
    return state;
  }

  // Advance to next level
  async advanceLevel(
    tournamentId: string,
    userId?: string,
    autoAdvanced: boolean = false
  ): Promise<ClockState> {
    const state = this.clockStates.get(tournamentId);
    if (!state) {
      throw new Error(`Clock not found for tournament ${tournamentId}`);
    }

    if (state.currentLevelIdx >= state.blindStructure.length - 1) {
      return this.completeClock(tournamentId, userId);
    }

    const now = Date.now();
    const previousLevel = state.blindStructure[state.currentLevelIdx];
    const actualDuration = now - state.levelStartTime + state.totalPausedTime;

    // Update to next level
    state.currentLevelIdx++;
    const newLevel = state.blindStructure[state.currentLevelIdx];

    // Reset timing
    state.levelStartTime = now;
    state.pausedDuration = 0;
    state.totalPausedTime = 0;
    state.lastSyncTime = now;
    state.serverTime = now;
    state.version++;

    // Handle breaks
    if (newLevel.isBreak) {
      state.status = 'break';
      state.breakStartTime = now;
    }

    this.clockStates.set(tournamentId, state);

    // Update timers
    this.clearWarningTimers(tournamentId);
    if (state.status === 'running') {
      this.setupWarningTimers(tournamentId);
    }

    // Create event
    const advanceEvent: LevelAdvancedData = {
      tournamentId,
      advancedAt: new Date(now),
      previousLevel: {
        idx: previousLevel.idx,
        smallBlind: previousLevel.smallBlind,
        bigBlind: previousLevel.bigBlind,
        ante: previousLevel.ante,
        duration: previousLevel.durationSeconds * 1000,
        actualDuration
      },
      newLevel,
      playersRemaining: state.statistics.playersRemaining,
      averageChipStack: state.statistics.averageChipStack,
      totalChipsInPlay: state.statistics.totalChipsInPlay,
      autoAdvanced,
      advancedBy: userId
    };

    await this.eventStore.append(
      state.organizationId,
      tournamentId,
      'Clock',
      ClockEventType.LEVEL_ADVANCED,
      advanceEvent,
      { userId, tournamentId }
    );

    // Handle break start
    if (newLevel.isBreak) {
      const breakEvent: BreakStartedData = {
        tournamentId,
        startedAt: new Date(now),
        breakLevel: state.currentLevelIdx,
        breakName: newLevel.breakName || `Break ${state.currentLevelIdx + 1}`,
        breakDuration: newLevel.durationSeconds,
        scheduledEndTime: new Date(now + (newLevel.durationSeconds * 1000)),
        playersRemaining: state.statistics.playersRemaining,
        startedBy: userId
      };

      await this.eventStore.append(
        state.organizationId,
        tournamentId,
        'Clock',
        ClockEventType.BREAK_STARTED,
        breakEvent,
        { userId, tournamentId }
      );

      this.emit('break:started', { tournamentId, state, breakData: breakEvent });
    }

    await this.persistClockState(state);

    this.emit('level:advanced', { tournamentId, state, previousLevel, newLevel, autoAdvanced });
    return state;
  }

  // Go to specific level
  async goToLevel(
    tournamentId: string,
    levelIdx: number,
    userId: string,
    reason: string = 'MANUAL_ADVANCE'
  ): Promise<ClockState> {
    const state = this.clockStates.get(tournamentId);
    if (!state) {
      throw new Error(`Clock not found for tournament ${tournamentId}`);
    }

    if (levelIdx < 0 || levelIdx >= state.blindStructure.length) {
      throw new Error(`Invalid level index: ${levelIdx}`);
    }

    const now = Date.now();
    const fromLevel = state.currentLevelIdx;
    const timeRemaining = this.calculateTimeRemaining(state);

    // Update state
    state.currentLevelIdx = levelIdx;
    state.levelStartTime = now;
    state.pausedDuration = 0;
    state.totalPausedTime = 0;
    state.lastSyncTime = now;
    state.serverTime = now;
    state.version++;

    const newLevel = state.blindStructure[levelIdx];
    if (newLevel.isBreak) {
      state.status = 'break';
      state.breakStartTime = now;
    } else if (state.status === 'break') {
      state.status = 'running';
      delete state.breakStartTime;
    }

    this.clockStates.set(tournamentId, state);

    // Update timers
    this.clearWarningTimers(tournamentId);
    if (state.status === 'running') {
      this.setupWarningTimers(tournamentId);
    }

    // Create manual adjustment event
    const adjustmentEvent: ClockManuallyAdjustedData = {
      tournamentId,
      adjustedAt: new Date(now),
      adjustmentType: levelIdx > fromLevel ? 'LEVEL_SKIPPED' : 'LEVEL_REPEATED',
      previousState: {
        level: fromLevel,
        timeRemaining,
        status: state.status
      },
      newState: {
        level: levelIdx,
        timeRemaining: newLevel.durationSeconds * 1000,
        status: state.status
      },
      adjustedBy: userId,
      reason
    };

    await this.eventStore.append(
      state.organizationId,
      tournamentId,
      'Clock',
      ClockEventType.CLOCK_MANUALLY_ADJUSTED,
      adjustmentEvent,
      { userId, tournamentId }
    );

    await this.persistClockState(state);

    this.emit('level:changed', { tournamentId, state, fromLevel, toLevel: levelIdx, reason });
    return state;
  }

  // Complete the clock
  async completeClock(tournamentId: string, userId?: string): Promise<ClockState> {
    const state = this.clockStates.get(tournamentId);
    if (!state) {
      throw new Error(`Clock not found for tournament ${tournamentId}`);
    }

    const now = Date.now();

    // Update state
    state.status = 'completed';
    state.lastSyncTime = now;
    state.serverTime = now;
    state.version++;

    this.clockStates.set(tournamentId, state);

    // Stop all intervals
    this.stopClockInterval(tournamentId);
    this.stopSyncInterval(tournamentId);
    this.clearWarningTimers(tournamentId);

    await this.eventStore.append(
      state.organizationId,
      tournamentId,
      'Clock',
      ClockEventType.CLOCK_COMPLETED,
      {
        tournamentId,
        completedAt: new Date(now),
        finalLevel: state.currentLevelIdx,
        totalDuration: now - (state.levelStartTime - state.totalPausedTime),
        playersRemaining: state.statistics.playersRemaining,
        completedBy: userId
      },
      { userId, tournamentId }
    );

    await this.persistClockState(state);

    this.emit('clock:completed', { tournamentId, state });
    return state;
  }

  // Get current clock state
  getClockState(tournamentId: string): ClockState | undefined {
    return this.clockStates.get(tournamentId);
  }

  // Update tournament statistics
  async updateStatistics(
    tournamentId: string,
    statistics: Partial<ClockStatistics>,
    userId?: string
  ): Promise<ClockState> {
    const state = this.clockStates.get(tournamentId);
    if (!state) {
      throw new Error(`Clock not found for tournament ${tournamentId}`);
    }

    state.statistics = { ...state.statistics, ...statistics };
    state.version++;

    this.clockStates.set(tournamentId, state);
    await this.persistClockState(state);

    this.emit('statistics:updated', { tournamentId, state, statistics });
    return state;
  }

  // Time synchronization
  async requestTimeSync(
    tournamentId: string,
    request: TimeSyncRequest
  ): Promise<TimeSyncResponse> {
    const state = this.clockStates.get(tournamentId);
    if (!state) {
      throw new Error(`Clock not found for tournament ${tournamentId}`);
    }

    const serverTime = Date.now();
    const drift = request.clientTime - serverTime;
    const correction = Math.abs(drift) > state.settings.driftCorrectionThreshold ? -drift : 0;

    // Log sync request
    const syncEvent: TimeSyncRequestedData = {
      tournamentId,
      requestedAt: new Date(serverTime),
      clientId: request.clientId,
      clientTime: request.clientTime,
      requestId: request.requestId
    };

    await this.eventStore.append(
      state.organizationId,
      tournamentId,
      'Clock',
      ClockEventType.TIME_SYNC_REQUESTED,
      syncEvent,
      { tournamentId, sourceId: request.clientId, correlationId: request.requestId }
    );

    // Detect significant drift
    if (Math.abs(drift) > state.settings.driftCorrectionThreshold) {
      const driftEvent: DriftDetectedData = {
        tournamentId,
        detectedAt: new Date(serverTime),
        clientId: request.clientId,
        expectedTime: serverTime,
        actualTime: request.clientTime,
        driftAmount: drift,
        threshold: state.settings.driftCorrectionThreshold,
        severity: Math.abs(drift) > 5000 ? 'HIGH' : 'MEDIUM'
      };

      await this.eventStore.append(
        state.organizationId,
        tournamentId,
        'Clock',
        ClockEventType.DRIFT_DETECTED,
        driftEvent,
        { tournamentId, sourceId: request.clientId }
      );

      this.emit('drift:detected', { tournamentId, clientId: request.clientId, drift, severity: driftEvent.severity });
    }

    return {
      serverTime,
      drift,
      correction,
      requestId: request.requestId
    };
  }

  // Client connection management
  addClientConnection(connection: ClientConnection): void {
    this.clientConnections.set(connection.id, connection);
    this.emit('client:connected', connection);
  }

  removeClientConnection(clientId: string): void {
    const connection = this.clientConnections.get(clientId);
    if (connection) {
      this.clientConnections.delete(clientId);
      this.emit('client:disconnected', connection);
    }
  }

  getConnectedClients(tournamentId?: string): ClientConnection[] {
    return Array.from(this.clientConnections.values());
  }

  // Private helper methods
  private startClockInterval(tournamentId: string): void {
    this.stopClockInterval(tournamentId);

    const interval = setInterval(() => {
      this.updateClockTick(tournamentId);
    }, 1000);

    this.clockIntervals.set(tournamentId, interval);
  }

  private stopClockInterval(tournamentId: string): void {
    const interval = this.clockIntervals.get(tournamentId);
    if (interval) {
      clearInterval(interval);
      this.clockIntervals.delete(tournamentId);
    }
  }

  private startSyncInterval(tournamentId: string): void {
    const state = this.clockStates.get(tournamentId);
    if (!state) return;

    this.stopSyncInterval(tournamentId);

    const interval = setInterval(() => {
      this.broadcastSync(tournamentId);
    }, state.settings.syncInterval);

    this.syncIntervals.set(tournamentId, interval);
  }

  private stopSyncInterval(tournamentId: string): void {
    const interval = this.syncIntervals.get(tournamentId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(tournamentId);
    }
  }

  private async updateClockTick(tournamentId: string): Promise<void> {
    const state = this.clockStates.get(tournamentId);
    if (!state || state.status !== 'running') return;

    const now = Date.now();
    const elapsed = now - state.levelStartTime;
    const currentLevel = state.blindStructure[state.currentLevelIdx];
    const levelDuration = currentLevel.durationSeconds * 1000;

    // Update server time
    state.serverTime = now;
    state.lastSyncTime = now;

    // Check if level should advance
    if (elapsed >= levelDuration && state.settings.autoAdvance) {
      try {
        await this.advanceLevel(tournamentId, undefined, true);
      } catch (error) {
        await this.handleClockError(tournamentId, 'LEVEL_CALCULATION_ERROR', error as Error);
      }
    }

    this.emit('clock:tick', { tournamentId, state, elapsed, remaining: levelDuration - elapsed });
  }

  private broadcastSync(tournamentId: string): void {
    const state = this.clockStates.get(tournamentId);
    if (!state) return;

    this.emit('clock:sync', { tournamentId, state });
  }

  private setupWarningTimers(tournamentId: string): void {
    const state = this.clockStates.get(tournamentId);
    if (!state || state.status !== 'running') return;

    this.clearWarningTimers(tournamentId);

    const currentLevel = state.blindStructure[state.currentLevelIdx];
    const levelDuration = currentLevel.durationSeconds * 1000;
    const elapsed = Date.now() - state.levelStartTime;
    const remaining = levelDuration - elapsed;

    const timers: NodeJS.Timer[] = [];

    state.settings.warningMinutes.forEach(minutes => {
      const warningTime = minutes * 60 * 1000; // Convert to milliseconds
      const timeToWarning = remaining - warningTime;

      if (timeToWarning > 0) {
        const timer = setTimeout(() => {
          this.issueWarning(tournamentId, 'TIME_WARNING', `${minutes} minute${minutes > 1 ? 's' : ''} remaining`, minutes);
        }, timeToWarning);

        timers.push(timer);
      }
    });

    this.warningTimers.set(tournamentId, timers);
  }

  private clearWarningTimers(tournamentId: string): void {
    const timers = this.warningTimers.get(tournamentId);
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.warningTimers.delete(tournamentId);
    }
  }

  private async issueWarning(
    tournamentId: string,
    type: ClockWarningIssuedData['warningType'],
    message: string,
    timeRemaining?: number
  ): Promise<void> {
    const state = this.clockStates.get(tournamentId);
    if (!state) return;

    const warningEvent: ClockWarningIssuedData = {
      tournamentId,
      issuedAt: new Date(),
      warningType: type,
      warningMessage: message,
      timeRemaining,
      level: state.currentLevelIdx,
      affectedClients: Array.from(this.clientConnections.keys())
    };

    await this.eventStore.append(
      state.organizationId,
      tournamentId,
      'Clock',
      ClockEventType.CLOCK_WARNING_ISSUED,
      warningEvent,
      { tournamentId }
    );

    this.emit('clock:warning', { tournamentId, warning: warningEvent });
  }

  private async handleClockError(
    tournamentId: string,
    errorType: ClockErrorOccurredData['errorType'],
    error: Error
  ): Promise<void> {
    const state = this.clockStates.get(tournamentId);
    if (!state) return;

    const errorEvent: ClockErrorOccurredData = {
      tournamentId,
      occurredAt: new Date(),
      errorType,
      errorMessage: error.message,
      errorStack: error.stack,
      clockState: {
        level: state.currentLevelIdx,
        timeRemaining: this.calculateTimeRemaining(state),
        status: state.status,
        lastSync: new Date(state.lastSyncTime)
      },
      affectedClients: Array.from(this.clientConnections.keys()),
      severity: 'HIGH',
      autoRecovered: false
    };

    await this.eventStore.append(
      state.organizationId,
      tournamentId,
      'Clock',
      ClockEventType.CLOCK_ERROR_OCCURRED,
      errorEvent,
      { tournamentId }
    );

    this.emit('clock:error', { tournamentId, error: errorEvent });
  }

  private calculateTimeRemaining(state: ClockState): number {
    if (state.status !== 'running' && state.status !== 'paused') return 0;

    const currentLevel = state.blindStructure[state.currentLevelIdx];
    const levelDuration = currentLevel.durationSeconds * 1000;

    let elapsed: number;
    if (state.status === 'paused') {
      elapsed = state.pausedDuration;
    } else {
      elapsed = Date.now() - state.levelStartTime;
    }

    return Math.max(0, levelDuration - elapsed);
  }

  private async persistClockState(state: ClockState): Promise<void> {
    try {
      await this.prisma.clockState.upsert({
        where: { tournamentId: state.tournamentId },
        update: {
          currentLevelIdx: state.currentLevelIdx,
          status: state.status,
          levelStartTime: BigInt(state.levelStartTime),
          pausedDuration: BigInt(state.pausedDuration),
          serverTime: BigInt(state.serverTime),
          updatedAt: new Date()
        },
        create: {
          tournamentId: state.tournamentId,
          currentLevelIdx: state.currentLevelIdx,
          status: state.status,
          levelStartTime: BigInt(state.levelStartTime),
          pausedDuration: BigInt(state.pausedDuration),
          serverTime: BigInt(state.serverTime)
        }
      });
    } catch (error) {
      console.error('Failed to persist clock state:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Listen for tournament events that affect clock
    this.eventStore.on('event:PlayerEliminated', this.handlePlayerEliminated.bind(this));
    this.eventStore.on('event:PlayerRegistered', this.handlePlayerRegistered.bind(this));
    this.eventStore.on('event:RebuyProcessed', this.handleRebuyProcessed.bind(this));
    this.eventStore.on('event:AddonProcessed', this.handleAddonProcessed.bind(this));
  }

  private async handlePlayerEliminated(event: any): Promise<void> {
    const tournamentId = event.metadata.tournamentId;
    if (!tournamentId) return;

    const state = this.clockStates.get(tournamentId);
    if (!state) return;

    state.statistics.eliminations++;
    state.statistics.playersRemaining = Math.max(0, state.statistics.playersRemaining - 1);

    this.emit('statistics:updated', { tournamentId, state, statistics: state.statistics });
  }

  private async handlePlayerRegistered(event: any): Promise<void> {
    const tournamentId = event.metadata.tournamentId;
    if (!tournamentId) return;

    const state = this.clockStates.get(tournamentId);
    if (!state) return;

    if (!event.eventData.isRebuy) {
      state.statistics.playersRemaining++;
    }

    this.emit('statistics:updated', { tournamentId, state, statistics: state.statistics });
  }

  private async handleRebuyProcessed(event: any): Promise<void> {
    const tournamentId = event.metadata.tournamentId;
    if (!tournamentId) return;

    const state = this.clockStates.get(tournamentId);
    if (!state) return;

    state.statistics.rebuys++;

    this.emit('statistics:updated', { tournamentId, state, statistics: state.statistics });
  }

  private async handleAddonProcessed(event: any): Promise<void> {
    const tournamentId = event.metadata.tournamentId;
    if (!tournamentId) return;

    const state = this.clockStates.get(tournamentId);
    if (!state) return;

    state.statistics.addons++;

    this.emit('statistics:updated', { tournamentId, state, statistics: state.statistics });
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    // Stop all intervals
    for (const [tournamentId] of this.clockStates) {
      this.stopClockInterval(tournamentId);
      this.stopSyncInterval(tournamentId);
      this.clearWarningTimers(tournamentId);
    }

    // Clear all states
    this.clockStates.clear();
    this.clientConnections.clear();
  }
}

export default ClockService;