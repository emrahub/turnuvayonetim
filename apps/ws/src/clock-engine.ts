import { EventEmitter } from 'events';

export interface BlindLevel {
  idx: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationSeconds: number;
  isBreak: boolean;
  breakName?: string | null;
}

export interface ClockState {
  tournamentId: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentLevelIdx: number;
  currentLevel: BlindLevel;
  nextLevel?: BlindLevel;
  elapsedSeconds: number;
  remainingSeconds: number;
  totalElapsedSeconds: number;
  levelStartTime: number;
  pausedDuration: number;
  pausedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  serverTime: number;
  driftCorrection: number;
  version: number;
}

export class ClockEngine extends EventEmitter {
  private _tournamentId: string;
  private levels: BlindLevel[];
  private state: ClockState;
  private timer?: NodeJS.Timeout;
  private lastTick: number = Date.now();
  private driftAdjustment: number = 0;
  private syncCallback?: (state: ClockState) => Promise<void>;
  private levelStartTime: number = Date.now();
  private pausedDuration: number = 0;
  private version: number = 1;

  constructor(tournamentId: string, levels: BlindLevel[], syncCallback?: (state: ClockState) => Promise<void>) {
    super();
    this._tournamentId = tournamentId;
    this.levels = levels;
    this.syncCallback = syncCallback;

    // Initialize state
    this.levelStartTime = Date.now();
    this.state = {
      tournamentId,
      status: 'idle',
      currentLevelIdx: 0,
      currentLevel: levels[0],
      nextLevel: levels[1],
      elapsedSeconds: 0,
      remainingSeconds: levels[0].durationSeconds,
      totalElapsedSeconds: 0,
      levelStartTime: this.levelStartTime,
      pausedDuration: 0,
      serverTime: Date.now(),
      driftCorrection: 0,
      version: this.version
    };
  }

  public getState(): ClockState {
    return { ...this.state };
  }

  public getTournamentId(): string {
    return this._tournamentId;
  }

  public start(levelIdx: number = 0): ClockState {
    if (this.state.status === 'running') {
      return this.getState();
    }

    this.levelStartTime = Date.now();
    this.pausedDuration = 0;
    this.version++;

    this.state.currentLevelIdx = levelIdx;
    this.state.currentLevel = this.levels[levelIdx];
    this.state.nextLevel = this.levels[levelIdx + 1];
    this.state.elapsedSeconds = 0;
    this.state.remainingSeconds = this.state.currentLevel.durationSeconds;
    this.state.status = 'running';
    this.state.startedAt = new Date();
    this.state.levelStartTime = this.levelStartTime;
    this.state.pausedDuration = this.pausedDuration;
    this.state.version = this.version;

    this.lastTick = Date.now();
    this.startTimer();

    this.emit('clock:started', this.getState());
    return this.getState();
  }

  public pause(): ClockState {
    if (this.state.status !== 'running') {
      return this.getState();
    }

    const now = Date.now();
    this.pausedDuration += (now - this.lastTick);
    this.version++;

    this.state.status = 'paused';
    this.state.pausedAt = new Date();
    this.state.pausedDuration = this.pausedDuration;
    this.state.version = this.version;
    this.stopTimer();

    this.emit('clock:paused', this.getState());
    return this.getState();
  }

  public resume(): ClockState {
    if (this.state.status !== 'paused') {
      return this.getState();
    }

    this.version++;
    this.state.status = 'running';
    this.state.version = this.version;
    delete this.state.pausedAt;

    this.lastTick = Date.now();
    this.startTimer();

    this.emit('clock:resumed', this.getState());
    return this.getState();
  }

  public stop(): ClockState {
    this.stopTimer();
    this.version++;
    this.state.status = 'idle';
    this.state.version = this.version;
    this.state.completedAt = new Date();

    this.emit('clock:stopped', this.getState());
    return this.getState();
  }

  public jumpToLevel(levelIdx: number): ClockState {
    if (levelIdx < 0 || levelIdx >= this.levels.length) {
      throw new Error('Invalid level index');
    }

    const wasRunning = this.state.status === 'running';
    if (wasRunning) {
      this.stopTimer();
    }

    this.levelStartTime = Date.now();
    this.pausedDuration = 0;
    this.version++;

    this.state.currentLevelIdx = levelIdx;
    this.state.currentLevel = this.levels[levelIdx];
    this.state.nextLevel = this.levels[levelIdx + 1];
    this.state.elapsedSeconds = 0;
    this.state.remainingSeconds = this.state.currentLevel.durationSeconds;
    this.state.levelStartTime = this.levelStartTime;
    this.state.pausedDuration = this.pausedDuration;
    this.state.version = this.version;

    if (wasRunning) {
      this.lastTick = Date.now();
      this.startTimer();
    }

    this.emit('clock:levelChanged', this.getState());
    return this.getState();
  }

  private startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    // High precision timer with drift correction
    this.timer = setInterval(() => {
      const now = Date.now();
      const actualElapsed = Math.floor((now - this.lastTick) / 1000);

      if (actualElapsed > 0) {
        // Calculate drift and adjust
        const expectedTime = this.lastTick + (actualElapsed * 1000);
        this.driftAdjustment = now - expectedTime;

        this.state.elapsedSeconds += actualElapsed;
        this.state.remainingSeconds = Math.max(0, this.state.remainingSeconds - actualElapsed);
        this.state.totalElapsedSeconds += actualElapsed;

        this.lastTick = now - this.driftAdjustment;

        // Check if level is complete
        if (this.state.remainingSeconds === 0) {
          this.handleLevelComplete();
        }

        // Update server time and drift correction
        this.state.serverTime = now;
        this.state.driftCorrection = this.driftAdjustment;
        this.state.levelStartTime = this.levelStartTime;
        this.state.pausedDuration = this.pausedDuration;

        // Sync with database if callback provided
        if (this.syncCallback) {
          this.syncCallback(this.getState()).catch(err => {
            console.error('Clock sync error:', err);
          });
        }

        // Emit sync event
        this.emit('clock:sync', this.getState());
      }
    }, 250); // Check 4 times per second for smooth updates
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private handleLevelComplete(): void {
    const nextLevelIdx = this.state.currentLevelIdx + 1;

    if (nextLevelIdx >= this.levels.length) {
      // Tournament complete
      this.version++;
      this.state.status = 'completed';
      this.state.version = this.version;
      this.state.completedAt = new Date();
      this.stopTimer();

      this.emit('clock:completed', this.getState());
    } else {
      // Move to next level
      this.levelStartTime = Date.now();
      this.pausedDuration = 0;
      this.version++;

      this.state.currentLevelIdx = nextLevelIdx;
      this.state.currentLevel = this.levels[nextLevelIdx];
      this.state.nextLevel = this.levels[nextLevelIdx + 1];
      this.state.elapsedSeconds = 0;
      this.state.remainingSeconds = this.state.currentLevel.durationSeconds;
      this.state.levelStartTime = this.levelStartTime;
      this.state.pausedDuration = this.pausedDuration;
      this.state.version = this.version;

      this.emit('clock:levelChanged', this.getState());
    }
  }
}