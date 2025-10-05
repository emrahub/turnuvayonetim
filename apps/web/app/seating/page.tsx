'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { SeatingChart } from '../../components/SeatingChart';
import { useTournamentStore } from '../../stores/tournamentStore';
import { SeatingAction } from '../../types/seating';

// Demo data for testing
const DEMO_PLAYERS = [
  { name: 'Alice Johnson', email: 'alice@example.com', phoneNumber: '+1234567890', buyInAmount: 100, chipCount: 12500, status: 'active' as const },
  { name: 'Bob Smith', email: 'bob@example.com', phoneNumber: '+1234567891', buyInAmount: 100, chipCount: 8750, status: 'active' as const },
  { name: 'Charlie Brown', email: 'charlie@example.com', phoneNumber: '+1234567892', buyInAmount: 100, chipCount: 15200, status: 'active' as const },
  { name: 'Diana Prince', email: 'diana@example.com', phoneNumber: '+1234567893', buyInAmount: 100, chipCount: 6800, status: 'active' as const },
  { name: 'Edward Cullen', email: 'edward@example.com', phoneNumber: '+1234567894', buyInAmount: 100, chipCount: 9300, status: 'active' as const },
  { name: 'Fiona Green', email: 'fiona@example.com', phoneNumber: '+1234567895', buyInAmount: 100, chipCount: 11100, status: 'active' as const },
  { name: 'George Wilson', email: 'george@example.com', phoneNumber: '+1234567896', buyInAmount: 100, chipCount: 7600, status: 'active' as const },
  { name: 'Helen Troy', email: 'helen@example.com', phoneNumber: '+1234567897', buyInAmount: 100, chipCount: 13400, status: 'active' as const },
  { name: 'Ivan Petrov', email: 'ivan@example.com', phoneNumber: '+1234567898', buyInAmount: 100, chipCount: 5900, status: 'active' as const },
  { name: 'Julia Roberts', email: 'julia@example.com', phoneNumber: '+1234567899', buyInAmount: 100, chipCount: 16800, status: 'active' as const },
  { name: 'Kevin Hart', email: 'kevin@example.com', phoneNumber: '+1234567800', buyInAmount: 100, chipCount: 10200, status: 'active' as const },
  { name: 'Luna Park', email: 'luna@example.com', phoneNumber: '+1234567801', buyInAmount: 100, chipCount: 8900, status: 'active' as const },
  { name: 'Mike Tyson', email: 'mike@example.com', phoneNumber: '+1234567802', buyInAmount: 100, chipCount: 14700, status: 'active' as const },
  { name: 'Nina Simone', email: 'nina@example.com', phoneNumber: '+1234567803', buyInAmount: 100, chipCount: 7200, status: 'active' as const },
  { name: 'Oscar Wilde', email: 'oscar@example.com', phoneNumber: '+1234567804', buyInAmount: 100, chipCount: 12800, status: 'active' as const },
  { name: 'Paula Abdul', email: 'paula@example.com', phoneNumber: '+1234567805', buyInAmount: 100, chipCount: 9600, status: 'active' as const },
  { name: 'Quinn Fabray', email: 'quinn@example.com', phoneNumber: '+1234567806', buyInAmount: 100, chipCount: 11900, status: 'active' as const },
  { name: 'Ryan Reynolds', email: 'ryan@example.com', phoneNumber: '+1234567807', buyInAmount: 100, chipCount: 6400, status: 'active' as const }
];

export default function SeatingPage() {
  const {
    tournament,
    players,
    createTournament,
    addPlayer,
    setActiveView,
    initializeSocket
  } = useTournamentStore();

  useEffect(() => {
    // Initialize demo tournament and players
    if (!tournament) {
      createTournament({
        name: 'Turnuva Masa Düzeni',
        buyIn: 100,
        maxPlayers: 50,
        startTime: new Date()
      });
    }

    // Add demo players if none exist
    if (players.length === 0) {
      DEMO_PLAYERS.forEach(playerData => {
        addPlayer({
          ...playerData
        });
      });
    }

    // Initialize WebSocket for real-time updates (optional)
    // initializeSocket();

    // Set active view to seating
    setActiveView('seating');
  }, [tournament, players.length, createTournament, addPlayer, setActiveView]);

  const handlePlayerMove = (action: SeatingAction) => {
    console.log('Player move action:', action);
    // You can add custom logic here for handling player movements
  };

  const handleTableStatusChange = (table: any) => {
    console.log('Table status changed:', table);
    // You can add custom logic here for handling table status changes
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-poker-green to-poker-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-poker-gold mb-4">
            Turnuva Yükleniyor...
          </div>
          <div className="text-gray-400">
            Masa düzeni hazırlanıyor
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-green to-poker-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold text-poker-gold mb-2">
              Masa Düzeni
            </h1>
            <p className="text-gray-300 text-lg">
              Interaktif turnuva masa yönetimi ve oyuncu yerleşimi
            </p>
          </div>

          {/* Demo Info */}
          <div className="mt-6 bg-black/40 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-poker-gold">{tournament.name}</div>
                <div className="text-gray-400 text-sm">Turnuva</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{players.length}</div>
                <div className="text-gray-400 text-sm">Toplam Oyuncu</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {players.filter(p => p.status === 'active').length}
                </div>
                <div className="text-gray-400 text-sm">Aktif Oyuncu</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-poker-gold">
                  ${tournament.prizePool.toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm">Ödül Havuzu</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Demo Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 bg-blue-500/20 border border-blue-500/50 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-blue-400 mb-3">Özellikler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200">
            <div>
              <h3 className="font-medium mb-2">Drag & Drop:</h3>
              <ul className="space-y-1 text-blue-300">
                <li>• Oyuncuları sürükleyip masalara oturtun</li>
                <li>• Koltuklar arası oyuncu taşıma</li>
                <li>• Görsel geri bildirim ve doğrulama</li>
                <li>• Gerçek zamanlı masa dengesi</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Yönetim Araçları:</h3>
              <ul className="space-y-1 text-blue-300">
                <li>• Otomatik masa dengeleme</li>
                <li>• Yeni masa oluşturma/kırma</li>
                <li>• Koltuk algoritmaları ve kuralları</li>
                <li>• Export ve yazdırma desteği</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Seating Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SeatingChart
            tournamentId={tournament.id}
            onPlayerMove={handlePlayerMove}
            onTableStatusChange={handleTableStatusChange}
            showControls={true}
            readOnly={false}
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-gray-400"
        >
          <p>
            TURNUVAYONETIM profesyonel masa düzeni sistemi.
            Gerçek turnuvalarda backend ile senkronize çalışır.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
