'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Users, Trophy, Clock, TrendingUp, DollarSign, Target, Award, Calendar, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTournamentStore } from '../../stores/tournamentStore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { exportAnalyticsReport } from '../../lib/export-utils';

export default function DashboardPage() {
  const router = useRouter();
  const { tournament, players } = useTournamentStore();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');

  // Mock data - gerçek veritabanı entegrasyonu için hazır
  const tournamentHistory = useMemo(() => [
    { date: '2025-10-01', tournaments: 5, players: 45, prizePool: 50000 },
    { date: '2025-10-02', tournaments: 8, players: 72, prizePool: 80000 },
    { date: '2025-10-03', tournaments: 6, players: 54, prizePool: 60000 },
    { date: '2025-10-04', tournaments: 10, players: 95, prizePool: 105000 },
    { date: '2025-10-05', tournaments: 7, players: 63, prizePool: 70000 },
  ], []);

  const playerStats = useMemo(() => {
    const activePlayers = players.filter(p => p.status === 'active');
    const eliminatedPlayers = players.filter(p => p.status === 'eliminated');

    return [
      { name: 'Aktif', value: activePlayers.length, color: '#0D7938' },
      { name: 'Elenen', value: eliminatedPlayers.length, color: '#C53030' },
      { name: 'Beklemede', value: players.filter(p => p.status === 'waiting').length, color: '#FFD700' },
    ];
  }, [players]);

  const topPlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => b.chipCount - a.chipCount)
      .slice(0, 10)
      .map((p, i) => ({
        rank: i + 1,
        name: p.name,
        chips: p.chipCount,
        status: p.status
      }));
  }, [players]);

  const totalChips = useMemo(() =>
    players.reduce((sum, p) => sum + p.chipCount, 0),
    [players]
  );

  const averageStack = useMemo(() =>
    players.length > 0 ? Math.round(totalChips / players.length) : 0,
    [totalChips, players.length]
  );

  const stats = [
    {
      icon: Trophy,
      label: 'Toplam Turnuva',
      value: tournamentHistory.reduce((sum, t) => sum + t.tournaments, 0),
      change: '+12%',
      accentColor: 'text-brand-400'
    },
    {
      icon: Users,
      label: 'Toplam Oyuncu',
      value: players.length,
      change: `${players.filter(p => p.status === 'active').length} aktif`,
      accentColor: 'text-success-500'
    },
    {
      icon: DollarSign,
      label: 'Toplam Ödül Havuzu',
      value: `${(tournamentHistory.reduce((sum, t) => sum + t.prizePool, 0) / 1000).toFixed(0)}K`,
      change: '+8%',
      accentColor: 'text-blue-400'
    },
    {
      icon: Target,
      label: 'Ortalama Stack',
      value: averageStack.toLocaleString('tr-TR'),
      change: `${totalChips.toLocaleString('tr-TR')} toplam`,
      accentColor: 'text-purple-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      {/* Header */}
      <div className="card border-b border-white/10 rounded-none">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="icon-md" />
              <span>Geri Dön</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800/60 rounded-lg">
                <BarChart3 className="icon-lg text-success-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-sm text-gray-400">Turnuva İstatistikleri ve Analizler</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Export Dropdown */}
              <div className="relative group">
                <button className="btn-secondary flex items-center gap-2">
                  <Download className="icon-sm" />
                  <span>Export</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button
                    onClick={() => exportAnalyticsReport({ tournamentHistory, playerStats: [], topPlayers, timeRange }, 'excel')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2 rounded-t-lg"
                  >
                    <FileSpreadsheet className="icon-sm text-green-400" />
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => exportAnalyticsReport({ tournamentHistory, playerStats: [], topPlayers, timeRange }, 'pdf')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <FileText className="icon-sm text-red-400" />
                    PDF
                  </button>
                  <button
                    onClick={() => exportAnalyticsReport({ tournamentHistory, playerStats: [], topPlayers, timeRange }, 'csv')}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2 rounded-b-lg"
                  >
                    <FileText className="icon-sm text-blue-400" />
                    CSV
                  </button>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="flex gap-2">
                {(['day', 'week', 'month', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={
                      timeRange === range
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }
                  >
                    {range === 'day' ? 'Gün' : range === 'week' ? 'Hafta' : range === 'month' ? 'Ay' : 'Tümü'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-slate-800/60 rounded-lg ${stat.accentColor}`}>
                  <stat.icon className="icon-lg" />
                </div>
                <span className="text-xs text-success-500 font-semibold">{stat.change}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Tournament Trend Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="icon-md text-success-500" />
              Turnuva Trendi
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tournamentHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  tick={{ fill: '#888' }}
                  tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: tr })}
                />
                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend wrapperStyle={{ color: '#888' }} />
                <Line
                  type="monotone"
                  dataKey="tournaments"
                  stroke="#0D7938"
                  strokeWidth={3}
                  name="Turnuvalar"
                  dot={{ fill: '#0D7938', r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="players"
                  stroke="#FFD700"
                  strokeWidth={3}
                  name="Oyuncular"
                  dot={{ fill: '#FFD700', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Player Status Pie Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="icon-md text-brand-400" />
              Oyuncu Durumu
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={playerStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {playerStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Prize Pool Bar Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="icon-md text-blue-400" />
              Ödül Havuzu Dağılımı
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tournamentHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  tick={{ fill: '#888' }}
                  tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: tr })}
                />
                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => `${(value / 1000).toFixed(0)}K TRY`}
                />
                <Bar
                  dataKey="prizePool"
                  fill="#3B82F6"
                  name="Ödül Havuzu"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Players Leaderboard */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="icon-md text-brand-400" />
              Top 10 Oyuncular
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {topPlayers.map((player) => (
                <div
                  key={player.rank}
                  className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-white/5 hover:border-brand-400/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      player.rank === 1 ? 'bg-brand-400 text-black' :
                      player.rank === 2 ? 'bg-gray-400 text-black' :
                      player.rank === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {player.rank}
                    </div>
                    <div>
                      <div className="text-white font-medium">{player.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{player.status}</div>
                    </div>
                  </div>
                  <div className="text-brand-400 font-bold">
                    {player.chips.toLocaleString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card p-6 border-brand-400/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="icon-md text-brand-400" />
            Hızlı İstatistikler
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-400 mb-1">
                {tournamentHistory[tournamentHistory.length - 1]?.tournaments || 0}
              </div>
              <div className="text-sm text-gray-300">Bugünkü Turnuvalar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-500 mb-1">
                {(tournamentHistory.reduce((sum, t) => sum + t.players, 0) / tournamentHistory.length).toFixed(0)}
              </div>
              <div className="text-sm text-gray-300">Ortalama Katılımcı</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {Math.max(...tournamentHistory.map(t => t.prizePool)).toLocaleString('tr-TR')}
              </div>
              <div className="text-sm text-gray-300">En Yüksek Ödül</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {players.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-gray-300">Aktif Oyuncu</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
