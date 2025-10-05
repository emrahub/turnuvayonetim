'use client';

import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Download, Eye } from 'lucide-react';

interface HandPlayer {
  id: string;
  name: string;
  position: number;
  chips: number;
  cards?: string[];
}

interface HandAction {
  type: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  playerId: string;
  amount?: number;
  timestamp: Date;
  street: 'preflop' | 'flop' | 'turn' | 'river';
}

interface HandWinner {
  playerId: string;
  amount: number;
  handRank?: string;
}

export interface HandHistoryData {
  id: string;
  handNumber: number;
  timestamp: Date;
  players: HandPlayer[];
  actions: HandAction[];
  board?: string[];
  winners: HandWinner[];
  potSize: number;
  metadata?: {
    dealerPosition: number;
    smallBlindAmount: number;
    bigBlindAmount: number;
    anteAmount?: number;
  };
}

interface HandHistoryViewerProps {
  hand: HandHistoryData;
  onClose?: () => void;
}

export function HandHistoryViewer({ hand, onClose }: HandHistoryViewerProps) {
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCards, setShowCards] = useState(false);

  const currentStreet = hand.actions[currentActionIndex]?.street || 'preflop';

  // Board cards display based on current street
  const visibleBoard = hand.board
    ? currentStreet === 'preflop'
      ? []
      : currentStreet === 'flop'
      ? hand.board.slice(0, 3)
      : currentStreet === 'turn'
      ? hand.board.slice(0, 4)
      : hand.board
    : [];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Auto-advance actions when playing
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentActionIndex(prev => {
          if (prev >= hand.actions.length - 1) {
            setIsPlaying(false);
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 1500); // 1.5 seconds per action
    }
  };

  const handleNext = () => {
    if (currentActionIndex < hand.actions.length - 1) {
      setCurrentActionIndex(currentActionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentActionIndex > 0) {
      setCurrentActionIndex(currentActionIndex - 1);
    }
  };

  const handleReset = () => {
    setCurrentActionIndex(0);
    setIsPlaying(false);
  };

  const exportToText = () => {
    // Generate poker hand history text format
    let text = `***** Hand #${hand.handNumber} *****\n`;
    text += `Timestamp: ${hand.timestamp.toISOString()}\n`;
    text += `Pot: ${hand.potSize}\n\n`;

    // Players
    text += `Players:\n`;
    hand.players.forEach(p => {
      text += `  Seat ${p.position}: ${p.name} (${p.chips} chips)\n`;
    });

    // Actions
    text += `\n*** Actions ***\n`;
    hand.actions.forEach(action => {
      const player = hand.players.find(p => p.id === action.playerId);
      text += `${action.street}: ${player?.name} ${action.type}`;
      if (action.amount) text += ` ${action.amount}`;
      text += `\n`;
    });

    // Download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hand-${hand.handNumber}.txt`;
    a.click();
  };

  const getCardSymbol = (card: string) => {
    if (!card || card.length < 2) return '?';
    const rank = card[0];
    const suit = card[1];

    const suitSymbols: Record<string, string> = {
      's': '♠',
      'h': '♥',
      'd': '♦',
      'c': '♣'
    };

    return `${rank}${suitSymbols[suit] || suit}`;
  };

  const getCardColor = (card: string) => {
    if (!card || card.length < 2) return 'text-gray-500';
    const suit = card[1];
    return suit === 'h' || suit === 'd' ? 'text-red-500' : 'text-gray-900';
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Hand #{hand.handNumber}</h3>
          <p className="text-sm text-gray-400">
            {new Date(hand.timestamp).toLocaleString('tr-TR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCards(!showCards)}
            className="px-3 py-2 bg-poker-gold/20 hover:bg-poker-gold/30 text-poker-gold rounded-lg transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showCards ? 'Kartları Gizle' : 'Kartları Göster'}
          </button>
          <button
            onClick={exportToText}
            className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
            >
              Kapat
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Poker Table Visualization */}
        <div className="bg-poker-green/20 rounded-xl p-8 mb-6 border-4 border-poker-green/30 relative">
          {/* Board */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-400 mb-2">Board</div>
              <div className="flex gap-2">
                {visibleBoard.length > 0 ? (
                  visibleBoard.map((card, i) => (
                    <div
                      key={i}
                      className={`w-12 h-16 bg-white rounded flex items-center justify-center font-bold text-xl ${getCardColor(card)}`}
                    >
                      {getCardSymbol(card)}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">No community cards yet</div>
                )}
              </div>
            </div>
            <div className="text-center mt-4">
              <div className="text-2xl font-bold text-poker-gold">
                Pot: {hand.potSize.toLocaleString('tr-TR')}
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="flex justify-around items-center h-64">
            {hand.players.map((player) => {
              const currentAction = hand.actions[currentActionIndex];
              const isActive = currentAction?.playerId === player.id;
              const winner = hand.winners.find(w => w.playerId === player.id);

              return (
                <div
                  key={player.id}
                  className={`text-center p-3 rounded-lg transition ${
                    isActive
                      ? 'bg-poker-gold/30 ring-2 ring-poker-gold'
                      : winner
                      ? 'bg-green-600/30 ring-2 ring-green-400'
                      : 'bg-black/40'
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-poker-green to-emerald-700 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                    {player.position + 1}
                  </div>
                  <div className="text-white font-medium text-sm">{player.name}</div>
                  <div className="text-poker-gold text-xs">{player.chips.toLocaleString('tr-TR')}</div>
                  {showCards && player.cards && (
                    <div className="flex gap-1 mt-2 justify-center">
                      {player.cards.map((card, i) => (
                        <div
                          key={i}
                          className={`w-8 h-10 bg-white rounded flex items-center justify-center text-sm font-bold ${getCardColor(card)}`}
                        >
                          {getCardSymbol(card)}
                        </div>
                      ))}
                    </div>
                  )}
                  {winner && (
                    <div className="mt-2 text-green-400 text-xs font-semibold">
                      Won {winner.amount.toLocaleString('tr-TR')}
                      {winner.handRank && <div className="text-xs">{winner.handRank}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action History */}
        <div className="bg-black/40 rounded-xl p-4 mb-4 max-h-32 overflow-y-auto">
          <div className="text-sm font-semibold text-gray-400 mb-2">Action History</div>
          <div className="space-y-1">
            {hand.actions.slice(0, currentActionIndex + 1).map((action, index) => {
              const player = hand.players.find(p => p.id === action.playerId);
              return (
                <div
                  key={index}
                  className={`text-sm ${index === currentActionIndex ? 'text-poker-gold font-semibold' : 'text-gray-400'}`}
                >
                  {action.street.toUpperCase()}: {player?.name} {action.type}
                  {action.amount && ` ${action.amount.toLocaleString('tr-TR')}`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            title="Reset"
          >
            <SkipBack className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handlePrevious}
            disabled={currentActionIndex === 0}
            className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
          >
            <SkipBack className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-4 bg-poker-gold hover:bg-yellow-600 rounded-full transition"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-black" />
            ) : (
              <Play className="w-6 h-6 text-black" />
            )}
          </button>
          <button
            onClick={handleNext}
            disabled={currentActionIndex >= hand.actions.length - 1}
            className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
          >
            <SkipForward className="w-5 h-5 text-white" />
          </button>
          <div className="text-white text-sm">
            Action {currentActionIndex + 1} / {hand.actions.length}
          </div>
        </div>
      </div>
    </div>
  );
}
