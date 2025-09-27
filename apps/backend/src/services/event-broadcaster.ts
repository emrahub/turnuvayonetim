import { EventStore, BaseEvent } from './event-store';
import { TournamentEventType } from '../events/tournament-events';
import { PlayerEventType } from '../events/player-events';
import Redis from 'ioredis';

// WebSocket Event Interfaces
export interface WebSocketEvent {
  type: string;
  channel: string;
  payload: any;
  timestamp: Date;
  metadata?: {
    organizationId: string;
    tournamentId?: string;
    tableId?: string;
    userId?: string;
  };
}

export interface EventBroadcasterConfig {
  redisUrl?: string;
  enableWebSocket: boolean;
  channels: {
    global: string;
    organization: string;
    tournament: string;
    table: string;
    player: string;
    admin: string;
  };
}

// Event Broadcasting Service
export class EventBroadcaster {
  private redis?: Redis;
  private config: EventBroadcasterConfig;

  constructor(
    private eventStore: EventStore,
    config: Partial<EventBroadcasterConfig> = {}
  ) {
    this.config = {
      enableWebSocket: true,
      channels: {
        global: 'events:global',
        organization: 'events:org',
        tournament: 'events:tournament',
        table: 'events:table',
        player: 'events:player',
        admin: 'events:admin'
      },
      ...config
    };

    if (config.redisUrl) {
      this.redis = new Redis(config.redisUrl);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen to all events from the event store
    this.eventStore.on('event:appended', this.handleEventAppended.bind(this));

    // Listen to specific event types for specialized handling
    this.eventStore.on('event:TournamentCreated', this.handleTournamentCreated.bind(this));
    this.eventStore.on('event:TournamentStarted', this.handleTournamentStarted.bind(this));
    this.eventStore.on('event:PlayerRegistered', this.handlePlayerRegistered.bind(this));
    this.eventStore.on('event:PlayerEliminated', this.handlePlayerEliminated.bind(this));
    this.eventStore.on('event:ClockLevelChanged', this.handleClockLevelChanged.bind(this));
    this.eventStore.on('event:ChipCountUpdated', this.handleChipCountUpdated.bind(this));
    this.eventStore.on('event:PayoutCalculated', this.handlePayoutCalculated.bind(this));

    // Listen to aggregate-specific events
    this.eventStore.on('aggregate:Tournament', this.handleTournamentEvent.bind(this));
    this.eventStore.on('aggregate:Player', this.handlePlayerEvent.bind(this));
    this.eventStore.on('aggregate:Table', this.handleTableEvent.bind(this));
  }

  private async handleEventAppended(event: BaseEvent): Promise<void> {
    try {
      // Broadcast to global channel
      await this.broadcastToChannel(this.config.channels.global, {
        type: 'EVENT_APPENDED',
        channel: 'global',
        payload: {
          eventId: event.id,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          organizationId: event.organizationId,
          timestamp: event.timestamp
        },
        timestamp: new Date(),
        metadata: {
          organizationId: event.organizationId,
          tournamentId: event.metadata.tournamentId,
          tableId: event.metadata.tableId,
          userId: event.metadata.userId
        }
      });

      // Broadcast to organization-specific channel
      await this.broadcastToChannel(
        `${this.config.channels.organization}:${event.organizationId}`,
        this.createWebSocketEvent('ORGANIZATION_EVENT', event)
      );

    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }

  // Tournament-specific event handlers
  private async handleTournamentCreated(event: BaseEvent): Promise<void> {
    const wsEvent = this.createWebSocketEvent('TOURNAMENT_CREATED', event);

    await this.broadcastToMultipleChannels([
      `${this.config.channels.organization}:${event.organizationId}`,
      this.config.channels.admin
    ], wsEvent);
  }

  private async handleTournamentStarted(event: BaseEvent): Promise<void> {
    const wsEvent = this.createWebSocketEvent('TOURNAMENT_STARTED', event);

    await this.broadcastToMultipleChannels([
      `${this.config.channels.tournament}:${event.aggregateId}`,
      `${this.config.channels.organization}:${event.organizationId}`,
      this.config.channels.admin
    ], wsEvent);
  }

  private async handlePlayerRegistered(event: BaseEvent): Promise<void> {
    const wsEvent = this.createWebSocketEvent('PLAYER_REGISTERED', event);

    await this.broadcastToMultipleChannels([
      `${this.config.channels.tournament}:${event.metadata.tournamentId}`,
      `${this.config.channels.player}:${event.eventData.playerId}`,
      `${this.config.channels.organization}:${event.organizationId}`
    ], wsEvent);
  }

  private async handlePlayerEliminated(event: BaseEvent): Promise<void> {
    const wsEvent = this.createWebSocketEvent('PLAYER_ELIMINATED', event);

    await this.broadcastToMultipleChannels([
      `${this.config.channels.tournament}:${event.metadata.tournamentId}`,
      `${this.config.channels.table}:${event.metadata.tableId}`,
      `${this.config.channels.player}:${event.eventData.playerId}`,
      `${this.config.channels.organization}:${event.organizationId}`
    ], wsEvent);
  }

  private async handleClockLevelChanged(event: BaseEvent): Promise<void> {
    const wsEvent = this.createWebSocketEvent('CLOCK_LEVEL_CHANGED', event);

    await this.broadcastToMultipleChannels([
      `${this.config.channels.tournament}:${event.metadata.tournamentId}`,
      `${this.config.channels.organization}:${event.organizationId}`
    ], wsEvent);
  }

  private async handleChipCountUpdated(event: BaseEvent): Promise<void> {
    const wsEvent = this.createWebSocketEvent('CHIP_COUNT_UPDATED', event);

    await this.broadcastToMultipleChannels([
      `${this.config.channels.tournament}:${event.metadata.tournamentId}`,
      `${this.config.channels.table}:${event.metadata.tableId}`,
      `${this.config.channels.player}:${event.eventData.playerId}`
    ], wsEvent);
  }

  private async handlePayoutCalculated(event: BaseEvent): Promise<void> {
    const wsEvent = this.createWebSocketEvent('PAYOUT_CALCULATED', event);

    await this.broadcastToMultipleChannels([
      `${this.config.channels.tournament}:${event.metadata.tournamentId}`,
      `${this.config.channels.organization}:${event.organizationId}`,
      this.config.channels.admin
    ], wsEvent);
  }

  // Aggregate-specific handlers
  private async handleTournamentEvent(event: BaseEvent): Promise<void> {
    const wsEvent = this.createWebSocketEvent('TOURNAMENT_EVENT', event);

    if (event.metadata.tournamentId) {
      await this.broadcastToChannel(
        `${this.config.channels.tournament}:${event.metadata.tournamentId}`,
        wsEvent
      );
    }
  }

  private async handlePlayerEvent(event: BaseEvent): Promise<void> {
    const wsEvent = this.createWebSocketEvent('PLAYER_EVENT', event);

    if (event.aggregateId) {
      await this.broadcastToChannel(
        `${this.config.channels.player}:${event.aggregateId}`,
        wsEvent
      );
    }
  }

  private async handleTableEvent(event: BaseEvent): Promise<void> {
    const wsEvent = this.createWebSocketEvent('TABLE_EVENT', event);

    if (event.metadata.tableId) {
      await this.broadcastToChannel(
        `${this.config.channels.table}:${event.metadata.tableId}`,
        wsEvent
      );
    }
  }

  // Utility methods
  private createWebSocketEvent(type: string, event: BaseEvent): WebSocketEvent {
    return {
      type,
      channel: this.getChannelForEvent(event),
      payload: {
        eventId: event.id,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventData: this.sanitizeEventData(event.eventData),
        version: event.version,
        timestamp: event.timestamp
      },
      timestamp: new Date(),
      metadata: {
        organizationId: event.organizationId,
        tournamentId: event.metadata.tournamentId,
        tableId: event.metadata.tableId,
        userId: event.metadata.userId
      }
    };
  }

  private getChannelForEvent(event: BaseEvent): string {
    // Determine the primary channel based on event type and metadata
    if (event.metadata.tableId) {
      return `${this.config.channels.table}:${event.metadata.tableId}`;
    }

    if (event.metadata.tournamentId) {
      return `${this.config.channels.tournament}:${event.metadata.tournamentId}`;
    }

    if (event.aggregateType === 'Player') {
      return `${this.config.channels.player}:${event.aggregateId}`;
    }

    return `${this.config.channels.organization}:${event.organizationId}`;
  }

  private sanitizeEventData(eventData: any): any {
    // Remove sensitive information from event data before broadcasting
    const sensitiveFields = ['password', 'paymentMethod', 'transactionId', 'ssn', 'bankAccount'];

    if (typeof eventData !== 'object' || eventData === null) {
      return eventData;
    }

    const sanitized = { ...eventData };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    return sanitized;
  }

  private async broadcastToChannel(channel: string, event: WebSocketEvent): Promise<void> {
    if (!this.redis) {
      console.warn('Redis not configured, cannot broadcast to channel:', channel);
      return;
    }

    try {
      await this.redis.publish(`ws:${channel}`, JSON.stringify(event));
    } catch (error) {
      console.error(`Failed to broadcast to channel ${channel}:`, error);
    }
  }

  private async broadcastToMultipleChannels(channels: string[], event: WebSocketEvent): Promise<void> {
    const promises = channels.map(channel => this.broadcastToChannel(channel, event));
    await Promise.allSettled(promises);
  }

  // Public API methods
  async broadcastTournamentUpdate(organizationId: string, tournamentId: string, update: any): Promise<void> {
    const wsEvent: WebSocketEvent = {
      type: 'TOURNAMENT_UPDATE',
      channel: `${this.config.channels.tournament}:${tournamentId}`,
      payload: update,
      timestamp: new Date(),
      metadata: {
        organizationId,
        tournamentId
      }
    };

    await this.broadcastToMultipleChannels([
      `${this.config.channels.tournament}:${tournamentId}`,
      `${this.config.channels.organization}:${organizationId}`
    ], wsEvent);
  }

  async broadcastPlayerUpdate(organizationId: string, playerId: string, update: any): Promise<void> {
    const wsEvent: WebSocketEvent = {
      type: 'PLAYER_UPDATE',
      channel: `${this.config.channels.player}:${playerId}`,
      payload: update,
      timestamp: new Date(),
      metadata: {
        organizationId,
        userId: playerId
      }
    };

    await this.broadcastToChannel(`${this.config.channels.player}:${playerId}`, wsEvent);
  }

  async broadcastTableUpdate(organizationId: string, tournamentId: string, tableId: string, update: any): Promise<void> {
    const wsEvent: WebSocketEvent = {
      type: 'TABLE_UPDATE',
      channel: `${this.config.channels.table}:${tableId}`,
      payload: update,
      timestamp: new Date(),
      metadata: {
        organizationId,
        tournamentId,
        tableId
      }
    };

    await this.broadcastToMultipleChannels([
      `${this.config.channels.table}:${tableId}`,
      `${this.config.channels.tournament}:${tournamentId}`
    ], wsEvent);
  }

  async broadcastSystemMessage(organizationId: string, message: string, type: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'): Promise<void> {
    const wsEvent: WebSocketEvent = {
      type: 'SYSTEM_MESSAGE',
      channel: `${this.config.channels.organization}:${organizationId}`,
      payload: {
        message,
        type,
        timestamp: new Date()
      },
      timestamp: new Date(),
      metadata: {
        organizationId
      }
    };

    await this.broadcastToChannel(`${this.config.channels.organization}:${organizationId}`, wsEvent);
  }

  // Event filtering for different user roles
  filterEventForRole(event: WebSocketEvent, userRole: string, userId?: string): WebSocketEvent | null {
    // Admin can see everything
    if (userRole === 'ADMIN') {
      return event;
    }

    // Filter sensitive information based on role
    const filteredEvent = { ...event };

    switch (userRole) {
      case 'MANAGER':
        // Managers can see most information
        return filteredEvent;

      case 'DEALER':
        // Dealers only see table-specific events
        if (event.type.includes('TABLE') || event.type.includes('CHIP') || event.type.includes('PLAYER_ELIMINATED')) {
          return filteredEvent;
        }
        return null;

      case 'PLAYER':
        // Players see public information and their own private information
        if (event.metadata?.userId === userId) {
          return filteredEvent;
        }

        // Remove private information for other players
        if (filteredEvent.payload.eventData) {
          delete filteredEvent.payload.eventData.paymentMethod;
          delete filteredEvent.payload.eventData.buyInAmount;
          delete filteredEvent.payload.eventData.feeAmount;
        }

        return filteredEvent;

      case 'VIEWER':
        // Viewers only see public events
        const publicEvents = [
          'TOURNAMENT_STARTED',
          'TOURNAMENT_COMPLETED',
          'PLAYER_ELIMINATED',
          'CLOCK_LEVEL_CHANGED',
          'PAYOUT_CALCULATED'
        ];

        if (publicEvents.some(eventType => event.type.includes(eventType))) {
          // Remove private data
          if (filteredEvent.payload.eventData) {
            delete filteredEvent.payload.eventData.buyInAmount;
            delete filteredEvent.payload.eventData.feeAmount;
            delete filteredEvent.payload.eventData.paymentMethod;
          }
          return filteredEvent;
        }
        return null;

      default:
        return null;
    }
  }

  // Real-time statistics broadcasting
  async broadcastStatisticsUpdate(organizationId: string, tournamentId: string, stats: any): Promise<void> {
    const wsEvent: WebSocketEvent = {
      type: 'STATISTICS_UPDATE',
      channel: `${this.config.channels.tournament}:${tournamentId}`,
      payload: stats,
      timestamp: new Date(),
      metadata: {
        organizationId,
        tournamentId
      }
    };

    await this.broadcastToChannel(`${this.config.channels.tournament}:${tournamentId}`, wsEvent);
  }

  // Resource cleanup
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}

// Factory for creating event broadcaster
export class EventBroadcasterFactory {
  private static instance: EventBroadcaster;

  static create(
    eventStore: EventStore,
    config: Partial<EventBroadcasterConfig> = {}
  ): EventBroadcaster {
    if (!EventBroadcasterFactory.instance) {
      EventBroadcasterFactory.instance = new EventBroadcaster(eventStore, config);
    }
    return EventBroadcasterFactory.instance;
  }

  static getInstance(): EventBroadcaster {
    if (!EventBroadcasterFactory.instance) {
      throw new Error('EventBroadcaster not initialized. Call create() first.');
    }
    return EventBroadcasterFactory.instance;
  }
}

export default EventBroadcaster;