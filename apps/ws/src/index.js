"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const clock_engine_1 = require("./clock-engine");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const httpServer = (0, http_1.createServer)();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
    },
});
const PORT = process.env.WS_PORT || 3001;
const clocks = new Map();
// Authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
    }
    catch (err) {
        next(new Error('Authentication error'));
    }
});
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    // Tournament events
    socket.on('tournament:join', async (data) => {
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
    socket.on('clock:start', async (data) => {
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
            const syncCallback = async (state) => {
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
                }
                catch (error) {
                    console.error('Database sync error:', error);
                }
            };
            clock = new clock_engine_1.ClockEngine(tournamentId, levels, syncCallback);
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
    socket.on('clock:pause', async (data) => {
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
    socket.on('clock:resume', async (data) => {
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
        const { tournamentId, name, buyIn } = data;
        // Create entry
        const entry = await prisma.entry.create({
            data: {
                tournamentId,
                displayName: name,
                chipCount: buyIn,
                status: 'ACTIVE'
            }
        });
        // Broadcast update
        io.to(`tournament:${tournamentId}`).emit('player:registered', {
            entry,
            totalPlayers: await prisma.entry.count({
                where: { tournamentId }
            })
        });
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
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});
httpServer.listen(PORT, () => {
    console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map