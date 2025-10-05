/**
 * Hand History Recording Service
 * Poker el geçmişi kayıt ve replay sistemi
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface HandPlayer {
  id: string;
  name: string;
  position: number; // 0-8 (dealer button'a göre)
  chips: number;
  cards?: string[]; // ['As', 'Kh'] - Sadece showdown'da
}

export interface HandAction {
  type: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  playerId: string;
  amount?: number;
  timestamp: Date;
  street: 'preflop' | 'flop' | 'turn' | 'river';
}

export interface HandWinner {
  playerId: string;
  amount: number;
  handRank?: string; // 'Royal Flush', 'Straight Flush', etc.
}

export interface HandHistoryData {
  tournamentId: string;
  tableId?: string;
  handNumber: number;
  timestamp: Date;
  players: HandPlayer[];
  actions: HandAction[];
  board?: string[]; // Community cards ['Ah', '2d', '3c', '4s', '5h']
  winners: HandWinner[];
  potSize: number;
  metadata?: {
    dealerPosition: number;
    smallBlindAmount: number;
    bigBlindAmount: number;
    anteAmount?: number;
  };
}

export class HandHistoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * El geçmişini kaydet
   */
  async recordHand(data: HandHistoryData): Promise<void> {
    try {
      await this.prisma.handHistory.create({
        data: {
          id: uuidv4(),
          tournamentId: data.tournamentId,
          tableId: data.tableId,
          handNumber: data.handNumber,
          timestamp: data.timestamp,
          players: JSON.stringify(data.players),
          actions: JSON.stringify(data.actions),
          board: data.board ? JSON.stringify(data.board) : null,
          winners: JSON.stringify(data.winners),
          potSize: data.potSize,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      });

      console.log(`✅ Hand #${data.handNumber} recorded for tournament ${data.tournamentId}`);
    } catch (error) {
      console.error('❌ Error recording hand history:', error);
      throw error;
    }
  }

  /**
   * Turnuva el geçmişini getir
   */
  async getTournamentHands(
    tournamentId: string,
    options?: {
      limit?: number;
      offset?: number;
      tableId?: string;
    }
  ) {
    const where: any = { tournamentId };
    if (options?.tableId) {
      where.tableId = options.tableId;
    }

    const hands = await this.prisma.handHistory.findMany({
      where,
      orderBy: {
        handNumber: 'asc'
      },
      skip: options?.offset || 0,
      take: options?.limit || 100
    });

    return hands.map(hand => ({
      id: hand.id,
      tournamentId: hand.tournamentId,
      tableId: hand.tableId,
      handNumber: hand.handNumber,
      timestamp: hand.timestamp,
      players: JSON.parse(hand.players as string) as HandPlayer[],
      actions: JSON.parse(hand.actions as string) as HandAction[],
      board: hand.board ? JSON.parse(hand.board as string) as string[] : undefined,
      winners: JSON.parse(hand.winners as string) as HandWinner[],
      potSize: hand.potSize,
      metadata: hand.metadata ? JSON.parse(hand.metadata as string) : undefined
    }));
  }

  /**
   * Belirli bir eli getir
   */
  async getHand(handId: string) {
    const hand = await this.prisma.handHistory.findUnique({
      where: { id: handId }
    });

    if (!hand) {
      throw new Error('Hand not found');
    }

    return {
      id: hand.id,
      tournamentId: hand.tournamentId,
      tableId: hand.tableId,
      handNumber: hand.handNumber,
      timestamp: hand.timestamp,
      players: JSON.parse(hand.players as string) as HandPlayer[],
      actions: JSON.parse(hand.actions as string) as HandAction[],
      board: hand.board ? JSON.parse(hand.board as string) as string[] : undefined,
      winners: JSON.parse(hand.winners as string) as HandWinner[],
      potSize: hand.potSize,
      metadata: hand.metadata ? JSON.parse(hand.metadata as string) : undefined
    };
  }

  /**
   * Oyuncu bazlı el geçmişi
   */
  async getPlayerHands(
    playerId: string,
    options?: {
      limit?: number;
      tournamentId?: string;
    }
  ) {
    const where: any = {};
    if (options?.tournamentId) {
      where.tournamentId = options.tournamentId;
    }

    const hands = await this.prisma.handHistory.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: options?.limit || 50
    });

    // Oyuncunun yer aldığı elleri filtrele
    const playerHands = hands.filter(hand => {
      const players = JSON.parse(hand.players as string) as HandPlayer[];
      return players.some(p => p.id === playerId);
    });

    return playerHands.map(hand => ({
      id: hand.id,
      tournamentId: hand.tournamentId,
      tableId: hand.tableId,
      handNumber: hand.handNumber,
      timestamp: hand.timestamp,
      players: JSON.parse(hand.players as string) as HandPlayer[],
      actions: JSON.parse(hand.actions as string) as HandAction[],
      board: hand.board ? JSON.parse(hand.board as string) as string[] : undefined,
      winners: JSON.parse(hand.winners as string) as HandWinner[],
      potSize: hand.potSize,
      metadata: hand.metadata ? JSON.parse(hand.metadata as string) : undefined
    }));
  }

  /**
   * İstatistik hesaplama
   */
  async getHandStatistics(tournamentId: string) {
    const hands = await this.prisma.handHistory.findMany({
      where: { tournamentId }
    });

    const totalHands = hands.length;
    let totalPot = 0;
    let totalActions = 0;
    const playerStats = new Map<string, {
      hands: number;
      wins: number;
      totalWon: number;
      actions: number;
    }>();

    for (const hand of hands) {
      totalPot += hand.potSize || 0;

      const players = JSON.parse(hand.players as string) as HandPlayer[];
      const actions = JSON.parse(hand.actions as string) as HandAction[];
      const winners = JSON.parse(hand.winners as string) as HandWinner[];

      totalActions += actions.length;

      for (const player of players) {
        const stats = playerStats.get(player.id) || {
          hands: 0,
          wins: 0,
          totalWon: 0,
          actions: 0
        };

        stats.hands++;
        stats.actions += actions.filter(a => a.playerId === player.id).length;

        const win = winners.find(w => w.playerId === player.id);
        if (win) {
          stats.wins++;
          stats.totalWon += win.amount;
        }

        playerStats.set(player.id, stats);
      }
    }

    return {
      totalHands,
      avgPotSize: totalHands > 0 ? Math.round(totalPot / totalHands) : 0,
      avgActionsPerHand: totalHands > 0 ? Math.round(totalActions / totalHands) : 0,
      playerStatistics: Array.from(playerStats.entries()).map(([playerId, stats]) => ({
        playerId,
        ...stats,
        winRate: stats.hands > 0 ? (stats.wins / stats.hands) * 100 : 0,
        avgWinAmount: stats.wins > 0 ? Math.round(stats.totalWon / stats.wins) : 0
      }))
    };
  }

  /**
   * Export to text format (poker standard)
   */
  exportToText(hand: any): string {
    const { handNumber, timestamp, players, actions, board, winners, potSize, metadata } = hand;

    let text = `***** Hand History for Hand #${handNumber} *****\n`;
    text += `Timestamp: ${timestamp.toISOString()}\n`;
    text += `Pot: ${potSize}\n\n`;

    // Metadata
    if (metadata) {
      text += `Dealer Position: ${metadata.dealerPosition}\n`;
      text += `Blinds: ${metadata.smallBlindAmount}/${metadata.bigBlindAmount}\n`;
      if (metadata.anteAmount) {
        text += `Ante: ${metadata.anteAmount}\n`;
      }
      text += `\n`;
    }

    // Players
    text += `Players (${players.length}):\n`;
    for (const player of players) {
      text += `  Seat ${player.position}: ${player.name} (${player.chips} chips)\n`;
    }
    text += `\n`;

    // Actions by street
    const streets = ['preflop', 'flop', 'turn', 'river'];
    for (const street of streets) {
      const streetActions = actions.filter((a: HandAction) => a.street === street);
      if (streetActions.length === 0) continue;

      text += `*** ${street.toUpperCase()} ***\n`;
      if (street !== 'preflop' && board) {
        const cards = {
          flop: board.slice(0, 3),
          turn: board.slice(0, 4),
          river: board
        };
        text += `Board: [${cards[street as keyof typeof cards].join(' ')}]\n`;
      }

      for (const action of streetActions) {
        const player = players.find((p: HandPlayer) => p.id === action.playerId);
        text += `  ${player?.name} ${action.type}`;
        if (action.amount) {
          text += ` ${action.amount}`;
        }
        text += `\n`;
      }
      text += `\n`;
    }

    // Winners
    text += `*** SUMMARY ***\n`;
    text += `Total Pot: ${potSize}\n`;
    if (board) {
      text += `Board: [${board.join(' ')}]\n`;
    }
    for (const winner of winners) {
      const player = players.find((p: HandPlayer) => p.id === winner.playerId);
      text += `${player?.name} wins ${winner.amount}`;
      if (winner.handRank) {
        text += ` with ${winner.handRank}`;
      }
      text += `\n`;
    }

    return text;
  }
}
