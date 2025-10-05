'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';
import { useTournamentStore } from '../stores/tournamentStore';

interface ClockState {
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

interface BlindLevel {
  idx: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationSeconds: number;
  isBreak: boolean;
  breakName?: string;
}

interface TournamentClockProps {
  tournamentId: string;
  levels: BlindLevel[];
  isController?: boolean;
}

export function TournamentClock({
  tournamentId,
  levels,
  isController = false
}: TournamentClockProps) {
  const { getSocket, joinTournament, emitClockCommand } = useTournamentStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [clockState, setClockState] = useState<ClockState | null>(null);
  // Server time tracking removed - using server-provided values directly
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use shared WebSocket connection from store
  useEffect(() => {
    const socketInstance = getSocket();
    if (!socketInstance) {
      console.warn('Socket not initialized yet in TournamentClock');
      return;
    }

    // Join tournament room
    joinTournament(tournamentId);

    // Set up clock event listeners
    const handleClockSync = (state: ClockState) => {
      // Direct state update from server
      setClockState(state);
    };

    const handleClockStarted = (state: ClockState) => {
      setClockState(state);
      playSound('start');
    };

    const handleClockPaused = (state: ClockState) => {
      setClockState(state);
    };

    const handleClockResumed = (state: ClockState) => {
      setClockState(state);
    };

    const handleClockLevelChanged = (state: ClockState) => {
      setClockState(state);
      playSound('levelChange');
    };

    const handleClockCompleted = (state: ClockState) => {
      setClockState(state);
      playSound('complete');
    };

    socketInstance.on('clock:sync', handleClockSync);
    socketInstance.on('clock:started', handleClockStarted);
    socketInstance.on('clock:paused', handleClockPaused);
    socketInstance.on('clock:resumed', handleClockResumed);
    socketInstance.on('clock:levelChanged', handleClockLevelChanged);
    socketInstance.on('clock:completed', handleClockCompleted);

    setSocket(socketInstance);

    // Cleanup listeners on unmount
    return () => {
      socketInstance.off('clock:sync', handleClockSync);
      socketInstance.off('clock:started', handleClockStarted);
      socketInstance.off('clock:paused', handleClockPaused);
      socketInstance.off('clock:resumed', handleClockResumed);
      socketInstance.off('clock:levelChanged', handleClockLevelChanged);
      socketInstance.off('clock:completed', handleClockCompleted);
    };
  }, [tournamentId, getSocket, joinTournament]);

  // Manual time tracking removed - server provides real-time clock state

  const playSound = useCallback((type: 'start' | 'levelChange' | 'complete') => {
    if (!soundEnabled || !audioRef.current) return;

    const sounds = {
      start: '/sounds/start.mp3',
      levelChange: '/sounds/level-change.mp3',
      complete: '/sounds/complete.mp3'
    };

    audioRef.current.src = sounds[type];
    audioRef.current.play().catch(e => console.log('Sound play failed:', e));
  }, [soundEnabled]);

  // Use server-provided remaining time directly
  const getRemainingTime = useCallback((): number => {
    if (!clockState) return 0;

    // Use the remainingSeconds from the server directly (in seconds)
    // Convert to milliseconds for display consistency
    return clockState.remainingSeconds * 1000;
  }, [clockState]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cents / 100);
  };

  // Control functions using shared socket
  const handleStart = () => emitClockCommand('clock:start');
  const handlePause = () => emitClockCommand('clock:pause');
  const handleResume = () => emitClockCommand('clock:resume');

  const handleNextLevel = () => {
    if (clockState && levels && clockState.currentLevelIdx < levels.length - 1) {
      emitClockCommand('clock:gotoLevel', {
        levelIdx: clockState.currentLevelIdx + 1
      });
    }
  };

  const handlePrevLevel = () => {
    if (clockState && clockState.currentLevelIdx > 0) {
      emitClockCommand('clock:gotoLevel', {
        levelIdx: clockState.currentLevelIdx - 1
      });
    }
  };

  if (!clockState) {
    return (
      <div className="p-8 text-center bg-gray-900 rounded-lg">
        <div className="text-2xl text-gray-500">Connecting to clock...</div>
      </div>
    );
  }

  const currentLevel = clockState.currentLevel;
  const nextLevel = clockState.nextLevel;
  const remainingTime = getRemainingTime();
  const progress = currentLevel
    ? ((currentLevel.durationSeconds * 1000 - remainingTime) / (currentLevel.durationSeconds * 1000)) * 100
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg">
        {/* Main Clock Display */}
        <div className="text-center">
          {currentLevel?.isBreak ? (
            <div className="mb-3 sm:mb-4">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-400">BREAK</div>
              <div className="text-base sm:text-lg lg:text-xl text-gray-300">{currentLevel.breakName}</div>
            </div>
          ) : (
            <div className="mb-3 sm:mb-4">
              <div className="text-base sm:text-lg lg:text-xl text-gray-300">Level {currentLevel?.idx + 1}</div>
            </div>
          )}

          <div className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-mono font-bold mb-4 sm:mb-6 lg:mb-8 tabular-nums">
            {formatTime(remainingTime)}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 sm:h-4 bg-gray-700 rounded-full overflow-hidden mb-4 sm:mb-6 lg:mb-8">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Blinds Display */}
          {!currentLevel?.isBreak && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 text-center">
              <div>
                <div className="text-gray-400 text-xs sm:text-sm">SMALL BLIND</div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold">
                  {formatCurrency(currentLevel?.smallBlind || 0)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs sm:text-sm">BIG BLIND</div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold">
                  {formatCurrency(currentLevel?.bigBlind || 0)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs sm:text-sm">ANTE</div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold">
                  {currentLevel?.ante ? formatCurrency(currentLevel.ante) : '-'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Level Preview */}
        {nextLevel && (
          <div className="mt-4 sm:mt-6 lg:mt-8 pt-4 sm:pt-6 lg:pt-8 border-t border-gray-700">
            <div className="text-center">
              <div className="text-gray-400 text-sm sm:text-base mb-1 sm:mb-2">NEXT LEVEL</div>
              {nextLevel.isBreak ? (
                <div className="text-base sm:text-lg lg:text-xl">
                  Break: {nextLevel.breakName}
                </div>
              ) : (
                <div className="text-base sm:text-lg lg:text-xl">
                  Blinds: {formatCurrency(nextLevel.smallBlind)} / {formatCurrency(nextLevel.bigBlind)}
                  {nextLevel.ante > 0 && ` (Ante: ${formatCurrency(nextLevel.ante)})`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        {isController && (
          <div className="mt-4 sm:mt-6 lg:mt-8 pt-4 sm:pt-6 lg:pt-8 border-t border-gray-700">
            <div className="flex justify-center items-center gap-2 sm:gap-3 lg:gap-4 flex-wrap">
              <button
                onClick={handlePrevLevel}
                disabled={clockState.currentLevelIdx === 0}
                className="p-1.5 sm:p-2 rounded-lg border border-gray-600 text-white disabled:opacity-50 hover:bg-gray-700 transition"
              >
                <SkipBack className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>

              {clockState.status === 'idle' && (
                <button
                  onClick={handleStart}
                  className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center transition text-sm sm:text-base"
                >
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Start Clock</span>
                  <span className="sm:hidden">Start</span>
                </button>
              )}

              {clockState.status === 'running' && (
                <button
                  onClick={handlePause}
                  className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-semibold flex items-center transition text-sm sm:text-base"
                >
                  <Pause className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2" />
                  Pause
                </button>
              )}

              {clockState.status === 'paused' && (
                <button
                  onClick={handleResume}
                  className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center transition text-sm sm:text-base"
                >
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2" />
                  Resume
                </button>
              )}

              <button
                onClick={handleNextLevel}
                disabled={!levels || clockState.currentLevelIdx >= levels.length - 1}
                className="p-1.5 sm:p-2 rounded-lg border border-gray-600 text-white disabled:opacity-50 hover:bg-gray-700 transition"
              >
                <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 sm:p-2 rounded-lg border border-gray-600 text-white hover:bg-gray-700 transition"
              >
                {soundEnabled ? (
                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audio Element */}
      <audio ref={audioRef} />
    </div>
  );
}

export default TournamentClock;