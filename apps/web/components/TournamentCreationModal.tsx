'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Clock, Users, DollarSign, Trophy } from 'lucide-react';
import { useTournamentStore, BlindLevel } from '../stores/tournamentStore';

// Tournament templates - inline to avoid module resolution issues
interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'turbo' | 'regular' | 'deep-stack' | 'hyper-turbo' | 'slow';
  startingStack: number;
  levelDuration: number;
  blindLevels: Array<{
    level: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    duration: number;
    isBreak: boolean;
    breakName?: string;
  }>;
  recommended: {
    minPlayers: number;
    maxPlayers: number;
    estimatedDuration: string;
  };
}

// Frontend templates (inline to avoid import issues)
const ALL_TEMPLATES: TournamentTemplate[] = [
  {
    id: 'hyper-turbo',
    name: 'Hyper Turbo',
    description: 'Çok hızlı turnuva - 3 dakikalık seviyeler',
    type: 'hyper-turbo',
    startingStack: 3000,
    levelDuration: 3,
    blindLevels: [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 3, isBreak: false },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 3, isBreak: false },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 3, isBreak: false },
      { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 3, isBreak: false },
      { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 3, isBreak: false },
      { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 5, isBreak: true, breakName: 'Kısa Mola' },
    ],
    recommended: { minPlayers: 10, maxPlayers: 50, estimatedDuration: '1-2 saat' },
  },
  {
    id: 'turbo',
    name: 'Turbo',
    description: 'Hızlı tempolu turnuva - 5 dakikalık seviyeler',
    type: 'turbo',
    startingStack: 5000,
    levelDuration: 5,
    blindLevels: [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 5, isBreak: false },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 5, isBreak: false },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 5, isBreak: false },
      { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 5, isBreak: false },
      { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 5, isBreak: false },
      { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 10, isBreak: true, breakName: 'Mola - 10 Dakika' },
    ],
    recommended: { minPlayers: 20, maxPlayers: 100, estimatedDuration: '2-3 saat' },
  },
  {
    id: 'regular',
    name: 'Regular',
    description: 'Standart turnuva yapısı - 20 dakikalık seviyeler',
    type: 'regular',
    startingStack: 10000,
    levelDuration: 20,
    blindLevels: [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 20, isBreak: false },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 20, isBreak: false },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 20, isBreak: false },
      { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 20, isBreak: false },
      { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 20, isBreak: false },
      { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true, breakName: 'Mola - 15 Dakika' },
    ],
    recommended: { minPlayers: 50, maxPlayers: 200, estimatedDuration: '4-6 saat' },
  },
  {
    id: 'deep-stack',
    name: 'Deep Stack',
    description: 'Derin stack yapısı - 30 dakikalık seviyeler',
    type: 'deep-stack',
    startingStack: 20000,
    levelDuration: 30,
    blindLevels: [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 30, isBreak: false },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 30, isBreak: false },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, duration: 30, isBreak: false },
      { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 30, isBreak: false },
      { level: 5, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    ],
    recommended: { minPlayers: 50, maxPlayers: 300, estimatedDuration: '6-8 saat' },
  },
  {
    id: 'slow',
    name: 'Slow Structure',
    description: 'Çok yavaş yapı - 45 dakikalık seviyeler',
    type: 'slow',
    startingStack: 30000,
    levelDuration: 45,
    blindLevels: [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 45, isBreak: false },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 45, isBreak: false },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, duration: 45, isBreak: false },
      { level: 4, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    ],
    recommended: { minPlayers: 100, maxPlayers: 500, estimatedDuration: '8+ saat' },
  },
];

interface TournamentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_TOURNAMENT = {
  name: '',
  buyIn: 100,
  maxPlayers: 100,
  startTime: new Date(),
};

const PRESET_STRUCTURES = {
  turbo: [
    { idx: 0, smallBlind: 25, bigBlind: 50, ante: 0, durationSeconds: 600, isBreak: false },
    { idx: 1, smallBlind: 50, bigBlind: 100, ante: 0, durationSeconds: 600, isBreak: false },
    { idx: 2, smallBlind: 75, bigBlind: 150, ante: 25, durationSeconds: 600, isBreak: false },
    { idx: 3, smallBlind: 100, bigBlind: 200, ante: 25, durationSeconds: 600, isBreak: false },
    { idx: 4, smallBlind: 150, bigBlind: 300, ante: 50, durationSeconds: 600, isBreak: false },
  ],
  normal: [
    { idx: 0, smallBlind: 25, bigBlind: 50, ante: 0, durationSeconds: 900, isBreak: false },
    { idx: 1, smallBlind: 50, bigBlind: 100, ante: 0, durationSeconds: 900, isBreak: false },
    { idx: 2, smallBlind: 75, bigBlind: 150, ante: 25, durationSeconds: 900, isBreak: false },
    { idx: 3, smallBlind: 100, bigBlind: 200, ante: 25, durationSeconds: 900, isBreak: false },
    { idx: 4, smallBlind: 150, bigBlind: 300, ante: 50, durationSeconds: 900, isBreak: false },
  ],
  deep: [
    { idx: 0, smallBlind: 25, bigBlind: 50, ante: 0, durationSeconds: 1200, isBreak: false },
    { idx: 1, smallBlind: 50, bigBlind: 100, ante: 0, durationSeconds: 1200, isBreak: false },
    { idx: 2, smallBlind: 75, bigBlind: 150, ante: 25, durationSeconds: 1200, isBreak: false },
    { idx: 3, smallBlind: 100, bigBlind: 200, ante: 25, durationSeconds: 1200, isBreak: false },
    { idx: 4, smallBlind: 150, bigBlind: 300, ante: 50, durationSeconds: 1200, isBreak: false },
  ]
};

export function TournamentCreationModal({ isOpen, onClose }: TournamentCreationModalProps) {
  const createTournament = useTournamentStore(state => state.createTournament);
  const [formData, setFormData] = useState(DEFAULT_TOURNAMENT);
  const [blindStructure, setBlindStructure] = useState<BlindLevel[]>(PRESET_STRUCTURES.normal);
  const [activeTab, setActiveTab] = useState<'basic' | 'structure' | 'settings'>('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addBlindLevel = () => {
    const lastLevel = blindStructure[blindStructure.length - 1];
    const newLevel: BlindLevel = {
      idx: lastLevel.idx + 1,
      smallBlind: Math.round(lastLevel.bigBlind * 1.5),
      bigBlind: Math.round(lastLevel.bigBlind * 2),
      ante: Math.round(lastLevel.ante * 1.5),
      durationSeconds: 900, // 15 minutes
      isBreak: false,
    };
    setBlindStructure([...blindStructure, newLevel]);
  };

  const removeBlindLevel = (index: number) => {
    if (blindStructure.length > 1) {
      setBlindStructure(blindStructure.filter((_, i) => i !== index));
    }
  };

  const updateBlindLevel = (index: number, field: string, value: any) => {
    const updated = [...blindStructure];
    if (field === 'duration') {
      // Convert minutes to seconds
      updated[index] = { ...updated[index], durationSeconds: value * 60 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setBlindStructure(updated);
  };

  const addBreak = () => {
    const lastLevel = blindStructure[blindStructure.length - 1];
    const newBreak: BlindLevel = {
      idx: lastLevel.idx + 1,
      smallBlind: 0,
      bigBlind: 0,
      ante: 0,
      durationSeconds: 900, // 15 minutes
      isBreak: true,
      breakName: 'Mola'
    };
    setBlindStructure([...blindStructure, newBreak]);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Turnuva adı gerekli';
    }

    if (formData.buyIn <= 0) {
      newErrors.buyIn = 'Buy-in 0\'dan büyük olmalı';
    }

    if (formData.maxPlayers <= 0) {
      newErrors.maxPlayers = 'Maksimum oyuncu sayısı 0\'dan büyük olmalı';
    }

    if (blindStructure.length === 0) {
      newErrors.structure = 'En az bir blind seviyesi gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createTournament({
      ...formData,
      blindStructure: blindStructure.map((level, index) => ({
        ...level,
        level: index + 1
      }))
    });

    // Reset form
    setFormData(DEFAULT_TOURNAMENT);
    setBlindStructure(PRESET_STRUCTURES.normal);
    setActiveTab('basic');
    setErrors({});
    onClose();
  };

  const loadPreset = (preset: keyof typeof PRESET_STRUCTURES) => {
    setBlindStructure(PRESET_STRUCTURES[preset]);
  };

  const loadTemplate = (template: TournamentTemplate) => {
    setSelectedTemplate(template.id);
    // Convert template blind levels to modal format
    const convertedLevels: BlindLevel[] = template.blindLevels.map((level, index) => ({
      idx: index,
      smallBlind: level.smallBlind,
      bigBlind: level.bigBlind,
      ante: level.ante,
      durationSeconds: level.duration * 60, // convert minutes to seconds
      isBreak: level.isBreak,
      breakName: level.breakName
    }));
    setBlindStructure(convertedLevels);
    // Also update starting stack if user hasn't customized it
    if (formData.name === '' || formData.name === DEFAULT_TOURNAMENT.name) {
      setFormData(prev => ({
        ...prev,
        name: `${template.name} Turnuvası`
      }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-poker-gold flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Yeni Turnuva Oluştur
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {[
                { id: 'basic', label: 'Temel Bilgiler', icon: Users },
                { id: 'structure', label: 'Blind Yapısı', icon: Clock },
                { id: 'settings', label: 'Ayarlar', icon: DollarSign },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`
                    flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                    ${activeTab === id
                      ? 'bg-poker-gold/20 text-poker-gold border-b-2 border-poker-gold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
              <div className="h-96 overflow-y-auto p-6">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Turnuva Adı *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-2 bg-black/40 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-poker-gold focus:border-transparent"
                        placeholder="Örn: Haftalık Texas Hold'em Turnuvası"
                      />
                      {errors.name && <p className="text-poker-red text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Buy-in (TL) *
                        </label>
                        <input
                          type="number"
                          value={formData.buyIn}
                          onChange={(e) => handleInputChange('buyIn', Number(e.target.value))}
                          className="w-full px-4 py-2 bg-black/40 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-poker-gold focus:border-transparent"
                          min="1"
                        />
                        {errors.buyIn && <p className="text-poker-red text-xs mt-1">{errors.buyIn}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Maksimum Oyuncu *
                        </label>
                        <input
                          type="number"
                          value={formData.maxPlayers}
                          onChange={(e) => handleInputChange('maxPlayers', Number(e.target.value))}
                          className="w-full px-4 py-2 bg-black/40 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-poker-gold focus:border-transparent"
                          min="2"
                          max="1000"
                        />
                        {errors.maxPlayers && <p className="text-poker-red text-xs mt-1">{errors.maxPlayers}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Başlangıç Zamanı
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startTime.toISOString().slice(0, 16)}
                        onChange={(e) => handleInputChange('startTime', new Date(e.target.value))}
                        className="w-full px-4 py-2 bg-black/40 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-poker-gold focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Structure Tab */}
                {activeTab === 'structure' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Turnuva Şablonları
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {ALL_TEMPLATES.map((template) => {
                          const isSelected = selectedTemplate === template.id;
                          const typeColors = {
                            'hyper-turbo': 'from-red-600/20 to-orange-600/20 border-red-500/30 text-red-400',
                            'turbo': 'from-orange-600/20 to-yellow-600/20 border-orange-500/30 text-orange-400',
                            'regular': 'from-green-600/20 to-emerald-600/20 border-green-500/30 text-green-400',
                            'deep-stack': 'from-blue-600/20 to-cyan-600/20 border-blue-500/30 text-blue-400',
                            'slow': 'from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-400'
                          };
                          const typeIcons = {
                            'hyper-turbo': '🚀',
                            'turbo': '⚡',
                            'regular': '📊',
                            'deep-stack': '🎯',
                            'slow': '🐢'
                          };
                          return (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => loadTemplate(template)}
                              className={`
                                p-3 rounded-lg text-left transition-all
                                bg-gradient-to-br ${typeColors[template.type]}
                                border-2 ${isSelected ? 'border-poker-gold ring-2 ring-poker-gold/50' : ''}
                                hover:scale-105
                              `}
                            >
                              <div className="text-2xl mb-1">{typeIcons[template.type]}</div>
                              <div className="font-semibold text-white text-sm mb-1">
                                {template.name}
                              </div>
                              <div className="text-xs opacity-80">
                                {template.levelDuration}dk seviyeler
                              </div>
                              {isSelected && (
                                <div className="mt-2 text-xs text-poker-gold font-medium">
                                  ✓ Seçili
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Şablonu seçtikten sonra istediğiniz gibi özelleştirebilirsiniz
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-white">Blind Seviyeleri</h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={addBlindLevel}
                            className="px-3 py-1 bg-poker-gold/20 text-poker-gold rounded text-sm hover:bg-poker-gold/30 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Level Ekle
                          </button>
                          <button
                            type="button"
                            onClick={addBreak}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Mola Ekle
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {blindStructure.map((level, index) => (
                          <div
                            key={index}
                            className={`
                              p-3 rounded-lg border flex items-center gap-3
                              ${level.isBreak
                                ? 'bg-blue-500/10 border-blue-500/30'
                                : 'bg-black/40 border-gray-600'
                              }
                            `}
                          >
                            <div className="text-sm font-medium text-gray-300 w-12">
                              L{level.idx + 1}
                            </div>

                            {level.isBreak ? (
                              <>
                                <input
                                  type="text"
                                  value={level.breakName || ''}
                                  onChange={(e) => updateBlindLevel(index, 'breakName', e.target.value)}
                                  placeholder="Mola adı"
                                  className="flex-1 px-2 py-1 bg-black/40 border border-gray-600 rounded text-white text-sm"
                                />
                                <input
                                  type="number"
                                  value={Math.round(level.durationSeconds / 60)}
                                  onChange={(e) => updateBlindLevel(index, 'duration', Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-black/40 border border-gray-600 rounded text-white text-sm"
                                  min="1"
                                />
                                <span className="text-xs text-gray-400">dk</span>
                              </>
                            ) : (
                              <>
                                <input
                                  type="number"
                                  value={level.smallBlind}
                                  onChange={(e) => updateBlindLevel(index, 'smallBlind', Number(e.target.value))}
                                  className="w-20 px-2 py-1 bg-black/40 border border-gray-600 rounded text-white text-sm"
                                  min="0"
                                />
                                <span className="text-gray-400">/</span>
                                <input
                                  type="number"
                                  value={level.bigBlind}
                                  onChange={(e) => updateBlindLevel(index, 'bigBlind', Number(e.target.value))}
                                  className="w-20 px-2 py-1 bg-black/40 border border-gray-600 rounded text-white text-sm"
                                  min="0"
                                />
                                <span className="text-xs text-gray-400">Ante:</span>
                                <input
                                  type="number"
                                  value={level.ante}
                                  onChange={(e) => updateBlindLevel(index, 'ante', Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-black/40 border border-gray-600 rounded text-white text-sm"
                                  min="0"
                                />
                                <input
                                  type="number"
                                  value={Math.round(level.durationSeconds / 60)}
                                  onChange={(e) => updateBlindLevel(index, 'duration', Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-black/40 border border-gray-600 rounded text-white text-sm"
                                  min="1"
                                />
                                <span className="text-xs text-gray-400">dk</span>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => removeBlindLevel(index)}
                              className="p-1 text-poker-red hover:bg-poker-red/20 rounded transition-colors"
                              disabled={blindStructure.length <= 1}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {errors.structure && <p className="text-poker-red text-xs">{errors.structure}</p>}
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="text-center text-gray-400">
                      <p>Gelişmiş ayarlar yakında eklenecek...</p>
                      <p className="text-sm mt-2">
                        • Rebuy/Add-on ayarları<br />
                        • Ödül yapısı özelleştirme<br />
                        • Late registration süreleri<br />
                        • Masa dengesi kuralları
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-700 p-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-poker-gold hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
                >
                  Turnuva Oluştur
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}