import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { createErrorResponse, AppError, ErrorCodes } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { supplierSchema, validateData } from "@/lib/validation";


// GET - List all suppliers
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AppError("Unauthorized", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    if (!userClinicId) {
      throw new AppError("Clinic ID is required", ErrorCodes.VALIDATION_ERROR, 400);
    }

    const canRead = await checkPermission(userRole, "inventory", "read");
    if (!canRead) {
      throw new AppError("Permission denied", ErrorCodes.FORBIDDEN, 403);
    }

    const suppliers = await prisma.supplier.findMany({
      where: {
        clinicId: userClinicId,
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to fetch suppliers");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// POST - Create new supplier
export async function POST(request: NextRequest) {
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

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    if (!userClinicId) {
      throw new AppError("Clinic ID is required", ErrorCodes.VALIDATION_ERROR, 400);
    }

    const canCreate = await checkPermission(userRole, "inventory", "create");
    if (!canCreate) {
      throw new AppError("Permission denied", ErrorCodes.FORBIDDEN, 403);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      throw new AppError("Invalid JSON in request body", ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Validate request body
    const validation = validateData(supplierSchema, data);
    if (!validation.success) {
      throw new AppError("Validation failed", ErrorCodes.VALIDATION_ERROR, 400, validation.errors);
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...validation.data,
        clinicId: userClinicId,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to create supplier");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
