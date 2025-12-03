import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";
import { createErrorResponse, AppError, ErrorCodes } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { profileUpdateSchema, validateData } from "@/lib/validation";


// GET - Get user profile
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      throw new AppError("Unauthorized", ErrorCodes.UNAUTHORIZED, 401);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: (session.user as any).id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", ErrorCodes.NOT_FOUND, 404);
    }

    return NextResponse.json(user);
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to fetch profile");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// PUT - Update user profile
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

    let body;
    try {
      body = await request.json();
    } catch {
      throw new AppError("Invalid JSON in request body", ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Validate request body
    const validation = validateData(profileUpdateSchema, body);
    if (!validation.success) {
      throw new AppError("Validation failed", ErrorCodes.VALIDATION_ERROR, 400, validation.errors);
    }

    const userId = (session.user as any).id;

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: validation.data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.PROFILE_UPDATED,
      entityType: "user",
      entityId: userId,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json(user);
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to update profile");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
