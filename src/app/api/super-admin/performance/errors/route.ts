import { NextResponse } from "next/server";
import { withSuperAdminAuth } from "@/lib/super-admin-auth";
import { APMService } from "@/lib/apm-service";
import type { AuthenticatedSuperAdminRequest } from "@/lib/super-admin-auth";

async function handler(req: AuthenticatedSuperAdminRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get("timeRange") as "1h" | "24h" | "7d" | "30d") || "24h";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const endpoint = searchParams.get("endpoint");
    
    const historicalData = await APMService.getHistoricalMetrics(timeRange);
    
    let errors = historicalData.errors;
    
    // Filter by endpoint if provided
    if (endpoint) {
      errors = errors.filter((e) => e.endpoint.includes(endpoint));
    }
    
    // Limit results
    errors = errors.slice(0, limit);
    
    return NextResponse.json({
      errors,
      total: historicalData.errors.length,
      timeRange,
    });
  } catch (error) {
    console.error("Error logs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

