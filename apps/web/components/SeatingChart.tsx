'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag } from 'react-dnd';
import {
  Users,
  Grid3X3,
  Maximize2,
  Minimize2,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Download,
  Printer,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock
} from 'lucide-react';

import { useTournamentStore } from '../stores/tournamentStore';
import { useSeating } from '../hooks/useSeating';
import { TableCard } from './TableCard';
import { SeatingControls } from './SeatingControls';
import { SeatingChartProps, Table, Seat } from '../types/seating';
import { Player } from '../stores/tournamentStore';

interface DraggablePlayerProps {
  player: Player;
  fromTable?: number;
  fromSeat?: number;
}

const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ player, fromTable, fromSeat }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'PLAYER',
    item: { player, fromTable, fromSeat },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const formatChips = (chips: number) => {
    if (chips >= 1000000) return `${(chips / 1000000).toFixed(1)}M`;
    if (chips >= 1000) return `${(chips / 1000).toFixed(1)}K`;
    return chips.toString();
  };

  const getStatusColor = (status: Player['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'sitting_out': return 'bg-yellow-500';
      case 'eliminated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      ref={drag as any}
      className={`
        p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-2 cursor-move transition-all duration-200
        hover:border-poker-gold hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:bg-gradient-to-br hover:from-slate-700 hover:to-slate-800
        ${isDragging ? 'opacity-60 scale-95 shadow-[0_0_20px_rgba(255,215,0,0.5)] border-poker-gold' : 'opacity-100 border-gray-600'}
      `}
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05, zIndex: 1000 }}
      layout
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white/20 shadow-lg ${getStatusColor(player.status)}`}>
          {player.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate">{player.name}</div>
          <div className="text-poker-gold text-sm font-bold">{formatChips(player.chipCount)}</div>
          {fromTable && fromSeat && (
            <div className="text-amber-400 text-xs">Table {fromTable}, Seat {fromSeat}</div>
          )}
        </div>
        {player.isChipLeader && (
          <div className="text-yellow-400 text-xl drop-shadow-lg">👑</div>
        )}
      </div>
    </motion.div>
  );
};

interface UnassignedPlayersProps {
  players: Player[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const UnassignedPlayers: React.FC<UnassignedPlayersProps> = ({
  players,
  isExpanded,
  onToggleExpanded
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sitting_out'>('all');

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || player.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      className="bg-gradient-to-br from-black/70 to-gray-900/70 backdrop-blur-sm rounded-xl border-2 border-amber-600/30 p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
      layout
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-poker-gold" />
          <h3 className="text-lg font-semibold text-white">
            Unassigned Players ({players.length})
          </h3>
        </div>
        <button
          onClick={onToggleExpanded}
          className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Search and Filter */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-poker-gold focus:border-poker-gold"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-poker-gold"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="sitting_out">Sitting Out</option>
              </select>
            </div>

            {/* Player List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || filterStatus !== 'all' ? 'No players match filters' : 'No unassigned players'}
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <DraggablePlayer key={player.id} player={player} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const SeatingChart: React.FC<SeatingChartProps> = ({
  tournamentId,
  onPlayerMove,
  onTableStatusChange,
  showControls = true,
  readOnly = false,
  className = ''
}) => {
  const { socket, players } = useTournamentStore();
  const seating = useSeating({ tournamentId, socket });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [isControlsExpanded, setIsControlsExpanded] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Get unassigned players (players without table/seat assignments)
  const unassignedPlayers = players.filter(player =>
    player.status === 'active' && (!player.tableNumber || !player.seatNumber)
  );

  const handlePlayerDrop = useCallback((playerId: string, seatNumber: number, table: Table) => {
    if (readOnly) return;

    // Find if player is currently seated elsewhere
    const currentPosition = seating.layout?.tables.find(t =>
      t.seats.some(s => s.player?.id === playerId)
    );
    const currentSeat = currentPosition?.seats.find(s => s.player?.id === playerId);

    seating.movePlayer(
      playerId,
      table.number,
      seatNumber,
      currentPosition?.number,
      currentSeat?.number
    );

    if (onPlayerMove) {
      onPlayerMove({
        type: 'MOVE_PLAYER',
        payload: {
          playerId,
          fromTable: currentPosition?.number,
          fromSeat: currentSeat?.number,
          toTable: table.number,
          toSeat: seatNumber
        },
        timestamp: new Date(),
        executedBy: 'user'
      });
    }
  }, [seating, readOnly, onPlayerMove]);

  const handleSeatClick = useCallback((table: Table, seat: Seat) => {
    if (readOnly) return;

    seating.selectTable(table);
    seating.selectSeat(seat);

    // If there's a selected player from unassigned list, assign them
    if (seating.selectedPlayer && seat.isEmpty) {
      handlePlayerDrop(seating.selectedPlayer.id, seat.number, table);
      seating.selectPlayer(null);
    }
  }, [seating, readOnly, handlePlayerDrop]);

  const handleTableSelect = useCallback((table: Table) => {
    setSelectedTable(selectedTable?.id === table.id ? null : table);
    seating.selectTable(table);
  }, [selectedTable, seating]);

  const handlePrintChart = useCallback(() => {
    window.print();
  }, []);

  const handleExportChart = useCallback(() => {
    if (!seating.layout) return;

    const exportData = {
      tournament: tournamentId,
      timestamp: new Date().toISOString(),
      layout: seating.layout,
      stats: seating.stats
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seating-chart-${tournamentId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [seating.layout, seating.stats, tournamentId]);

  if (!seating.layout) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-poker-gold animate-spin mx-auto mb-4" />
          <div className="text-xl text-white">Initializing seating chart...</div>
          <div className="text-gray-400 mt-2">Setting up tables for {players.length} players</div>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="bg-gradient-to-br from-black/70 to-gray-900/70 backdrop-blur-sm rounded-xl border-2 border-amber-600/30 p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-poker-gold flex items-center gap-2">
                <Grid3X3 className="w-6 h-6" />
                Seating Chart
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {seating.stats.occupiedSeats}/{seating.stats.totalSeats} seats
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {seating.stats.activeTables} active tables
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last update: {seating.layout.lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === 'grid' ? 'bg-poker-gold text-black' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === 'list' ? 'bg-poker-gold text-black' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <span className="px-2 text-sm text-gray-300 min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <motion.button
                onClick={handlePrintChart}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Printer className="w-4 h-4" />
              </motion.button>

              <motion.button
                onClick={handleExportChart}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-4 h-4" />
              </motion.button>

              <motion.button
                onClick={() => setShowUnassigned(!showUnassigned)}
                className={`p-2 rounded-lg transition-colors ${
                  showUnassigned
                    ? 'bg-poker-gold text-black'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showUnassigned ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </motion.button>

              {showControls && (
                <motion.button
                  onClick={() => setIsControlsExpanded(!isControlsExpanded)}
                  className={`p-2 rounded-lg transition-colors ${
                    isControlsExpanded
                      ? 'bg-poker-gold text-black'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {seating.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4"
            >
              <div className="text-red-400 text-sm">{seating.error}</div>
            </motion.div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Chart Area - Expanded to 3 columns */}
          <div className="xl:col-span-3">
            <div className="bg-gradient-to-br from-[#1e3c72] to-[#2a5298] backdrop-blur-sm rounded-xl border-2 border-amber-600/20 p-8 min-h-[900px] shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
              <motion.div
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                className="w-full h-full"
              >
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center w-full">
                    <AnimatePresence>
                      {seating.layout.tables
                        .filter(table => table.status !== 'broken')
                        .map((table) => (
                          <motion.div
                            key={table.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="relative flex justify-center items-center w-full"
                            style={{
                              minHeight: '400px'
                            }}
                          >
                            <TableCard
                              table={table}
                              onPlayerDrop={(playerId, seatNumber) => handlePlayerDrop(playerId, seatNumber, table)}
                              onSeatClick={handleSeatClick}
                              isSelected={selectedTable?.id === table.id}
                              showControls={showControls && !readOnly}
                              className="h-full w-full"
                            />
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  // List view for table details
                  <div className="space-y-4">
                    {seating.layout.tables
                      .filter(table => table.status !== 'broken')
                      .map((table) => {
                        const occupiedSeats = table.seats.filter(s => !s.isEmpty);
                        return (
                          <motion.div
                            key={table.id}
                            className="bg-gray-800/50 rounded-lg p-4 border border-gray-600"
                            layout
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold text-white">
                                Table {table.number}
                              </h3>
                              <div className="text-sm text-gray-400">
                                {occupiedSeats.length}/{table.maxSeats} players
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                              {table.seats.map((seat) => (
                                <div
                                  key={seat.id}
                                  className={`p-2 rounded border ${
                                    seat.isEmpty
                                      ? 'border-dashed border-gray-600 text-gray-500'
                                      : 'border-gray-500 bg-gray-700'
                                  }`}
                                >
                                  <div className="text-xs font-medium">
                                    Seat {seat.number}
                                  </div>
                                  {seat.player ? (
                                    <div className="text-sm text-white mt-1">
                                      {seat.player.name}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Empty
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Right Sidebar - Controls & Unassigned Players */}
          <div className="xl:col-span-1 space-y-6">
            <AnimatePresence>
              {showControls && isControlsExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <SeatingControls
                    tables={seating.layout.tables}
                    players={players}
                    onAutoBalance={seating.autoBalance}
                    onCreateTable={seating.createTable}
                    onBreakTable={seating.breakTable}
                    onAlgorithmChange={seating.setAlgorithm}
                    onRuleChange={seating.updateRules}
                    disabled={readOnly || seating.isBalancing}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showUnassigned && unassignedPlayers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <UnassignedPlayers
                    players={unassignedPlayers}
                    isExpanded={true}
                    onToggleExpanded={() => {}}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Balancing Overlay */}
        <AnimatePresence>
          {seating.isBalancing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 rounded-xl p-8 border border-gray-700 text-center"
              >
                <RefreshCw className="w-12 h-12 text-poker-gold animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Rebalancing Tables</h3>
                <p className="text-gray-400">
                  Moving players to balance the tournament...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
};

export default SeatingChart;