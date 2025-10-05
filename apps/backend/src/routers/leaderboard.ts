import { z } from 'zod';
import { router, publicProcedure } from '../utils/trpc';
import { TRPCError } from '@trpc/server';

/**
 * Leaderboard Router
 * Oyuncu sıralaması ve istatistikleri için tRPC endpoints
 */

export const leaderboardRouter = router({
  /**
   * Oyuncu sıralaması
   */
  getLeaderboard: publicProcedure
    .input(z.object({
      sortBy: z.enum(['points', 'winnings', 'wins', 'roi']).default('points'),
      timeRange: z.enum(['week', 'month', 'year', 'all']).default('all'),
      limit: z.number().min(1).max(100).default(50)
    }))
    .query(async ({ input, ctx }) => {
      const { sortBy, timeRange, limit } = input;

      // Zaman filtresi
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(0);
          break;
      }

      // Oyuncu istatistiklerini hesapla
      const players = await ctx.prisma.player.findMany({
        include: {
          Entry: {
            where: {
              registeredAt: {
                gte: startDate
              }
            },
            include: {
              Tournament: {
                include: {
                  Payout: true
                }
              },
              Elimination: true
            }
          }
        }
      });

      const playerStats = players.map(player => {
        const entries = player.Entry;
        const totalTournaments = entries.length;
        const wins = entries.filter(e => e.position === 1).length;
        const cashes = entries.filter(e => e.position && e.position <= 10).length; // Top 10

        // Toplam buy-in ve kazanç hesapla
        const totalBuyins = entries.reduce((sum, e) => sum + e.Tournament.buyIn, 0);
        const totalWinnings = entries.reduce((sum, e) => {
          const payout = e.Tournament.Payout.find(p => p.place === e.position);
          return sum + (payout?.amount || 0);
        }, 0);

        const roi = totalBuyins > 0 ? ((totalWinnings - totalBuyins) / totalBuyins) * 100 : 0;

        // Ortalama sıralama
        const finishes = entries.filter(e => e.position).map(e => e.position!);
        const avgFinish = finishes.length > 0
          ? finishes.reduce((sum, pos) => sum + pos, 0) / finishes.length
          : 0;

        const bestFinish = finishes.length > 0 ? Math.min(...finishes) : 0;

        // Puan hesaplama (basit sistem: 1. = 100 puan, 2. = 75 puan, 3. = 50 puan, vs.)
        const points = entries.reduce((sum, e) => {
          if (!e.position) return sum;
          if (e.position === 1) return sum + 100;
          if (e.position === 2) return sum + 75;
          if (e.position === 3) return sum + 50;
          if (e.position <= 10) return sum + (20 - e.position * 2);
          return sum + 5;
        }, 0);

        return {
          id: player.id,
          name: player.nickname || `${player.firstName} ${player.lastName}`,
          totalTournaments,
          wins,
          cashes,
          totalBuyins,
          totalWinnings,
          roi,
          avgFinish,
          bestFinish: bestFinish || 999,
          points
        };
      });

      // Sıralama
      let sortedPlayers = playerStats;
      switch (sortBy) {
        case 'points':
          sortedPlayers.sort((a, b) => b.points - a.points);
          break;
        case 'winnings':
          sortedPlayers.sort((a, b) => b.totalWinnings - a.totalWinnings);
          break;
        case 'wins':
          sortedPlayers.sort((a, b) => b.wins - a.wins);
          break;
        case 'roi':
          sortedPlayers.sort((a, b) => b.roi - a.roi);
          break;
      }

      return sortedPlayers.slice(0, limit);
    }),

  /**
   * Oyuncu detaylı istatistikleri
   */
  getPlayerDetails: publicProcedure
    .input(z.object({
      playerId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const player = await ctx.prisma.player.findUnique({
        where: { id: input.playerId },
        include: {
          Entry: {
            include: {
              Tournament: {
                include: {
                  Payout: true
                }
              },
              Elimination: true
            },
            orderBy: {
              registeredAt: 'desc'
            }
          }
        }
      });

      if (!player) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Player not found'
        });
      }

      const entries = player.Entry;

      // Detaylı istatistikler
      const stats = {
        totalTournaments: entries.length,
        wins: entries.filter(e => e.position === 1).length,
        topThree: entries.filter(e => e.position && e.position <= 3).length,
        cashes: entries.filter(e => e.position && e.position <= 10).length,
        eliminations: entries.filter(e => e.status === 'ELIMINATED').length,

        totalBuyins: entries.reduce((sum, e) => sum + e.Tournament.buyIn, 0),
        totalWinnings: entries.reduce((sum, e) => {
          const payout = e.Tournament.Payout.find(p => p.place === e.position);
          return sum + (payout?.amount || 0);
        }, 0),

        avgFinish: entries.filter(e => e.position).length > 0
          ? entries.filter(e => e.position).reduce((sum, e) => sum + e.position!, 0) / entries.filter(e => e.position).length
          : 0,

        bestFinish: Math.min(...entries.filter(e => e.position).map(e => e.position!)) || 0,
        worstFinish: Math.max(...entries.filter(e => e.position).map(e => e.position!)) || 0,

        // Son 10 turnuva trendi
        recentForm: entries.slice(0, 10).map(e => ({
          tournamentName: e.Tournament.name,
          position: e.position,
          prize: e.Tournament.Payout.find(p => p.place === e.position)?.amount || 0,
          date: e.registeredAt
        }))
      };

      const roi = stats.totalBuyins > 0
        ? ((stats.totalWinnings - stats.totalBuyins) / stats.totalBuyins) * 100
        : 0;

      return {
        player: {
          id: player.id,
          name: player.nickname || `${player.firstName} ${player.lastName}`,
          email: player.email,
          photoUrl: player.photoUrl
        },
        stats: {
          ...stats,
          roi,
          profitLoss: stats.totalWinnings - stats.totalBuyins,
          winRate: stats.totalTournaments > 0
            ? (stats.wins / stats.totalTournaments) * 100
            : 0,
          cashRate: stats.totalTournaments > 0
            ? (stats.cashes / stats.totalTournaments) * 100
            : 0
        }
      };
    }),

  /**
   * Oyuncu karşılaştırma
   */
  comparePlayers: publicProcedure
    .input(z.object({
      playerIds: z.array(z.string()).min(2).max(5)
    }))
    .query(async ({ input, ctx }) => {
      const playersData = await Promise.all(
        input.playerIds.map(async (playerId) => {
          const player = await ctx.prisma.player.findUnique({
            where: { id: playerId },
            include: {
              Entry: {
                include: {
                  Tournament: {
                    include: {
                      Payout: true
                    }
                  }
                }
              }
            }
          });

          if (!player) return null;

          const entries = player.Entry;
          const wins = entries.filter(e => e.position === 1).length;
          const totalBuyins = entries.reduce((sum, e) => sum + e.Tournament.buyIn, 0);
          const totalWinnings = entries.reduce((sum, e) => {
            const payout = e.Tournament.Payout.find(p => p.place === e.position);
            return sum + (payout?.amount || 0);
          }, 0);

          return {
            id: player.id,
            name: player.nickname || `${player.firstName} ${player.lastName}`,
            totalTournaments: entries.length,
            wins,
            totalWinnings,
            roi: totalBuyins > 0 ? ((totalWinnings - totalBuyins) / totalBuyins) * 100 : 0,
            avgFinish: entries.filter(e => e.position).length > 0
              ? entries.filter(e => e.position).reduce((sum, e) => sum + e.position!, 0) / entries.filter(e => e.position).length
              : 0
          };
        })
      );

      return playersData.filter(Boolean);
    }),

  /**
   * Haftalık/Aylık en iyi performans gösteren oyuncular
   */
  getHotPlayers: publicProcedure
    .input(z.object({
      period: z.enum(['week', 'month']).default('week'),
      limit: z.number().min(1).max(20).default(10)
    }))
    .query(async ({ input, ctx }) => {
      const now = new Date();
      const startDate = new Date();

      if (input.period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setMonth(now.getMonth() - 1);
      }

      const recentEntries = await ctx.prisma.entry.findMany({
        where: {
          registeredAt: {
            gte: startDate
          }
        },
        include: {
          Player: true,
          Tournament: {
            include: {
              Payout: true
            }
          }
        }
      });

      // Oyuncuları grupla ve performanslarını hesapla
      const playerPerformance = new Map<string, {
        player: any;
        tournaments: number;
        wins: number;
        winnings: number;
      }>();

      for (const entry of recentEntries) {
        if (!entry.Player) continue;

        const playerId = entry.Player.id;
        const existing = playerPerformance.get(playerId) || {
          player: entry.Player,
          tournaments: 0,
          wins: 0,
          winnings: 0
        };

        existing.tournaments++;
        if (entry.position === 1) existing.wins++;

        const payout = entry.Tournament.Payout.find(p => p.place === entry.position);
        if (payout) existing.winnings += payout.amount;

        playerPerformance.set(playerId, existing);
      }

      // Sırala (kazanç bazlı)
      const hotPlayers = Array.from(playerPerformance.values())
        .sort((a, b) => b.winnings - a.winnings)
        .slice(0, input.limit)
        .map(p => ({
          id: p.player.id,
          name: p.player.nickname || `${p.player.firstName} ${p.player.lastName}`,
          tournaments: p.tournaments,
          wins: p.wins,
          winnings: p.winnings,
          winRate: p.tournaments > 0 ? (p.wins / p.tournaments) * 100 : 0
        }));

      return hotPlayers;
    })
});
