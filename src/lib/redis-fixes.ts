/**
 * Redis & Next.js Fixes
 * 
 * This file contains improved implementations to fix potential issues
 * identified in the Redis + Next.js integration.
 */

import { Redis } from '@upstash/redis';
import { getRedis } from './redis';

/**
 * FIX 1: Cache Stampede Protection
 * Prevents multiple concurrent requests from hitting the database
 */
const pendingFetches = new Map<string, Promise<unknown>>();

export async function getOrSetWithDedup<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  const redis = getRedis();
  
  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      // Continue to fetch if cache fails
    }
  }

  // Check if there's already a pending fetch for this key
  const pending = pendingFetches.get(key);
  if (pending) {
    // Wait for the existing fetch to complete
    return pending as Promise<T>;
  }

  // Create new fetch promise
  const fetchPromise = (async () => {
    try {
      const data = await fetcher();
      
      // Cache the result
      if (redis) {
        try {
          await redis.set(key, data, { ex: ttlSeconds });
        } catch (error) {
          console.error(`Redis set error for key ${key}:`, error);
          // Continue even if cache fails
        }
      }
      
      return data;
    } finally {
      // Remove from pending fetches
      pendingFetches.delete(key);
    }
  })();

  // Store the promise
  pendingFetches.set(key, fetchPromise);

  return fetchPromise;
}

/**
 * FIX 2: SCAN instead of KEYS for pattern matching
 * Non-blocking pattern matching for cache invalidation
 */
export async function deleteByPatternScan(
  pattern: string,
  batchSize: number = 100
): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  let deletedCount = 0;
  let cursor: string | number = 0;

  try {
    do {
      // Use SCAN instead of KEYS (non-blocking)
      const result: [string | number, string[]] = await redis.scan(cursor, {
        match: pattern,
        count: batchSize,
      });

      cursor = typeof result[0] === 'string' ? parseInt(result[0], 10) : result[0];
      const keys = result[1];

      if (keys.length > 0) {
        const deleted = await redis.del(...keys);
        deletedCount += deleted;
      }
    } while (cursor !== 0);

    return deletedCount;
  } catch (error) {
    console.error(`Redis SCAN error for pattern ${pattern}:`, error);
    return deletedCount;
  }
}

/**
 * FIX 3: Proper Date Serialization
 * Converts Date objects to ISO strings for Redis storage
 */
export function serializeForRedis<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Date) {
    return { __type: 'Date', value: data.toISOString() } as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeForRedis(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeForRedis(value);
    }
    return serialized as T;
  }

  return data;
}

/**
 * FIX 3: Proper Date Deserialization
 * Converts ISO strings back to Date objects
 */
export function deserializeFromRedis<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle serialized Date objects
  if (
    typeof data === 'object' &&
    data !== null &&
    '__type' in data &&
    (data as { __type: string }).__type === 'Date' &&
    'value' in data
  ) {
    return new Date((data as { value: string }).value) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => deserializeFromRedis(item)) as unknown as T;
  }

  if (typeof data === 'object' && data !== null) {
    const deserialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      deserialized[key] = deserializeFromRedis(value);
    }
    return deserialized as T;
  }

  return data;
}

/**
 * FIX 4: Versioned Cache Keys
 * Prevents race conditions in cache invalidation
 */
let cacheVersion = 0;

export function getVersionedCacheKey(baseKey: string): string {
  return `${baseKey}:v${cacheVersion}`;
}

export async function invalidateCacheVersion(): Promise<void> {
  cacheVersion++;
  // Optionally store version in Redis for distributed systems
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set('cache:version', cacheVersion, { ex: 86400 }); // 24 hours
    } catch (error) {
      console.error('Failed to update cache version:', error);
    }
  }
}

/**
 * FIX 5: Stale-While-Revalidate Pattern
 * Serves stale cache while fetching fresh data
 */
export async function getOrSetStaleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600,
  staleTtlSeconds: number = 86400 // Keep stale data for 24 hours
): Promise<T> {
  const redis = getRedis();
  if (!redis) {
    return fetcher();
  }

  try {
    // Try to get fresh cache
    const fresh = await redis.get<T>(`${key}:fresh`);
    if (fresh !== null) {
      // Background refresh if close to expiry
      const ttl = await redis.ttl(`${key}:fresh`);
      if (ttl < ttlSeconds * 0.1) {
        // Less than 10% TTL remaining, refresh in background
        fetcher().then(data => {
          redis.set(`${key}:fresh`, data, { ex: ttlSeconds });
          redis.set(`${key}:stale`, data, { ex: staleTtlSeconds });
        }).catch(console.error);
      }
      return deserializeFromRedis(fresh);
    }

    // Try stale cache
    const stale = await redis.get<T>(`${key}:stale`);
    if (stale !== null) {
      // Fetch fresh data in background
      fetcher().then(data => {
        redis.set(`${key}:fresh`, data, { ex: ttlSeconds });
        redis.set(`${key}:stale`, data, { ex: staleTtlSeconds });
      }).catch(console.error);
      
      return deserializeFromRedis(stale);
    }

    // No cache, fetch fresh
    const data = await fetcher();
    const serialized = serializeForRedis(data);
    
    await Promise.all([
      redis.set(`${key}:fresh`, serialized, { ex: ttlSeconds }),
      redis.set(`${key}:stale`, serialized, { ex: staleTtlSeconds }),
    ]);

    return data;
  } catch (error) {
    console.error(`Redis stale-while-revalidate error for key ${key}:`, error);
    // Fallback to direct fetch
    return fetcher();
  }
}

/**
 * FIX 6: Safe Cache with Size Limits
 * Prevents caching objects that are too large
 */
const MAX_CACHE_SIZE_BYTES = 1024 * 1024; // 1MB

export async function setSafeCache(
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    // Estimate size (rough calculation)
    const serialized = JSON.stringify(serializeForRedis(value));
    const sizeBytes = Buffer.byteLength(serialized, 'utf8');

    if (sizeBytes > MAX_CACHE_SIZE_BYTES) {
      console.warn(`Cache key ${key} is too large (${sizeBytes} bytes), skipping cache`);
      return false;
    }

    await redis.set(key, serialized, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error(`Redis setSafeCache error for key ${key}:`, error);
    return false;
  }
}

/**
 * FIX 7: Better Error Recovery with Retry
 */
export async function getWithRetry<T>(
  key: string,
  maxRetries: number = 3
): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const value = await redis.get<T>(key);
      return value ? deserializeFromRedis(value) : null;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }

  console.error(`Redis getWithRetry failed after ${maxRetries} attempts for key ${key}:`, lastError);
  return null;
}

