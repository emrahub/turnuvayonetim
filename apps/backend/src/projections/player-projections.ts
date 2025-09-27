import { BaseEvent, EventStore } from '../services/event-store';
import { PlayerEventType } from '../events/player-events';
import { TournamentEventType } from '../events/tournament-events';
import { PrismaClient } from '@prisma/client';

// Player Projection Interfaces
export interface PlayerProjection {
  id: string;
  userId: string;
  organizationId?: string;
  nickname?: string;

  // Statistics
  totalTournaments: number;
  totalWins: number;
  totalCashes: number;
  totalEarnings: number;
  totalInvestment: number;
  netProfit: number;
  roi: number; // Return on Investment percentage

  // Performance Metrics
  bestFinish: number;
  worstFinish: number;
  averageFinish: number;
  medianFinish: number;
  itm: number; // In the money percentage
  finalTableRate: number;

  // Tournament Types
  freezeoutStats: TournamentTypeStats;
  rebuyStats: TournamentTypeStats;
  addonStats: TournamentTypeStats;
  sitAndGoStats: TournamentTypeStats;

  // Recent Performance (last 10 tournaments)
  recentForm: PlayerForm[];
  currentStreak: {
    type: 'CASH' | 'BUST' | 'WIN';
    count: number;
  };

  // Active Tournament Status
  activeTournaments: ActiveTournamentStatus[];

  // Financial Summary
  totalBuyIns: number;
  totalRebuys: number;
  totalAddons: number;
  totalFees: number;
  averageBuyIn: number;
  biggestCash: number;
  biggestLoss: number;

  // Time Statistics
  totalPlayTime: number; // in minutes
  averagePlayTime: number;
  longestSession: number;

  // Achievements
  achievements: PlayerAchievement[];

  // Preferences
  preferences?: any;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface TournamentTypeStats {
  tournaments: number;
  wins: number;
  cashes: number;
  earnings: number;
  investment: number;
  roi: number;
  averageFinish: number;
  itm: number;
}

export interface PlayerForm {
  tournamentId: string;
  tournamentName: string;
  date: Date;
  position: number;
  totalPlayers: number;
  buyIn: number;
  prize: number;
  profit: number;
  playTime: number;
}

export interface ActiveTournamentStatus {
  tournamentId: string;
  tournamentName: string;
  status: 'REGISTERED' | 'PLAYING' | 'ELIMINATED';
  currentPosition?: number;
  chipCount: number;
  tableId?: string;
  seatNumber?: number;
  registeredAt: Date;
  totalInvested: number;
  rebuysUsed: number;
  addonsUsed: number;
}

export interface PlayerAchievement {
  id: string;
  type: string;
  name: string;
  description: string;
  unlockedAt: Date;
  tournamentId?: string;
  metadata?: any;
}

export interface PlayerTournamentHistoryProjection {
  playerId: string;
  tournaments: TournamentResult[];
  summary: {
    totalTournaments: number;
    totalEarnings: number;
    totalInvestment: number;
    netProfit: number;
    roi: number;
  };
  lastUpdated: Date;
  version: number;
}

export interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  tournamentType: string;
  date: Date;
  position: number;
  totalPlayers: number;
  buyIn: number;
  fee: number;
  rebuys: number;
  addons: number;
  totalInvested: number;
  prize: number;
  profit: number;
  playTime: number;
  isCash: boolean;
  isWin: boolean;
  isFinalTable: boolean;
}

export interface PlayerStatisticsProjection {
  playerId: string;

  // Overall Statistics
  overallStats: {
    tournaments: number;
    wins: number;
    cashes: number;
    finalTables: number;
    earnings: number;
    investment: number;
    netProfit: number;
    roi: number;
    itm: number;
    averageFinish: number;
    medianFinish: number;
  };

  // Monthly Statistics (last 12 months)
  monthlyStats: Array<{
    month: string;
    year: number;
    tournaments: number;
    wins: number;
    cashes: number;
    earnings: number;
    investment: number;
    profit: number;
    roi: number;
  }>;

  // Performance Trends
  trends: {
    last30Days: PerformancePeriod;
    last90Days: PerformancePeriod;
    last365Days: PerformancePeriod;
    allTime: PerformancePeriod;
  };

  // Recent Activity
  recentTournaments: TournamentResult[];
  upcomingTournaments: Array<{
    tournamentId: string;
    tournamentName: string;
    scheduledAt: Date;
    buyIn: number;
    isRegistered: boolean;
  }>;

  // Comparisons
  rankings: {
    organizationRank?: number;
    leagueRank?: number;
    overallRank?: number;
    percentile?: number;
  };

  // Metadata
  lastUpdated: Date;
  version: number;
}

export interface PerformancePeriod {
  tournaments: number;
  wins: number;
  cashes: number;
  earnings: number;
  investment: number;
  netProfit: number;
  roi: number;
  itm: number;
  averageFinish: number;
  volumeRank?: number;
  profitRank?: number;
}

// Projection Handlers
export class PlayerProjectionHandler {
  constructor(
    private eventStore: EventStore,
    private prisma: PrismaClient
  ) {}

  // Main player projection
  async projectPlayer(organizationId: string, playerId: string): Promise<PlayerProjection> {
    return this.eventStore.project(
      organizationId,
      playerId,
      this.getInitialPlayerState(playerId),
      this.playerProjector.bind(this)
    );
  }

  private getInitialPlayerState(playerId: string): PlayerProjection {
    return {
      id: playerId,
      userId: '',
      totalTournaments: 0,
      totalWins: 0,
      totalCashes: 0,
      totalEarnings: 0,
      totalInvestment: 0,
      netProfit: 0,
      roi: 0,
      bestFinish: Number.MAX_SAFE_INTEGER,
      worstFinish: 0,
      averageFinish: 0,
      medianFinish: 0,
      itm: 0,
      finalTableRate: 0,
      freezeoutStats: this.getInitialTournamentTypeStats(),
      rebuyStats: this.getInitialTournamentTypeStats(),
      addonStats: this.getInitialTournamentTypeStats(),
      sitAndGoStats: this.getInitialTournamentTypeStats(),
      recentForm: [],
      currentStreak: { type: 'BUST', count: 0 },
      activeTournaments: [],
      totalBuyIns: 0,
      totalRebuys: 0,
      totalAddons: 0,
      totalFees: 0,
      averageBuyIn: 0,
      biggestCash: 0,
      biggestLoss: 0,
      totalPlayTime: 0,
      averagePlayTime: 0,
      longestSession: 0,
      achievements: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0
    };
  }

  private getInitialTournamentTypeStats(): TournamentTypeStats {
    return {
      tournaments: 0,
      wins: 0,
      cashes: 0,
      earnings: 0,
      investment: 0,
      roi: 0,
      averageFinish: 0,
      itm: 0
    };
  }

  private playerProjector(state: PlayerProjection, event: BaseEvent): PlayerProjection {
    const newState = { ...state, version: event.version, updatedAt: event.timestamp };

    switch (event.eventType) {
      case PlayerEventType.PLAYER_PROFILE_CREATED:
        return {
          ...newState,
          userId: event.eventData.userId,
          organizationId: event.eventData.organizationId,
          nickname: event.eventData.nickname,
          preferences: event.eventData.initialPreferences,
          createdAt: event.timestamp
        };

      case PlayerEventType.PLAYER_PROFILE_UPDATED:
        return {
          ...newState,
          nickname: event.eventData.changes.nickname || newState.nickname,
          preferences: event.eventData.changes.preferences || newState.preferences
        };

      case PlayerEventType.PLAYER_REGISTERED_FOR_TOURNAMENT:
        const activeTournament: ActiveTournamentStatus = {
          tournamentId: event.eventData.tournamentId,
          tournamentName: '', // Would need to be fetched from tournament projection
          status: 'REGISTERED',
          chipCount: 0,
          registeredAt: event.eventData.registeredAt,
          totalInvested: event.eventData.buyInAmount + event.eventData.feeAmount,
          rebuysUsed: 0,
          addonsUsed: 0
        };

        return {
          ...newState,
          activeTournaments: [...newState.activeTournaments, activeTournament],
          totalBuyIns: newState.totalBuyIns + 1,
          totalInvestment: newState.totalInvestment + event.eventData.buyInAmount + event.eventData.feeAmount,
          totalFees: newState.totalFees + event.eventData.feeAmount
        };

      case PlayerEventType.PLAYER_SEATED:
        return {
          ...newState,
          activeTournaments: newState.activeTournaments.map(t =>
            t.tournamentId === event.eventData.tournamentId
              ? {
                  ...t,
                  status: 'PLAYING',
                  chipCount: event.eventData.chipCount,
                  tableId: event.eventData.tableId,
                  seatNumber: event.eventData.seatNumber
                }
              : t
          )
        };

      case PlayerEventType.PLAYER_CHIPS_UPDATED:
        return {
          ...newState,
          activeTournaments: newState.activeTournaments.map(t =>
            t.tournamentId === event.eventData.tournamentId
              ? { ...t, chipCount: event.eventData.newChipCount }
              : t
          )
        };

      case PlayerEventType.PLAYER_REBOUGHT:
        return {
          ...newState,
          totalRebuys: newState.totalRebuys + 1,
          totalInvestment: newState.totalInvestment + event.eventData.rebuyAmount,
          activeTournaments: newState.activeTournaments.map(t =>
            t.tournamentId === event.eventData.tournamentId
              ? {
                  ...t,
                  rebuysUsed: t.rebuysUsed + 1,
                  totalInvested: t.totalInvested + event.eventData.rebuyAmount,
                  chipCount: event.eventData.currentChipCount
                }
              : t
          )
        };

      case PlayerEventType.PLAYER_ADDON_PURCHASED:
        return {
          ...newState,
          totalAddons: newState.totalAddons + 1,
          totalInvestment: newState.totalInvestment + event.eventData.addonAmount,
          activeTournaments: newState.activeTournaments.map(t =>
            t.tournamentId === event.eventData.tournamentId
              ? {
                  ...t,
                  addonsUsed: t.addonsUsed + 1,
                  totalInvested: t.totalInvested + event.eventData.addonAmount,
                  chipCount: event.eventData.currentChipCount
                }
              : t
          )
        };

      case PlayerEventType.PLAYER_ELIMINATED:
        const eliminatedTournament = newState.activeTournaments.find(
          t => t.tournamentId === event.eventData.tournamentId
        );

        if (!eliminatedTournament) break;

        const prize = event.eventData.prizeMoney || 0;
        const profit = prize - eliminatedTournament.totalInvested;
        const isCash = prize > 0;
        const isWin = event.eventData.position === 1;
        const isFinalTable = event.eventData.position <= 9;

        // Update recent form
        const newForm: PlayerForm = {
          tournamentId: event.eventData.tournamentId,
          tournamentName: eliminatedTournament.tournamentName,
          date: event.eventData.eliminatedAt,
          position: event.eventData.position,
          totalPlayers: 0, // Would need to be fetched
          buyIn: eliminatedTournament.totalInvested,
          prize,
          profit,
          playTime: event.eventData.playTime || 0
        };

        const updatedRecentForm = [newForm, ...newState.recentForm].slice(0, 10);

        // Update statistics
        const updatedStats = this.updatePlayerStatistics(newState, {
          position: event.eventData.position,
          prize,
          investment: eliminatedTournament.totalInvested,
          playTime: event.eventData.playTime || 0,
          isCash,
          isWin,
          isFinalTable
        });

        return {
          ...updatedStats,
          activeTournaments: newState.activeTournaments.filter(
            t => t.tournamentId !== event.eventData.tournamentId
          ),
          recentForm: updatedRecentForm,
          currentStreak: this.updateStreak(newState.currentStreak, isCash, isWin)
        };

      case PlayerEventType.PLAYER_PAYOUT_EARNED:
        return {
          ...newState,
          totalEarnings: newState.totalEarnings + event.eventData.amount,
          biggestCash: Math.max(newState.biggestCash, event.eventData.amount)
        };

      case PlayerEventType.PLAYER_STATISTICS_UPDATED:
        return {
          ...newState,
          ...event.eventData.statistics
        };

      case PlayerEventType.PLAYER_ACHIEVEMENT_UNLOCKED:
        const achievement: PlayerAchievement = {
          id: event.id,
          type: event.eventData.type,
          name: event.eventData.name,
          description: event.eventData.description,
          unlockedAt: event.timestamp,
          tournamentId: event.eventData.tournamentId,
          metadata: event.eventData.metadata
        };

        return {
          ...newState,
          achievements: [...newState.achievements, achievement]
        };

      default:
        return newState;
    }
  }

  private updatePlayerStatistics(
    state: PlayerProjection,
    result: {
      position: number;
      prize: number;
      investment: number;
      playTime: number;
      isCash: boolean;
      isWin: boolean;
      isFinalTable: boolean;
    }
  ): PlayerProjection {
    const newTotalTournaments = state.totalTournaments + 1;
    const newTotalWins = state.totalWins + (result.isWin ? 1 : 0);
    const newTotalCashes = state.totalCashes + (result.isCash ? 1 : 0);
    const newTotalEarnings = state.totalEarnings + result.prize;
    const newNetProfit = newTotalEarnings - state.totalInvestment;
    const newRoi = state.totalInvestment > 0 ? (newNetProfit / state.totalInvestment) * 100 : 0;
    const newItm = (newTotalCashes / newTotalTournaments) * 100;
    const newBestFinish = Math.min(state.bestFinish, result.position);
    const newWorstFinish = Math.max(state.worstFinish, result.position);

    // Calculate new averages
    const newTotalPlayTime = state.totalPlayTime + result.playTime;
    const newAveragePlayTime = newTotalPlayTime / newTotalTournaments;
    const newLongestSession = Math.max(state.longestSession, result.playTime);

    // Calculate average buy-in
    const newAverageBuyIn = state.totalInvestment / newTotalTournaments;

    return {
      ...state,
      totalTournaments: newTotalTournaments,
      totalWins: newTotalWins,
      totalCashes: newTotalCashes,
      totalEarnings: newTotalEarnings,
      netProfit: newNetProfit,
      roi: newRoi,
      itm: newItm,
      bestFinish: newBestFinish,
      worstFinish: newWorstFinish,
      totalPlayTime: newTotalPlayTime,
      averagePlayTime: newAveragePlayTime,
      longestSession: newLongestSession,
      averageBuyIn: newAverageBuyIn,
      biggestLoss: Math.max(state.biggestLoss, Math.abs(Math.min(0, result.prize - result.investment)))
    };
  }

  private updateStreak(
    currentStreak: { type: 'CASH' | 'BUST' | 'WIN'; count: number },
    isCash: boolean,
    isWin: boolean
  ): { type: 'CASH' | 'BUST' | 'WIN'; count: number } {
    let newType: 'CASH' | 'BUST' | 'WIN';

    if (isWin) {
      newType = 'WIN';
    } else if (isCash) {
      newType = 'CASH';
    } else {
      newType = 'BUST';
    }

    if (currentStreak.type === newType) {
      return { type: newType, count: currentStreak.count + 1 };
    } else {
      return { type: newType, count: 1 };
    }
  }

  // Player tournament history projection
  async projectPlayerTournamentHistory(
    organizationId: string,
    playerId: string
  ): Promise<PlayerTournamentHistoryProjection> {
    const events = await this.eventStore.getOrganizationEvents(
      organizationId,
      [
        PlayerEventType.PLAYER_REGISTERED_FOR_TOURNAMENT,
        PlayerEventType.PLAYER_ELIMINATED,
        PlayerEventType.PLAYER_PAYOUT_EARNED,
        PlayerEventType.PLAYER_REBOUGHT,
        PlayerEventType.PLAYER_ADDON_PURCHASED
      ]
    );

    const playerEvents = events.filter(e =>
      e.aggregateId === playerId ||
      e.eventData.playerId === playerId
    );

    return this.calculatePlayerTournamentHistory(playerId, playerEvents);
  }

  private calculatePlayerTournamentHistory(
    playerId: string,
    events: BaseEvent[]
  ): PlayerTournamentHistoryProjection {
    const tournamentResults: Map<string, Partial<TournamentResult>> = new Map();

    for (const event of events) {
      const tournamentId = event.metadata.tournamentId || event.eventData.tournamentId;
      if (!tournamentId) continue;

      let result = tournamentResults.get(tournamentId) || {
        tournamentId,
        tournamentName: '',
        tournamentType: '',
        date: event.timestamp,
        buyIn: 0,
        fee: 0,
        rebuys: 0,
        addons: 0,
        totalInvested: 0,
        prize: 0,
        profit: 0,
        playTime: 0,
        position: 0,
        totalPlayers: 0,
        isCash: false,
        isWin: false,
        isFinalTable: false
      };

      switch (event.eventType) {
        case PlayerEventType.PLAYER_REGISTERED_FOR_TOURNAMENT:
          result.buyIn = event.eventData.buyInAmount;
          result.fee = event.eventData.feeAmount;
          result.totalInvested = event.eventData.buyInAmount + event.eventData.feeAmount;
          result.date = event.eventData.registeredAt;
          break;

        case PlayerEventType.PLAYER_REBOUGHT:
          result.rebuys = (result.rebuys || 0) + 1;
          result.totalInvested = (result.totalInvested || 0) + event.eventData.rebuyAmount;
          break;

        case PlayerEventType.PLAYER_ADDON_PURCHASED:
          result.addons = (result.addons || 0) + 1;
          result.totalInvested = (result.totalInvested || 0) + event.eventData.addonAmount;
          break;

        case PlayerEventType.PLAYER_ELIMINATED:
          result.position = event.eventData.position;
          result.totalPlayers = event.eventData.totalPlayers || 0;
          result.playTime = event.eventData.playTime || 0;
          result.isFinalTable = event.eventData.position <= 9;
          result.isWin = event.eventData.position === 1;
          break;

        case PlayerEventType.PLAYER_PAYOUT_EARNED:
          result.prize = event.eventData.amount;
          result.isCash = event.eventData.amount > 0;
          break;
      }

      result.profit = (result.prize || 0) - (result.totalInvested || 0);
      tournamentResults.set(tournamentId, result);
    }

    const tournaments = Array.from(tournamentResults.values())
      .filter(t => t.position && t.position > 0)
      .map(t => t as TournamentResult)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const summary = {
      totalTournaments: tournaments.length,
      totalEarnings: tournaments.reduce((sum, t) => sum + t.prize, 0),
      totalInvestment: tournaments.reduce((sum, t) => sum + t.totalInvested, 0),
      netProfit: 0,
      roi: 0
    };

    summary.netProfit = summary.totalEarnings - summary.totalInvestment;
    summary.roi = summary.totalInvestment > 0 ? (summary.netProfit / summary.totalInvestment) * 100 : 0;

    return {
      playerId,
      tournaments,
      summary,
      lastUpdated: new Date(),
      version: 0
    };
  }

  // Player statistics projection
  async projectPlayerStatistics(
    organizationId: string,
    playerId: string
  ): Promise<PlayerStatisticsProjection> {
    const history = await this.projectPlayerTournamentHistory(organizationId, playerId);
    return this.calculatePlayerStatistics(playerId, history.tournaments);
  }

  private calculatePlayerStatistics(
    playerId: string,
    tournaments: TournamentResult[]
  ): PlayerStatisticsProjection {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const last365Days = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const overallStats = this.calculateStatsForPeriod(tournaments);

    const trends = {
      last30Days: this.calculateStatsForPeriod(
        tournaments.filter(t => new Date(t.date) >= last30Days)
      ),
      last90Days: this.calculateStatsForPeriod(
        tournaments.filter(t => new Date(t.date) >= last90Days)
      ),
      last365Days: this.calculateStatsForPeriod(
        tournaments.filter(t => new Date(t.date) >= last365Days)
      ),
      allTime: overallStats
    };

    const monthlyStats = this.calculateMonthlyStats(tournaments);
    const recentTournaments = tournaments.slice(0, 10);

    return {
      playerId,
      overallStats,
      monthlyStats,
      trends,
      recentTournaments,
      upcomingTournaments: [], // Would need to be fetched from tournament data
      rankings: {}, // Would need to be calculated against other players
      lastUpdated: new Date(),
      version: 0
    };
  }

  private calculateStatsForPeriod(tournaments: TournamentResult[]): PerformancePeriod {
    if (tournaments.length === 0) {
      return {
        tournaments: 0,
        wins: 0,
        cashes: 0,
        earnings: 0,
        investment: 0,
        netProfit: 0,
        roi: 0,
        itm: 0,
        averageFinish: 0
      };
    }

    const wins = tournaments.filter(t => t.isWin).length;
    const cashes = tournaments.filter(t => t.isCash).length;
    const earnings = tournaments.reduce((sum, t) => sum + t.prize, 0);
    const investment = tournaments.reduce((sum, t) => sum + t.totalInvested, 0);
    const netProfit = earnings - investment;
    const roi = investment > 0 ? (netProfit / investment) * 100 : 0;
    const itm = (cashes / tournaments.length) * 100;
    const averageFinish = tournaments.reduce((sum, t) => sum + t.position, 0) / tournaments.length;

    return {
      tournaments: tournaments.length,
      wins,
      cashes,
      earnings,
      investment,
      netProfit,
      roi,
      itm,
      averageFinish: Math.round(averageFinish * 100) / 100
    };
  }

  private calculateMonthlyStats(tournaments: TournamentResult[]) {
    const monthlyMap = new Map<string, TournamentResult[]>();

    for (const tournament of tournaments) {
      const date = new Date(tournament.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, []);
      }
      monthlyMap.get(key)!.push(tournament);
    }

    return Array.from(monthlyMap.entries())
      .map(([key, tourneys]) => {
        const [year, month] = key.split('-');
        const stats = this.calculateStatsForPeriod(tourneys);

        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' }),
          year: parseInt(year),
          tournaments: stats.tournaments,
          wins: stats.wins,
          cashes: stats.cashes,
          earnings: stats.earnings,
          investment: stats.investment,
          profit: stats.netProfit,
          roi: stats.roi
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return new Date(`${a.month} 1, ${a.year}`).getMonth() - new Date(`${b.month} 1, ${b.year}`).getMonth();
      })
      .slice(0, 12);
  }

  // Projection maintenance methods
  async rebuildPlayerProjection(organizationId: string, playerId: string): Promise<void> {
    const projection = await this.projectPlayer(organizationId, playerId);
    await this.savePlayerProjection(projection);
  }

  private async savePlayerProjection(projection: PlayerProjection): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO player_projections (player_id, organization_id, data, version, updated_at)
        VALUES (${projection.id}, ${projection.organizationId}, ${JSON.stringify(projection)}, ${projection.version}, NOW())
        ON CONFLICT (player_id)
        DO UPDATE SET data = ${JSON.stringify(projection)}, version = ${projection.version}, updated_at = NOW()
      `;
    } catch (error) {
      console.warn('Failed to save player projection:', error);
    }
  }

  // Bulk operations
  async rebuildAllPlayerProjections(organizationId: string): Promise<void> {
    // Get all players for the organization
    const players = await this.prisma.playerProfile.findMany({
      where: {
        user: {
          organizationId
        }
      },
      select: { id: true }
    });

    for (const player of players) {
      await this.rebuildPlayerProjection(organizationId, player.id);
    }
  }
}

export default PlayerProjectionHandler;