import { NextRequest, NextResponse } from "next/server";
import { withSuperAdminAuth } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedSuperAdminRequest } from "@/lib/super-admin-auth";

async function handler(req: AuthenticatedSuperAdminRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get("timeRange") as "1h" | "24h" | "7d" | "30d") || "24h";
    const page = searchParams.get("page");
    
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case "1h":
        startDate.setHours(now.getHours() - 1);
        break;
      case "24h":
        startDate.setDate(now.getDate() - 1);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
    }
    
    const where: any = {
      timestamp: { gte: startDate },
    };
    
    if (page) {
      where.page = page;
    }
    
    // Get Web Vitals grouped by name and page
    const webVitals = await prisma.webVital.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 1000,
    });
    
    // Aggregate by metric name and page
    const aggregated: Record<string, {
      name: string;
      page: string;
      values: number[];
      ratings: { good: number; "needs-improvement": number; poor: number };
    }> = {};
    
    webVitals.forEach((vital) => {
      const key = `${vital.name}-${vital.page}`;
      if (!aggregated[key]) {
        aggregated[key] = {
          name: vital.name,
          page: vital.page,
          values: [],
          ratings: { good: 0, "needs-improvement": 0, poor: 0 },
        };
      }
      aggregated[key].values.push(vital.value);
      const rating = vital.rating as "good" | "needs-improvement" | "poor";
      aggregated[key].ratings[rating]++;
    });
    
    // Calculate averages
    const result = Object.values(aggregated).map((item) => ({
      name: item.name,
      page: item.page,
      avgValue: item.values.length > 0
        ? Math.round(item.values.reduce((sum, v) => sum + v, 0) / item.values.length)
        : 0,
      minValue: item.values.length > 0 ? Math.min(...item.values) : 0,
      maxValue: item.values.length > 0 ? Math.max(...item.values) : 0,
      count: item.values.length,
      ratings: item.ratings,
    }));
    
    return NextResponse.json({
      webVitals: result,
      timeRange,
    });
  } catch (error) {
    console.error("Web Vitals API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Web Vitals" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

