/**
 * ICM (Independent Chip Model) Calculator
 * Calculates tournament equity based on chip stacks and prize structure
 */

export interface PlayerStack {
  playerId: string;
  playerName: string;
  chips: number;
}

export interface PrizeStructure {
  position: number;
  amount: number;
  percentage?: number;
}

export interface ICMResult {
  playerId: string;
  playerName: string;
  chips: number;
  equity: number;
  percentage: number;
}

export interface DealProposal {
  players: {
    playerId: string;
    playerName: string;
    currentEquity: number;
    proposedPayout: number;
    difference: number;
  }[];
  totalPrizePool: number;
  remainingPrize: number;
  dealType: 'icm' | 'chip-chop' | 'custom';
}

/**
 * Calculate ICM equity for all players
 */
export function calculateICM(
  stacks: PlayerStack[],
  prizeStructure: PrizeStructure[]
): ICMResult[] {
  const totalChips = stacks.reduce((sum, p) => sum + p.chips, 0);
  const totalPrize = prizeStructure.reduce((sum, p) => sum + p.amount, 0);

  if (stacks.length === 0 || totalChips === 0) {
    return [];
  }

  // Calculate equity for each player
  const results: ICMResult[] = stacks.map((player) => {
    const equity = calculatePlayerEquity(player, stacks, prizeStructure);

    return {
      playerId: player.playerId,
      playerName: player.playerName,
      chips: player.chips,
      equity: equity,
      percentage: totalPrize > 0 ? (equity / totalPrize) * 100 : 0,
    };
  });

  return results.sort((a, b) => b.equity - a.equity);
}

/**
 * Calculate equity for a single player using recursive ICM
 */
function calculatePlayerEquity(
  player: PlayerStack,
  allStacks: PlayerStack[],
  prizeStructure: PrizeStructure[]
): number {
  // Base case: only one player left
  if (allStacks.length === 1) {
    return prizeStructure[0]?.amount || 0;
  }

  // Base case: no more prizes
  if (prizeStructure.length === 0) {
    return 0;
  }

  const totalChips = allStacks.reduce((sum, p) => sum + p.chips, 0);
  const currentPrize = prizeStructure[0];
  const remainingPrizes = prizeStructure.slice(1);

  // Probability this player finishes in current position
  const winProbability = player.chips / totalChips;

  // Expected value if player wins
  const winValue = currentPrize.amount;

  // Expected value if player doesn't win (recursive)
  let loseValue = 0;
  if (remainingPrizes.length > 0) {
    // Create new stacks without current prize winner
    const remainingStacks = allStacks.filter((p) => p.playerId !== player.playerId);

    if (remainingStacks.length > 0) {
      // Recursively calculate equity for remaining positions
      loseValue = calculatePlayerEquity(player, remainingStacks, remainingPrizes);
    }
  }

  // Total equity = (probability of winning * win value) + (probability of losing * lose value)
  return winProbability * winValue + (1 - winProbability) * loseValue;
}

/**
 * Chip Chop Deal (proportional to chip stacks)
 */
export function calculateChipChop(
  stacks: PlayerStack[],
  totalPrizePool: number
): DealProposal {
  const totalChips = stacks.reduce((sum, p) => sum + p.chips, 0);

  const players = stacks.map((player) => {
    const chipPercentage = (player.chips / totalChips) * 100;
    const proposedPayout = (player.chips / totalChips) * totalPrizePool;

    return {
      playerId: player.playerId,
      playerName: player.playerName,
      currentEquity: proposedPayout,
      proposedPayout: proposedPayout,
      difference: 0,
    };
  });

  return {
    players,
    totalPrizePool,
    remainingPrize: 0,
    dealType: 'chip-chop',
  };
}

/**
 * ICM Deal (based on mathematical equity)
 */
export function calculateICMDeal(
  stacks: PlayerStack[],
  prizeStructure: PrizeStructure[]
): DealProposal {
  const icmResults = calculateICM(stacks, prizeStructure);
  const totalPrizePool = prizeStructure.reduce((sum, p) => sum + p.amount, 0);

  const players = icmResults.map((result) => ({
    playerId: result.playerId,
    playerName: result.playerName,
    currentEquity: result.equity,
    proposedPayout: result.equity,
    difference: 0,
  }));

  return {
    players,
    totalPrizePool,
    remainingPrize: 0,
    dealType: 'icm',
  };
}

/**
 * Save deal (ICM-based with guarantee for last place)
 */
export function calculateSaveDeal(
  stacks: PlayerStack[],
  prizeStructure: PrizeStructure[],
  guaranteeAmount: number
): DealProposal {
  const icmResults = calculateICM(stacks, prizeStructure);
  const totalPrizePool = prizeStructure.reduce((sum, p) => sum + p.amount, 0);
  const totalGuarantee = guaranteeAmount * stacks.length;
  const remainingPrize = totalPrizePool - totalGuarantee;

  const players = icmResults.map((result) => {
    const additionalEquity = (result.equity / totalPrizePool) * remainingPrize;
    const proposedPayout = guaranteeAmount + additionalEquity;

    return {
      playerId: result.playerId,
      playerName: result.playerName,
      currentEquity: result.equity,
      proposedPayout: proposedPayout,
      difference: proposedPayout - result.equity,
    };
  });

  return {
    players,
    totalPrizePool,
    remainingPrize,
    dealType: 'custom',
  };
}

/**
 * Standard payout structures (% of prize pool)
 */
export const STANDARD_PAYOUTS = {
  // Top 10% (Professional structure)
  top10: (totalPlayers: number, prizePool: number): PrizeStructure[] => {
    const payoutCount = Math.max(1, Math.floor(totalPlayers * 0.1));
    const structures: { [key: number]: number[] } = {
      1: [100],
      2: [65, 35],
      3: [50, 30, 20],
      4: [40, 30, 20, 10],
      5: [40, 25, 18, 11, 6],
      6: [40, 23, 16, 11, 6, 4],
      7: [38, 22, 15, 10, 7, 5, 3],
      8: [35, 21, 14, 10, 8, 6, 4, 2],
      9: [33, 20, 13, 10, 8, 6, 4, 3, 3],
      10: [30, 18, 12, 9, 7, 6, 5, 4, 4, 5],
    };

    const percentages = structures[Math.min(payoutCount, 10)] || structures[10];
    return percentages.map((pct, idx) => ({
      position: idx + 1,
      amount: Math.floor((prizePool * pct) / 100),
      percentage: pct,
    }));
  },

  // Top 15% (Intermediate structure)
  top15: (totalPlayers: number, prizePool: number): PrizeStructure[] => {
    const payoutCount = Math.max(1, Math.floor(totalPlayers * 0.15));
    return generateFlattenedPayouts(payoutCount, prizePool);
  },

  // Top 20% (Beginner-friendly structure)
  top20: (totalPlayers: number, prizePool: number): PrizeStructure[] => {
    const payoutCount = Math.max(1, Math.floor(totalPlayers * 0.2));
    return generateFlattenedPayouts(payoutCount, prizePool);
  },
};

/**
 * Generate flattened payout structure (less top-heavy)
 */
function generateFlattenedPayouts(payoutCount: number, prizePool: number): PrizeStructure[] {
  const payouts: PrizeStructure[] = [];
  let remainingPool = prizePool;

  // First place gets 35%
  const firstPrize = Math.floor(prizePool * 0.35);
  payouts.push({ position: 1, amount: firstPrize, percentage: 35 });
  remainingPool -= firstPrize;

  // Distribute rest with decreasing percentages
  for (let i = 2; i <= payoutCount; i++) {
    const percentage = (65 / (payoutCount - 1)) * (payoutCount - i + 1) / payoutCount;
    const amount = Math.floor((prizePool * percentage) / 100);
    payouts.push({ position: i, amount, percentage });
    remainingPool -= amount;
  }

  // Add any remainder to first place
  if (remainingPool > 0) {
    payouts[0].amount += remainingPool;
  }

  return payouts;
}

/**
 * Calculate $EV (Expected Value) difference for deal evaluation
 */
export function calculateEVDifference(
  icmEquity: number,
  dealPayout: number
): { difference: number; percentageChange: number } {
  const difference = dealPayout - icmEquity;
  const percentageChange = icmEquity > 0 ? (difference / icmEquity) * 100 : 0;

  return {
    difference,
    percentageChange,
  };
}

/**
 * Validate deal (ensure total doesn't exceed prize pool)
 */
export function validateDeal(
  deal: DealProposal
): { valid: boolean; error?: string } {
  const totalPayout = deal.players.reduce((sum, p) => sum + p.proposedPayout, 0);

  if (totalPayout > deal.totalPrizePool) {
    return {
      valid: false,
      error: `Total payout (${totalPayout}) exceeds prize pool (${deal.totalPrizePool})`,
    };
  }

  if (totalPayout < deal.totalPrizePool * 0.95) {
    return {
      valid: false,
      error: `Total payout is too low (${totalPayout}). Should be close to ${deal.totalPrizePool}`,
    };
  }

  return { valid: true };
}
