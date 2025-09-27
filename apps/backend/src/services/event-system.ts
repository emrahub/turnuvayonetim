import { PrismaClient } from '@prisma/client';
import { EventStore, EventStoreConfig } from './event-store';
import { EventBroadcaster, EventBroadcasterConfig } from './event-broadcaster';
import { TournamentProjectionHandler } from '../projections/tournament-projections';
import { PlayerProjectionHandler } from '../projections/player-projections';
import { EventIntegrationService, EventIntegrationConfig } from './event-integration';

// Complete Event System Configuration
export interface EventSystemConfig {
  eventStore?: EventStoreConfig;
  broadcaster?: EventBroadcasterConfig;
  integration?: EventIntegrationConfig;
  redis?: {
    url: string;
    prefix?: string;
  };
  websocket?: {
    enabled: boolean;
    port?: number;
  };
}

// Event System Factory and Manager
export class EventSystem {
  public readonly eventStore: EventStore;
  public readonly eventBroadcaster: EventBroadcaster;
  public readonly tournamentProjections: TournamentProjectionHandler;
  public readonly playerProjections: PlayerProjectionHandler;
  public readonly integration: EventIntegrationService;

  private static instance: EventSystem;

  constructor(
    private prisma: PrismaClient,
    private config: EventSystemConfig = {}
  ) {
    // Initialize Event Store
    this.eventStore = new EventStore(prisma, {
      enableRedis: !!config.redis?.url,
      redisConfig: config.redis ? {
        host: new URL(config.redis.url).hostname,
        port: parseInt(new URL(config.redis.url).port) || 6379,
        password: new URL(config.redis.url).password || undefined,
        db: 0
      } : undefined,
      ...config.eventStore
    });

    // Initialize Event Broadcaster
    this.eventBroadcaster = new EventBroadcaster(this.eventStore, {
      redisUrl: config.redis?.url,
      enableWebSocket: config.websocket?.enabled ?? true,
      ...config.broadcaster
    });

    // Initialize Projection Handlers
    this.tournamentProjections = new TournamentProjectionHandler(this.eventStore, prisma);
    this.playerProjections = new PlayerProjectionHandler(this.eventStore, prisma);

    // Initialize Integration Service
    this.integration = new EventIntegrationService(
      this.eventStore,
      this.eventBroadcaster,
      this.tournamentProjections,
      this.playerProjections,
      prisma,
      {
        redisUrl: config.redis?.url,
        ...config.integration
      }
    );
  }

  // Factory method
  static create(prisma: PrismaClient, config: EventSystemConfig = {}): EventSystem {
    if (!EventSystem.instance) {
      EventSystem.instance = new EventSystem(prisma, config);
    }
    return EventSystem.instance;
  }

  static getInstance(): EventSystem {
    if (!EventSystem.instance) {
      throw new Error('EventSystem not initialized. Call create() first.');
    }
    return EventSystem.instance;
  }

  // Tournament Operations
  async createTournament(organizationId: string, tournamentData: any, userId: string) {
    const tournamentId = tournamentData.id;

    // Append tournament created event
    const event = await this.eventStore.append(
      organizationId,
      tournamentId,
      'Tournament',
      'TournamentCreated',
      tournamentData,
      {
        userId,
        tournamentId,
        correlationId: `tournament-create-${tournamentId}`
      }
    );

    return event;
  }

  async startTournament(organizationId: string, tournamentId: string, userId: string) {
    const startData = {
      tournamentId,
      startedAt: new Date(),
      startedBy: userId
    };

    const event = await this.eventStore.append(
      organizationId,
      tournamentId,
      'Tournament',
      'TournamentStarted',
      startData,
      {
        userId,
        tournamentId,
        correlationId: `tournament-start-${tournamentId}`
      }
    );

    return event;
  }

  async registerPlayer(organizationId: string, tournamentId: string, playerData: any, userId: string) {
    const event = await this.eventStore.append(
      organizationId,
      tournamentId,
      'Tournament',
      'PlayerRegistered',
      {
        ...playerData,
        tournamentId,
        registeredAt: new Date(),
        registeredBy: userId
      },
      {
        userId,
        tournamentId,
        correlationId: `player-register-${playerData.playerId}-${tournamentId}`
      }
    );

    return event;
  }

  async eliminatePlayer(organizationId: string, tournamentId: string, eliminationData: any, userId: string) {
    const event = await this.eventStore.append(
      organizationId,
      tournamentId,
      'Tournament',
      'PlayerEliminated',
      {
        ...eliminationData,
        tournamentId,
        eliminatedAt: new Date()
      },
      {
        userId,
        tournamentId,
        tableId: eliminationData.tableId,
        correlationId: `player-eliminate-${eliminationData.playerId}-${tournamentId}`
      }
    );

    return event;
  }

  async updateChipCount(organizationId: string, tournamentId: string, chipUpdateData: any, userId: string) {
    const event = await this.eventStore.append(
      organizationId,
      tournamentId,
      'Tournament',
      'ChipCountUpdated',
      {
        ...chipUpdateData,
        tournamentId,
        updatedAt: new Date(),
        updatedBy: userId
      },
      {
        userId,
        tournamentId,
        tableId: chipUpdateData.tableId,
        correlationId: `chip-update-${chipUpdateData.playerId}-${Date.now()}`
      }
    );

    return event;
  }

  async updateClockLevel(organizationId: string, tournamentId: string, levelData: any, userId: string) {
    const event = await this.eventStore.append(
      organizationId,
      tournamentId,
      'Tournament',
      'ClockLevelChanged',
      {
        ...levelData,
        tournamentId,
        changedAt: new Date()
      },
      {
        userId,
        tournamentId,
        correlationId: `clock-level-${tournamentId}-${levelData.toLevel}`
      }
    );

    return event;
  }

  // Player Operations
  async createPlayerProfile(organizationId: string, playerId: string, profileData: any, userId: string) {
    const event = await this.eventStore.append(
      organizationId,
      playerId,
      'Player',
      'PlayerProfileCreated',
      {
        ...profileData,
        playerId,
        createdAt: new Date(),
        createdBy: userId
      },
      {
        userId,
        correlationId: `player-create-${playerId}`
      }
    );

    return event;
  }

  async updatePlayerStatistics(organizationId: string, playerId: string, statsData: any, userId: string) {
    const event = await this.eventStore.append(
      organizationId,
      playerId,
      'Player',
      'PlayerStatisticsUpdated',
      {
        ...statsData,
        playerId,
        updatedAt: new Date(),
        calculatedBy: userId
      },
      {
        userId,
        correlationId: `player-stats-${playerId}-${Date.now()}`
      }
    );

    return event;
  }

  // Query Operations
  async getTournamentProjection(organizationId: string, tournamentId: string) {
    return this.tournamentProjections.projectTournament(organizationId, tournamentId);
  }

  async getTournamentStatistics(organizationId: string, tournamentId: string) {
    return this.tournamentProjections.projectTournamentStatistics(organizationId, tournamentId);
  }

  async getPlayerProjection(organizationId: string, playerId: string) {
    return this.playerProjections.projectPlayer(organizationId, playerId);
  }

  async getPlayerStatistics(organizationId: string, playerId: string) {
    return this.playerProjections.projectPlayerStatistics(organizationId, playerId);
  }

  async getPlayerTournamentHistory(organizationId: string, playerId: string) {
    return this.playerProjections.projectPlayerTournamentHistory(organizationId, playerId);
  }

  // Event History Operations
  async getTournamentEvents(organizationId: string, tournamentId: string, eventTypes?: string[]) {
    return this.eventStore.getTournamentEvents(organizationId, tournamentId, eventTypes);
  }

  async getOrganizationEvents(organizationId: string, eventTypes?: string[], limit?: number, offset?: number) {
    return this.eventStore.getOrganizationEvents(organizationId, eventTypes, limit, offset);
  }

  async replayTournamentEvents(organizationId: string, tournamentId: string, handler: (event: any) => void) {
    return this.eventStore.replay(organizationId, tournamentId, handler);
  }

  // Broadcast Operations
  async broadcastTournamentUpdate(organizationId: string, tournamentId: string, update: any) {
    return this.eventBroadcaster.broadcastTournamentUpdate(organizationId, tournamentId, update);
  }

  async broadcastPlayerUpdate(organizationId: string, playerId: string, update: any) {
    return this.eventBroadcaster.broadcastPlayerUpdate(organizationId, playerId, update);
  }

  async broadcastSystemMessage(organizationId: string, message: string, type: 'INFO' | 'WARNING' | 'ERROR' = 'INFO') {
    return this.eventBroadcaster.broadcastSystemMessage(organizationId, message, type);
  }

  // Projection Rebuilding
  async rebuildTournamentProjection(organizationId: string, tournamentId: string) {
    return this.tournamentProjections.rebuildTournamentProjection(organizationId, tournamentId);
  }

  async rebuildPlayerProjection(organizationId: string, playerId: string) {
    return this.playerProjections.rebuildPlayerProjection(organizationId, playerId);
  }

  async rebuildAllPlayerProjections(organizationId: string) {
    return this.playerProjections.rebuildAllPlayerProjections(organizationId);
  }

  // Integration Status
  async getProcessingStatus(eventId: string) {
    return this.integration.getProcessingStatus(eventId);
  }

  async getQueueLength() {
    return this.integration.getQueueLength();
  }

  async reprocessFailedEvents() {
    return this.integration.reprocessFailedEvents();
  }

  // Maintenance Operations
  async clearProcessedEvents() {
    return this.integration.clearProcessedEvents();
  }

  async createSnapshot(organizationId: string, aggregateId: string, aggregateType: string) {
    if (aggregateType === 'Tournament') {
      const projection = await this.getTournamentProjection(organizationId, aggregateId);
      await this.eventStore.saveSnapshot(organizationId, aggregateId, aggregateType, projection, projection.version);
    } else if (aggregateType === 'Player') {
      const projection = await this.getPlayerProjection(organizationId, aggregateId);
      await this.eventStore.saveSnapshot(organizationId, aggregateId, aggregateType, projection, projection.version);
    }
  }

  // Health Check
  async healthCheck() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;

      // Test event store
      const queueLength = await this.getQueueLength();

      return {
        status: 'healthy',
        timestamp: new Date(),
        components: {
          database: 'connected',
          eventStore: 'running',
          broadcaster: 'running',
          projections: 'running',
          integration: 'running',
          queueLength
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        components: {
          database: 'error',
          eventStore: 'unknown',
          broadcaster: 'unknown',
          projections: 'unknown',
          integration: 'unknown'
        }
      };
    }
  }

  // Resource cleanup
  async disconnect() {
    await Promise.allSettled([
      this.eventStore.disconnect(),
      this.eventBroadcaster.disconnect(),
      this.integration.disconnect(),
      this.prisma.$disconnect()
    ]);
  }
}

// Convenience factory function
export function createEventSystem(prisma: PrismaClient, config: EventSystemConfig = {}): EventSystem {
  return EventSystem.create(prisma, config);
}

export default EventSystem;