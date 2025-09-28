'use client';

import React, { useState, useEffect } from 'react';
import { useTournamentStore } from '../../stores/tournamentStore';

interface Tournament {
  id: string;
  name: string;
  status: 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'COMPLETED';
  startDate: string;
  buyIn: number;
  startingStack: number;
  playersCount: number;
  tablesCount: number;
  prizePool: number;
}

interface ClockState {
  tournamentId: string;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  currentLevelIdx: number;
  currentLevel: {
    idx: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    durationSeconds: number;
    isBreak: boolean;
    breakName?: string;
  };
  nextLevel?: {
    idx: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    durationSeconds: number;
    isBreak: boolean;
    breakName?: string;
  };
  elapsedSeconds: number;
  remainingSeconds: number;
  totalElapsedSeconds: number;
}

export default function DashboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [clockState, setClockState] = useState<ClockState | null>(null);
  const [loading, setLoading] = useState(true);

  const { getSocket, initializeSocket, joinTournament } = useTournamentStore();

  // Use shared WebSocket connection from store
  useEffect(() => {
    // Ensure socket is initialized
    initializeSocket();

    const socket = getSocket();
    if (!socket) return;

    // Set up clock sync listener for dashboard
    const handleClockSync = (state: ClockState) => {
      setClockState(state);
    };

    socket.on('clock:sync', handleClockSync);

    return () => {
      socket.off('clock:sync', handleClockSync);
    };
  }, [initializeSocket, getSocket]);

  // Load tournaments
  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      // Simulated tournament data for now
      const mockTournaments: Tournament[] = [
        {
          id: '1',
          name: 'Friday Night Poker',
          status: 'SCHEDULED',
          startDate: new Date().toISOString(),
          buyIn: 100,
          startingStack: 10000,
          playersCount: 24,
          tablesCount: 3,
          prizePool: 2400
        },
        {
          id: '2',
          name: 'Weekend Championship',
          status: 'LIVE',
          startDate: new Date().toISOString(),
          buyIn: 250,
          startingStack: 20000,
          playersCount: 45,
          tablesCount: 5,
          prizePool: 11250
        }
      ];

      setTournaments(mockTournaments);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      setLoading(false);
    }
  };

  const startTournament = async (tournamentId: string) => {
    const socket = getSocket();
    if (socket) {
      joinTournament(tournamentId);
      socket.emit('clock:start', { tournamentId, levelIdx: 0 });
    }
  };

  const pauseTournament = async (tournamentId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('clock:pause', { tournamentId });
    }
  };

  const resumeTournament = async (tournamentId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('clock:resume', { tournamentId });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏆 Tournament Dashboard
          </h1>
          <p className="text-green-200">
            Manage and monitor poker tournaments in real-time
          </p>
        </div>

        {/* Tournament Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
              onClick={() => setSelectedTournament(tournament)}
            >
              {/* Tournament Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tournament.status === 'LIVE'
                      ? 'bg-red-500 text-white'
                      : tournament.status === 'SCHEDULED'
                      ? 'bg-blue-500 text-white'
                      : tournament.status === 'PAUSED'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-500 text-white'
                  }`}
                >
                  {tournament.status}
                </span>
                <div className="text-white/80 text-sm">
                  ID: {tournament.id}
                </div>
              </div>

              {/* Tournament Name */}
              <h3 className="text-xl font-bold text-white mb-3">
                {tournament.name}
              </h3>

              {/* Tournament Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/60">Buy-in</div>
                  <div className="text-white font-medium">
                    {formatCurrency(tournament.buyIn)}
                  </div>
                </div>
                <div>
                  <div className="text-white/60">Starting Stack</div>
                  <div className="text-white font-medium">
                    {tournament.startingStack.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-white/60">Players</div>
                  <div className="text-white font-medium">
                    {tournament.playersCount}
                  </div>
                </div>
                <div>
                  <div className="text-white/60">Tables</div>
                  <div className="text-white font-medium">
                    {tournament.tablesCount}
                  </div>
                </div>
              </div>

              {/* Prize Pool */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-white/60 text-sm">Prize Pool</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {formatCurrency(tournament.prizePool)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                {tournament.status === 'SCHEDULED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startTournament(tournament.id);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Start
                  </button>
                )}
                {tournament.status === 'LIVE' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      pauseTournament(tournament.id);
                    }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Pause
                  </button>
                )}
                {tournament.status === 'PAUSED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resumeTournament(tournament.id);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tournament Clock */}
        {selectedTournament && clockState && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6">
              🕐 Tournament Clock
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Level */}
              <div className="bg-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Current Level {clockState.currentLevel.idx + 1}
                </h3>
                {clockState.currentLevel.isBreak ? (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      BREAK
                    </div>
                    <div className="text-white">
                      {clockState.currentLevel.breakName || 'Break Time'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {clockState.currentLevel.smallBlind.toLocaleString()} / {clockState.currentLevel.bigBlind.toLocaleString()}
                    </div>
                    {clockState.currentLevel.ante > 0 && (
                      <div className="text-white/80">
                        Ante: {clockState.currentLevel.ante.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Time Remaining */}
              <div className="bg-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Time Remaining
                </h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    {formatTime(clockState.remainingSeconds)}
                  </div>
                  <div className="text-white/80">
                    Total: {formatTime(clockState.totalElapsedSeconds)}
                  </div>
                </div>
              </div>

              {/* Next Level */}
              <div className="bg-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Next Level
                </h3>
                {clockState.nextLevel ? (
                  clockState.nextLevel.isBreak ? (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400 mb-2">
                        BREAK
                      </div>
                      <div className="text-white">
                        {clockState.nextLevel.breakName || 'Break Time'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        {clockState.nextLevel.smallBlind.toLocaleString()} / {clockState.nextLevel.bigBlind.toLocaleString()}
                      </div>
                      {clockState.nextLevel.ante > 0 && (
                        <div className="text-white/80">
                          Ante: {clockState.nextLevel.ante.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center text-white/60">
                    Tournament Complete
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}