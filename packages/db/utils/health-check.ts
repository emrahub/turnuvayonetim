import { PrismaClient } from '@prisma/client'

/**
 * Database health check and validation utilities
 */

export interface HealthCheckResult {
  isHealthy: boolean
  checks: {
    name: string
    status: 'PASS' | 'FAIL' | 'WARN'
    message: string
    duration?: number
  }[]
  timestamp: Date
}

/**
 * Performs comprehensive database health check
 */
export async function performHealthCheck(client: PrismaClient): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const checks: HealthCheckResult['checks'] = []

  // 1. Basic connectivity test
  try {
    const connectStart = Date.now()
    await client.$queryRaw`SELECT 1`
    checks.push({
      name: 'Database Connectivity',
      status: 'PASS',
      message: 'Successfully connected to database',
      duration: Date.now() - connectStart,
    })
  } catch (error) {
    checks.push({
      name: 'Database Connectivity',
      status: 'FAIL',
      message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  // 2. Schema validation
  try {
    const schemaStart = Date.now()
    await validateSchema(client)
    checks.push({
      name: 'Schema Validation',
      status: 'PASS',
      message: 'All required tables and indexes exist',
      duration: Date.now() - schemaStart,
    })
  } catch (error) {
    checks.push({
      name: 'Schema Validation',
      status: 'FAIL',
      message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  // 3. Data integrity checks
  try {
    const integrityStart = Date.now()
    await validateDataIntegrity(client)
    checks.push({
      name: 'Data Integrity',
      status: 'PASS',
      message: 'No data integrity issues found',
      duration: Date.now() - integrityStart,
    })
  } catch (error) {
    checks.push({
      name: 'Data Integrity',
      status: 'WARN',
      message: `Data integrity warning: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  // 4. Performance checks
  try {
    const perfStart = Date.now()
    await validatePerformance(client)
    checks.push({
      name: 'Performance Check',
      status: 'PASS',
      message: 'Database performance is within acceptable limits',
      duration: Date.now() - perfStart,
    })
  } catch (error) {
    checks.push({
      name: 'Performance Check',
      status: 'WARN',
      message: `Performance warning: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  // 5. Index usage validation
  try {
    const indexStart = Date.now()
    await validateIndexes(client)
    checks.push({
      name: 'Index Validation',
      status: 'PASS',
      message: 'All indexes are properly utilized',
      duration: Date.now() - indexStart,
    })
  } catch (error) {
    checks.push({
      name: 'Index Validation',
      status: 'WARN',
      message: `Index warning: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  const isHealthy = checks.every(check => check.status !== 'FAIL')

  return {
    isHealthy,
    checks,
    timestamp: new Date(),
  }
}

/**
 * Validates that all required tables exist
 */
async function validateSchema(client: PrismaClient): Promise<void> {
  const requiredTables = [
    'organizations',
    'users',
    'player_profiles',
    'tournaments',
    'blind_structures',
    'blind_levels',
    'payout_schemes',
    'payout_tiers',
    'tables',
    'seat_assignments',
    'entries',
    'eliminations',
    'payouts',
    'leagues',
    'seasons',
    'clock_states',
    'events',
    'audit_logs',
    'system_config',
  ]

  const existingTables = await client.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  `

  const existingTableNames = existingTables.map(t => t.table_name)
  const missingTables = requiredTables.filter(table => !existingTableNames.includes(table))

  if (missingTables.length > 0) {
    throw new Error(`Missing required tables: ${missingTables.join(', ')}`)
  }
}

/**
 * Validates data integrity constraints
 */
async function validateDataIntegrity(client: PrismaClient): Promise<void> {
  const issues: string[] = []

  // Check for orphaned records
  const orphanedEntries = await client.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*) as count
    FROM entries e
    LEFT JOIN tournaments t ON e.tournament_id = t.id
    WHERE t.id IS NULL
  `

  if (orphanedEntries[0]?.count > 0) {
    issues.push(`${orphanedEntries[0].count} orphaned entries found`)
  }

  // Check for inconsistent tournament states
  const invalidTournamentStates = await client.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*) as count
    FROM tournaments
    WHERE status = 'FINISHED'
    AND ended_at IS NULL
  `

  if (invalidTournamentStates[0]?.count > 0) {
    issues.push(`${invalidTournamentStates[0].count} tournaments marked finished without end time`)
  }

  // Check for inconsistent player counts
  const inconsistentPlayerCounts = await client.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*) as count
    FROM clock_states cs
    JOIN (
      SELECT tournament_id, COUNT(*) as actual_count
      FROM entries
      WHERE status NOT IN ('CANCELLED', 'ELIMINATED')
      GROUP BY tournament_id
    ) e ON cs.tournament_id = e.tournament_id
    WHERE cs.remaining_players != e.actual_count
  `

  if (inconsistentPlayerCounts[0]?.count > 0) {
    issues.push(`${inconsistentPlayerCounts[0].count} tournaments with inconsistent player counts`)
  }

  if (issues.length > 0) {
    throw new Error(issues.join('; '))
  }
}

/**
 * Validates database performance
 */
async function validatePerformance(client: PrismaClient): Promise<void> {
  const issues: string[] = []

  // Check for slow queries (if pg_stat_statements is available)
  try {
    const slowQueries = await client.$queryRaw<{ query: string; mean_exec_time: number }[]>`
      SELECT query, mean_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 1000
      AND query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_exec_time DESC
      LIMIT 5
    `

    if (slowQueries.length > 0) {
      issues.push(`${slowQueries.length} slow queries detected (>1s average)`)
    }
  } catch {
    // pg_stat_statements extension might not be available
  }

  // Check table sizes
  const largeTables = await client.$queryRaw<{ table_name: string; size_mb: number }[]>`
    SELECT
      schemaname||'.'||tablename as table_name,
      pg_total_relation_size(schemaname||'.'||tablename) / 1024 / 1024 as size_mb
    FROM pg_tables
    WHERE schemaname = 'public'
    AND pg_total_relation_size(schemaname||'.'||tablename) > 1024 * 1024 * 100  -- 100MB
    ORDER BY size_mb DESC
  `

  if (largeTables.length > 0) {
    issues.push(`${largeTables.length} tables larger than 100MB detected`)
  }

  if (issues.length > 0) {
    throw new Error(issues.join('; '))
  }
}

/**
 * Validates index usage and effectiveness
 */
async function validateIndexes(client: PrismaClient): Promise<void> {
  const issues: string[] = []

  // Check for unused indexes
  try {
    const unusedIndexes = await client.$queryRaw<{ index_name: string; table_name: string }[]>`
      SELECT
        indexrelname as index_name,
        relname as table_name
      FROM pg_stat_user_indexes
      WHERE idx_scan < 10
      AND indexrelname NOT LIKE '%_pkey'
      AND indexrelname NOT LIKE '%_unique'
    `

    if (unusedIndexes.length > 0) {
      issues.push(`${unusedIndexes.length} potentially unused indexes detected`)
    }
  } catch {
    // pg_stat_user_indexes might not be available
  }

  // Check for missing indexes on foreign keys
  const missingFKIndexes = await client.$queryRaw<{ table_name: string; column_name: string }[]>`
    SELECT
      c.table_name,
      c.column_name
    FROM information_schema.key_column_usage c
    JOIN information_schema.table_constraints t
      ON c.constraint_name = t.constraint_name
      AND c.table_schema = t.table_schema
    WHERE t.constraint_type = 'FOREIGN KEY'
    AND c.table_schema = 'public'
    AND NOT EXISTS (
      SELECT 1
      FROM pg_indexes i
      WHERE i.schemaname = 'public'
      AND i.tablename = c.table_name
      AND i.indexdef LIKE '%' || c.column_name || '%'
    )
  `

  if (missingFKIndexes.length > 0) {
    issues.push(`${missingFKIndexes.length} foreign keys without indexes detected`)
  }

  if (issues.length > 0) {
    throw new Error(issues.join('; '))
  }
}

/**
 * Validates organization isolation
 */
export async function validateOrganizationIsolation(
  client: PrismaClient,
  organizationId: string
): Promise<boolean> {
  try {
    // Test that queries are properly scoped
    const tournaments = await client.tournament.findMany({
      select: { organizationId: true }
    })

    // All tournaments should belong to the same organization
    const otherOrgTournaments = tournaments.filter(t => t.organizationId !== organizationId)

    if (otherOrgTournaments.length > 0) {
      throw new Error(`Found ${otherOrgTournaments.length} tournaments from other organizations`)
    }

    return true
  } catch (error) {
    console.error('Organization isolation validation failed:', error)
    return false
  }
}

/**
 * Gets database statistics
 */
export async function getDatabaseStatistics(client: PrismaClient) {
  const stats = {
    organizations: await client.organization.count(),
    users: await client.user.count(),
    tournaments: await client.tournament.count(),
    activeTournaments: await client.tournament.count({
      where: { status: { in: ['RUNNING', 'REGISTRATION_OPEN'] } }
    }),
    totalEntries: await client.entry.count(),
    totalEvents: await client.event.count(),
    tablesInUse: await client.table.count({
      where: { status: 'ACTIVE' }
    }),
  }

  // Get recent activity
  const recentEvents = await client.event.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      eventType: true,
      createdAt: true,
      aggregateType: true,
    }
  })

  return {
    ...stats,
    recentActivity: recentEvents,
    lastUpdated: new Date(),
  }
}

/**
 * Cleanup utility for old records
 */
export async function cleanupOldRecords(
  client: PrismaClient,
  options: {
    auditLogRetentionDays?: number
    eventRetentionDays?: number
    dryRun?: boolean
  } = {}
) {
  const {
    auditLogRetentionDays = 90,
    eventRetentionDays = 365,
    dryRun = true
  } = options

  const results = {
    auditLogsToDelete: 0,
    eventsToDelete: 0,
    deletedAuditLogs: 0,
    deletedEvents: 0,
  }

  const auditLogCutoff = new Date()
  auditLogCutoff.setDate(auditLogCutoff.getDate() - auditLogRetentionDays)

  const eventCutoff = new Date()
  eventCutoff.setDate(eventCutoff.getDate() - eventRetentionDays)

  // Count records to be deleted
  results.auditLogsToDelete = await client.auditLog.count({
    where: { createdAt: { lt: auditLogCutoff } }
  })

  results.eventsToDelete = await client.event.count({
    where: { createdAt: { lt: eventCutoff } }
  })

  if (!dryRun) {
    // Actually delete the records
    const deletedAuditLogs = await client.auditLog.deleteMany({
      where: { createdAt: { lt: auditLogCutoff } }
    })

    const deletedEvents = await client.event.deleteMany({
      where: { createdAt: { lt: eventCutoff } }
    })

    results.deletedAuditLogs = deletedAuditLogs.count
    results.deletedEvents = deletedEvents.count
  }

  return results
}