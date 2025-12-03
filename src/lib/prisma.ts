import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Production-ready Prisma Client configuration
 * 
 * Connection pooling is handled by:
 * - Prisma Accelerate (if using prisma+postgres:// URL)
 * - Direct PostgreSQL connection pooling via DATABASE_URL parameters
 * 
 * For direct PostgreSQL connections, add to DATABASE_URL:
 * ?connection_limit=20&pool_timeout=10&connect_timeout=10
 * 
 * Note: Prisma Accelerate automatically handles connection pooling
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  errorFormat: 'minimal',
})

// Prevent multiple instances in development (Next.js hot reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
