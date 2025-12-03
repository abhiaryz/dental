import { NextRequest, NextResponse } from "next/server";
import { APMService } from "@/lib/apm-service";
import { z } from "zod";

/**
 * Web Vitals API Endpoint
 * Receives Web Vitals metrics from client-side and stores them
 */

const webVitalSchema = z.object({
  name: z.enum(["CLS", "FID", "LCP", "INP", "TTFB"]),
  value: z.number(),
  rating: z.enum(["good", "needs-improvement", "poor"]),
  page: z.string(),
  delta: z.number().optional(),
  id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the request body
    const validated = webVitalSchema.parse(body);
    
    // Extract user context if available (from cookies or headers)
    // For now, we'll track without user context as Web Vitals are page-level metrics
    const userId = req.headers.get("x-user-id") || undefined;
    const clinicId = req.headers.get("x-clinic-id") || undefined;
    
    // Track the Web Vital
    await APMService.trackWebVital({
      name: validated.name,
      value: validated.value,
      rating: validated.rating,
      page: validated.page,
      userId,
      clinicId,
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    
    console.error("Web Vitals API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

