"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const socket_io_client_1 = require("socket.io-client");
// DataGrid Component
const DataGrid = ({ players, onPlayerSelect, onEliminate, onUpdateChips }) => {
    const [editingChips, setEditingChips] = (0, react_1.useState)({});
    const handleChipUpdate = (playerId, value) => {
        const chipCount = parseInt(value) || 0;
        setEditingChips(prev => ({ ...prev, [playerId]: chipCount }));
    };
    const commitChipUpdate = (playerId) => {
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
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100';
            case 'eliminated': return 'text-red-600 bg-red-100';
            case 'sitting_out': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    return (<div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Oyuncu
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              İletişim
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Masa/Koltuk
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Chip Sayısı
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Buy-in
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rebuy/Add-on
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durum
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {players.map((player) => (<tr key={player.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onPlayerSelect(player)}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{player.name}</div>
                <div className="text-sm text-gray-500">ID: {player.id}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{player.email}</div>
                <div className="text-sm text-gray-500">{player.phoneNumber}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {player.tableNumber && player.seatNumber
                ? `${player.tableNumber}/${player.seatNumber}`
                : 'Atanmamış'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingChips[player.id] !== undefined ? (<div className="flex items-center space-x-2">
                    <input type="number" value={editingChips[player.id]} onChange={(e) => handleChipUpdate(player.id, e.target.value)} onBlur={() => commitChipUpdate(player.id)} onKeyDown={(e) => {
                    if (e.key === 'Enter')
                        commitChipUpdate(player.id);
                    if (e.key === 'Escape')
                        setEditingChips(prev => {
                            const updated = { ...prev };
                            delete updated[player.id];
                            return updated;
                        });
                }} className="w-24 px-2 py-1 text-sm border border-gray-300 rounded" autoFocus/>
                  </div>) : (<div className="text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded" onClick={(e) => {
                    e.stopPropagation();
                    setEditingChips(prev => ({ ...prev, [player.id]: player.chipCount }));
                }}>
                    {player.chipCount.toLocaleString()}
                  </div>)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(player.buyInAmount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>Rebuy: {player.rebuys}</div>
                <div>Add-on: {player.addOns}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(player.status)}`}>
                  {player.status === 'active' ? 'Aktif' :
                player.status === 'eliminated' ? 'Elendi' : 'Bekleme'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                {player.status === 'active' && (<button onClick={(e) => {
                    e.stopPropagation();
                    onEliminate(player.id);
                }} className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50">
                    Eleme
                  </button>)}
              </td>
            </tr>))}
        </tbody>
      </table>
    </div>);
};
// Main PlayerManagement Component
const PlayerManagement = ({ tournamentId = 'default', socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003' }) => {
    // State
    const [players, setPlayers] = (0, react_1.useState)([]);
    const [selectedPlayer, setSelectedPlayer] = (0, react_1.useState)(null);
    const [isFormOpen, setIsFormOpen] = (0, react_1.useState)(false);
    const [socket, setSocket] = (0, react_1.useState)(null);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [filterStatus, setFilterStatus] = (0, react_1.useState)('all');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    // Form state
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        email: '',
        phoneNumber: '',
        buyInAmount: 0,
        tableNumber: undefined,
        seatNumber: undefined
    });
    // Socket connection
    (0, react_1.useEffect)(() => {
        const socketConnection = (0, socket_io_client_1.io)(socketUrl, {
            query: { tournamentId }
        });
        setSocket(socketConnection);
        // Socket event listeners
        socketConnection.on('connect', () => {
            console.log('Socket connected');
        });
        socketConnection.on('player_registered', (player) => {
            setPlayers(prev => [...prev, player]);
        });
        socketConnection.on('player_updated', (updatedPlayer) => {
            setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
        });
        socketConnection.on('player_eliminated', (playerId) => {
            setPlayers(prev => prev.map(p => p.id === playerId
                ? { ...p, status: 'eliminated', eliminationTime: new Date() }
                : p));
        });
        socketConnection.on('chip_count_updated', ({ playerId, chipCount }) => {
            setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, chipCount } : p));
        });
        return () => {
            socketConnection.disconnect();
        };
    }, [socketUrl, tournamentId]);
    // Form handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'buyInAmount' || name === 'tableNumber' || name === 'seatNumber'
                ? (value === '' ? undefined : Number(value))
                : value
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const newPlayer = {
                id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...formData,
                buyInAmount: formData.buyInAmount || 0,
                chipCount: formData.buyInAmount || 0,
                status: 'active',
                rebuys: 0,
                addOns: 0,
                registrationTime: new Date()
            };
            // Emit to socket
            if (socket) {
                socket.emit('register_player', newPlayer);
            }
            // Reset form
            setFormData({
                name: '',
                email: '',
                phoneNumber: '',
                buyInAmount: 0,
                tableNumber: undefined,
                seatNumber: undefined
            });
            setIsFormOpen(false);
        }
        catch (error) {
            console.error('Error registering player:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Action handlers
    const handleRebuy = (0, react_1.useCallback)((playerId, amount) => {
        if (socket) {
            socket.emit('player_rebuy', { playerId, amount });
        }
        setPlayers(prev => prev.map(p => p.id === playerId
            ? { ...p, rebuys: p.rebuys + 1, chipCount: p.chipCount + amount }
            : p));
    }, [socket]);
    const handleAddOn = (0, react_1.useCallback)((playerId, amount) => {
        if (socket) {
            socket.emit('player_addon', { playerId, amount });
        }
        setPlayers(prev => prev.map(p => p.id === playerId
            ? { ...p, addOns: p.addOns + 1, chipCount: p.chipCount + amount }
            : p));
    }, [socket]);
    const handleElimination = (0, react_1.useCallback)((playerId) => {
        if (socket) {
            socket.emit('eliminate_player', playerId);
        }
    }, [socket]);
    const handleChipUpdate = (0, react_1.useCallback)((playerId, newChipCount) => {
        if (socket) {
            socket.emit('update_chip_count', { playerId, chipCount: newChipCount });
        }
    }, [socket]);
    // Filter players
    const filteredPlayers = players.filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || player.status === filterStatus;
        return matchesSearch && matchesStatus;
    });
    const totalPlayers = players.length;
    const activePlayers = players.filter(p => p.status === 'active').length;
    const eliminatedPlayers = players.filter(p => p.status === 'eliminated').length;
    const totalPrizePool = players.reduce((sum, p) => sum + p.buyInAmount + (p.rebuys * p.buyInAmount) + (p.addOns * p.buyInAmount), 0);
    return (<div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Oyuncu Yönetimi</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>Toplam: {totalPlayers}</span>
                <span>Aktif: {activePlayers}</span>
                <span>Elenen: {eliminatedPlayers}</span>
                <span>Ödül Havuzu: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalPrizePool)}</span>
              </div>
            </div>
            <button onClick={() => setIsFormOpen(true)} className="mt-4 lg:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
              Yeni Oyuncu Kaydet
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <input type="text" placeholder="Oyuncu ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
            <div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="eliminated">Elenen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Player Grid */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <DataGrid players={filteredPlayers} onPlayerSelect={setSelectedPlayer} onEliminate={handleElimination} onUpdateChips={handleChipUpdate}/>
        </div>

        {/* Registration Form Modal */}
        {isFormOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Yeni Oyuncu Kaydı</h2>
                  <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad *
                    </label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta *
                    </label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon *
                    </label>
                    <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                  </div>

                  <div>
                    <label htmlFor="buyInAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Buy-in Miktarı (TL) *
                    </label>
                    <input type="number" id="buyInAmount" name="buyInAmount" value={formData.buyInAmount || ''} onChange={handleInputChange} required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Masa No
                      </label>
                      <input type="number" id="tableNumber" name="tableNumber" value={formData.tableNumber || ''} onChange={handleInputChange} min="1" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    </div>

                    <div>
                      <label htmlFor="seatNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Koltuk No
                      </label>
                      <input type="number" id="seatNumber" name="seatNumber" value={formData.seatNumber || ''} onChange={handleInputChange} min="1" max="10" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200">
                      İptal
                    </button>
                    <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200">
                      {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>)}

        {/* Player Detail Modal */}
        {selectedPlayer && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Oyuncu Detayları</h2>
                  <button onClick={() => setSelectedPlayer(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedPlayer.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>E-posta: {selectedPlayer.email}</p>
                      <p>Telefon: {selectedPlayer.phoneNumber}</p>
                      <p>Kayıt Zamanı: {selectedPlayer.registrationTime.toLocaleString('tr-TR')}</p>
                      {selectedPlayer.eliminationTime && (<p>Eleme Zamanı: {selectedPlayer.eliminationTime.toLocaleString('tr-TR')}</p>)}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Chip Sayısı:</span>
                        <span className="ml-2">{selectedPlayer.chipCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium">Buy-in:</span>
                        <span className="ml-2">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedPlayer.buyInAmount)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Rebuy:</span>
                        <span className="ml-2">{selectedPlayer.rebuys}</span>
                      </div>
                      <div>
                        <span className="font-medium">Add-on:</span>
                        <span className="ml-2">{selectedPlayer.addOns}</span>
                      </div>
                    </div>
                  </div>

                  {selectedPlayer.status === 'active' && (<div className="border-t pt-4 space-y-3">
                      <div className="flex gap-2">
                        <button onClick={() => {
                    handleRebuy(selectedPlayer.id, selectedPlayer.buyInAmount);
                    setSelectedPlayer(null);
                }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200">
                          Rebuy
                        </button>
                        <button onClick={() => {
                    handleAddOn(selectedPlayer.id, selectedPlayer.buyInAmount);
                    setSelectedPlayer(null);
                }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">
                          Add-on
                        </button>
                      </div>
                      <button onClick={() => {
                    handleElimination(selectedPlayer.id);
                    setSelectedPlayer(null);
                }} className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
                        Oyuncuyu Eleme
                      </button>
                    </div>)}
                </div>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
};
exports.default = PlayerManagement;
//# sourceMappingURL=PlayerManagement.jsx.map