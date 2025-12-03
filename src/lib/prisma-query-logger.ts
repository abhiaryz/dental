import { PrismaClient } from "@prisma/client";
import { APMService } from "./apm-service";

/**
 * Prisma Query Logger
 * Extends Prisma client to log slow queries
 * This should be integrated with the existing Prisma client setup
 */

// Store original query engine methods
let originalQuery: typeof PrismaClient.prototype.$queryRaw | null = null;
let originalExecuteRaw: typeof PrismaClient.prototype.$executeRaw | null = null;

/**
 * Initialize query logging for Prisma client
 * This wraps the Prisma client to track slow queries
 */
export function initializeQueryLogger(prismaClient: PrismaClient): void {
  // Only initialize once
  if (originalQuery !== null) return;

  // Store original methods
  originalQuery = prismaClient.$queryRaw.bind(prismaClient);
  originalExecuteRaw = prismaClient.$executeRaw.bind(prismaClient);

  // Wrap $queryRaw
  prismaClient.$queryRaw = async function <T = unknown>(
    ...args: Parameters<typeof PrismaClient.prototype.$queryRaw>
  ): Promise<T> {
    const start = Date.now();
    const query = args[0]?.toString() || "unknown";
    
    try {
      const result = await originalQuery!(...args) as T;
      const duration = Date.now() - start;
      
      // Track slow queries (non-blocking)
      APMService.trackSlowQuery(query, duration, undefined, undefined)
        .catch((err) => console.error("Failed to track slow query", err));
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      // Track slow queries even on error
      APMService.trackSlowQuery(query, duration, undefined, undefined)
        .catch((err) => console.error("Failed to track slow query", err));
      
      throw error;
    }
  } as typeof PrismaClient.prototype.$queryRaw;

  // Wrap $executeRaw
  prismaClient.$executeRaw = async function (
    ...args: Parameters<typeof PrismaClient.prototype.$executeRaw>
  ): Promise<number> {
    const start = Date.now();
    const query = args[0]?.toString() || "unknown";
    
    try {
      const result = await originalExecuteRaw!(...args);
      const duration = Date.now() - start;
      
      // Track slow queries (non-blocking)
      APMService.trackSlowQuery(query, duration, undefined, undefined)
        .catch((err) => console.error("Failed to track slow query", err));
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      // Track slow queries even on error
      APMService.trackSlowQuery(query, duration, undefined, undefined)
        .catch((err) => console.error("Failed to track slow query", err));
      
      throw error;
    }
  } as typeof PrismaClient.prototype.$executeRaw;
}

/**
 * Helper to track Prisma query with context
 * Use this in your Prisma queries to add endpoint context
 */
export async function trackPrismaQuery<T>(
  queryFn: () => Promise<T>,
  endpoint?: string,
  model?: string
): Promise<T> {
  const start = Date.now();
  const query = queryFn.toString();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    // Track slow queries (non-blocking)
    APMService.trackSlowQuery(query, duration, endpoint, model)
      .catch((err) => console.error("Failed to track slow query", err));
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Track slow queries even on error
    APMService.trackSlowQuery(query, duration, endpoint, model)
      .catch((err) => console.error("Failed to track slow query", err));
    
    throw error;
  }
}

