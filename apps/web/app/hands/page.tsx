'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, Filter, Search, Calendar, Users, Eye, Download } from 'lucide-react';
import { HandHistoryViewer, HandHistoryData } from '../../components/HandHistoryViewer';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function HandsPage() {
  const router = useRouter();
  const [selectedHand, setSelectedHand] = useState<HandHistoryData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTournament, setFilterTournament] = useState<string>('all');
  const [filterPlayer, setFilterPlayer] = useState<string>('all');

  // Mock hand history data - gerçek backend'den gelecek
  const mockHands: HandHistoryData[] = useMemo(() => [
    {
      id: 'hand-1',
      handNumber: 42,
      timestamp: new Date('2025-10-05T15:30:00'),
      players: [
        { id: 'p1', name: 'Alice', position: 0, chips: 15000, cards: ['As', 'Kh'] },
        { id: 'p2', name: 'Bob', position: 1, chips: 12000, cards: ['Qd', 'Jc'] },
        { id: 'p3', name: 'Charlie', position: 2, chips: 18000, cards: ['9s', '9h'] },
        { id: 'p4', name: 'David', position: 3, chips: 10000, cards: ['7d', '6d'] },
      ],
      actions: [
        { type: 'raise', playerId: 'p1', amount: 300, timestamp: new Date(), street: 'preflop' },
        { type: 'call', playerId: 'p2', amount: 300, timestamp: new Date(), street: 'preflop' },
        { type: 'call', playerId: 'p3', amount: 300, timestamp: new Date(), street: 'preflop' },
        { type: 'fold', playerId: 'p4', timestamp: new Date(), street: 'preflop' },
        { type: 'check', playerId: 'p1', timestamp: new Date(), street: 'flop' },
        { type: 'bet', playerId: 'p2', amount: 500, timestamp: new Date(), street: 'flop' },
        { type: 'raise', playerId: 'p3', amount: 1500, timestamp: new Date(), street: 'flop' },
        { type: 'fold', playerId: 'p1', timestamp: new Date(), street: 'flop' },
        { type: 'call', playerId: 'p2', amount: 1000, timestamp: new Date(), street: 'flop' },
        { type: 'bet', playerId: 'p3', amount: 2000, timestamp: new Date(), street: 'turn' },
        { type: 'fold', playerId: 'p2', timestamp: new Date(), street: 'turn' },
      ],
      board: ['Ah', '9c', '3d', '7h', '2s'],
      winners: [
        { playerId: 'p3', amount: 5100, handRank: 'Three of a Kind' }
      ],
      potSize: 5100,
      metadata: {
        dealerPosition: 2,
        smallBlindAmount: 50,
        bigBlindAmount: 100,
        anteAmount: 10
      }
    },
    {
      id: 'hand-2',
      handNumber: 43,
      timestamp: new Date('2025-10-05T15:35:00'),
      players: [
        { id: 'p1', name: 'Alice', position: 0, chips: 14700, cards: ['Kd', 'Kc'] },
        { id: 'p2', name: 'Bob', position: 1, chips: 10500, cards: ['Ad', 'Qh'] },
        { id: 'p3', name: 'Charlie', position: 2, chips: 23100, cards: ['Js', 'Ts'] },
      ],
      actions: [
        { type: 'raise', playerId: 'p1', amount: 400, timestamp: new Date(), street: 'preflop' },
        { type: 'call', playerId: 'p2', amount: 400, timestamp: new Date(), street: 'preflop' },
        { type: 'fold', playerId: 'p3', timestamp: new Date(), street: 'preflop' },
        { type: 'bet', playerId: 'p1', amount: 600, timestamp: new Date(), street: 'flop' },
        { type: 'raise', playerId: 'p2', amount: 1800, timestamp: new Date(), street: 'flop' },
        { type: 'all-in', playerId: 'p1', amount: 13700, timestamp: new Date(), street: 'flop' },
        { type: 'call', playerId: 'p2', amount: 8500, timestamp: new Date(), street: 'flop' },
      ],
      board: ['Ac', '7h', '3c', 'Kh', '2d'],
      winners: [
        { playerId: 'p1', amount: 21000, handRank: 'Two Pair (Kings and Aces)' }
      ],
      potSize: 21000,
      metadata: {
        dealerPosition: 0,
        smallBlindAmount: 50,
        bigBlindAmount: 100,
        anteAmount: 10
      }
    },
    {
      id: 'hand-3',
      handNumber: 44,
      timestamp: new Date('2025-10-05T15:40:00'),
      players: [
        { id: 'p1', name: 'Alice', position: 0, chips: 35000, cards: ['Qs', 'Qd'] },
        { id: 'p2', name: 'Bob', position: 1, chips: 2500, cards: ['As', 'Js'] },
        { id: 'p3', name: 'Charlie', position: 2, chips: 21100, cards: ['8h', '8c'] },
      ],
      actions: [
        { type: 'raise', playerId: 'p2', amount: 300, timestamp: new Date(), street: 'preflop' },
        { type: 'call', playerId: 'p3', amount: 300, timestamp: new Date(), street: 'preflop' },
        { type: 'raise', playerId: 'p1', amount: 900, timestamp: new Date(), street: 'preflop' },
        { type: 'all-in', playerId: 'p2', amount: 2200, timestamp: new Date(), street: 'preflop' },
        { type: 'fold', playerId: 'p3', timestamp: new Date(), street: 'preflop' },
        { type: 'call', playerId: 'p1', amount: 1600, timestamp: new Date(), street: 'preflop' },
      ],
      board: ['Ah', 'Qc', '9d', '4s', '2h'],
      winners: [
        { playerId: 'p1', amount: 5300, handRank: 'Three of a Kind (Queens)' }
      ],
      potSize: 5300,
      metadata: {
        dealerPosition: 1,
        smallBlindAmount: 50,
        bigBlindAmount: 100,
        anteAmount: 10
      }
    },
  ], []);

  const filteredHands = useMemo(() => {
    return mockHands.filter(hand => {
      // Search filter
      if (searchTerm && !hand.handNumber.toString().includes(searchTerm)) {
        return false;
      }

      // Tournament filter (mock - gerçekte tournamentId ile filtrelenir)
      if (filterTournament !== 'all') {
        return false;
      }

      // Player filter
      if (filterPlayer !== 'all' && !hand.players.some(p => p.name === filterPlayer)) {
        return false;
      }

      return true;
    });
  }, [mockHands, searchTerm, filterTournament, filterPlayer]);

  const uniquePlayers = useMemo(() => {
    const players = new Set<string>();
    mockHands.forEach(hand => {
      hand.players.forEach(p => players.add(p.name));
    });
    return Array.from(players);
  }, [mockHands]);

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
                <History className="icon-lg text-brand-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Hand History</h1>
                <p className="text-sm text-slate-400">El Geçmişi ve Replay</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-white">{filteredHands.length}</div>
              <div className="text-sm text-slate-400">Toplam El</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-md text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="El numarası ara..."
                className="input pl-10"
              />
            </div>

            {/* Tournament Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-md text-slate-400" />
              <select
                value={filterTournament}
                onChange={(e) => setFilterTournament(e.target.value)}
                className="input pl-10 appearance-none cursor-pointer"
              >
                <option value="all">Tüm Turnuvalar</option>
                <option value="t1">Main Event #1</option>
                <option value="t2">Turbo Tournament</option>
                <option value="t3">Sit & Go #5</option>
              </select>
            </div>

            {/* Player Filter */}
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-md text-slate-400" />
              <select
                value={filterPlayer}
                onChange={(e) => setFilterPlayer(e.target.value)}
                className="input pl-10 appearance-none cursor-pointer"
              >
                <option value="all">Tüm Oyuncular</option>
                {uniquePlayers.map(player => (
                  <option key={player} value={player}>{player}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {selectedHand ? (
          /* Hand Viewer */
          <HandHistoryViewer
            hand={selectedHand}
            onClose={() => setSelectedHand(null)}
          />
        ) : (
          /* Hand List */
          <div className="space-y-4">
            {filteredHands.map((hand) => {
              const winner = hand.winners[0];
              const winnerPlayer = hand.players.find(p => p.id === winner.playerId);

              return (
                <div
                  key={hand.id}
                  className="card-hover p-6"
                  onClick={() => setSelectedHand(hand)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brand-500/20 rounded-lg group-hover:bg-brand-500/30 transition-smooth">
                        <History className="icon-lg text-brand-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Hand #{hand.handNumber}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Calendar className="icon-sm" />
                          <span>{format(hand.timestamp, 'dd MMMM yyyy, HH:mm', { locale: tr })}</span>
                        </div>
                      </div>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 rounded-lg transition-smooth">
                      <Eye className="icon-sm" />
                      <span>Replay</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Players */}
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Oyuncular ({hand.players.length})</div>
                      <div className="flex flex-wrap gap-2">
                        {hand.players.map(p => (
                          <div
                            key={p.id}
                            className={`px-3 py-1 rounded-full text-sm ${
                              p.id === winner.playerId
                                ? 'badge-success'
                                : 'badge bg-slate-600/20 text-slate-400 border border-slate-600/30'
                            }`}
                          >
                            {p.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pot & Board */}
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Pot & Board</div>
                      <div className="text-xl font-bold text-brand-400 mb-2">
                        {hand.potSize.toLocaleString('tr-TR')} chips
                      </div>
                      {hand.board && (
                        <div className="flex gap-1">
                          {hand.board.map((card, i) => (
                            <div key={i} className="w-8 h-10 bg-white rounded text-xs font-bold flex items-center justify-center text-black">
                              {card}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Winner */}
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Kazanan</div>
                      <div className="text-lg font-semibold text-success-400">
                        {winnerPlayer?.name}
                      </div>
                      <div className="text-sm text-slate-400">{winner.handRank}</div>
                      <div className="text-sm text-brand-400">+{winner.amount.toLocaleString('tr-TR')}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-sm text-slate-400">
                    <div>
                      <span className="text-white font-medium">{hand.actions.length}</span> action(s)
                    </div>
                    <div className="flex items-center gap-2">
                      Blinds: {hand.metadata?.smallBlindAmount}/{hand.metadata?.bigBlindAmount}
                      {hand.metadata?.anteAmount && <span>+{hand.metadata.anteAmount} ante</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredHands.length === 0 && (
              <div className="text-center py-16">
                <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">El geçmişi bulunamadı</h3>
                <p className="text-slate-500">Filtreleri değiştirerek tekrar deneyin</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
