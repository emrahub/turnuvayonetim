'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shuffle,
  Plus,
  Minus,
  Settings,
  RotateCcw,
  Play,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  History,
  Filter
} from 'lucide-react';
import { SeatingControlsProps, SeatingAlgorithm, SeatingRule, Table } from '../types/seating';
import { Player } from '../stores/tournamentStore';

const SEATING_ALGORITHMS: SeatingAlgorithm[] = [
  {
    type: 'balanced',
    name: 'Balanced Assignment',
    description: 'Distributes players evenly across tables to maintain balance',
    parameters: { respectChipStacks: true, randomizeSeatOrder: true }
  },
  {
    type: 'random',
    name: 'Random Assignment',
    description: 'Assigns players to seats completely randomly',
    parameters: { allowAdjacent: true }
  },
  {
    type: 'snake_draft',
    name: 'Snake Draft',
    description: 'Assigns players in a snake pattern, alternating table directions',
    parameters: { sortByChips: true, reverseOrder: false }
  },
  {
    type: 'chip_stack',
    name: 'Chip Stack Based',
    description: 'Distributes players based on chip counts for balanced tables',
    parameters: { highStacksFirst: true, balanceAcrossTables: true }
  },
  {
    type: 'manual',
    name: 'Manual Assignment',
    description: 'Allows complete manual control over player placement',
    parameters: { requireConfirmation: true }
  }
];

const DEFAULT_RULES: SeatingRule[] = [
  { type: 'max_tables', value: 12, description: 'Maximum number of active tables' },
  { type: 'min_players_per_table', value: 6, description: 'Minimum players per table before breaking' },
  { type: 'max_players_per_table', value: 10, description: 'Maximum players per table' },
  { type: 'balance_threshold', value: 2, description: 'Max player difference between tables before rebalancing' }
];

export const SeatingControls: React.FC<SeatingControlsProps> = ({
  tables,
  players,
  onAutoBalance,
  onCreateTable,
  onBreakTable,
  onAlgorithmChange,
  onRuleChange,
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'algorithm' | 'rules' | 'history'>('actions');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SeatingAlgorithm>(SEATING_ALGORITHMS[0]);
  const [rules, setRules] = useState<SeatingRule[]>(DEFAULT_RULES);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<any[]>([]);

  const activePlayers = players.filter(p => p.status === 'active');
  const activeTables = tables.filter(t => t.status === 'active');
  const breakingTables = tables.filter(t => t.status === 'breaking');

  const getTableBalance = () => {
    if (activeTables.length === 0) return { balanced: true, variance: 0 };

    const playerCounts = activeTables.map(table =>
      table.seats.filter(s => !s.isEmpty).length
    );

    const maxPlayers = Math.max(...playerCounts);
    const minPlayers = Math.min(...playerCounts);
    const variance = maxPlayers - minPlayers;
    const balanceThreshold = rules.find(r => r.type === 'balance_threshold')?.value || 2;

    return {
      balanced: variance <= balanceThreshold,
      variance,
      maxPlayers,
      minPlayers
    };
  };

  const canCreateTable = () => {
    const maxTables = rules.find(r => r.type === 'max_tables')?.value || 12;
    const unassignedPlayers = activePlayers.filter(p => !p.tableNumber);
    return tables.length < maxTables && unassignedPlayers.length >= 6;
  };

  const canBreakTable = (tableNumber: number) => {
    const table = tables.find(t => t.number === tableNumber);
    if (!table) return false;

    const occupiedSeats = table.seats.filter(s => !s.isEmpty).length;
    const minPlayers = rules.find(r => r.type === 'min_players_per_table')?.value || 6;

    return occupiedSeats < minPlayers;
  };

  const handleAlgorithmChange = (algorithm: SeatingAlgorithm) => {
    setSelectedAlgorithm(algorithm);
    onAlgorithmChange(algorithm);
  };

  const handleRuleChange = (ruleType: SeatingRule['type'], value: number) => {
    const updatedRules = rules.map(rule =>
      rule.type === ruleType ? { ...rule, value } : rule
    );
    setRules(updatedRules);
    onRuleChange(updatedRules);
  };

  const handleTableAction = (action: string, tableNumber?: number) => {
    if (action === 'break' && tableNumber) {
      setShowConfirmation(`break-${tableNumber}`);
    } else {
      executeAction(action, tableNumber);
    }
  };

  const executeAction = (action: string, tableNumber?: number) => {
    switch (action) {
      case 'auto-balance':
        onAutoBalance();
        setBalanceHistory(prev => [...prev, {
          action: 'Auto Balance',
          timestamp: new Date(),
          tablesAffected: activeTables.length
        }]);
        break;
      case 'create-table':
        onCreateTable('9-max'); // Default to 9-max
        break;
      case 'break':
        if (tableNumber) {
          onBreakTable(tableNumber);
        }
        setBalanceHistory(prev => [...prev, {
          action: `Break Table ${tableNumber}`,
          timestamp: new Date(),
          tablesAffected: 1
        }]);
        break;
    }
    setShowConfirmation(null);
  };

  const balance = getTableBalance();

  return (
    <div className="bg-gradient-to-br from-black/70 to-gray-900/70 backdrop-blur-sm rounded-xl border-2 border-amber-600/30 p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-poker-gold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Seating Controls
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage table assignments and balancing
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${balance.balanced ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm text-gray-300">
              {balance.balanced ? 'Balanced' : `Variance: ${balance.variance}`}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800/50 rounded-lg p-1">
        {(['actions', 'algorithm', 'rules', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 capitalize
              ${activeTab === tab
                ? 'bg-poker-gold text-black'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'actions' && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-lg p-4 text-center border border-amber-600/30">
                <div className="text-2xl font-bold text-poker-gold">{activeTables.length}</div>
                <div className="text-sm text-amber-300">Active Tables</div>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-4 text-center border border-green-600/30">
                <div className="text-2xl font-bold text-green-400">{activePlayers.length}</div>
                <div className="text-sm text-green-300">Active Players</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 rounded-lg p-4 text-center border border-yellow-600/30">
                <div className="text-2xl font-bold text-yellow-400">{breakingTables.length}</div>
                <div className="text-sm text-yellow-300">Breaking</div>
              </div>
              <div className={`bg-gradient-to-br rounded-lg p-4 text-center border ${balance.balanced ? 'from-green-900/30 to-green-800/20 border-green-600/30' : 'from-red-900/30 to-red-800/20 border-red-600/30'}`}>
                <div className={`text-2xl font-bold ${balance.balanced ? 'text-green-400' : 'text-red-400'}`}>
                  {balance.variance}
                </div>
                <div className={`text-sm ${balance.balanced ? 'text-green-300' : 'text-red-300'}`}>Variance</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Auto Balance */}
              <motion.button
                onClick={() => handleTableAction('auto-balance')}
                disabled={disabled || balance.balanced}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 shadow-lg
                  ${balance.balanced
                    ? 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-900/50 text-gray-500 cursor-not-allowed'
                    : 'border-poker-gold bg-gradient-to-br from-amber-900/30 to-amber-800/20 hover:from-amber-800/40 hover:to-amber-700/30 text-poker-gold hover:shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                  }
                `}
                whileHover={!disabled && !balance.balanced ? { scale: 1.02 } : {}}
                whileTap={!disabled && !balance.balanced ? { scale: 0.98 } : {}}
              >
                <Shuffle className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Auto Balance</div>
                  <div className="text-sm opacity-80">
                    {balance.balanced ? 'Tables are balanced' : 'Redistribute players'}
                  </div>
                </div>
              </motion.button>

              {/* Create Table */}
              <motion.button
                onClick={() => handleTableAction('create-table')}
                disabled={disabled || !canCreateTable()}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 shadow-lg
                  ${!canCreateTable()
                    ? 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-900/50 text-gray-500 cursor-not-allowed'
                    : 'border-green-500 bg-gradient-to-br from-green-900/30 to-green-800/20 hover:from-green-800/40 hover:to-green-700/30 text-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  }
                `}
                whileHover={!disabled && canCreateTable() ? { scale: 1.02 } : {}}
                whileTap={!disabled && canCreateTable() ? { scale: 0.98 } : {}}
              >
                <Plus className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Create Table</div>
                  <div className="text-sm opacity-80">
                    {canCreateTable() ? 'Add new table' : 'Not enough players'}
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Table Management */}
            {activeTables.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Table Management
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeTables.map((table) => {
                    const occupiedSeats = table.seats.filter(s => !s.isEmpty).length;
                    const canBreak = canBreakTable(table.number);

                    return (
                      <div
                        key={table.id}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-800/60 to-slate-900/60 rounded-lg border border-gray-600/30 hover:border-amber-600/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-white font-medium">
                            Table {table.number}
                          </div>
                          <div className="text-sm text-gray-400">
                            {occupiedSeats}/{table.maxSeats} players
                          </div>
                          <div className={`
                            px-2 py-1 rounded text-xs font-medium
                            ${table.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              table.status === 'breaking' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }
                          `}>
                            {table.status}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canBreak && (
                            <motion.button
                              onClick={() => handleTableAction('break', table.number)}
                              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Break
                            </motion.button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'algorithm' && (
          <motion.div
            key="algorithm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Seating Algorithm</h3>
            <div className="space-y-3">
              {SEATING_ALGORITHMS.map((algorithm) => (
                <motion.div
                  key={algorithm.type}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 shadow-lg
                    ${selectedAlgorithm.type === algorithm.type
                      ? 'border-poker-gold bg-gradient-to-br from-amber-900/40 to-amber-800/30 shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                      : 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-amber-600/50 hover:from-gray-700/60 hover:to-gray-800/60'
                    }
                  `}
                  onClick={() => handleAlgorithmChange(algorithm)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white">{algorithm.name}</div>
                      <div className="text-sm text-gray-400 mt-1">{algorithm.description}</div>
                    </div>
                    {selectedAlgorithm.type === algorithm.type && (
                      <CheckCircle className="w-5 h-5 text-poker-gold" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'rules' && (
          <motion.div
            key="rules"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Seating Rules</h3>
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.type} className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg p-4 border border-gray-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-medium">{rule.description}</label>
                    <input
                      type="number"
                      value={rule.value}
                      onChange={(e) => handleRuleChange(rule.type, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 bg-black/60 border-2 border-amber-600/30 rounded text-amber-100 text-center focus:border-poker-gold focus:ring-2 focus:ring-poker-gold/20 transition-colors"
                      min="1"
                      max={rule.type === 'max_tables' ? 20 : rule.type.includes('players') ? 12 : 10}
                    />
                  </div>
                  <div className="text-sm text-amber-300">
                    Current: {rule.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4" />
              Balance History
            </h3>
            {balanceHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg mb-2">No actions yet</div>
                <div className="text-gray-400 text-sm">
                  Balance actions will appear here
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {balanceHistory.slice().reverse().map((entry, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-medium">{entry.action}</div>
                      <div className="text-sm text-gray-400">
                        {entry.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Tables affected: {entry.tablesAffected}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowConfirmation(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 border border-gray-700 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Confirm Action</h3>
              </div>

              <p className="text-gray-300 mb-6">
                {showConfirmation.startsWith('break-') &&
                  `Are you sure you want to break table ${showConfirmation.split('-')[1]}? Players will be redistributed to other tables.`
                }
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showConfirmation.startsWith('break-')) {
                      executeAction('break', parseInt(showConfirmation.split('-')[1]));
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeatingControls;