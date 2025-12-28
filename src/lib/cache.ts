import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Simple in-memory cache using Next.js unstable_cache
 * Replaces Redis for caching functionality
 */

/**
 * Cache operations using Next.js cache
 * Note: Pattern-based invalidation is not directly supported,
 * so we rely on cache tags for invalidation instead
 */
export class Cache {
  /**
   * Get value from cache
   * Note: Direct get operations are not supported with Next.js cache,
   * so this always returns null. Use getOrSet instead.
   */
  static async get<T = unknown>(_key: string): Promise<T | null> {
    // Next.js unstable_cache doesn't support direct get operations
    // This method is kept for API compatibility but always returns null
    return null;
  }

  /**
   * Set value in cache
   * Note: Direct set operations are not supported with Next.js cache,
   * so this always returns false. Use getOrSet instead.
   */
  static async set(
    _key: string,
    _value: unknown,
    _ttlSeconds: number = 3600
  ): Promise<boolean> {
    // Next.js unstable_cache doesn't support direct set operations
    // This method is kept for API compatibility but always returns false
    return false;
  }

  /**
   * Delete value from cache by tag
   * Uses Next.js revalidateTag to invalidate cached data
   */
  static async delete(_key: string): Promise<boolean> {
    // Next.js cache doesn't support direct deletion by key
    // This method is kept for API compatibility
    return false;
  }

  /**
   * Delete multiple keys
   * Note: Not directly supported, kept for API compatibility
   */
  static async deleteMany(_keys: string[]): Promise<number> {
    return 0;
  }

  /**
   * Delete keys by pattern
   * Note: Pattern-based deletion is not supported with Next.js cache
   * Use revalidateTag instead for cache invalidation
   */
  static async deleteByPattern(_pattern: string): Promise<number> {
    // Pattern-based deletion is not supported
    // Use cache tags and revalidateTag instead
    return 0;
  }

  /**
   * Check if key exists
   * Note: Not directly supported, kept for API compatibility
   */
  static async exists(_key: string): Promise<boolean> {
    return false;
  }

  /**
   * Get or set with automatic caching
   * Uses Next.js unstable_cache for server-side caching
   */
  private static pendingFetches = new Map<string, Promise<unknown>>();

  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600,
    tags?: string[]
  ): Promise<T> {
    // Check if there's already a pending fetch for this key (cache stampede protection)
    const pending = this.pendingFetches.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Create new fetch promise
    const fetchPromise = (async () => {
      try {
        // Use Next.js unstable_cache with tags for invalidation
        const cachedFetcher = unstable_cache(
          async () => await fetcher(),
          [key],
          {
            revalidate: ttlSeconds,
            tags: tags || [],
          }
        );

        const value = await cachedFetcher();
        return value;
      } finally {
        // Remove from pending fetches
        this.pendingFetches.delete(key);
      }
    })();

    // Store the promise to prevent concurrent fetches
    this.pendingFetches.set(key, fetchPromise);

    return fetchPromise;
  }

  /**
   * Invalidate cache by pattern
   * Note: Pattern-based invalidation is not supported.
   * Use revalidateTag with specific tags instead.
   * This method is kept for API compatibility.
   */
  static async invalidatePattern(_pattern: string): Promise<void> {
    // Pattern-based invalidation is not directly supported
    // Use revalidateTag with specific cache tags instead
  }

  /**
   * Invalidate cache by tag
   * This is the recommended way to invalidate Next.js cache
   */
  static async invalidateTag(tag: string): Promise<void> {
    revalidateTag(tag);
  }
}
