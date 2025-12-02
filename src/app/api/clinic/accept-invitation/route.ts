import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";
import { getClientIdentifier } from "@/lib/rate-limiter";


function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { token, name, password } = data;
    const clientId = getClientIdentifier(request);

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        clinic: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation token" }, { status: 404 });
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });

      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          name,
          email: invitation.email,
          username: `${invitation.email.split("@")[0]}_${invitation.clinic.clinicCode}`.toLowerCase(),
          password: hashedPassword,
          role: invitation.role as any,
          clinicId: invitation.clinicId,
          isExternal: false,
        },
      });

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });

      return { user };
    });

    // Create verification token for email
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.emailVerificationToken.create({
      data: {
        email: invitation.email,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail({
      to: invitation.email,
      verificationToken,
      userName: name,
    });

    // Create audit logs
    await createAuditLog({
      userId: result.user.id,
      action: AuditActions.INVITATION_ACCEPTED,
      entityType: "invitation",
      entityId: invitation.id,
      ipAddress: clientId,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    await createAuditLog({
      userId: result.user.id,
      action: AuditActions.USER_SIGNUP,
      ipAddress: clientId,
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: { role: result.user.role, clinicId: invitation.clinicId },
    });

    return NextResponse.json({
      message: "Account created successfully. Please check your email to verify your account.",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  } finally {
  }
}

