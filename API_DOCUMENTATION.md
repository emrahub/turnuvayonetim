# API Documentation - TURNUVAYONETIM

## Overview

TURNUVAYONETIM provides both tRPC and REST API endpoints for tournament management. The primary API is tRPC for type-safe communication, with REST endpoints available for external integrations.

## Base URLs

```yaml
Development:
  API: http://localhost:4000
  WebSocket: ws://localhost:3003
  tRPC: http://localhost:4000/trpc

Production:
  API: https://api.turnuvayonetim.com
  WebSocket: wss://ws.turnuvayonetim.com
  tRPC: https://api.turnuvayonetim.com/trpc
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role: 'ADMIN' | 'DIRECTOR' | 'STAFF' | 'PLAYER';
  iat: number;
  exp: number;
}
```

---

## tRPC API (Primary)

### Setup Client

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../backend/src/routers';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:4000/trpc',
      headers() {
        return {
          authorization: `Bearer ${getToken()}`,
        };
      },
    }),
  ],
});
```

### Authentication Router

#### `auth.login`
Login with email and password.

```typescript
const result = await trpc.auth.login.mutate({
  email: 'user@example.com',
  password: 'password123',
  rememberMe: true
});

// Response
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    organization?: Organization;
  },
  accessToken: string;
  refreshToken: string;
}
```

#### `auth.register`
Create a new user account.

```typescript
const result = await trpc.auth.register.mutate({
  email: 'user@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  organizationId?: 'org_123'
});
```

#### `auth.me`
Get current authenticated user.

```typescript
const user = await trpc.auth.me.query();

// Response
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  organization?: Organization;
}
```

#### `auth.refreshToken`
Refresh access token.

```typescript
const result = await trpc.auth.refreshToken.mutate({
  refreshToken: 'refresh_token_here'
});

// Response
{
  accessToken: string;
  user: User;
}
```

### Tournament Router

#### `tournament.create`
Create a new tournament.

```typescript
const tournament = await trpc.tournament.create.mutate({
  name: 'Friday Night Poker',
  buyIn: 100,
  startingStack: 10000,
  blindLevelDuration: 20, // minutes
  maxPlayers: 100,
  lateRegistrationLevels: 6,
  rebuyLevels: 6,
  startTime: '2025-01-01T20:00:00Z'
});
```

#### `tournament.list`
Get all tournaments with filters.

```typescript
const tournaments = await trpc.tournament.list.query({
  status: 'SCHEDULED', // SCHEDULED, RUNNING, PAUSED, COMPLETED
  organizationId?: 'org_123',
  limit: 10,
  offset: 0
});

// Response
{
  tournaments: Tournament[];
  total: number;
}
```

#### `tournament.get`
Get tournament details by ID.

```typescript
const tournament = await trpc.tournament.get.query({
  id: 'tournament_123'
});
```

#### `tournament.update`
Update tournament settings.

```typescript
const updated = await trpc.tournament.update.mutate({
  id: 'tournament_123',
  name?: 'Updated Name',
  blindLevelDuration?: 25,
  maxPlayers?: 150
});
```

#### `tournament.start`
Start a tournament.

```typescript
await trpc.tournament.start.mutate({
  id: 'tournament_123'
});
```

#### `tournament.pause`
Pause a running tournament.

```typescript
await trpc.tournament.pause.mutate({
  id: 'tournament_123',
  reason?: 'Technical issue'
});
```

#### `tournament.complete`
Mark tournament as completed.

```typescript
await trpc.tournament.complete.mutate({
  id: 'tournament_123'
});
```

### Player Router

#### `player.register`
Register a player for a tournament.

```typescript
const registration = await trpc.player.register.mutate({
  tournamentId: 'tournament_123',
  playerId: 'player_456',
  buyIn: 100,
  tableNumber?: 1,
  seatNumber?: 5
});
```

#### `player.list`
Get all players in a tournament.

```typescript
const players = await trpc.player.list.query({
  tournamentId: 'tournament_123',
  status?: 'ACTIVE', // ACTIVE, ELIMINATED, SITTING_OUT
  orderBy?: 'chips' // chips, name, position
});
```

#### `player.eliminate`
Eliminate a player from tournament.

```typescript
await trpc.player.eliminate.mutate({
  tournamentId: 'tournament_123',
  playerId: 'player_456',
  finishPosition: 5,
  prize?: 500
});
```

#### `player.updateChips`
Update player's chip count.

```typescript
await trpc.player.updateChips.mutate({
  tournamentId: 'tournament_123',
  playerId: 'player_456',
  chips: 15000
});
```

#### `player.rebuy`
Process a player rebuy.

```typescript
await trpc.player.rebuy.mutate({
  tournamentId: 'tournament_123',
  playerId: 'player_456',
  chips: 10000,
  cost: 100
});
```

### Clock Router

#### `clock.getState`
Get current clock state for a tournament.

```typescript
const state = await trpc.clock.getState.query({
  tournamentId: 'tournament_123'
});

// Response
{
  currentLevel: 3;
  timeRemaining: 745; // seconds
  isPaused: false;
  isBreak: false;
  totalElapsed: 3255;
  nextLevel: {
    levelNumber: 4;
    smallBlind: 200;
    bigBlind: 400;
    ante: 50;
    duration: 20;
  }
}
```

#### `clock.start`
Start the tournament clock.

```typescript
await trpc.clock.start.mutate({
  tournamentId: 'tournament_123'
});
```

#### `clock.pause`
Pause the tournament clock.

```typescript
await trpc.clock.pause.mutate({
  tournamentId: 'tournament_123'
});
```

#### `clock.resume`
Resume a paused clock.

```typescript
await trpc.clock.resume.mutate({
  tournamentId: 'tournament_123'
});
```

#### `clock.setLevel`
Manually set the blind level.

```typescript
await trpc.clock.setLevel.mutate({
  tournamentId: 'tournament_123',
  level: 5
});
```

### Table Router

#### `table.list`
Get all tables in a tournament.

```typescript
const tables = await trpc.table.list.query({
  tournamentId: 'tournament_123'
});

// Response
[
  {
    tableNumber: 1,
    seats: [
      { seatNumber: 1, playerId: 'player_123', chips: 10000 },
      { seatNumber: 2, playerId: 'player_456', chips: 15000 },
      // ...
    ]
  }
]
```

#### `table.balance`
Trigger automatic table balancing.

```typescript
await trpc.table.balance.mutate({
  tournamentId: 'tournament_123'
});
```

#### `table.movePlayer`
Manually move a player to a different table/seat.

```typescript
await trpc.table.movePlayer.mutate({
  tournamentId: 'tournament_123',
  playerId: 'player_456',
  toTable: 2,
  toSeat: 8
});
```

#### `table.break`
Break a specific table.

```typescript
await trpc.table.break.mutate({
  tournamentId: 'tournament_123',
  tableNumber: 5
});
```

---

## REST API (External Integration)

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticate user and receive tokens.

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST `/api/auth/register`
Create new user account.

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

#### POST `/api/auth/refresh`
Refresh access token.

```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

#### GET `/api/auth/me`
Get current user information.

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Tournament Endpoints

#### GET `/api/tournaments`
List all tournaments.

```bash
curl http://localhost:4000/api/tournaments \
  -H "Authorization: Bearer <token>"
```

Query Parameters:
- `status`: Filter by status (SCHEDULED, RUNNING, COMPLETED)
- `limit`: Number of results (default: 10)
- `offset`: Pagination offset (default: 0)

#### GET `/api/tournaments/:id`
Get tournament details.

```bash
curl http://localhost:4000/api/tournaments/tournament_123 \
  -H "Authorization: Bearer <token>"
```

#### POST `/api/tournaments`
Create new tournament.

```bash
curl -X POST http://localhost:4000/api/tournaments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Friday Night Poker",
    "buyIn": 100,
    "startingStack": 10000,
    "blindLevelDuration": 20,
    "maxPlayers": 100
  }'
```

#### PUT `/api/tournaments/:id`
Update tournament.

```bash
curl -X PUT http://localhost:4000/api/tournaments/tournament_123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Tournament Name",
    "maxPlayers": 150
  }'
```

### Player Endpoints

#### GET `/api/tournaments/:id/players`
Get all players in tournament.

```bash
curl http://localhost:4000/api/tournaments/tournament_123/players \
  -H "Authorization: Bearer <token>"
```

#### POST `/api/tournaments/:id/players`
Register player for tournament.

```bash
curl -X POST http://localhost:4000/api/tournaments/tournament_123/players \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player_456",
    "buyIn": 100
  }'
```

#### PUT `/api/tournaments/:id/players/:playerId`
Update player information.

```bash
curl -X PUT http://localhost:4000/api/tournaments/tournament_123/players/player_456 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "chips": 15000,
    "status": "ACTIVE"
  }'
```

#### DELETE `/api/tournaments/:id/players/:playerId`
Remove player from tournament.

```bash
curl -X DELETE http://localhost:4000/api/tournaments/tournament_123/players/player_456 \
  -H "Authorization: Bearer <token>"
```

### Clock Endpoints

#### GET `/api/tournaments/:id/clock`
Get current clock state.

```bash
curl http://localhost:4000/api/tournaments/tournament_123/clock \
  -H "Authorization: Bearer <token>"
```

#### POST `/api/tournaments/:id/clock/start`
Start tournament clock.

```bash
curl -X POST http://localhost:4000/api/tournaments/tournament_123/clock/start \
  -H "Authorization: Bearer <token>"
```

#### POST `/api/tournaments/:id/clock/pause`
Pause tournament clock.

```bash
curl -X POST http://localhost:4000/api/tournaments/tournament_123/clock/pause \
  -H "Authorization: Bearer <token>"
```

#### POST `/api/tournaments/:id/clock/resume`
Resume paused clock.

```bash
curl -X POST http://localhost:4000/api/tournaments/tournament_123/clock/resume \
  -H "Authorization: Bearer <token>"
```

---

## WebSocket API

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3003', {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### Tournament Room

Join a tournament room to receive real-time updates:

```javascript
// Join tournament room
socket.emit('tournament:join', {
  tournamentId: 'tournament_123'
});

// Leave tournament room
socket.emit('tournament:leave', {
  tournamentId: 'tournament_123'
});
```

### Clock Events

#### Client → Server

```javascript
// Start clock
socket.emit('clock:start', {
  tournamentId: 'tournament_123'
});

// Pause clock
socket.emit('clock:pause', {
  tournamentId: 'tournament_123'
});

// Resume clock
socket.emit('clock:resume', {
  tournamentId: 'tournament_123'
});

// Set level
socket.emit('clock:setLevel', {
  tournamentId: 'tournament_123',
  level: 5
});
```

#### Server → Client

```javascript
// Clock tick (every second)
socket.on('clock:tick', (data) => {
  console.log('Clock update:', data);
  // {
  //   tournamentId: 'tournament_123',
  //   currentLevel: 3,
  //   timeRemaining: 745,
  //   isPaused: false,
  //   isBreak: false
  // }
});

// Level change
socket.on('clock:levelChange', (data) => {
  console.log('New level:', data);
  // {
  //   tournamentId: 'tournament_123',
  //   level: 4,
  //   smallBlind: 200,
  //   bigBlind: 400,
  //   ante: 50
  // }
});

// Break started
socket.on('clock:breakStarted', (data) => {
  console.log('Break started:', data);
  // {
  //   tournamentId: 'tournament_123',
  //   duration: 600 // seconds
  // }
});
```

### Player Events

#### Server → Client

```javascript
// Player registered
socket.on('player:registered', (data) => {
  // {
  //   tournamentId: 'tournament_123',
  //   playerId: 'player_456',
  //   totalPlayers: 45
  // }
});

// Player eliminated
socket.on('player:eliminated', (data) => {
  // {
  //   tournamentId: 'tournament_123',
  //   playerId: 'player_456',
  //   finishPosition: 5,
  //   remainingPlayers: 4
  // }
});

// Player moved
socket.on('player:moved', (data) => {
  // {
  //   tournamentId: 'tournament_123',
  //   playerId: 'player_456',
  //   fromTable: 3,
  //   fromSeat: 7,
  //   toTable: 1,
  //   toSeat: 4
  // }
});
```

### Table Events

#### Server → Client

```javascript
// Tables balanced
socket.on('table:balanced', (data) => {
  // {
  //   tournamentId: 'tournament_123',
  //   tables: [...]
  // }
});

// Table broken
socket.on('table:broken', (data) => {
  // {
  //   tournamentId: 'tournament_123',
  //   tableNumber: 5,
  //   playersReseated: [...]
  // }
});
```

### Tournament Events

#### Server → Client

```javascript
// Tournament started
socket.on('tournament:started', (data) => {
  // {
  //   tournamentId: 'tournament_123',
  //   startTime: '2025-01-01T20:00:00Z'
  // }
});

// Tournament paused
socket.on('tournament:paused', (data) => {
  // {
  //   tournamentId: 'tournament_123',
  //   reason: 'Technical issue'
  // }
});

// Tournament completed
socket.on('tournament:completed', (data) => {
  // {
  //   tournamentId: 'tournament_123',
  //   winner: 'player_123',
  //   totalPrizePool: 10000
  // }
});

// Announcement
socket.on('tournament:announcement', (data) => {
  // {
  //   tournamentId: 'tournament_123',
  //   message: 'Late registration closing in 5 minutes',
  //   priority: 'info' // info, warning, urgent
  // }
});
```

---

## Error Responses

### Error Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error context"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INTERNAL_ERROR` | 500 | Server error |
| `RATE_LIMITED` | 429 | Too many requests |

### tRPC Error Handling

```typescript
try {
  await trpc.tournament.create.mutate(data);
} catch (error) {
  if (error instanceof TRPCError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Handle auth error
        break;
      case 'CONFLICT':
        // Handle duplicate
        break;
      default:
        // Handle other errors
    }
  }
}
```

---

## Rate Limiting

API endpoints are rate limited to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Read operations | 100 requests | 1 minute |
| Write operations | 30 requests | 1 minute |
| WebSocket connections | 5 connections | Per IP |

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200000
```

---

## Webhooks (Future)

Planned webhook events for external integrations:

```javascript
// Webhook payload example
{
  "event": "tournament.completed",
  "timestamp": "2025-01-01T23:30:00Z",
  "data": {
    "tournamentId": "tournament_123",
    "winner": "player_123",
    "totalPlayers": 100,
    "duration": 12600 // seconds
  },
  "signature": "sha256=..." // HMAC signature
}
```

Planned webhook events:
- `tournament.created`
- `tournament.started`
- `tournament.completed`
- `player.registered`
- `player.eliminated`
- `level.changed`

---

## SDK Examples

### JavaScript/TypeScript SDK

```typescript
import { TurnuvaYonetimClient } from '@turnuvayonetim/sdk';

const client = new TurnuvaYonetimClient({
  apiUrl: 'http://localhost:4000',
  wsUrl: 'ws://localhost:3003',
  token: 'your_jwt_token'
});

// Create tournament
const tournament = await client.tournaments.create({
  name: 'Friday Night Poker',
  buyIn: 100,
  startingStack: 10000
});

// Listen to real-time updates
client.on('clock:tick', (state) => {
  console.log('Clock:', state);
});

// Join tournament room
await client.tournaments.join(tournament.id);
```

### Python SDK (Planned)

```python
from turnuvayonetim import Client

client = Client(
    api_url="http://localhost:4000",
    ws_url="ws://localhost:3003",
    token="your_jwt_token"
)

# Create tournament
tournament = client.tournaments.create(
    name="Friday Night Poker",
    buy_in=100,
    starting_stack=10000
)

# Register player
client.players.register(
    tournament_id=tournament.id,
    player_id="player_123"
)
```

---

## API Versioning

The API uses URL versioning for major versions:

```yaml
Current: /api/v1/
Future: /api/v2/
```

Breaking changes will be introduced in new versions with a deprecation period of 6 months for old versions.

---

## Testing the API

### Using cURL

```bash
# Get access token
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.accessToken')

# Use token in requests
curl http://localhost:4000/api/tournaments \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

Import the Postman collection from `/docs/postman/turnuvayonetim.postman_collection.json`

### Using Thunder Client (VS Code)

Import the Thunder Client collection from `/docs/thunder/turnuvayonetim_thunder.json`

---

*For more examples and detailed integration guides, see the `/examples` directory in the repository.*