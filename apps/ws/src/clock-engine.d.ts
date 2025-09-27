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
    status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
    currentLevelIdx: number;
    currentLevel: BlindLevel;
    nextLevel?: BlindLevel;
    elapsedSeconds: number;
    remainingSeconds: number;
    totalElapsedSeconds: number;
    pausedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    serverTime: number;
    driftCorrection: number;
}
export declare class ClockEngine extends EventEmitter {
    private tournamentId;
    private levels;
    private state;
    private timer?;
    private lastTick;
    private driftAdjustment;
    private syncCallback?;
    constructor(tournamentId: string, levels: BlindLevel[], syncCallback?: (state: ClockState) => Promise<void>);
    getState(): ClockState;
    start(levelIdx?: number): ClockState;
    pause(): ClockState;
    resume(): ClockState;
    stop(): ClockState;
    jumpToLevel(levelIdx: number): ClockState;
    private startTimer;
    private stopTimer;
    private handleLevelComplete;
}
//# sourceMappingURL=clock-engine.d.ts.map