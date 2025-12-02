import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";


// POST - Adjust stock quantity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canUpdate = await checkPermission(userRole, "inventory", "update");
    if (!canUpdate) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Verify item belongs to clinic
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const { type, quantity, reason, reference } = await request.json();

    if (!type || !quantity) {
      return NextResponse.json(
        { error: "Type and quantity are required" },
        { status: 400 }
      );
    }

    if (!["IN", "OUT", "ADJUSTMENT", "EXPIRED", "DAMAGED"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid movement type" },
        { status: 400 }
      );
    }

    // Calculate new quantity
    let newQuantity = item.quantity;
    if (type === "IN" || type === "ADJUSTMENT") {
      newQuantity += quantity;
    } else {
      newQuantity -= quantity;
    }

    // Ensure quantity doesn't go negative
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 }
      );
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
          type,
          quantity,
          previousQty: item.quantity,
          newQty: newQuantity,
          reason,
          reference,
          userId,
        },
      }),
    ]);

    return NextResponse.json({
      item: updatedItem,
      movement,
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    );
  } finally {
  }
}

