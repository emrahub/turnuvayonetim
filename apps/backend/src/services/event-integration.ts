import { EventStore, BaseEvent } from './event-store';
import { EventBroadcaster } from './event-broadcaster';
import { TournamentProjectionHandler } from '../projections/tournament-projections';
import { PlayerProjectionHandler } from '../projections/player-projections';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Integration Service Configuration
export interface EventIntegrationConfig {
  enableProjections: boolean;
  enableBroadcasting: boolean;
  enableRedis: boolean;
  redisUrl?: string;
  projectionUpdateInterval?: number; // in milliseconds
  batchProcessingSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Event Processing Status
export interface EventProcessingStatus {
  eventId: string;
  eventType: string;
  aggregateId: string;
  processed: boolean;
  projectionUpdated: boolean;
  broadcasted: boolean;
  errors: string[];
  processedAt?: Date;
}

// Comprehensive Event Integration Service
export class EventIntegrationService {
  private redis?: Redis;
  private config: EventIntegrationConfig;
  private processingQueue: Map<string, BaseEvent> = new Map();
  private processedEvents: Map<string, EventProcessingStatus> = new Map();
  private isProcessing = false;

  constructor(
    private eventStore: EventStore,
    private eventBroadcaster: EventBroadcaster,
    private tournamentProjections: TournamentProjectionHandler,
    private playerProjections: PlayerProjectionHandler,
    private prisma: PrismaClient,
    config: Partial<EventIntegrationConfig> = {}
  ) {
    this.config = {
      enableProjections: true,
      enableBroadcasting: true,
      enableRedis: true,
      projectionUpdateInterval: 1000, // 1 second
      batchProcessingSize: 10,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    if (this.config.enableRedis && config.redisUrl) {
      this.redis = new Redis(config.redisUrl);
    }

    this.setupEventListeners();
    this.startProcessingLoop();
  }

  private setupEventListeners(): void {
    // Listen to all events from the event store
    this.eventStore.on('event:appended', this.queueEventForProcessing.bind(this));

    // Listen to snapshot events
    this.eventStore.on('snapshot:needed', this.handleSnapshotNeeded.bind(this));

    // Listen to remote events from Redis
    if (this.redis) {
      this.setupRedisEventHandlers();
    }
  }

  private setupRedisEventHandlers(): void {
    if (!this.redis) return;

    // Subscribe to event processing channels
    this.redis.subscribe('event-processing:*');

    this.redis.on('message', async (channel: string, message: string) => {
      try {
        if (channel.startsWith('event-processing:')) {
          const event = JSON.parse(message) as BaseEvent;
          await this.processEventFromRemote(event);
        }
      } catch (error) {
        console.error('Error processing Redis message:', error);
      }
    });
  }

  private queueEventForProcessing(event: BaseEvent): void {
    this.processingQueue.set(event.id, event);

    // Initialize processing status
    this.processedEvents.set(event.id, {
      eventId: event.id,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      processed: false,
      projectionUpdated: false,
      broadcasted: false,
      errors: []
    });
  }

  private async startProcessingLoop(): Promise<void> {
    setInterval(async () => {
      if (!this.isProcessing && this.processingQueue.size > 0) {
        await this.processQueuedEvents();
      }
    }, this.config.projectionUpdateInterval || 1000);
  }

  private async processQueuedEvents(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const events = Array.from(this.processingQueue.values())
        .slice(0, this.config.batchProcessingSize || 10);

      for (const event of events) {
        await this.processEvent(event);
        this.processingQueue.delete(event.id);
      }
    } catch (error) {
      console.error('Error processing queued events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: BaseEvent): Promise<void> {
    const status = this.processedEvents.get(event.id);
    if (!status) return;

    try {
      // 1. Update projections
      if (this.config.enableProjections) {
        await this.updateProjections(event);
        status.projectionUpdated = true;
      }

      // 2. Broadcast event (this happens automatically via EventStore listeners)
      if (this.config.enableBroadcasting) {
        status.broadcasted = true;
      }

      // 3. Publish to Redis for other instances
      if (this.redis) {
        await this.publishEventToRedis(event);
      }

      // 4. Handle special event processing
      await this.handleSpecialEventProcessing(event);

      status.processed = true;
      status.processedAt = new Date();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      status.errors.push(errorMessage);
      console.error(`Error processing event ${event.id}:`, error);

      // Retry logic
      await this.retryEventProcessing(event, status);
    }
  }

  private async updateProjections(event: BaseEvent): Promise<void> {
    const promises: Promise<void>[] = [];

    // Update tournament projections
    if (this.shouldUpdateTournamentProjection(event)) {
      promises.push(this.updateTournamentProjection(event));
    }

    // Update player projections
    if (this.shouldUpdatePlayerProjection(event)) {
      promises.push(this.updatePlayerProjection(event));
    }

    await Promise.allSettled(promises);
  }

  private shouldUpdateTournamentProjection(event: BaseEvent): boolean {
    return event.aggregateType === 'Tournament' ||
           event.metadata.tournamentId !== undefined ||
           event.eventType.includes('Tournament') ||
           event.eventType.includes('Table') ||
           event.eventType.includes('Clock') ||
           event.eventType.includes('Payout');
  }

  private shouldUpdatePlayerProjection(event: BaseEvent): boolean {
    return event.aggregateType === 'Player' ||
           event.eventType.includes('Player') ||
           event.eventData.playerId !== undefined ||
           event.eventData.playerProfileId !== undefined;
  }

  private async updateTournamentProjection(event: BaseEvent): Promise<void> {
    try {
      const tournamentId = event.metadata.tournamentId || event.aggregateId;

      if (tournamentId && event.aggregateType === 'Tournament') {
        await this.tournamentProjections.rebuildTournamentProjection(
          event.organizationId,
          tournamentId
        );
      }

      // Broadcast updated tournament data
      if (tournamentId) {
        const projection = await this.tournamentProjections.projectTournament(
          event.organizationId,
          tournamentId
        );

        await this.eventBroadcaster.broadcastTournamentUpdate(
          event.organizationId,
          tournamentId,
          {
            type: 'PROJECTION_UPDATED',
            data: projection,
            triggeredBy: event.eventType
          }
        );
      }
    } catch (error) {
      console.error('Error updating tournament projection:', error);
      throw error;
    }
  }

  private async updatePlayerProjection(event: BaseEvent): Promise<void> {
    try {
      let playerId = event.aggregateId;

      // Extract player ID from event data if not the aggregate
      if (event.aggregateType !== 'Player') {
        playerId = event.eventData.playerId || event.eventData.playerProfileId;
      }

      if (playerId) {
        await this.playerProjections.rebuildPlayerProjection(
          event.organizationId,
          playerId
        );

        // Broadcast updated player data
        const projection = await this.playerProjections.projectPlayer(
          event.organizationId,
          playerId
        );

        await this.eventBroadcaster.broadcastPlayerUpdate(
          event.organizationId,
          playerId,
          {
            type: 'PROJECTION_UPDATED',
            data: projection,
            triggeredBy: event.eventType
          }
        );
      }
    } catch (error) {
      console.error('Error updating player projection:', error);
      throw error;
    }
  }

  private async handleSpecialEventProcessing(event: BaseEvent): Promise<void> {
    switch (event.eventType) {
      case 'TournamentCompleted':
        await this.handleTournamentCompleted(event);
        break;

      case 'PlayerEliminated':
        await this.handlePlayerEliminated(event);
        break;

      case 'PayoutCalculated':
        await this.handlePayoutCalculated(event);
        break;

      case 'ClockLevelChanged':
        await this.handleClockLevelChanged(event);
        break;

      default:
        // No special processing needed
        break;
    }
  }

  private async handleTournamentCompleted(event: BaseEvent): Promise<void> {
    const tournamentId = event.aggregateId;

    // Generate final statistics
    const statistics = await this.tournamentProjections.projectTournamentStatistics(
      event.organizationId,
      tournamentId
    );

    // Broadcast final statistics
    await this.eventBroadcaster.broadcastStatisticsUpdate(
      event.organizationId,
      tournamentId,
      {
        type: 'FINAL_STATISTICS',
        data: statistics,
        timestamp: new Date()
      }
    );

    // Update all player statistics who participated
    const playerEvents = await this.eventStore.getTournamentEvents(
      event.organizationId,
      tournamentId,
      ['PlayerRegistered', 'PlayerEliminated']
    );

    const playerIds = new Set<string>();
    for (const playerEvent of playerEvents) {
      const playerId = playerEvent.eventData.playerId || playerEvent.eventData.playerProfileId;
      if (playerId) {
        playerIds.add(playerId);
      }
    }

    // Update player projections in parallel
    const playerUpdatePromises = Array.from(playerIds).map(playerId =>
      this.playerProjections.rebuildPlayerProjection(event.organizationId, playerId)
    );

    await Promise.allSettled(playerUpdatePromises);
  }

  private async handlePlayerEliminated(event: BaseEvent): Promise<void> {
    const tournamentId = event.metadata.tournamentId;
    const playerId = event.eventData.playerId;

    if (tournamentId && playerId) {
      // Broadcast elimination notification
      await this.eventBroadcaster.broadcastSystemMessage(
        event.organizationId,
        `Player eliminated in position ${event.eventData.position}`,
        'INFO'
      );

      // Update tournament statistics
      const statistics = await this.tournamentProjections.projectTournamentStatistics(
        event.organizationId,
        tournamentId
      );

      await this.eventBroadcaster.broadcastStatisticsUpdate(
        event.organizationId,
        tournamentId,
        statistics
      );
    }
  }

  private async handlePayoutCalculated(event: BaseEvent): Promise<void> {
    const tournamentId = event.aggregateId;

    // Broadcast payout information
    await this.eventBroadcaster.broadcastTournamentUpdate(
      event.organizationId,
      tournamentId,
      {
        type: 'PAYOUTS_CALCULATED',
        data: event.eventData,
        timestamp: new Date()
      }
    );
  }

  private async handleClockLevelChanged(event: BaseEvent): Promise<void> {
    const tournamentId = event.metadata.tournamentId;

    if (tournamentId) {
      // Broadcast clock update to all tournament participants
      await this.eventBroadcaster.broadcastTournamentUpdate(
        event.organizationId,
        tournamentId,
        {
          type: 'CLOCK_UPDATE',
          data: {
            level: event.eventData.toLevel,
            smallBlind: event.eventData.smallBlind,
            bigBlind: event.eventData.bigBlind,
            ante: event.eventData.ante,
            isBreak: event.eventData.isBreak,
            playersRemaining: event.eventData.playersRemaining
          },
          timestamp: new Date()
        }
      );
    }
  }

  private async handleSnapshotNeeded(data: { aggregateId: string; aggregateType: string; version: number }): Promise<void> {
    try {
      // Create snapshot based on aggregate type
      if (data.aggregateType === 'Tournament') {
        const projection = await this.tournamentProjections.projectTournament(
          '', // Organization ID would need to be passed
          data.aggregateId
        );

        await this.eventStore.saveSnapshot(
          projection.organizationId,
          data.aggregateId,
          data.aggregateType,
          projection,
          data.version
        );
      } else if (data.aggregateType === 'Player') {
        const projection = await this.playerProjections.projectPlayer(
          '', // Organization ID would need to be passed
          data.aggregateId
        );

        await this.eventStore.saveSnapshot(
          projection.organizationId || '',
          data.aggregateId,
          data.aggregateType,
          projection,
          data.version
        );
      }
    } catch (error) {
      console.error('Error creating snapshot:', error);
    }
  }

  private async retryEventProcessing(event: BaseEvent, status: EventProcessingStatus): Promise<void> {
    const maxRetries = this.config.retryAttempts || 3;
    const retryDelay = this.config.retryDelay || 1000;

    if (status.errors.length < maxRetries) {
      setTimeout(async () => {
        try {
          await this.processEvent(event);
        } catch (error) {
          console.error(`Retry ${status.errors.length + 1} failed for event ${event.id}:`, error);
        }
      }, retryDelay * status.errors.length);
    } else {
      console.error(`Max retry attempts reached for event ${event.id}. Moving to dead letter queue.`);
      await this.moveToDeadLetterQueue(event, status);
    }
  }

  private async moveToDeadLetterQueue(event: BaseEvent, status: EventProcessingStatus): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO dead_letter_events (event_id, event_data, errors, created_at)
        VALUES (${event.id}, ${JSON.stringify(event)}, ${JSON.stringify(status.errors)}, NOW())
      `;
    } catch (error) {
      console.error('Failed to move event to dead letter queue:', error);
    }
  }

  private async publishEventToRedis(event: BaseEvent): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.publish(
        `event-processing:${event.organizationId}`,
        JSON.stringify(event)
      );
    } catch (error) {
      console.error('Failed to publish event to Redis:', error);
    }
  }

  private async processEventFromRemote(event: BaseEvent): Promise<void> {
    // Avoid processing the same event multiple times
    if (this.processedEvents.has(event.id)) {
      return;
    }

    // Queue for processing
    this.queueEventForProcessing(event);
  }

  // Public API methods
  async getProcessingStatus(eventId: string): Promise<EventProcessingStatus | null> {
    return this.processedEvents.get(eventId) || null;
  }

  async getQueueLength(): Promise<number> {
    return this.processingQueue.size;
  }

  async clearProcessedEvents(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [eventId, status] of this.processedEvents.entries()) {
      if (status.processedAt && status.processedAt < oneHourAgo) {
        this.processedEvents.delete(eventId);
      }
    }
  }

  async reprocessFailedEvents(): Promise<void> {
    const failedEvents = Array.from(this.processedEvents.values())
      .filter(status => !status.processed && status.errors.length > 0);

    for (const status of failedEvents) {
      const event = this.processingQueue.get(status.eventId);
      if (event) {
        // Reset error count and retry
        status.errors = [];
        await this.processEvent(event);
      }
    }
  }

  // Resource cleanup
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}

export default EventIntegrationService;