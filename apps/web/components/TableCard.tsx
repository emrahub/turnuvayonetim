'use client';

import React, { useMemo, useCallback } from 'react';
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

const SeatComponent: React.FC<SeatComponentProps> = React.memo(({
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

  const getSeatPosition = useMemo(() => (seatNumber: number, maxSeats: number) => {
    // Calculate position around the table (elliptical layout) with proper collision prevention
    const angle = ((seatNumber - 1) / maxSeats) * 2 * Math.PI - Math.PI / 2;

    // Seat dimensions and spacing requirements
    const seatSize = 70; // Reduced from 80px to 70px for better fit
    const minimumSpacing = 20; // Minimum spacing between seat edges
    const effectiveSeatSize = seatSize + minimumSpacing;

    // Calculate minimum required radius based on seat count and spacing
    const circumference = maxSeats * effectiveSeatSize;
    const minRadius = circumference / (2 * Math.PI);

    // Set radius based on table type with proper mathematical spacing
    let radiusX: number, radiusY: number;

    switch (maxSeats) {
      case 2: // Heads-up
        radiusX = Math.max(120, minRadius);
        radiusY = Math.max(60, minRadius * 0.5);
        break;
      case 6: // 6-max
        radiusX = Math.max(180, minRadius);
        radiusY = Math.max(120, minRadius * 0.67);
        break;
      case 9: // 9-max
        radiusX = Math.max(220, minRadius);
        radiusY = Math.max(140, minRadius * 0.64);
        break;
      case 10: // 10-max
        radiusX = Math.max(240, minRadius);
        radiusY = Math.max(150, minRadius * 0.62);
        break;
      default:
        radiusX = Math.max(200, minRadius);
        radiusY = Math.max(130, minRadius * 0.65);
    }

    // Calculate precise positioning with collision avoidance
    const x = Math.cos(angle) * radiusX;
    const y = Math.sin(angle) * radiusY;

    // Ensure seats don't overlap by checking adjacent seat distances
    const adjacentAngle = (2 * Math.PI) / maxSeats;
    const adjacentX = Math.cos(angle + adjacentAngle) * radiusX;
    const adjacentY = Math.sin(angle + adjacentAngle) * radiusY;
    const distance = Math.sqrt(Math.pow(x - adjacentX, 2) + Math.pow(y - adjacentY, 2));

    // If distance is too small, increase radius proportionally
    if (distance < effectiveSeatSize) {
      const scaleFactor = effectiveSeatSize / distance;
      const adjustedRadiusX = radiusX * scaleFactor;
      const adjustedRadiusY = radiusY * scaleFactor;

      return {
        left: `calc(50% + ${Math.cos(angle) * adjustedRadiusX}px)`,
        top: `calc(50% + ${Math.sin(angle) * adjustedRadiusY}px)`,
        transform: 'translate(-50%, -50%)'
      };
    }

    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      transform: 'translate(-50%, -50%)'
    };
  }, []);

  const formatChips = useCallback((chips: number) => {
    if (chips >= 1000000) return `${(chips / 1000000).toFixed(1)}M`;
    if (chips >= 1000) return `${(chips / 1000).toFixed(1)}K`;
    return chips.toString();
  }, []);

  const getStatusColor = useCallback((player: Player) => {
    switch (player.status) {
      case 'active': return 'bg-green-500';
      case 'sitting_out': return 'bg-yellow-500';
      case 'eliminated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  return (
    <motion.div
      ref={drop as any}
      className={`
        absolute w-[70px] h-[70px] rounded-full border-3 cursor-pointer transition-all duration-200
        ${seat.isEmpty
          ? `border-dashed border-amber-400/50 hover:border-poker-gold
             ${canDrop ? 'border-green-400 bg-green-400/20 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : ''}
             ${isOver && canDrop ? 'border-green-500 bg-green-500/30 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.8)]' : ''}
             bg-gradient-to-br from-amber-900/30 to-amber-800/20`
          : `border-solid ${isSelected ? 'border-poker-gold' : 'border-amber-600'}
             hover:border-amber-400 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800
             shadow-[0_0_10px_rgba(0,0,0,0.8)]`
        }
        ${seat.isDealer ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-900/50' : ''}
        ${seat.isSmallBlind && !seat.isDealer ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900/50' : ''}
        ${seat.isBigBlind && !seat.isDealer ? 'ring-2 ring-red-400 ring-offset-1 ring-offset-gray-900/50' : ''}
      `}
      style={getSeatPosition(seat.number, table.maxSeats)}
      onClick={() => onSeatClick(table, seat)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: seat.number * 0.03, duration: 0.2, ease: "easeOut" }}
    >
      {seat.isEmpty ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-amber-400/70 text-sm font-bold">
            {seat.number}
          </div>
        </div>
      ) : seat.player ? (
        <div className="w-full h-full relative">
          {/* Player Avatar */}
          <div className={`w-full h-full rounded-full flex items-center justify-center text-white text-sm font-bold relative border-2 border-white/20 ${getStatusColor(seat.player)}`}>
            {seat.player.name.substring(0, 2).toUpperCase()}

            {/* Chip Leader Crown - Better positioning */}
            {seat.player.isChipLeader && (
              <Crown className="absolute -top-2 -right-2 w-4 h-4 text-yellow-400 drop-shadow-lg z-10" />
            )}
          </div>

          {/* Dealer Button - Improved positioning and styling */}
          {seat.isDealer && (
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black text-[10px] font-bold border border-yellow-200 shadow-lg z-10">
              D
            </div>
          )}

          {/* Small Blind - Non-overlapping with dealer button */}
          {seat.isSmallBlind && (
            <div className={`absolute ${seat.isDealer ? '-bottom-1 -left-1' : '-bottom-1 -left-1'} w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-blue-200 shadow-md z-10`}>
              S
            </div>
          )}

          {/* Big Blind - Smart positioning */}
          {seat.isBigBlind && (
            <div className={`absolute ${seat.isDealer ? '-bottom-1 -right-1' : '-bottom-1 -right-1'} w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-red-200 shadow-md z-10`}>
              B
            </div>
          )}
        </div>
      ) : null}

      {/* Tooltip with player info - Smart positioning to avoid overflow */}
      {seat.player && (
        <motion.div
          className={`
            absolute opacity-0 hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-none
            ${seat.number <= table.maxSeats / 2 ? 'top-full mt-3' : 'bottom-full mb-3'}
            ${seat.number % 4 < 2 ? 'left-1/2 transform -translate-x-1/2' : 'right-1/2 transform translate-x-1/2'}
          `}
          initial={{ opacity: 0, y: seat.number <= table.maxSeats / 2 ? -10 : 10 }}
          whileHover={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap border-2 border-poker-gold/50 shadow-[0_0_20px_rgba(0,0,0,0.9)] backdrop-blur-md max-w-[200px]">
            <div className="font-bold text-poker-gold truncate">{seat.player.name}</div>
            <div className="text-green-400 font-medium">{formatChips(seat.player.chipCount)} chips</div>
            {seat.isDealer && <div className="text-yellow-400 font-medium flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full"></span>Dealer</div>}
            {seat.isSmallBlind && <div className="text-blue-400 font-medium flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full"></span>Small Blind</div>}
            {seat.isBigBlind && <div className="text-red-400 font-medium flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full"></span>Big Blind</div>}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});

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

  const getTableStatusColor = useCallback((status: Table['status']) => {
    switch (status) {
      case 'active': return 'border-green-500 bg-green-500/5';
      case 'breaking': return 'border-yellow-500 bg-yellow-500/5';
      case 'broken': return 'border-red-500 bg-red-500/5';
      case 'waiting': return 'border-gray-500 bg-gray-500/5';
      default: return 'border-gray-600';
    }
  }, []);

  const getTableTypeIcon = useCallback((type: Table['type']) => {
    switch (type) {
      case 'heads-up': return '2';
      case '6-max': return '6';
      case '9-max': return '9';
      case '10-max': return '10';
      default: return '?';
    }
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  return (
    <motion.div
      className={`
        relative rounded-[50%] border-4 border-amber-600 p-8 transition-all duration-300 min-h-[420px] min-w-[520px]
        bg-gradient-to-br from-green-700 via-green-800 to-green-900
        shadow-[inset_0_0_30px_rgba(0,0,0,0.5),0_10px_25px_rgba(0,0,0,0.3)]
        ${getTableStatusColor(table.status)}
        ${isSelected ? 'ring-4 ring-poker-gold ring-offset-4 ring-offset-gray-900' : ''}
        ${className}
      `}
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at center,
            rgba(34, 197, 94, 0.95) 0%,
            rgba(21, 128, 61, 0.95) 40%,
            rgba(20, 83, 45, 0.95) 80%,
            rgba(15, 23, 42, 0.95) 100%
          ),
          repeating-conic-gradient(from 0deg at center,
            transparent 0deg,
            rgba(34, 197, 94, 0.1) 2deg,
            transparent 4deg
          )
        `,
        aspectRatio: '1.3/1'
      }}
      whileHover={{ scale: 1.02 }}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Table Header - Minimalist */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-amber-600/80 to-amber-500/80 rounded-lg px-3 py-1 backdrop-blur-sm border border-amber-400/50">
            <span className="text-white font-bold text-sm drop-shadow-md">
              Table {table.number}
            </span>
          </div>
          <div className={`
            px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm
            ${table.status === 'active' ? 'bg-green-500/80 text-white border-green-400' :
              table.status === 'breaking' ? 'bg-yellow-500/80 text-black border-yellow-400' :
              table.status === 'broken' ? 'bg-red-500/80 text-white border-red-400' :
              'bg-gray-500/80 text-white border-gray-400'
            }
          `}>
            {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
          </div>
        </div>

        {showControls && (
          <motion.button
            className="bg-black/60 hover:bg-black/80 rounded-lg p-2 text-gray-400 hover:text-white transition-colors backdrop-blur-sm border border-gray-600/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MoreVertical className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Table Center with Stats */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-full p-6 text-center border-2 border-amber-500/50 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-sm max-w-[140px] max-h-[140px] min-w-[120px] min-h-[120px] flex flex-col justify-center">
          <div className="text-poker-gold font-bold text-sm mb-1">
            T{table.number}
          </div>

          {occupiedSeats.length > 0 ? (
            <div className="space-y-1">
              <div className="text-white text-xs">
                <span className="text-poker-gold font-medium text-sm">
                  {formatCurrency(averageStack)}
                </span>
              </div>
              <div className="text-gray-300 text-xs">
                {occupiedSeats.length}/{table.maxSeats} players
              </div>
              {table.bigBlindOrbits && (
                <div className="text-gray-400 text-xs">
                  {table.bigBlindOrbits} orbits
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-xs">
              Waiting
            </div>
          )}

          {/* Action indicators */}
          {table.status === 'breaking' && (
            <motion.div
              className="mt-1 flex items-center justify-center gap-1 text-yellow-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Shuffle className="w-3 h-3" />
              <span className="text-xs">Breaking</span>
            </motion.div>
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