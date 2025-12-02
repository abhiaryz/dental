import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";
import { passwordResetLimiter, getClientIdentifier, checkRateLimit } from "@/lib/rate-limiter";
import crypto from "crypto";


function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const clientId = getClientIdentifier(request);

    // Rate limiting
    const rateLimit = await checkRateLimit(passwordResetLimiter, clientId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset requests. Please try again in ${Math.ceil((rateLimit.resetTime || 0) / 1000 / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // Generate new reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Create password reset token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token: resetToken,
        expiresAt,
      },
    });

    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      to: email,
      resetToken,
      userName: user.name || undefined,
    });

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send password reset email. Please try again." },
        { status: 500 }
      );
    }

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: AuditActions.PASSWORD_RESET_REQUESTED,
      ipAddress: clientId,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  } finally {
  }
}

