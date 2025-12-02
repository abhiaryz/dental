import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
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
    const { name, email, password, role } = await request.json();
    const clientId = getClientIdentifier(request);

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate role if provided
    const validRoles: Role[] = ["ADMIN", "CLINIC_DOCTOR", "HYGIENIST", "RECEPTIONIST", "EXTERNAL_DOCTOR"];
    const userRole: Role = role && validRoles.includes(role) ? role : "CLINIC_DOCTOR";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine if user is external
    const isExternal = userRole === "EXTERNAL_DOCTOR";

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        isExternal,
        emailVerified: null, // Will be set after verification
      },
    });

    // Create verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail({
      to: email,
      verificationToken,
      userName: name,
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: AuditActions.USER_SIGNUP,
      ipAddress: clientId,
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: { role: userRole, isExternal },
    });

    return NextResponse.json(
      {
        message: "User created successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}

