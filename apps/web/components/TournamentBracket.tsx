'use client';

import React, { useState } from 'react';
import { Trophy, Users, Zap } from 'lucide-react';

export interface BracketPlayer {
  id: string;
  name: string;
  rating?: number;
  seed?: number;
}

export interface BracketMatch {
  id: string;
  round: number;
  table: number;
  player1: BracketPlayer | null;
  player2: BracketPlayer | null;
  winner?: string | null; // player id
  score?: {
    player1: number;
    player2: number;
  };
}

export interface TournamentBracketProps {
  matches: BracketMatch[];
  totalRounds: number;
  onMatchUpdate?: (matchId: string, winnerId: string) => void;
  readonly?: boolean;
}

export function TournamentBracket({
  matches,
  totalRounds,
  onMatchUpdate,
  readonly = false
}: TournamentBracketProps) {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  // Organize matches by round
  const matchesByRound: Record<number, BracketMatch[]> = {};
  for (let i = 1; i <= totalRounds; i++) {
    matchesByRound[i] = matches.filter(m => m.round === i);
  }

  const handlePlayerClick = (matchId: string, playerId: string) => {
    if (readonly || !onMatchUpdate) return;
    onMatchUpdate(matchId, playerId);
    setSelectedMatch(null);
  };

  const getRoundName = (round: number) => {
    const remaining = totalRounds - round + 1;
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semifinal';
    if (round === totalRounds - 2) return 'Çeyrek Final';
    return `Round ${round}`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex gap-8 p-6 min-w-full">
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map(round => (
          <div key={round} className="flex flex-col gap-4 min-w-[300px]">
            {/* Round Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-poker-gold/20 px-4 py-2 rounded-lg border border-poker-gold/30">
                <Trophy className="w-5 h-5 text-poker-gold" />
                <h3 className="text-lg font-bold text-poker-gold">
                  {getRoundName(round)}
                </h3>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {matchesByRound[round]?.length || 0} Maç
              </div>
            </div>

            {/* Matches */}
            <div
              className="flex flex-col gap-4"
              style={{
                marginTop: round > 1 ? `${Math.pow(2, round - 2) * 60}px` : '0'
              }}
            >
              {matchesByRound[round]?.map(match => (
                <div
                  key={match.id}
                  className={`bg-black/40 backdrop-blur-sm rounded-xl border-2 transition-all ${
                    selectedMatch === match.id
                      ? 'border-poker-gold ring-2 ring-poker-gold/50'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{
                    marginBottom: round > 1 ? `${Math.pow(2, round - 1) * 30}px` : '0'
                  }}
                  onClick={() => !readonly && setSelectedMatch(match.id)}
                >
                  {/* Table Number */}
                  <div className="flex items-center justify-center bg-white/5 px-3 py-1 border-b border-white/10">
                    <span className="text-xs font-semibold text-gray-400">
                      Masa {match.table}
                    </span>
                  </div>

                  {/* Player 1 */}
                  <div
                    className={`flex items-center justify-between p-4 cursor-pointer transition ${
                      match.winner === match.player1?.id
                        ? 'bg-poker-green/20 border-b-2 border-poker-green'
                        : match.winner && match.winner !== match.player1?.id
                        ? 'opacity-50'
                        : 'hover:bg-white/5'
                    } border-b border-white/10`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (match.player1) handlePlayerClick(match.id, match.player1.id);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {match.player1?.seed && (
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                          {match.player1.seed}
                        </div>
                      )}
                      <div>
                        <div className={`font-medium ${
                          match.winner === match.player1?.id ? 'text-poker-gold' : 'text-white'
                        }`}>
                          {match.player1?.name || 'BYE'}
                        </div>
                        {match.player1?.rating && (
                          <div className="text-xs text-gray-400">
                            Rating: {match.player1.rating}
                          </div>
                        )}
                      </div>
                    </div>
                    {match.winner === match.player1?.id && (
                      <Trophy className="w-5 h-5 text-poker-gold" />
                    )}
                    {match.score && (
                      <div className="text-xl font-bold text-poker-gold ml-3">
                        {match.score.player1}
                      </div>
                    )}
                  </div>

                  {/* VS Divider */}
                  <div className="flex items-center justify-center py-1 bg-white/5">
                    <span className="text-xs font-bold text-gray-500">VS</span>
                  </div>

                  {/* Player 2 */}
                  <div
                    className={`flex items-center justify-between p-4 cursor-pointer transition ${
                      match.winner === match.player2?.id
                        ? 'bg-poker-green/20 border-t-2 border-poker-green'
                        : match.winner && match.winner !== match.player2?.id
                        ? 'opacity-50'
                        : 'hover:bg-white/5'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (match.player2) handlePlayerClick(match.id, match.player2.id);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {match.player2?.seed && (
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                          {match.player2.seed}
                        </div>
                      )}
                      <div>
                        <div className={`font-medium ${
                          match.winner === match.player2?.id ? 'text-poker-gold' : 'text-white'
                        }`}>
                          {match.player2?.name || 'BYE'}
                        </div>
                        {match.player2?.rating && (
                          <div className="text-xs text-gray-400">
                            Rating: {match.player2.rating}
                          </div>
                        )}
                      </div>
                    </div>
                    {match.winner === match.player2?.id && (
                      <Trophy className="w-5 h-5 text-poker-gold" />
                    )}
                    {match.score && (
                      <div className="text-xl font-bold text-poker-gold ml-3">
                        {match.score.player2}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-8 p-4 bg-black/40 rounded-lg border border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-poker-green/20 border-2 border-poker-green rounded"></div>
          <span className="text-sm text-gray-300">Kazanan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/10 border-2 border-white/30 rounded"></div>
          <span className="text-sm text-gray-300">Beklemede</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/10 border-2 border-white/10 rounded opacity-50"></div>
          <span className="text-sm text-gray-300">Elenen</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Swiss System Pairing Display
 * Swiss formatı için daha basit, liste tabanlı görünüm
 */
export interface SwissPairingProps {
  round: number;
  pairings: {
    table: number;
    player1: BracketPlayer;
    player2: BracketPlayer | null;
    result?: 'player1' | 'player2' | 'draw' | null;
  }[];
  onResultUpdate?: (table: number, result: 'player1' | 'player2' | 'draw') => void;
  readonly?: boolean;
}

export function SwissPairing({
  round,
  pairings,
  onResultUpdate,
  readonly = false
}: SwissPairingProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-poker-gold/20 rounded-lg">
            <Users className="w-6 h-6 text-poker-gold" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Round {round}</h3>
            <p className="text-sm text-gray-400">{pairings.length} eşleştirme</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-poker-green/20 rounded-lg text-poker-green text-sm font-semibold">
            {pairings.filter(p => p.result === 'player1' || p.result === 'player2').length} Tamamlandı
          </div>
          <div className="px-3 py-1 bg-gray-700/20 rounded-lg text-gray-400 text-sm font-semibold">
            {pairings.filter(p => !p.result).length} Devam Ediyor
          </div>
        </div>
      </div>

      {/* Pairings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pairings.map(pairing => (
          <div
            key={pairing.table}
            className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
          >
            {/* Table Header */}
            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-300">
                Masa {pairing.table}
              </span>
              {pairing.result && (
                <span className="text-xs px-2 py-1 bg-poker-green/20 text-poker-green rounded">
                  Bitti
                </span>
              )}
            </div>

            {/* Players */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex-1 ${
                  pairing.result === 'player1' ? 'text-poker-gold font-bold' : 'text-white'
                }`}>
                  {pairing.player1.name}
                  {pairing.player1.rating && (
                    <span className="text-xs text-gray-400 ml-2">({pairing.player1.rating})</span>
                  )}
                </div>
                {pairing.result === 'player1' && (
                  <Trophy className="w-4 h-4 text-poker-gold ml-2" />
                )}
              </div>

              <div className="flex items-center justify-center py-2">
                <span className="text-xs font-bold text-gray-500">VS</span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className={`flex-1 ${
                  pairing.result === 'player2' ? 'text-poker-gold font-bold' : 'text-white'
                }`}>
                  {pairing.player2?.name || 'BYE'}
                  {pairing.player2?.rating && (
                    <span className="text-xs text-gray-400 ml-2">({pairing.player2.rating})</span>
                  )}
                </div>
                {pairing.result === 'player2' && (
                  <Trophy className="w-4 h-4 text-poker-gold ml-2" />
                )}
              </div>

              {/* Result Buttons */}
              {!readonly && !pairing.result && pairing.player2 && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => onResultUpdate?.(pairing.table, 'player1')}
                    className="flex-1 px-3 py-2 bg-poker-green hover:bg-green-700 text-white text-sm rounded-lg transition"
                  >
                    {pairing.player1.name} Kazandı
                  </button>
                  <button
                    onClick={() => onResultUpdate?.(pairing.table, 'draw')}
                    className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition"
                  >
                    Berabere
                  </button>
                  <button
                    onClick={() => onResultUpdate?.(pairing.table, 'player2')}
                    className="flex-1 px-3 py-2 bg-poker-green hover:bg-green-700 text-white text-sm rounded-lg transition"
                  >
                    {pairing.player2.name} Kazandı
                  </button>
                </div>
              )}

              {pairing.result === 'draw' && (
                <div className="mt-4 text-center text-sm text-yellow-400">
                  Berabere
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
