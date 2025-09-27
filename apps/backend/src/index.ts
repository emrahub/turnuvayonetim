import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './utils/context';
import { appRouter } from './routers';
import { PrismaClient } from '@prisma/client';
import { EventStoreFactory } from './services/event-store';
import ClockService from './services/clock-service';
import ClockController from './controllers/clock-controller';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.API_PORT || 4000;
const WS_PORT = process.env.WS_PORT || 3001;

// Initialize services
const prisma = new PrismaClient();
const eventStore = EventStoreFactory.create(prisma, {
  enableRedis: process.env.REDIS_ENABLED === 'true',
  redisConfig: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  }
});

// Initialize Clock Service
const clockService = new ClockService(prisma, eventStore);

// Setup Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Initialize Clock Controller with WebSocket support
const clockController = new ClockController(io, prisma, eventStore, clockService);

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      eventStore: 'running',
      clockService: 'running',
      websocket: 'running'
    }
  });
});

// Clock service status endpoint
app.get('/clock/status', (_req, res) => {
  const connectedClients = clockController.getConnectedClients();
  res.json({
    status: 'running',
    connectedClients: connectedClients.length,
    timestamp: new Date().toISOString()
  });
});

// tRPC router
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, type, path }) {
      console.error(`tRPC Error on ${type} ${path}:`, error);
    },
  })
);

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('Received shutdown signal. Gracefully shutting down...');

  try {
    // Shutdown clock controller
    await clockController.gracefulShutdown();

    // Cleanup clock service
    await clockService.cleanup();

    // Disconnect event store
    await eventStore.disconnect();

    // Disconnect Prisma
    await prisma.$disconnect();

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Setup signal handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start HTTP server with Socket.IO
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`);
  console.log(`⚡ WebSocket server running on ws://localhost:${PORT}`);
  console.log(`🕐 Clock Service initialized and ready`);
  console.log(`📊 Event Store configured with ${eventStore.constructor.name}`);
});