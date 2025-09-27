import { PrismaClient } from '@prisma/client'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const db =
  globalThis.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db

// Export types for use in other packages
export type * from '@prisma/client'

// Export utility functions
export * from './utils/db-utils'

// Export seed functions
export * from './seed'