'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  chipCount: number;
  status: 'ACTIVE' | 'ELIMINATED';
  tableId?: string;
  seatNumber?: number;
  position?: number;
}

interface Table {
  id: string;
  number: number;
  players: Player[];
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

interface Tournament {
  id: string;
  name: string;
  status: 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'COMPLETED';
  buyIn: number;
  startingStack: number;
  playersCount: number;
  tablesCount: number;
  prizePool: number;
}

export default function TournamentPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'players' | 'tables' | 'structure'>('players');

  // Player registration form
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!tournamentId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      // Join tournament room
      newSocket.emit('tournament:join', { tournamentId });
    });

    newSocket.on('tournament:joined', (data) => {
      setTournament(data.tournament);
      setLoading(false);
    });

    newSocket.on('player:registered', (data) => {
      console.log('Player registered:', data);
      loadPlayers();
    });

    newSocket.on('player:eliminated', (data) => {
      console.log('Player eliminated:', data);
      loadPlayers();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [tournamentId]);

  // Load initial data
  useEffect(() => {
    if (tournamentId) {
      loadTournamentData();
    }
  }, [tournamentId]);

  const loadTournamentData = async () => {
    try {
      // Mock tournament data for now
      const mockTournament: Tournament = {
        id: tournamentId,
        name: 'Friday Night Poker',
        status: 'LIVE',
        buyIn: 100,
        startingStack: 10000,
        playersCount: 24,
        tablesCount: 3,
        prizePool: 2400
      };

      setTournament(mockTournament);
      await loadPlayers();
      await loadTables();
      setLoading(false);
    } catch (error) {
      console.error('Failed to load tournament data:', error);
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      // Mock player data
      const mockPlayers: Player[] = [
        { id: '1', name: 'Alice Johnson', chipCount: 15000, status: 'ACTIVE', tableId: '1', seatNumber: 1 },
        { id: '2', name: 'Bob Smith', chipCount: 8500, status: 'ACTIVE', tableId: '1', seatNumber: 2 },
        { id: '3', name: 'Charlie Brown', chipCount: 12000, status: 'ACTIVE', tableId: '1', seatNumber: 3 },
        { id: '4', name: 'Diana Prince', chipCount: 0, status: 'ELIMINATED', position: 21 },
        { id: '5', name: 'Eve Wilson', chipCount: 22000, status: 'ACTIVE', tableId: '2', seatNumber: 1 },
        { id: '6', name: 'Frank Miller', chipCount: 6500, status: 'ACTIVE', tableId: '2', seatNumber: 2 },
      ];

      setPlayers(mockPlayers);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  const loadTables = async () => {
    try {
      // Mock table data
      const mockTables: Table[] = [
        {
          id: '1',
          number: 1,
          status: 'ACTIVE',
          players: players.filter(p => p.tableId === '1')
        },
        {
          id: '2',
          number: 2,
          status: 'ACTIVE',
          players: players.filter(p => p.tableId === '2')
        },
        {
          id: '3',
          number: 3,
          status: 'ACTIVE',
          players: players.filter(p => p.tableId === '3')
        }
      ];

      setTables(mockTables);
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const registerPlayer = async () => {
    if (!newPlayerName.trim() || !socket || !tournament) return;

    setIsRegistering(true);
    try {
      socket.emit('player:register', {
        tournamentId: tournament.id,
        name: newPlayerName.trim(),
        buyIn: tournament.buyIn
      });

      setNewPlayerName('');
    } catch (error) {
      console.error('Failed to register player:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const eliminatePlayer = async (playerId: string) => {
    if (!socket || !confirm('Are you sure you want to eliminate this player?')) return;

    try {
      const activePlayersCount = players.filter(p => p.status === 'ACTIVE').length;
      socket.emit('player:eliminate', {
        tournamentId,
        entryId: playerId,
        place: activePlayersCount
      });
    } catch (error) {
      console.error('Failed to eliminate player:', error);
    }
  };

  const seatPlayers = async () => {
    if (!socket || !confirm('This will reseat all players. Continue?')) return;

    try {
      // Call seating API via WebSocket
      socket.emit('tournament:seatPlayers', {
        tournamentId,
        maxPlayersPerTable: 9,
        minPlayersPerTable: 6
      });
    } catch (error) {
      console.error('Failed to seat players:', error);
    }
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
        <div className="text-xl">Loading tournament...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Tournament not found</div>
      </div>
    );
  }

  const activePlayers = players.filter(p => p.status === 'ACTIVE');
  const eliminatedPlayers = players.filter(p => p.status === 'ELIMINATED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                🏆 {tournament.name}
              </h1>
              <p className="text-green-200">
                Tournament ID: {tournament.id} • Status: {tournament.status}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-400">
                {formatCurrency(tournament.prizePool)}
              </div>
              <div className="text-white/80">Prize Pool</div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{activePlayers.length}</div>
            <div className="text-white/80">Active Players</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{eliminatedPlayers.length}</div>
            <div className="text-white/80">Eliminated</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{tables.length}</div>
            <div className="text-white/80">Tables</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{formatCurrency(tournament.buyIn)}</div>
            <div className="text-white/80">Buy-in</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {['players', 'tables', 'structure'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-green-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            {/* Player Registration */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Register New Player</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60"
                  onKeyPress={(e) => e.key === 'Enter' && registerPlayer()}
                />
                <button
                  onClick={registerPlayer}
                  disabled={isRegistering || !newPlayerName.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {isRegistering ? 'Registering...' : 'Register'}
                </button>
                <button
                  onClick={seatPlayers}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Seat Players
                </button>
              </div>
            </div>

            {/* Active Players */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Active Players ({activePlayers.length})</h3>
              <div className="grid gap-4">
                {activePlayers.map((player) => (
                  <div key={player.id} className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-white font-medium">{player.name}</div>
                      <div className="text-green-400 font-bold">
                        {player.chipCount.toLocaleString()} chips
                      </div>
                      {player.tableId && (
                        <div className="text-white/60">
                          Table {player.tableId}, Seat {player.seatNumber}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => eliminatePlayer(player.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Eliminate
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Eliminated Players */}
            {eliminatedPlayers.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Eliminated Players ({eliminatedPlayers.length})</h3>
                <div className="grid gap-2">
                  {eliminatedPlayers.map((player) => (
                    <div key={player.id} className="bg-red-900/20 rounded-lg p-3 flex items-center justify-between">
                      <div className="text-white/80">{player.name}</div>
                      {player.position && (
                        <div className="text-red-400 font-medium">
                          #{player.position}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div key={table.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">
                  Table {table.number}
                </h3>
                <div className="space-y-3">
                  {Array.from({ length: 9 }, (_, seatIndex) => {
                    const seatNumber = seatIndex + 1;
                    const player = activePlayers.find(p => p.tableId === table.id && p.seatNumber === seatNumber);

                    return (
                      <div key={seatNumber} className="flex items-center justify-between p-2 bg-white/10 rounded">
                        <div className="text-white/60">Seat {seatNumber}</div>
                        {player ? (
                          <div className="text-right">
                            <div className="text-white font-medium">{player.name}</div>
                            <div className="text-green-400 text-sm">{player.chipCount.toLocaleString()}</div>
                          </div>
                        ) : (
                          <div className="text-white/40">Empty</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Blind Structure</h3>
            <div className="grid gap-3">
              {[
                { level: 1, smallBlind: 2500, bigBlind: 5000, ante: 0, duration: '15:00' },
                { level: 2, smallBlind: 5000, bigBlind: 10000, ante: 0, duration: '15:00' },
                { level: 3, smallBlind: 7500, bigBlind: 15000, ante: 2500, duration: '15:00' },
                { level: 4, smallBlind: 10000, bigBlind: 20000, ante: 2500, duration: '15:00' },
                { level: 'BREAK', smallBlind: 0, bigBlind: 0, ante: 0, duration: '10:00' },
                { level: 5, smallBlind: 15000, bigBlind: 30000, ante: 5000, duration: '15:00' },
              ].map((level, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-white font-medium w-16">
                      {level.level === 'BREAK' ? 'BREAK' : `Level ${level.level}`}
                    </div>
                    {level.level !== 'BREAK' ? (
                      <div className="text-white">
                        {level.smallBlind.toLocaleString()} / {level.bigBlind.toLocaleString()}
                        {level.ante > 0 && ` (${level.ante.toLocaleString()})`}
                      </div>
                    ) : (
                      <div className="text-yellow-400">Break Time</div>
                    )}
                  </div>
                  <div className="text-white/60">{level.duration}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}