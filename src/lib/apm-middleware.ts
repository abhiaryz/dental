import { NextRequest, NextResponse } from "next/server";
import { APMService } from "./apm-service";

/**
 * APM Middleware Wrapper
 * Tracks API route performance and errors
 * Use this wrapper around API route handlers to automatically track metrics
 */

/**
 * Wrapper to track API route performance
 * Usage: export const GET = withAPM(async (req) => { ... })
 */
export function withAPM<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options?: { 
    trackSlowQueries?: boolean;
    endpointName?: string;
  }
): T {
  return (async (req: NextRequest, ...args: any[]) => {
    const start = Date.now();
    const endpoint = options?.endpointName || req.nextUrl.pathname;
    const method = req.method;
    
    // Extract user info from request if available
    let userId: string | undefined;
    let clinicId: string | undefined;
    
    // Try to get user info from headers (set by auth middleware)
    const userIdHeader = req.headers.get("x-user-id");
    const clinicIdHeader = req.headers.get("x-clinic-id");
    if (userIdHeader) userId = userIdHeader;
    if (clinicIdHeader) clinicId = clinicIdHeader;
    
    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;
      const statusCode = response.status;

      // Track the request (non-blocking)
      APMService.trackRequest({
        endpoint,
        method,
        duration,
        statusCode,
        userId,
        clinicId,
        userAgent: req.headers.get("user-agent") || undefined,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] || 
                   req.headers.get("x-real-ip") || undefined,
      }).catch((err) => {
        console.error("APM: Failed to track request", err);
      });

      return response;
    } catch (error) {
      // Track error (non-blocking)
      APMService.trackError({
        endpoint,
        method,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        clinicId,
        userAgent: req.headers.get("user-agent") || undefined,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] || 
                   req.headers.get("x-real-ip") || undefined,
      }).catch((err) => {
        console.error("APM: Failed to track error", err);
      });

      // Re-throw the error so the error handler can process it
      throw error;
    }
  }) as T;
}

/**
 * Helper to extract user context from NextRequest
 * This can be used in routes that have authenticated requests
 */
export function extractUserContext(req: NextRequest): {
  userId?: string;
  clinicId?: string;
} {
  return {
    userId: req.headers.get("x-user-id") || undefined,
    clinicId: req.headers.get("x-clinic-id") || undefined,
  };
}

