/**
 * Tests for Redis fixes and improvements
 */

// Mock Next.js unstable_cache to avoid TextEncoder issues in Jest
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn, keyParts, options) => fn),
}));

import { Cache } from '@/lib/redis';
import { getCacheKey } from '@/lib/query-cache';

// Mock Redis client
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
  exists: jest.fn(),
};

jest.mock('@/lib/redis', () => {
  const actual = jest.requireActual('@/lib/redis');
  return {
    ...actual,
    getRedis: () => mockRedisClient,
    isRedisAvailable: () => true,
  };
});

describe('Redis Fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.set.mockResolvedValue('OK');
    mockRedisClient.del.mockResolvedValue(1);
    mockRedisClient.scan.mockResolvedValue([0, []]);
  });

  describe('Date Serialization', () => {
    it('should serialize Date objects correctly', async () => {
      const testData = {
        id: '123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockRedisClient.get.mockResolvedValue(null);

      await Cache.set('test-key', testData, 300);

      // Verify set was called
      expect(mockRedisClient.set).toHaveBeenCalled();
      const setCall = mockRedisClient.set.mock.calls[0];
      const serializedValue = setCall[0]; // First argument is the key, second is value
      
      // Check that dates are serialized
      const value = setCall[1];
      expect(value).toBeDefined();
      // Dates should be serialized (check via JSON stringify)
      const jsonStr = JSON.stringify(value);
      expect(jsonStr).toContain('__type');
      expect(jsonStr).toContain('Date');
    });

    it('should deserialize Date objects correctly', async () => {
      const serializedData = {
        id: '123',
        createdAt: { __type: 'Date', value: '2024-01-01T00:00:00.000Z' },
        updatedAt: { __type: 'Date', value: '2024-01-02T00:00:00.000Z' },
      };

      mockRedisClient.get.mockResolvedValue(serializedData);

      const result = await Cache.get('test-key');

      // Verify dates are deserialized
      expect(result).toBeDefined();
      if (result && typeof result === 'object' && 'createdAt' in result) {
        expect(result.createdAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('Cache Stampede Protection', () => {
    it('should deduplicate concurrent requests', async () => {
      let fetchCount = 0;
      const fetcher = jest.fn(async () => {
        fetchCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { data: 'test' };
      });

      mockRedisClient.get.mockResolvedValue(null);

      // Simulate 10 concurrent requests
      const promises = Array(10).fill(null).map(() =>
        Cache.getOrSet('test-key', fetcher, 300)
      );

      await Promise.all(promises);

      // Should only fetch once due to deduplication
      expect(fetchCount).toBe(1);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('SCAN Pattern Matching', () => {
    it('should use SCAN instead of KEYS for pattern deletion', async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce([1, ['key1', 'key2']])
        .mockResolvedValueOnce([0, ['key3']]);
      mockRedisClient.del.mockResolvedValue(1);

      const deleted = await Cache.deleteByPattern('test:*');

      expect(deleted).toBeGreaterThan(0);
      expect(mockRedisClient.scan).toHaveBeenCalled();
      expect(mockRedisClient.del).toHaveBeenCalled();
    });
  });

  describe('Size Limits', () => {
    it('should reject objects larger than 1MB', async () => {
      const largeData = {
        data: 'x'.repeat(2 * 1024 * 1024), // 2MB string
      };

      mockRedisClient.get.mockResolvedValue(null);

      const result = await Cache.set('large-key', largeData, 300);

      // Should return false for objects too large
      expect(result).toBe(false);
      // Should not call redis.set for large objects
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should retry on transient errors', async () => {
      let attempt = 0;
      mockRedisClient.get.mockImplementation(async () => {
        attempt++;
        if (attempt < 3) {
          throw new Error('Transient error');
        }
        return { data: 'success' };
      });

      const result = await Cache.get('test-key', 3);

      expect(result).toEqual({ data: 'success' });
      expect(attempt).toBe(3);
      expect(mockRedisClient.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate safe cache keys', () => {
      const key1 = getCacheKey('patient', '123', 'clinic-456');
      const key2 = getCacheKey('patient', '123', 'clinic-456');

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^patient:123:clinic-456$/);
    });

    it('should sanitize special characters in cache keys', () => {
      const key = getCacheKey('test', 'key with spaces', 'value/with/slashes');

      expect(key).not.toContain(' ');
      expect(key).not.toContain('/');
      expect(key).toContain('_');
    });
  });
});

