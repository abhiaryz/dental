import { Cache } from './redis';
import { unstable_cache } from 'next/cache';

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
 * Cache database query result with Redis
 * Falls back to Next.js unstable_cache if Redis is not available
 * FIX: Uses Cache.getOrSet for cache stampede protection
 */
export async function cacheQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_CONFIG.MEDIUM,
  tags?: string[]
): Promise<T> {
  // Use getOrSet which has cache stampede protection built-in
  const data = await Cache.getOrSet(key, fetcher, ttlSeconds);

  // Also use Next.js cache for server-side rendering (if tags provided)
  if (tags && tags.length > 0) {
    try {
      const cachedFetcher = unstable_cache(
        async () => data,
        [key],
        {
          revalidate: ttlSeconds,
          tags,
        }
      );
      await cachedFetcher();
    } catch (error) {
      // Next.js cache errors shouldn't break the request
      console.warn('Next.js cache error (non-critical):', error);
    }
  }

  return data;
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  await Cache.invalidatePattern(pattern);
}

/**
 * Invalidate clinic-specific caches
 */
export async function invalidateClinicCache(clinicId: string): Promise<void> {
  await Promise.all([
    Cache.invalidatePattern(`analytics:*:${clinicId}:*`),
    Cache.invalidatePattern(`patient:*:${clinicId}:*`),
    Cache.invalidatePattern(`appointment:*:${clinicId}:*`),
    Cache.invalidatePattern(`treatment:*:${clinicId}:*`),
  ]);
}

/**
 * Invalidate user-specific caches
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    Cache.invalidatePattern(`analytics:*:${userId}:*`),
    Cache.invalidatePattern(`user:*:${userId}:*`),
  ]);
}

/**
 * Cache wrapper for analytics queries
 */
export async function cacheAnalytics<T>(
  userId: string,
  clinicId: string | null | undefined,
  dateFilter: any,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_CONFIG.SHORT
): Promise<T> {
  const dateFilterKey = JSON.stringify(dateFilter);
  const key = getCacheKey(
    'analytics',
    userId,
    clinicId || 'no-clinic',
    dateFilterKey
  );

  return cacheQuery(
    key,
    fetcher,
    ttlSeconds,
    [`analytics-${clinicId || userId}`, `analytics-user-${userId}`]
  );
}

/**
 * Cache wrapper for patient queries
 */
export async function cachePatientQuery<T>(
  patientId: string,
  clinicId: string | null | undefined,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_CONFIG.MEDIUM
): Promise<T> {
  const key = getCacheKey('patient', patientId, clinicId || 'no-clinic');
  return cacheQuery(key, fetcher, ttlSeconds, [`patient-${patientId}`, `clinic-${clinicId}`]);
}

/**
 * Cache wrapper for appointment queries
 */
export async function cacheAppointmentQuery<T>(
  params: {
    clinicId?: string | null;
    patientId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  },
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_CONFIG.SHORT
): Promise<T> {
  const key = getCacheKey(
    'appointment',
    params.clinicId || 'no-clinic',
    params.patientId || 'all',
    params.startDate || 'all',
    params.endDate || 'all',
    params.status || 'all'
  );
  return cacheQuery(key, fetcher, ttlSeconds, [`appointment-${params.clinicId || 'all'}`]);
}

