import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default',
      description: 'Default organization for TURNUVAYONETIM',
      settings: {
        timezone: 'Europe/Istanbul',
        currency: 'TRY',
        defaultLanguage: 'tr',
      },
    },
  })

  console.log(`📋 Created organization: ${organization.name}`)

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@turnuvayonetim.com' },
    update: {},
    create: {
      organizationId: organization.id,
      email: 'admin@turnuvayonetim.com',
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  console.log(`👤 Created admin user: ${adminUser.email}`)

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@turnuvayonetim.com' },
    update: {},
    create: {
      organizationId: organization.id,
      email: 'manager@turnuvayonetim.com',
      username: 'manager',
      firstName: 'Tournament',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  console.log(`👤 Created manager user: ${managerUser.email}`)

  // Create default blind structure
  const blindStructure = await prisma.blindStructure.create({
    data: {
      organizationId: organization.id,
      name: 'Standard Tournament Structure',
      description: 'Standard blind structure for regular tournaments',
      isDefault: true,
      levels: {
        create: [
          { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 20 },
          { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 20 },
          { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, duration: 20 },
          { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 20 },
          { level: 5, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
          { level: 6, smallBlind: 150, bigBlind: 300, ante: 25, duration: 20 },
          { level: 7, smallBlind: 200, bigBlind: 400, ante: 50, duration: 20 },
          { level: 8, smallBlind: 250, bigBlind: 500, ante: 50, duration: 20 },
          { level: 9, smallBlind: 300, bigBlind: 600, ante: 75, duration: 20 },
          { level: 10, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
          { level: 11, smallBlind: 400, bigBlind: 800, ante: 100, duration: 20 },
          { level: 12, smallBlind: 500, bigBlind: 1000, ante: 100, duration: 20 },
          { level: 13, smallBlind: 600, bigBlind: 1200, ante: 200, duration: 20 },
          { level: 14, smallBlind: 800, bigBlind: 1600, ante: 200, duration: 20 },
          { level: 15, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
          { level: 16, smallBlind: 1000, bigBlind: 2000, ante: 300, duration: 20 },
          { level: 17, smallBlind: 1200, bigBlind: 2400, ante: 400, duration: 20 },
          { level: 18, smallBlind: 1500, bigBlind: 3000, ante: 500, duration: 20 },
          { level: 19, smallBlind: 2000, bigBlind: 4000, ante: 500, duration: 20 },
          { level: 20, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
          { level: 21, smallBlind: 2500, bigBlind: 5000, ante: 1000, duration: 20 },
          { level: 22, smallBlind: 3000, bigBlind: 6000, ante: 1000, duration: 20 },
          { level: 23, smallBlind: 4000, bigBlind: 8000, ante: 1000, duration: 20 },
          { level: 24, smallBlind: 5000, bigBlind: 10000, ante: 2000, duration: 20 },
          { level: 25, smallBlind: 6000, bigBlind: 12000, ante: 2000, duration: 20 },
        ],
      },
    },
  })

  console.log(`🕐 Created blind structure: ${blindStructure.name}`)

  // Create default payout scheme
  const payoutScheme = await prisma.payoutScheme.create({
    data: {
      organizationId: organization.id,
      name: 'Standard Payout Structure',
      description: 'Standard payout distribution for tournaments',
      isDefault: true,
      payoutTiers: {
        create: [
          { position: 1, percentage: 0.4 },
          { position: 2, percentage: 0.25 },
          { position: 3, percentage: 0.15 },
          { position: 4, percentage: 0.1 },
          { position: 5, percentage: 0.06 },
          { position: 6, percentage: 0.04 },
        ],
      },
    },
  })

  console.log(`💰 Created payout scheme: ${payoutScheme.name}`)

  // Create default league
  const league = await prisma.league.create({
    data: {
      organizationId: organization.id,
      name: 'Main League',
      description: 'Main tournament league',
      settings: {
        pointsSystem: 'standard',
        seasonLength: 12, // months
      },
    },
  })

  console.log(`🏆 Created league: ${league.name}`)

  // Create current season
  const currentYear = new Date().getFullYear()
  const season = await prisma.season.create({
    data: {
      leagueId: league.id,
      name: `${currentYear} Season`,
      description: `Tournament season for ${currentYear}`,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
    },
  })

  console.log(`📅 Created season: ${season.name}`)

  // Create sample demo players
  const demoPlayers = [
    { firstName: 'Ali', lastName: 'Yılmaz', email: 'ali@demo.com', nickname: 'AliPoker' },
    { firstName: 'Ayşe', lastName: 'Kaya', email: 'ayse@demo.com', nickname: 'AyseAce' },
    { firstName: 'Mehmet', lastName: 'Demir', email: 'mehmet@demo.com', nickname: 'MehmetKing' },
    { firstName: 'Fatma', lastName: 'Şahin', email: 'fatma@demo.com', nickname: 'FatmaQueen' },
    { firstName: 'Mustafa', lastName: 'Özkan', email: 'mustafa@demo.com', nickname: 'MustafaJack' },
    { firstName: 'Elif', lastName: 'Arslan', email: 'elif@demo.com', nickname: 'ElifTen' },
    { firstName: 'Ahmet', lastName: 'Koç', email: 'ahmet@demo.com', nickname: 'AhmetNine' },
    { firstName: 'Zeynep', lastName: 'Doğan', email: 'zeynep@demo.com', nickname: 'ZeynepEight' },
  ]

  for (const player of demoPlayers) {
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        email: player.email,
        firstName: player.firstName,
        lastName: player.lastName,
        role: UserRole.PLAYER,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    })

    await prisma.playerProfile.create({
      data: {
        userId: user.id,
        nickname: player.nickname,
        totalTournaments: Math.floor(Math.random() * 20),
        totalWins: Math.floor(Math.random() * 5),
        totalCashes: Math.floor(Math.random() * 10),
        totalEarnings: Math.floor(Math.random() * 50000),
        preferences: {
          notifications: true,
          autoRebuy: false,
          seatPreference: 'random',
        },
      },
    })
  }

  console.log(`🎮 Created ${demoPlayers.length} demo players`)

  // Create system configurations
  const systemConfigs = [
    { key: 'tournament.defaultStack', value: { amount: 10000 } },
    { key: 'tournament.defaultBuyIn', value: { amount: 100 } },
    { key: 'tournament.defaultFee', value: { amount: 10 } },
    { key: 'tournament.maxPlayersPerTable', value: { count: 9 } },
    { key: 'tournament.minPlayersToStart', value: { count: 2 } },
    { key: 'clock.defaultLevelDuration', value: { minutes: 20 } },
    { key: 'tables.balancingThreshold', value: { difference: 2 } },
    { key: 'payouts.minimumPlayers', value: { count: 10 } },
  ]

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    })
  }

  console.log(`⚙️ Created ${systemConfigs.length} system configurations`)

  console.log('✅ Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export { main as seedDatabase }