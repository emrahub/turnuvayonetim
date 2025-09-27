/**
 * Event Store Usage Examples
 *
 * This file demonstrates how to use the comprehensive Event Store implementation
 * for the TURNUVAYONETIM poker tournament management system.
 */

import { PrismaClient } from '@prisma/client';
import { EventSystem, EventSystemConfig } from '../services/event-system';
import { TournamentEventType } from '../events/tournament-events';
import { PlayerEventType } from '../events/player-events';

// Initialize the Event System
async function initializeEventSystem(): Promise<EventSystem> {
  const prisma = new PrismaClient();

  const config: EventSystemConfig = {
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      prefix: 'turnuva'
    },
    websocket: {
      enabled: true,
      port: 3001
    },
    eventStore: {
      snapshotFrequency: 100,
      enableRedis: true
    },
    broadcaster: {
      enableWebSocket: true,
      channels: {
        global: 'events:global',
        organization: 'events:org',
        tournament: 'events:tournament',
        table: 'events:table',
        player: 'events:player',
        admin: 'events:admin'
      }
    },
    integration: {
      enableProjections: true,
      enableBroadcasting: true,
      enableRedis: true,
      projectionUpdateInterval: 1000,
      batchProcessingSize: 10,
      retryAttempts: 3
    }
  };

  return EventSystem.create(prisma, config);
}

// Example 1: Creating and Managing a Tournament
async function createTournamentExample() {
  const eventSystem = await initializeEventSystem();
  const organizationId = 'org_123';
  const userId = 'user_456';

  try {
    // 1. Create a tournament
    const tournamentData = {
      id: 'tournament_789',
      name: 'Weekly Championship',
      description: 'Weekly poker championship tournament',
      type: 'FREEZEOUT',
      buyIn: 100,
      fee: 10,
      stack: 10000,
      maxPlayers: 100,
      minPlayers: 8,
      playersPerTable: 9,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      registrationStart: new Date(),
      registrationEnd: new Date(Date.now() + 23 * 60 * 60 * 1000)
    };

    const createEvent = await eventSystem.createTournament(
      organizationId,
      tournamentData,
      userId
    );
    console.log('Tournament created:', createEvent.id);

    // 2. Register players
    const player1Data = {
      playerId: 'player_001',
      playerProfileId: 'profile_001',
      buyInAmount: 100,
      feeAmount: 10,
      entryNumber: 1
    };

    const registerEvent = await eventSystem.registerPlayer(
      organizationId,
      tournamentData.id,
      player1Data,
      'admin_user'
    );
    console.log('Player registered:', registerEvent.id);

    // 3. Start the tournament
    const startEvent = await eventSystem.startTournament(
      organizationId,
      tournamentData.id,
      'admin_user'
    );
    console.log('Tournament started:', startEvent.id);

    // 4. Update clock level
    const levelData = {
      fromLevel: 1,
      toLevel: 2,
      levelDuration: 20,
      smallBlind: 50,
      bigBlind: 100,
      ante: 0,
      isBreak: false,
      playersRemaining: 50,
      averageChips: 20000,
      totalChips: 1000000
    };

    const clockEvent = await eventSystem.updateClockLevel(
      organizationId,
      tournamentData.id,
      levelData,
      'dealer_user'
    );
    console.log('Clock level updated:', clockEvent.id);

    // 5. Update chip count
    const chipUpdateData = {
      playerId: 'player_001',
      tableId: 'table_001',
      seatNumber: 1,
      previousChipCount: 10000,
      newChipCount: 15000,
      reason: 'MANUAL'
    };

    const chipEvent = await eventSystem.updateChipCount(
      organizationId,
      tournamentData.id,
      chipUpdateData,
      'dealer_user'
    );
    console.log('Chip count updated:', chipEvent.id);

    // 6. Eliminate a player
    const eliminationData = {
      playerId: 'player_002',
      playerProfileId: 'profile_002',
      position: 25,
      finalChipCount: 0,
      tableId: 'table_002',
      seatNumber: 5,
      playTime: 180 // 3 hours
    };

    const eliminationEvent = await eventSystem.eliminatePlayer(
      organizationId,
      tournamentData.id,
      eliminationData,
      'dealer_user'
    );
    console.log('Player eliminated:', eliminationEvent.id);

  } catch (error) {
    console.error('Error in tournament example:', error);
  }
}

// Example 2: Player Management
async function playerManagementExample() {
  const eventSystem = await initializeEventSystem();
  const organizationId = 'org_123';
  const playerId = 'player_001';
  const userId = 'admin_user';

  try {
    // 1. Create player profile
    const profileData = {
      userId: 'user_001',
      nickname: 'PokerPro',
      initialPreferences: {
        soundEnabled: true,
        autoMuck: false,
        showMuckedCards: true
      }
    };

    const profileEvent = await eventSystem.createPlayerProfile(
      organizationId,
      playerId,
      profileData,
      userId
    );
    console.log('Player profile created:', profileEvent.id);

    // 2. Update player statistics
    const statsData = {
      statistics: {
        totalTournaments: 25,
        totalWins: 3,
        totalCashes: 8,
        totalEarnings: 5500,
        roi: 15.5,
        itm: 32.0
      },
      calculationReason: 'TOURNAMENT_FINISH'
    };

    const statsEvent = await eventSystem.updatePlayerStatistics(
      organizationId,
      playerId,
      statsData,
      'system'
    );
    console.log('Player statistics updated:', statsEvent.id);

  } catch (error) {
    console.error('Error in player management example:', error);
  }
}

// Example 3: Querying Projections
async function queryProjectionsExample() {
  const eventSystem = await initializeEventSystem();
  const organizationId = 'org_123';
  const tournamentId = 'tournament_789';
  const playerId = 'player_001';

  try {
    // 1. Get tournament projection
    const tournamentProjection = await eventSystem.getTournamentProjection(
      organizationId,
      tournamentId
    );
    console.log('Tournament projection:', {
      id: tournamentProjection.id,
      name: tournamentProjection.name,
      status: tournamentProjection.status,
      totalRegistered: tournamentProjection.totalRegistered,
      activePlayers: tournamentProjection.activePlayers,
      currentLevel: tournamentProjection.currentLevel,
      totalPrizePool: tournamentProjection.totalPrizePool
    });

    // 2. Get tournament statistics
    const tournamentStats = await eventSystem.getTournamentStatistics(
      organizationId,
      tournamentId
    );
    console.log('Tournament statistics:', {
      totalRegistered: tournamentStats.totalRegistered,
      activePlayers: tournamentStats.activePlayers,
      chipLeader: tournamentStats.chipLeader,
      averageChips: tournamentStats.averageChips,
      recentEliminations: tournamentStats.recentEliminations.length
    });

    // 3. Get player projection
    const playerProjection = await eventSystem.getPlayerProjection(
      organizationId,
      playerId
    );
    console.log('Player projection:', {
      id: playerProjection.id,
      nickname: playerProjection.nickname,
      totalTournaments: playerProjection.totalTournaments,
      totalEarnings: playerProjection.totalEarnings,
      roi: playerProjection.roi,
      currentStreak: playerProjection.currentStreak
    });

    // 4. Get player statistics
    const playerStats = await eventSystem.getPlayerStatistics(
      organizationId,
      playerId
    );
    console.log('Player statistics:', {
      overallStats: playerStats.overallStats,
      trends: playerStats.trends.last30Days,
      recentTournaments: playerStats.recentTournaments.length
    });

  } catch (error) {
    console.error('Error in query projections example:', error);
  }
}

// Example 4: Event History and Replay
async function eventHistoryExample() {
  const eventSystem = await initializeEventSystem();
  const organizationId = 'org_123';
  const tournamentId = 'tournament_789';

  try {
    // 1. Get tournament events
    const tournamentEvents = await eventSystem.getTournamentEvents(
      organizationId,
      tournamentId,
      [TournamentEventType.PLAYER_REGISTERED, TournamentEventType.PLAYER_ELIMINATED]
    );
    console.log(`Found ${tournamentEvents.length} player-related events`);

    // 2. Get organization events
    const orgEvents = await eventSystem.getOrganizationEvents(
      organizationId,
      [TournamentEventType.TOURNAMENT_CREATED, TournamentEventType.TOURNAMENT_STARTED],
      10, // limit
      0   // offset
    );
    console.log(`Found ${orgEvents.length} tournament lifecycle events`);

    // 3. Replay tournament events
    let eventCount = 0;
    await eventSystem.replayTournamentEvents(
      organizationId,
      tournamentId,
      (event) => {
        eventCount++;
        console.log(`Replayed event ${eventCount}: ${event.eventType}`);
      }
    );
    console.log(`Replayed ${eventCount} events total`);

  } catch (error) {
    console.error('Error in event history example:', error);
  }
}

// Example 5: Broadcasting and Real-time Updates
async function broadcastingExample() {
  const eventSystem = await initializeEventSystem();
  const organizationId = 'org_123';
  const tournamentId = 'tournament_789';
  const playerId = 'player_001';

  try {
    // 1. Broadcast tournament update
    await eventSystem.broadcastTournamentUpdate(
      organizationId,
      tournamentId,
      {
        type: 'MANUAL_UPDATE',
        message: 'Tournament will resume in 5 minutes',
        timestamp: new Date()
      }
    );
    console.log('Tournament update broadcasted');

    // 2. Broadcast player update
    await eventSystem.broadcastPlayerUpdate(
      organizationId,
      playerId,
      {
        type: 'CHIP_UPDATE',
        chipCount: 25000,
        position: 15,
        timestamp: new Date()
      }
    );
    console.log('Player update broadcasted');

    // 3. Broadcast system message
    await eventSystem.broadcastSystemMessage(
      organizationId,
      'Tournament registration is now closed',
      'INFO'
    );
    console.log('System message broadcasted');

  } catch (error) {
    console.error('Error in broadcasting example:', error);
  }
}

// Example 6: Maintenance Operations
async function maintenanceExample() {
  const eventSystem = await initializeEventSystem();
  const organizationId = 'org_123';
  const tournamentId = 'tournament_789';
  const playerId = 'player_001';

  try {
    // 1. Check processing status
    const queueLength = await eventSystem.getQueueLength();
    console.log(`Processing queue length: ${queueLength}`);

    // 2. Rebuild projections
    await eventSystem.rebuildTournamentProjection(organizationId, tournamentId);
    console.log('Tournament projection rebuilt');

    await eventSystem.rebuildPlayerProjection(organizationId, playerId);
    console.log('Player projection rebuilt');

    // 3. Create snapshots
    await eventSystem.createSnapshot(organizationId, tournamentId, 'Tournament');
    await eventSystem.createSnapshot(organizationId, playerId, 'Player');
    console.log('Snapshots created');

    // 4. Clear processed events
    await eventSystem.clearProcessedEvents();
    console.log('Processed events cleared');

    // 5. Health check
    const health = await eventSystem.healthCheck();
    console.log('System health:', health);

  } catch (error) {
    console.error('Error in maintenance example:', error);
  }
}

// Main example runner
async function runExamples() {
  console.log('=== Event Store Usage Examples ===\n');

  try {
    console.log('1. Creating Tournament...');
    await createTournamentExample();
    console.log('✓ Tournament example completed\n');

    console.log('2. Player Management...');
    await playerManagementExample();
    console.log('✓ Player management example completed\n');

    console.log('3. Querying Projections...');
    await queryProjectionsExample();
    console.log('✓ Query projections example completed\n');

    console.log('4. Event History...');
    await eventHistoryExample();
    console.log('✓ Event history example completed\n');

    console.log('5. Broadcasting...');
    await broadcastingExample();
    console.log('✓ Broadcasting example completed\n');

    console.log('6. Maintenance Operations...');
    await maintenanceExample();
    console.log('✓ Maintenance example completed\n');

    console.log('=== All Examples Completed Successfully ===');

  } catch (error) {
    console.error('Error running examples:', error);
  } finally {
    // Cleanup
    const eventSystem = EventSystem.getInstance();
    await eventSystem.disconnect();
  }
}

// Export for use in other files
export {
  initializeEventSystem,
  createTournamentExample,
  playerManagementExample,
  queryProjectionsExample,
  eventHistoryExample,
  broadcastingExample,
  maintenanceExample,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}