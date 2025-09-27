# TURNUVAYONETIM Database Package

This package contains the complete database schema and utilities for the TURNUVAYONETIM poker tournament management system.

## Overview

The database is designed with the following key principles:

- **Multi-tenant Architecture**: Complete organization isolation
- **Event Sourcing**: Full audit trail and event history
- **Row Level Security**: Automatic organization scoping
- **Performance Optimization**: Strategic indexing for common queries
- **RBAC**: Role-based access control system

## Core Entities

### Organization Management
- `Organization`: Multi-tenant isolation
- `User`: User accounts with roles
- `PlayerProfile`: Extended player information and statistics

### Tournament System
- `Tournament`: Core tournament management
- `BlindStructure` & `BlindLevel`: Configurable blind structures
- `PayoutScheme` & `PayoutTier`: Prize distribution schemes
- `Entry`: Player tournament registrations
- `Elimination`: Player elimination tracking
- `Payout`: Prize distribution records

### Table Management
- `Table`: Tournament table management
- `SeatAssignment`: Player seating assignments
- `DealerSession`: Dealer assignment tracking

### League System
- `League`: Tournament leagues
- `Season`: League seasons
- `ClockState`: Real-time tournament clock state

### Event Sourcing & Audit
- `Event`: Event sourcing for all actions
- `AuditLog`: System audit trail
- `SystemConfig`: System-wide configuration

## Database Schema Features

### Multi-Tenant Security
All organization-scoped tables include `organizationId` and are automatically filtered using the `createOrganizationScopedClient` utility.

### Performance Indexes
Strategic indexes are placed on:
- All foreign keys
- Status and state fields
- Timestamp fields for sorting
- Organization ID for tenant isolation
- Frequently queried combinations

### Data Integrity
- Proper foreign key relationships with cascading rules
- Unique constraints for data consistency
- Enum types for controlled values
- JSON fields for flexible configurations

## Usage

### Basic Setup

```typescript
import { db } from '@turnuvayonetim/db'

// Direct usage
const tournaments = await db.tournament.findMany()

// With organization scoping
import { createOrganizationScopedClient } from '@turnuvayonetim/db'

const scopedDb = createOrganizationScopedClient(db, {
  organizationId: 'org_123'
})

const tournaments = await scopedDb.tournament.findMany()
// Automatically filtered to organization
```

### Event Sourcing

```typescript
import { withEventSourcing } from '@turnuvayonetim/db'

await withEventSourcing(
  db,
  async (tx) => {
    // Your transaction operations
    return await tx.tournament.create({ data: tournamentData })
  },
  {
    organizationId: 'org_123',
    eventType: 'TournamentCreated',
    aggregateId: tournamentId,
    aggregateType: 'Tournament',
    eventData: { tournamentData },
    userId: currentUserId,
  }
)
```

### Pagination

```typescript
import { getPaginationParams } from '@turnuvayonetim/db'

const { skip, take } = getPaginationParams({ page: 1, limit: 20 })

const tournaments = await db.tournament.findMany({
  skip,
  take,
  orderBy: { createdAt: 'desc' }
})
```

## Database Scripts

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Deploy migrations to production
npm run db:migrate:deploy

# Reset database (development only)
npm run db:migrate:reset

# Open Prisma Studio
npm run db:studio

# Seed the database
npm run db:seed

# Push schema to database (development)
npm run db:push

# Format schema file
npm run db:format

# Validate schema
npm run db:validate
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/turnuvayonetim"
```

## Schema Design Decisions

### User Roles
- `ADMIN`: Full system access
- `MANAGER`: Tournament management capabilities
- `DEALER`: Table operation permissions
- `PLAYER`: Player participation rights
- `VIEWER`: Read-only access

### Tournament States
- `SCHEDULED`: Tournament created but not open for registration
- `REGISTRATION_OPEN`: Players can register
- `REGISTRATION_CLOSED`: Registration closed, ready to start
- `RUNNING`: Tournament in progress
- `PAUSED`: Tournament temporarily paused
- `FINISHED`: Tournament completed
- `CANCELLED`: Tournament cancelled

### Event Sourcing Pattern
All significant actions are recorded as events with:
- Event type and aggregate information
- Complete event data
- Metadata for additional context
- User and timestamp tracking

### Performance Considerations
- Proper indexing on frequently queried fields
- Pagination support for large datasets
- Organization-scoped queries to reduce data volume
- Efficient relationship loading with proper includes

## Migration Strategy

1. **Development**: Use `db:migrate` for schema changes
2. **Production**: Use `db:migrate:deploy` for automated deployments
3. **Data Seeding**: Use `db:seed` for initial data setup
4. **Schema Validation**: Use `db:validate` before deployments

## Row Level Security (RLS)

The schema is designed to support PostgreSQL Row Level Security policies:

```sql
-- Example RLS policy for tournaments
CREATE POLICY tournament_organization_isolation ON tournaments
  FOR ALL TO authenticated_users
  USING (organization_id = current_setting('app.current_organization_id'));
```

## Backup and Recovery

Recommended backup strategy:
1. Daily full database backups
2. Transaction log backups every 15 minutes
3. Point-in-time recovery capability
4. Cross-region backup replication for production

## Monitoring

Key metrics to monitor:
- Query performance on indexed fields
- Table growth rates (especially events and audit_logs)
- Connection pool utilization
- Lock contention on high-frequency tables

## Support

For database-related issues or questions, refer to:
- Prisma documentation: https://www.prisma.io/docs
- PostgreSQL documentation: https://www.postgresql.org/docs
- Project issues: https://github.com/your-org/turnuvayonetim/issues