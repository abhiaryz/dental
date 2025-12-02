import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";
import { getClientIdentifier } from "@/lib/rate-limiter";


export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    const clientId = getClientIdentifier(request);

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 404 });
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user password
      const user = await tx.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      });

      // Delete the used reset token
      await tx.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return { user };
    });

    // Create audit log
    await createAuditLog({
      userId: result.user.id,
      action: AuditActions.PASSWORD_RESET_COMPLETED,
      ipAddress: clientId,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  } finally {
  }
}

