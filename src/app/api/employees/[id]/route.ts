import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";


// GET - Get single employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canView = await checkPermission(userRole, "employees", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const employee = await prisma.user.findFirst({
      where: {
        id,
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
        image: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  } finally {
  }
}

// PUT - Update employee (role, etc.)
export async function PUT(
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

    const canUpdate = await checkPermission(userRole, "employees", "update");
    if (!canUpdate) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Prevent self-update
    if (userId === id) {
      return NextResponse.json(
        { error: "Cannot update your own role" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { role, name } = data;

    // Verify employee belongs to same clinic
    const employee = await prisma.user.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Update employee
    const updatedEmployee = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(name && { name }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.EMPLOYEE_UPDATED,
      entityType: "user",
      entityId: id,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: { updatedFields: Object.keys(data), role },
    });

    return NextResponse.json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  } finally {
  }
}

// DELETE - Remove employee from clinic
export async function DELETE(
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

    const canDelete = await checkPermission(userRole, "employees", "delete");
    if (!canDelete) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Prevent self-deletion
    if (userId === id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    // Verify employee belongs to same clinic
    const employee = await prisma.user.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Delete employee (this will cascade to related records)
    await prisma.user.delete({
      where: { id },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.EMPLOYEE_DELETED,
      entityType: "user",
      entityId: id,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: { email: employee.email, role: employee.role },
    });

    return NextResponse.json({
      message: "Employee removed successfully",
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  } finally {
  }
}

