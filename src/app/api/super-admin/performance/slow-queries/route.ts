import { NextResponse } from "next/server";
import { withSuperAdminAuth } from "@/lib/super-admin-auth";
import { APMService } from "@/lib/apm-service";
import type { AuthenticatedSuperAdminRequest } from "@/lib/super-admin-auth";

async function handler(req: AuthenticatedSuperAdminRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get("timeRange") as "1h" | "24h" | "7d" | "30d") || "24h";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    
    const historicalData = await APMService.getHistoricalMetrics(timeRange);
    
    const slowQueries = historicalData.slowQueries.slice(0, limit);
    
    return NextResponse.json({
      slowQueries,
      total: historicalData.slowQueries.length,
      timeRange,
    });
  } catch (error) {
    console.error("Slow queries API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch slow queries" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

