import { PrismaClient } from '@prisma/client'

export type OrganizationContext = {
  organizationId: string
}

/**
 * Creates a Prisma client with Row Level Security (RLS) context
 * This ensures all queries are automatically scoped to the organization
 */
export function createOrganizationScopedClient(
  client: PrismaClient,
  context: OrganizationContext
) {
  return client.$extends({
    query: {
      // Automatically add organizationId filter to all queries
      user: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findUnique({ args, query }) {
          // For findUnique, we need to check after the query
          const result = await query(args)
          if (result && result.organizationId !== context.organizationId) {
            return null
          }
          return result
        },
      },
      tournament: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findUnique({ args, query }) {
          const result = await query(args)
          if (result && result.organizationId !== context.organizationId) {
            return null
          }
          return result
        },
      },
      league: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findUnique({ args, query }) {
          const result = await query(args)
          if (result && result.organizationId !== context.organizationId) {
            return null
          }
          return result
        },
      },
      blindStructure: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findUnique({ args, query }) {
          const result = await query(args)
          if (result && result.organizationId !== context.organizationId) {
            return null
          }
          return result
        },
      },
      payoutScheme: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findUnique({ args, query }) {
          const result = await query(args)
          if (result && result.organizationId !== context.organizationId) {
            return null
          }
          return result
        },
      },
      event: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId }
          return query(args)
        },
      },
    },
  })
}

/**
 * Pagination helper
 */
export type PaginationOptions = {
  page?: number
  limit?: number
}

export function getPaginationParams(options: PaginationOptions = {}) {
  const page = Math.max(1, options.page || 1)
  const limit = Math.min(100, Math.max(1, options.limit || 10))
  const skip = (page - 1) * limit

  return {
    skip,
    take: limit,
    page,
    limit,
  }
}

/**
 * Transaction helper for event sourcing
 */
export async function withEventSourcing<T>(
  client: PrismaClient,
  operation: (tx: PrismaClient) => Promise<T>,
  eventData: {
    organizationId: string
    eventType: string
    aggregateId: string
    aggregateType: string
    eventData: any
    metadata?: any
    userId?: string
    tournamentId?: string
    tableId?: string
  }
): Promise<T> {
  return client.$transaction(async (tx) => {
    // Execute the main operation
    const result = await operation(tx)

    // Create the event record
    await tx.event.create({
      data: eventData,
    })

    return result
  })
}

/**
 * Calculates tournament payouts based on the payout scheme
 */
export function calculatePayouts(
  totalPrizePool: number,
  playerCount: number,
  payoutTiers: Array<{ position: number; percentage: number }>
): Array<{ position: number; amount: number; percentage: number }> {
  const payablePositions = Math.min(
    Math.floor(playerCount / 10), // Typical rule: pay 1 in 10
    payoutTiers.length
  )

  return payoutTiers
    .slice(0, payablePositions)
    .map((tier) => ({
      position: tier.position,
      amount: Math.floor(totalPrizePool * tier.percentage),
      percentage: tier.percentage,
    }))
}

/**
 * Generates the next table balancing configuration
 */
export function calculateTableBalancing(
  tables: Array<{ id: string; playerCount: number; maxSeats: number }>,
  targetPlayersPerTable: number = 9
): Array<{ tableId: string; action: 'break' | 'balance'; moveCount?: number }> {
  const actions: Array<{ tableId: string; action: 'break' | 'balance'; moveCount?: number }> = []

  // Sort tables by player count (ascending)
  const sortedTables = [...tables].sort((a, b) => a.playerCount - b.playerCount)

  // Find tables that need to be broken (too few players)
  const tablesToBreak = sortedTables.filter(
    (table) => table.playerCount <= Math.floor(targetPlayersPerTable / 2)
  )

  // Find tables that can receive players
  const tablesToBalance = sortedTables.filter(
    (table) =>
      table.playerCount < targetPlayersPerTable &&
      !tablesToBreak.includes(table)
  )

  // Mark tables for breaking
  tablesToBreak.forEach((table) => {
    actions.push({ tableId: table.id, action: 'break' })
  })

  // Calculate balancing moves
  tablesToBalance.forEach((table) => {
    const spotsAvailable = targetPlayersPerTable - table.playerCount
    if (spotsAvailable > 0) {
      actions.push({
        tableId: table.id,
        action: 'balance',
        moveCount: spotsAvailable,
      })
    }
  })

  return actions
}

/**
 * Validates tournament state transitions
 */
export function validateTournamentStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    SCHEDULED: ['REGISTRATION_OPEN', 'CANCELLED'],
    REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'CANCELLED'],
    REGISTRATION_CLOSED: ['RUNNING', 'CANCELLED'],
    RUNNING: ['PAUSED', 'FINISHED'],
    PAUSED: ['RUNNING', 'CANCELLED'],
    FINISHED: [],
    CANCELLED: [],
  }

  return validTransitions[currentStatus]?.includes(newStatus) || false
}

/**
 * Generates seat assignment for optimal table distribution
 */
export function generateSeatAssignments(
  playerIds: string[],
  tablesConfig: Array<{ tableId: string; maxSeats: number }>
): Array<{ playerId: string; tableId: string; seatNumber: number }> {
  const assignments: Array<{ playerId: string; tableId: string; seatNumber: number }> = []
  let playerIndex = 0

  // Shuffle players for random distribution
  const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5)

  for (const table of tablesConfig) {
    for (let seat = 1; seat <= table.maxSeats; seat++) {
      if (playerIndex < shuffledPlayers.length) {
        assignments.push({
          playerId: shuffledPlayers[playerIndex],
          tableId: table.tableId,
          seatNumber: seat,
        })
        playerIndex++
      }
    }
  }

  return assignments
}