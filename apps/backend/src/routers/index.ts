import { router } from '../utils/trpc';
import { authRouter } from './auth';
import { organizationRouter } from './organization';
import { tournamentRouter } from './tournament';
import { playerRouter } from './player';
import { tableRouter } from './table';
import { clockRouter } from './clock';
import { statsRouter } from './stats';
import { analyticsRouter } from './analytics';
import { leaderboardRouter } from './leaderboard';

export const appRouter = router({
  auth: authRouter,
  organization: organizationRouter,
  tournament: tournamentRouter,
  player: playerRouter,
  table: tableRouter,
  clock: clockRouter,
  stats: statsRouter,
  analytics: analyticsRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;