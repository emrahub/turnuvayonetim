import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

// Event emitter for tournament updates
const tournamentEvents = new EventEmitter();

// Event types
export enum TournamentEventType {
  CREATED = 'tournament.created',
  UPDATED = 'tournament.updated',
  STARTED = 'tournament.started',
  PAUSED = 'tournament.paused',
  COMPLETED = 'tournament.completed',
  PLAYER_REGISTERED = 'tournament.player.registered',
  PLAYER_ELIMINATED = 'tournament.player.eliminated',
  LEVEL_CHANGED = 'tournament.level.changed',
  TABLE_BREAKING = 'tournament.table.breaking',
}

export interface TournamentEvent {
  type: TournamentEventType;
  tournamentId: string;
  data: any;
  timestamp: Date;
}

// Helper to emit tournament events
export function emitTournamentEvent(event: TournamentEvent) {
  tournamentEvents.emit(event.type, event);
  tournamentEvents.emit('tournament.any', event);
}

export const tournamentSubscriptionRouter = router({
  // Subscribe to all tournament events
  onAnyTournamentUpdate: publicProcedure.subscription(() => {
    return observable<TournamentEvent>((emit) => {
      const handler = (event: TournamentEvent) => {
        emit.next(event);
      };

      tournamentEvents.on('tournament.any', handler);

      return () => {
        tournamentEvents.off('tournament.any', handler);
      };
    });
  }),

  // Subscribe to specific tournament updates
  onTournamentUpdate: publicProcedure
    .input(z.object({
      tournamentId: z.string(),
    }))
    .subscription(({ input }) => {
      return observable<TournamentEvent>((emit) => {
        const handler = (event: TournamentEvent) => {
          if (event.tournamentId === input.tournamentId) {
            emit.next(event);
          }
        };

        tournamentEvents.on('tournament.any', handler);

        return () => {
          tournamentEvents.off('tournament.any', handler);
        };
      });
    }),

  // Subscribe to player updates in a tournament
  onPlayerUpdate: protectedProcedure
    .input(z.object({
      tournamentId: z.string(),
      playerId: z.string().optional(),
    }))
    .subscription(({ input, ctx }) => {
      return observable<TournamentEvent>((emit) => {
        const handler = (event: TournamentEvent) => {
          const isRelevantTournament = event.tournamentId === input.tournamentId;
          const isPlayerEvent = event.type === TournamentEventType.PLAYER_REGISTERED ||
                                event.type === TournamentEventType.PLAYER_ELIMINATED;

          if (isRelevantTournament && isPlayerEvent) {
            // If playerId is specified, only emit events for that player
            if (input.playerId) {
              if (event.data.playerId === input.playerId) {
                emit.next(event);
              }
            } else {
              emit.next(event);
            }
          }
        };

        tournamentEvents.on('tournament.any', handler);

        return () => {
          tournamentEvents.off('tournament.any', handler);
        };
      });
    }),

  // Subscribe to level changes
  onLevelChange: publicProcedure
    .input(z.object({
      tournamentId: z.string(),
    }))
    .subscription(({ input }) => {
      return observable<TournamentEvent>((emit) => {
        const handler = (event: TournamentEvent) => {
          if (event.tournamentId === input.tournamentId &&
              event.type === TournamentEventType.LEVEL_CHANGED) {
            emit.next(event);
          }
        };

        tournamentEvents.on(TournamentEventType.LEVEL_CHANGED, handler);

        return () => {
          tournamentEvents.off(TournamentEventType.LEVEL_CHANGED, handler);
        };
      });
    }),

  // Subscribe to tournament status changes (for admin dashboard)
  onStatusChange: protectedProcedure
    .subscription(({ ctx }) => {
      return observable<TournamentEvent>((emit) => {
        const statusEvents = [
          TournamentEventType.CREATED,
          TournamentEventType.STARTED,
          TournamentEventType.PAUSED,
          TournamentEventType.COMPLETED,
        ];

        const handler = (event: TournamentEvent) => {
          if (statusEvents.includes(event.type)) {
            emit.next(event);
          }
        };

        tournamentEvents.on('tournament.any', handler);

        return () => {
          tournamentEvents.off('tournament.any', handler);
        };
      });
    }),

  // Real-time table updates
  onTableUpdate: publicProcedure
    .input(z.object({
      tournamentId: z.string(),
      tableId: z.string().optional(),
    }))
    .subscription(({ input }) => {
      return observable<any>((emit) => {
        const handler = (data: any) => {
          if (data.tournamentId === input.tournamentId) {
            if (!input.tableId || data.tableId === input.tableId) {
              emit.next(data);
            }
          }
        };

        // Listen to table-specific events
        tournamentEvents.on('table.updated', handler);
        tournamentEvents.on('table.hand.completed', handler);
        tournamentEvents.on('table.player.action', handler);

        return () => {
          tournamentEvents.off('table.updated', handler);
          tournamentEvents.off('table.hand.completed', handler);
          tournamentEvents.off('table.player.action', handler);
        };
      });
    }),
});