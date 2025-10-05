/**
 * Swiss Pairing Service
 * Turnuva eşleştirme algoritmaları (Swiss, Round-Robin, Single/Double Elimination)
 */

export type PairingMethod = 'swiss' | 'round-robin' | 'single-elimination' | 'double-elimination';

export interface Player {
  id: string;
  name: string;
  rating?: number;
  wins: number;
  losses: number;
  draws: number;
  score: number; // Kazanç puanı (win=1, draw=0.5, loss=0)
  opponents: string[]; // Daha önce karşılaştığı oyuncular
  colors?: ('white' | 'black')[]; // Satranç için renk geçmişi
}

export interface Pairing {
  round: number;
  table: number;
  player1: Player;
  player2: Player | null; // Bye için null olabilir
  result?: 'player1' | 'player2' | 'draw';
}

export interface TournamentStanding {
  rank: number;
  player: Player;
  tiebreakers: {
    buchholz?: number; // Rakiplerin toplam puanı
    sonnebornBerger?: number; // Ağırlıklı rakip puanı
    cumulative?: number; // Kümülatif puan
  };
}

/**
 * Swiss Pairing Algoritması
 * Aynı puan grubundaki oyuncuları eşleştirir, daha önce eşleşmemişleri önceliklendirir
 */
export class SwissPairingService {
  /**
   * Yeni round için eşleştirme oluştur
   */
  static generatePairings(players: Player[], round: number): Pairing[] {
    const pairings: Pairing[] = [];
    const availablePlayers = [...players].sort((a, b) => {
      // Önce puana göre sırala (büyükten küçüğe)
      if (b.score !== a.score) return b.score - a.score;
      // Eşitse rating'e göre
      return (b.rating || 1500) - (a.rating || 1500);
    });

    const paired = new Set<string>();
    let tableNumber = 1;

    while (availablePlayers.length > 0) {
      const player1 = availablePlayers.find(p => !paired.has(p.id));
      if (!player1) break;

      paired.add(player1.id);

      // Player1 ile eşleşmemiş, yakın puanlı oyuncu bul
      const player2 = availablePlayers.find(p =>
        !paired.has(p.id) &&
        !player1.opponents.includes(p.id) &&
        Math.abs(p.score - player1.score) <= 1 // Maksimum 1 puan farkı
      );

      if (player2) {
        paired.add(player2.id);
        pairings.push({
          round,
          table: tableNumber++,
          player1,
          player2
        });
      } else {
        // Bye (tek kalan oyuncu)
        pairings.push({
          round,
          table: tableNumber++,
          player1,
          player2: null
        });
      }
    }

    return pairings;
  }

  /**
   * Round sonuçlarını kaydet ve oyuncu skorlarını güncelle
   */
  static recordResults(players: Player[], pairings: Pairing[]): Player[] {
    const updatedPlayers = new Map(players.map(p => [p.id, { ...p }]));

    for (const pairing of pairings) {
      if (!pairing.result) continue;

      const p1 = updatedPlayers.get(pairing.player1.id);
      const p2 = pairing.player2 ? updatedPlayers.get(pairing.player2.id) : null;

      if (!p1) continue;

      if (pairing.result === 'player1') {
        p1.wins++;
        p1.score += 1;
        if (p2) {
          p2.losses++;
          p2.opponents.push(p1.id);
          p1.opponents.push(p2.id);
        }
      } else if (pairing.result === 'player2' && p2) {
        p2.wins++;
        p2.score += 1;
        p1.losses++;
        p1.opponents.push(p2.id);
        p2.opponents.push(p1.id);
      } else if (pairing.result === 'draw' && p2) {
        p1.draws++;
        p1.score += 0.5;
        p2.draws++;
        p2.score += 0.5;
        p1.opponents.push(p2.id);
        p2.opponents.push(p1.id);
      }
    }

    return Array.from(updatedPlayers.values());
  }

  /**
   * Sıralama tablosu oluştur (tiebreakers ile)
   */
  static generateStandings(players: Player[], allPairings: Pairing[][]): TournamentStanding[] {
    const standings: TournamentStanding[] = players.map(player => {
      const tiebreakers = this.calculateTiebreakers(player, players, allPairings);
      return {
        rank: 0, // Sonra hesaplanacak
        player,
        tiebreakers
      };
    });

    // Sıralama: Score → Buchholz → Sonneborn-Berger → Rating
    standings.sort((a, b) => {
      if (b.player.score !== a.player.score) return b.player.score - a.player.score;
      if (b.tiebreakers.buchholz !== a.tiebreakers.buchholz) {
        return (b.tiebreakers.buchholz || 0) - (a.tiebreakers.buchholz || 0);
      }
      if (b.tiebreakers.sonnebornBerger !== a.tiebreakers.sonnebornBerger) {
        return (b.tiebreakers.sonnebornBerger || 0) - (a.tiebreakers.sonnebornBerger || 0);
      }
      return (b.player.rating || 1500) - (a.player.rating || 1500);
    });

    // Rank numaralarını ata
    standings.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    return standings;
  }

  /**
   * Tiebreaker hesaplamaları
   */
  private static calculateTiebreakers(
    player: Player,
    allPlayers: Player[],
    allPairings: Pairing[][]
  ) {
    const playerMap = new Map(allPlayers.map(p => [p.id, p]));

    // Buchholz: Rakiplerin toplam puanı
    const buchholz = player.opponents.reduce((sum, oppId) => {
      const opponent = playerMap.get(oppId);
      return sum + (opponent?.score || 0);
    }, 0);

    // Sonneborn-Berger: Kazanılan maçlardaki rakip puanları + berabere kalan rakip puanlarının yarısı
    let sonnebornBerger = 0;
    for (const roundPairings of allPairings) {
      const pairing = roundPairings.find(p =>
        p.player1.id === player.id || p.player2?.id === player.id
      );

      if (!pairing || !pairing.result) continue;

      const isPlayer1 = pairing.player1.id === player.id;
      const opponent = isPlayer1 ? pairing.player2 : pairing.player1;

      if (!opponent) continue;

      if (
        (isPlayer1 && pairing.result === 'player1') ||
        (!isPlayer1 && pairing.result === 'player2')
      ) {
        sonnebornBerger += opponent.score;
      } else if (pairing.result === 'draw') {
        sonnebornBerger += opponent.score * 0.5;
      }
    }

    // Cumulative: Round bazında kümülatif puan
    const cumulative = allPairings.reduce((sum, roundPairings) => {
      const pairing = roundPairings.find(p =>
        p.player1.id === player.id || p.player2?.id === player.id
      );
      if (!pairing || !pairing.result) return sum;

      const isPlayer1 = pairing.player1.id === player.id;
      if (
        (isPlayer1 && pairing.result === 'player1') ||
        (!isPlayer1 && pairing.result === 'player2')
      ) {
        return sum + 1;
      } else if (pairing.result === 'draw') {
        return sum + 0.5;
      }
      return sum;
    }, 0);

    return { buchholz, sonnebornBerger, cumulative };
  }
}

/**
 * Round-Robin Pairing Service
 * Her oyuncu herkesle bir kez eşleşir
 */
export class RoundRobinService {
  /**
   * Tam round-robin turnuvası için tüm eşleştirmeleri oluştur
   */
  static generateAllRounds(players: Player[]): Pairing[][] {
    const n = players.length;
    const rounds: Pairing[][] = [];

    // Tek sayıda oyuncu varsa dummy ekle
    const playerList = n % 2 === 1 ? [...players, null] : [...players];
    const totalPlayers = playerList.length;
    const totalRounds = totalPlayers - 1;

    for (let round = 0; round < totalRounds; round++) {
      const roundPairings: Pairing[] = [];

      for (let i = 0; i < totalPlayers / 2; i++) {
        const p1Index = i;
        const p2Index = totalPlayers - 1 - i;

        const player1 = playerList[p1Index];
        const player2 = playerList[p2Index];

        // Dummy (null) ile eşleşme atla
        if (player1 && player2) {
          roundPairings.push({
            round: round + 1,
            table: i + 1,
            player1,
            player2
          });
        } else if (player1) {
          // Bye
          roundPairings.push({
            round: round + 1,
            table: i + 1,
            player1,
            player2: null
          });
        }
      }

      rounds.push(roundPairings);

      // Rotate: İlk oyuncu sabit, diğerleri saat yönünde döner
      if (round < totalRounds - 1) {
        const temp = playerList[1];
        for (let i = 1; i < totalPlayers - 1; i++) {
          playerList[i] = playerList[i + 1];
        }
        playerList[totalPlayers - 1] = temp;
      }
    }

    return rounds;
  }
}

/**
 * Single Elimination Bracket Service
 * Klasik eleme usulü turnuva
 */
export class SingleEliminationService {
  /**
   * Tek eleme bracket oluştur
   */
  static generateBracket(players: Player[]): Pairing[][] {
    const rounds: Pairing[][] = [];
    let currentPlayers = [...players].sort((a, b) => (b.rating || 1500) - (a.rating || 1500));

    // 2'nin kuvveti olması için bye ekle
    const targetSize = Math.pow(2, Math.ceil(Math.log2(currentPlayers.length)));
    while (currentPlayers.length < targetSize) {
      currentPlayers.push({
        id: `bye-${currentPlayers.length}`,
        name: 'BYE',
        wins: 0,
        losses: 0,
        draws: 0,
        score: 0,
        opponents: []
      });
    }

    let round = 1;
    while (currentPlayers.length > 1) {
      const roundPairings: Pairing[] = [];

      for (let i = 0; i < currentPlayers.length; i += 2) {
        const player1 = currentPlayers[i];
        const player2 = currentPlayers[i + 1];

        roundPairings.push({
          round,
          table: Math.floor(i / 2) + 1,
          player1,
          player2: player2.name === 'BYE' ? null : player2
        });
      }

      rounds.push(roundPairings);

      // Kazananlar bir sonraki tura geçer (şimdilik otomatik player1 kazanıyor - gerçekte result'a göre)
      currentPlayers = roundPairings.map(p => p.player1);
      round++;
    }

    return rounds;
  }
}

/**
 * Skill-Based Pairing
 * Rating'e göre dengeli eşleştirme
 */
export class SkillBasedPairingService {
  /**
   * Benzer rating'li oyuncuları eşleştir
   */
  static generateBalancedPairings(players: Player[], round: number): Pairing[] {
    const pairings: Pairing[] = [];
    const sortedPlayers = [...players].sort((a, b) => (b.rating || 1500) - (a.rating || 1500));

    const paired = new Set<string>();
    let tableNumber = 1;

    for (let i = 0; i < sortedPlayers.length; i++) {
      const player1 = sortedPlayers[i];
      if (paired.has(player1.id)) continue;

      paired.add(player1.id);

      // Yakın rating'li, daha önce eşleşmemiş oyuncu bul
      let bestMatch: Player | null = null;
      let bestRatingDiff = Infinity;

      for (let j = i + 1; j < sortedPlayers.length; j++) {
        const player2 = sortedPlayers[j];
        if (paired.has(player2.id)) continue;
        if (player1.opponents.includes(player2.id)) continue;

        const ratingDiff = Math.abs((player1.rating || 1500) - (player2.rating || 1500));
        if (ratingDiff < bestRatingDiff) {
          bestMatch = player2;
          bestRatingDiff = ratingDiff;
        }
      }

      if (bestMatch) {
        paired.add(bestMatch.id);
        pairings.push({
          round,
          table: tableNumber++,
          player1,
          player2: bestMatch
        });
      } else {
        // Bye
        pairings.push({
          round,
          table: tableNumber++,
          player1,
          player2: null
        });
      }
    }

    return pairings;
  }
}
