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
    // Profesyonel poker masası seat pozisyonlaması
    // Seat'ler masa kenarında, yarısı içerde yarısı dışarda

    // Masa boyutları
    const tableWidth = 520;
    const tableHeight = 320;

    // Masa merkezi - sol üst köşeye kaydırmak için offset ekle
    const offsetX = -30;  // Sol tarafa 30px kaydır
    const offsetY = -20;  // Yukarı 20px kaydır
    const centerX = tableWidth / 2 + offsetX;
    const centerY = tableHeight / 2 + offsetY;

    // Elips yarıçapları - seat'ler masa kenarına oturacak
    // Masa boyutunun %40'ı kadar yarıçap
    const radiusX = tableWidth * 0.40;   // 520 * 0.40 = 208px
    const radiusY = tableHeight * 0.40;  // 320 * 0.40 = 128px

    // Açı hesaplama - üstten başla (BTN/Dealer pozisyonu)
    const startAngle = -Math.PI / 2;
    const angleStep = (2 * Math.PI) / maxSeats;
    const angle = startAngle + (angleStep * (seatNumber - 1));

    // Eliptik koordinatlar
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);

    return {
      left: `${x}px`,
      top: `${y}px`,
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
        absolute rounded-full cursor-pointer transition-all duration-300
        ${seat.isEmpty
          ? `border-2 border-dashed border-gray-500 hover:border-green-400
             ${canDrop ? 'border-green-400 bg-green-400/20 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-gray-800/50'}
             ${isOver && canDrop ? 'border-green-500 bg-green-500/30 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.8)]' : ''}`
          : `border-3 border-white
             ${seat.isDealer ? 'bg-gradient-to-b from-[#ffd700] to-[#f0c420]' : 'bg-gradient-to-b from-[#2c5aa0] to-[#1e3d6f]'}
             shadow-[0_5px_20px_rgba(0,0,0,0.7)]
             hover:scale-110 hover:z-10`
        }
      `}
      style={{
        width: '55px',
        height: '55px',
        ...getSeatPosition(seat.number, table.maxSeats),
        ...(seat.isDealer && !seat.isEmpty ? {
          boxShadow: '0 5px 25px rgba(0,0,0,0.7), 0 0 40px rgba(255,215,0,0.5), inset 0 -2px 5px rgba(0,0,0,0.3)'
        } : {})
      }}
      onClick={() => onSeatClick(table, seat)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: seat.number * 0.03, duration: 0.2, ease: "easeOut" }}
    >
      {seat.isEmpty ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400 text-xs font-medium">
            {seat.number}
          </div>
        </div>
      ) : seat.player ? (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className={`text-xs font-bold ${seat.isDealer ? 'text-gray-900' : 'text-white'}`} style={{
            textShadow: seat.isDealer ? '0 1px 2px rgba(255,255,255,0.5)' : '0 1px 3px rgba(0,0,0,0.7)'
          }}>
            {seat.player.name.substring(0, 2).toUpperCase()}
          </div>
          <div className={`text-[10px] ${seat.isDealer ? 'text-gray-800/80' : 'text-white/60'}`}>
            {seat.player.name.substring(0, 5)}
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

SeatComponent.displayName = 'SeatComponent';

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
    <div className="relative">
      {/* Table Header - Outside the table, at the top */}
      <div className="absolute -top-10 left-0 z-10 flex items-center gap-2">
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-md px-3 py-1">
          <span className="text-white font-bold text-sm">
            Table {table.number}
          </span>
        </div>
        <div className={`
          px-2 py-1 rounded-md text-xs font-medium
          ${table.status === 'active' ? 'bg-green-500 text-white' :
            table.status === 'breaking' ? 'bg-yellow-500 text-black' :
            table.status === 'broken' ? 'bg-red-500 text-white' :
            'bg-gray-500 text-white'
          }
        `}>
          {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
        </div>

        {showControls && (
          <motion.button
            className="bg-black/60 hover:bg-black/80 rounded-md p-1.5 text-gray-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MoreVertical className="w-3 h-3" />
          </motion.button>
        )}
      </div>

      {/* Main Table */}
      <motion.div
        className={`
          relative transition-all duration-300
          ${getTableStatusColor(table.status)}
          ${isSelected ? 'ring-4 ring-poker-gold ring-offset-4 ring-offset-gray-900' : ''}
          ${className}
        `}
        style={{
          width: '520px',
          height: '320px',
          background: `radial-gradient(ellipse at center,
            #2d5016 0%,
            #1a3009 40%,
            #0d1805 100%)`,
          borderRadius: '50%',
          boxShadow: `
            inset 0 0 80px rgba(0,0,0,0.8),
            0 10px 40px rgba(0,0,0,0.9),
            0 0 100px rgba(0,0,0,0.5)`,
          border: '8px solid',
          borderImage: 'linear-gradient(45deg, #8b6914, #cdaa3d, #8b6914, #cdaa3d) 1'
        }}
        whileHover={{ scale: 1.02 }}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >

      {/* Table Center with Stats */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/50 rounded-[12px] px-6 py-3 text-center border-2 border-amber-500/30 backdrop-blur-[5px] w-[160px] h-[90px] flex flex-col justify-center">
          <h2 className="text-lg text-poker-gold font-bold tracking-[2px] mb-1" style={{
            textShadow: '0 0 15px rgba(255,215,0,0.5), 0 0 30px rgba(255,215,0,0.3)'
          }}>
            TABLE {table.number}
          </h2>
          <div className="text-white font-bold text-sm">
            {occupiedSeats.length > 0 ? (
              <>POT: {formatCurrency(averageStack)}</>
            ) : (
              <span className="text-gray-400">Waiting...</span>
            )}
          </div>
          <div className="text-gray-300 text-xs mt-0.5">
            {occupiedSeats.length}/{table.maxSeats} players
          </div>

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
    </div>
  );
};

export default TableCard;
