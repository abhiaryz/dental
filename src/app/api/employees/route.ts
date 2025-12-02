import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";

// GET - List all employees in the clinic
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    // Check if user has permission to view employees
    const canView = await checkPermission(userRole, "employees", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (!userClinicId) {
      return NextResponse.json({ error: "No clinic associated" }, { status: 400 });
    }

    // Get all employees in the clinic
    const employees = await prisma.user.findMany({
      where: {
        clinicId: userClinicId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isExternal: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get pending invitations
    const invitations = await prisma.invitation.findMany({
      where: {
        clinicId: userClinicId,
        status: "pending",
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      employees,
      invitations,
      total: employees.length,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  } finally {
  }
}

