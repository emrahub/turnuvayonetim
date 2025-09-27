import { Player } from '../stores/tournamentStore';

export interface Table {
  id: string;
  number: number;
  maxSeats: number;
  type: 'heads-up' | '6-max' | '9-max' | '10-max';
  status: 'active' | 'breaking' | 'broken' | 'waiting';
  dealerPosition: number;
  smallBlindPosition: number;
  bigBlindPosition: number;
  seats: Seat[];
  averageStack?: number;
  bigBlindOrbits?: number;
  lastAction?: Date;
}

export interface Seat {
  id: string;
  tableId: string;
  number: number; // 1-based seat number
  player: Player | null;
  isEmpty: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isBreaking?: boolean; // For table balancing
}

export interface SeatingLayout {
  id: string;
  tournamentId: string;
  tables: Table[];
  lastUpdate: Date;
  rebalanceHistory: RebalanceEvent[];
}

export interface RebalanceEvent {
  id: string;
  timestamp: Date;
  type: 'auto' | 'manual';
  reason: 'table_breaking' | 'stack_balancing' | 'player_movement';
  fromTable?: number;
  toTable?: number;
  playersMoveed: {
    playerId: string;
    fromSeat: { table: number; seat: number };
    toSeat: { table: number; seat: number };
  }[];
  triggeredBy?: string; // User ID who triggered manual rebalance
}

export interface SeatingRule {
  type: 'max_tables' | 'min_players_per_table' | 'max_players_per_table' | 'balance_threshold';
  value: number;
  description: string;
}

export interface SeatingAlgorithm {
  type: 'random' | 'balanced' | 'snake_draft' | 'chip_stack' | 'manual';
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface DraggedPlayer {
  player: Player;
  sourceTable?: number;
  sourceSeat?: number;
}

export interface DropTarget {
  tableId: string;
  seatNumber: number;
  isValid: boolean;
  reason?: string;
}

export interface SeatingStats {
  totalTables: number;
  activeTables: number;
  breakingTables: number;
  totalSeats: number;
  occupiedSeats: number;
  emptySeats: number;
  averagePlayersPerTable: number;
  tableBalance: {
    tableNumber: number;
    playerCount: number;
    averageStack: number;
    variance: number;
  }[];
}

export interface SeatingAction {
  type: 'MOVE_PLAYER' | 'BREAK_TABLE' | 'CREATE_TABLE' | 'ASSIGN_BLINDS' | 'AUTO_BALANCE';
  payload: {
    playerId?: string;
    fromTable?: number;
    fromSeat?: number;
    toTable?: number;
    toSeat?: number;
    tableId?: string;
    dealerPosition?: number;
    reason?: string;
  };
  timestamp: Date;
  executedBy: string;
}

export interface SeatingState {
  layout: SeatingLayout | null;
  selectedPlayer: Player | null;
  selectedTable: Table | null;
  selectedSeat: Seat | null;
  draggedPlayer: DraggedPlayer | null;
  rules: SeatingRule[];
  algorithm: SeatingAlgorithm;
  stats: SeatingStats;
  isBalancing: boolean;
  error: string | null;
  lastAction: SeatingAction | null;
}

export interface SeatingWebSocketEvents {
  // Outbound events
  'seating:join': { tournamentId: string };
  'seating:move_player': {
    tournamentId: string;
    playerId: string;
    fromTable?: number;
    fromSeat?: number;
    toTable: number;
    toSeat: number;
  };
  'seating:auto_balance': { tournamentId: string };
  'seating:break_table': { tournamentId: string; tableNumber: number };
  'seating:create_table': { tournamentId: string; tableType: Table['type'] };
  'seating:assign_blinds': { tournamentId: string; tableNumber: number; dealerPosition: number };

  // Inbound events
  'seating:layout_updated': SeatingLayout;
  'seating:player_moved': {
    playerId: string;
    fromTable?: number;
    fromSeat?: number;
    toTable: number;
    toSeat: number;
    timestamp: Date;
  };
  'seating:table_broken': { tableNumber: number; timestamp: Date };
  'seating:table_created': { table: Table; timestamp: Date };
  'seating:balance_completed': { affectedTables: number[]; timestamp: Date };
  'seating:error': { message: string; action?: string };
}

// Utility types for component props
export interface TableCardProps {
  table: Table;
  onPlayerDrop: (playerId: string, seatNumber: number) => void;
  onSeatClick: (table: Table, seat: Seat) => void;
  showControls?: boolean;
  isSelected?: boolean;
  className?: string;
}

export interface SeatingControlsProps {
  tables: Table[];
  players: Player[];
  onAutoBalance: () => void;
  onCreateTable: (type: Table['type']) => void;
  onBreakTable: (tableNumber: number) => void;
  onAlgorithmChange: (algorithm: SeatingAlgorithm) => void;
  onRuleChange: (rules: SeatingRule[]) => void;
  disabled?: boolean;
}

export interface SeatingChartProps {
  tournamentId: string;
  onPlayerMove?: (action: SeatingAction) => void;
  onTableStatusChange?: (table: Table) => void;
  showControls?: boolean;
  readOnly?: boolean;
  className?: string;
}