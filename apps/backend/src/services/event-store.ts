import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

export interface BaseEvent {
  id: string;
  organizationId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  version: number;
  eventData: any;
  metadata: {
    userId?: string;
    tournamentId?: string;
    tableId?: string;
    timestamp: Date;
    correlationId?: string;
    causationId?: string;
    sourceId?: string;
  };
  timestamp: Date;
}

export interface Snapshot {
  id: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: any;
  timestamp: Date;
}

export interface EventStoreConfig {
  snapshotFrequency?: number; // Save snapshot every N events
  enableRedis?: boolean;
  redisConfig?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

export class EventStore extends EventEmitter {
  private redis?: Redis;
  private config: EventStoreConfig;

  constructor(
    private prisma: PrismaClient,
    config: EventStoreConfig = {}
  ) {
    super();
    this.config = {
      snapshotFrequency: 100,
      enableRedis: false,
      ...config
    };

    // Initialize Redis if enabled
    if (this.config.enableRedis && this.config.redisConfig) {
      this.redis = new Redis(this.config.redisConfig);
      this.setupRedisSubscriptions();
    }
  }

  async append(
    organizationId: string,
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventData: any,
    metadata?: Partial<BaseEvent['metadata']>
  ): Promise<BaseEvent> {
    // Check for concurrency conflicts
    const currentVersion = await this.getCurrentVersion(aggregateId);
    const expectedVersion = metadata?.causationId ?
      await this.getVersionFromEventId(metadata.causationId) : currentVersion;

    if (expectedVersion !== currentVersion) {
      throw new Error(`Concurrency conflict: Expected version ${expectedVersion}, got ${currentVersion}`);
    }

    const event: BaseEvent = {
      id: uuidv4(),
      organizationId,
      aggregateId,
      aggregateType,
      eventType,
      version: currentVersion + 1,
      eventData,
      metadata: {
        timestamp: new Date(),
        correlationId: metadata?.correlationId || uuidv4(),
        ...metadata
      },
      timestamp: new Date()
    };

    // Store in database with multi-tenant isolation
    await this.prisma.event.create({
      data: {
        id: event.id,
        organizationId: event.organizationId,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        version: event.version,
        eventData: event.eventData,
        metadata: event.metadata,
        tournamentId: metadata?.tournamentId,
        tableId: metadata?.tableId,
        userId: metadata?.userId
      }
    });

    // Check if snapshot should be created
    if (event.version % (this.config.snapshotFrequency || 100) === 0) {
      this.emit('snapshot:needed', { aggregateId, aggregateType, version: event.version });
    }

    // Emit for projections and WebSocket broadcasting
    this.emit('event:appended', event);
    this.emit(`event:${eventType}`, event);
    this.emit(`aggregate:${aggregateType}`, event);
    this.emit(`organization:${organizationId}`, event);

    if (metadata?.tournamentId) {
      this.emit(`tournament:${metadata.tournamentId}`, event);
    }

    // Publish to Redis for horizontal scaling
    if (this.redis) {
      await this.publishToRedis(event);
    }

    return event;
  }

  async getEvents(
    organizationId: string,
    aggregateId: string,
    fromVersion?: number
  ): Promise<BaseEvent[]> {
    const events = await this.prisma.event.findMany({
      where: {
        organizationId,
        aggregateId,
        ...(fromVersion && { version: { gte: fromVersion } })
      },
      orderBy: { version: 'asc' }
    });

    return events.map(e => ({
      ...e,
      metadata: e.metadata as any
    })) as BaseEvent[];
  }

  async getEventsByType(
    organizationId: string,
    eventType: string,
    limit: number = 100
  ): Promise<BaseEvent[]> {
    const events = await this.prisma.event.findMany({
      where: {
        organizationId,
        eventType
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return events.map(e => ({
      ...e,
      metadata: e.metadata as any
    })) as BaseEvent[];
  }

  async replay(
    organizationId: string,
    aggregateId: string,
    handler: (event: BaseEvent) => void | Promise<void>,
    fromVersion?: number
  ): Promise<void> {
    const events = await this.getEvents(organizationId, aggregateId, fromVersion);

    for (const event of events) {
      await handler(event);
    }
  }

  async getSnapshot(
    organizationId: string,
    aggregateId: string
  ): Promise<Snapshot | null> {
    // Note: Snapshot table would need to be added to Prisma schema
    // For now, we'll implement a simple version using JSON storage
    try {
      const snapshot = await this.prisma.$queryRaw`
        SELECT data FROM snapshots
        WHERE organization_id = ${organizationId}
        AND aggregate_id = ${aggregateId}
        ORDER BY version DESC
        LIMIT 1
      ` as any[];

      return snapshot[0] || null;
    } catch (error) {
      // If snapshots table doesn't exist, return null
      return null;
    }
  }

  async saveSnapshot(
    organizationId: string,
    aggregateId: string,
    aggregateType: string,
    data: any,
    version: number
  ): Promise<void> {
    try {
      // Note: This requires a snapshots table in the database
      await this.prisma.$executeRaw`
        INSERT INTO snapshots (id, organization_id, aggregate_id, aggregate_type, version, data, created_at)
        VALUES (${uuidv4()}, ${organizationId}, ${aggregateId}, ${aggregateType}, ${version}, ${JSON.stringify(data)}, NOW())
        ON CONFLICT (organization_id, aggregate_id)
        DO UPDATE SET version = ${version}, data = ${JSON.stringify(data)}, created_at = NOW()
      `;
    } catch (error) {
      console.warn('Snapshot save failed - snapshots table may not exist:', error);
      // Gracefully handle missing snapshots table
    }
  }

  private async getCurrentVersion(aggregateId: string): Promise<number> {
    const lastEvent = await this.prisma.event.findFirst({
      where: { aggregateId },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    return lastEvent?.version || 0;
  }

  private async getVersionFromEventId(eventId: string): Promise<number> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { version: true }
    });

    return event?.version || 0;
  }

  // Enhanced projection support with snapshots
  async project<T>(
    organizationId: string,
    aggregateId: string,
    initialState: T,
    projector: (state: T, event: BaseEvent) => T
  ): Promise<T> {
    // Try to get snapshot first
    const snapshot = await this.getSnapshot(organizationId, aggregateId);
    let state = snapshot?.data || initialState;
    let fromVersion = snapshot ? snapshot.version + 1 : 1;

    // Get events after snapshot
    const events = await this.getEvents(organizationId, aggregateId, fromVersion);

    // Apply events to build current state
    for (const event of events) {
      state = projector(state, event);
    }

    return state;
  }

  // Enhanced aggregate pattern with multi-tenancy
  async aggregate<T>(
    organizationId: string,
    aggregateId: string,
    commands: {
      [key: string]: (state: T, payload: any, metadata?: any) => BaseEvent[] | Promise<BaseEvent[]>
    },
    projector: (state: T, event: BaseEvent) => T,
    initialState: T
  ): Promise<{
    execute: (command: string, payload: any, metadata?: any) => Promise<void>,
    getState: () => Promise<T>
  }> {
    return {
      execute: async (command: string, payload: any, metadata?: any) => {
        if (!commands[command]) {
          throw new Error(`Unknown command: ${command}`);
        }

        const currentState = await this.project(organizationId, aggregateId, initialState, projector);
        const events = await commands[command](currentState, payload, metadata);

        for (const event of events) {
          await this.append(
            organizationId,
            aggregateId,
            event.aggregateType,
            event.eventType,
            event.eventData,
            { ...event.metadata, ...metadata }
          );
        }
      },
      getState: async () => {
        return this.project(organizationId, aggregateId, initialState, projector);
      }
    };
  }

  // Redis integration for horizontal scaling
  private async publishToRedis(event: BaseEvent): Promise<void> {
    if (!this.redis) return;

    const channel = `events:${event.organizationId}`;
    await this.redis.publish(channel, JSON.stringify(event));

    // Also publish to global event stream
    await this.redis.publish('events:global', JSON.stringify(event));
  }

  private setupRedisSubscriptions(): void {
    if (!this.redis) return;

    // Subscribe to organization-specific events
    this.redis.subscribe('events:*');

    this.redis.on('message', (channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as BaseEvent;

        // Re-emit events from other instances
        this.emit('event:remote', event);
        this.emit(`event:remote:${event.eventType}`, event);

        // Organization-specific events
        if (channel.startsWith('events:') && channel !== 'events:global') {
          const orgId = channel.split(':')[1];
          this.emit(`organization:remote:${orgId}`, event);
        }
      } catch (error) {
        console.error('Failed to parse Redis event message:', error);
      }
    });
  }

  // Multi-tenant event queries
  async getOrganizationEvents(
    organizationId: string,
    eventTypes?: string[],
    limit: number = 100,
    offset: number = 0
  ): Promise<BaseEvent[]> {
    const events = await this.prisma.event.findMany({
      where: {
        organizationId,
        ...(eventTypes && { eventType: { in: eventTypes } })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return events.map(e => ({
      ...e,
      metadata: e.metadata as any
    })) as BaseEvent[];
  }

  async getTournamentEvents(
    organizationId: string,
    tournamentId: string,
    eventTypes?: string[],
    limit: number = 100
  ): Promise<BaseEvent[]> {
    const events = await this.prisma.event.findMany({
      where: {
        organizationId,
        tournamentId,
        ...(eventTypes && { eventType: { in: eventTypes } })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return events.map(e => ({
      ...e,
      metadata: e.metadata as any
    })) as BaseEvent[];
  }

  // Stream events for real-time updates
  async *streamEvents(
    organizationId: string,
    fromEventId?: string,
    eventTypes?: string[]
  ): AsyncGenerator<BaseEvent> {
    let lastEventId = fromEventId;

    while (true) {
      const events = await this.prisma.event.findMany({
        where: {
          organizationId,
          ...(lastEventId && { id: { gt: lastEventId } }),
          ...(eventTypes && { eventType: { in: eventTypes } })
        },
        orderBy: { createdAt: 'asc' },
        take: 100
      });

      for (const event of events) {
        yield {
          ...event,
          metadata: event.metadata as any
        } as BaseEvent;
        lastEventId = event.id;
      }

      // Wait before polling again if no new events
      if (events.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Cleanup and resource management
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}

// Aggregate Types
export enum AggregateType {
  TOURNAMENT = 'Tournament',
  PLAYER = 'Player',
  TABLE = 'Table',
  CLOCK = 'Clock',
  PAYOUT = 'Payout',
  ORGANIZATION = 'Organization'
}

// Event Categories
export enum EventCategory {
  TOURNAMENT = 'Tournament',
  PLAYER = 'Player',
  TABLE = 'Table',
  CLOCK = 'Clock',
  PAYOUT = 'Payout',
  SYSTEM = 'System'
}

// Event Store Factory for dependency injection
export class EventStoreFactory {
  private static instance: EventStore;

  static create(
    prisma: PrismaClient,
    config: EventStoreConfig = {}
  ): EventStore {
    if (!EventStoreFactory.instance) {
      EventStoreFactory.instance = new EventStore(prisma, config);
    }
    return EventStoreFactory.instance;
  }

  static getInstance(): EventStore {
    if (!EventStoreFactory.instance) {
      throw new Error('EventStore not initialized. Call create() first.');
    }
    return EventStoreFactory.instance;
  }
}

// Event Store Middleware for additional processing
export interface EventMiddleware {
  beforeAppend?: (event: BaseEvent) => Promise<BaseEvent> | BaseEvent;
  afterAppend?: (event: BaseEvent) => Promise<void> | void;
}

export class EventStoreWithMiddleware extends EventStore {
  private middleware: EventMiddleware[] = [];

  addMiddleware(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  async append(
    organizationId: string,
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventData: any,
    metadata?: Partial<BaseEvent['metadata']>
  ): Promise<BaseEvent> {
    let event = await super.append(
      organizationId,
      aggregateId,
      aggregateType,
      eventType,
      eventData,
      metadata
    );

    // Apply before middleware
    for (const mw of this.middleware) {
      if (mw.beforeAppend) {
        event = await mw.beforeAppend(event);
      }
    }

    // Apply after middleware
    for (const mw of this.middleware) {
      if (mw.afterAppend) {
        await mw.afterAppend(event);
      }
    }

    return event;
  }
}

export default EventStore;

// Type exports for external use - Updated 2025-09-27
export type { BaseEvent as Event, Snapshot, EventStoreConfig };