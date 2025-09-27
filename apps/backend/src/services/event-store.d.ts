import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
export interface Event {
    id: string;
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    version: number;
    eventData: any;
    metadata: {
        userId?: string;
        timestamp: Date;
        correlationId?: string;
    };
    timestamp: Date;
}
export declare class EventStore extends EventEmitter {
    private prisma;
    constructor(prisma: PrismaClient);
    append(aggregateId: string, aggregateType: string, eventType: string, eventData: any, metadata?: Partial<Event['metadata']>): Promise<Event>;
    getEvents(aggregateId: string, fromVersion?: number): Promise<Event[]>;
    getEventsByType(eventType: string, limit?: number): Promise<Event[]>;
    replay(aggregateId: string, handler: (event: Event) => void | Promise<void>): Promise<void>;
    getSnapshot(aggregateId: string): Promise<any | null>;
    saveSnapshot(aggregateId: string, data: any, version: number): Promise<void>;
    private getNextVersion;
    project<T>(aggregateId: string, initialState: T, projector: (state: T, event: Event) => T): Promise<T>;
    aggregate<T>(aggregateId: string, commands: {
        [key: string]: (state: T, payload: any) => Event[] | Promise<Event[]>;
    }, projector: (state: T, event: Event) => T, initialState: T): Promise<{
        execute: (command: string, payload: any) => Promise<void>;
        getState: () => Promise<T>;
    }>;
}
export declare enum TournamentEvents {
    TOURNAMENT_CREATED = "TournamentCreated",
    TOURNAMENT_STARTED = "TournamentStarted",
    TOURNAMENT_PAUSED = "TournamentPaused",
    TOURNAMENT_RESUMED = "TournamentResumed",
    TOURNAMENT_COMPLETED = "TournamentCompleted",
    TOURNAMENT_CANCELLED = "TournamentCancelled",
    PLAYER_REGISTERED = "PlayerRegistered",
    PLAYER_REBOUGHT = "PlayerRebought",
    PLAYER_ADDED_ON = "PlayerAddedOn",
    PLAYER_ELIMINATED = "PlayerEliminated",
    PLAYER_MOVED = "PlayerMoved",
    TABLE_CREATED = "TableCreated",
    TABLE_BALANCED = "TableBalanced",
    TABLE_BROKEN = "TableBroken",
    SEAT_ASSIGNED = "SeatAssigned",
    SEAT_VACATED = "SeatVacated",
    PAYOUT_CALCULATED = "PayoutCalculated",
    PAYOUT_DISTRIBUTED = "PayoutDistributed",
    CLOCK_STARTED = "ClockStarted",
    CLOCK_PAUSED = "ClockPaused",
    CLOCK_LEVEL_CHANGED = "ClockLevelChanged",
    BLIND_STRUCTURE_UPDATED = "BlindStructureUpdated",
    CHIP_COUNT_UPDATED = "ChipCountUpdated"
}
export declare class TournamentAggregate {
    private eventStore;
    constructor(eventStore: EventStore);
    create(tournamentId: string): Promise<{
        execute: (command: string, payload: any) => Promise<void>;
        getState: () => Promise<any>;
    }>;
}
export default EventStore;
//# sourceMappingURL=event-store.d.ts.map