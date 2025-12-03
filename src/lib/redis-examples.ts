/**
 * Redis & Edge Config Usage Examples
 * 
 * This file contains examples of how to use Redis and Edge Config
 * in your application. These are reference examples only.
 */

import { Cache } from './redis';
import { edgeConfig } from './edge-config';
import { cacheQuery, cacheAnalytics, invalidateClinicCache } from './query-cache';

// ============================================
// Edge Config Examples (Read-Only)
// ============================================

/**
 * Example: Get a feature flag
 */
export async function checkFeatureFlag() {
  const isNewFeatureEnabled = await edgeConfig.getFeatureFlag('newFeature');
  if (isNewFeatureEnabled) {
    // Enable new feature
  }
}

/**
 * Example: Get app configuration
 */
export async function getAppConfig() {
  const maxUploadSize = await edgeConfig.getConfig<number>('maxUploadSize');
  const appVersion = await edgeConfig.getConfig<string>('appVersion');
  
  return {
    maxUploadSize: maxUploadSize ?? 10485760, // Default 10MB
    appVersion: appVersion ?? '1.0.0',
  };
}

/**
 * Example: Get multiple config values at once
 */
export async function getMultipleConfigs() {
  const configs = await edgeConfig.getAll<{
    maxUploadSize: number;
    appVersion: string;
    maintenanceMode: boolean;
  }>(['config_maxUploadSize', 'config_appVersion', 'config_maintenanceMode']);
  
  return configs;
}

// ============================================
// Redis Cache Examples
// ============================================

/**
 * Example: Cache a database query result
 */
export async function getCachedPatientData(patientId: string) {
  return await Cache.getOrSet(
    `patient:${patientId}`,
    async () => {
      // Fetch from database
      // const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      // return patient;
      return { id: patientId, name: 'Example' };
    },
    300 // Cache for 5 minutes
  );
}

/**
 * Example: Manual cache operations
 */
export async function manualCacheOperations() {
  // Set a value
  await Cache.set('key', { data: 'value' }, 3600); // 1 hour TTL
  
  // Get a value
  const value = await Cache.get<{ data: string }>('key');
  
  // Check if exists
  const exists = await Cache.exists('key');
  
  // Delete a value
  await Cache.delete('key');
  
  // Delete multiple keys
  await Cache.deleteMany(['key1', 'key2', 'key3']);
  
  // Delete by pattern
  await Cache.invalidatePattern('patient:*:clinic123:*');
}

// ============================================
// Query Cache Examples
// ============================================

/**
 * Example: Cache analytics query
 */
export async function getCachedAnalytics(
  userId: string,
  clinicId: string | null,
  dateFilter: any
) {
  return await cacheAnalytics(
    userId,
    clinicId,
    dateFilter,
    async () => {
      // Fetch analytics data
      // return await getDashboardAnalytics(userId, userRole, isExternal, clinicId, dateFilter);
      return { totalPatients: 100, totalRevenue: 50000 };
    },
    60 // Cache for 60 seconds
  );
}

/**
 * Example: Cache a generic query
 */
export async function getCachedQuery() {
  return await cacheQuery(
    'my-query-key',
    async () => {
      // Fetch data
      return { result: 'data' };
    },
    300, // 5 minutes TTL
    ['tag1', 'tag2'] // Cache tags for invalidation
  );
}

/**
 * Example: Invalidate cache when data changes
 */
export async function updatePatientAndInvalidateCache(
  patientId: string,
  clinicId: string
) {
  // Update patient in database
  // await prisma.patient.update({ where: { id: patientId }, data: {...} });
  
  // Invalidate related caches
  await Cache.delete(`patient:${patientId}`);
  await Cache.invalidatePattern(`patient:*:${clinicId}:*`);
  
  // Or invalidate all clinic caches
  await invalidateClinicCache(clinicId);
}

// ============================================
// Real-World Examples
// ============================================

/**
 * Example: API route with caching
 */
export async function getPatientsWithCache(clinicId: string) {
  const cacheKey = `patients:clinic:${clinicId}`;
  
  return await Cache.getOrSet(
    cacheKey,
    async () => {
      // Fetch from database
      // return await prisma.patient.findMany({
      //   where: { clinicId },
      // });
      return [];
    },
    300 // 5 minutes
  );
}

/**
 * Example: Feature flag check in API route
 */
export async function checkFeatureBeforeProcessing() {
  const isFeatureEnabled = await edgeConfig.getFeatureFlag('advancedAnalytics');
  
  if (!isFeatureEnabled) {
    return { error: 'Feature not available' };
  }
  
  // Process with feature enabled
  return { success: true };
}

/**
 * Example: Conditional caching based on feature flag
 */
export async function getDataWithConditionalCache() {
  const useCache = await edgeConfig.getFeatureFlag('enableQueryCache');
  
  if (useCache) {
    return await Cache.getOrSet(
      'data-key',
      async () => {
        // Fetch data
        return { data: 'value' };
      },
      300
    );
  }
  
  // Fetch without cache
  return { data: 'value' };
}

