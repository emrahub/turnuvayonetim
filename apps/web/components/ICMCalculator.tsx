'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calculator } from 'lucide-react';
import { responsive } from '../lib/responsive';

interface Player {
  id: string;
  name: string;
  chips: number;
}

interface Prize {
  position: number;
  amount: number;
}

interface ICMResult {
  playerId: string;
  playerName: string;
  chips: number;
  equity: number;
  percentage: number;
}

interface Props {
  players: Player[];
  prizePool: number;
  onDealProposal?: (results: ICMResult[]) => void;
}

export function ICMCalculator({ players, prizePool, onDealProposal }: Props) {
  const [dealType, setDealType] = useState<'icm' | 'chip-chop' | 'save'>('icm');
  const [saveAmount, setSaveAmount] = useState(0);
  const [icmResults, setIcmResults] = useState<ICMResult[]>([]);
  const [prizeStructure, setPrizeStructure] = useState<Prize[]>([]);

  // Generate default prize structure (top 10%)
  useEffect(() => {
    const payoutCount = Math.max(1, Math.floor(players.length * 0.1));
    const prizes: Prize[] = [];

    if (payoutCount === 1) {
      prizes.push({ position: 1, amount: prizePool });
    } else if (payoutCount === 2) {
      prizes.push({ position: 1, amount: Math.floor(prizePool * 0.65) });
      prizes.push({ position: 2, amount: Math.floor(prizePool * 0.35) });
    } else {
      // Standard 3-way split
      prizes.push({ position: 1, amount: Math.floor(prizePool * 0.5) });
      prizes.push({ position: 2, amount: Math.floor(prizePool * 0.3) });
      prizes.push({ position: 3, amount: Math.floor(prizePool * 0.2) });
    }

    setPrizeStructure(prizes);
  }, [players.length, prizePool]);

  // Calculate ICM when inputs change
  useEffect(() => {
    if (players.length === 0 || prizeStructure.length === 0) return;

    const results = calculateICM(players, prizeStructure, dealType, saveAmount);
    setIcmResults(results);
  }, [players, prizeStructure, dealType, saveAmount]);

  const calculateICM = (
    players: Player[],
    prizes: Prize[],
    type: string,
    saveAmt: number
  ): ICMResult[] => {
    const totalChips = players.reduce((sum, p) => sum + p.chips, 0);
    const totalPrize = prizes.reduce((sum, p) => sum + p.amount, 0);

    if (type === 'chip-chop') {
      // Simple chip chop (proportional to stacks)
      return players.map((player) => {
        const equity = (player.chips / totalChips) * totalPrize;
        return {
          playerId: player.id,
          playerName: player.name,
          chips: player.chips,
          equity: Math.floor(equity),
          percentage: (equity / totalPrize) * 100,
        };
      }).sort((a, b) => b.chips - a.chips);
    }

    if (type === 'save') {
      // Save deal (guarantee + ICM remainder)
      const totalSave = saveAmt * players.length;
      const remainder = totalPrize - totalSave;

      return players.map((player) => {
        const chipPercent = player.chips / totalChips;
        const equity = saveAmt + (chipPercent * remainder);
        return {
          playerId: player.id,
          playerName: player.name,
          chips: player.chips,
          equity: Math.floor(equity),
          percentage: (equity / totalPrize) * 100,
        };
      }).sort((a, b) => b.chips - a.chips);
    }

    // ICM calculation (simplified recursive)
    return players.map((player) => {
      const equity = calculatePlayerEquity(player, players, prizes);
      return {
        playerId: player.id,
        playerName: player.name,
        chips: player.chips,
        equity: Math.floor(equity),
        percentage: (equity / totalPrize) * 100,
      };
    }).sort((a, b) => b.equity - a.equity);
  };

  const calculatePlayerEquity = (
    player: Player,
    allPlayers: Player[],
    prizes: Prize[]
  ): number => {
    if (allPlayers.length === 1) {
      return prizes[0]?.amount || 0;
    }
    if (prizes.length === 0) {
      return 0;
    }

    const totalChips = allPlayers.reduce((sum, p) => sum + p.chips, 0);
    const winProbability = player.chips / totalChips;
    const currentPrize = prizes[0].amount;
    const remainingPrizes = prizes.slice(1);

    const winValue = currentPrize;
    let loseValue = 0;

    if (remainingPrizes.length > 0) {
      const remainingPlayers = allPlayers.filter((p) => p.id !== player.id);
      if (remainingPlayers.length > 0) {
        loseValue = calculatePlayerEquity(player, remainingPlayers, remainingPrizes);
      }
    }

    return winProbability * winValue + (1 - winProbability) * loseValue;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatChips = (chips: number) => {
    return new Intl.NumberFormat('tr-TR').format(chips);
  };

  return (
    <div className={responsive.container}>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <div className="p-2 md:p-3 bg-poker-gold/20 rounded-lg">
            <Calculator className="w-5 h-5 md:w-6 md:h-6 text-poker-gold" />
          </div>
          <div>
            <h2 className={`${responsive.text.xl} font-bold text-white`}>
              ICM Hesaplayıcı
            </h2>
            <p className={`${responsive.text.sm} text-gray-300`}>
              Anlaşma teklifleri ve equity hesaplama
            </p>
          </div>
        </div>
      </div>

      {/* Deal Type Selector - Mobile Optimized */}
      <div className="mb-4 md:mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Anlaşma Tipi
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'icm', label: 'ICM', icon: Calculator },
            { value: 'chip-chop', label: 'Chip Chop', icon: TrendingUp },
            { value: 'save', label: 'Save Deal', icon: DollarSign },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setDealType(value as any)}
              className={`
                ${responsive.touch.button}
                flex flex-col items-center justify-center gap-1 p-2 md:p-3 rounded-lg
                border-2 transition-all
                ${dealType === value
                  ? 'border-poker-gold bg-poker-gold/20 text-poker-gold'
                  : 'border-gray-600 bg-black/40 text-gray-300 hover:border-gray-400'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs md:text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save Amount Input (if save deal selected) */}
      {dealType === 'save' && (
        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Garantili Miktar (her oyuncu için)
          </label>
          <input
            type="number"
            value={saveAmount}
            onChange={(e) => setSaveAmount(Number(e.target.value))}
            className={`
              ${responsive.touch.input}
              w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-lg text-white
              focus:ring-2 focus:ring-poker-gold focus:border-transparent
            `}
            placeholder="Garantili miktar girin"
          />
        </div>
      )}

      {/* Prize Pool Summary */}
      <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-r from-poker-green/20 to-poker-gold/20 rounded-lg border border-poker-gold/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm md:text-base text-gray-300">Toplam Ödül Havuzu</span>
          <span className="text-lg md:text-2xl font-bold text-poker-gold">
            {formatCurrency(prizePool)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs md:text-sm text-gray-400">
          <span>{players.length} oyuncu kaldı</span>
          <span>{formatChips(players.reduce((sum, p) => sum + p.chips, 0))} chip</span>
        </div>
      </div>

      {/* Results Table - Mobile Optimized */}
      <div className="space-y-2 md:space-y-3">
        <h3 className="text-sm md:text-base font-semibold text-white">
          Anlaşma Teklifi
        </h3>

        {icmResults.map((result, index) => (
          <div
            key={result.playerId}
            className={`
              ${responsive.card.mobile}
              bg-black/40 backdrop-blur-sm
              border-2 ${index === 0 ? 'border-poker-gold' : 'border-gray-600'}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`
                  w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold
                  ${index === 0 ? 'bg-poker-gold text-black' : index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-gray-700 text-gray-300'}
                `}>
                  #{index + 1}
                </div>
                <div>
                  <div className="text-sm md:text-base font-semibold text-white">
                    {result.playerName}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">
                    {formatChips(result.chips)} chips
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base md:text-lg font-bold text-poker-gold">
                  {formatCurrency(result.equity)}
                </div>
                <div className="text-xs md:text-sm text-gray-400">
                  {result.percentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Equity Bar */}
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  index === 0 ? 'bg-poker-gold' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-poker-green'
                }`}
                style={{ width: `${result.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons - Mobile Sticky */}
      {onDealProposal && (
        <div className="mt-6 flex flex-col sm:flex-row gap-2 md:gap-3">
          <button
            onClick={() => onDealProposal(icmResults)}
            className={`
              ${responsive.touch.button}
              flex-1 bg-poker-gold hover:bg-yellow-600 text-black font-semibold py-3 px-4 rounded-lg
              active:bg-yellow-700 transition-colors
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span>Anlaşmayı Onayla</span>
            </div>
          </button>
          <button
            className={`
              ${responsive.touch.button}
              flex-1 bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg
              hover:bg-gray-700 active:bg-gray-800 transition-colors
            `}
          >
            Devam Et
          </button>
        </div>
      )}

      {/* Deal Type Explanations - Collapsible */}
      <div className="mt-6 p-3 md:p-4 bg-black/40 backdrop-blur-sm rounded-lg border border-poker-gold/30">
        <h4 className="text-sm font-semibold text-poker-gold mb-2">
          Anlaşma Tipleri
        </h4>
        <div className="space-y-2 text-xs md:text-sm text-gray-300">
          <div>
            <strong className="text-poker-gold">ICM:</strong> Matematik temelli, chip stack'lere göre adil dağılım
          </div>
          <div>
            <strong className="text-poker-gold">Chip Chop:</strong> Basit, chip oranına göre doğrudan bölüşüm
          </div>
          <div>
            <strong className="text-poker-gold">Save Deal:</strong> Her oyuncuya garanti + kalan ICM ile dağıtım
          </div>
        </div>
      </div>
    </div>
  );
}
