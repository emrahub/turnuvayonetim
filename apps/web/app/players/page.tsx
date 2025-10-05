'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Search, Filter, UserPlus, Download } from 'lucide-react';
import { useTournamentStore } from '../../stores/tournamentStore';
import PlayerManagement from '../../components/PlayerManagement';

export default function PlayersPage() {
  const router = useRouter();
  const { tournament, players } = useTournamentStore();
  const [showAddModal, setShowAddModal] = useState(false);

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
                <Users className="icon-lg text-success-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Oyuncu Yönetimi</h1>
                <p className="text-sm text-gray-400">Kayıt, chip yönetimi ve eliminasyonlar</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="icon-sm" />
              <span>Yeni Oyuncu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-3xl font-bold text-white mb-1">{players.length}</div>
            <div className="text-sm text-gray-400">Toplam Oyuncu</div>
          </div>

          <div className="card p-6">
            <div className="text-3xl font-bold text-success-500 mb-1">
              {players.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-gray-400">Aktif Oyuncu</div>
          </div>

          <div className="card p-6">
            <div className="text-3xl font-bold text-red-500 mb-1">
              {players.filter(p => p.status === 'eliminated').length}
            </div>
            <div className="text-sm text-gray-400">Elenen Oyuncu</div>
          </div>

          <div className="card p-6">
            <div className="text-3xl font-bold text-brand-400 mb-1">
              {players.reduce((sum, p) => sum + p.chipCount, 0).toLocaleString('tr-TR')}
            </div>
            <div className="text-sm text-gray-400">Toplam Chips</div>
          </div>
        </div>

        {/* Player Management Component */}
        <div className="card p-6">
          <PlayerManagement
            tournamentId={tournament?.id || 'default'}
            onPlayerCountChange={() => {}}
            showAddModal={showAddModal}
            onCloseModal={() => setShowAddModal(false)}
          />
        </div>
      </div>
    </div>
  );
}
