import { NextResponse } from "next/server";
import { withSuperAdminAuth } from "@/lib/super-admin-auth";
import { APMService } from "@/lib/apm-service";
import type { AuthenticatedSuperAdminRequest } from "@/lib/super-admin-auth";

async function handler(req: AuthenticatedSuperAdminRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get("timeRange") as "1h" | "24h" | "7d" | "30d") || "24h";
    
    // Get both real-time and historical metrics
    const [realTimeMetrics, historicalData] = await Promise.all([
      APMService.getRealTimeMetrics(timeRange === "1h" ? "1h" : "24h"),
      APMService.getHistoricalMetrics(timeRange),
    ]);
    
    return NextResponse.json({
      realTime: realTimeMetrics,
      historical: historicalData.summary,
      timeRange,
    });
  } catch (error) {
    console.error("Performance metrics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance metrics" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

