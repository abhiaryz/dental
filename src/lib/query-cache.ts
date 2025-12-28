import { Cache } from './cache';
import { revalidateTag } from 'next/cache';

/**
 * Cache configuration for different query types
 */
export const CACHE_CONFIG = {
  // Short-lived caches (frequently changing data)
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

/**
 * Generate cache key with prefix
 */
export function getCacheKey(prefix: string, ...parts: (string | number | null | undefined)[]): string {
  const cleanParts = parts
    .filter((p) => p !== null && p !== undefined)
    .map((p) => String(p).replace(/[^a-zA-Z0-9_-]/g, '_'));
  return `${prefix}:${cleanParts.join(':')}`;
}

/**
 * Cache database query result using Next.js cache
 * Uses Cache.getOrSet for cache stampede protection
 */
export async function cacheQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_CONFIG.MEDIUM,
  tags?: string[]
): Promise<T> {
  // Use getOrSet which has cache stampede protection built-in
  return await Cache.getOrSet(key, fetcher, ttlSeconds, tags);
}

/**
 * Invalidate cache by tag
 * Note: Pattern-based invalidation is not supported with Next.js cache.
 * Use specific cache tags instead of patterns.
 */
export async function invalidateCache(tag: string): Promise<void> {
  revalidateTag(tag);
}

/**
 * Invalidate user-specific caches by tag
 * Note: Pattern-based invalidation is not supported.
 * Use specific cache tags that were used when caching the data.
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  // Invalidate by tags that should have been used when caching
  await Promise.all([
    revalidateTag(`analytics-user-${userId}`),
    revalidateTag(`user-${userId}`),
  ]);
}

/**
 * Cache wrapper for analytics queries
 */
export async function cacheAnalytics<T>(
  userId: string,
  dateFilter: any,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_CONFIG.SHORT
): Promise<T> {
  const dateFilterKey = JSON.stringify(dateFilter);
  const key = getCacheKey(
    'analytics',
    userId,
    dateFilterKey
  );

  return cacheQuery(
    key,
    fetcher,
    ttlSeconds,
    [`analytics-user-${userId}`]
  );
}


