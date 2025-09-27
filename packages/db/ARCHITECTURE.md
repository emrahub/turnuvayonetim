# TURNUVAYONETIM Database Architecture

## Overview

The TURNUVAYONETIM database is designed as a comprehensive poker tournament management system with enterprise-grade features including multi-tenancy, event sourcing, role-based access control, and real-time state management.

## Architecture Principles

### 1. Multi-Tenant Design
- **Organization Isolation**: Complete data separation between organizations
- **Horizontal Scaling**: Easy to shard by organization
- **Security**: Row-level security enforcement
- **Resource Management**: Per-organization resource allocation

### 2. Event Sourcing Pattern
- **Complete Audit Trail**: Every action is recorded as an event
- **Temporal Queries**: Query system state at any point in time
- **Replay Capability**: Reconstruct state from events
- **Integration Ready**: Easy to integrate with external systems

### 3. RBAC (Role-Based Access Control)
- **Granular Permissions**: Fine-grained access control
- **Hierarchical Roles**: Admin > Manager > Dealer > Player > Viewer
- **Context-Aware**: Permissions based on tournament context
- **Secure by Default**: Least privilege principle

### 4. Real-Time State Management
- **Clock States**: Real-time tournament clock management
- **Player Tracking**: Live player positions and chip counts
- **Table Management**: Dynamic table balancing and seating
- **Event Broadcasting**: Real-time updates via events

## Core Entity Relationships

```
Organization
├── Users (RBAC)
├── Tournaments
│   ├── Entries (Players)
│   ├── Tables
│   │   └── SeatAssignments
│   ├── ClockStates
│   ├── Eliminations
│   └── Payouts
├── Leagues
│   └── Seasons
├── BlindStructures
│   └── BlindLevels
├── PayoutSchemes
│   └── PayoutTiers
└── Events (Event Sourcing)
```

## Database Schema Design

### Core Entities

#### Organizations
- **Purpose**: Multi-tenant isolation
- **Key Features**: Settings, branding, isolation
- **Relationships**: Root entity for all other data

#### Users & PlayerProfiles
- **Purpose**: Authentication and player management
- **Key Features**: RBAC, statistics, preferences
- **Separation**: Users for auth, PlayerProfiles for game data

#### Tournaments
- **Purpose**: Core tournament management
- **Key Features**: Lifecycle management, configuration
- **States**: SCHEDULED → REGISTRATION_OPEN → RUNNING → FINISHED

#### Tables & Seating
- **Purpose**: Table management and player seating
- **Key Features**: Dynamic balancing, dealer assignment
- **Real-time**: Live seat assignments and chip counts

### Supporting Entities

#### Blind Structures
- **Purpose**: Configurable tournament timing
- **Key Features**: Multiple levels, breaks, escalation
- **Flexibility**: Organization-specific structures

#### Payout Schemes
- **Purpose**: Prize distribution configuration
- **Key Features**: Percentage-based, position-specific
- **Calculation**: Automatic payout computation

#### Leagues & Seasons
- **Purpose**: Long-term tournament organization
- **Key Features**: Points tracking, seasonal play
- **Statistics**: Leaderboards and rankings

### System Entities

#### Events
- **Purpose**: Event sourcing and audit trail
- **Key Features**: Complete action history
- **Integration**: External system integration

#### ClockStates
- **Purpose**: Real-time tournament clock
- **Key Features**: Level progression, time tracking
- **Performance**: Optimized for frequent updates

## Performance Optimization

### Indexing Strategy

#### Primary Indexes
- All primary keys (UUID-based)
- Foreign key relationships
- Organization isolation (organizationId)

#### Query Optimization
- Status-based filtering (tournament.status)
- Temporal queries (createdAt, updatedAt)
- User activity (userId, playerId)

#### Composite Indexes
- Tournament + Status queries
- Organization + Type queries
- Time-based range queries

### Query Patterns

#### Multi-Tenant Queries
```sql
-- All queries automatically scoped by organization
SELECT * FROM tournaments
WHERE organization_id = ? AND status = 'RUNNING'
```

#### Event Sourcing Queries
```sql
-- Replay events for an aggregate
SELECT * FROM events
WHERE aggregate_id = ? AND aggregate_type = 'Tournament'
ORDER BY created_at ASC
```

#### Real-Time Updates
```sql
-- Current tournament state
SELECT * FROM clock_states
WHERE tournament_id = ?
ORDER BY created_at DESC LIMIT 1
```

## Security Architecture

### Row Level Security (RLS)
- **Database Level**: PostgreSQL RLS policies
- **Application Level**: Automatic organization scoping
- **Role Based**: Different access levels per role

### Data Isolation
- **Organization Scoping**: All queries filtered by organization
- **User Context**: Session-based user identification
- **Audit Trail**: Complete action logging

### Access Control Matrix

| Role    | Tournaments | Users | System |
|---------|-------------|-------|--------|
| ADMIN   | Full        | Full  | Full   |
| MANAGER | Managed     | Org   | Read   |
| DEALER  | Assigned    | Read  | None   |
| PLAYER  | Entered     | Self  | None   |
| VIEWER  | Public      | None  | None   |

## Scalability Considerations

### Horizontal Scaling
- **Organization Sharding**: Distribute by organization
- **Read Replicas**: Separate read/write workloads
- **Connection Pooling**: Efficient connection management

### Vertical Scaling
- **Indexing**: Strategic index placement
- **Partitioning**: Large table partitioning (events, audit_logs)
- **Archiving**: Historical data management

### Caching Strategy
- **Application Layer**: Tournament state caching
- **Database Layer**: Query result caching
- **Real-Time**: WebSocket state management

## Data Lifecycle Management

### Retention Policies
- **Events**: 1 year retention (configurable)
- **Audit Logs**: 90 days retention (configurable)
- **Tournament Data**: Permanent (with archiving)
- **User Data**: As per privacy policy

### Backup Strategy
- **Full Backups**: Daily with point-in-time recovery
- **Incremental**: Transaction log backups
- **Cross-Region**: Disaster recovery replication
- **Testing**: Regular backup restoration tests

### Migration Strategy
- **Schema Changes**: Prisma migrations
- **Data Migrations**: Custom migration scripts
- **Zero Downtime**: Blue-green deployments
- **Rollback**: Safe rollback procedures

## Monitoring & Observability

### Health Checks
- **Connectivity**: Database connection tests
- **Performance**: Query performance monitoring
- **Data Integrity**: Referential integrity checks
- **Index Usage**: Index effectiveness analysis

### Metrics
- **Query Performance**: Slow query identification
- **Connection Pool**: Pool utilization metrics
- **Table Growth**: Data growth monitoring
- **Error Rates**: Database error tracking

### Alerting
- **Performance Degradation**: Query time alerts
- **Data Integrity**: Constraint violation alerts
- **Resource Usage**: Storage and connection alerts
- **Security**: Unauthorized access attempts

## Development Workflow

### Local Development
```bash
# Setup database
npm run db:setup

# Generate client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

### Testing
```bash
# Validate schema
npm run db:validate

# Health check
npm run db:health-check

# Performance test
npm run db:perf-test
```

### Production Deployment
```bash
# Deploy migrations
npm run db:migrate:deploy

# Validate deployment
npm run db:validate

# Monitor performance
npm run db:monitor
```

## Future Enhancements

### Planned Features
- **Time-Travel Queries**: Query historical state
- **Advanced Analytics**: Statistical analysis
- **Machine Learning**: Player behavior analysis
- **Real-Time Sync**: Multi-device synchronization

### Scalability Improvements
- **Microservices**: Service decomposition
- **Event Streaming**: Real-time event processing
- **Global Distribution**: Multi-region deployment
- **Edge Caching**: Geographical data distribution

## Compliance & Governance

### Data Privacy
- **GDPR Compliance**: Right to be forgotten
- **Data Minimization**: Collect only necessary data
- **Encryption**: Data at rest and in transit
- **Access Logging**: Complete audit trail

### Regulatory Compliance
- **Gaming Regulations**: Jurisdiction-specific rules
- **Financial Compliance**: Payment processing rules
- **Audit Requirements**: Regulatory audit support
- **Data Residency**: Geographical data requirements

This architecture provides a robust, scalable, and secure foundation for the TURNUVAYONETIM poker tournament management system, capable of supporting thousands of concurrent tournaments and millions of players while maintaining data integrity and security.