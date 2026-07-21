import { PrismaClient } from '@prisma/client'

/**
 * Client Prisma en singleton : en développement, Next.js recharge les modules
 * à chaud, ce qui multiplierait les connexions sans cette mise en cache sur
 * l'objet global.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
