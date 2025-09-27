/**
 * Enhanced Clock Engine Usage Examples
 *
 * This file demonstrates how to use the new Clock Engine with Event Store integration,
 * WebSocket synchronization, and server-authoritative time management.
 */

import { PrismaClient } from '@prisma/client';
import { EventStore } from '../services/event-store';
import ClockService, { BlindLevel, ClockSettings } from '../services/clock-service';
import { ClockEventType } from '../types/clock-events';

/**
 * Example 1: Initialize and Start a Tournament Clock
 */
export async function initializeAndStartClock() {
  const prisma = new PrismaClient();
  const eventStore = new EventStore(prisma);
  const clockService = new ClockService(prisma, eventStore);

  // Tournament configuration
  const organizationId = 'org_123';
  const tournamentId = 'tournament_456';
  const userId = 'user_789';

  // Define blind structure
  const blindStructure: BlindLevel[] = [
    {
      idx: 0,
      smallBlind: 2500,
      bigBlind: 5000,
      ante: 0,
      durationSeconds: 900, // 15 minutes
      isBreak: false
    },
    {
      idx: 1,
      smallBlind: 5000,
      bigBlind: 10000,
      ante: 0,
      durationSeconds: 900,
      isBreak: false
    },
    {
      idx: 2,
      smallBlind: 7500,
      bigBlind: 15000,
      ante: 2500,
      durationSeconds: 900,
      isBreak: false
    },
    {
      idx: 3,
      smallBlind: 0,
      bigBlind: 0,
      ante: 0,
      durationSeconds: 600, // 10 minute break
      isBreak: true,
      breakName: '10 Minute Break'
    },
    {
      idx: 4,
      smallBlind: 10000,
      bigBlind: 20000,
      ante: 2500,
      durationSeconds: 900,
      isBreak: false
    }
  ];

  // Clock settings
  const settings: ClockSettings = {
    autoAdvance: true,
    warningMinutes: [5, 2, 1], // Warnings at 5, 2, and 1 minute remaining
    allowManualControl: true,
    driftCorrectionThreshold: 1000, // 1 second
    syncInterval: 5000, // 5 seconds
    pauseOnDisconnect: false,
    enableBreaks: true,
    breakExtension: 0
  };

  try {
    // 1. Initialize the clock
    console.log('Initializing clock...');
    const clockState = await clockService.initializeClock(
      organizationId,
      tournamentId,
      blindStructure,
      settings,
      userId
    );
    console.log('Clock initialized:', clockState);

    // 2. Start the clock with initial statistics
    console.log('Starting clock...');
    const startedState = await clockService.startClock(
      tournamentId,
      userId,
      {
        playersRemaining: 144,
        averageChipStack: 15000,
        totalChipsInPlay: 2160000,
        eliminations: 0,
        rebuys: 0,
        addons: 0
      }
    );
    console.log('Clock started:', startedState);

    // 3. Set up event listeners for clock events
    clockService.on('level:advanced', (data) => {
      console.log(`Level advanced from ${data.previousLevel.idx} to ${data.newLevel.idx}`);
      console.log(`New blinds: ${data.newLevel.smallBlind}/${data.newLevel.bigBlind}`);
      if (data.newLevel.ante > 0) {
        console.log(`Ante: ${data.newLevel.ante}`);
      }
    });

    clockService.on('break:started', (data) => {
      console.log(`Break started: ${data.breakData.breakName}`);
      console.log(`Duration: ${data.breakData.breakDuration} seconds`);
    });

    clockService.on('clock:warning', (data) => {
      console.log(`Clock warning: ${data.warning.warningMessage}`);
    });

    clockService.on('clock:error', (data) => {
      console.error(`Clock error: ${data.error.errorMessage}`);
    });

    return clockState;

  } catch (error) {
    console.error('Clock initialization failed:', error);
    throw error;
  }
}

/**
 * Example 2: Manual Clock Control
 */
export async function manualClockControl(clockService: ClockService, tournamentId: string, userId: string) {
  try {
    // Pause the clock
    console.log('Pausing clock...');
    await clockService.pauseClock(
      tournamentId,
      userId,
      'TECHNICAL_ISSUE',
      'Resolving connectivity issues'
    );

    // Wait for some time (simulated)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Resume the clock
    console.log('Resuming clock...');
    await clockService.resumeClock(
      tournamentId,
      userId,
      'Issues resolved'
    );

    // Jump to a specific level
    console.log('Jumping to level 3...');
    await clockService.goToLevel(
      tournamentId,
      3,
      userId,
      'Skip to break level'
    );

  } catch (error) {
    console.error('Manual clock control failed:', error);
    throw error;
  }
}

/**
 * Example 3: Statistics Updates
 */
export async function updateTournamentStatistics(clockService: ClockService, tournamentId: string, userId: string) {
  try {
    // Update statistics as players are eliminated
    await clockService.updateStatistics(
      tournamentId,
      {
        playersRemaining: 72,
        averageChipStack: 30000,
        totalChipsInPlay: 2160000,
        eliminations: 72
      },
      userId
    );

    console.log('Statistics updated successfully');

  } catch (error) {
    console.error('Statistics update failed:', error);
    throw error;
  }
}

/**
 * Example 4: Event Store Query Examples
 */
export async function queryClockEvents() {
  const prisma = new PrismaClient();
  const eventStore = new EventStore(prisma);

  const organizationId = 'org_123';
  const tournamentId = 'tournament_456';

  try {
    // Get all clock events for a tournament
    const clockEvents = await eventStore.getTournamentEvents(
      organizationId,
      tournamentId,
      [
        ClockEventType.CLOCK_STARTED,
        ClockEventType.CLOCK_PAUSED,
        ClockEventType.CLOCK_RESUMED,
        ClockEventType.LEVEL_ADVANCED,
        ClockEventType.BREAK_STARTED,
        ClockEventType.BREAK_ENDED
      ]
    );

    console.log(`Found ${clockEvents.length} clock events`);

    // Get specific event types
    const levelAdvanceEvents = await eventStore.getEventsByType(
      organizationId,
      ClockEventType.LEVEL_ADVANCED,
      50
    );

    console.log(`Found ${levelAdvanceEvents.length} level advance events`);

    // Stream events in real-time
    console.log('Starting event stream...');
    const eventStream = eventStore.streamEvents(
      organizationId,
      undefined,
      [ClockEventType.CLOCK_STARTED, ClockEventType.LEVEL_ADVANCED]
    );

    // Process first 5 events
    let eventCount = 0;
    for await (const event of eventStream) {
      console.log(`Received event: ${event.eventType}`, event.eventData);

      if (++eventCount >= 5) {
        break;
      }
    }

  } catch (error) {
    console.error('Event query failed:', error);
    throw error;
  }
}

/**
 * Example 5: Time Synchronization
 */
export async function handleTimeSync(clockService: ClockService, tournamentId: string) {
  try {
    // Simulate a time sync request from a client
    const syncRequest = {
      clientId: 'client_123',
      clientTime: Date.now() + 2000, // Client is 2 seconds ahead
      requestId: 'sync_456',
      timestamp: Date.now()
    };

    console.log('Processing time sync request...');
    const response = await clockService.requestTimeSync(tournamentId, syncRequest);

    console.log('Sync response:', {
      serverTime: new Date(response.serverTime),
      drift: response.drift,
      correction: response.correction,
      requestId: response.requestId
    });

    if (Math.abs(response.drift) > 1000) {
      console.warn(`Significant drift detected: ${response.drift}ms`);
    }

  } catch (error) {
    console.error('Time sync failed:', error);
    throw error;
  }
}

/**
 * Example 6: Clock State Reconstruction from Events
 */
export async function reconstructClockState() {
  const prisma = new PrismaClient();
  const eventStore = new EventStore(prisma);

  const organizationId = 'org_123';
  const tournamentId = 'tournament_456';

  try {
    // Define initial state
    const initialState = {
      tournamentId,
      organizationId,
      status: 'idle' as const,
      currentLevelIdx: 0,
      levelStartTime: 0,
      pausedDuration: 0,
      totalPausedTime: 0,
      lastSyncTime: Date.now(),
      serverTime: Date.now(),
      version: 0,
      settings: {} as any,
      blindStructure: [] as any[],
      statistics: {
        playersRemaining: 0,
        averageChipStack: 0,
        totalChipsInPlay: 0,
        eliminations: 0,
        rebuys: 0,
        addons: 0
      }
    };

    // Define projector function
    const projector = (state: typeof initialState, event: any) => {
      switch (event.eventType) {
        case ClockEventType.CLOCK_INITIALIZED:
          return {
            ...state,
            settings: event.eventData.clockSettings,
            blindStructure: event.eventData.blindStructure,
            version: event.version
          };

        case ClockEventType.CLOCK_STARTED:
          return {
            ...state,
            status: 'running' as const,
            levelStartTime: event.eventData.levelStartTime,
            statistics: {
              ...state.statistics,
              playersRemaining: event.eventData.playersRemaining,
              averageChipStack: event.eventData.averageChipStack,
              totalChipsInPlay: event.eventData.totalChipsInPlay
            },
            version: event.version
          };

        case ClockEventType.CLOCK_PAUSED:
          return {
            ...state,
            status: 'paused' as const,
            pausedDuration: event.eventData.timeRemaining,
            version: event.version
          };

        case ClockEventType.LEVEL_ADVANCED:
          return {
            ...state,
            currentLevelIdx: event.eventData.newLevel.idx,
            levelStartTime: Date.now(),
            pausedDuration: 0,
            totalPausedTime: 0,
            statistics: {
              ...state.statistics,
              playersRemaining: event.eventData.playersRemaining,
              averageChipStack: event.eventData.averageChipStack,
              totalChipsInPlay: event.eventData.totalChipsInPlay
            },
            version: event.version
          };

        default:
          return { ...state, version: event.version };
      }
    };

    // Reconstruct state from events
    console.log('Reconstructing clock state from events...');
    const reconstructedState = await eventStore.project(
      organizationId,
      tournamentId,
      initialState,
      projector
    );

    console.log('Reconstructed state:', reconstructedState);
    return reconstructedState;

  } catch (error) {
    console.error('State reconstruction failed:', error);
    throw error;
  }
}

/**
 * Example 7: Complete Tournament Clock Flow
 */
export async function completeClockFlow() {
  console.log('=== Complete Tournament Clock Flow ===');

  const prisma = new PrismaClient();
  const eventStore = new EventStore(prisma);
  const clockService = new ClockService(prisma, eventStore);

  const organizationId = 'org_example';
  const tournamentId = 'tournament_example';
  const userId = 'user_example';

  try {
    // 1. Initialize clock
    console.log('\n1. Initializing clock...');
    await initializeAndStartClock();

    // 2. Simulate tournament progression
    console.log('\n2. Simulating tournament progression...');

    // Update statistics periodically
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      await clockService.updateStatistics(
        tournamentId,
        {
          playersRemaining: 144 - (i * 20),
          eliminations: i * 20,
          averageChipStack: 15000 + (i * 5000)
        },
        userId
      );

      console.log(`Statistics update ${i + 1}: ${144 - (i * 20)} players remaining`);
    }

    // 3. Manual controls
    console.log('\n3. Testing manual controls...');
    await manualClockControl(clockService, tournamentId, userId);

    // 4. Time synchronization
    console.log('\n4. Testing time synchronization...');
    await handleTimeSync(clockService, tournamentId);

    // 5. Complete the clock
    console.log('\n5. Completing the clock...');
    await clockService.completeClock(tournamentId, userId);

    // 6. Query events
    console.log('\n6. Querying events...');
    await queryClockEvents();

    // 7. Reconstruct state
    console.log('\n7. Reconstructing state...');
    await reconstructClockState();

    console.log('\n=== Clock flow completed successfully ===');

  } catch (error) {
    console.error('Clock flow failed:', error);
    throw error;
  } finally {
    // Cleanup
    await clockService.cleanup();
    await eventStore.disconnect();
    await prisma.$disconnect();
  }
}

// Export for use in other files
export {
  initializeAndStartClock,
  manualClockControl,
  updateTournamentStatistics,
  queryClockEvents,
  handleTimeSync,
  reconstructClockState,
  completeClockFlow
};

// Uncomment to run the complete flow
// completeClockFlow().catch(console.error);