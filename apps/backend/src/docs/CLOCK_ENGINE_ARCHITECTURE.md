# Enhanced Clock Engine Architecture

This document outlines the implementation of the enhanced Clock Engine for the TURNUVAYONETIM poker tournament management system. The new architecture provides server-authoritative time management, real-time synchronization, precise drift correction, and comprehensive event sourcing.

## Architecture Overview

The Clock Engine consists of four main components:

1. **Clock Event Types** (`/types/clock-events.ts`)
2. **Clock Service** (`/services/clock-service.ts`)
3. **Clock Controller** (`/controllers/clock-controller.ts`)
4. **Event Store Integration** (existing `/services/event-store.ts`)

## Key Features

### 🔒 Server-Authoritative Design
- All time calculations happen on the server
- Prevents client-side manipulation
- Ensures consistent state across all clients
- Handles network disconnections gracefully

### ⚡ Real-Time Synchronization
- WebSocket-based communication
- Sub-second precision timing
- Automatic drift detection and correction
- Tournament-specific room management

### 📊 Event Sourcing Integration
- All clock events are persisted to Event Store
- Complete audit trail of all clock operations
- State reconstruction from events
- Multi-tenant isolation

### 🎯 Precision Timing
- Millisecond-level accuracy
- Compensates for network latency
- Automatic level progression
- Configurable warning notifications

## Component Details

### Clock Event Types

Defines all possible clock events for the Event Store:

```typescript
export enum ClockEventType {
  // Lifecycle Events
  CLOCK_INITIALIZED = 'ClockInitialized',
  CLOCK_STARTED = 'ClockStarted',
  CLOCK_PAUSED = 'ClockPaused',
  CLOCK_RESUMED = 'ClockResumed',
  CLOCK_COMPLETED = 'ClockCompleted',

  // Level Management
  LEVEL_ADVANCED = 'LevelAdvanced',
  LEVEL_CHANGED = 'LevelChanged',

  // Break Management
  BREAK_STARTED = 'BreakStarted',
  BREAK_ENDED = 'BreakEnded',

  // Time Synchronization
  TIME_SYNC_REQUESTED = 'TimeSyncRequested',
  DRIFT_DETECTED = 'DriftDetected',
  DRIFT_CORRECTED = 'DriftCorrected',

  // Administrative
  CLOCK_MANUALLY_ADJUSTED = 'ClockManuallyAdjusted',
  CLOCK_ERROR_OCCURRED = 'ClockErrorOccurred',
  CLOCK_WARNING_ISSUED = 'ClockWarningIssued'
}
```

### Clock Service

Core business logic for tournament clock management:

**Key Methods:**
- `initializeClock()` - Set up a new tournament clock
- `startClock()` - Begin timing
- `pauseClock()` / `resumeClock()` - Pause/resume functionality
- `advanceLevel()` - Progress to next blind level
- `goToLevel()` - Jump to specific level
- `updateStatistics()` - Update tournament stats
- `requestTimeSync()` - Handle client synchronization

**Key Features:**
- Automatic level progression
- Break management
- Warning notifications (5min, 2min, 1min)
- Statistics tracking
- Error handling and recovery

### Clock Controller

WebSocket-based real-time communication layer:

**Socket Events:**
- `tournament:join` - Join tournament room
- `clock:start` / `clock:pause` / `clock:resume` - Control events
- `clock:gotoLevel` - Manual level changes
- `clock:requestSync` - Time synchronization
- `clock:sync` - Broadcast current state

**Security Features:**
- JWT authentication
- Role-based permissions
- Tournament access verification
- Controller authorization

### Event Store Integration

Leverages existing Event Store for persistence:

**Benefits:**
- Complete audit trail
- State reconstruction
- Temporal queries
- Multi-tenant isolation
- Horizontal scaling support

## Database Schema Updates

The implementation requires updates to the Event Store schema:

```sql
-- Updated Event model
model Event {
  id           String   @id @default(cuid())
  organizationId String -- Added for multi-tenancy
  aggregateId  String
  aggregateType String
  eventType    String
  eventData    Json
  metadata     Json?
  version      Int
  timestamp    DateTime @default(now())
  createdAt    DateTime @default(now())

  -- Optional fields for faster queries
  tournamentId String?
  tableId      String?
  userId       String?

  @@index([organizationId])
  @@index([tournamentId])
  @@index([organizationId, tournamentId])
}

-- Updated Snapshot model
model Snapshot {
  id          String   @id @default(cuid())
  organizationId String -- Added for multi-tenancy
  aggregateId String
  aggregateType String -- Added for better organization
  version     Int
  data        Json
  createdAt   DateTime @default(now())

  @@index([organizationId])
  @@index([organizationId, aggregateId])
  @@unique([organizationId, aggregateId])
}
```

## Usage Examples

### Basic Clock Setup

```typescript
import ClockService from './services/clock-service';
import { EventStore } from './services/event-store';

const clockService = new ClockService(prisma, eventStore);

// Initialize clock
const clockState = await clockService.initializeClock(
  organizationId,
  tournamentId,
  blindStructure,
  settings,
  userId
);

// Start the clock
await clockService.startClock(tournamentId, userId, statistics);
```

### WebSocket Client Integration

```typescript
// Frontend integration
const socket = io('ws://localhost:4000');

// Join tournament room
socket.emit('tournament:join', {
  tournamentId: 'tournament_123',
  isController: true
});

// Listen for clock events
socket.on('clock:sync', (state) => {
  updateClockDisplay(state);
});

socket.on('clock:levelChanged', (data) => {
  showLevelChangeNotification(data.newLevel);
});

// Control the clock (if authorized)
socket.emit('clock:start', { tournamentId: 'tournament_123' });
```

### Event Querying

```typescript
// Get all clock events for a tournament
const clockEvents = await eventStore.getTournamentEvents(
  organizationId,
  tournamentId,
  [ClockEventType.CLOCK_STARTED, ClockEventType.LEVEL_ADVANCED]
);

// Stream events in real-time
for await (const event of eventStore.streamEvents(organizationId)) {
  console.log('New event:', event.eventType, event.eventData);
}
```

## Configuration

### Environment Variables

```bash
# WebSocket Configuration
WS_PORT=3003

# Redis Configuration (optional, for horizontal scaling)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Secret for authentication
JWT_SECRET=your-secret-key
```

### Clock Settings

```typescript
const settings: ClockSettings = {
  autoAdvance: true,           // Auto-advance levels
  warningMinutes: [5, 2, 1],   // Warning notifications
  allowManualControl: true,    // Allow manual level changes
  driftCorrectionThreshold: 1000,  // 1 second drift threshold
  syncInterval: 5000,          // 5 second sync interval
  pauseOnDisconnect: false,    // Don't pause on client disconnect
  enableBreaks: true,          // Enable break levels
  breakExtension: 0            // No break extensions
};
```

## Performance Considerations

### Network Optimization
- Batched updates every 5 seconds for tick events
- Compressed WebSocket messages
- Tournament-specific rooms to reduce broadcast scope
- Client-side drift correction

### Database Optimization
- Indexed queries on organizationId and tournamentId
- Event Store snapshots for faster state reconstruction
- Connection pooling and prepared statements
- Optional Redis caching for high-traffic scenarios

### Memory Management
- Automatic cleanup of completed tournaments
- Garbage collection of old intervals
- Connection management for WebSocket clients
- Event listener cleanup on shutdown

## Error Handling

### Client Disconnection
- Graceful reconnection handling
- State synchronization on reconnect
- Optional pause-on-disconnect functionality

### Server Errors
- Comprehensive error logging
- Automatic error recovery where possible
- Graceful degradation for non-critical features
- Health check endpoints for monitoring

### Time Drift
- Automatic drift detection
- Gradual correction for small drifts
- Immediate correction for large drifts
- Client notification of corrections

## Security

### Authentication
- JWT-based authentication for WebSocket connections
- User session validation
- Organization membership verification

### Authorization
- Role-based access control
- Tournament-specific permissions
- Controller authorization for clock operations
- Audit logging for all administrative actions

### Data Protection
- Multi-tenant data isolation
- Encrypted WebSocket connections (WSS in production)
- Input validation and sanitization
- SQL injection prevention through Prisma

## Monitoring and Observability

### Health Checks
- `/health` - Overall system health
- `/clock/status` - Clock service status
- WebSocket connection monitoring
- Event Store health verification

### Metrics
- Connected client count
- Active tournament count
- Event processing rate
- Average drift measurements
- Error rates and types

### Logging
- Structured logging with timestamps
- Error stack traces
- Performance metrics
- Audit trail through Event Store

## Deployment

### Docker Configuration

```dockerfile
# Add to existing Dockerfile
EXPOSE 4000 3003
ENV WS_PORT=3003
ENV NODE_ENV=production
```

### Load Balancing
- Sticky sessions for WebSocket connections
- Redis for session sharing across instances
- Event Store for state synchronization
- Health check endpoints for load balancer

### Scaling
- Horizontal scaling through Redis pub/sub
- Database read replicas for queries
- CDN for static assets
- Container orchestration support

## Migration Guide

### From Existing Implementation

1. **Install Dependencies**
   ```bash
   npm install socket.io @types/uuid uuid
   ```

2. **Update Database Schema**
   ```bash
   npx prisma db push
   ```

3. **Update Environment Variables**
   Add WebSocket and Redis configuration

4. **Client-Side Updates**
   Update frontend to use new WebSocket events

5. **Test Integration**
   Run comprehensive tests before production deployment

## Testing

### Unit Tests
- Clock Service methods
- Event Store integration
- Time calculation accuracy
- Error handling scenarios

### Integration Tests
- WebSocket communication
- Multi-client synchronization
- Database persistence
- Authentication flow

### Performance Tests
- High client count scenarios
- Network latency simulation
- Memory usage under load
- Event processing throughput

## Troubleshooting

### Common Issues

1. **Clock Drift**
   - Check network latency
   - Verify client-side time calculation
   - Review drift correction settings

2. **WebSocket Disconnections**
   - Check firewall settings
   - Verify load balancer configuration
   - Review connection timeout settings

3. **Event Store Issues**
   - Check database connectivity
   - Verify event serialization
   - Review indexing performance

4. **Performance Problems**
   - Monitor memory usage
   - Check database query performance
   - Review WebSocket message frequency

### Debug Commands

```bash
# Check WebSocket connections
curl http://localhost:4000/clock/status

# Monitor Event Store
curl http://localhost:4000/health

# Database queries
npx prisma studio
```

## Future Enhancements

### Planned Features
- Multi-timezone support
- Advanced statistics tracking
- Mobile app synchronization
- Voice announcements
- Custom break scheduling

### Performance Improvements
- Event Store sharding
- Advanced caching strategies
- WebRTC for peer-to-peer sync
- Edge computing deployment

### Integration Options
- Third-party tournament software
- Broadcasting systems
- Player tracking systems
- Payment processing

---

This enhanced Clock Engine provides a robust, scalable, and precise timing solution for poker tournament management. The server-authoritative design ensures accuracy and prevents manipulation, while the Event Store integration provides complete auditability and state management capabilities.