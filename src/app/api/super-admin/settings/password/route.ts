import { NextResponse } from "next/server";
import { withSuperAdminAuth, AuthenticatedSuperAdminRequest, logSuperAdminAction } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function handler(req: AuthenticatedSuperAdminRequest) {
  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Get super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: req.superAdmin.id },
    });

    if (!superAdmin) {
      return NextResponse.json(
        { error: "Super admin not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, superAdmin.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.superAdmin.update({
      where: { id: req.superAdmin.id },
      data: { password: hashedPassword },
    });

    // Log the action
    await logSuperAdminAction(
      req.superAdmin.id,
      "PASSWORD_CHANGED",
      "SuperAdmin",
      req.superAdmin.id
    );

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withSuperAdminAuth(handler);

