/**
 * Tournament Templates
 * Pre-configured blind structures for different tournament types
 */

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  duration: number; // in minutes
  isBreak: boolean;
  breakName?: string;
}

export interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'turbo' | 'regular' | 'deep-stack' | 'hyper-turbo' | 'slow';
  startingStack: number;
  levelDuration: number; // default duration in minutes
  blindLevels: BlindLevel[];
  recommended: {
    minPlayers: number;
    maxPlayers: number;
    estimatedDuration: string; // "2-3 hours"
  };
}

/**
 * Turbo Tournament (5-minute levels)
 * Fast-paced action, 2-3 hour duration
 */
export const turboTemplate: TournamentTemplate = {
  id: 'turbo',
  name: 'Turbo',
  description: 'Hızlı tempolu turnuva - 5 dakikalık seviyeler',
  type: 'turbo',
  startingStack: 5000,
  levelDuration: 5,
  blindLevels: [
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 5, isBreak: false },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 5, isBreak: false },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 5, isBreak: false },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 5, isBreak: false },
    { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 5, isBreak: false },
    { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 10, isBreak: true, breakName: 'Mola - 10 Dakika' },
    { level: 7, smallBlind: 200, bigBlind: 400, ante: 50, duration: 5, isBreak: false },
    { level: 8, smallBlind: 300, bigBlind: 600, ante: 75, duration: 5, isBreak: false },
    { level: 9, smallBlind: 400, bigBlind: 800, ante: 100, duration: 5, isBreak: false },
    { level: 10, smallBlind: 500, bigBlind: 1000, ante: 100, duration: 5, isBreak: false },
    { level: 11, smallBlind: 600, bigBlind: 1200, ante: 200, duration: 5, isBreak: false },
    { level: 12, smallBlind: 0, bigBlind: 0, ante: 0, duration: 10, isBreak: true, breakName: 'Mola - 10 Dakika' },
    { level: 13, smallBlind: 800, bigBlind: 1600, ante: 200, duration: 5, isBreak: false },
    { level: 14, smallBlind: 1000, bigBlind: 2000, ante: 300, duration: 5, isBreak: false },
    { level: 15, smallBlind: 1500, bigBlind: 3000, ante: 500, duration: 5, isBreak: false },
    { level: 16, smallBlind: 2000, bigBlind: 4000, ante: 500, duration: 5, isBreak: false },
    { level: 17, smallBlind: 3000, bigBlind: 6000, ante: 1000, duration: 5, isBreak: false },
    { level: 18, smallBlind: 0, bigBlind: 0, ante: 0, duration: 10, isBreak: true, breakName: 'Mola - 10 Dakika' },
    { level: 19, smallBlind: 4000, bigBlind: 8000, ante: 1000, duration: 5, isBreak: false },
    { level: 20, smallBlind: 5000, bigBlind: 10000, ante: 1500, duration: 5, isBreak: false },
    { level: 21, smallBlind: 7000, bigBlind: 14000, ante: 2000, duration: 5, isBreak: false },
    { level: 22, smallBlind: 10000, bigBlind: 20000, ante: 2500, duration: 5, isBreak: false },
    { level: 23, smallBlind: 15000, bigBlind: 30000, ante: 5000, duration: 5, isBreak: false },
    { level: 24, smallBlind: 0, bigBlind: 0, ante: 0, duration: 10, isBreak: true, breakName: 'Final Mola - 10 Dakika' },
    { level: 25, smallBlind: 20000, bigBlind: 40000, ante: 5000, duration: 5, isBreak: false },
  ],
  recommended: {
    minPlayers: 20,
    maxPlayers: 100,
    estimatedDuration: '2-3 saat',
  },
};

/**
 * Regular Tournament (20-minute levels)
 * Balanced structure, 4-6 hour duration
 */
export const regularTemplate: TournamentTemplate = {
  id: 'regular',
  name: 'Regular',
  description: 'Standart turnuva yapısı - 20 dakikalık seviyeler',
  type: 'regular',
  startingStack: 10000,
  levelDuration: 20,
  blindLevels: [
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 20, isBreak: false },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 20, isBreak: false },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 20, isBreak: false },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 20, isBreak: false },
    { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 20, isBreak: false },
    { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true, breakName: 'Mola - 15 Dakika' },
    { level: 7, smallBlind: 200, bigBlind: 400, ante: 50, duration: 20, isBreak: false },
    { level: 8, smallBlind: 300, bigBlind: 600, ante: 75, duration: 20, isBreak: false },
    { level: 9, smallBlind: 400, bigBlind: 800, ante: 100, duration: 20, isBreak: false },
    { level: 10, smallBlind: 500, bigBlind: 1000, ante: 100, duration: 20, isBreak: false },
    { level: 11, smallBlind: 600, bigBlind: 1200, ante: 200, duration: 20, isBreak: false },
    { level: 12, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true, breakName: 'Mola - 15 Dakika' },
    { level: 13, smallBlind: 800, bigBlind: 1600, ante: 200, duration: 20, isBreak: false },
    { level: 14, smallBlind: 1000, bigBlind: 2000, ante: 300, duration: 20, isBreak: false },
    { level: 15, smallBlind: 1500, bigBlind: 3000, ante: 500, duration: 20, isBreak: false },
    { level: 16, smallBlind: 2000, bigBlind: 4000, ante: 500, duration: 20, isBreak: false },
    { level: 17, smallBlind: 3000, bigBlind: 6000, ante: 1000, duration: 20, isBreak: false },
    { level: 18, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true, breakName: 'Mola - 15 Dakika' },
    { level: 19, smallBlind: 4000, bigBlind: 8000, ante: 1000, duration: 20, isBreak: false },
    { level: 20, smallBlind: 5000, bigBlind: 10000, ante: 1500, duration: 20, isBreak: false },
    { level: 21, smallBlind: 6000, bigBlind: 12000, ante: 2000, duration: 20, isBreak: false },
    { level: 22, smallBlind: 8000, bigBlind: 16000, ante: 2500, duration: 20, isBreak: false },
    { level: 23, smallBlind: 10000, bigBlind: 20000, ante: 3000, duration: 20, isBreak: false },
    { level: 24, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true, breakName: 'Final Mola - 15 Dakika' },
    { level: 25, smallBlind: 15000, bigBlind: 30000, ante: 5000, duration: 20, isBreak: false },
    { level: 26, smallBlind: 20000, bigBlind: 40000, ante: 5000, duration: 20, isBreak: false },
    { level: 27, smallBlind: 25000, bigBlind: 50000, ante: 10000, duration: 20, isBreak: false },
  ],
  recommended: {
    minPlayers: 50,
    maxPlayers: 200,
    estimatedDuration: '4-6 saat',
  },
};

/**
 * Deep Stack Tournament (30 minute levels)
 * Slow structure for skill-based play, 6-8 hour duration
 */
export const deepStackTemplate: TournamentTemplate = {
  id: 'deep-stack',
  name: 'Deep Stack',
  description: 'Derin stack yapısı - 30 dakikalık seviyeler, yetenekli oyuncular için',
  type: 'deep-stack',
  startingStack: 20000,
  levelDuration: 30,
  blindLevels: [
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 30, isBreak: false },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 30, isBreak: false },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, duration: 30, isBreak: false },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 30, isBreak: false },
    { level: 5, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 6, smallBlind: 150, bigBlind: 300, ante: 25, duration: 30, isBreak: false },
    { level: 7, smallBlind: 200, bigBlind: 400, ante: 50, duration: 30, isBreak: false },
    { level: 8, smallBlind: 250, bigBlind: 500, ante: 50, duration: 30, isBreak: false },
    { level: 9, smallBlind: 300, bigBlind: 600, ante: 75, duration: 30, isBreak: false },
    { level: 10, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 11, smallBlind: 400, bigBlind: 800, ante: 100, duration: 30, isBreak: false },
    { level: 12, smallBlind: 500, bigBlind: 1000, ante: 100, duration: 30, isBreak: false },
    { level: 13, smallBlind: 600, bigBlind: 1200, ante: 200, duration: 30, isBreak: false },
    { level: 14, smallBlind: 800, bigBlind: 1600, ante: 200, duration: 30, isBreak: false },
    { level: 15, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Yemek Molası - 60 Dakika' },
    { level: 16, smallBlind: 1000, bigBlind: 2000, ante: 300, duration: 30, isBreak: false },
    { level: 17, smallBlind: 1500, bigBlind: 3000, ante: 500, duration: 30, isBreak: false },
    { level: 18, smallBlind: 2000, bigBlind: 4000, ante: 500, duration: 30, isBreak: false },
    { level: 19, smallBlind: 3000, bigBlind: 6000, ante: 1000, duration: 30, isBreak: false },
    { level: 20, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 21, smallBlind: 4000, bigBlind: 8000, ante: 1000, duration: 30, isBreak: false },
    { level: 22, smallBlind: 5000, bigBlind: 10000, ante: 1500, duration: 30, isBreak: false },
    { level: 23, smallBlind: 6000, bigBlind: 12000, ante: 2000, duration: 30, isBreak: false },
    { level: 24, smallBlind: 8000, bigBlind: 16000, ante: 2000, duration: 30, isBreak: false },
    { level: 25, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 26, smallBlind: 10000, bigBlind: 20000, ante: 3000, duration: 30, isBreak: false },
    { level: 27, smallBlind: 12000, bigBlind: 24000, ante: 4000, duration: 30, isBreak: false },
    { level: 28, smallBlind: 15000, bigBlind: 30000, ante: 5000, duration: 30, isBreak: false },
  ],
  recommended: {
    minPlayers: 50,
    maxPlayers: 300,
    estimatedDuration: '6-8 saat',
  },
};

/**
 * Hyper Turbo (3 minute levels)
 * Ultra-fast tournament, 1-2 hour duration
 */
export const hyperTurboTemplate: TournamentTemplate = {
  id: 'hyper-turbo',
  name: 'Hyper Turbo',
  description: 'Çok hızlı turnuva - 3 dakikalık seviyeler',
  type: 'hyper-turbo',
  startingStack: 3000,
  levelDuration: 3,
  blindLevels: [
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 3, isBreak: false },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 3, isBreak: false },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 3, isBreak: false },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 3, isBreak: false },
    { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 3, isBreak: false },
    { level: 6, smallBlind: 200, bigBlind: 400, ante: 50, duration: 3, isBreak: false },
    { level: 7, smallBlind: 0, bigBlind: 0, ante: 0, duration: 5, isBreak: true, breakName: 'Kısa Mola - 5 Dakika' },
    { level: 8, smallBlind: 300, bigBlind: 600, ante: 75, duration: 3, isBreak: false },
    { level: 9, smallBlind: 400, bigBlind: 800, ante: 100, duration: 3, isBreak: false },
    { level: 10, smallBlind: 500, bigBlind: 1000, ante: 100, duration: 3, isBreak: false },
    { level: 11, smallBlind: 600, bigBlind: 1200, ante: 200, duration: 3, isBreak: false },
    { level: 12, smallBlind: 800, bigBlind: 1600, ante: 200, duration: 3, isBreak: false },
    { level: 13, smallBlind: 1000, bigBlind: 2000, ante: 300, duration: 3, isBreak: false },
    { level: 14, smallBlind: 1500, bigBlind: 3000, ante: 500, duration: 3, isBreak: false },
    { level: 15, smallBlind: 0, bigBlind: 0, ante: 0, duration: 5, isBreak: true, breakName: 'Kısa Mola - 5 Dakika' },
    { level: 16, smallBlind: 2000, bigBlind: 4000, ante: 500, duration: 3, isBreak: false },
    { level: 17, smallBlind: 3000, bigBlind: 6000, ante: 1000, duration: 3, isBreak: false },
    { level: 18, smallBlind: 4000, bigBlind: 8000, ante: 1000, duration: 3, isBreak: false },
    { level: 19, smallBlind: 5000, bigBlind: 10000, ante: 1500, duration: 3, isBreak: false },
    { level: 20, smallBlind: 7000, bigBlind: 14000, ante: 2000, duration: 3, isBreak: false },
    { level: 21, smallBlind: 10000, bigBlind: 20000, ante: 3000, duration: 3, isBreak: false },
    { level: 22, smallBlind: 15000, bigBlind: 30000, ante: 5000, duration: 3, isBreak: false },
    { level: 23, smallBlind: 20000, bigBlind: 40000, ante: 5000, duration: 3, isBreak: false },
    { level: 24, smallBlind: 0, bigBlind: 0, ante: 0, duration: 5, isBreak: true, breakName: 'Final Mola - 5 Dakika' },
    { level: 25, smallBlind: 30000, bigBlind: 60000, ante: 10000, duration: 3, isBreak: false },
  ],
  recommended: {
    minPlayers: 10,
    maxPlayers: 50,
    estimatedDuration: '1-2 saat',
  },
};

/**
 * Slow Tournament (45 minute levels)
 * Very slow structure for maximum skill, 8+ hour duration
 */
export const slowTemplate: TournamentTemplate = {
  id: 'slow',
  name: 'Slow Structure',
  description: 'Çok yavaş yapı - 45 dakikalık seviyeler, maksimum yetenek odaklı',
  type: 'slow',
  startingStack: 30000,
  levelDuration: 45,
  blindLevels: [
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 45, isBreak: false },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 45, isBreak: false },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, duration: 45, isBreak: false },
    { level: 4, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 5, smallBlind: 100, bigBlind: 200, ante: 0, duration: 45, isBreak: false },
    { level: 6, smallBlind: 150, bigBlind: 300, ante: 25, duration: 45, isBreak: false },
    { level: 7, smallBlind: 200, bigBlind: 400, ante: 50, duration: 45, isBreak: false },
    { level: 8, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 9, smallBlind: 300, bigBlind: 600, ante: 75, duration: 45, isBreak: false },
    { level: 10, smallBlind: 400, bigBlind: 800, ante: 100, duration: 45, isBreak: false },
    { level: 11, smallBlind: 500, bigBlind: 1000, ante: 100, duration: 45, isBreak: false },
    { level: 12, smallBlind: 0, bigBlind: 0, ante: 0, duration: 60, isBreak: true, breakName: 'Yemek Molası - 60 Dakika' },
    { level: 13, smallBlind: 600, bigBlind: 1200, ante: 200, duration: 45, isBreak: false },
    { level: 14, smallBlind: 800, bigBlind: 1600, ante: 200, duration: 45, isBreak: false },
    { level: 15, smallBlind: 1000, bigBlind: 2000, ante: 300, duration: 45, isBreak: false },
    { level: 16, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 17, smallBlind: 1500, bigBlind: 3000, ante: 500, duration: 45, isBreak: false },
    { level: 18, smallBlind: 2000, bigBlind: 4000, ante: 500, duration: 45, isBreak: false },
    { level: 19, smallBlind: 3000, bigBlind: 6000, ante: 1000, duration: 45, isBreak: false },
    { level: 20, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 21, smallBlind: 4000, bigBlind: 8000, ante: 1000, duration: 45, isBreak: false },
    { level: 22, smallBlind: 5000, bigBlind: 10000, ante: 1500, duration: 45, isBreak: false },
    { level: 23, smallBlind: 6000, bigBlind: 12000, ante: 2000, duration: 45, isBreak: false },
    { level: 24, smallBlind: 8000, bigBlind: 16000, ante: 2500, duration: 45, isBreak: false },
    { level: 25, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 26, smallBlind: 10000, bigBlind: 20000, ante: 3000, duration: 45, isBreak: false },
    { level: 27, smallBlind: 15000, bigBlind: 30000, ante: 5000, duration: 45, isBreak: false },
  ],
  recommended: {
    minPlayers: 100,
    maxPlayers: 500,
    estimatedDuration: '8+ saat',
  },
};

/**
 * WSOP Main Event Style (60-minute levels)
 * Based on World Series of Poker Main Event structure
 * Deep stack with 60,000 starting chips - 10-12+ hour duration
 */
export const wsopMainEventTemplate: TournamentTemplate = {
  id: 'wsop-main-event',
  name: 'WSOP Main Event',
  description: 'World Series of Poker Main Event yapısı - 60 dakikalık seviyeler, 60,000 başlangıç chip',
  type: 'slow',
  startingStack: 60000,
  levelDuration: 60,
  blindLevels: [
    { level: 1, smallBlind: 100, bigBlind: 200, ante: 200, duration: 60, isBreak: false },
    { level: 2, smallBlind: 200, bigBlind: 300, ante: 300, duration: 60, isBreak: false },
    { level: 3, smallBlind: 200, bigBlind: 400, ante: 400, duration: 60, isBreak: false },
    { level: 4, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 5, smallBlind: 300, bigBlind: 600, ante: 600, duration: 60, isBreak: false },
    { level: 6, smallBlind: 400, bigBlind: 800, ante: 800, duration: 60, isBreak: false },
    { level: 7, smallBlind: 500, bigBlind: 1000, ante: 1000, duration: 60, isBreak: false },
    { level: 8, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 9, smallBlind: 600, bigBlind: 1200, ante: 1200, duration: 60, isBreak: false },
    { level: 10, smallBlind: 800, bigBlind: 1600, ante: 1600, duration: 60, isBreak: false },
    { level: 11, smallBlind: 1000, bigBlind: 2000, ante: 2000, duration: 60, isBreak: false },
    { level: 12, smallBlind: 0, bigBlind: 0, ante: 0, duration: 60, isBreak: true, breakName: 'Yemek Molası - 60 Dakika' },
    { level: 13, smallBlind: 1000, bigBlind: 2500, ante: 2500, duration: 60, isBreak: false },
    { level: 14, smallBlind: 1500, bigBlind: 3000, ante: 3000, duration: 60, isBreak: false },
    { level: 15, smallBlind: 2000, bigBlind: 4000, ante: 4000, duration: 60, isBreak: false },
    { level: 16, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 17, smallBlind: 2500, bigBlind: 5000, ante: 5000, duration: 60, isBreak: false },
    { level: 18, smallBlind: 3000, bigBlind: 6000, ante: 6000, duration: 60, isBreak: false },
    { level: 19, smallBlind: 4000, bigBlind: 8000, ante: 8000, duration: 60, isBreak: false },
    { level: 20, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 21, smallBlind: 5000, bigBlind: 10000, ante: 10000, duration: 60, isBreak: false },
    { level: 22, smallBlind: 6000, bigBlind: 12000, ante: 12000, duration: 60, isBreak: false },
    { level: 23, smallBlind: 8000, bigBlind: 16000, ante: 16000, duration: 60, isBreak: false },
    { level: 24, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 25, smallBlind: 10000, bigBlind: 20000, ante: 20000, duration: 60, isBreak: false },
    { level: 26, smallBlind: 15000, bigBlind: 30000, ante: 30000, duration: 60, isBreak: false },
    { level: 27, smallBlind: 20000, bigBlind: 40000, ante: 40000, duration: 60, isBreak: false },
    { level: 28, smallBlind: 25000, bigBlind: 50000, ante: 50000, duration: 60, isBreak: false },
    { level: 29, smallBlind: 30000, bigBlind: 60000, ante: 60000, duration: 60, isBreak: false },
    { level: 30, smallBlind: 40000, bigBlind: 80000, ante: 80000, duration: 60, isBreak: false },
  ],
  recommended: {
    minPlayers: 100,
    maxPlayers: 1000,
    estimatedDuration: '10-12+ saat',
  },
};

/**
 * EPT High Roller Style (45-minute levels)
 * Based on European Poker Tour High Roller structure
 * Premium deep stack experience - 8-10 hour duration
 */
export const eptHighRollerTemplate: TournamentTemplate = {
  id: 'ept-high-roller',
  name: 'EPT High Roller',
  description: 'European Poker Tour High Roller yapısı - 45 dakikalık seviyeler, profesyonel turnuva',
  type: 'deep-stack',
  startingStack: 50000,
  levelDuration: 45,
  blindLevels: [
    { level: 1, smallBlind: 100, bigBlind: 100, ante: 0, duration: 45, isBreak: false },
    { level: 2, smallBlind: 100, bigBlind: 200, ante: 0, duration: 45, isBreak: false },
    { level: 3, smallBlind: 100, bigBlind: 300, ante: 0, duration: 45, isBreak: false },
    { level: 4, smallBlind: 200, bigBlind: 300, ante: 0, duration: 45, isBreak: false },
    { level: 5, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 6, smallBlind: 200, bigBlind: 400, ante: 0, duration: 45, isBreak: false },
    { level: 7, smallBlind: 300, bigBlind: 500, ante: 0, duration: 45, isBreak: false },
    { level: 8, smallBlind: 300, bigBlind: 600, ante: 100, duration: 45, isBreak: false },
    { level: 9, smallBlind: 400, bigBlind: 800, ante: 100, duration: 45, isBreak: false },
    { level: 10, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 11, smallBlind: 500, bigBlind: 1000, ante: 200, duration: 45, isBreak: false },
    { level: 12, smallBlind: 600, bigBlind: 1200, ante: 200, duration: 45, isBreak: false },
    { level: 13, smallBlind: 800, bigBlind: 1600, ante: 300, duration: 45, isBreak: false },
    { level: 14, smallBlind: 1000, bigBlind: 2000, ante: 300, duration: 45, isBreak: false },
    { level: 15, smallBlind: 0, bigBlind: 0, ante: 0, duration: 60, isBreak: true, breakName: 'Yemek Molası - 60 Dakika' },
    { level: 16, smallBlind: 1000, bigBlind: 2500, ante: 500, duration: 45, isBreak: false },
    { level: 17, smallBlind: 1500, bigBlind: 3000, ante: 500, duration: 45, isBreak: false },
    { level: 18, smallBlind: 2000, bigBlind: 4000, ante: 500, duration: 45, isBreak: false },
    { level: 19, smallBlind: 2500, bigBlind: 5000, ante: 1000, duration: 45, isBreak: false },
    { level: 20, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 21, smallBlind: 3000, bigBlind: 6000, ante: 1000, duration: 45, isBreak: false },
    { level: 22, smallBlind: 4000, bigBlind: 8000, ante: 1000, duration: 45, isBreak: false },
    { level: 23, smallBlind: 5000, bigBlind: 10000, ante: 2000, duration: 45, isBreak: false },
    { level: 24, smallBlind: 6000, bigBlind: 12000, ante: 2000, duration: 45, isBreak: false },
    { level: 25, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: 'Mola - 20 Dakika' },
    { level: 26, smallBlind: 8000, bigBlind: 16000, ante: 2000, duration: 45, isBreak: false },
    { level: 27, smallBlind: 10000, bigBlind: 20000, ante: 3000, duration: 45, isBreak: false },
    { level: 28, smallBlind: 15000, bigBlind: 30000, ante: 5000, duration: 45, isBreak: false },
  ],
  recommended: {
    minPlayers: 50,
    maxPlayers: 500,
    estimatedDuration: '8-10 saat',
  },
};

/**
 * All available templates
 */
export const ALL_TEMPLATES: TournamentTemplate[] = [
  hyperTurboTemplate,
  turboTemplate,
  regularTemplate,
  deepStackTemplate,
  slowTemplate,
  wsopMainEventTemplate,
  eptHighRollerTemplate,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): TournamentTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: TournamentTemplate['type']): TournamentTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.type === type);
}

/**
 * Get recommended template based on player count and desired duration
 */
export function getRecommendedTemplate(
  playerCount: number,
  desiredDurationHours: number
): TournamentTemplate {
  if (desiredDurationHours <= 2) return hyperTurboTemplate;
  if (desiredDurationHours <= 3) return turboTemplate;
  if (desiredDurationHours <= 6) return regularTemplate;
  if (desiredDurationHours <= 8) return deepStackTemplate;
  return slowTemplate;
}
