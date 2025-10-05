'use client'

import { useState, useEffect } from 'react'
import { Clock, Users, Trophy, Settings, ChevronRight, Play, Pause, RotateCcw, Plus, BarChart3, Monitor, TrendingUp, Award, Timer, Target, DollarSign, FileText, Shuffle, History } from 'lucide-react'
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

const ICMCalculator = dynamic(() => import('../components/ICMCalculator').then(mod => ({ default: mod.ICMCalculator })), {
  ssr: false,
  loading: () => <LoadingSpinner text="ICM hesaplayıcı yükleniyor..." />
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
        name: 'RangeNex Demo Tournament',
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
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-8 pb-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Banner - Modern 2025 Design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-banner rounded-3xl p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Brand & Tagline */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-brand-500/20 rounded-lg">
                  <Trophy className="icon-lg text-brand-400" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Professional Tournament Management</h1>
              </div>
              <p className="text-slate-400 text-lg">
                Enterprise-grade poker tournament platform with real-time analytics
              </p>
            </div>

            {/* Live Stats & Quick Create */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Connection Status */}
              <ConnectionStatus />

              {/* Live Stats */}
              <div className="flex gap-3">
                <div className="stat-badge">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-300">
                    <span className="font-bold text-white">{players.length}</span> Players
                  </span>
                </div>
                {tournament && (
                  <div className="stat-badge">
                    <Clock className="icon-sm text-brand-400" />
                    <span className="text-slate-300">
                      <span className="font-bold text-white">Live</span> Tournament
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Create Button */}
              <button
                onClick={() => setShowTournamentModal(true)}
                className="btn-primary btn-lg glow-brand-hover"
              >
                <Plus className="icon-md" />
                <span>New Tournament</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Primary Action Cards - 4 Main Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Tournament Clock */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="action-card-primary"
            onClick={() => setActiveView('clock')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-brand-500/20 rounded-xl">
                <Clock className="icon-xl text-brand-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Tournament Clock</h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
              Professional timer with blind structure management
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-brand-400 font-semibold text-sm">Launch →</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-success-500">Active</span>
              </div>
            </div>
          </motion.div>

          {/* Player Management */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="action-card-primary"
            onClick={() => setActiveView('players')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-brand-500/20 rounded-xl">
                <Users className="icon-xl text-brand-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Player Management</h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
              Complete registration, chip tracking & eliminations
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-brand-400 font-semibold text-sm">Manage →</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-xs text-success-500">Ready</span>
              </div>
            </div>
          </motion.div>

          {/* ICM Calculator */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="action-card-primary"
            onClick={() => router.push('/icm')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-brand-500/20 rounded-xl">
                <DollarSign className="icon-xl text-brand-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">ICM Calculator</h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
              Professional deal-making & prize distribution
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-brand-400 font-semibold text-sm">Calculate →</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-xs text-success-500">Ready</span>
              </div>
            </div>
          </motion.div>

          {/* Seating Chart */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="action-card-primary"
            onClick={() => router.push('/seating')}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-brand-500/20 rounded-xl">
                <Trophy className="icon-xl text-brand-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Seating Chart</h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
              Drag-and-drop seating with table balancing
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-brand-400 font-semibold text-sm">Arrange →</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-xs text-success-500">Ready</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Secondary Navigation - Pill Style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 overflow-x-auto pb-2"
        >
          <span className="text-sm font-medium text-slate-400 whitespace-nowrap">More Tools:</span>
          <button onClick={() => router.push('/templates')} className="action-card-secondary whitespace-nowrap">
            <FileText className="icon-sm" />
            Templates
          </button>
          <button onClick={() => router.push('/pairings')} className="action-card-secondary whitespace-nowrap">
            <Shuffle className="icon-sm" />
            Pairings
          </button>
          <button onClick={() => router.push('/leaderboard')} className="action-card-secondary whitespace-nowrap">
            <Award className="icon-sm" />
            Leaderboard
          </button>
          <button onClick={() => router.push('/dashboard')} className="action-card-secondary whitespace-nowrap">
            <BarChart3 className="icon-sm" />
            Analytics
          </button>
          <button onClick={() => router.push('/hands')} className="action-card-secondary whitespace-nowrap">
            <History className="icon-sm" />
            Hand History
          </button>
        </motion.div>

        {/* Tournament Status Bar */}
        {tournament && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 mb-6"
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
                <div className="text-xl sm:text-2xl font-bold text-brand-400">
                  {formatTime(tournament.timeRemaining)}
                </div>
                <div className="text-xs sm:text-sm text-slate-400">
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
          className="flex justify-center mb-6 bg-slate-900/30 backdrop-blur-sm rounded-xl p-2 mx-auto overflow-x-auto border border-slate-700/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex space-x-2 min-w-max sm:min-w-0">
            {[
              { id: 'clock', label: 'Turnuva Saati', shortLabel: 'Saat', icon: Clock },
              { id: 'players', label: 'Oyuncu Yönetimi', shortLabel: 'Oyuncular', icon: Users },
              { id: 'statistics', label: 'İstatistikler', shortLabel: 'İstatistik', icon: BarChart3 },
              { id: 'tables', label: 'Masalar', shortLabel: 'Masalar', icon: Trophy },
              { id: 'icm', label: 'ICM Hesaplayıcı', shortLabel: 'ICM', icon: DollarSign }
            ].map(({ id, label, shortLabel, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-smooth whitespace-nowrap text-sm flex items-center gap-2 ${
                  activeView === id
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="icon-sm" />
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Tournament Clock */}
              <div className="lg:col-span-2 card p-6 lg:p-8">
                {tournament ? (
                  <TournamentClock
                    tournamentId={tournament.id}
                    levels={tournament.blindStructure.map((level, index) => ({
                      idx: level.idx,
                      smallBlind: level.smallBlind * 100, // Convert to cents for TournamentClock
                      bigBlind: level.bigBlind * 100,
                      ante: level.ante * 100,
                      durationSeconds: level.durationSeconds,
                      isBreak: level.isBreak,
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
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowTournamentModal(true)}
                        className="btn-primary mx-auto transition-smooth"
                      >
                        <Plus className="icon-md" />
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
                    className="card p-4 sm:p-6"
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Timer className="icon-md text-brand-400" />
                      Turnuva Kontrolü
                    </h3>
                    <div className="space-y-3">
                      {tournament.status === 'created' && (
                        <button
                          onClick={startTournament}
                          className="w-full btn-success transition-smooth"
                        >
                          <Play className="icon-sm" />
                          Turnuvayı Başlat
                        </button>
                      )}
                      {tournament.status === 'running' && (
                        <button
                          onClick={pauseTournament}
                          className="w-full btn-warning transition-smooth"
                        >
                          <Pause className="icon-sm" />
                          Duraklat
                        </button>
                      )}
                      {tournament.status === 'paused' && (
                        <button
                          onClick={resumeTournament}
                          className="w-full btn-success transition-smooth"
                        >
                          <Play className="icon-sm" />
                          Devam Et
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={previousLevel}
                          disabled={!tournament || tournament.currentLevel <= 1}
                          className="btn-secondary btn-sm transition-smooth"
                        >
                          Önceki Seviye
                        </button>
                        <button
                          onClick={nextLevel}
                          disabled={!tournament || tournament.currentLevel >= tournament.blindStructure.length}
                          className="btn-secondary btn-sm transition-smooth"
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
                  className="card p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="icon-md text-brand-400" />
                    Oyuncu Durumu
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aktif Oyuncular</span>
                      <span className="text-2xl font-bold text-brand-400">{statistics.activePlayers}</span>
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
                    className="card p-4 sm:p-6"
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Trophy className="icon-md text-brand-400" />
                      Ödül Havuzu
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Havuz</span>
                        <span className="text-2xl font-bold text-brand-400">
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
                  className="card p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Hızlı İşlemler</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveView('players')
                        setShowPlayerModal(true)
                      }}
                      className="w-full px-4 py-3 bg-success-500/20 hover:bg-success-500/30 rounded-lg flex items-center justify-between transition-smooth"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="icon-sm" />
                        Oyuncu Ekle
                      </span>
                      <ChevronRight className="icon-sm" />
                    </button>
                    <button
                      onClick={() => setActiveView('icm')}
                      className="w-full px-4 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 rounded-lg flex items-center justify-between transition-smooth"
                    >
                      <span className="flex items-center gap-2">
                        <DollarSign className="icon-sm" />
                        ICM Hesapla
                      </span>
                      <ChevronRight className="icon-sm" />
                    </button>
                    <button
                      onClick={() => setActiveView('statistics')}
                      className="w-full px-4 py-3 bg-success-500/20 hover:bg-success-500/30 rounded-lg flex items-center justify-between transition-smooth"
                    >
                      <span className="flex items-center gap-2">
                        <TrendingUp className="icon-sm" />
                        İstatistikleri Görüntüle
                      </span>
                      <ChevronRight className="icon-sm" />
                    </button>
                    <button
                      onClick={() => router.push('/seating')}
                      className="w-full px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg flex items-center justify-between transition-smooth"
                    >
                      <span className="flex items-center gap-2">
                        <Trophy className="icon-sm" />
                        Koltuk Düzeni
                      </span>
                      <ChevronRight className="icon-sm" />
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
              className="card p-6"
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
              <div className="card p-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="icon-lg text-brand-400" />
                  Turnuva İstatistikleri
                </h2>
                <p className="text-gray-400 mt-2">Detaylı performans analizi ve oyuncu istatistikleri</p>
              </div>

              {/* Main Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Chip Leader */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card p-6 border border-brand-400/20"
                >
                  <h3 className="text-brand-400 mb-4 flex items-center gap-2">
                    <Award className="icon-md" />
                    Chip Lideri
                  </h3>
                  {statistics.chipLeader ? (
                    <>
                      <div className="text-2xl font-bold text-white">{statistics.chipLeader.name}</div>
                      <div className="text-gray-400">{statistics.chipLeader.chipCount.toLocaleString()} chips</div>
                      <div className="text-sm text-brand-400 mt-2">
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
                  className="card p-6"
                >
                  <h3 className="text-brand-400 mb-4">Ortalama Stack</h3>
                  <div className="text-2xl font-bold text-white">{statistics.averageStack.toLocaleString()}</div>
                  <div className="text-gray-400">{statistics.activePlayers} oyuncu kaldı</div>
                </motion.div>

                {/* Total Chips */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="card p-6"
                >
                  <h3 className="text-brand-400 mb-4">Toplam Chips</h3>
                  <div className="text-2xl font-bold text-white">{statistics.totalChips.toLocaleString()}</div>
                  <div className="text-gray-400">Oyunda</div>
                </motion.div>

                {/* Prize Pool */}
                {tournament && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card p-6"
                  >
                    <h3 className="text-brand-400 mb-4">Ödül Havuzu</h3>
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
                    className="card p-6"
                  >
                    <h3 className="text-brand-400 mb-4">1. Ödül</h3>
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
                  className="card p-6"
                >
                  <h3 className="text-brand-400 mb-4">Para Kazananlar</h3>
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
                  className="card p-6"
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

          {/* ICM Calculator View */}
          {activeView === 'icm' && (
            <motion.div
              key="icm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="card p-6"
            >
              <ErrorBoundary>
                {players.length > 0 && tournament ? (
                  <ICMCalculator
                    players={players.filter(p => p.status === 'active').map(p => ({
                      id: p.id,
                      name: p.name,
                      chips: p.chipCount
                    }))}
                    prizePool={tournament.prizePool}
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
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      ICM Hesaplayıcı
                    </h3>
                    <p className="text-gray-400 mb-6">
                      ICM hesaplamalarını görmek için en az 2 aktif oyuncu gerekli
                    </p>
                    <button
                      onClick={() => setActiveView('players')}
                      className="btn-primary transition-smooth"
                    >
                      Oyuncu Ekle
                    </button>
                  </div>
                )}
              </ErrorBoundary>
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
              <div className="card p-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-4">
                  <Trophy className="icon-lg text-brand-400" />
                  Masa Yönetimi & Koltuk Düzeni
                </h2>
                <p className="text-gray-400 mb-6">Masaları yönetin, oyuncuları oturtun ve gerçek zamanlı denge sağlayın</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Access to Seating Demo */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="card-hover p-6 border border-purple-500/30 cursor-pointer transition-smooth hover-lift"
                    onClick={() => router.push('/seating')}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Trophy className="icon-2xl text-purple-400" />
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
                        <span className="text-2xl font-bold text-brand-400">3</span>
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
                          <span className="text-lg font-medium text-brand-400">67%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Management Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/seating')}
                  className="card-hover p-6 text-left transition-smooth hover-lift border border-green-500/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Plus className="icon-lg text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Yeni Masa Ekle</h3>
                  </div>
                  <p className="text-gray-400 text-sm">Turnuvaya yeni masa ve koltuklar ekleyin</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/seating')}
                  className="card-hover p-6 text-left transition-smooth hover-lift border border-blue-500/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <RotateCcw className="icon-lg text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Masaları Dengele</h3>
                  </div>
                  <p className="text-gray-400 text-sm">Otomatik masa dengeleme algoritması</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/seating')}
                  className="card-hover p-6 text-left transition-smooth hover-lift border border-purple-500/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="icon-lg text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Koltuk Ata</h3>
                  </div>
                  <p className="text-gray-400 text-sm">Oyuncuları optimum konumlara yerleştirin</p>
                </motion.button>
              </div>

              {/* Demo Table Preview */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="icon-md text-brand-400" />
                  Masa Önizlemesi
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        onClick={() => router.push('/seating')}
                        className="w-full text-xs px-3 py-2 bg-brand-400/20 hover:bg-brand-400/30 text-brand-400 rounded transition-smooth"
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