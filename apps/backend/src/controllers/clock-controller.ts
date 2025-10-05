import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { EventStore } from '../services/event-store';
import ClockService, { ClockSettings, BlindLevel, TimeSyncRequest, ClientConnection } from '../services/clock-service';
import type { ClockState } from '../services/clock-service';
import { verify } from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';

// Socket Event Interfaces
interface SocketAuthPayload {
  token?: string;
  organizationId?: string;
  userId?: string;
  role?: string;
}

interface ClockControlPayload {
  tournamentId: string;
  organizationId?: string;
}

interface ClockStartPayload extends ClockControlPayload {
  statistics?: {
    playersRemaining: number;
    averageChipStack: number;
    totalChipsInPlay: number;
  };
}

interface ClockPausePayload extends ClockControlPayload {
  reason?: 'MANUAL' | 'SYSTEM_ERROR' | 'TECHNICAL_ISSUE' | 'FLOOR_DECISION' | 'PLAYER_DISPUTE';
  notes?: string;
}

interface ClockResumePayload extends ClockControlPayload {
  notes?: string;
}

interface ClockGotoLevelPayload extends ClockControlPayload {
  levelIdx: number;
  reason?: string;
}

interface ClockInitializePayload extends ClockControlPayload {
  blindStructure: BlindLevel[];
  settings?: Partial<ClockSettings>;
}

interface TimeSyncPayload extends ClockControlPayload {
  clientTime: number;
  requestId: string;
}

interface TournamentJoinPayload {
  tournamentId: string;
  organizationId?: string;
  isController?: boolean;
}

interface SocketData {
  userId?: string;
  organizationId?: string;
  role?: string;
  isAuthenticated: boolean;
  tournaments: Set<string>;
  isController: boolean;
}

export class ClockController {
  private io: SocketIOServer;
  private connectedClients = new Map<string, ClientConnection>();
  private tournamentRooms = new Map<string, Set<string>>(); // tournamentId -> Set<socketId>

  constructor(
    io: SocketIOServer,
    private prisma: PrismaClient,
    private eventStore: EventStore,
    private clockService: ClockService
  ) {
    this.io = io;
    this.setupSocketHandlers();
    this.setupClockServiceListeners();
  }

  private setupSocketHandlers(): void {
    // Authentication middleware
    this.io.use(async (socket: Socket, next) => {
      try {
        const auth = socket.handshake.auth as SocketAuthPayload;
        const token = auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          socket.data = { isAuthenticated: false, tournaments: new Set(), isController: false } as SocketData;
          return next();
        }

        // Verify JWT token
        const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

        // Fetch user details from database
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { UserOrganization: true }
        });

        if (!user) {
          throw new Error('User not found');
        }

        socket.data = {
          userId: user.id,
          organizationId: auth.organizationId || user.UserOrganization[0]?.organizationId || '',
          role: user.UserOrganization[0]?.role || 'STAFF',
          isAuthenticated: true,
          tournaments: new Set(),
          isController: false
        } as SocketData;

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.data = { isAuthenticated: false, tournaments: new Set(), isController: false } as SocketData;
        next();
      }
    });

    // Connection handler
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);

      // Tournament room management
      socket.on('tournament:join', (payload: TournamentJoinPayload) => {
        this.handleTournamentJoin(socket, payload);
      });

      socket.on('tournament:leave', (payload: { tournamentId: string }) => {
        this.handleTournamentLeave(socket, payload.tournamentId);
      });

      // Clock control events (requires authentication and permissions)
      socket.on('clock:initialize', (payload: ClockInitializePayload) => {
        this.handleClockInitialize(socket, payload);
      });

      socket.on('clock:start', (payload: ClockStartPayload) => {
        this.handleClockStart(socket, payload);
      });

      socket.on('clock:pause', (payload: ClockPausePayload) => {
        this.handleClockPause(socket, payload);
      });

      socket.on('clock:resume', (payload: ClockResumePayload) => {
        this.handleClockResume(socket, payload);
      });

      socket.on('clock:gotoLevel', (payload: ClockGotoLevelPayload) => {
        this.handleClockGotoLevel(socket, payload);
      });

      socket.on('clock:complete', (payload: ClockControlPayload) => {
        this.handleClockComplete(socket, payload);
      });

      // Time synchronization
      socket.on('clock:requestSync', (payload: TimeSyncPayload) => {
        this.handleTimeSyncRequest(socket, payload);
      });

      // Get current state
      socket.on('clock:getState', (payload: ClockControlPayload) => {
        this.handleGetClockState(socket, payload);
      });

      // Statistics updates
      socket.on('clock:updateStatistics', (payload: ClockControlPayload & { statistics: any }) => {
        this.handleUpdateStatistics(socket, payload);
      });

      // Disconnection handler
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

      // Error handler
      socket.on('error', (error) => {
        console.error(`Socket ${socket.id} error:`, error);
      });
    });
  }

  private setupClockServiceListeners(): void {
    // Clock state changes
    this.clockService.on('clock:initialized', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:initialized', data.state);
    });

    this.clockService.on('clock:started', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:started', data.state);
    });

    this.clockService.on('clock:paused', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:paused', data.state);
    });

    this.clockService.on('clock:resumed', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:resumed', data.state);
    });

    this.clockService.on('clock:completed', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:completed', data.state);
    });

    this.clockService.on('level:advanced', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:levelChanged', {
        state: data.state,
        previousLevel: data.previousLevel,
        newLevel: data.newLevel,
        autoAdvanced: data.autoAdvanced
      });
    });

    this.clockService.on('level:changed', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:levelChanged', {
        state: data.state,
        fromLevel: data.fromLevel,
        toLevel: data.toLevel,
        reason: data.reason
      });
    });

    this.clockService.on('break:started', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:breakStarted', {
        state: data.state,
        breakData: data.breakData
      });
    });

    this.clockService.on('clock:tick', (data) => {
      // Broadcast less frequent tick updates to reduce network load
      if (Math.floor(data.elapsed / 1000) % 5 === 0) { // Every 5 seconds
        this.broadcastToTournament(data.tournamentId, 'clock:tick', {
          elapsed: data.elapsed,
          remaining: data.remaining,
          serverTime: data.state.serverTime
        });
      }
    });

    this.clockService.on('clock:sync', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:sync', data.state);
    });

    this.clockService.on('clock:warning', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:warning', data.warning);
    });

    this.clockService.on('clock:error', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:error', data.error);
      // Also notify controllers specifically
      this.broadcastToControllers(data.tournamentId, 'clock:error', data.error);
    });

    this.clockService.on('drift:detected', (data) => {
      // Send drift correction to specific client
      const rooms = this.tournamentRooms.get(data.tournamentId);
      if (rooms) {
        for (const socketId of rooms) {
          const socket = this.io.sockets.sockets.get(socketId);
          const connection = this.connectedClients.get(socketId);
          if (socket && connection && connection.id === data.clientId) {
            socket.emit('clock:driftDetected', {
              drift: data.drift,
              severity: data.severity,
              correction: -data.drift
            });
            break;
          }
        }
      }
    });

    this.clockService.on('statistics:updated', (data) => {
      this.broadcastToTournament(data.tournamentId, 'clock:statisticsUpdated', {
        statistics: data.statistics,
        state: data.state
      });
    });
  }

  private handleConnection(socket: Socket): void {
    const socketData = socket.data as SocketData;

    console.log(`Socket ${socket.id} connected (authenticated: ${socketData.isAuthenticated})`);

    if (socketData.isAuthenticated) {
      const connection: ClientConnection = {
        id: socket.id,
        socketId: socket.id,
        userId: socketData.userId,
        lastSync: Date.now(),
        drift: 0,
        isController: false,
        connectedAt: Date.now()
      };

      this.connectedClients.set(socket.id, connection);
      this.clockService.addClientConnection(connection);
    }

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      serverTime: Date.now(),
      authenticated: socketData.isAuthenticated
    });
  }

  private async handleTournamentJoin(socket: Socket, payload: TournamentJoinPayload): Promise<void> {
    try {
      const socketData = socket.data as SocketData;

      // Verify tournament access
      if (socketData.isAuthenticated) {
        await this.verifyTournamentAccess(socketData.userId!, payload.tournamentId);
      }

      // Join tournament room
      const roomName = `tournament:${payload.tournamentId}`;
      await socket.join(roomName);

      // Track tournament membership
      socketData.tournaments.add(payload.tournamentId);
      socketData.isController = payload.isController || false;

      // Update room tracking
      if (!this.tournamentRooms.has(payload.tournamentId)) {
        this.tournamentRooms.set(payload.tournamentId, new Set());
      }
      this.tournamentRooms.get(payload.tournamentId)!.add(socket.id);

      // Update client connection info
      const connection = this.connectedClients.get(socket.id);
      if (connection) {
        connection.isController = socketData.isController;
      }

      // Send current clock state
      const clockState = this.clockService.getClockState(payload.tournamentId);
      if (clockState) {
        socket.emit('clock:sync', clockState);
      }

      socket.emit('tournament:joined', {
        tournamentId: payload.tournamentId,
        isController: socketData.isController,
        serverTime: Date.now()
      });

      console.log(`Socket ${socket.id} joined tournament ${payload.tournamentId} (controller: ${socketData.isController})`);

    } catch (error) {
      console.error('Tournament join error:', error);
      socket.emit('tournament:joinError', {
        tournamentId: payload.tournamentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private handleTournamentLeave(socket: Socket, tournamentId: string): void {
    const socketData = socket.data as SocketData;

    // Leave tournament room
    socket.leave(`tournament:${tournamentId}`);
    socketData.tournaments.delete(tournamentId);

    // Update room tracking
    const room = this.tournamentRooms.get(tournamentId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        this.tournamentRooms.delete(tournamentId);
      }
    }

    socket.emit('tournament:left', { tournamentId });
  }

  private async handleClockInitialize(socket: Socket, payload: ClockInitializePayload): Promise<void> {
    try {
      await this.verifyControllerPermissions(socket, payload.tournamentId);

      const socketData = socket.data as SocketData;
      const clockState = await this.clockService.initializeClock(
        socketData.organizationId!,
        payload.tournamentId,
        payload.blindStructure,
        payload.settings,
        socketData.userId!
      );

      socket.emit('clock:initialized', clockState);

    } catch (error) {
      this.handleSocketError(socket, 'clock:initializeError', error);
    }
  }

  private async handleClockStart(socket: Socket, payload: ClockStartPayload): Promise<void> {
    try {
      await this.verifyControllerPermissions(socket, payload.tournamentId);

      const socketData = socket.data as SocketData;
      const _clockState = await this.clockService.startClock(
        payload.tournamentId,
        socketData.userId!,
        payload.statistics
      );

      // Confirmation sent via clock service event listener

    } catch (error) {
      this.handleSocketError(socket, 'clock:startError', error);
    }
  }

  private async handleClockPause(socket: Socket, payload: ClockPausePayload): Promise<void> {
    try {
      await this.verifyControllerPermissions(socket, payload.tournamentId);

      const socketData = socket.data as SocketData;
      const _clockState = await this.clockService.pauseClock(
        payload.tournamentId,
        socketData.userId!,
        payload.reason,
        payload.notes
      );

      // Confirmation sent via clock service event listener

    } catch (error) {
      this.handleSocketError(socket, 'clock:pauseError', error);
    }
  }

  private async handleClockResume(socket: Socket, payload: ClockResumePayload): Promise<void> {
    try {
      await this.verifyControllerPermissions(socket, payload.tournamentId);

      const socketData = socket.data as SocketData;
      const _clockState = await this.clockService.resumeClock(
        payload.tournamentId,
        socketData.userId!,
        payload.notes
      );

      // Confirmation sent via clock service event listener

    } catch (error) {
      this.handleSocketError(socket, 'clock:resumeError', error);
    }
  }

  private async handleClockGotoLevel(socket: Socket, payload: ClockGotoLevelPayload): Promise<void> {
    try {
      await this.verifyControllerPermissions(socket, payload.tournamentId);

      const socketData = socket.data as SocketData;
      const _clockState = await this.clockService.goToLevel(
        payload.tournamentId,
        payload.levelIdx,
        socketData.userId!,
        payload.reason
      );

      // Confirmation sent via clock service event listener

    } catch (error) {
      this.handleSocketError(socket, 'clock:gotoLevelError', error);
    }
  }

  private async handleClockComplete(socket: Socket, payload: ClockControlPayload): Promise<void> {
    try {
      await this.verifyControllerPermissions(socket, payload.tournamentId);

      const socketData = socket.data as SocketData;
      const _clockState = await this.clockService.completeClock(
        payload.tournamentId,
        socketData.userId!
      );

      // Confirmation sent via clock service event listener

    } catch (error) {
      this.handleSocketError(socket, 'clock:completeError', error);
    }
  }

  private async handleTimeSyncRequest(socket: Socket, payload: TimeSyncPayload): Promise<void> {
    try {
      const syncRequest: TimeSyncRequest = {
        clientId: socket.id,
        clientTime: payload.clientTime,
        requestId: payload.requestId,
        timestamp: Date.now()
      };

      const response = await this.clockService.requestTimeSync(payload.tournamentId, syncRequest);

      socket.emit('clock:syncResponse', response);

      // Update client connection
      const connection = this.connectedClients.get(socket.id);
      if (connection) {
        connection.lastSync = Date.now();
        connection.drift = response.drift;
      }

    } catch (error) {
      this.handleSocketError(socket, 'clock:syncError', error);
    }
  }

  private handleGetClockState(socket: Socket, payload: ClockControlPayload): void {
    try {
      const clockState = this.clockService.getClockState(payload.tournamentId);

      if (clockState) {
        socket.emit('clock:state', clockState);
      } else {
        socket.emit('clock:stateError', {
          tournamentId: payload.tournamentId,
          error: 'Clock not found'
        });
      }

    } catch (error) {
      this.handleSocketError(socket, 'clock:stateError', error);
    }
  }

  private async handleUpdateStatistics(socket: Socket, payload: ClockControlPayload & { statistics: any }): Promise<void> {
    try {
      await this.verifyControllerPermissions(socket, payload.tournamentId);

      const socketData = socket.data as SocketData;
      const _clockState = await this.clockService.updateStatistics(
        payload.tournamentId,
        payload.statistics,
        socketData.userId!
      );

      // Confirmation sent via clock service event listener

    } catch (error) {
      this.handleSocketError(socket, 'clock:updateStatisticsError', error);
    }
  }

  private handleDisconnection(socket: Socket): void {
    const socketData = socket.data as SocketData;

    console.log(`Socket ${socket.id} disconnected`);

    // Remove from all tournament rooms
    for (const tournamentId of socketData.tournaments) {
      const room = this.tournamentRooms.get(tournamentId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          this.tournamentRooms.delete(tournamentId);
        }
      }
    }

    // Remove client connection
    this.connectedClients.delete(socket.id);
    this.clockService.removeClientConnection(socket.id);
  }

  private broadcastToTournament(tournamentId: string, event: string, data: any): void {
    this.io.to(`tournament:${tournamentId}`).emit(event, data);
  }

  private broadcastToControllers(tournamentId: string, event: string, data: any): void {
    const room = this.tournamentRooms.get(tournamentId);
    if (room) {
      for (const socketId of room) {
        const connection = this.connectedClients.get(socketId);
        if (connection && connection.isController) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit(event, data);
          }
        }
      }
    }
  }

  private async verifyTournamentAccess(userId: string, tournamentId: string): Promise<void> {
    const tournament = await this.prisma.tournament.findFirst({
      where: {
        id: tournamentId,
        Organization: {
          UserOrganization: {
            some: { userId }
          }
        }
      }
    });

    if (!tournament) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied to tournament'
      });
    }
  }

  private async verifyControllerPermissions(socket: Socket, tournamentId: string): Promise<void> {
    const socketData = socket.data as SocketData;

    if (!socketData.isAuthenticated) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    if (!socketData.isController) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Controller permissions required'
      });
    }

    // Verify tournament access
    await this.verifyTournamentAccess(socketData.userId!, tournamentId);

    // Additional role-based permissions could be checked here
    // For now, any authenticated controller user can control the clock
  }

  private handleSocketError(socket: Socket, event: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof TRPCError ? error.code : 'INTERNAL_SERVER_ERROR';

    console.error(`Socket ${socket.id} error in ${event}:`, error);

    socket.emit(event, {
      error: errorMessage,
      code: errorCode,
      timestamp: Date.now()
    });
  }

  // Public methods for external access
  public getConnectedClients(tournamentId?: string): ClientConnection[] {
    if (tournamentId) {
      const room = this.tournamentRooms.get(tournamentId);
      if (room) {
        return Array.from(room).map(socketId => this.connectedClients.get(socketId)!).filter(Boolean);
      }
      return [];
    }
    return Array.from(this.connectedClients.values());
  }

  public getTournamentRoomSize(tournamentId: string): number {
    return this.tournamentRooms.get(tournamentId)?.size || 0;
  }

  public async broadcastSystemMessage(tournamentId: string, message: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    this.broadcastToTournament(tournamentId, 'system:message', {
      message,
      type,
      timestamp: Date.now()
    });
  }

  public async gracefulShutdown(): Promise<void> {
    console.log('Shutting down clock controller...');

    // Notify all connected clients
    this.io.emit('system:shutdown', {
      message: 'Server is shutting down',
      timestamp: Date.now()
    });

    // Close all connections
    this.io.close();

    // Clear state
    this.connectedClients.clear();
    this.tournamentRooms.clear();
  }
}

export default ClockController;