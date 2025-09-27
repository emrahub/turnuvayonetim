import { router, organizationProcedure, hasRole } from '../utils/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { TournamentStatus, EntryStatus, TransactionType } from '@prisma/client';
import { ROLE_PERMISSIONS } from '../middleware/auth';

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  period: z.enum(['7d', '30d', '90d', '6m', '1y']).optional(),
});

const tournamentStatsSchema = z.object({
  organizationId: z.string(),
  tournamentId: z.string(),
  includePlayerStats: z.boolean().default(true),
  includeFinancials: z.boolean().default(true),
});

const playerStatsSchema = z.object({
  organizationId: z.string(),
  playerId: z.string(),
  ...dateRangeSchema.shape,
});

const leagueStatsSchema = z.object({
  organizationId: z.string(),
  leagueId: z.string(),
  season: z.string().optional(),
});

export const statsRouter = router({
  // Tournament-specific statistics
  getTournamentStats: organizationProcedure
    .input(tournamentStatsSchema)
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.prisma.tournament.findFirst({
        where: {
          id: input.tournamentId,
          organizationId: input.organizationId,
        },
        include: {
          entries: {
            include: {
              player: true,
              transactions: true,
              eliminations: true,
            },
          },
          transactions: true,
          payouts: true,
          tables: {
            include: {
              seats: {
                include: {
                  entry: true,
                },
              },
            },
          },
          blindStructure: {
            include: {
              levels: {
                orderBy: { idx: 'asc' },
              },
            },
          },
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found',
        });
      }

      // Basic statistics
      const totalEntries = tournament.entries.length;
      const activeEntries = tournament.entries.filter(e => e.status === EntryStatus.ACTIVE).length;
      const eliminatedEntries = tournament.entries.filter(e => e.status === EntryStatus.ELIMINATED).length;

      // Financial statistics
      const transactions = tournament.transactions;
      const buyIns = transactions.filter(t => t.type === TransactionType.BUYIN);
      const rebuys = transactions.filter(t => t.type === TransactionType.REBUY);
      const addons = transactions.filter(t => t.type === TransactionType.ADDON);

      const totalRevenue = transactions
        .filter(t => [TransactionType.BUYIN, TransactionType.REBUY, TransactionType.ADDON].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0);

      const averageBuyIn = buyIns.length > 0 ? buyIns.reduce((sum, t) => sum + t.amount, 0) / buyIns.length : 0;

      // Chip statistics
      const chipCounts = tournament.entries
        .filter(e => e.status === EntryStatus.ACTIVE)
        .map(e => e.chipCount);

      const totalChips = chipCounts.reduce((sum, chips) => sum + chips, 0);
      const averageChips = chipCounts.length > 0 ? totalChips / chipCounts.length : 0;
      const medianChips = chipCounts.length > 0 ?
        chipCounts.sort((a, b) => a - b)[Math.floor(chipCounts.length / 2)] : 0;

      // Table statistics
      const activeTables = tournament.tables.filter(t => t.status === 'ACTIVE').length;
      const playersPerTable = activeTables > 0 ? activeEntries / activeTables : 0;

      // Player elimination data
      const eliminationData = tournament.entries
        .filter(e => e.eliminations.length > 0)
        .map(e => ({
          playerId: e.playerId,
          displayName: e.displayName,
          place: e.eliminations[0]?.place || 0,
          eliminatedAt: e.eliminations[0]?.eliminatedAt,
          chipCount: e.chipCount,
        }))
        .sort((a, b) => a.place - b.place);

      // Payout information
      const payoutInfo = tournament.payouts.map(p => ({
        place: p.place,
        amount: p.amount,
        percentage: p.percentage,
        paid: p.paid,
      }));

      // Duration statistics
      const duration = tournament.endDate && tournament.startDate ?
        tournament.endDate.getTime() - tournament.startDate.getTime() : null;

      const result = {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          status: tournament.status,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          duration,
        },
        participation: {
          totalEntries,
          activeEntries,
          eliminatedEntries,
          registrationRate: totalEntries / (tournament.maxPlayers || totalEntries),
        },
        financial: input.includeFinancials ? {
          totalRevenue,
          averageBuyIn,
          totalBuyIns: buyIns.length,
          totalRebuys: rebuys.length,
          totalAddons: addons.length,
          payouts: payoutInfo,
        } : null,
        chips: {
          totalChips,
          averageChips: Math.round(averageChips),
          medianChips,
          biggestStack: chipCounts.length > 0 ? Math.max(...chipCounts) : 0,
          smallestStack: chipCounts.length > 0 ? Math.min(...chipCounts) : 0,
        },
        tables: {
          activeTables,
          totalTables: tournament.tables.length,
          averagePlayersPerTable: Math.round(playersPerTable * 100) / 100,
        },
        eliminations: eliminationData.slice(0, 20), // Top 20 eliminations
        blindStructure: tournament.blindStructure ? {
          totalLevels: tournament.blindStructure.levels.length,
          currentLevel: null, // Would need clock state to determine
          levels: tournament.blindStructure.levels,
        } : null,
      };

      return result;
    }),

  // Player-specific statistics
  getPlayerStats: organizationProcedure
    .input(playerStatsSchema)
    .query(async ({ input, ctx }) => {
      const { startDate, endDate, period } = input;

      // Calculate date range
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          registeredAt: {
            gte: startDate,
            lte: endDate,
          },
        };
      } else if (period) {
        const periodDays = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '6m': 180,
          '1y': 365,
        }[period];

        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - periodDays);

        dateFilter = {
          registeredAt: { gte: periodStart },
        };
      }

      // Get player entries
      const entries = await ctx.prisma.entry.findMany({
        where: {
          playerId: input.playerId,
          tournament: {
            organizationId: input.organizationId,
          },
          ...dateFilter,
        },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              startDate: true,
              status: true,
              buyIn: true,
            },
          },
          transactions: true,
          eliminations: true,
        },
        orderBy: {
          registeredAt: 'desc',
        },
      });

      if (entries.length === 0) {
        return {
          player: { id: input.playerId },
          summary: {
            totalTournaments: 0,
            totalBuyIns: 0,
            averageFinish: null,
            bestFinish: null,
            winRate: 0,
            profitLoss: 0,
          },
          entries: [],
        };
      }

      // Calculate statistics
      const finishedTournaments = entries.filter(e => e.position !== null);
      const wonTournaments = entries.filter(e => e.position === 1);

      const totalBuyInAmount = entries.reduce((sum, entry) => {
        return sum + entry.transactions
          .filter(t => [TransactionType.BUYIN, TransactionType.REBUY, TransactionType.ADDON].includes(t.type))
          .reduce((entrySum, t) => entrySum + t.amount, 0);
      }, 0);

      const totalWinnings = 0; // Would need payout tracking by player
      const profitLoss = totalWinnings - totalBuyInAmount;

      const averageFinish = finishedTournaments.length > 0 ?
        finishedTournaments.reduce((sum, e) => sum + (e.position || 0), 0) / finishedTournaments.length : null;

      const bestFinish = finishedTournaments.length > 0 ?
        Math.min(...finishedTournaments.map(e => e.position || Infinity)) : null;

      const winRate = finishedTournaments.length > 0 ?
        (wonTournaments.length / finishedTournaments.length) * 100 : 0;

      // Recent form (last 10 tournaments)
      const recentForm = entries.slice(0, 10).map(entry => ({
        tournamentId: entry.tournamentId,
        tournamentName: entry.tournament.name,
        date: entry.registeredAt,
        position: entry.position,
        status: entry.status,
        chipCount: entry.chipCount,
      }));

      return {
        player: {
          id: input.playerId,
        },
        summary: {
          totalTournaments: entries.length,
          finishedTournaments: finishedTournaments.length,
          totalBuyIns: totalBuyInAmount,
          averageFinish: averageFinish ? Math.round(averageFinish * 100) / 100 : null,
          bestFinish,
          winRate: Math.round(winRate * 100) / 100,
          profitLoss,
        },
        performance: {
          recentForm,
          monthlyStats: [], // Could be calculated if needed
        },
        entries: entries.map(entry => ({
          id: entry.id,
          tournament: entry.tournament,
          position: entry.position,
          status: entry.status,
          registeredAt: entry.registeredAt,
          eliminatedAt: entry.eliminatedAt,
          chipCount: entry.chipCount,
          transactions: entry.transactions,
        })),
      };
    }),

  // Organization-wide statistics
  getOrganizationStats: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      ...dateRangeSchema.shape,
    }))
    .query(async ({ input, ctx }) => {
      const { period } = input;

      // Calculate date range
      let dateFilter = {};
      if (period) {
        const periodDays = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '6m': 180,
          '1y': 365,
        }[period];

        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - periodDays);

        dateFilter = {
          createdAt: { gte: periodStart },
        };
      }

      // Parallel queries for efficiency
      const [
        tournamentStats,
        revenueStats,
        memberCount,
        activePlayersCount,
        recentTournaments,
      ] = await Promise.all([
        // Tournament statistics
        ctx.prisma.tournament.groupBy({
          by: ['status'],
          where: {
            organizationId: input.organizationId,
            ...dateFilter,
          },
          _count: true,
        }),

        // Revenue statistics
        ctx.prisma.transaction.aggregate({
          where: {
            tournament: {
              organizationId: input.organizationId,
            },
            type: { in: [TransactionType.BUYIN, TransactionType.REBUY, TransactionType.ADDON] },
            ...dateFilter,
          },
          _sum: { amount: true },
          _count: true,
        }),

        // Member count
        ctx.prisma.userOrganization.count({
          where: {
            organizationId: input.organizationId,
          },
        }),

        // Active players (players who participated in period)
        ctx.prisma.entry.groupBy({
          by: ['playerId'],
          where: {
            tournament: {
              organizationId: input.organizationId,
            },
            ...dateFilter,
          },
          _count: true,
        }),

        // Recent tournaments
        ctx.prisma.tournament.findMany({
          where: {
            organizationId: input.organizationId,
          },
          include: {
            _count: {
              select: {
                entries: true,
              },
            },
          },
          orderBy: {
            startDate: 'desc',
          },
          take: 10,
        }),
      ]);

      // Calculate tournament statistics
      const tournamentsByStatus = tournamentStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>);

      const totalTournaments = tournamentStats.reduce((sum, stat) => sum + stat._count, 0);

      // Calculate growth metrics
      const currentPeriodStart = new Date();
      const previousPeriodStart = new Date();
      const previousPeriodEnd = new Date();

      if (period) {
        const periodDays = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '6m': 180,
          '1y': 365,
        }[period];

        currentPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - (periodDays * 2));
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - periodDays);

        // Get previous period stats for comparison
        const [previousTournaments, previousRevenue] = await Promise.all([
          ctx.prisma.tournament.count({
            where: {
              organizationId: input.organizationId,
              createdAt: {
                gte: previousPeriodStart,
                lt: previousPeriodEnd,
              },
            },
          }),
          ctx.prisma.transaction.aggregate({
            where: {
              tournament: {
                organizationId: input.organizationId,
              },
              type: { in: [TransactionType.BUYIN, TransactionType.REBUY, TransactionType.ADDON] },
              createdAt: {
                gte: previousPeriodStart,
                lt: previousPeriodEnd,
              },
            },
            _sum: { amount: true },
          }),
        ]);

        const tournamentGrowth = previousTournaments > 0 ?
          ((totalTournaments - previousTournaments) / previousTournaments) * 100 : 0;

        const revenueGrowth = previousRevenue._sum.amount && revenueStats._sum.amount ?
          ((revenueStats._sum.amount - previousRevenue._sum.amount) / previousRevenue._sum.amount) * 100 : 0;

        return {
          period: period || 'all_time',
          tournaments: {
            total: totalTournaments,
            byStatus: tournamentsByStatus,
            growth: Math.round(tournamentGrowth * 100) / 100,
          },
          revenue: {
            total: revenueStats._sum.amount || 0,
            transactionCount: revenueStats._count,
            growth: Math.round(revenueGrowth * 100) / 100,
          },
          players: {
            activePlayers: activePlayersCount.length,
            totalMembers: memberCount,
          },
          recentActivity: recentTournaments.map(t => ({
            id: t.id,
            name: t.name,
            status: t.status,
            startDate: t.startDate,
            entryCount: t._count.entries,
          })),
        };
      }

      return {
        period: 'all_time',
        tournaments: {
          total: totalTournaments,
          byStatus: tournamentsByStatus,
        },
        revenue: {
          total: revenueStats._sum.amount || 0,
          transactionCount: revenueStats._count,
        },
        players: {
          activePlayers: activePlayersCount.length,
          totalMembers: memberCount,
        },
        recentActivity: recentTournaments.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          startDate: t.startDate,
          entryCount: t._count.entries,
        })),
      };
    }),

  // League standings and statistics
  getLeagueStats: organizationProcedure
    .input(leagueStatsSchema)
    .query(async ({ input, ctx }) => {
      const league = await ctx.prisma.league.findFirst({
        where: {
          id: input.leagueId,
          organizationId: input.organizationId,
        },
        include: {
          standings: {
            orderBy: {
              points: 'desc',
            },
          },
          events: {
            include: {
              tournament: {
                include: {
                  entries: {
                    include: {
                      player: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!league) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'League not found',
        });
      }

      // Calculate additional statistics
      const totalEvents = league.events.length;
      const completedEvents = league.events.filter(e =>
        e.tournament.status === TournamentStatus.COMPLETED
      ).length;

      const totalParticipants = new Set(
        league.events.flatMap(e =>
          e.tournament.entries.map(entry => entry.playerId).filter(Boolean)
        )
      ).size;

      // Top performers
      const topPerformers = league.standings.slice(0, 10).map(standing => ({
        playerId: standing.playerId,
        points: standing.points,
        events: standing.events,
        wins: standing.wins,
        cashes: standing.cashes,
        averagePoints: standing.events > 0 ? Math.round((standing.points / standing.events) * 100) / 100 : 0,
        winRate: standing.events > 0 ? Math.round((standing.wins / standing.events) * 100 * 100) / 100 : 0,
      }));

      return {
        league: {
          id: league.id,
          name: league.name,
          description: league.description,
          startDate: league.startDate,
          endDate: league.endDate,
          scoringSystem: league.scoringSystem,
        },
        statistics: {
          totalEvents,
          completedEvents,
          totalParticipants,
          averageParticipants: totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0,
        },
        standings: topPerformers,
        recentEvents: league.events
          .sort((a, b) => b.tournament.startDate.getTime() - a.tournament.startDate.getTime())
          .slice(0, 5)
          .map(event => ({
            id: event.tournament.id,
            name: event.tournament.name,
            startDate: event.tournament.startDate,
            status: event.tournament.status,
            participants: event.tournament.entries.length,
            pointsMultiplier: event.pointsMultiplier,
          })),
      };
    }),

  // Export statistics
  exportStats: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
      type: z.enum(['tournaments', 'players', 'revenue', 'league']),
      format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
      ...dateRangeSchema.shape,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!hasRole(ctx.userRole, ROLE_PERMISSIONS.MANAGEMENT)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to export statistics',
        });
      }

      // This would typically generate and return a file URL or stream
      // For now, return a placeholder response
      return {
        success: true,
        message: 'Export functionality not yet implemented',
        type: input.type,
        format: input.format,
        // In a real implementation, this would return a download URL or file stream
      };
    }),

  // Real-time analytics dashboard data
  getDashboardData: organizationProcedure
    .input(z.object({
      organizationId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        liveTournaments,
        todayStats,
        weekStats,
        monthStats,
        upcomingTournaments,
      ] = await Promise.all([
        // Live tournaments
        ctx.prisma.tournament.findMany({
          where: {
            organizationId: input.organizationId,
            status: { in: [TournamentStatus.LIVE, TournamentStatus.PAUSED] },
          },
          include: {
            _count: {
              select: {
                entries: true,
              },
            },
          },
        }),

        // Today's statistics
        ctx.prisma.tournament.count({
          where: {
            organizationId: input.organizationId,
            createdAt: { gte: today },
          },
        }),

        // This week's statistics
        ctx.prisma.tournament.count({
          where: {
            organizationId: input.organizationId,
            createdAt: { gte: thisWeek },
          },
        }),

        // This month's statistics
        ctx.prisma.transaction.aggregate({
          where: {
            tournament: {
              organizationId: input.organizationId,
            },
            createdAt: { gte: thisMonth },
            type: { in: [TransactionType.BUYIN, TransactionType.REBUY, TransactionType.ADDON] },
          },
          _sum: { amount: true },
        }),

        // Upcoming tournaments
        ctx.prisma.tournament.findMany({
          where: {
            organizationId: input.organizationId,
            status: TournamentStatus.SCHEDULED,
            startDate: { gte: now },
          },
          orderBy: {
            startDate: 'asc',
          },
          take: 5,
          include: {
            _count: {
              select: {
                entries: true,
              },
            },
          },
        }),
      ]);

      return {
        live: {
          tournaments: liveTournaments.map(t => ({
            id: t.id,
            name: t.name,
            status: t.status,
            participants: t._count.entries,
          })),
          totalLive: liveTournaments.length,
        },
        quick_stats: {
          tournamentsToday: todayStats,
          tournamentsThisWeek: weekStats,
          revenueThisMonth: monthStats._sum.amount || 0,
        },
        upcoming: upcomingTournaments.map(t => ({
          id: t.id,
          name: t.name,
          startDate: t.startDate,
          registrations: t._count.entries,
        })),
        last_updated: now,
      };
    }),
});