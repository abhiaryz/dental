import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { cacheQuery, getCacheKey, CACHE_CONFIG } from "@/lib/query-cache";
import { Cache } from "@/lib/redis";

// GET - List all inventory items
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
    }

    // Check permissions
    const canRead = await checkPermission(userRole, "inventory", "read");
    if (!canRead) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const lowStock = searchParams.get("lowStock") === "true";

    const where: any = {
      clinicId: userClinicId,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    // Cache inventory query
    const cacheKey = getCacheKey(
      'inventory',
      userClinicId,
      category || 'all',
      search || 'no-search',
      lowStock ? 'low-stock' : 'all'
    );

    const result = await cacheQuery(
      cacheKey,
      async () => {
        const items = await prisma.inventoryItem.findMany({
          where,
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                stockMovements: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        });

        // Filter low stock items if requested
        let filteredItems = items;
        if (lowStock) {
          filteredItems = items.filter(item => item.quantity <= item.minQuantity);
        }

        // Calculate stats
        const totalItems = items.length;
        const lowStockCount = items.filter(item => item.quantity <= item.minQuantity).length;
        const outOfStockCount = items.filter(item => item.quantity === 0).length;
        const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        return {
          items: filteredItems,
          stats: {
            totalItems,
            lowStockCount,
            outOfStockCount,
            totalValue,
          },
        };
      },
      CACHE_CONFIG.SHORT, // 1 minute cache
      [`inventory-${userClinicId}`]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  } finally {
  }
}

// POST - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    let userClinicId = (session.user as any).clinicId;

    // If clinicId is missing from session, try to fetch it from database
    // This handles cases where the session might be stale (e.g. just after clinic creation)
    if (!userClinicId && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { clinicId: true },
      });
      if (user?.clinicId) {
        userClinicId = user.clinicId;
      }
    }

    // For inventory creation, we need a valid clinic ID
    if (!userClinicId) {
      return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
    }

    // Check permissions
    const canCreate = await checkPermission(userRole, "inventory", "create");
    if (!canCreate) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.category || !data.unit || data.unitPrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the item
    const item = await prisma.inventoryItem.create({
      data: {
        ...data,
        clinicId: userClinicId,
        quantity: data.quantity || 0,
      },
      include: {
        supplier: true,
      },
    });

    // Invalidate inventory cache
    await Cache.invalidatePattern(`inventory:${userClinicId}:*`);

    // Create stock movement if initial quantity > 0
    if (item.quantity > 0) {
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          type: "IN",
          quantity: item.quantity,
          previousQty: 0,
          newQty: item.quantity,
          reason: "Initial stock",
          userId,
        },
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  } finally {
  }
}

