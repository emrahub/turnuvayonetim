'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Users, Trophy } from 'lucide-react';
import { ICMCalculator } from '../../components/ICMCalculator';
import { useTournamentStore } from '../../stores/tournamentStore';

export default function ICMPage() {
  const router = useRouter();
  const { tournament, players } = useTournamentStore();
  const [prizePool, setPrizePool] = useState(tournament?.prizePool || 100000);

  const activePlayers = players.filter(p => p.status === 'active').map(p => ({
    id: p.id,
    name: p.name,
    chips: p.chipCount
  }));

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="glass border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="icon-md" />
              <span>Geri Dön</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-500/20 rounded-lg">
                <DollarSign className="icon-lg text-brand-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ICM Calculator</h1>
                <p className="text-sm text-slate-400">Independent Chip Model Hesaplayıcı</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-slate-400">Aktif Oyuncular</div>
                <div className="text-xl font-bold text-brand-400">{activePlayers.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ICM Calculator */}
          <div className="lg:col-span-3">
            {activePlayers.length >= 2 ? (
              <ICMCalculator
                players={activePlayers}
                prizePool={prizePool}
                onDealProposal={(results) => {
                  console.log('ICM Deal Proposal:', results);
                  alert(`ICM Anlaşması Önerisi\n\n${results.map((r, i) =>
                    `${i + 1}. ${r.playerName}: ${new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    }).format(r.equity)}`
                  ).join('\n')}`);
                }}
              />
            ) : (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Yetersiz Oyuncu Sayısı
                </h3>
                <p className="text-slate-400 mb-6">
                  ICM hesaplamaları için en az 2 aktif oyuncu gereklidir.
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="btn-primary"
                >
                  Ana Sayfaya Dön
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            {/* Prize Pool */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="icon-md text-brand-400" />
                Ödül Havuzu
              </h3>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Toplam Ödül (TRY)</label>
                <input
                  type="number"
                  value={prizePool}
                  onChange={(e) => setPrizePool(Number(e.target.value))}
                  className="input"
                  min="0"
                  step="1000"
                />
              </div>
              <div className="text-3xl font-bold text-brand-400">
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                  minimumFractionDigits: 0
                }).format(prizePool)}
              </div>
            </div>

            {/* Player Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="icon-md text-brand-400" />
                Oyuncu İstatistikleri
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Aktif Oyuncular</span>
                  <span className="text-xl font-bold text-brand-400">{activePlayers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Toplam Chips</span>
                  <span className="text-xl">
                    {new Intl.NumberFormat('tr-TR').format(
                      activePlayers.reduce((sum, p) => sum + p.chips, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ortalama Stack</span>
                  <span className="text-xl">
                    {activePlayers.length > 0 ? new Intl.NumberFormat('tr-TR').format(
                      Math.round(activePlayers.reduce((sum, p) => sum + p.chips, 0) / activePlayers.length)
                    ) : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="card p-6 border-brand-500/30">
              <h4 className="text-sm font-semibold text-brand-400 mb-2">
                ICM Hakkında
              </h4>
              <p className="text-xs text-slate-300">
                Independent Chip Model (ICM), turnuva chiplerinin gerçek para değerini hesaplayan matematiksel bir modeldir.
                Anlaşma yaparken adil dağılım için kullanılır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
