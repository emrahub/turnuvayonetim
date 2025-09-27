'use client'

import { useState, useEffect } from 'react'
import { Clock, Users, Trophy, Settings, ChevronRight, Play, Pause, RotateCcw, Plus, BarChart, Monitor, TrendingUp, Award, Timer, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useTournamentStore } from '../stores/tournamentStore'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { TournamentCreationModal } from '../components/TournamentCreationModal'

// Dynamic import to avoid SSR issues
const PlayerManagement = dynamic(() => import('../components/PlayerManagement'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Oyuncu yönetimi yükleniyor..." />
})

const TournamentClock = dynamic(() => import('../components/TournamentClock'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Turnuva saati yükleniyor..." />
})

export default function Home() {
  const router = useRouter()

  // Tournament Store
  const {
    tournament,
    players,
    statistics,
    isConnected,
    loading,
    error,
    activeView,
    showPlayerModal,
    showTournamentModal,
    initializeSocket,
    setActiveView,
    setShowPlayerModal,
    setShowTournamentModal,
    createTournament,
    addPlayer,
    startTournament,
    pauseTournament,
    resumeTournament,
    nextLevel,
    previousLevel,
    updateTimeRemaining
  } = useTournamentStore()

  const [localTime, setLocalTime] = useState(Date.now())

  // Demo data for immediate functionality
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
    { name: 'Luna Park', email: 'luna@example.com', phoneNumber: '+1234567801', buyInAmount: 100, chipCount: 8900, status: 'active' as const }
  ]

  // Initialize demo data and socket connection
  useEffect(() => {
    // Create demo tournament if none exists
    if (!tournament) {
      createTournament({
        name: 'TURNUVAYONETIM Demo Tournament',
        buyIn: 100,
        maxPlayers: 50,
        startTime: new Date(),
        status: 'running'
      })
    }

    // Add demo players if none exist
    if (players.length === 0) {
      setTimeout(() => {
        DEMO_PLAYERS.forEach((playerData, index) => {
          setTimeout(() => {
            addPlayer({
              ...playerData
            })
          }, index * 100) // Stagger player addition for effect
        })
      }, 500)
    }

    initializeSocket()

    const interval = setInterval(() => {
      setLocalTime(Date.now())

      // Update tournament time if running
      if (tournament?.status === 'running' && tournament.timeRemaining > 0) {
        updateTimeRemaining(tournament.timeRemaining - 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Auto-advance levels when time expires
  useEffect(() => {
    if (tournament?.status === 'running' && tournament.timeRemaining <= 0) {
      nextLevel()
    }
  }, [tournament?.timeRemaining, tournament?.status, nextLevel])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const currentBlind = tournament?.blindStructure[tournament.currentLevel - 1]
  const nextBlind = tournament?.blindStructure[tournament.currentLevel]

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
      isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-400' : 'bg-red-400'
      }`} />
      {isConnected ? 'Bağlı' : 'Bağlantı Kesildi'}
    </div>
  )

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-br from-poker-green to-poker-black p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-poker-gold mb-1 sm:mb-2">TURNUVAYONETIM</h1>
              <p className="text-sm sm:text-base text-gray-300">Profesyonel Poker Turnuva Yönetim Sistemi</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 lg:gap-4">
              <ConnectionStatus />
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowTournamentModal(true)}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-poker-gold hover:bg-yellow-600 text-black rounded-lg flex items-center gap-2 transition font-semibold text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Yeni Turnuva</span>
                  <span className="sm:hidden">Yeni</span>
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-poker-green hover:bg-green-700 rounded-lg flex items-center gap-2 transition font-semibold text-sm sm:text-base"
                >
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Panel</span>
                </button>
                <button
                  onClick={() => router.push('/seating-demo')}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition font-semibold text-sm sm:text-base"
                >
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Seating Chart</span>
                  <span className="sm:hidden">Koltuklar</span>
                </button>
                <button className="p-2 sm:p-3 bg-white/10 rounded-lg hover:bg-white/20 transition">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Feature Showcase - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {/* Seating Chart Feature */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 cursor-pointer"
            onClick={() => router.push('/seating-demo')}
          >
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-8 h-8 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Seating Chart</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Interactive drag-and-drop seating management with real-time table balancing
            </p>
            <div className="flex items-center justify-between">
              <span className="text-purple-400 font-medium">Try Demo →</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-400">Ready</span>
              </div>
            </div>
          </motion.div>

          {/* Tournament Clock Feature */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 cursor-pointer"
            onClick={() => setActiveView('clock')}
          >
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-8 h-8 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Tournament Clock</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Professional timer with blind structure management and break scheduling
            </p>
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-medium">View Clock →</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-400">Active</span>
              </div>
            </div>
          </motion.div>

          {/* Player Management Feature */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 cursor-pointer"
            onClick={() => setActiveView('players')}
          >
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-8 h-8 text-green-400" />
              <h3 className="text-xl font-bold text-white">Player Management</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Complete player registration, chip tracking, and elimination management
            </p>
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-medium">Manage Players →</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-400">Ready</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Tournament Status Bar */}
        {tournament && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-4 sm:mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-white truncate">{tournament.name}</h3>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400 mt-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    tournament.status === 'running' ? 'bg-green-500/20 text-green-400' :
                    tournament.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                    tournament.status === 'registering' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {tournament.status === 'running' ? 'Devam Ediyor' :
                     tournament.status === 'paused' ? 'Duraklatıldı' :
                     tournament.status === 'registering' ? 'Kayıt Açık' : 'Hazır'}
                  </span>
                  <span className="hidden sm:inline">Buy-in: {formatCurrency(tournament.buyIn)}</span>
                  <span>Seviye {tournament.currentLevel}</span>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-xl sm:text-2xl font-bold text-poker-gold">
                  {formatTime(tournament.timeRemaining)}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  {currentBlind && !currentBlind.isBreak ?
                    `${currentBlind.smallBlind}/${currentBlind.bigBlind}` :
                    currentBlind?.breakName || 'Mola'
                  }
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* View Selector Tabs */}
        <motion.div
          className="flex justify-center mb-4 sm:mb-6 bg-black/20 backdrop-blur-sm rounded-xl p-2 mx-auto overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex space-x-1 sm:space-x-2 min-w-max sm:min-w-0">
            {[
              { id: 'clock', label: 'Turnuva Saati', shortLabel: 'Saat', icon: Clock },
              { id: 'players', label: 'Oyuncu Yönetimi', shortLabel: 'Oyuncular', icon: Users },
              { id: 'statistics', label: 'İstatistikler', shortLabel: 'İstatistik', icon: BarChart },
              { id: 'tables', label: 'Masalar', shortLabel: 'Masalar', icon: Trophy }
            ].map(({ id, label, shortLabel, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                  activeView === id
                    ? 'bg-poker-gold text-black transform scale-105'
                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Clock View */}
        <AnimatePresence mode="wait">
          {activeView === 'clock' && (
            <motion.div
              key="clock"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {/* Tournament Clock */}
              <div className="lg:col-span-2 bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8">
                {tournament ? (
                  <TournamentClock
                    tournamentId={tournament.id}
                    levels={tournament.blindStructure.map((level, index) => ({
                      idx: index,
                      smallBlind: level.smallBlind * 100, // Convert to cents for TournamentClock
                      bigBlind: level.bigBlind * 100,
                      ante: level.ante * 100,
                      durationSeconds: level.duration * 60,
                      isBreak: level.isBreak || false,
                      breakName: level.breakName
                    }))}
                    isController={true}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl text-gray-600 mb-4">⏱️</div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">
                      Demo Turnuva Yükleniyor...
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Demo veriler hazırlanıyor. Bir turnuva otomatik olarak oluşturulacak.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-poker-gold rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-poker-gold rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-poker-gold rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowTournamentModal(true)}
                        className="px-6 py-3 bg-poker-gold hover:bg-yellow-600 text-black rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-5 h-5" />
                        Veya Yeni Turnuva Oluştur
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Panel */}
              <div className="space-y-4 sm:space-y-6">
                {/* Tournament Controls */}
                {tournament && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-6"
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Timer className="w-5 h-5 text-poker-gold" />
                      Turnuva Kontrolü
                    </h3>
                    <div className="space-y-3">
                      {tournament.status === 'created' && (
                        <button
                          onClick={startTournament}
                          className="w-full px-4 py-3 bg-poker-green hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 transition font-medium"
                        >
                          <Play className="w-4 h-4" />
                          Turnuvayı Başlat
                        </button>
                      )}
                      {tournament.status === 'running' && (
                        <button
                          onClick={pauseTournament}
                          className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg flex items-center justify-center gap-2 transition font-medium"
                        >
                          <Pause className="w-4 h-4" />
                          Duraklat
                        </button>
                      )}
                      {tournament.status === 'paused' && (
                        <button
                          onClick={resumeTournament}
                          className="w-full px-4 py-3 bg-poker-green hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 transition font-medium"
                        >
                          <Play className="w-4 h-4" />
                          Devam Et
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={previousLevel}
                          disabled={!tournament || tournament.currentLevel <= 1}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition"
                        >
                          Önceki Seviye
                        </button>
                        <button
                          onClick={nextLevel}
                          disabled={!tournament || tournament.currentLevel >= tournament.blindStructure.length}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition"
                        >
                          Sonraki Seviye
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Players Count */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-black/40 backdrop-blur-sm rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-poker-gold" />
                    Oyuncu Durumu
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aktif Oyuncular</span>
                      <span className="text-2xl font-bold text-poker-gold">{statistics.activePlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Elenen</span>
                      <span className="text-xl text-poker-red">{statistics.eliminatedPlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Toplam Kayıt</span>
                      <span className="text-xl">{statistics.totalPlayers}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Prize Pool Info */}
                {tournament && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-6"
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-poker-gold" />
                      Ödül Havuzu
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Havuz</span>
                        <span className="text-2xl font-bold text-poker-gold">
                          {formatCurrency(tournament.prizePool)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">1. Ödül</span>
                        <span className="text-xl">
                          {tournament.prizeStructure[0] ? formatCurrency(tournament.prizeStructure[0].amount) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ödül Alacak</span>
                        <span className="text-xl">{statistics.payoutPositions} oyuncu</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-black/40 backdrop-blur-sm rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Hızlı İşlemler</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveView('players')
                        setShowPlayerModal(true)
                      }}
                      className="w-full px-4 py-3 bg-poker-green/20 hover:bg-poker-green/30 rounded-lg flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Oyuncu Ekle
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveView('statistics')}
                      className="w-full px-4 py-3 bg-poker-green/20 hover:bg-poker-green/30 rounded-lg flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        İstatistikleri Görüntüle
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push('/seating-demo')}
                      className="w-full px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Koltuk Düzeni Demo
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

          {/* Players View */}
          {activeView === 'players' && (
            <motion.div
              key="players"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-black/40 backdrop-blur-sm rounded-xl p-6"
            >
              <ErrorBoundary>
                <PlayerManagement
                  tournamentId={tournament?.id || 'demo-tournament'}
                  onPlayerCountChange={() => {}} // Handled by store now
                  showAddModal={showPlayerModal}
                  onCloseModal={() => setShowPlayerModal(false)}
                />
              </ErrorBoundary>
            </motion.div>
          )}

          {/* Statistics View */}
          {activeView === 'statistics' && (
            <motion.div
              key="statistics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <BarChart className="w-6 h-6 text-poker-gold" />
                  Turnuva İstatistikleri
                </h2>
                <p className="text-gray-400 mt-2">Detaylı performans analizi ve oyuncu istatistikleri</p>
              </div>

              {/* Main Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Chip Leader */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-poker-gold/20"
                >
                  <h3 className="text-poker-gold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Chip Lideri
                  </h3>
                  {statistics.chipLeader ? (
                    <>
                      <div className="text-2xl font-bold text-white">{statistics.chipLeader.name}</div>
                      <div className="text-gray-400">{statistics.chipLeader.chipCount.toLocaleString()} chips</div>
                      <div className="text-sm text-poker-gold mt-2">
                        Masa {statistics.chipLeader.tableNumber || '-'} / Koltuk {statistics.chipLeader.seatNumber || '-'}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">Henüz oyuncu yok</div>
                  )}
                </motion.div>

                {/* Average Stack */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-black/40 backdrop-blur-sm rounded-xl p-6"
                >
                  <h3 className="text-poker-gold mb-4">Ortalama Stack</h3>
                  <div className="text-2xl font-bold text-white">{statistics.averageStack.toLocaleString()}</div>
                  <div className="text-gray-400">{statistics.activePlayers} oyuncu kaldı</div>
                </motion.div>

                {/* Total Chips */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-black/40 backdrop-blur-sm rounded-xl p-6"
                >
                  <h3 className="text-poker-gold mb-4">Toplam Chips</h3>
                  <div className="text-2xl font-bold text-white">{statistics.totalChips.toLocaleString()}</div>
                  <div className="text-gray-400">Oyunda</div>
                </motion.div>

                {/* Prize Pool */}
                {tournament && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-6"
                  >
                    <h3 className="text-poker-gold mb-4">Ödül Havuzu</h3>
                    <div className="text-2xl font-bold text-white">{formatCurrency(tournament.prizePool)}</div>
                    <div className="text-gray-400">{statistics.totalPlayers} kayıt</div>
                  </motion.div>
                )}

                {/* First Prize */}
                {tournament?.prizeStructure[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-6"
                  >
                    <h3 className="text-poker-gold mb-4">1. Ödül</h3>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(tournament.prizeStructure[0].amount)}
                    </div>
                    <div className="text-gray-400">{tournament.prizeStructure[0].percentage}% havuz</div>
                  </motion.div>
                )}

                {/* ITM */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-black/40 backdrop-blur-sm rounded-xl p-6"
                >
                  <h3 className="text-poker-gold mb-4">Para Kazananlar</h3>
                  <div className="text-2xl font-bold text-white">{statistics.payoutPositions} Oyuncu</div>
                  <div className="text-gray-400">
                    {statistics.moneyBubblePosition && `Bubble: ${statistics.moneyBubblePosition}. sıra`}
                  </div>
                </motion.div>
              </div>

              {/* Recent Eliminations */}
              {statistics.recentEliminations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-black/40 backdrop-blur-sm rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 text-white">Son Eleneler</h3>
                  <div className="space-y-3">
                    {statistics.recentEliminations.map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-black/60 rounded-lg">
                        <div>
                          <div className="font-medium text-white">{player.name}</div>
                          <div className="text-sm text-gray-400">
                            {player.eliminationTime?.toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-poker-red font-medium">
                            {statistics.eliminatedPlayers - index}. sıra
                          </div>
                          <div className="text-sm text-gray-400">
                            {player.chipCount.toLocaleString()} chips
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Tables View */}
          {activeView === 'tables' && (
            <motion.div
              key="tables"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-4">
                  <Trophy className="w-6 h-6 text-poker-gold" />
                  Masa Yönetimi & Koltuk Düzeni
                </h2>
                <p className="text-gray-400 mb-6">Masaları yönetin, oyuncuları oturtun ve gerçek zamanlı denge sağlayın</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Access to Seating Demo */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 cursor-pointer"
                    onClick={() => router.push('/seating-demo')}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Trophy className="w-10 h-10 text-purple-400" />
                      <div>
                        <h3 className="text-xl font-bold text-white">Interaktif Koltuk Düzeni</h3>
                        <p className="text-purple-300 text-sm">Drag & Drop ile masa yönetimi</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>18 oyuncu hazır</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Otomatik masa dengesi</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Gerçek zamanlı güncelleme</span>
                      </div>
                    </div>
                    <div className="bg-purple-600/20 rounded-lg p-3 border border-purple-500/30">
                      <span className="text-purple-300 font-medium">Demo'yu Deneyin →</span>
                    </div>
                  </motion.div>

                  {/* Table Statistics */}
                  <div className="bg-black/60 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Masa İstatistikleri</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Aktif Masalar</span>
                        <span className="text-2xl font-bold text-poker-gold">3</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Toplam Koltuk</span>
                        <span className="text-xl text-white">27</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Dolu Koltuklar</span>
                        <span className="text-xl text-green-400">18</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Boş Koltuklar</span>
                        <span className="text-xl text-yellow-400">9</span>
                      </div>
                      <div className="pt-2 border-t border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Doluluk Oranı</span>
                          <span className="text-lg font-medium text-poker-gold">67%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Management Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/seating-demo')}
                  className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl p-6 text-left transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Plus className="w-6 h-6 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Yeni Masa Ekle</h3>
                  </div>
                  <p className="text-gray-400 text-sm">Turnuvaya yeni masa ve koltuklar ekleyin</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/seating-demo')}
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl p-6 text-left transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <RotateCcw className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Masaları Dengele</h3>
                  </div>
                  <p className="text-gray-400 text-sm">Otomatik masa dengeleme algoritması</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/seating-demo')}
                  className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl p-6 text-left transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Koltuk Ata</h3>
                  </div>
                  <p className="text-gray-400 text-sm">Oyuncuları optimum konumlara yerleştirin</p>
                </motion.button>
              </div>

              {/* Demo Table Preview */}
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-poker-gold" />
                  Masa Önizlemesi
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((tableNum) => (
                    <div key={tableNum} className="bg-black/60 rounded-xl p-4 border border-gray-700">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-white">Masa {tableNum}</h4>
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                          {tableNum === 1 ? '9/9' : tableNum === 2 ? '6/9' : '3/9'} Dolu
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 mb-3">
                        {Array.from({ length: 9 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded border text-xs flex items-center justify-center ${
                              (tableNum === 1) ||
                              (tableNum === 2 && i < 6) ||
                              (tableNum === 3 && i < 3)
                                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                : 'bg-gray-700/50 border-gray-600 text-gray-500'
                            }`}
                          >
                            {(tableNum === 1) ||
                             (tableNum === 2 && i < 6) ||
                             (tableNum === 3 && i < 3) ? i + 1 : ''}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => router.push('/seating-demo')}
                        className="w-full text-xs px-3 py-2 bg-poker-gold/20 hover:bg-poker-gold/30 text-poker-gold rounded transition"
                      >
                        Masa Detayları
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        {/* Tournament Creation Modal */}
        <TournamentCreationModal
          isOpen={showTournamentModal}
          onClose={() => setShowTournamentModal(false)}
        />
      </div>
    </main>
    </ErrorBoundary>
  )
}