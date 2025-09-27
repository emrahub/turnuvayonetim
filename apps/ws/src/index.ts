import { Server } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { ClockEngine } from './clock-engine';

dotenv.config();

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Logging utility
const log = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data || ''),
  error: (msg: string, error?: any) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data || ''),
  debug: (msg: string, data?: any) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data || '')
};

// Redis Adapter for scaling across multiple server instances
if (process.env.REDIS_URL) {
  const { createAdapter } = require('@socket.io/redis-adapter');
  const pubClient = new Redis(process.env.REDIS_URL);
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));
  log.info('Redis adapter configured for scaling');
}

const PORT = process.env.WS_PORT || 3001;
const clocks = new Map<string, ClockEngine>();

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      log.warn('No token provided, allowing connection for development');
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  log.info(`Client connected: ${socket.id}`, { userId: socket.data.user?.id });

  // Send initial connection confirmation
  socket.emit('connected', {
    socketId: socket.id,
    serverTime: Date.now(),
    message: 'Connected to tournament server'
  });

  // Handle heartbeat
  socket.on('ping', (timestamp) => {
    socket.emit('pong', {
      clientTimestamp: timestamp,
      serverTime: Date.now()
    });
  });

  // Tournament events
  socket.on('tournament:join', async (data: { tournamentId: string }) => {
    const { tournamentId } = data;

    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      socket.emit('error', { message: 'Tournament not found' });
      return;
    }

    // Join room
    socket.join(`tournament:${tournamentId}`);
    socket.data.tournamentId = tournamentId;

    // Send current state
    const clock = clocks.get(tournamentId);
    if (clock) {
      socket.emit('clock:sync', clock.getState());
    }

    // Send tournament data
    socket.emit('tournament:joined', {
      tournament,
      playersCount: await prisma.entry.count({
        where: { tournamentId }
      }),
      tablesCount: await prisma.table.count({
        where: { tournamentId }
      })
    });
  });

  // Clock control events
  socket.on('clock:start', async (data: { tournamentId: string; levelIdx?: number }) => {
    const { tournamentId, levelIdx = 0 } = data;

    // Check permissions (simplified for now)
    let clock = clocks.get(tournamentId);

    if (!clock) {
      // Load blind structure
      const structure = await prisma.blindStructure.findUnique({
        where: { tournamentId },
        include: { levels: { orderBy: { idx: 'asc' } } }
      });

      if (!structure) {
        socket.emit('error', { message: 'Blind structure not found' });
        return;
      }

      const levels = structure.levels.map(l => ({
        idx: l.idx,
        smallBlind: l.smallBlind,
        bigBlind: l.bigBlind,
        ante: l.ante,
        durationSeconds: l.durationSeconds,
        isBreak: l.isBreak,
        breakName: l.breakName
      }));

      // Create sync callback for database updates
      const syncCallback = async (state: any) => {
        try {
          await prisma.clockState.create({
            data: {
              tournamentId,
              currentLevelIdx: state.currentLevelIdx,
              status: state.status,
              levelStartTime: BigInt(state.serverTime - (state.elapsedSeconds * 1000)),
              pausedDuration: BigInt(0),
              serverTime: BigInt(state.serverTime),
            }
          });
        } catch (error) {
          console.error('Database sync error:', error);
        }
      };

      clock = new ClockEngine(tournamentId, levels, syncCallback);

      // Setup clock event listeners
      clock.on('clock:sync', (state) => {
        io.to(`tournament:${tournamentId}`).emit('clock:sync', state);
      });

      clock.on('clock:levelChanged', (state) => {
        io.to(`tournament:${tournamentId}`).emit('clock:levelChanged', state);
      });

      clock.on('clock:completed', (state) => {
        io.to(`tournament:${tournamentId}`).emit('clock:completed', state);
      });

      clocks.set(tournamentId, clock);
    }

    // Start clock
    const state = clock.start(levelIdx);

    // Update tournament status
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'LIVE' }
    });

    // Broadcast to all clients in room
    io.to(`tournament:${tournamentId}`).emit('clock:started', state);
  });

  socket.on('clock:pause', async (data: { tournamentId: string }) => {
    const { tournamentId } = data;
    const clock = clocks.get(tournamentId);

    if (!clock) {
      socket.emit('error', { message: 'Clock not found' });
      return;
    }

    const state = clock.pause();

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'PAUSED' }
    });

    io.to(`tournament:${tournamentId}`).emit('clock:paused', state);
  });

  socket.on('clock:resume', async (data: { tournamentId: string }) => {
    const { tournamentId } = data;
    const clock = clocks.get(tournamentId);

    if (!clock) {
      socket.emit('error', { message: 'Clock not found' });
      return;
    }

    const state = clock.resume();

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'LIVE' }
    });

    io.to(`tournament:${tournamentId}`).emit('clock:resumed', state);
  });

  // Player management
  socket.on('player:register', async (data) => {
    try {
      const { tournamentId, name, buyIn } = data;

      if (!tournamentId || !name || buyIn === undefined) {
        socket.emit('error', { message: 'Missing required fields for player registration' });
        return;
      }

      log.info('Player registration request', { tournamentId, name, buyIn });

      // For development, create a temporary approach without full user management
      // In production, this should properly handle user authentication and profiles

      // Check if we have a default organization, if not create one
      let organization = await prisma.organization.findFirst({
        where: { slug: 'demo-org' }
      });

      if (!organization) {
        organization = await prisma.organization.create({
          data: {
            name: 'Demo Organization',
            slug: 'demo-org',
            description: 'Development organization for testing'
          }
        });
      }

      // Find or create a basic player profile for development
      let playerProfile = await prisma.playerProfile.findFirst({
        where: {
          user: {
            email: `${name.toLowerCase().replace(/\s+/g, '.')}@demo.local`
          }
        },
        include: { user: true }
      });

      if (!playerProfile) {
        // Create demo user and profile for development
        const demoUser = await prisma.user.create({
          data: {
            email: `${name.toLowerCase().replace(/\s+/g, '.')}@demo.local`,
            firstName: name.split(' ')[0] || name,
            lastName: name.split(' ').slice(1).join(' ') || '',
            role: 'PLAYER',
            organizationId: organization.id,
            passwordHash: 'demo-hash'
          }
        });

        playerProfile = await prisma.playerProfile.create({
          data: {
            userId: demoUser.id,
            nickname: name
          }
        });
      }

      // Get entry count for numbering
      const entryCount = await prisma.entry.count({
        where: { tournamentId }
      });

      // Create tournament entry with correct field mapping
      const entry = await prisma.entry.create({
        data: {
          tournamentId,
          playerProfileId: playerProfile.id,
          entryNumber: entryCount + 1,
          buyInAmount: buyIn, // Map to correct field
          feeAmount: 0, // Set fee to 0 for development
          chipCount: buyIn, // Starting chip count
          status: 'REGISTERED'
        },
        include: {
          playerProfile: {
            include: {
              user: true
            }
          }
        }
      });

      log.info('Player registered successfully', { entryId: entry.id, playerName: name });

      // Broadcast update
      const totalPlayers = await prisma.entry.count({
        where: { tournamentId }
      });

      io.to(`tournament:${tournamentId}`).emit('player:registered', {
        entry,
        totalPlayers
      });

    } catch (error) {
      log.error('Failed to register player', error);
      socket.emit('error', {
        message: 'Failed to register player',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  socket.on('player:eliminate', async (data) => {
    const { tournamentId, entryId, place } = data;

    // Update entry
    await prisma.entry.update({
      where: { id: entryId },
      data: {
        status: 'ELIMINATED',
        eliminatedAt: new Date()
      }
    });

    // Create elimination record
    const elimination = await prisma.elimination.create({
      data: {
        tournamentId,
        entryId,
        place
      }
    });

    // Broadcast update
    io.to(`tournament:${tournamentId}`).emit('player:eliminated', {
      elimination,
      remainingPlayers: await prisma.entry.count({
        where: {
          tournamentId,
          status: 'ACTIVE'
        }
      })
    });
  });

  // Tournament management events
  socket.on('tournament:create', async (data) => {
    try {
      log.info('Tournament creation request', { tournamentId: data.id, userId: socket.data.user?.id });

      // Broadcast tournament created event
      socket.broadcast.emit('tournament:created', data);
      socket.emit('tournament:created', data);
    } catch (error) {
      log.error('Tournament creation failed', error);
      socket.emit('error', { message: 'Failed to create tournament' });
    }
  });

  socket.on('tournament:start', async (data) => {
    try {
      const { tournamentId } = data;
      log.info('Tournament start request', { tournamentId, userId: socket.data.user?.id });

      // Update tournament status
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'LIVE' }
      });

      // Broadcast tournament started
      io.to(`tournament:${tournamentId}`).emit('tournament:started', {
        tournamentId,
        status: 'LIVE',
        startedAt: new Date()
      });
    } catch (error) {
      log.error('Tournament start failed', error);
      socket.emit('error', { message: 'Failed to start tournament' });
    }
  });

  socket.on('tournament:pause', async (data) => {
    try {
      const { tournamentId } = data;
      log.info('Tournament pause request', { tournamentId, userId: socket.data.user?.id });

      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'PAUSED' }
      });

      io.to(`tournament:${tournamentId}`).emit('tournament:paused', {
        tournamentId,
        status: 'PAUSED'
      });
    } catch (error) {
      log.error('Tournament pause failed', error);
      socket.emit('error', { message: 'Failed to pause tournament' });
    }
  });

  socket.on('tournament:resume', async (data) => {
    try {
      const { tournamentId } = data;
      log.info('Tournament resume request', { tournamentId, userId: socket.data.user?.id });

      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'LIVE' }
      });

      io.to(`tournament:${tournamentId}`).emit('tournament:resumed', {
        tournamentId,
        status: 'LIVE'
      });
    } catch (error) {
      log.error('Tournament resume failed', error);
      socket.emit('error', { message: 'Failed to resume tournament' });
    }
  });

  socket.on('tournament:nextLevel', async (data) => {
    try {
      const { tournamentId } = data;
      const clock = clocks.get(tournamentId);

      if (clock) {
        const currentState = clock.getState();
        const nextLevelIdx = currentState.currentLevelIdx + 1;

        if (nextLevelIdx < clock['levels'].length) {
          clock.jumpToLevel(nextLevelIdx);
          log.info('Tournament level advanced', { tournamentId, level: nextLevelIdx });
        } else {
          socket.emit('error', { message: 'Already at final level' });
        }
      } else {
        socket.emit('error', { message: 'Tournament clock not found' });
      }
    } catch (error) {
      log.error('Tournament next level failed', error);
      socket.emit('error', { message: 'Failed to advance level' });
    }
  });

  socket.on('tournament:previousLevel', async (data) => {
    try {
      const { tournamentId } = data;
      const clock = clocks.get(tournamentId);

      if (clock) {
        const currentState = clock.getState();
        const prevLevelIdx = Math.max(0, currentState.currentLevelIdx - 1);

        clock.jumpToLevel(prevLevelIdx);
        log.info('Tournament level decreased', { tournamentId, level: prevLevelIdx });
      } else {
        socket.emit('error', { message: 'Tournament clock not found' });
      }
    } catch (error) {
      log.error('Tournament previous level failed', error);
      socket.emit('error', { message: 'Failed to go back level' });
    }
  });

  // Player chip updates
  socket.on('player:updateChips', async (data) => {
    try {
      const { playerId, chipCount, tournamentId } = data;
      log.info('Player chip update', { playerId, chipCount, tournamentId });

      // Update in database
      const updatedEntry = await prisma.entry.update({
        where: { id: playerId },
        data: { chipCount }
      });

      // Broadcast update
      io.to(`tournament:${tournamentId}`).emit('player:updated', {
        entry: updatedEntry,
        action: 'chip_update'
      });
    } catch (error) {
      log.error('Player chip update failed', error);
      socket.emit('error', { message: 'Failed to update player chips' });
    }
  });

  // Player rebuy
  socket.on('player:rebuy', async (data) => {
    try {
      const { playerId, amount, tournamentId } = data;
      log.info('Player rebuy', { playerId, amount, tournamentId });

      const entry = await prisma.entry.findUnique({ where: { id: playerId } });
      if (!entry) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }

      const updatedEntry = await prisma.entry.update({
        where: { id: playerId },
        data: {
          chipCount: entry.chipCount + amount
        }
      });

      io.to(`tournament:${tournamentId}`).emit('player:rebuy', {
        entry: updatedEntry,
        rebuyAmount: amount
      });
    } catch (error) {
      log.error('Player rebuy failed', error);
      socket.emit('error', { message: 'Failed to process rebuy' });
    }
  });

  // Player addon
  socket.on('player:addon', async (data) => {
    try {
      const { playerId, amount, tournamentId } = data;
      log.info('Player addon', { playerId, amount, tournamentId });

      const entry = await prisma.entry.findUnique({ where: { id: playerId } });
      if (!entry) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }

      const updatedEntry = await prisma.entry.update({
        where: { id: playerId },
        data: {
          chipCount: entry.chipCount + amount
        }
      });

      io.to(`tournament:${tournamentId}`).emit('player:addon', {
        entry: updatedEntry,
        addonAmount: amount
      });
    } catch (error) {
      log.error('Player addon failed', error);
      socket.emit('error', { message: 'Failed to process addon' });
    }
  });

  // Handle client errors
  socket.on('client:error', (error) => {
    log.warn('Client reported error', { error, socketId: socket.id });
  });

  socket.on('disconnect', (reason) => {
    log.info(`Client disconnected: ${socket.id}`, { reason, userId: socket.data.user?.id });

    // Clean up any tournament-specific data if needed
    if (socket.data.tournamentId) {
      socket.leave(`tournament:${socket.data.tournamentId}`);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    log.error('Socket error', { error, socketId: socket.id });
  });
});

// Error handling for the server
httpServer.on('error', (error) => {
  log.error('HTTP Server error', error);
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal: string) {
  log.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  httpServer.close(() => {
    log.info('HTTP server closed');

    // Close all WebSocket connections
    io.close(() => {
      log.info('WebSocket server closed');

      // Close database connections
      prisma.$disconnect().then(() => {
        log.info('Database disconnected');

        // Close Redis connection
        redis.disconnect();
        log.info('Redis disconnected');

        process.exit(0);
      }).catch((error) => {
        log.error('Error during database disconnect', error);
        process.exit(1);
      });
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    log.error('Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at Promise', { reason, promise });
  gracefulShutdown('UNHANDLED_REJECTION');
});

httpServer.listen(PORT, () => {
  log.info(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  log.info('Server started successfully', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
    corsOrigin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  });
});