/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting the number of requests per IP address
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';
import { ErrorCodes } from './api-errors';

// Create rate limiters for different endpoint types
const rateLimiters = {
  // General API endpoints: 100 requests per minute
  api: new RateLimiterMemory({
    points: 100,
    duration: 60,
  }),
  
  // Auth endpoints: Stricter limit of 5 requests per minute
  auth: new RateLimiterMemory({
    points: 5,
    duration: 60,
  }),
  
  // File upload endpoints: 10 uploads per minute
  upload: new RateLimiterMemory({
    points: 10,
    duration: 60,
  }),
};

/**
 * Check if request should be rate limited
 * @param request - The incoming request
 * @param type - Type of rate limit to apply
 * @returns Object with allowed status and optional error response
 */
export async function checkRateLimit(
  request: NextRequest,
  type: 'api' | 'auth' | 'upload' = 'api'
): Promise<{ allowed: boolean; error?: NextResponse }> {
  // Get client IP address from headers
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
    request.headers.get('x-real-ip') || 
    request.ip ||
    'unknown';
  
  try {
    // Consume a point for this IP
    await rateLimiters[type].consume(ip);
    return { allowed: true };
  } catch (rateLimiterRes: any) {
    // Rate limit exceeded
    const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 60;
    
    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: ErrorCodes.RATE_LIMIT_EXCEEDED,
          details: {
            retryAfter,
            limit: rateLimiters[type].points,
            window: `${rateLimiters[type].duration}s`,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': rateLimiters[type].points.toString(),
            'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
          },
        }
      ),
    };
  }
}

/**
 * Get remaining points for an IP
 * Useful for adding rate limit info to responses
 */
export async function getRateLimitInfo(
  request: NextRequest,
  type: 'api' | 'auth' | 'upload' = 'api'
): Promise<{ remaining: number; limit: number; reset: Date }> {
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
    request.headers.get('x-real-ip') || 
    request.ip ||
    'unknown';

  try {
    const res = await rateLimiters[type].get(ip);
    const remaining = res ? rateLimiters[type].points - res.consumedPoints : rateLimiters[type].points;
    const reset = res ? new Date(Date.now() + res.msBeforeNext) : new Date();

    return {
      remaining: Math.max(0, remaining),
      limit: rateLimiters[type].points,
      reset,
    };
  } catch (error) {
    // Return default values if error
    return {
      remaining: rateLimiters[type].points,
      limit: rateLimiters[type].points,
      reset: new Date(Date.now() + rateLimiters[type].duration * 1000),
    };
  }
}
