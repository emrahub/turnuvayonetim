'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Shuffle, Trophy, Award } from 'lucide-react';
import { TournamentBracket, SwissPairing, type BracketMatch, type BracketPlayer } from '../../components/TournamentBracket';
import { useTournamentStore } from '../../stores/tournamentStore';

type PairingFormat = 'swiss' | 'single-elimination' | 'round-robin';

export default function PairingsPage() {
  const router = useRouter();
  const { players } = useTournamentStore();
  const [format, setFormat] = useState<PairingFormat>('swiss');
  const [currentRound, setCurrentRound] = useState(1);

  // Mock data - gerçek backend entegrasyonu için hazır
  const bracketPlayers: BracketPlayer[] = useMemo(() =>
    players.slice(0, 8).map((p, i) => ({
      id: p.id,
      name: p.name,
      rating: 1500 + Math.random() * 500,
      seed: i + 1
    })),
    [players]
  );

  // Single Elimination Bracket
  const eliminationMatches: BracketMatch[] = useMemo(() => {
    const matches: BracketMatch[] = [];

    // Round 1 (Quarterfinals)
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: `r1-${i}`,
        round: 1,
        table: i + 1,
        player1: bracketPlayers[i * 2] || null,
        player2: bracketPlayers[i * 2 + 1] || null,
        winner: i === 0 ? bracketPlayers[0]?.id : undefined
      });
    }

    // Round 2 (Semifinals)
    matches.push({
      id: 'r2-0',
      round: 2,
      table: 1,
      player1: bracketPlayers[0],
      player2: null, // Kazanan gelecek
      winner: undefined
    });

    matches.push({
      id: 'r2-1',
      round: 2,
      table: 2,
      player1: null,
      player2: null,
      winner: undefined
    });

    // Round 3 (Final)
    matches.push({
      id: 'r3-0',
      round: 3,
      table: 1,
      player1: null,
      player2: null,
      winner: undefined
    });

    return matches;
  }, [bracketPlayers]);

  // Swiss Pairings
  const swissPairings = useMemo(() => {
    const pairings = [];
    for (let i = 0; i < Math.floor(bracketPlayers.length / 2); i++) {
      pairings.push({
        table: i + 1,
        player1: bracketPlayers[i * 2],
        player2: bracketPlayers[i * 2 + 1] || null,
        result: i === 0 ? ('player1' as const) : undefined
      });
    }
    return pairings;
  }, [bracketPlayers]);

  const handleMatchUpdate = (matchId: string, winnerId: string) => {
    console.log('Match updated:', matchId, winnerId);
    // Backend'e gönderilecek
  };

  const handleSwissResult = (table: number, result: 'player1' | 'player2' | 'draw') => {
    console.log('Swiss result:', table, result);
    // Backend'e gönderilecek
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="glass border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="btn-ghost btn-sm"
            >
              <ArrowLeft className="icon-md" />
              <span>Geri Dön</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-500/20 rounded-lg transition-all duration-200 hover:bg-brand-500/30">
                <Shuffle className="icon-lg text-brand-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Tournament Pairings</h1>
                <p className="text-sm text-slate-400">Eşleştirme ve Sonuç Takibi</p>
              </div>
            </div>

            {/* Format Selector */}
            <div className="flex gap-2">
              {(['swiss', 'single-elimination', 'round-robin'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                    format === f
                      ? 'btn-primary'
                      : 'btn-ghost'
                  }`}
                >
                  {f === 'swiss' ? 'Swiss' : f === 'single-elimination' ? 'Eleme' : 'Round-Robin'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <Users className="icon-lg text-brand-400" />
              <span className="text-sm text-slate-400">Toplam Oyuncu</span>
            </div>
            <div className="text-3xl font-bold text-white">{bracketPlayers.length}</div>
          </div>

          <div className="card p-6 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="icon-lg text-success-400" />
              <span className="text-sm text-slate-400">Aktif Round</span>
            </div>
            <div className="text-3xl font-bold text-white">{currentRound}</div>
          </div>

          <div className="card p-6 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <Shuffle className="icon-lg text-brand-400" />
              <span className="text-sm text-slate-400">Format</span>
            </div>
            <div className="text-xl font-bold text-white capitalize">
              {format === 'swiss' ? 'Swiss System' : format === 'single-elimination' ? 'Eleme Usulü' : 'Round-Robin'}
            </div>
          </div>

          <div className="card p-6 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <Award className="icon-lg text-warning-400" />
              <span className="text-sm text-slate-400">Tamamlanan</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {format === 'swiss'
                ? swissPairings.filter(p => p.result).length
                : eliminationMatches.filter(m => m.winner).length
              }
            </div>
          </div>
        </div>

        {/* Pairing Display */}
        {format === 'single-elimination' ? (
          <div className="card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Eleme Usulü Bracket</h2>
              <p className="text-slate-400">
                Tek eleme formatı - Kaybeden oyuncu turnuvadan elenir
              </p>
            </div>
            <TournamentBracket
              matches={eliminationMatches}
              totalRounds={3}
              onMatchUpdate={handleMatchUpdate}
            />
          </div>
        ) : format === 'swiss' ? (
          <div className="card p-6">
            <SwissPairing
              round={currentRound}
              pairings={swissPairings}
              onResultUpdate={handleSwissResult}
            />

            {/* Round Controls */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentRound(Math.max(1, currentRound - 1))}
                disabled={currentRound === 1}
                className="btn-secondary"
              >
                ← Önceki Round
              </button>
              <button
                onClick={() => setCurrentRound(currentRound + 1)}
                className="btn-primary"
              >
                Sonraki Round →
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-2xl font-bold text-white mb-3">Round-Robin</h3>
            <p className="text-slate-400 mb-6">
              Her oyuncu herkesle bir kez eşleşir. Toplam {bracketPlayers.length - 1} round.
            </p>
            <p className="text-sm text-slate-500">
              Yakında eklenecek...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
