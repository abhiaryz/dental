import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { createErrorResponse, AppError, ErrorCodes } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { stockAdjustmentSchema, validateData } from "@/lib/validation";
import { Cache } from "@/lib/redis";


// POST - Adjust stock quantity
export async function POST(
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

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    let userClinicId = (session.user as any).clinicId;

    if (!userClinicId && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { clinicId: true },
      });
      if (user?.clinicId) {
        userClinicId = user.clinicId;
      }
    }

    if (!userClinicId) {
      throw new AppError("Clinic ID is required", ErrorCodes.VALIDATION_ERROR, 400);
    }

    const canUpdate = await checkPermission(userRole, "inventory", "update");
    if (!canUpdate) {
      throw new AppError("Permission denied", ErrorCodes.FORBIDDEN, 403);
    }

    // Verify item belongs to clinic
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
    });

    if (!item) {
      throw new AppError("Item not found", ErrorCodes.NOT_FOUND, 404);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      throw new AppError("Invalid JSON in request body", ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Validate request body
    const validation = validateData(stockAdjustmentSchema, data);
    if (!validation.success) {
      throw new AppError("Validation failed", ErrorCodes.VALIDATION_ERROR, 400, validation.errors);
    }

    const { type, quantity, reason, reference } = validation.data;

    // Map adjustment type to stock movement type
    const movementTypeMap: Record<string, string> = {
      add: "IN",
      remove: "OUT",
      adjustment: "ADJUSTMENT",
    };
    const movementType = movementTypeMap[type];

    // Calculate new quantity
    let newQuantity = item.quantity;
    if (type === "add" || type === "adjustment") {
      newQuantity += quantity;
    } else {
      newQuantity -= quantity;
    }

    // Ensure quantity doesn't go negative
    if (newQuantity < 0) {
      throw new AppError("Insufficient stock", ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Update item and create stock movement in a transaction
    const [updatedItem, movement] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id },
        data: { quantity: newQuantity },
        include: {
          supplier: true,
        },
      }),
      prisma.stockMovement.create({
        data: {
          itemId: id,
          type: movementType,
          quantity,
          previousQty: item.quantity,
          newQty: newQuantity,
          reason,
          reference,
          userId,
        },
      }),
    ]);

    // Invalidate inventory cache
    await Cache.invalidatePattern(`inventory:${userClinicId}:*`);

    return NextResponse.json({
      item: updatedItem,
      movement,
    });
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to adjust stock");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
