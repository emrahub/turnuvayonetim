import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from './router';
import { createContext } from './context';
import { logger } from '@/utils/logger';

export function createWebSocketServer(port: number = 3003) {
  const wss = new WebSocketServer({
    port,
    path: '/trpc',
  });

  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext,
    // Enable subscriptions
    batching: {
      enabled: true,
    },
  });

  wss.on('connection', (ws, req) => {
    logger.info(`WebSocket client connected from ${req.socket.remoteAddress}`);

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      logger.info('WebSocket client disconnected');
    });
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, closing WebSocket server...');
    handler.broadcastReconnectNotification();
    wss.close(() => {
      logger.info('WebSocket server closed');
    });
  });

  logger.info(`WebSocket server listening on port ${port}`);

  return { wss, handler };
}