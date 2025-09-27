"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentClock = TournamentClock;
const react_1 = require("react");
const socket_io_client_1 = require("socket.io-client");
const lucide_react_1 = require("lucide-react");
function TournamentClock({ tournamentId, levels, isController = false }) {
    const [socket, setSocket] = (0, react_1.useState)(null);
    const [clockState, setClockState] = (0, react_1.useState)(null);
    const [localTime, setLocalTime] = (0, react_1.useState)(Date.now());
    const [serverTimeDelta, setServerTimeDelta] = (0, react_1.useState)(0);
    const [soundEnabled, setSoundEnabled] = (0, react_1.useState)(true);
    const audioRef = (0, react_1.useRef)(null);
    // Initialize WebSocket connection
    (0, react_1.useEffect)(() => {
        const socketInstance = (0, socket_io_client_1.io)(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003', {
            transports: ['websocket'],
            auth: {
                token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
            }
        });
        socketInstance.on('connect', () => {
            console.log('Connected to WebSocket');
            socketInstance.emit('tournament:join', { tournamentId });
        });
        socketInstance.on('clock:sync', (state) => {
            // Calculate time difference for drift correction
            const delta = state.serverTime - Date.now();
            setServerTimeDelta(delta);
            setClockState(state);
        });
        socketInstance.on('clock:started', (state) => {
            setClockState(state);
            playSound('start');
        });
        socketInstance.on('clock:paused', (state) => {
            setClockState(state);
        });
        socketInstance.on('clock:resumed', (state) => {
            setClockState(state);
        });
        socketInstance.on('clock:levelChanged', (state) => {
            setClockState(state);
            playSound('levelChange');
        });
        socketInstance.on('clock:completed', (state) => {
            setClockState(state);
            playSound('complete');
        });
        setSocket(socketInstance);
        return () => {
            socketInstance.disconnect();
        };
    }, [tournamentId]);
    // Update local time every second
    (0, react_1.useEffect)(() => {
        const interval = setInterval(() => {
            setLocalTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const playSound = (0, react_1.useCallback)((type) => {
        if (!soundEnabled || !audioRef.current)
            return;
        const sounds = {
            start: '/sounds/start.mp3',
            levelChange: '/sounds/level-change.mp3',
            complete: '/sounds/complete.mp3'
        };
        audioRef.current.src = sounds[type];
        audioRef.current.play().catch(e => console.log('Sound play failed:', e));
    }, [soundEnabled]);
    // Calculate remaining time
    const getRemainingTime = (0, react_1.useCallback)(() => {
        if (!clockState || !levels[clockState.currentLevelIdx])
            return 0;
        const level = levels[clockState.currentLevelIdx];
        const adjustedTime = localTime + serverTimeDelta;
        let elapsed;
        if (clockState.status === 'paused') {
            elapsed = clockState.pausedDuration;
        }
        else if (clockState.status === 'running') {
            elapsed = adjustedTime - clockState.levelStartTime;
        }
        else {
            return 0;
        }
        const remaining = (level.durationSeconds * 1000) - elapsed;
        return Math.max(0, remaining);
    }, [clockState, levels, localTime, serverTimeDelta]);
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    const formatCurrency = (cents) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(cents / 100);
    };
    // Control functions
    const handleStart = () => socket?.emit('clock:start', { tournamentId });
    const handlePause = () => socket?.emit('clock:pause', { tournamentId });
    const handleResume = () => socket?.emit('clock:resume', { tournamentId });
    const handleNextLevel = () => {
        if (clockState && clockState.currentLevelIdx < levels.length - 1) {
            socket?.emit('clock:gotoLevel', {
                tournamentId,
                levelIdx: clockState.currentLevelIdx + 1
            });
        }
    };
    const handlePrevLevel = () => {
        if (clockState && clockState.currentLevelIdx > 0) {
            socket?.emit('clock:gotoLevel', {
                tournamentId,
                levelIdx: clockState.currentLevelIdx - 1
            });
        }
    };
    if (!clockState) {
        return (<div className="p-8 text-center bg-gray-900 rounded-lg">
        <div className="text-2xl text-gray-500">Connecting to clock...</div>
      </div>);
    }
    const currentLevel = levels[clockState.currentLevelIdx];
    const nextLevel = levels[clockState.currentLevelIdx + 1];
    const remainingTime = getRemainingTime();
    const progress = currentLevel
        ? ((currentLevel.durationSeconds * 1000 - remainingTime) / (currentLevel.durationSeconds * 1000)) * 100
        : 0;
    return (<div className="space-y-6">
      <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg">
        {/* Main Clock Display */}
        <div className="text-center">
          {currentLevel?.isBreak ? (<div className="mb-4">
              <div className="text-3xl font-bold text-yellow-400">BREAK</div>
              <div className="text-xl text-gray-300">{currentLevel.breakName}</div>
            </div>) : (<div className="mb-4">
              <div className="text-xl text-gray-300">Level {currentLevel?.idx + 1}</div>
            </div>)}

          <div className="text-8xl font-mono font-bold mb-8 tabular-nums">
            {formatTime(remainingTime)}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden mb-8">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-1000" style={{ width: `${progress}%` }}/>
          </div>

          {/* Blinds Display */}
          {!currentLevel?.isBreak && (<div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-sm">SMALL BLIND</div>
                <div className="text-3xl font-bold">
                  {formatCurrency(currentLevel?.smallBlind || 0)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">BIG BLIND</div>
                <div className="text-3xl font-bold">
                  {formatCurrency(currentLevel?.bigBlind || 0)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">ANTE</div>
                <div className="text-3xl font-bold">
                  {currentLevel?.ante ? formatCurrency(currentLevel.ante) : '-'}
                </div>
              </div>
            </div>)}
        </div>

        {/* Next Level Preview */}
        {nextLevel && (<div className="mt-8 pt-8 border-t border-gray-700">
            <div className="text-center">
              <div className="text-gray-400 mb-2">NEXT LEVEL</div>
              {nextLevel.isBreak ? (<div className="text-xl">
                  Break: {nextLevel.breakName}
                </div>) : (<div className="text-xl">
                  Blinds: {formatCurrency(nextLevel.smallBlind)} / {formatCurrency(nextLevel.bigBlind)}
                  {nextLevel.ante > 0 && ` (Ante: ${formatCurrency(nextLevel.ante)})`}
                </div>)}
            </div>
          </div>)}

        {/* Controls */}
        {isController && (<div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex justify-center items-center space-x-4">
              <button onClick={handlePrevLevel} disabled={clockState.currentLevelIdx === 0} className="p-2 rounded-lg border border-gray-600 text-white disabled:opacity-50 hover:bg-gray-700 transition">
                <lucide_react_1.SkipBack className="h-4 w-4"/>
              </button>

              {clockState.status === 'idle' && (<button onClick={handleStart} className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center transition">
                  <lucide_react_1.Play className="h-5 w-5 mr-2"/>
                  Start Clock
                </button>)}

              {clockState.status === 'running' && (<button onClick={handlePause} className="px-6 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-semibold flex items-center transition">
                  <lucide_react_1.Pause className="h-5 w-5 mr-2"/>
                  Pause
                </button>)}

              {clockState.status === 'paused' && (<button onClick={handleResume} className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center transition">
                  <lucide_react_1.Play className="h-5 w-5 mr-2"/>
                  Resume
                </button>)}

              <button onClick={handleNextLevel} disabled={clockState.currentLevelIdx >= levels.length - 1} className="p-2 rounded-lg border border-gray-600 text-white disabled:opacity-50 hover:bg-gray-700 transition">
                <lucide_react_1.SkipForward className="h-4 w-4"/>
              </button>

              <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-lg border border-gray-600 text-white hover:bg-gray-700 transition">
                {soundEnabled ? (<lucide_react_1.Volume2 className="h-4 w-4"/>) : (<lucide_react_1.VolumeX className="h-4 w-4"/>)}
              </button>
            </div>
          </div>)}
      </div>

      {/* Audio Element */}
      <audio ref={audioRef}/>
    </div>);
}
exports.default = TournamentClock;
//# sourceMappingURL=TournamentClock.jsx.map