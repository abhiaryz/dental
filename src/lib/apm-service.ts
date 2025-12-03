import { prisma } from "@/lib/prisma";
import { Cache } from "./redis";
import { edgeConfig } from "./edge-config";

/**
 * APM Service for Application Performance Monitoring
 * Uses Redis for real-time metrics and PostgreSQL for historical data
 * Leverages Edge Config for configuration and thresholds
 */

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number; // milliseconds
  statusCode: number;
  userId?: string;
  clinicId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ErrorLog {
  endpoint: string;
  method: string;
  error: string;
  stack?: string;
  userId?: string;
  clinicId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface WebVitalMetric {
  name: string; // LCP, FID, CLS, INP, TTFB
  value: number;
  rating: string; // good, needs-improvement, poor
  page: string;
  userId?: string;
  clinicId?: string;
}

export interface MetricsSummary {
  totalRequests: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorCount: number;
  errorRate: number;
  requestsPerMinute: number;
  slowQueryCount: number;
}

export class APMService {
  // Default slow query threshold (500ms)
  private static readonly DEFAULT_SLOW_QUERY_THRESHOLD = 500;
  
  // Redis TTL for real-time metrics (1 hour)
  private static readonly REDIS_TTL = 3600;

  /**
   * Track API request performance
   * Uses Redis for real-time metrics, PostgreSQL for historical data
   */
  static async trackRequest(metric: PerformanceMetric): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // Store in Redis for real-time dashboard (last 1 hour)
      const redisKey = `apm:request:${timestamp}:${Math.random().toString(36).substring(7)}`;
      await Cache.set(redisKey, metric, this.REDIS_TTL);
      
      // Update aggregated stats in Redis (non-blocking)
      this.updateAggregatedStats(metric).catch((err) => 
        console.error("APM: Failed to update aggregated stats", err)
      );
      
      // Store in PostgreSQL for historical analysis (async, non-blocking)
      prisma.performanceMetric
        .create({ data: metric })
        .catch((err) => console.error("APM: Failed to store metric in DB", err));
    } catch (error) {
      console.error("APM: Failed to track request", error);
    }
  }

  /**
   * Track application errors
   */
  static async trackError(error: ErrorLog): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // Store in Redis for real-time alerts (24 hours)
      const redisKey = `apm:error:${timestamp}:${Math.random().toString(36).substring(7)}`;
      await Cache.set(redisKey, error, 86400); // 24 hours TTL
      
      // Store in PostgreSQL
      prisma.errorLog
        .create({ data: error })
        .catch((err) => console.error("APM: Failed to store error in DB", err));
    } catch (error) {
      console.error("APM: Failed to track error", error);
    }
  }

  /**
   * Track slow database queries
   */
  static async trackSlowQuery(
    query: string,
    duration: number,
    endpoint?: string,
    model?: string
  ): Promise<void> {
    // Get threshold from Edge Config or use default
    const threshold = await this.getSlowQueryThreshold();
    
    if (duration < threshold) return; // Only track queries above threshold
    
    try {
      prisma.slowQuery
        .create({
          data: {
            query: query.substring(0, 1000), // Limit length to prevent huge entries
            duration,
            endpoint,
            model,
          },
        })
        .catch((err) => console.error("APM: Failed to store slow query", err));
    } catch (error) {
      console.error("APM: Failed to track slow query", error);
    }
  }

  /**
   * Track Web Vitals from client-side
   */
  static async trackWebVital(metric: WebVitalMetric): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // Store in Redis for real-time
      const redisKey = `apm:webvital:${metric.name}:${timestamp}:${Math.random().toString(36).substring(7)}`;
      await Cache.set(redisKey, metric, this.REDIS_TTL);
      
      // Store in PostgreSQL
      prisma.webVital
        .create({ data: metric })
        .catch((err) => console.error("APM: Failed to store web vital", err));
    } catch (error) {
      console.error("APM: Failed to track web vital", error);
    }
  }

  /**
   * Update aggregated statistics in Redis
   */
  private static async updateAggregatedStats(metric: PerformanceMetric): Promise<void> {
    try {
      const now = new Date();
      const hourKey = `apm:stats:hour:${now.getHours()}`;
      const dayKey = `apm:stats:day:${now.toISOString().split('T')[0]}`;
      const minuteKey = `apm:stats:minute:${Math.floor(now.getMinutes() / 5) * 5}`;
      
      // Get current stats or initialize
      const hourStats = await Cache.get<any>(hourKey) || { count: 0, totalDuration: 0, errors: 0 };
      const dayStats = await Cache.get<any>(dayKey) || { count: 0, totalDuration: 0, errors: 0 };
      const minuteStats = await Cache.get<any>(minuteKey) || { count: 0, totalDuration: 0, errors: 0 };
      
      // Update stats
      hourStats.count += 1;
      hourStats.totalDuration += metric.duration;
      if (metric.statusCode >= 400) hourStats.errors += 1;
      
      dayStats.count += 1;
      dayStats.totalDuration += metric.duration;
      if (metric.statusCode >= 400) dayStats.errors += 1;
      
      minuteStats.count += 1;
      minuteStats.totalDuration += metric.duration;
      if (metric.statusCode >= 400) minuteStats.errors += 1;
      
      // Store back in Redis
      await Promise.all([
        Cache.set(hourKey, hourStats, 3600), // 1 hour TTL
        Cache.set(dayKey, dayStats, 86400), // 24 hours TTL
        Cache.set(minuteKey, minuteStats, 300), // 5 minutes TTL
      ]);
    } catch (error) {
      console.error("APM: Failed to update aggregated stats", error);
    }
  }

  /**
   * Get real-time metrics from Redis
   */
  static async getRealTimeMetrics(timeRange: '1h' | '24h' = '1h'): Promise<Partial<MetricsSummary>> {
    try {
      const now = new Date();
      let statsKey: string;
      
      if (timeRange === '1h') {
        statsKey = `apm:stats:hour:${now.getHours()}`;
      } else {
        statsKey = `apm:stats:day:${now.toISOString().split('T')[0]}`;
      }
      
      const stats = await Cache.get<any>(statsKey);
      
      if (!stats) {
        return {
          totalRequests: 0,
          avgResponseTime: 0,
          errorCount: 0,
          errorRate: 0,
          requestsPerMinute: 0,
        };
      }
      
      const avgResponseTime = stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0;
      const errorRate = stats.count > 0 ? (stats.errors / stats.count) * 100 : 0;
      const requestsPerMinute = timeRange === '1h' 
        ? Math.round(stats.count / 60) 
        : Math.round(stats.count / 1440);
      
      return {
        totalRequests: stats.count,
        avgResponseTime,
        errorCount: stats.errors,
        errorRate: Math.round(errorRate * 100) / 100,
        requestsPerMinute,
      };
    } catch (error) {
      console.error("APM: Failed to get real-time metrics", error);
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorCount: 0,
        errorRate: 0,
        requestsPerMinute: 0,
      };
    }
  }

  /**
   * Get historical metrics from PostgreSQL
   */
  static async getHistoricalMetrics(
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    metrics: any[];
    errors: any[];
    slowQueries: any[];
    summary: MetricsSummary;
  }> {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    try {
      const [metrics, errors, slowQueries] = await Promise.all([
        prisma.performanceMetric.findMany({
          where: { timestamp: { gte: startDate } },
          orderBy: { timestamp: 'desc' },
          take: 1000,
        }),
        prisma.errorLog.findMany({
          where: { timestamp: { gte: startDate } },
          orderBy: { timestamp: 'desc' },
          take: 100,
        }),
        prisma.slowQuery.findMany({
          where: { timestamp: { gte: startDate } },
          orderBy: { duration: 'desc' },
          take: 50,
        }),
      ]);

      // Calculate summary statistics
      const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
      const totalRequests = metrics.length;
      const avgResponseTime = durations.length > 0
        ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
        : 0;
      const p95Index = Math.floor(durations.length * 0.95);
      const p99Index = Math.floor(durations.length * 0.99);
      const p95ResponseTime = durations[p95Index] || 0;
      const p99ResponseTime = durations[p99Index] || 0;
      const errorCount = errors.length;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
      
      // Calculate requests per minute based on time range
      const minutesInRange = timeRange === '1h' ? 60 : timeRange === '24h' ? 1440 : timeRange === '7d' ? 10080 : 43200;
      const requestsPerMinute = Math.round(totalRequests / minutesInRange);

      return {
        metrics,
        errors,
        slowQueries,
        summary: {
          totalRequests,
          avgResponseTime,
          p95ResponseTime,
          p99ResponseTime,
          errorCount,
          errorRate: Math.round(errorRate * 100) / 100,
          requestsPerMinute,
          slowQueryCount: slowQueries.length,
        },
      };
    } catch (error) {
      console.error("APM: Failed to get historical metrics", error);
      return {
        metrics: [],
        errors: [],
        slowQueries: [],
        summary: {
          totalRequests: 0,
          avgResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          errorCount: 0,
          errorRate: 0,
          requestsPerMinute: 0,
          slowQueryCount: 0,
        },
      };
    }
  }

  /**
   * Get slow query threshold from Edge Config
   */
  private static async getSlowQueryThreshold(): Promise<number> {
    try {
      const threshold = await edgeConfig.get<number>('apm_slow_query_threshold');
      return threshold || this.DEFAULT_SLOW_QUERY_THRESHOLD;
    } catch (error) {
      console.error("APM: Failed to get slow query threshold from Edge Config", error);
      return this.DEFAULT_SLOW_QUERY_THRESHOLD;
    }
  }
}

