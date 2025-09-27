import { PrismaClient, TournamentStatus, EntryStatus } from '@prisma/client'

/**
 * Tournament-specific database utilities
 */

/**
 * Gets tournament with all related data for display
 */
export async function getTournamentWithDetails(
  client: PrismaClient,
  tournamentId: string
) {
  return client.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      organization: true,
      creator: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      manager: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      blindStructure: {
        include: {
          levels: {
            orderBy: { level: 'asc' },
          },
        },
      },
      payoutScheme: {
        include: {
          payoutTiers: {
            orderBy: { position: 'asc' },
          },
        },
      },
      league: true,
      season: true,
      entries: {
        include: {
          playerProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      tables: {
        include: {
          seatAssignments: {
            where: { isActive: true },
            include: {
              playerProfile: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      clockStates: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      eliminations: {
        orderBy: { position: 'asc' },
        include: {
          playerProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      payouts: {
        orderBy: { position: 'asc' },
        include: {
          playerProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

/**
 * Gets tournament statistics
 */
export async function getTournamentStats(
  client: PrismaClient,
  tournamentId: string
) {
  const [tournament, totalEntries, activeEntries, eliminatedEntries] = await Promise.all([
    client.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        buyIn: true,
        fee: true,
        stack: true,
        maxPlayers: true,
      },
    }),
    client.entry.count({
      where: { tournamentId },
    }),
    client.entry.count({
      where: {
        tournamentId,
        status: { in: [EntryStatus.CONFIRMED, EntryStatus.PLAYING] },
      },
    }),
    client.entry.count({
      where: {
        tournamentId,
        status: EntryStatus.ELIMINATED,
      },
    }),
  ])

  if (!tournament) return null

  const totalPrizePool = totalEntries * Number(tournament.buyIn)
  const totalFees = totalEntries * Number(tournament.fee)
  const totalChipsInPlay = totalEntries * tournament.stack
  const averageChips = activeEntries > 0 ? totalChipsInPlay / activeEntries : 0

  return {
    totalEntries,
    activeEntries,
    eliminatedEntries,
    totalPrizePool,
    totalFees,
    totalChipsInPlay,
    averageChips,
    registrationProgress: tournament.maxPlayers
      ? (totalEntries / tournament.maxPlayers) * 100
      : 0,
  }
}

/**
 * Starts a tournament
 */
export async function startTournament(
  client: PrismaClient,
  tournamentId: string,
  userId: string
) {
  return client.$transaction(async (tx) => {
    // Update tournament status
    const tournament = await tx.tournament.update({
      where: { id: tournamentId },
      data: {
        status: TournamentStatus.RUNNING,
        startedAt: new Date(),
      },
      include: {
        entries: {
          where: { status: EntryStatus.CONFIRMED },
          include: { playerProfile: true },
        },
      },
    })

    // Confirm all registered entries
    await tx.entry.updateMany({
      where: {
        tournamentId,
        status: EntryStatus.REGISTERED,
      },
      data: {
        status: EntryStatus.PLAYING,
        confirmedAt: new Date(),
      },
    })

    // Create initial clock state
    await tx.clockState.create({
      data: {
        tournamentId,
        currentLevel: 1,
        timeRemaining: 20 * 60, // 20 minutes in seconds
        isRunning: true,
        totalPlayers: tournament.entries.length,
        remainingPlayers: tournament.entries.length,
        totalChips: BigInt(tournament.entries.length * tournament.stack),
        averageChips: tournament.stack,
      },
    })

    // Create event
    await tx.event.create({
      data: {
        organizationId: tournament.organizationId,
        tournamentId,
        userId,
        eventType: 'TournamentStarted',
        aggregateId: tournamentId,
        aggregateType: 'Tournament',
        eventData: {
          totalPlayers: tournament.entries.length,
          startedAt: new Date(),
        },
      },
    })

    return tournament
  })
}

/**
 * Eliminates a player from the tournament
 */
export async function eliminatePlayer(
  client: PrismaClient,
  tournamentId: string,
  entryId: string,
  eliminatedBy: string | null,
  userId: string
) {
  return client.$transaction(async (tx) => {
    // Get current eliminations count to determine position
    const eliminationsCount = await tx.elimination.count({
      where: { tournamentId },
    })

    const remainingPlayers = await tx.entry.count({
      where: {
        tournamentId,
        status: EntryStatus.PLAYING,
      },
    })

    const position = remainingPlayers // Current position (remaining players + eliminated)

    // Update entry status
    const entry = await tx.entry.update({
      where: { id: entryId },
      data: {
        status: EntryStatus.ELIMINATED,
        eliminatedAt: new Date(),
      },
      include: { playerProfile: true },
    })

    // Create elimination record
    const elimination = await tx.elimination.create({
      data: {
        tournamentId,
        entryId,
        playerProfileId: entry.playerProfileId,
        position,
        eliminatedBy,
        eliminatedAt: new Date(),
      },
    })

    // Update player's seat assignment
    await tx.seatAssignment.updateMany({
      where: {
        playerProfileId: entry.playerProfileId,
        table: { tournamentId },
        isActive: true,
      },
      data: {
        isActive: false,
        removedAt: new Date(),
      },
    })

    // Update clock state
    await tx.clockState.updateMany({
      where: { tournamentId },
      data: {
        remainingPlayers: remainingPlayers - 1,
      },
    })

    // Create event
    await tx.event.create({
      data: {
        organizationId: entry.playerProfile.user?.organizationId || '',
        tournamentId,
        userId,
        eventType: 'PlayerEliminated',
        aggregateId: entryId,
        aggregateType: 'Entry',
        eventData: {
          playerProfileId: entry.playerProfileId,
          position,
          eliminatedBy,
          eliminatedAt: new Date(),
        },
      },
    })

    return elimination
  })
}

/**
 * Processes tournament payouts
 */
export async function processTournamentPayouts(
  client: PrismaClient,
  tournamentId: string,
  userId: string
) {
  return client.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        payoutScheme: {
          include: {
            payoutTiers: {
              orderBy: { position: 'asc' },
            },
          },
        },
        entries: true,
        eliminations: {
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!tournament || !tournament.payoutScheme) {
      throw new Error('Tournament or payout scheme not found')
    }

    const totalPrizePool = tournament.entries.length * Number(tournament.buyIn)
    const payouts = []

    for (const tier of tournament.payoutScheme.payoutTiers) {
      const elimination = tournament.eliminations.find(e => e.position === tier.position)
      if (elimination) {
        const amount = Math.floor(totalPrizePool * Number(tier.percentage))

        const payout = await tx.payout.create({
          data: {
            tournamentId,
            playerProfileId: elimination.playerProfileId,
            position: tier.position,
            amount,
            percentage: tier.percentage,
            status: 'PENDING',
          },
        })

        payouts.push(payout)
      }
    }

    // Create event
    await tx.event.create({
      data: {
        organizationId: tournament.organizationId,
        tournamentId,
        userId,
        eventType: 'PayoutsProcessed',
        aggregateId: tournamentId,
        aggregateType: 'Tournament',
        eventData: {
          totalPrizePool,
          payoutsCount: payouts.length,
          payouts: payouts.map(p => ({
            position: p.position,
            amount: Number(p.amount),
            playerProfileId: p.playerProfileId,
          })),
        },
      },
    })

    return payouts
  })
}

/**
 * Updates tournament clock
 */
export async function updateTournamentClock(
  client: PrismaClient,
  tournamentId: string,
  updates: {
    currentLevel?: number
    timeRemaining?: number
    isRunning?: boolean
    isPaused?: boolean
  },
  userId: string
) {
  return client.$transaction(async (tx) => {
    const clockState = await tx.clockState.findFirst({
      where: { tournamentId },
      orderBy: { createdAt: 'desc' },
    })

    if (!clockState) {
      throw new Error('Clock state not found')
    }

    const updatedClock = await tx.clockState.update({
      where: { id: clockState.id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    })

    // Create event for significant clock changes
    if (updates.currentLevel && updates.currentLevel !== clockState.currentLevel) {
      const tournament = await tx.tournament.findUnique({
        where: { id: tournamentId },
        select: { organizationId: true },
      })

      await tx.event.create({
        data: {
          organizationId: tournament!.organizationId,
          tournamentId,
          userId,
          eventType: 'BlindLevelChanged',
          aggregateId: tournamentId,
          aggregateType: 'Tournament',
          eventData: {
            previousLevel: clockState.currentLevel,
            newLevel: updates.currentLevel,
            timestamp: new Date(),
          },
        },
      })
    }

    return updatedClock
  })
}