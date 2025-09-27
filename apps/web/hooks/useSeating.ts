'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useTournamentStore, Player } from '../stores/tournamentStore';
import {
  SeatingState,
  SeatingLayout,
  SeatingAction,
  Table,
  Seat,
  SeatingStats,
  SeatingRule,
  SeatingAlgorithm,
  DraggedPlayer,
  RebalanceEvent
} from '../types/seating';

interface UseSeatingProps {
  tournamentId: string;
  socket?: Socket | null;
}

interface UseSeatingReturn extends SeatingState {
  // Player movement
  movePlayer: (playerId: string, toTable: number, toSeat: number, fromTable?: number, fromSeat?: number) => void;

  // Table management
  createTable: (type: Table['type']) => void;
  breakTable: (tableNumber: number) => void;

  // Auto-balancing
  autoBalance: () => void;
  canAutoBalance: () => boolean;

  // Manual seating controls
  assignToNextSeat: (playerId: string) => void;
  removeFromSeat: (playerId: string) => void;
  swapPlayers: (player1Id: string, player2Id: string) => void;

  // Blind management
  assignBlinds: (tableNumber: number, dealerPosition: number) => void;
  rotateBlinds: (tableNumber: number) => void;

  // Algorithm and rules
  setAlgorithm: (algorithm: SeatingAlgorithm) => void;
  updateRules: (rules: SeatingRule[]) => void;

  // Validation
  validateMove: (playerId: string, toTable: number, toSeat: number) => { valid: boolean; reason?: string };
  getAvailableSeats: () => { table: number; seat: number }[];

  // Statistics
  refreshStats: () => void;

  // Drag and drop
  setDraggedPlayer: (player: DraggedPlayer | null) => void;

  // Selection
  selectTable: (table: Table | null) => void;
  selectSeat: (seat: Seat | null) => void;
  selectPlayer: (player: Player | null) => void;

  // History
  undoLastAction: () => void;
  canUndo: boolean;
}

const DEFAULT_SEATING_RULES: SeatingRule[] = [
  { type: 'max_tables', value: 12, description: 'Maximum number of active tables' },
  { type: 'min_players_per_table', value: 6, description: 'Minimum players per table before breaking' },
  { type: 'max_players_per_table', value: 10, description: 'Maximum players per table' },
  { type: 'balance_threshold', value: 2, description: 'Max player difference between tables before rebalancing' }
];

const DEFAULT_ALGORITHM: SeatingAlgorithm = {
  type: 'balanced',
  name: 'Balanced Assignment',
  description: 'Distributes players evenly across tables to maintain balance',
  parameters: {
    respectChipStacks: true,
    randomizeSeatOrder: true
  }
};

export function useSeating({ tournamentId, socket }: UseSeatingProps): UseSeatingReturn {
  const { players, tournament } = useTournamentStore();
  const [state, setState] = useState<SeatingState>({
    layout: null,
    selectedPlayer: null,
    selectedTable: null,
    selectedSeat: null,
    draggedPlayer: null,
    rules: DEFAULT_SEATING_RULES,
    algorithm: DEFAULT_ALGORITHM,
    stats: {
      totalTables: 0,
      activeTables: 0,
      breakingTables: 0,
      totalSeats: 0,
      occupiedSeats: 0,
      emptySeats: 0,
      averagePlayersPerTable: 0,
      tableBalance: []
    },
    isBalancing: false,
    error: null,
    lastAction: null
  });

  const actionHistoryRef = useRef<SeatingAction[]>([]);
  const rebalanceTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize seating layout when players change
  useEffect(() => {
    if (players.length > 0 && !state.layout) {
      initializeLayout();
    }
  }, [players.length, state.layout]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit('seating:join', { tournamentId });

    socket.on('seating:layout_updated', handleLayoutUpdate);
    socket.on('seating:player_moved', handlePlayerMoved);
    socket.on('seating:table_broken', handleTableBroken);
    socket.on('seating:table_created', handleTableCreated);
    socket.on('seating:balance_completed', handleBalanceCompleted);
    socket.on('seating:error', handleSeatingError);

    return () => {
      socket.off('seating:layout_updated', handleLayoutUpdate);
      socket.off('seating:player_moved', handlePlayerMoved);
      socket.off('seating:table_broken', handleTableBroken);
      socket.off('seating:table_created', handleTableCreated);
      socket.off('seating:balance_completed', handleBalanceCompleted);
      socket.off('seating:error', handleSeatingError);
    };
  }, [socket, tournamentId]);

  // Auto-refresh stats when layout changes
  useEffect(() => {
    if (state.layout) {
      refreshStats();
    }
  }, [state.layout]);

  const handleLayoutUpdate = useCallback((layout: SeatingLayout) => {
    setState(prev => ({ ...prev, layout }));
  }, []);

  const handlePlayerMoved = useCallback((data: any) => {
    // Update local layout optimistically
    setState(prev => {
      if (!prev.layout) return prev;

      const updatedTables = prev.layout.tables.map(table => {
        if (data.fromTable && table.number === data.fromTable) {
          const updatedSeats = table.seats.map(seat =>
            seat.number === data.fromSeat ? { ...seat, player: null, isEmpty: true } : seat
          );
          return { ...table, seats: updatedSeats };
        }

        if (table.number === data.toTable) {
          const player = players.find(p => p.id === data.playerId);
          const updatedSeats = table.seats.map(seat =>
            seat.number === data.toSeat
              ? { ...seat, player: player || null, isEmpty: !player }
              : seat
          );
          return { ...table, seats: updatedSeats };
        }

        return table;
      });

      return {
        ...prev,
        layout: {
          ...prev.layout,
          tables: updatedTables,
          lastUpdate: new Date()
        }
      };
    });
  }, [players]);

  const handleTableBroken = useCallback((data: { tableNumber: number; timestamp: Date }) => {
    setState(prev => {
      if (!prev.layout) return prev;

      return {
        ...prev,
        layout: {
          ...prev.layout,
          tables: prev.layout.tables.filter(table => table.number !== data.tableNumber),
          lastUpdate: new Date()
        }
      };
    });
  }, []);

  const handleTableCreated = useCallback((data: { table: Table; timestamp: Date }) => {
    setState(prev => {
      if (!prev.layout) return prev;

      return {
        ...prev,
        layout: {
          ...prev.layout,
          tables: [...prev.layout.tables, data.table],
          lastUpdate: new Date()
        }
      };
    });
  }, []);

  const handleBalanceCompleted = useCallback((data: { affectedTables: number[]; timestamp: Date }) => {
    setState(prev => ({ ...prev, isBalancing: false }));
    refreshStats();
  }, []);

  const handleSeatingError = useCallback((data: { message: string; action?: string }) => {
    setState(prev => ({ ...prev, error: data.message, isBalancing: false }));
  }, []);

  const initializeLayout = useCallback(() => {
    const activePlayers = players.filter(p => p.status === 'active');
    if (activePlayers.length === 0) return;

    // Calculate optimal table configuration
    const playersPerTable = Math.min(9, Math.max(6, Math.floor(activePlayers.length / Math.ceil(activePlayers.length / 9))));
    const tableCount = Math.ceil(activePlayers.length / playersPerTable);

    const tables: Table[] = [];

    for (let i = 0; i < tableCount; i++) {
      const tableNumber = i + 1;
      const tableType: Table['type'] = playersPerTable <= 2 ? 'heads-up' :
                                       playersPerTable <= 6 ? '6-max' : '9-max';

      const seats: Seat[] = [];
      for (let seatNum = 1; seatNum <= (tableType === 'heads-up' ? 2 : tableType === '6-max' ? 6 : 9); seatNum++) {
        seats.push({
          id: `table_${tableNumber}_seat_${seatNum}`,
          tableId: `table_${tableNumber}`,
          number: seatNum,
          player: null,
          isEmpty: true,
          isDealer: false,
          isSmallBlind: false,
          isBigBlind: false
        });
      }

      tables.push({
        id: `table_${tableNumber}`,
        number: tableNumber,
        maxSeats: seats.length,
        type: tableType,
        status: 'active',
        dealerPosition: 1,
        smallBlindPosition: 2,
        bigBlindPosition: 3,
        seats
      });
    }

    // Assign players using selected algorithm
    assignPlayersToTables(tables, activePlayers);

    const layout: SeatingLayout = {
      id: `layout_${tournamentId}_${Date.now()}`,
      tournamentId,
      tables,
      lastUpdate: new Date(),
      rebalanceHistory: []
    };

    setState(prev => ({ ...prev, layout }));
  }, [players, tournamentId, state.algorithm]);

  const assignPlayersToTables = useCallback((tables: Table[], playersToAssign: Player[]) => {
    const { algorithm } = state;
    let shuffledPlayers = [...playersToAssign];

    switch (algorithm.type) {
      case 'random':
        shuffledPlayers = shuffledPlayers.sort(() => Math.random() - 0.5);
        break;
      case 'chip_stack':
        shuffledPlayers = shuffledPlayers.sort((a, b) => b.chipCount - a.chipCount);
        break;
      case 'snake_draft':
        shuffledPlayers = shuffledPlayers.sort((a, b) => b.chipCount - a.chipCount);
        break;
      case 'balanced':
      default:
        // Sort by chip count but add randomization for similar stacks
        shuffledPlayers = shuffledPlayers.sort((a, b) => {
          const chipDiff = Math.abs(a.chipCount - b.chipCount);
          if (chipDiff < (tournament?.buyIn || 1000) * 0.5) {
            return Math.random() - 0.5; // Randomize similar stacks
          }
          return b.chipCount - a.chipCount;
        });
        break;
    }

    let playerIndex = 0;
    let tableIndex = 0;
    let seatIndex = 0;
    let direction = 1; // For snake draft

    for (const player of shuffledPlayers) {
      if (algorithm.type === 'snake_draft') {
        // Snake draft pattern
        const table = tables[tableIndex];
        const seat = table.seats[seatIndex];

        seat.player = player;
        seat.isEmpty = false;

        if (direction === 1) {
          seatIndex++;
          if (seatIndex >= table.seats.length) {
            tableIndex++;
            seatIndex = table.seats.length - 1;
            direction = -1;
          }
        } else {
          seatIndex--;
          if (seatIndex < 0) {
            tableIndex++;
            seatIndex = 0;
            direction = 1;
          }
        }

        if (tableIndex >= tables.length) {
          tableIndex = 0;
          direction = 1;
          seatIndex = 0;
        }
      } else {
        // Balanced/round-robin assignment
        const table = tables[tableIndex];
        const availableSeat = table.seats.find(s => s.isEmpty);

        if (availableSeat) {
          availableSeat.player = player;
          availableSeat.isEmpty = false;
        }

        tableIndex = (tableIndex + 1) % tables.length;
      }
    }

    // Assign blinds for each table
    tables.forEach(table => {
      const occupiedSeats = table.seats.filter(s => !s.isEmpty);
      if (occupiedSeats.length >= 2) {
        assignBlindsToTable(table);
      }
    });
  }, [state.algorithm, tournament]);

  const assignBlindsToTable = useCallback((table: Table) => {
    const occupiedSeats = table.seats.filter(s => !s.isEmpty).sort((a, b) => a.number - b.number);

    if (occupiedSeats.length >= 2) {
      // Reset all blind positions
      table.seats.forEach(seat => {
        seat.isDealer = false;
        seat.isSmallBlind = false;
        seat.isBigBlind = false;
      });

      // Assign new positions
      const dealerSeat = occupiedSeats[0];
      dealerSeat.isDealer = true;
      table.dealerPosition = dealerSeat.number;

      if (occupiedSeats.length === 2) {
        // Heads-up: dealer is small blind
        dealerSeat.isSmallBlind = true;
        occupiedSeats[1].isBigBlind = true;
        table.smallBlindPosition = dealerSeat.number;
        table.bigBlindPosition = occupiedSeats[1].number;
      } else {
        // Multi-way: standard blind positions
        occupiedSeats[1].isSmallBlind = true;
        occupiedSeats[2].isBigBlind = true;
        table.smallBlindPosition = occupiedSeats[1].number;
        table.bigBlindPosition = occupiedSeats[2].number;
      }
    }
  }, []);

  const movePlayer = useCallback((playerId: string, toTable: number, toSeat: number, fromTable?: number, fromSeat?: number) => {
    if (!state.layout) return;

    const validation = validateMove(playerId, toTable, toSeat);
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.reason || 'Invalid move' }));
      return;
    }

    socket?.emit('seating:move_player', {
      tournamentId,
      playerId,
      fromTable,
      fromSeat,
      toTable,
      toSeat
    });

    // Record action for undo
    const action: SeatingAction = {
      type: 'MOVE_PLAYER',
      payload: { playerId, fromTable, fromSeat, toTable, toSeat },
      timestamp: new Date(),
      executedBy: 'user' // TODO: Get actual user ID
    };

    actionHistoryRef.current.push(action);
    setState(prev => ({ ...prev, lastAction: action, error: null }));
  }, [state.layout, socket, tournamentId]);

  const validateMove = useCallback((playerId: string, toTable: number, toSeat: number): { valid: boolean; reason?: string } => {
    if (!state.layout) return { valid: false, reason: 'No seating layout available' };

    const player = players.find(p => p.id === playerId);
    if (!player) return { valid: false, reason: 'Player not found' };

    if (player.status !== 'active') return { valid: false, reason: 'Player is not active' };

    const table = state.layout.tables.find(t => t.number === toTable);
    if (!table) return { valid: false, reason: 'Table not found' };

    if (table.status !== 'active') return { valid: false, reason: 'Table is not active' };

    const seat = table.seats.find(s => s.number === toSeat);
    if (!seat) return { valid: false, reason: 'Seat not found' };

    if (!seat.isEmpty && seat.player?.id !== playerId) return { valid: false, reason: 'Seat is occupied' };

    return { valid: true };
  }, [state.layout, players]);

  const refreshStats = useCallback(() => {
    if (!state.layout) return;

    const { tables } = state.layout;
    const activeTables = tables.filter(t => t.status === 'active');
    const breakingTables = tables.filter(t => t.status === 'breaking');

    const totalSeats = tables.reduce((sum, table) => sum + table.maxSeats, 0);
    const occupiedSeats = tables.reduce((sum, table) =>
      sum + table.seats.filter(seat => !seat.isEmpty).length, 0);

    const tableBalance = activeTables.map(table => {
      const occupiedSeatCount = table.seats.filter(s => !s.isEmpty).length;
      const tableChips = table.seats
        .filter(s => !s.isEmpty && s.player)
        .reduce((sum, s) => sum + (s.player?.chipCount || 0), 0);

      return {
        tableNumber: table.number,
        playerCount: occupiedSeatCount,
        averageStack: occupiedSeatCount > 0 ? Math.round(tableChips / occupiedSeatCount) : 0,
        variance: 0 // TODO: Calculate actual variance
      };
    });

    const stats: SeatingStats = {
      totalTables: tables.length,
      activeTables: activeTables.length,
      breakingTables: breakingTables.length,
      totalSeats,
      occupiedSeats,
      emptySeats: totalSeats - occupiedSeats,
      averagePlayersPerTable: activeTables.length > 0 ?
        Math.round(occupiedSeats / activeTables.length * 10) / 10 : 0,
      tableBalance
    };

    setState(prev => ({ ...prev, stats }));
  }, [state.layout]);

  const autoBalance = useCallback(() => {
    if (!canAutoBalance()) return;

    setState(prev => ({ ...prev, isBalancing: true, error: null }));
    socket?.emit('seating:auto_balance', { tournamentId });
  }, [socket, tournamentId]);

  const canAutoBalance = useCallback((): boolean => {
    if (!state.layout || state.isBalancing) return false;

    const activeTables = state.layout.tables.filter(t => t.status === 'active');
    if (activeTables.length < 2) return false;

    const playerCounts = activeTables.map(table =>
      table.seats.filter(s => !s.isEmpty).length
    );

    const maxPlayers = Math.max(...playerCounts);
    const minPlayers = Math.min(...playerCounts);
    const balanceThreshold = state.rules.find(r => r.type === 'balance_threshold')?.value || 2;

    return maxPlayers - minPlayers > balanceThreshold;
  }, [state.layout, state.isBalancing, state.rules]);

  const createTable = useCallback((type: Table['type']) => {
    socket?.emit('seating:create_table', { tournamentId, tableType: type });
  }, [socket, tournamentId]);

  const breakTable = useCallback((tableNumber: number) => {
    socket?.emit('seating:break_table', { tournamentId, tableNumber });
  }, [socket, tournamentId]);

  const assignBlinds = useCallback((tableNumber: number, dealerPosition: number) => {
    socket?.emit('seating:assign_blinds', { tournamentId, tableNumber, dealerPosition });
  }, [socket, tournamentId]);

  const rotateBlinds = useCallback((tableNumber: number) => {
    if (!state.layout) return;

    const table = state.layout.tables.find(t => t.number === tableNumber);
    if (!table) return;

    const occupiedSeats = table.seats.filter(s => !s.isEmpty).sort((a, b) => a.number - b.number);
    const currentDealerIndex = occupiedSeats.findIndex(s => s.isDealer);
    const nextDealerIndex = (currentDealerIndex + 1) % occupiedSeats.length;
    const newDealerPosition = occupiedSeats[nextDealerIndex].number;

    assignBlinds(tableNumber, newDealerPosition);
  }, [state.layout, assignBlinds]);

  // Additional utility functions
  const removeFromSeat = useCallback((playerId: string) => {
    if (!state.layout) return;

    for (const table of state.layout.tables) {
      const seat = table.seats.find(s => s.player?.id === playerId);
      if (seat) {
        movePlayer(playerId, -1, -1, table.number, seat.number); // -1 indicates removal
        break;
      }
    }
  }, [state.layout, movePlayer]);

  const swapPlayers = useCallback((player1Id: string, player2Id: string) => {
    if (!state.layout) return;

    let player1Position: { table: number; seat: number } | null = null;
    let player2Position: { table: number; seat: number } | null = null;

    for (const table of state.layout.tables) {
      for (const seat of table.seats) {
        if (seat.player?.id === player1Id) {
          player1Position = { table: table.number, seat: seat.number };
        }
        if (seat.player?.id === player2Id) {
          player2Position = { table: table.number, seat: seat.number };
        }
      }
    }

    if (player1Position && player2Position) {
      // Move player1 to temporary position, then move player2, then move player1
      movePlayer(player1Id, -1, -1, player1Position.table, player1Position.seat);
      movePlayer(player2Id, player1Position.table, player1Position.seat, player2Position.table, player2Position.seat);
      movePlayer(player1Id, player2Position.table, player2Position.seat);
    }
  }, [state.layout, movePlayer]);

  const getAvailableSeats = useCallback((): { table: number; seat: number }[] => {
    if (!state.layout) return [];

    const available: { table: number; seat: number }[] = [];

    for (const table of state.layout.tables) {
      if (table.status === 'active') {
        for (const seat of table.seats) {
          if (seat.isEmpty) {
            available.push({ table: table.number, seat: seat.number });
          }
        }
      }
    }

    return available;
  }, [state.layout]);

  const assignToNextSeat = useCallback((playerId: string) => {
    const availableSeats = getAvailableSeats();
    if (availableSeats.length > 0) {
      const { table, seat } = availableSeats[0];
      movePlayer(playerId, table, seat);
    }
  }, [getAvailableSeats, movePlayer]);

  const undoLastAction = useCallback(() => {
    const lastAction = actionHistoryRef.current.pop();
    if (!lastAction) return;

    // Reverse the last action
    if (lastAction.type === 'MOVE_PLAYER' && lastAction.payload.fromTable && lastAction.payload.fromSeat) {
      movePlayer(
        lastAction.payload.playerId!,
        lastAction.payload.fromTable,
        lastAction.payload.fromSeat,
        lastAction.payload.toTable,
        lastAction.payload.toSeat
      );
    }
  }, [movePlayer]);

  return {
    ...state,
    movePlayer,
    createTable,
    breakTable,
    autoBalance,
    canAutoBalance,
    assignToNextSeat,
    removeFromSeat,
    swapPlayers,
    assignBlinds,
    rotateBlinds,
    setAlgorithm: (algorithm) => setState(prev => ({ ...prev, algorithm })),
    updateRules: (rules) => setState(prev => ({ ...prev, rules })),
    validateMove,
    getAvailableSeats,
    refreshStats,
    setDraggedPlayer: (draggedPlayer) => setState(prev => ({ ...prev, draggedPlayer })),
    selectTable: (selectedTable) => setState(prev => ({ ...prev, selectedTable })),
    selectSeat: (selectedSeat) => setState(prev => ({ ...prev, selectedSeat })),
    selectPlayer: (selectedPlayer) => setState(prev => ({ ...prev, selectedPlayer })),
    undoLastAction,
    canUndo: actionHistoryRef.current.length > 0
  };
}