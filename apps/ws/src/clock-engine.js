"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClockEngine = void 0;
const events_1 = require("events");
class ClockEngine extends events_1.EventEmitter {
    tournamentId;
    levels;
    state;
    timer;
    lastTick = Date.now();
    driftAdjustment = 0;
    syncCallback;
    constructor(tournamentId, levels, syncCallback) {
        super();
        this.tournamentId = tournamentId;
        this.levels = levels;
        this.syncCallback = syncCallback;
        // Initialize state
        this.state = {
            tournamentId,
            status: 'IDLE',
            currentLevelIdx: 0,
            currentLevel: levels[0],
            nextLevel: levels[1],
            elapsedSeconds: 0,
            remainingSeconds: levels[0].durationSeconds,
            totalElapsedSeconds: 0,
            serverTime: Date.now(),
            driftCorrection: 0
        };
    }
    getState() {
        return { ...this.state };
    }
    start(levelIdx = 0) {
        if (this.state.status === 'RUNNING') {
            return this.getState();
        }
        this.state.currentLevelIdx = levelIdx;
        this.state.currentLevel = this.levels[levelIdx];
        this.state.nextLevel = this.levels[levelIdx + 1];
        this.state.elapsedSeconds = 0;
        this.state.remainingSeconds = this.state.currentLevel.durationSeconds;
        this.state.status = 'RUNNING';
        this.state.startedAt = new Date();
        this.lastTick = Date.now();
        this.startTimer();
        this.emit('clock:started', this.getState());
        return this.getState();
    }
    pause() {
        if (this.state.status !== 'RUNNING') {
            return this.getState();
        }
        this.state.status = 'PAUSED';
        this.state.pausedAt = new Date();
        this.stopTimer();
        this.emit('clock:paused', this.getState());
        return this.getState();
    }
    resume() {
        if (this.state.status !== 'PAUSED') {
            return this.getState();
        }
        this.state.status = 'RUNNING';
        delete this.state.pausedAt;
        this.lastTick = Date.now();
        this.startTimer();
        this.emit('clock:resumed', this.getState());
        return this.getState();
    }
    stop() {
        this.stopTimer();
        this.state.status = 'IDLE';
        this.state.completedAt = new Date();
        this.emit('clock:stopped', this.getState());
        return this.getState();
    }
    jumpToLevel(levelIdx) {
        if (levelIdx < 0 || levelIdx >= this.levels.length) {
            throw new Error('Invalid level index');
        }
        const wasRunning = this.state.status === 'RUNNING';
        if (wasRunning) {
            this.stopTimer();
        }
        this.state.currentLevelIdx = levelIdx;
        this.state.currentLevel = this.levels[levelIdx];
        this.state.nextLevel = this.levels[levelIdx + 1];
        this.state.elapsedSeconds = 0;
        this.state.remainingSeconds = this.state.currentLevel.durationSeconds;
        if (wasRunning) {
            this.lastTick = Date.now();
            this.startTimer();
        }
        this.emit('clock:levelChanged', this.getState());
        return this.getState();
    }
    startTimer() {
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
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
    handleLevelComplete() {
        const nextLevelIdx = this.state.currentLevelIdx + 1;
        if (nextLevelIdx >= this.levels.length) {
            // Tournament complete
            this.state.status = 'COMPLETED';
            this.state.completedAt = new Date();
            this.stopTimer();
            this.emit('clock:completed', this.getState());
        }
        else {
            // Move to next level
            this.state.currentLevelIdx = nextLevelIdx;
            this.state.currentLevel = this.levels[nextLevelIdx];
            this.state.nextLevel = this.levels[nextLevelIdx + 1];
            this.state.elapsedSeconds = 0;
            this.state.remainingSeconds = this.state.currentLevel.durationSeconds;
            this.emit('clock:levelChanged', this.getState());
        }
    }
}
exports.ClockEngine = ClockEngine;
//# sourceMappingURL=clock-engine.js.map