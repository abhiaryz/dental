import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Redis Client for dynamic caching and rate limiting
 * Uses Upstash Redis (Vercel's recommended Redis solution)
 */
let redisClient: Redis | null = null;
const rateLimiters: {
  api: Ratelimit | null;
  auth: Ratelimit | null;
  upload: Ratelimit | null;
  passwordReset: Ratelimit | null;
  emailVerification: Ratelimit | null;
  invitation: Ratelimit | null;
} = {
  api: null,
  auth: null,
  upload: null,
  passwordReset: null,
  emailVerification: null,
  invitation: null,
};

/**
 * Initialize Redis client
 */
function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  // Support both standard and dental-prefixed environment variables
  const redisUrl = process.env.dental_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.dental_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn('Redis credentials not found. Falling back to in-memory storage.');
    return null;
  }

  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedis(): Redis | null {
  return getRedisClient();
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return getRedisClient() !== null;
}

/**
 * Date serialization helpers
 * FIX: Properly serialize/deserialize Date objects for Redis
 */
function serializeForRedis<T>(data: T): T {
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

function deserializeFromRedis<T>(data: T): T {
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
 * Cache operations
 */
export class Cache {
  /**
   * Get value from cache with retry and date deserialization
   * FIX: Added retry mechanism and proper date deserialization
   */
  static async get<T = unknown>(key: string, maxRetries: number = 3): Promise<T | null> {
    const redis = getRedis();
    if (!redis) return null;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const value = await redis.get<T>(key);
        if (value === null) return null;
        // Deserialize dates and other complex types
        return deserializeFromRedis(value);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }

    console.error(`Redis get error for key ${key} after ${maxRetries} attempts:`, lastError);
    return null;
  }

  /**
   * Set value in cache with TTL
   * FIX: Added date serialization and size limits
   */
  private static readonly MAX_CACHE_SIZE_BYTES = 1024 * 1024; // 1MB

  static async set(
    key: string,
    value: unknown,
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return false;

    try {
      // Serialize dates and complex types
      const serialized = serializeForRedis(value);
      
      // Check size to prevent memory issues
      const sizeEstimate = JSON.stringify(serialized).length;
      if (sizeEstimate > this.MAX_CACHE_SIZE_BYTES) {
        console.warn(
          `Cache key ${key} is too large (${sizeEstimate} bytes), skipping cache. ` +
          `Consider splitting the data or reducing cache size.`
        );
        return false;
      }

      await redis.set(key, serialized, { ex: ttlSeconds });
      return true;
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  static async delete(key: string): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return false;

    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  static async deleteMany(keys: string[]): Promise<number> {
    const redis = getRedis();
    if (!redis) return 0;

    try {
      if (keys.length === 0) return 0;
      const result = await redis.del(...keys);
      return result;
    } catch (error) {
      console.error('Redis deleteMany error:', error);
      return 0;
    }
  }

  /**
   * Delete keys by pattern
   * FIXED: Uses SCAN instead of KEYS to prevent blocking Redis
   */
  static async deleteByPattern(pattern: string): Promise<number> {
    const redis = getRedis();
    if (!redis) return 0;

    let deletedCount = 0;
    let cursor: string | number = 0;
    const batchSize = 100;

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
      console.error(`Redis deleteByPattern error for pattern ${pattern}:`, error);
      return deletedCount;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return false;

    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set with automatic caching
   * FIXED: Added cache stampede protection with request deduplication
   */
  private static pendingFetches = new Map<string, Promise<unknown>>();

  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if there's already a pending fetch for this key (cache stampede protection)
    const pending = this.pendingFetches.get(key);
    if (pending) {
      // Wait for the existing fetch to complete
      return pending as Promise<T>;
    }

    // Create new fetch promise
    const fetchPromise = (async () => {
      try {
        const value = await fetcher();
        await this.set(key, value, ttlSeconds);
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
   * Invalidate cache by pattern (useful for clinic/user-specific caches)
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    await this.deleteByPattern(pattern);
  }
}

/**
 * Rate Limiting using Upstash Ratelimit
 */
function getRateLimiter(
  type: 'api' | 'auth' | 'upload' | 'passwordReset' | 'emailVerification' | 'invitation'
): Ratelimit | null {
  if (rateLimiters[type]) {
    return rateLimiters[type];
  }

  const redis = getRedis();
  if (!redis) {
    return null;
  }

  const configs = {
    api: { limit: 100, window: '60 s' },
    auth: { limit: 10, window: '60 s' },
    upload: { limit: 20, window: '60 s' },
    passwordReset: { limit: 3, window: '1 h' },
    emailVerification: { limit: 5, window: '1 h' },
    invitation: { limit: 25, window: '24 h' },
  };

  const config = configs[type];
  rateLimiters[type] = new Ratelimit({
    redis,
    // @ts-expect-error - window string format is valid but TypeScript type is strict
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    analytics: true,
  });

  return rateLimiters[type];
}

/**
 * Check rate limit
 */
export async function checkRedisRateLimit(
  identifier: string,
  type: 'api' | 'auth' | 'upload' | 'passwordReset' | 'emailVerification' | 'invitation' = 'api'
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  reset: number;
}> {
  const limiter = getRateLimiter(type);
  if (!limiter) {
    // Fallback: allow if Redis is not available
    return {
      allowed: true,
      remaining: 100,
      limit: 100,
      reset: Date.now() + 60000,
    };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      limit: result.limit,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open on error
    return {
      allowed: true,
      remaining: 100,
      limit: 100,
      reset: Date.now() + 60000,
    };
  }
}

