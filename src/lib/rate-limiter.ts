import { RateLimiterMemory } from "rate-limiter-flexible";
import type { RateLimiterRes } from "rate-limiter-flexible";
import { NextRequest, NextResponse } from "next/server";
import { ErrorCodes } from "./api-errors";

type EndpointLimiter = "api" | "auth" | "upload";

type RateLimitResult = {
  allowed: boolean;
  remaining?: number;
  limit?: number;
  resetTime?: number;
  error?: NextResponse;
};

const endpointLimiters: Record<EndpointLimiter, RateLimiterMemory> = {
  api: new RateLimiterMemory({
    points: 100,
    duration: 60,
  }),
  auth: new RateLimiterMemory({
    points: 10,
    duration: 60,
  }),
  upload: new RateLimiterMemory({
    points: 20,
    duration: 60,
  }),
};

export const passwordResetLimiter = new RateLimiterMemory({
  points: 3,
  duration: 60 * 60, // 1 hour window
  blockDuration: 60 * 15, // block for 15 minutes when exhausted
});

export const emailVerificationLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 60, // 1 hour window
  blockDuration: 60 * 15,
});

export const invitationLimiter = new RateLimiterMemory({
  points: 25,
  duration: 24 * 60 * 60, // 1 day window
  blockDuration: 60 * 60,
});

function isRateLimiterMemory(value: unknown): value is RateLimiterMemory {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as RateLimiterMemory).consume === "function" &&
    typeof (value as RateLimiterMemory).get === "function"
  );
}

function isEndpointLimiter(value: string): value is EndpointLimiter {
  return value === "api" || value === "auth" || value === "upload";
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    (request as unknown as { ip?: string }).ip ||
    "unknown"
  );
}

export function getClientIdentifier(request: NextRequest): string {
  const ip = getClientIp(request);
  if (ip !== "unknown") {
    return ip;
  }

  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  return `${ip}:${userAgent}`;
}

async function consumeLimiter(
  limiter: RateLimiterMemory,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const res = await limiter.consume(identifier);
    return {
      allowed: true,
      remaining: Math.max(0, limiter.points - res.consumedPoints),
      limit: limiter.points,
      resetTime: res.msBeforeNext,
    };
  } catch (error) {
    const rateLimiterRes = error as RateLimiterRes | undefined;
    return {
      allowed: false,
      remaining: 0,
      limit: limiter.points,
      resetTime: rateLimiterRes?.msBeforeNext ?? limiter.duration * 1000,
    };
  }
}

export async function checkRateLimit(
  request: NextRequest,
  type?: EndpointLimiter
): Promise<RateLimitResult>;
export async function checkRateLimit(
  limiter: RateLimiterMemory,
  identifier: string
): Promise<RateLimitResult>;
export async function checkRateLimit(
  arg1: NextRequest | RateLimiterMemory,
  arg2: EndpointLimiter | string = "api"
): Promise<RateLimitResult> {
  if (isRateLimiterMemory(arg1)) {
    return consumeLimiter(arg1, arg2);
  }

  const request = arg1;
  const limiterType = typeof arg2 === "string" && isEndpointLimiter(arg2) ? arg2 : "api";
  const limiter = endpointLimiters[limiterType];
  const identifier = getClientIdentifier(request);
  const result = await consumeLimiter(limiter, identifier);

  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil((result.resetTime ?? limiter.duration * 1000) / 1000);
    result.error = NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        details: {
          retryAfter: retryAfterSeconds,
          limit: limiter.points,
          window: `${limiter.duration}s`,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSeconds.toString(),
          "X-RateLimit-Limit": limiter.points.toString(),
          "X-RateLimit-Reset": new Date(Date.now() + retryAfterSeconds * 1000).toISOString(),
        },
      }
    );
  }

  return result;
}

export async function getRateLimitInfo(
  request: NextRequest,
  type: EndpointLimiter = "api"
): Promise<{ remaining: number; limit: number; reset: Date }> {
  const limiter = endpointLimiters[type];
  const identifier = getClientIdentifier(request);

  try {
    const res = await limiter.get(identifier);
    const remaining = res ? limiter.points - res.consumedPoints : limiter.points;
    const reset = res ? new Date(Date.now() + res.msBeforeNext) : new Date();

    return {
      remaining: Math.max(0, remaining),
      limit: limiter.points,
      reset,
    };
  } catch {
    return {
      remaining: limiter.points,
      limit: limiter.points,
      reset: new Date(Date.now() + limiter.duration * 1000),
    };
  }
}
