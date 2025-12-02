import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";


// GET - List all suppliers
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    if (!userClinicId) {
      return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
    }

    const canRead = await checkPermission(userRole, "inventory", "read");
    if (!canRead) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
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
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  } finally {
  }
}

// POST - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    if (!userClinicId) {
      return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
    }

    const canCreate = await checkPermission(userRole, "inventory", "create");
    if (!canCreate) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const data = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        clinicId: userClinicId,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  } finally {
  }
}

