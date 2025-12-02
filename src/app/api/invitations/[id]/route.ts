import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";


// DELETE - Cancel/revoke invitation
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

    // Verify invitation belongs to same clinic
    const invitation = await prisma.invitation.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Delete invitation
    await prisma.invitation.delete({
      where: { id },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.INVITATION_REVOKED,
      entityType: "invitation",
      entityId: id,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: { email: invitation.email, role: invitation.role },
    });

    return NextResponse.json({
      message: "Invitation cancelled successfully",
    });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 }
    );
  } finally {
  }
}

