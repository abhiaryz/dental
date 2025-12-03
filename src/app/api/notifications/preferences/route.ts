import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createErrorResponse, AppError, ErrorCodes } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { notificationPreferencesSchema, validateData } from "@/lib/validation";


// GET - Get notification preferences
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AppError("Unauthorized", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userId = (session.user as any).id;

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to fetch preferences");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting for mutation
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.allowed) {
      return rateLimit.error || NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const session = await auth();

    if (!session?.user) {
      throw new AppError("Unauthorized", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userId = (session.user as any).id;

    let data;
    try {
      data = await request.json();
    } catch {
      throw new AppError("Invalid JSON in request body", ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Validate request body
    const validation = validateData(notificationPreferencesSchema, data);
    if (!validation.success) {
      throw new AppError("Validation failed", ErrorCodes.VALIDATION_ERROR, 400, validation.errors);
    }

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: validation.data,
      create: {
        userId,
        ...validation.data,
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to update preferences");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
