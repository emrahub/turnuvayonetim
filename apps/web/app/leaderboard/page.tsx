'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, TrendingUp, Trophy, Target, Star, Medal, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useTournamentStore } from '../../stores/tournamentStore';
import { exportLeaderboard } from '../../lib/export-utils';

interface PlayerStats {
  id: string;
  name: string;
  totalTournaments: number;
  wins: number;
  cashes: number;
  totalBuyins: number;
  totalWinnings: number;
  roi: number; // Return on Investment %
  avgFinish: number;
  bestFinish: number;
  points: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { players } = useTournamentStore();
  const [sortBy, setSortBy] = useState<'points' | 'winnings' | 'wins' | 'roi'>('points');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('all');

  // Mock player statistics - gerçek backend'den gelecek
  const playerStats: PlayerStats[] = useMemo(() => {
    return players.map((p, i) => ({
      id: p.id,
      name: p.name,
      totalTournaments: Math.floor(Math.random() * 50) + 10,
      wins: Math.floor(Math.random() * 10),
      cashes: Math.floor(Math.random() * 20) + 5,
      totalBuyins: Math.floor(Math.random() * 50000) + 10000,
      totalWinnings: Math.floor(Math.random() * 100000) + 20000,
      roi: (Math.random() * 100) - 20, // -20% to +80%
      avgFinish: Math.floor(Math.random() * 50) + 1,
      bestFinish: Math.floor(Math.random() * 5) + 1,
      points: Math.floor(Math.random() * 1000) + 500
    }));
  }, [players]);

  const sortedPlayers = useMemo(() => {
    return [...playerStats].sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.points - a.points;
        case 'winnings':
          return b.totalWinnings - a.totalWinnings;
        case 'wins':
          return b.wins - a.wins;
        case 'roi':
          return b.roi - a.roi;
        default:
          return b.points - a.points;
      }
    });
  }, [playerStats, sortBy]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: 'text-brand-400 bg-brand-400/20', label: '🥇 1st' };
    if (rank === 2) return { icon: Medal, color: 'text-slate-400 bg-slate-400/20', label: '🥈 2nd' };
    if (rank === 3) return { icon: Medal, color: 'text-warning-600 bg-warning-600/20', label: '🥉 3rd' };
    return { icon: Star, color: 'text-slate-600 bg-slate-600/20', label: `#${rank}` };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-smooth"
            >
              <ArrowLeft className="icon-md" />
              <span>Geri Dön</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-400/20 rounded-lg">
                <Award className="icon-lg text-brand-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
                <p className="text-sm text-slate-400">Oyuncu Sıralaması ve İstatistikleri</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Export Dropdown */}
              <div className="relative group">
                <button className="btn-secondary">
                  <Download className="icon-sm" />
                  <span>Export</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button
                    onClick={() => exportLeaderboard(sortedPlayers, 'excel', sortBy, timeRange)}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2 rounded-t-lg transition-smooth"
                  >
                    <FileSpreadsheet className="icon-sm text-success-400" />
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => exportLeaderboard(sortedPlayers, 'pdf', sortBy, timeRange)}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2 transition-smooth"
                  >
                    <FileText className="icon-sm text-error-400" />
                    PDF
                  </button>
                  <button
                    onClick={() => exportLeaderboard(sortedPlayers, 'csv', sortBy, timeRange)}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2 rounded-b-lg transition-smooth"
                  >
                    <FileText className="icon-sm text-brand-400" />
                    CSV
                  </button>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="flex gap-2">
                {(['week', 'month', 'year', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                      timeRange === range
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }`}
                  >
                    {range === 'week' ? 'Hafta' : range === 'month' ? 'Ay' : range === 'year' ? 'Yıl' : 'Tümü'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
          {/* 2nd Place */}
          <div className="flex flex-col items-center pt-12 animate-scale-in animation-delay-100">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-3 border-4 border-slate-400">
              <span className="text-3xl">🥈</span>
            </div>
            <div className="text-center card backdrop-blur-sm p-4 w-full border-slate-400/30">
              <div className="text-xl font-bold text-white mb-1">
                {sortedPlayers[1]?.name || 'N/A'}
              </div>
              <div className="text-sm text-slate-400 mb-2">2. Sıra</div>
              <div className="text-2xl font-bold text-slate-300">
                {sortedPlayers[1]?.points.toLocaleString('tr-TR')} pts
              </div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center animate-scale-in">
            <div className="w-32 h-32 rounded-full bg-brand-600 flex items-center justify-center mb-3 border-4 border-brand-400">
              <Trophy className="icon-2xl text-white" />
            </div>
            <div className="text-center card backdrop-blur-sm p-6 w-full border-2 border-brand-400">
              <div className="text-2xl font-bold text-brand-400 mb-1">
                {sortedPlayers[0]?.name || 'N/A'}
              </div>
              <div className="text-sm text-slate-400 mb-2">🏆 Şampiyon</div>
              <div className="text-3xl font-bold text-white">
                {sortedPlayers[0]?.points.toLocaleString('tr-TR')} pts
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center pt-12 animate-scale-in animation-delay-200">
            <div className="w-24 h-24 rounded-full bg-warning-700 flex items-center justify-center mb-3 border-4 border-warning-500">
              <span className="text-3xl">🥉</span>
            </div>
            <div className="text-center card backdrop-blur-sm p-4 w-full border-warning-500/30">
              <div className="text-xl font-bold text-white mb-1">
                {sortedPlayers[2]?.name || 'N/A'}
              </div>
              <div className="text-sm text-slate-400 mb-2">3. Sıra</div>
              <div className="text-2xl font-bold text-warning-400">
                {sortedPlayers[2]?.points.toLocaleString('tr-TR')} pts
              </div>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex justify-center gap-3 mb-6">
          {([
            { key: 'points' as const, label: 'Puan', icon: Star },
            { key: 'winnings' as const, label: 'Kazanç', icon: TrendingUp },
            { key: 'wins' as const, label: 'Galibiyet', icon: Trophy },
            { key: 'roi' as const, label: 'ROI', icon: Target }
          ]).map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-smooth ${
                sortBy === option.key
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
            >
              <option.icon className="icon-md" />
              {option.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="card overflow-hidden">
          {/* Table Header */}
          <div className="bg-white/5 px-6 py-4 border-b border-white/10">
            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-slate-400">
              <div className="col-span-1">Sıra</div>
              <div className="col-span-3">Oyuncu</div>
              <div className="col-span-2 text-right">Turnuva</div>
              <div className="col-span-1 text-right">Gal.</div>
              <div className="col-span-2 text-right">Kazanç</div>
              <div className="col-span-1 text-right">ROI</div>
              <div className="col-span-2 text-right">Puan</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/10">
            {sortedPlayers.map((player, index) => {
              const rank = index + 1;
              const badge = getRankBadge(rank);

              return (
                <div
                  key={player.id}
                  className={`px-6 py-4 hover:bg-slate-800/30 transition-smooth ${
                    rank <= 3 ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Rank */}
                    <div className="col-span-1">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${badge.color}`}>
                        {rank <= 3 ? (
                          <span className="text-lg">{badge.label.split(' ')[0]}</span>
                        ) : (
                          <span className="text-sm font-bold">{rank}</span>
                        )}
                      </div>
                    </div>

                    {/* Player Name */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-success-600 flex items-center justify-center text-white font-bold">
                          {player.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-white">{player.name}</div>
                          <div className="text-xs text-slate-400">
                            En İyi: {player.bestFinish}. sıra
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tournaments */}
                    <div className="col-span-2 text-right">
                      <div className="text-white font-medium">{player.totalTournaments}</div>
                      <div className="text-xs text-slate-400">{player.cashes} cash</div>
                    </div>

                    {/* Wins */}
                    <div className="col-span-1 text-right">
                      <div className="text-brand-400 font-bold text-lg">{player.wins}</div>
                    </div>

                    {/* Winnings */}
                    <div className="col-span-2 text-right">
                      <div className="text-white font-medium">
                        {player.totalWinnings.toLocaleString('tr-TR')} ₺
                      </div>
                      <div className="text-xs text-slate-400">
                        Avg: {Math.round(player.totalWinnings / player.totalTournaments).toLocaleString('tr-TR')} ₺
                      </div>
                    </div>

                    {/* ROI */}
                    <div className="col-span-1 text-right">
                      <div className={`font-bold ${
                        player.roi > 0 ? 'text-success-500' : 'text-error-500'
                      }`}>
                        {player.roi > 0 ? '+' : ''}{player.roi.toFixed(1)}%
                      </div>
                    </div>

                    {/* Points */}
                    <div className="col-span-2 text-right">
                      <div className="text-xl font-bold text-brand-400">
                        {player.points.toLocaleString('tr-TR')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 card-glass p-4">
          <div className="flex items-center justify-center gap-8 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Trophy className="icon-sm text-brand-400" />
              <span>Gal.: Galibiyetler</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="icon-sm text-success-500" />
              <span>ROI: Return on Investment</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="icon-sm text-brand-400" />
              <span>Puan: Turnuva Puanları</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
