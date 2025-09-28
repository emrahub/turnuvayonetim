'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { SeatingLayout, Table } from '../types/seating';

// Types
export interface Player {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  buyInAmount: number;
  chipCount: number;
  status: 'active' | 'eliminated' | 'sitting_out';
  position?: number;
  rebuys: number;
  addOns: number;
  registrationTime: Date;
  eliminationTime?: Date;
  tableNumber?: number;
  seatNumber?: number;
  isChipLeader?: boolean;
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

export interface Tournament {
  id: string;
  name: string;
  status: 'created' | 'registering' | 'running' | 'paused' | 'finished';
  buyIn: number;
  startTime: Date;
  endTime?: Date;
  maxPlayers: number;
  currentLevel: number;
  levelStartTime: Date;
  timeRemaining: number; // in seconds
  blindStructure: BlindLevel[];
  prizePool: number;
  prizeStructure: { position: number; percentage: number; amount: number }[];
}

export interface TournamentStatistics {
  totalPlayers: number;
  activePlayers: number;
  eliminatedPlayers: number;
  averageStack: number;
  totalChips: number;
  chipLeader: Player | null;
  recentEliminations: Player[];
  payoutPositions: number;
  moneyBubblePosition?: number;
}

interface TournamentStore {
  // State
  tournament: Tournament | null;
  players: Player[];
  statistics: TournamentStatistics;
  socket: Socket | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;

  // Seating State
  seatingLayout: SeatingLayout | null;
  tables: Table[];

  // UI State
  activeView: 'clock' | 'players' | 'tables' | 'statistics' | 'seating';
  showPlayerModal: boolean;
  showTournamentModal: boolean;
  selectedPlayer: Player | null;

  // Actions
  initializeSocket: (url?: string) => void;
  disconnectSocket: () => void;
  getSocket: () => Socket | null;
  emitClockCommand: (command: string, data?: any) => void;
  joinTournament: (tournamentId: string) => void;
  setActiveView: (view: 'clock' | 'players' | 'tables' | 'statistics' | 'seating') => void;
  setShowPlayerModal: (show: boolean) => void;
  setShowTournamentModal: (show: boolean) => void;
  setSelectedPlayer: (player: Player | null) => void;

  // Seating Actions
  updateSeatingLayout: (layout: SeatingLayout) => void;
  assignPlayerToSeat: (playerId: string, tableNumber: number, seatNumber: number) => void;
  removePlayerFromSeat: (playerId: string) => void;

  // Tournament Actions
  createTournament: (tournamentData: Partial<Tournament>) => void;
  startTournament: () => void;
  pauseTournament: () => void;
  resumeTournament: () => void;
  nextLevel: () => void;
  previousLevel: () => void;

  // Player Actions
  addPlayer: (playerData: Omit<Player, 'id' | 'registrationTime' | 'rebuys' | 'addOns'>) => void;
  updatePlayerChips: (playerId: string, chipCount: number) => void;
  eliminatePlayer: (playerId: string) => void;
  processRebuy: (playerId: string) => void;
  processAddOn: (playerId: string) => void;

  // Data Updates
  updateTournament: (tournament: Partial<Tournament>) => void;
  updatePlayers: (players: Player[]) => void;
  updatePlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updateStatistics: () => void;

  // Clock Updates
  updateTimeRemaining: (seconds: number) => void;
  setCurrentLevel: (level: number) => void;
}

const DEFAULT_BLIND_STRUCTURE: BlindLevel[] = [
  { idx: 0, smallBlind: 25, bigBlind: 50, ante: 0, durationSeconds: 900, isBreak: false },
  { idx: 1, smallBlind: 50, bigBlind: 100, ante: 0, durationSeconds: 900, isBreak: false },
  { idx: 2, smallBlind: 75, bigBlind: 150, ante: 25, durationSeconds: 900, isBreak: false },
  { idx: 3, smallBlind: 100, bigBlind: 200, ante: 25, durationSeconds: 900, isBreak: false },
  { idx: 4, smallBlind: 150, bigBlind: 300, ante: 50, durationSeconds: 900, isBreak: false },
  { idx: 5, smallBlind: 200, bigBlind: 400, ante: 50, durationSeconds: 900, isBreak: true, breakName: 'Mola - 15 Dakika' },
  { idx: 6, smallBlind: 250, bigBlind: 500, ante: 75, durationSeconds: 900, isBreak: false },
  { idx: 7, smallBlind: 300, bigBlind: 600, ante: 75, durationSeconds: 900, isBreak: false },
  { idx: 8, smallBlind: 400, bigBlind: 800, ante: 100, durationSeconds: 900, isBreak: false },
  { idx: 9, smallBlind: 500, bigBlind: 1000, ante: 100, durationSeconds: 900, isBreak: false },
];

const calculatePrizeStructure = (prizePool: number, playerCount: number) => {
  const payouts = [];
  if (playerCount >= 10) {
    payouts.push({ position: 1, percentage: 40, amount: prizePool * 0.40 });
    payouts.push({ position: 2, percentage: 25, amount: prizePool * 0.25 });
    payouts.push({ position: 3, percentage: 15, amount: prizePool * 0.15 });
    payouts.push({ position: 4, percentage: 10, amount: prizePool * 0.10 });
    payouts.push({ position: 5, percentage: 6, amount: prizePool * 0.06 });
    payouts.push({ position: 6, percentage: 4, amount: prizePool * 0.04 });
  } else if (playerCount >= 6) {
    payouts.push({ position: 1, percentage: 50, amount: prizePool * 0.50 });
    payouts.push({ position: 2, percentage: 30, amount: prizePool * 0.30 });
    payouts.push({ position: 3, percentage: 20, amount: prizePool * 0.20 });
  } else {
    payouts.push({ position: 1, percentage: 100, amount: prizePool });
  }
  return payouts;
};

export const useTournamentStore = create<TournamentStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    tournament: null,
    players: [],
    statistics: {
      totalPlayers: 0,
      activePlayers: 0,
      eliminatedPlayers: 0,
      averageStack: 0,
      totalChips: 0,
      chipLeader: null,
      recentEliminations: [],
      payoutPositions: 0,
    },
    socket: null,
    isConnected: false,
    loading: false,
    error: null,

    // Seating State
    seatingLayout: null,
    tables: [],

    // UI State
    activeView: 'clock',
    showPlayerModal: false,
    showTournamentModal: false,
    selectedPlayer: null,

    // Socket Management
    initializeSocket: (url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003') => {
      // Prevent multiple socket connections
      const existingSocket = get().socket;
      if (existingSocket && existingSocket.connected) {
        console.log('Socket already connected, skipping initialization');
        return;
      }

      // Clean up existing socket if disconnected
      if (existingSocket) {
        existingSocket.removeAllListeners();
        existingSocket.disconnect();
      }

      const socket = io(url, {
        transports: ['websocket', 'polling'],
        auth: {
          token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        set({ isConnected: true, error: null });
        console.log('Tournament socket connected');
      });

      socket.on('disconnect', () => {
        set({ isConnected: false });
        console.log('Tournament socket disconnected');
      });

      socket.on('tournament:updated', (tournament: Tournament) => {
        get().updateTournament(tournament);
      });

      socket.on('player:registered', (player: Player) => {
        get().updatePlayer(player);
      });

      socket.on('player:updated', (player: Player) => {
        get().updatePlayer(player);
      });

      socket.on('player:eliminated', (player: Player) => {
        get().updatePlayer(player);
      });

      // Clock events
      socket.on('clock:sync', (clockState: any) => {
        const currentTournament = get().tournament;
        if (currentTournament) {
          set({
            tournament: {
              ...currentTournament,
              timeRemaining: clockState.remainingSeconds,
              currentLevel: clockState.currentLevelIdx + 1, // Convert 0-based to 1-based
              levelStartTime: new Date(clockState.levelStartTime)
            }
          });
        }
      });

      socket.on('clock:started', (state: any) => {
        console.log('Clock started:', state);
      });

      socket.on('clock:paused', (state: any) => {
        console.log('Clock paused:', state);
      });

      socket.on('clock:resumed', (state: any) => {
        console.log('Clock resumed:', state);
      });

      socket.on('tournament:joined', (data: any) => {
        console.log('Tournament joined:', data);
      });

      socket.on('error', (error: string) => {
        set({ error });
      });

      // Seating events
      socket.on('seating:layout_updated', (layout: SeatingLayout) => {
        get().updateSeatingLayout(layout);
      });

      socket.on('seating:player_moved', (data: any) => {
        const { playerId, toTable, toSeat, fromTable, fromSeat } = data;
        get().assignPlayerToSeat(playerId, toTable, toSeat);
      });

      // Additional real-time events
      socket.on('connected', (data: any) => {
        console.log('WebSocket connected:', data);
      });

      socket.on('tournament:started', (data: any) => {
        const { tournament } = get();
        if (tournament && tournament.id === data.tournamentId) {
          set({
            tournament: {
              ...tournament,
              status: 'running'
            }
          });
        }
      });

      socket.on('tournament:paused', (data: any) => {
        const { tournament } = get();
        if (tournament && tournament.id === data.tournamentId) {
          set({
            tournament: {
              ...tournament,
              status: 'paused'
            }
          });
        }
      });

      socket.on('tournament:resumed', (data: any) => {
        const { tournament } = get();
        if (tournament && tournament.id === data.tournamentId) {
          set({
            tournament: {
              ...tournament,
              status: 'running'
            }
          });
        }
      });

      socket.on('clock:levelChanged', (clockState: any) => {
        const currentTournament = get().tournament;
        if (currentTournament) {
          set({
            tournament: {
              ...currentTournament,
              currentLevel: clockState.currentLevelIdx + 1,
              timeRemaining: clockState.remainingSeconds,
              levelStartTime: new Date(clockState.levelStartTime)
            }
          });
        }
      });

      socket.on('clock:completed', (clockState: any) => {
        const currentTournament = get().tournament;
        if (currentTournament) {
          set({
            tournament: {
              ...currentTournament,
              status: 'finished' as const,
              endTime: new Date()
            }
          });
        }
      });

      // Add heartbeat ping
      const heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping', Date.now());
        }
      }, 30000); // Ping every 30 seconds

      // Store interval ID for cleanup
      socket.on('disconnect', () => {
        clearInterval(heartbeatInterval);
      });

      set({ socket });
    },

    disconnectSocket: () => {
      const { socket } = get();
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        set({ socket: null, isConnected: false });
      }
    },

    getSocket: () => {
      return get().socket;
    },

    emitClockCommand: (command: string, data?: any) => {
      const { socket, tournament } = get();
      if (socket && socket.connected && tournament) {
        socket.emit(command, { tournamentId: tournament.id, ...data });
      }
    },

    joinTournament: (tournamentId: string) => {
      const { socket } = get();
      if (socket && socket.connected) {
        socket.emit('tournament:join', { tournamentId });
      }
    },

    // UI Actions
    setActiveView: (view) => set({ activeView: view }),
    setShowPlayerModal: (show) => set({ showPlayerModal: show }),
    setShowTournamentModal: (show) => set({ showTournamentModal: show }),
    setSelectedPlayer: (player) => set({ selectedPlayer: player }),

    // Tournament Actions
    createTournament: (tournamentData) => {
      const tournament: Tournament = {
        id: `tournament_${Date.now()}`,
        name: tournamentData.name || 'Yeni Turnuva',
        status: 'created',
        buyIn: tournamentData.buyIn || 100,
        startTime: tournamentData.startTime || new Date(),
        maxPlayers: tournamentData.maxPlayers || 100,
        currentLevel: 1,
        levelStartTime: new Date(),
        timeRemaining: 900, // 15 minutes
        blindStructure: tournamentData.blindStructure || DEFAULT_BLIND_STRUCTURE,
        prizePool: 0,
        prizeStructure: [],
        ...tournamentData,
      };

      set({ tournament });
      get().socket?.emit('tournament:create', tournament);
    },

    startTournament: () => {
      const { tournament, socket } = get();
      if (tournament && socket) {
        // Join tournament room first
        socket.emit('tournament:join', { tournamentId: tournament.id });

        // Start the tournament clock
        socket.emit('clock:start', { tournamentId: tournament.id });

        // Update local state
        set({
          tournament: {
            ...tournament,
            status: 'running' as const,
            startTime: new Date(),
            levelStartTime: new Date()
          }
        });
      }
    },

    pauseTournament: () => {
      const { tournament, socket } = get();
      if (tournament && socket) {
        socket.emit('clock:pause', { tournamentId: tournament.id });
      }
    },

    resumeTournament: () => {
      const { tournament, socket } = get();
      if (tournament && socket) {
        socket.emit('clock:resume', { tournamentId: tournament.id });
      }
    },

    nextLevel: () => {
      const { tournament, socket } = get();
      if (tournament && socket) {
        socket.emit('tournament:nextLevel', { tournamentId: tournament.id });
      }
    },

    previousLevel: () => {
      const { tournament, socket } = get();
      if (tournament && socket) {
        socket.emit('tournament:previousLevel', { tournamentId: tournament.id });
      }
    },

    // Player Actions
    addPlayer: (playerData) => {
      const player: Player = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...playerData,
        chipCount: playerData.buyInAmount,
        status: 'active',
        rebuys: 0,
        addOns: 0,
        registrationTime: new Date(),
      };

      set({ players: [...get().players, player] });
      get().socket?.emit('player:register', player);
      get().updateStatistics();
    },

    updatePlayerChips: (playerId, chipCount) => {
      const { players, socket, tournament } = get();
      const updatedPlayers = players.map(p =>
        p.id === playerId ? { ...p, chipCount } : p
      );
      set({ players: updatedPlayers });
      socket?.emit('player:updateChips', {
        playerId,
        chipCount,
        tournamentId: tournament?.id
      });
      get().updateStatistics();
    },

    eliminatePlayer: (playerId) => {
      const { players, socket, tournament } = get();
      const updatedPlayers = players.map(p =>
        p.id === playerId
          ? { ...p, status: 'eliminated' as const, eliminationTime: new Date() }
          : p
      );
      set({ players: updatedPlayers });
      socket?.emit('player:eliminate', {
        playerId,
        tournamentId: tournament?.id,
        place: players.filter(p => p.status === 'active').length
      });
      get().updateStatistics();
    },

    processRebuy: (playerId) => {
      const { players, tournament, socket } = get();
      if (!tournament) return;

      const updatedPlayers = players.map(p =>
        p.id === playerId
          ? {
              ...p,
              rebuys: p.rebuys + 1,
              chipCount: p.chipCount + tournament.buyIn
            }
          : p
      );
      set({ players: updatedPlayers });
      socket?.emit('player:rebuy', { playerId, amount: tournament.buyIn });
      get().updateStatistics();
    },

    processAddOn: (playerId) => {
      const { players, tournament, socket } = get();
      if (!tournament) return;

      const updatedPlayers = players.map(p =>
        p.id === playerId
          ? {
              ...p,
              addOns: p.addOns + 1,
              chipCount: p.chipCount + tournament.buyIn
            }
          : p
      );
      set({ players: updatedPlayers });
      socket?.emit('player:addon', { playerId, amount: tournament.buyIn });
      get().updateStatistics();
    },

    // Data Updates
    updateTournament: (tournamentData) => {
      const { tournament } = get();
      if (tournament) {
        set({ tournament: { ...tournament, ...tournamentData } });
        get().updateStatistics();
      }
    },

    updatePlayers: (players) => {
      set({ players });
      get().updateStatistics();
    },

    updatePlayer: (player) => {
      const { players } = get();
      const existingPlayerIndex = players.findIndex(p => p.id === player.id);

      if (existingPlayerIndex >= 0) {
        const updatedPlayers = [...players];
        updatedPlayers[existingPlayerIndex] = player;
        set({ players: updatedPlayers });
      } else {
        set({ players: [...players, player] });
      }
      get().updateStatistics();
    },

    removePlayer: (playerId) => {
      const { players } = get();
      set({ players: players.filter(p => p.id !== playerId) });
      get().updateStatistics();
    },

    updateStatistics: () => {
      const { players, tournament } = get();

      const activePlayers = players.filter(p => p.status === 'active');
      const eliminatedPlayers = players.filter(p => p.status === 'eliminated');
      const totalChips = activePlayers.reduce((sum, p) => sum + p.chipCount, 0);
      const averageStack = activePlayers.length > 0 ? totalChips / activePlayers.length : 0;

      // Calculate chip leader
      const chipLeader = activePlayers.length > 0
        ? activePlayers.reduce((leader, player) =>
            player.chipCount > leader.chipCount ? player : leader
          )
        : null;

      // Mark chip leader
      const updatedPlayers = players.map(p => ({
        ...p,
        isChipLeader: chipLeader ? p.id === chipLeader.id : false
      }));

      // Recent eliminations (last 5)
      const recentEliminations = eliminatedPlayers
        .filter(p => p.eliminationTime)
        .sort((a, b) => new Date(b.eliminationTime!).getTime() - new Date(a.eliminationTime!).getTime())
        .slice(0, 5);

      // Calculate prize pool
      const prizePool = players.reduce((sum, p) =>
        sum + p.buyInAmount + (p.rebuys * (tournament?.buyIn || 0)) + (p.addOns * (tournament?.buyIn || 0)), 0
      );

      // Calculate payout positions (typically 10% of field)
      const payoutPositions = Math.max(1, Math.floor(players.length * 0.1));

      const statistics: TournamentStatistics = {
        totalPlayers: players.length,
        activePlayers: activePlayers.length,
        eliminatedPlayers: eliminatedPlayers.length,
        averageStack: Math.round(averageStack),
        totalChips,
        chipLeader,
        recentEliminations,
        payoutPositions,
        moneyBubblePosition: payoutPositions + 1,
      };

      // Update tournament with new prize pool and structure
      if (tournament) {
        const prizeStructure = calculatePrizeStructure(prizePool, players.length);
        set({
          tournament: {
            ...tournament,
            prizePool,
            prizeStructure
          },
          players: updatedPlayers,
          statistics
        });
      } else {
        set({ players: updatedPlayers, statistics });
      }
    },

    updateTimeRemaining: (seconds) => {
      const { tournament } = get();
      if (tournament) {
        set({
          tournament: {
            ...tournament,
            timeRemaining: seconds
          }
        });
      }
    },

    setCurrentLevel: (level) => {
      const { tournament } = get();
      if (tournament) {
        set({
          tournament: {
            ...tournament,
            currentLevel: level,
            levelStartTime: new Date()
          }
        });
      }
    },

    // Seating Actions
    updateSeatingLayout: (layout) => {
      set({ seatingLayout: layout, tables: layout.tables });
    },

    assignPlayerToSeat: (playerId, tableNumber, seatNumber) => {
      const { players, tables } = get();

      // Update player with table and seat info
      const updatedPlayers = players.map(player =>
        player.id === playerId
          ? { ...player, tableNumber, seatNumber }
          : player
      );

      // Update tables with player assignment
      const updatedTables = tables.map(table => {
        if (table.number === tableNumber) {
          const updatedSeats = table.seats.map(seat => {
            if (seat.number === seatNumber) {
              const player = players.find(p => p.id === playerId);
              return {
                ...seat,
                player: player || null,
                isEmpty: !player
              };
            }
            return seat;
          });
          return { ...table, seats: updatedSeats };
        }
        return table;
      });

      set({
        players: updatedPlayers,
        tables: updatedTables,
        seatingLayout: get().seatingLayout ? {
          ...get().seatingLayout!,
          tables: updatedTables,
          lastUpdate: new Date()
        } : null
      });
    },

    removePlayerFromSeat: (playerId) => {
      const { players, tables } = get();

      // Clear player's table and seat assignment
      const updatedPlayers = players.map(player =>
        player.id === playerId
          ? { ...player, tableNumber: undefined, seatNumber: undefined }
          : player
      );

      // Remove player from table seats
      const updatedTables = tables.map(table => ({
        ...table,
        seats: table.seats.map(seat =>
          seat.player?.id === playerId
            ? { ...seat, player: null, isEmpty: true }
            : seat
        )
      }));

      set({
        players: updatedPlayers,
        tables: updatedTables,
        seatingLayout: get().seatingLayout ? {
          ...get().seatingLayout!,
          tables: updatedTables,
          lastUpdate: new Date()
        } : null
      });
    },
  }))
);

// Subscribe to player changes to auto-update statistics
// Commented out to prevent infinite loop - updateStatistics is called manually when needed
// useTournamentStore.subscribe(
//   (state) => state.players,
//   () => {
//     useTournamentStore.getState().updateStatistics();
//   }
// );