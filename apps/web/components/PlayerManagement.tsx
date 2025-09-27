'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { useTournamentStore } from '../stores/tournamentStore';
import { LoadingSpinner } from './ui/LoadingSpinner';

// Types
interface Player {
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

interface PlayerFormData {
  name: string;
  email: string;
  phoneNumber: string;
  buyInAmount: number;
  tableNumber?: number;
  seatNumber?: number;
}

interface PlayerManagementProps {
  tournamentId?: string;
  socketUrl?: string;
  onPlayerCountChange?: (count: number) => void;
  showAddModal?: boolean;
  onCloseModal?: () => void;
}

// DataGrid Component
const DataGrid: React.FC<{
  players: Player[];
  onPlayerSelect: (player: Player) => void;
  onEliminate: (playerId: string) => void;
  onUpdateChips: (playerId: string, newChipCount: number) => void;
}> = ({ players, onPlayerSelect, onEliminate, onUpdateChips }) => {
  const [editingChips, setEditingChips] = useState<{ [key: string]: number }>({});

  const handleChipUpdate = (playerId: string, value: string) => {
    const chipCount = parseInt(value) || 0;
    setEditingChips(prev => ({ ...prev, [playerId]: chipCount }));
  };

  const commitChipUpdate = (playerId: string) => {
    const newChipCount = editingChips[playerId];
    if (newChipCount !== undefined) {
      onUpdateChips(playerId, newChipCount);
      setEditingChips(prev => {
        const updated = { ...prev };
        delete updated[playerId];
        return updated;
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const getStatusColor = (status: Player['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'eliminated': return 'text-poker-red bg-poker-red/20 border-poker-red/30';
      case 'sitting_out': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="overflow-x-auto -mx-3 sm:mx-0">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-black/60">
          <tr>
            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-poker-gold uppercase tracking-wider">
              Oyuncu
            </th>
            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-poker-gold uppercase tracking-wider hidden sm:table-cell">
              İletişim
            </th>
            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-poker-gold uppercase tracking-wider hidden lg:table-cell">
              Masa/Koltuk
            </th>
            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-poker-gold uppercase tracking-wider">
              Chip Sayısı
            </th>
            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-poker-gold uppercase tracking-wider hidden md:table-cell">
              Buy-in
            </th>
            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-poker-gold uppercase tracking-wider hidden lg:table-cell">
              Rebuy/Add-on
            </th>
            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-poker-gold uppercase tracking-wider">
              Durum
            </th>
            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-poker-gold uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {players.map((player, index) => (
            <motion.tr
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`hover:bg-white/5 cursor-pointer transition-all duration-200 ${
                player.isChipLeader ? 'bg-poker-gold/10 border border-poker-gold/30' : ''
              }`}
              onClick={() => onPlayerSelect(player)}
            >
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 sm:gap-3">
                  {player.isChipLeader && (
                    <div className="text-poker-gold text-base sm:text-lg" title="Chip Lideri">
                      👑
                    </div>
                  )}
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-white">{player.name}</div>
                    <div className="text-xs text-gray-400 sm:hidden">#{player.id.slice(-6)}</div>
                    <div className="text-xs text-gray-400 sm:hidden">{player.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                <div className="text-sm text-gray-300">{player.email}</div>
                <div className="text-xs text-gray-500">{player.phoneNumber}</div>
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  player.tableNumber && player.seatNumber
                    ? 'bg-poker-green/20 text-poker-green'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {player.tableNumber && player.seatNumber
                    ? `Masa ${player.tableNumber} / Koltuk ${player.seatNumber}`
                    : 'Atanmamış'
                  }
                </div>
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                {editingChips[player.id] !== undefined ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={editingChips[player.id]}
                      onChange={(e) => handleChipUpdate(player.id, e.target.value)}
                      onBlur={() => commitChipUpdate(player.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitChipUpdate(player.id);
                        if (e.key === 'Escape') setEditingChips(prev => {
                          const updated = { ...prev };
                          delete updated[player.id];
                          return updated;
                        });
                      }}
                      className="w-20 sm:w-28 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-black/60 border border-poker-gold text-white rounded focus:ring-2 focus:ring-poker-gold"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div
                    className="text-xs sm:text-sm font-bold text-poker-gold cursor-pointer hover:bg-poker-gold/20 px-2 sm:px-3 py-1 sm:py-2 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChips(prev => ({ ...prev, [player.id]: player.chipCount }));
                    }}
                    title="Chip sayısını düzenlemek için tıklayın"
                  >
                    {player.chipCount.toLocaleString()}
                  </div>
                )}
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-300 hidden md:table-cell">
                {formatCurrency(player.buyInAmount)}
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">Rebuy:</span>
                    <span className="text-white font-medium">{player.rebuys}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">Add-on:</span>
                    <span className="text-white font-medium">{player.addOns}</span>
                  </div>
                </div>
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(player.status)}`}>
                  <span className="hidden sm:inline">
                    {player.status === 'active' ? 'Aktif' :
                     player.status === 'eliminated' ? 'Elendi' : 'Bekleme'}
                  </span>
                  <span className="sm:hidden">
                    {player.status === 'active' ? '✓' :
                     player.status === 'eliminated' ? '✗' : '⏸'}
                  </span>
                </span>
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                {player.status === 'active' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEliminate(player.id);
                    }}
                    className="text-poker-red hover:text-red-400 px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-poker-red/20 transition-colors border border-poker-red/30 text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Eleme</span>
                    <span className="sm:hidden">✗</span>
                  </motion.button>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main PlayerManagement Component
const PlayerManagement: React.FC<PlayerManagementProps> = ({
  tournamentId = 'default',
  socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003',
  onPlayerCountChange,
  showAddModal = false,
  onCloseModal
}) => {
  // Tournament Store Integration
  const {
    players,
    selectedPlayer,
    tournament,
    statistics,
    setSelectedPlayer,
    addPlayer,
    updatePlayer,
    updatePlayerChips,
    eliminatePlayer,
    processRebuy,
    processAddOn
  } = useTournamentStore();

  // Helper function for status colors
  const getStatusColor = (status: Player['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'eliminated': return 'text-poker-red bg-poker-red/20 border-poker-red/30';
      case 'sitting_out': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  // Local state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'eliminated'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(showAddModal);

  // Form state
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    email: '',
    phoneNumber: '',
    buyInAmount: 0,
    tableNumber: undefined,
    seatNumber: undefined
  });

  // Socket connection
  useEffect(() => {
    const socketConnection = io(socketUrl, {
      query: { tournamentId }
    });

    setSocket(socketConnection);

    // Socket event listeners
    socketConnection.on('connect', () => {
      console.log('Socket connected');
    });

    socketConnection.on('player_registered', (player: Player) => {
      updatePlayer(player);
    });

    socketConnection.on('player_updated', (updatedPlayer: Player) => {
      updatePlayer(updatedPlayer);
    });

    socketConnection.on('player_eliminated', (playerId: string) => {
      eliminatePlayer(playerId);
    });

    socketConnection.on('chip_count_updated', ({ playerId, chipCount }: { playerId: string; chipCount: number }) => {
      updatePlayerChips(playerId, chipCount);
    });

    return () => {
      socketConnection.disconnect();
    };
  }, [socketUrl, tournamentId]);

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'buyInAmount' || name === 'tableNumber' || name === 'seatNumber'
        ? (value === '' ? undefined : Number(value))
        : value
    }));
  };

  // Watch for showAddModal changes
  useEffect(() => {
    setIsFormOpen(showAddModal);
  }, [showAddModal]);

  // Notify parent of player count changes
  useEffect(() => {
    if (onPlayerCountChange) {
      onPlayerCountChange(statistics.activePlayers);
    }
  }, [statistics.activePlayers, onPlayerCountChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use store action instead of direct player creation
      addPlayer({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        buyInAmount: formData.buyInAmount || tournament?.buyIn || 100,
        chipCount: formData.buyInAmount || tournament?.buyIn || 100,
        status: 'active',
        tableNumber: formData.tableNumber,
        seatNumber: formData.seatNumber
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        buyInAmount: tournament?.buyIn || 100,
        tableNumber: undefined,
        seatNumber: undefined
      });
      setIsFormOpen(false);
      if (onCloseModal) onCloseModal();
    } catch (error) {
      console.error('Error registering player:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Action handlers - now using store actions
  const handleRebuy = useCallback((playerId: string) => {
    processRebuy(playerId);
  }, [processRebuy]);

  const handleAddOn = useCallback((playerId: string) => {
    processAddOn(playerId);
  }, [processAddOn]);

  const handleElimination = useCallback((playerId: string) => {
    eliminatePlayer(playerId);
  }, [eliminatePlayer]);

  const handleChipUpdate = useCallback((playerId: string, newChipCount: number) => {
    updatePlayerChips(playerId, newChipCount);
  }, [updatePlayerChips]);

  // Filter players
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || player.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="w-full">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-poker-gold/20"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-poker-gold mb-2">Oyuncu Yönetimi</h1>
              <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-300">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-poker-gold rounded-full" />
                  Toplam: <span className="font-semibold text-white">{statistics.totalPlayers}</span>
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  Aktif: <span className="font-semibold text-green-400">{statistics.activePlayers}</span>
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-poker-red rounded-full" />
                  Elenen: <span className="font-semibold text-poker-red">{statistics.eliminatedPlayers}</span>
                </span>
                {tournament && (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-poker-gold rounded-full" />
                    Ödül Havuzu: <span className="font-semibold text-poker-gold">{formatCurrency(tournament.prizePool)}</span>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-4 lg:mt-0 bg-poker-gold hover:bg-yellow-600 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105 text-sm sm:text-base"
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                +
              </motion.div>
              Yeni Oyuncu Kaydet
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-700"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Oyuncu ara... (isim veya e-posta)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/60 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-poker-gold focus:border-poker-gold transition-all text-sm sm:text-base"
              />
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-black/60 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-poker-gold focus:border-poker-gold transition-all text-sm sm:text-base"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif Oyuncular</option>
                <option value="eliminated">Elenen Oyuncular</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Player Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700"
        >
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl text-gray-600 mb-4">🃏</div>
              <h3 className="text-xl font-medium text-gray-300 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'Oyuncu bulunamadı' : 'Henüz kayıtlı oyuncu yok'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Arama kriterlerinizi değiştirmeyi deneyin.'
                  : 'Turnuvaya ilk oyuncuyu kaydetmek için "Yeni Oyuncu Kaydet" butonunu kullanın.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-6 py-3 bg-poker-gold hover:bg-yellow-600 text-black rounded-lg font-medium transition-colors"
                >
                  İlk Oyuncuyu Kaydet
                </button>
              )}
            </div>
          ) : (
            <DataGrid
              players={filteredPlayers}
              onPlayerSelect={setSelectedPlayer}
              onEliminate={handleElimination}
              onUpdateChips={handleChipUpdate}
            />
          )}
        </motion.div>

        {/* Registration Form Modal */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => {
                setIsFormOpen(false);
                if (onCloseModal) onCloseModal();
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto border border-poker-gold/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-poker-gold flex items-center gap-2">
                      🂏 Yeni Oyuncu Kaydı
                    </h2>
                    <button
                      onClick={() => {
                        setIsFormOpen(false);
                        if (onCloseModal) onCloseModal();
                      }}
                      className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-poker-gold focus:border-poker-gold transition-all"
                        placeholder="Örn: Ahmet Yılmaz"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        E-posta *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-poker-gold focus:border-poker-gold transition-all"
                        placeholder="Örn: ahmet@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
                        Telefon *
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-poker-gold focus:border-poker-gold transition-all"
                        placeholder="Örn: +90 555 123 45 67"
                      />
                    </div>

                    <div>
                      <label htmlFor="buyInAmount" className="block text-sm font-medium text-gray-300 mb-2">
                        Buy-in Miktarı (TL) *
                      </label>
                      <input
                        type="number"
                        id="buyInAmount"
                        name="buyInAmount"
                        value={formData.buyInAmount || tournament?.buyIn || ''}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-poker-gold focus:border-poker-gold transition-all"
                        placeholder={`Örn: ${tournament?.buyIn || 100}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-300 mb-2">
                          Masa No
                        </label>
                        <input
                          type="number"
                          id="tableNumber"
                          name="tableNumber"
                          value={formData.tableNumber || ''}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-poker-gold focus:border-poker-gold transition-all"
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label htmlFor="seatNumber" className="block text-sm font-medium text-gray-300 mb-2">
                          Koltuk No
                        </label>
                        <input
                          type="number"
                          id="seatNumber"
                          name="seatNumber"
                          value={formData.seatNumber || ''}
                          onChange={handleInputChange}
                          min="1"
                          max="10"
                          className="w-full px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-poker-gold focus:border-poker-gold transition-all"
                          placeholder="1-10"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFormOpen(false);
                          if (onCloseModal) onCloseModal();
                        }}
                        className="flex-1 px-4 py-3 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                      >
                        İptal
                      </button>
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-4 py-3 bg-poker-gold hover:bg-yellow-600 text-black font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner size="sm" color="white" text="" />
                            Kaydediliyor...
                          </>
                        ) : (
                          'Oyuncuyu Kaydet'
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Detail Modal */}
        <AnimatePresence>
          {selectedPlayer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedPlayer(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-screen overflow-y-auto border border-poker-gold/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-poker-gold flex items-center gap-2">
                      {selectedPlayer.isChipLeader && '👑'}
                      Oyuncu Detayları
                    </h2>
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="text-center pb-4 border-b border-gray-700">
                      <h3 className="text-2xl font-bold text-white mb-2">{selectedPlayer.name}</h3>
                      <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedPlayer.status)}`}>
                        {selectedPlayer.status === 'active' ? 'Aktif Oyuncu' :
                         selectedPlayer.status === 'eliminated' ? 'Elenen Oyuncu' : 'Beklemede'}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-black/40 rounded-lg p-4">
                        <h4 className="text-poker-gold font-medium mb-3">İletişim Bilgileri</h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-300">E-posta: <span className="text-white">{selectedPlayer.email}</span></p>
                          <p className="text-gray-300">Telefon: <span className="text-white">{selectedPlayer.phoneNumber}</span></p>
                          <p className="text-gray-300">Kayıt: <span className="text-white">{selectedPlayer.registrationTime.toLocaleString('tr-TR')}</span></p>
                          {selectedPlayer.eliminationTime && (
                            <p className="text-gray-300">Eleme: <span className="text-poker-red">{selectedPlayer.eliminationTime.toLocaleString('tr-TR')}</span></p>
                          )}
                        </div>
                      </div>

                      <div className="bg-black/40 rounded-lg p-4">
                        <h4 className="text-poker-gold font-medium mb-3">Oyun Bilgileri</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center p-3 bg-black/60 rounded">
                            <div className="text-poker-gold font-bold text-lg">{selectedPlayer.chipCount.toLocaleString()}</div>
                            <div className="text-gray-400">Chip Sayısı</div>
                          </div>
                          <div className="text-center p-3 bg-black/60 rounded">
                            <div className="text-white font-bold text-lg">{formatCurrency(selectedPlayer.buyInAmount)}</div>
                            <div className="text-gray-400">Buy-in</div>
                          </div>
                          <div className="text-center p-3 bg-black/60 rounded">
                            <div className="text-white font-bold text-lg">{selectedPlayer.rebuys}</div>
                            <div className="text-gray-400">Rebuy</div>
                          </div>
                          <div className="text-center p-3 bg-black/60 rounded">
                            <div className="text-white font-bold text-lg">{selectedPlayer.addOns}</div>
                            <div className="text-gray-400">Add-on</div>
                          </div>
                        </div>
                      </div>

                      {selectedPlayer.tableNumber && selectedPlayer.seatNumber ? (
                        <div className="bg-black/40 rounded-lg p-4">
                          <h4 className="text-poker-gold font-medium mb-3">Masa Bilgileri</h4>
                          <div className="text-center">
                            <div className="text-white font-bold text-lg">
                              Masa {selectedPlayer.tableNumber} / Koltuk {selectedPlayer.seatNumber}
                            </div>
                            <div className="text-gray-400 text-sm mt-2">
                              Masa düzenlemesi için Seating Chart'ı kullanın
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-black/40 rounded-lg p-4">
                          <h4 className="text-poker-gold font-medium mb-3">Masa Bilgileri</h4>
                          <div className="text-center">
                            <div className="text-yellow-400 font-bold text-lg">
                              Masa Atanmamış
                            </div>
                            <div className="text-gray-400 text-sm mt-2">
                              Oyuncu henüz bir masaya yerleştirilmemiş
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedPlayer.status === 'active' && (
                      <div className="border-t border-gray-700 pt-6 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              handleRebuy(selectedPlayer.id);
                              setSelectedPlayer(null);
                            }}
                            className="px-4 py-3 bg-poker-green hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
                          >
                            🔄 Rebuy
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              handleAddOn(selectedPlayer.id);
                              setSelectedPlayer(null);
                            }}
                            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                          >
                            ➕ Add-on
                          </motion.button>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            handleElimination(selectedPlayer.id);
                            setSelectedPlayer(null);
                          }}
                          className="w-full px-4 py-3 bg-poker-red hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
                        >
                          ❌ Oyuncuyu Eleme
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlayerManagement;