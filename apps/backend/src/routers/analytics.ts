import { z } from 'zod';
import { router, publicProcedure } from '../utils/trpc';
import { TRPCError } from '@trpc/server';

/**
 * Analytics Router
 * Turnuva istatistikleri ve analizler için tRPC endpoints
 */

export const analyticsRouter = router({
  /**
   * Turnuva geçmişi ve trendleri
   */
  getTournamentHistory: publicProcedure
    .input(z.object({
      timeRange: z.enum(['day', 'week', 'month', 'all']).default('week'),
      limit: z.number().min(1).max(100).default(30)
    }))
    .query(async ({ input, ctx }) => {
      const { timeRange, limit } = input;

      // Zaman aralığını hesapla
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'all':
          startDate = new Date(0); // Epoch
          break;
      }

      // Turnuvaları tarih bazında grupla
      const tournaments = await ctx.prisma.tournament.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          Entry: {
            select: {
              id: true,
              chipCount: true,
              status: true
            }
          },
          Payout: {
            select: {
              amount: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: limit
      });

      // Günlük istatistikleri hesapla
      const dailyStats = tournaments.reduce((acc, tournament) => {
        const date = tournament.createdAt.toISOString().split('T')[0];

        if (!acc[date]) {
          acc[date] = {
            date,
            tournaments: 0,
            players: 0,
            prizePool: 0
          };
        }

        acc[date].tournaments++;
        acc[date].players += tournament.Entry.length;
        acc[date].prizePool += tournament.Payout.reduce((sum, p) => sum + p.amount, 0);

        return acc;
      }, {} as Record<string, { date: string; tournaments: number; players: number; prizePool: number }>);

      return Object.values(dailyStats);
    }),

  /**
   * Oyuncu durum istatistikleri
   */
  getPlayerStats: publicProcedure
    .input(z.object({
      tournamentId: z.string().optional()
    }))
    .query(async ({ input, ctx }) => {
      const where = input.tournamentId
        ? { tournamentId: input.tournamentId }
        : {};

      const entries = await ctx.prisma.entry.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true
        }
      });

      const stats = entries.map(entry => ({
        name: entry.status,
        value: entry._count.status,
        color: entry.status === 'ACTIVE' ? '#0D7938' :
               entry.status === 'ELIMINATED' ? '#C53030' : '#FFD700'
      }));

      return stats;
    }),

  /**
   * Top oyuncular (chip count bazlı)
   */
  getTopPlayers: publicProcedure
    .input(z.object({
      tournamentId: z.string().optional(),
      limit: z.number().min(1).max(100).default(10)
    }))
    .query(async ({ input, ctx }) => {
      const { tournamentId, limit } = input;

      const where = tournamentId
        ? { tournamentId, status: 'ACTIVE' as const }
        : { status: 'ACTIVE' as const };

      const entries = await ctx.prisma.entry.findMany({
        where,
        include: {
          Player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nickname: true
            }
          }
        },
        orderBy: {
          chipCount: 'desc'
        },
        take: limit
      });

      return entries.map((entry, index) => ({
        rank: index + 1,
        name: entry.Player?.nickname || entry.displayName,
        chips: entry.chipCount,
        status: entry.status
      }));
    }),

  /**
   * Turnuva özet istatistikleri
   */
  getTournamentSummary: publicProcedure
    .input(z.object({
      tournamentId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.prisma.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          Entry: {
            select: {
              status: true,
              chipCount: true
            }
          },
          Payout: {
            select: {
              amount: true
            }
          },
          BlindStructure: {
            include: {
              BlindLevel: {
                orderBy: {
                  idx: 'asc'
                }
              }
            }
          }
        }
      });

      if (!tournament) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tournament not found'
        });
      }

      const totalPlayers = tournament.Entry.length;
      const activePlayers = tournament.Entry.filter(e => e.status === 'ACTIVE').length;
      const totalChips = tournament.Entry.reduce((sum, e) => sum + e.chipCount, 0);
      const avgStack = totalPlayers > 0 ? Math.round(totalChips / totalPlayers) : 0;
      const prizePool = tournament.Payout.reduce((sum, p) => sum + p.amount, 0);

      return {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        totalPlayers,
        activePlayers,
        totalChips,
        avgStack,
        prizePool,
        buyIn: tournament.buyIn,
        startingStack: tournament.startingStack,
        currentLevel: tournament.BlindStructure?.BlindLevel?.[0] || null
      };
    }),

  /**
   * Günlük/Haftalık/Aylık özet raporlar
   */
  getPerformanceMetrics: publicProcedure
    .input(z.object({
      period: z.enum(['daily', 'weekly', 'monthly']).default('daily')
    }))
    .query(async ({ input, ctx }) => {
      const now = new Date();
      let startDate = new Date();

      switch (input.period) {
        case 'daily':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const [
        totalTournaments,
        totalPlayers,
        totalPrizePool,
        activeTournaments
      ] = await Promise.all([
        ctx.prisma.tournament.count({
          where: {
            createdAt: { gte: startDate }
          }
        }),
        ctx.prisma.entry.count({
          where: {
            registeredAt: { gte: startDate }
          }
        }),
        ctx.prisma.payout.aggregate({
          where: {
            Tournament: {
              createdAt: { gte: startDate }
            }
          },
          _sum: {
            amount: true
          }
        }),
        ctx.prisma.tournament.count({
          where: {
            status: 'LIVE'
          }
        })
      ]);

      return {
        period: input.period,
        startDate,
        endDate: now,
        metrics: {
          totalTournaments,
          totalPlayers,
          totalPrizePool: totalPrizePool._sum.amount || 0,
          activeTournaments,
          avgPlayersPerTournament: totalTournaments > 0
            ? Math.round(totalPlayers / totalTournaments)
            : 0
        }
      };
    }),

  /**
   * Gerçek zamanlı turnuva metrikleri
   */
  getLiveMetrics: publicProcedure
    .query(async ({ ctx }) => {
      const [
        liveTournaments,
        totalActivePlayers,
        recentEliminations
      ] = await Promise.all([
        ctx.prisma.tournament.findMany({
          where: {
            status: 'LIVE'
          },
          select: {
            id: true,
            name: true,
            Entry: {
              where: {
                status: 'ACTIVE'
              },
              select: {
                id: true
              }
            }
          }
        }),
        ctx.prisma.entry.count({
          where: {
            status: 'ACTIVE'
          }
        }),
        ctx.prisma.elimination.findMany({
          where: {
            eliminatedAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Son 5 dakika
            }
          },
          take: 10,
          orderBy: {
            eliminatedAt: 'desc'
          },
          include: {
            Entry: {
              select: {
                displayName: true
              }
            }
          }
        })
      ]);

      return {
        liveTournaments: liveTournaments.map(t => ({
          id: t.id,
          name: t.name,
          activePlayers: t.Entry.length
        })),
        totalActivePlayers,
        recentEliminations: recentEliminations.map(e => ({
          playerName: e.Entry.displayName,
          place: e.place,
          eliminatedAt: e.eliminatedAt
        }))
      };
    })
});
