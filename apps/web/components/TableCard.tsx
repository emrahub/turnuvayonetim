'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrop } from 'react-dnd';
import { Users, Crown, Timer, Shuffle, MoreVertical } from 'lucide-react';
import { Table, Seat, TableCardProps } from '../types/seating';
import { Player } from '../stores/tournamentStore';

interface SeatComponentProps {
  seat: Seat;
  table: Table;
  onSeatClick: (table: Table, seat: Seat) => void;
  onPlayerDrop: (playerId: string, seatNumber: number) => void;
  isSelected?: boolean;
  showControls?: boolean;
}

const SeatComponent: React.FC<SeatComponentProps> = ({
  seat,
  table,
  onSeatClick,
  onPlayerDrop,
  isSelected = false,
  showControls = true
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'PLAYER',
    drop: (item: { player: Player }) => {
      if (seat.isEmpty) {
        onPlayerDrop(item.player.id, seat.number);
      }
    },
    canDrop: () => seat.isEmpty,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const getSeatPosition = (seatNumber: number, maxSeats: number) => {
    // Calculate position around the table (elliptical layout)
    const angle = ((seatNumber - 1) / maxSeats) * 2 * Math.PI - Math.PI / 2;
    const radiusX = 120; // Horizontal radius
    const radiusY = 80;  // Vertical radius

    const x = Math.cos(angle) * radiusX;
    const y = Math.sin(angle) * radiusY;

    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      transform: 'translate(-50%, -50%)'
    };
  };

  const formatChips = (chips: number) => {
    if (chips >= 1000000) return `${(chips / 1000000).toFixed(1)}M`;
    if (chips >= 1000) return `${(chips / 1000).toFixed(1)}K`;
    return chips.toString();
  };

  const getStatusColor = (player: Player) => {
    switch (player.status) {
      case 'active': return 'bg-green-500';
      case 'sitting_out': return 'bg-yellow-500';
      case 'eliminated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      ref={drop as any}
      className={`
        absolute w-16 h-16 rounded-full border-2 cursor-pointer transition-all duration-200
        ${seat.isEmpty
          ? `border-dashed border-gray-600 hover:border-poker-gold
             ${canDrop ? 'border-green-400 bg-green-400/10' : ''}
             ${isOver && canDrop ? 'border-green-500 bg-green-500/20 scale-110' : ''}`
          : `border-solid ${isSelected ? 'border-poker-gold' : 'border-gray-400'}
             hover:border-white bg-gray-800 hover:bg-gray-700`
        }
        ${seat.isDealer ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : ''}
        ${seat.isSmallBlind ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900' : ''}
        ${seat.isBigBlind ? 'ring-2 ring-red-400 ring-offset-1 ring-offset-gray-900' : ''}
      `}
      style={getSeatPosition(seat.number, table.maxSeats)}
      onClick={() => onSeatClick(table, seat)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: seat.number * 0.05 }}
    >
      {seat.isEmpty ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-500 text-sm font-medium">
            {seat.number}
          </div>
        </div>
      ) : seat.player ? (
        <div className="w-full h-full relative">
          {/* Player Avatar */}
          <div className={`w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold relative ${getStatusColor(seat.player)}`}>
            {seat.player.name.substring(0, 2).toUpperCase()}

            {/* Chip Leader Crown */}
            {seat.player.isChipLeader && (
              <Crown className="absolute -top-2 -right-2 w-4 h-4 text-yellow-400" />
            )}
          </div>

          {/* Dealer Button */}
          {seat.isDealer && (
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xs font-bold">
              D
            </div>
          )}

          {/* Small Blind */}
          {seat.isSmallBlind && (
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
              S
            </div>
          )}

          {/* Big Blind */}
          {seat.isBigBlind && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
              B
            </div>
          )}
        </div>
      ) : null}

      {/* Tooltip with player info */}
      {seat.player && (
        <motion.div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 z-10"
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
        >
          <div className="bg-black/90 text-white text-xs rounded-lg p-2 whitespace-nowrap border border-gray-600">
            <div className="font-medium">{seat.player.name}</div>
            <div className="text-poker-gold">{formatChips(seat.player.chipCount)} chips</div>
            {seat.isDealer && <div className="text-yellow-400">Dealer</div>}
            {seat.isSmallBlind && <div className="text-blue-400">Small Blind</div>}
            {seat.isBigBlind && <div className="text-red-400">Big Blind</div>}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export const TableCard: React.FC<TableCardProps> = ({
  table,
  onPlayerDrop,
  onSeatClick,
  showControls = true,
  isSelected = false,
  className = ''
}) => {
  const occupiedSeats = table.seats.filter(seat => !seat.isEmpty);
  const averageStack = occupiedSeats.length > 0
    ? Math.round(occupiedSeats.reduce((sum, seat) => sum + (seat.player?.chipCount || 0), 0) / occupiedSeats.length)
    : 0;

  const getTableStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'active': return 'border-green-500 bg-green-500/5';
      case 'breaking': return 'border-yellow-500 bg-yellow-500/5';
      case 'broken': return 'border-red-500 bg-red-500/5';
      case 'waiting': return 'border-gray-500 bg-gray-500/5';
      default: return 'border-gray-600';
    }
  };

  const getTableTypeIcon = (type: Table['type']) => {
    switch (type) {
      case 'heads-up': return '2';
      case '6-max': return '6';
      case '9-max': return '9';
      case '10-max': return '10';
      default: return '?';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div
      className={`
        relative bg-poker-felt rounded-xl border-2 p-6 transition-all duration-300 min-h-[300px] min-w-[350px]
        ${getTableStatusColor(table.status)}
        ${isSelected ? 'ring-2 ring-poker-gold ring-offset-2 ring-offset-gray-900' : ''}
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Table Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-black/60 rounded-lg px-3 py-1">
            <span className="text-poker-gold font-bold text-lg">
              Table {table.number}
            </span>
          </div>
          <div className="bg-black/60 rounded-lg px-2 py-1 flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-white text-sm">
              {occupiedSeats.length}/{table.maxSeats}
            </span>
          </div>
          <div className="bg-black/60 rounded-lg px-2 py-1">
            <span className="text-gray-400 text-sm">
              {getTableTypeIcon(table.type)}-max
            </span>
          </div>
        </div>

        {showControls && (
          <motion.button
            className="bg-black/60 hover:bg-black/80 rounded-lg p-2 text-gray-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MoreVertical className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Table Status Indicator */}
      <div className="absolute top-4 right-16">
        <div className={`
          px-2 py-1 rounded-full text-xs font-medium border
          ${table.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            table.status === 'breaking' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
            table.status === 'broken' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            'bg-gray-500/20 text-gray-400 border-gray-500/30'
          }
        `}>
          {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
        </div>
      </div>

      {/* Table Center with Stats */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/80 rounded-xl p-4 text-center border border-gray-600">
          <div className="text-poker-gold font-bold text-lg mb-2">
            Table {table.number}
          </div>

          {occupiedSeats.length > 0 ? (
            <div className="space-y-1">
              <div className="text-white text-sm">
                Avg Stack: <span className="text-poker-gold font-medium">
                  {formatCurrency(averageStack)}
                </span>
              </div>
              <div className="text-gray-400 text-xs">
                {occupiedSeats.length} players
              </div>
              {table.bigBlindOrbits && (
                <div className="text-gray-400 text-xs">
                  {table.bigBlindOrbits} orbits
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Waiting for players
            </div>
          )}

          {/* Action indicators */}
          {table.status === 'breaking' && (
            <motion.div
              className="mt-2 flex items-center justify-center gap-1 text-yellow-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Shuffle className="w-3 h-3" />
              <span className="text-xs">Breaking</span>
            </motion.div>
          )}

          {table.lastAction && (
            <div className="mt-2 text-xs text-gray-500">
              Last action: {new Date(table.lastAction).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Seat positions */}
      <AnimatePresence>
        {table.seats.map((seat) => (
          <SeatComponent
            key={seat.id}
            seat={seat}
            table={table}
            onSeatClick={onSeatClick}
            onPlayerDrop={onPlayerDrop}
            showControls={showControls}
          />
        ))}
      </AnimatePresence>

      {/* Table number label at bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/60 rounded-lg px-3 py-1">
          <span className="text-gray-400 text-sm font-medium">
            {table.type.replace('-', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Rebalancing indicator */}
      <AnimatePresence>
        {table.status === 'breaking' && (
          <motion.div
            className="absolute inset-0 bg-yellow-500/10 rounded-xl border-2 border-yellow-500/50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/50"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="flex items-center gap-2 text-yellow-400">
                <Shuffle className="w-5 h-5" />
                <span className="font-medium">Table Breaking</span>
              </div>
              <div className="text-yellow-300 text-sm mt-1">
                Players will be moved
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TableCard;