import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { createErrorResponse, AppError, ErrorCodes } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { inventoryItemUpdateSchema, validateData } from "@/lib/validation";


// GET - Get single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      throw new AppError("Unauthorized", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canRead = await checkPermission(userRole, "inventory", "read");
    if (!canRead) {
      throw new AppError("Permission denied", ErrorCodes.FORBIDDEN, 403);
    }

    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
      include: {
        supplier: true,
        stockMovements: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!item) {
      throw new AppError("Item not found", ErrorCodes.NOT_FOUND, 404);
    }

    return NextResponse.json(item);
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to fetch inventory item");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// PUT - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting for mutation
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.allowed) {
      return rateLimit.error || NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      throw new AppError("Unauthorized", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canUpdate = await checkPermission(userRole, "inventory", "update");
    if (!canUpdate) {
      throw new AppError("Permission denied", ErrorCodes.FORBIDDEN, 403);
    }

    // Verify item belongs to clinic
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
    });

    if (!existingItem) {
      throw new AppError("Item not found", ErrorCodes.NOT_FOUND, 404);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      throw new AppError("Invalid JSON in request body", ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Validate request body
    const validation = validateData(inventoryItemUpdateSchema, data);
    if (!validation.success) {
      throw new AppError("Validation failed", ErrorCodes.VALIDATION_ERROR, 400, validation.errors);
    }

    // Don't allow direct quantity updates (use stock adjustment endpoint)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { quantity: _quantity, ...safeData } = validation.data;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: safeData,
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to update inventory item");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// DELETE - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting for mutation
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.allowed) {
      return rateLimit.error || NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      throw new AppError("Unauthorized", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canDelete = await checkPermission(userRole, "inventory", "delete");
    if (!canDelete) {
      throw new AppError("Permission denied", ErrorCodes.FORBIDDEN, 403);
    }

    // Verify item belongs to clinic
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
    });

    if (!existingItem) {
      throw new AppError("Item not found", ErrorCodes.NOT_FOUND, 404);
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to delete inventory item");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
