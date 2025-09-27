# Row Level Security (RLS) Implementation Strategy

This document outlines the implementation strategy for Row Level Security in the TURNUVAYONETIM database to ensure complete multi-tenant isolation.

## Overview

Row Level Security (RLS) provides an additional layer of security beyond the application-level organization scoping. It ensures that even if there are bugs in the application code, users cannot access data from other organizations.

## PostgreSQL RLS Implementation

### 1. Enable RLS on Organization-Scoped Tables

```sql
-- Enable RLS on all organization-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE blind_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

### 2. Create RLS Policies

```sql
-- Function to get current organization ID from session
CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_organization_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations: Users can only see their own organization
CREATE POLICY organization_isolation ON organizations
  FOR ALL TO authenticated_users
  USING (id = current_organization_id());

-- Users: Can only see users from their organization
CREATE POLICY user_organization_isolation ON users
  FOR ALL TO authenticated_users
  USING (organization_id = current_organization_id());

-- Tournaments: Can only see tournaments from their organization
CREATE POLICY tournament_organization_isolation ON tournaments
  FOR ALL TO authenticated_users
  USING (organization_id = current_organization_id());

-- Leagues: Can only see leagues from their organization
CREATE POLICY league_organization_isolation ON leagues
  FOR ALL TO authenticated_users
  USING (organization_id = current_organization_id());

-- Blind Structures: Can only see blind structures from their organization
CREATE POLICY blind_structure_organization_isolation ON blind_structures
  FOR ALL TO authenticated_users
  USING (organization_id = current_organization_id());

-- Payout Schemes: Can only see payout schemes from their organization
CREATE POLICY payout_scheme_organization_isolation ON payout_schemes
  FOR ALL TO authenticated_users
  USING (organization_id = current_organization_id());

-- Events: Can only see events from their organization
CREATE POLICY event_organization_isolation ON events
  FOR ALL TO authenticated_users
  USING (organization_id = current_organization_id());
```

### 3. Create Database Roles

```sql
-- Create application role
CREATE ROLE authenticated_users;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated_users;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated_users;

-- Create specific roles for different access levels
CREATE ROLE tournament_admin;
CREATE ROLE tournament_manager;
CREATE ROLE tournament_dealer;
CREATE ROLE tournament_player;
CREATE ROLE tournament_viewer;

-- Grant appropriate permissions to each role
GRANT authenticated_users TO tournament_admin;
GRANT authenticated_users TO tournament_manager;
GRANT authenticated_users TO tournament_dealer;
GRANT authenticated_users TO tournament_player;
GRANT authenticated_users TO tournament_viewer;
```

### 4. Role-Based Policies

```sql
-- Admin: Full access within organization
CREATE POLICY admin_full_access ON tournaments
  FOR ALL TO tournament_admin
  USING (organization_id = current_organization_id());

-- Manager: Can manage tournaments
CREATE POLICY manager_tournament_access ON tournaments
  FOR ALL TO tournament_manager
  USING (
    organization_id = current_organization_id() AND
    (created_by_id = current_user_id() OR managed_by_id = current_user_id())
  );

-- Player: Can only see tournaments they're registered for
CREATE POLICY player_tournament_access ON tournaments
  FOR SELECT TO tournament_player
  USING (
    organization_id = current_organization_id() AND
    EXISTS (
      SELECT 1 FROM entries e
      JOIN player_profiles pp ON e.player_profile_id = pp.id
      JOIN users u ON pp.user_id = u.id
      WHERE e.tournament_id = tournaments.id
        AND u.id = current_user_id()
    )
  );

-- Viewer: Read-only access to published tournaments
CREATE POLICY viewer_tournament_access ON tournaments
  FOR SELECT TO tournament_viewer
  USING (
    organization_id = current_organization_id() AND
    status NOT IN ('SCHEDULED', 'CANCELLED')
  );
```

## Application Integration

### 1. Connection Configuration

```typescript
// Database connection with RLS context
export async function createSecureConnection(
  organizationId: string,
  userId: string,
  userRole: UserRole
): Promise<PrismaClient> {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // Set session variables for RLS
  await client.$executeRaw`
    SELECT set_config('app.current_organization_id', ${organizationId}, true)
  `

  await client.$executeRaw`
    SELECT set_config('app.current_user_id', ${userId}, true)
  `

  // Set appropriate role
  const roleMapping = {
    ADMIN: 'tournament_admin',
    MANAGER: 'tournament_manager',
    DEALER: 'tournament_dealer',
    PLAYER: 'tournament_player',
    VIEWER: 'tournament_viewer'
  }

  await client.$executeRaw`
    SET ROLE ${roleMapping[userRole]}
  `

  return client
}
```

### 2. Middleware Implementation

```typescript
// Express middleware for RLS setup
export function setupRLSMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { organizationId, userId, userRole } = req.user

  req.db = createSecureConnection(organizationId, userId, userRole)

  next()
}
```

### 3. Next.js API Route Integration

```typescript
// API route with RLS
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await createSecureConnection(
    session.user.organizationId,
    session.user.id,
    session.user.role
  )

  try {
    const tournaments = await db.tournament.findMany()
    // RLS automatically filters to organization
    return NextResponse.json(tournaments)
  } finally {
    await db.$disconnect()
  }
}
```

## Security Benefits

### 1. Defense in Depth
- Application-level filtering
- Database-level enforcement
- Role-based access control

### 2. Automatic Enforcement
- Cannot be bypassed by application bugs
- Enforced at the database level
- Consistent across all queries

### 3. Audit and Compliance
- All access is logged
- Policies are transparent
- Meets regulatory requirements

## Performance Considerations

### 1. Index Optimization
```sql
-- Ensure organization_id is properly indexed
CREATE INDEX CONCURRENTLY idx_users_organization_id ON users(organization_id);
CREATE INDEX CONCURRENTLY idx_tournaments_organization_id ON tournaments(organization_id);
CREATE INDEX CONCURRENTLY idx_events_organization_id ON events(organization_id);
```

### 2. Query Plan Analysis
```sql
-- Analyze query performance with RLS
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM tournaments
WHERE status = 'RUNNING';
```

### 3. Connection Pooling
```typescript
// Use connection pooling with RLS context
const pools = new Map<string, PrismaClient>()

function getPooledConnection(orgId: string, userId: string, role: UserRole) {
  const key = `${orgId}:${role}`

  if (!pools.has(key)) {
    pools.set(key, createSecureConnection(orgId, userId, role))
  }

  return pools.get(key)!
}
```

## Migration Strategy

### 1. Phase 1: Application-Level RLS
- Implement utility functions with organization scoping
- Add middleware for automatic filtering
- Test thoroughly in development

### 2. Phase 2: Database-Level RLS
- Enable RLS on tables gradually
- Create and test policies
- Monitor performance impact

### 3. Phase 3: Full Enforcement
- Remove application-level checks where redundant
- Enable strict RLS enforcement
- Regular security audits

## Monitoring and Maintenance

### 1. Policy Effectiveness
```sql
-- Monitor RLS policy usage
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### 2. Performance Monitoring
```sql
-- Monitor query performance
SELECT query, total_exec_time, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%tournaments%'
ORDER BY total_exec_time DESC;
```

### 3. Security Auditing
```sql
-- Check for policy violations (should return 0)
SELECT COUNT(*) as potential_violations
FROM tournaments t1
JOIN tournaments t2 ON t1.organization_id != t2.organization_id
WHERE current_setting('app.current_organization_id') = t1.organization_id;
```

## Testing Strategy

### 1. Unit Tests
```typescript
describe('RLS Policies', () => {
  it('should isolate organizations', async () => {
    const org1DB = await createSecureConnection('org1', 'user1', 'ADMIN')
    const org2DB = await createSecureConnection('org2', 'user2', 'ADMIN')

    const org1Tournaments = await org1DB.tournament.findMany()
    const org2Tournaments = await org2DB.tournament.findMany()

    // Should not overlap
    expect(org1Tournaments.some(t =>
      org2Tournaments.find(t2 => t2.id === t.id)
    )).toBe(false)
  })
})
```

### 2. Integration Tests
```typescript
describe('Role-Based Access', () => {
  it('should restrict player access', async () => {
    const playerDB = await createSecureConnection('org1', 'player1', 'PLAYER')

    // Player should only see tournaments they're registered for
    const tournaments = await playerDB.tournament.findMany()

    for (const tournament of tournaments) {
      const hasEntry = await playerDB.entry.findFirst({
        where: {
          tournamentId: tournament.id,
          playerProfile: { userId: 'player1' }
        }
      })
      expect(hasEntry).toBeTruthy()
    }
  })
})
```

This RLS implementation provides a robust security foundation for the multi-tenant TURNUVAYONETIM system, ensuring complete data isolation while maintaining performance and usability.