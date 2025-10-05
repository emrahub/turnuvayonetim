# Tournament WebSocket Server

Real-time WebSocket server for the TURNUVAYONETIM poker tournament management system.

## Features

- **Real-time tournament clock synchronization**
- **Live player updates** (registration, elimination, chip counts)
- **Tournament state management** (start, pause, resume, level changes)
- **Multi-server scaling** with Redis adapter
- **JWT authentication** middleware
- **Connection health monitoring** with ping/pong
- **Comprehensive error handling** and graceful shutdown
- **Room-based tournament isolation**

## Event Documentation

### Client Events (Incoming)

#### Tournament Management
- `tournament:join` - Join a tournament room
- `tournament:create` - Create new tournament
- `tournament:start` - Start tournament
- `tournament:pause` - Pause tournament
- `tournament:resume` - Resume tournament
- `tournament:nextLevel` - Advance to next blind level
- `tournament:previousLevel` - Go back to previous level

#### Clock Control
- `clock:start` - Start tournament clock
- `clock:pause` - Pause tournament clock
- `clock:resume` - Resume tournament clock

#### Player Management
- `player:register` - Register new player
- `player:eliminate` - Eliminate player
- `player:updateChips` - Update player chip count
- `player:rebuy` - Process player rebuy
- `player:addon` - Process player addon

#### Connection Health
- `ping` - Client heartbeat ping

### Server Events (Outgoing)

#### Connection
- `connected` - Initial connection confirmation
- `pong` - Server heartbeat response

#### Tournament Updates
- `tournament:created` - Tournament created
- `tournament:started` - Tournament started
- `tournament:paused` - Tournament paused
- `tournament:resumed` - Tournament resumed
- `tournament:joined` - Successfully joined tournament

#### Clock Updates
- `clock:sync` - Clock state synchronization (4 times per second)
- `clock:started` - Clock started
- `clock:paused` - Clock paused
- `clock:resumed` - Clock resumed
- `clock:levelChanged` - Level changed
- `clock:completed` - Tournament completed

#### Player Updates
- `player:registered` - New player registered
- `player:eliminated` - Player eliminated
- `player:updated` - Player data updated
- `player:rebuy` - Player rebuy processed
- `player:addon` - Player addon processed

#### Error Handling
- `error` - Error message

## Setup and Configuration

### Environment Variables

Create a `.env` file (use `.env.example` as template):

```bash
# WebSocket Server Configuration
WS_PORT=3003
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/turnuva"

# JWT Configuration
JWT_SECRET="your-secret-key-here"

# Frontend URL for CORS
NEXT_PUBLIC_APP_URL="http://localhost:3005"

# Redis Configuration (optional for scaling)
REDIS_URL="redis://localhost:6379"
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Testing Connection

```bash
npm run test:connection
```

## Authentication

The server uses JWT authentication middleware. Clients must provide a valid JWT token in the connection handshake:

```javascript
const socket = io('ws://localhost:3003', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Scaling

For production deployments with multiple server instances, configure Redis:

1. Set `REDIS_URL` environment variable
2. The server automatically configures Socket.IO Redis adapter
3. All events are synchronized across server instances

## Room Management

Tournaments are isolated using Socket.IO rooms:
- Each tournament has its own room: `tournament:{tournamentId}`
- Events are broadcast only to clients in the specific tournament room
- Clients automatically join/leave rooms when connecting to tournaments

## Connection Health

The server implements ping/pong heartbeat:
- Client sends `ping` with timestamp
- Server responds with `pong` including latency calculation
- Built-in Socket.IO ping interval: 25 seconds
- Connection timeout: 60 seconds

## Error Handling

Comprehensive error handling includes:
- Database connection errors
- JWT authentication failures
- Tournament not found errors
- Player operation errors
- Graceful shutdown on SIGTERM/SIGINT
- Uncaught exception handling

## Clock Engine

The tournament clock engine provides:
- High-precision timing with drift correction
- Database synchronization
- Automatic level progression
- Pause/resume functionality
- Event emission for real-time updates

## Logging

Structured logging with levels:
- `INFO` - General information
- `ERROR` - Error conditions
- `WARN` - Warning conditions
- `DEBUG` - Debug information (development only)

All logs include timestamps and contextual data.

## Database Integration

The server integrates with Prisma ORM for:
- Tournament data management
- Player entries and statistics
- Clock state persistence
- Blind structure storage

## API Compatibility

The WebSocket server is designed to work seamlessly with the frontend tournament store and provides real-time updates for all tournament operations.