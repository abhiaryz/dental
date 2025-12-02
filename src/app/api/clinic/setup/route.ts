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

// Generate unique clinic code
function generateClinicCode(clinicName: string): string {
  const prefix = clinicName
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const clientId = getClientIdentifier(request);

    // Validation
    if (!data.clinicName || !data.email || !data.ownerName || !data.ownerEmail || !data.password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (data.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if owner email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.ownerEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Generate unique clinic code
    let clinicCode = generateClinicCode(data.clinicName);
    
    // Ensure uniqueness
    let exists = await prisma.clinic.findUnique({ where: { clinicCode } });
    let attempts = 0;
    while (exists && attempts < 10) {
      clinicCode = generateClinicCode(data.clinicName);
      exists = await prisma.clinic.findUnique({ where: { clinicCode } });
      attempts++;
    }

    if (exists) {
      return NextResponse.json(
        { error: "Unable to generate unique clinic code. Please try again." },
        { status: 500 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create clinic and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create clinic with terms acceptance
      const now = new Date();
      const clinic = await tx.clinic.create({
        data: {
          name: data.clinicName,
          clinicCode,
          type: data.clinicType || "CLINIC",
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail,
          termsAcceptedAt: now,
          privacyAcceptedAt: now,
        },
      });

      // Create admin user with username
      const username = `admin_${clinicCode.toLowerCase()}`;
      
      const user = await tx.user.create({
        data: {
          name: data.ownerName,
          email: data.ownerEmail,
          username: username,
          password: hashedPassword,
          role: "ADMIN",
          clinicId: clinic.id,
          isExternal: false,
          emailVerified: null, // Will be verified via email
        },
      });

      return { clinic, user };
    });

    // Create verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.emailVerificationToken.create({
      data: {
        email: data.ownerEmail,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail({
      to: data.ownerEmail,
      verificationToken,
      userName: data.ownerName,
    });

    // Create audit logs
    await createAuditLog({
      userId: result.user.id,
      action: AuditActions.CLINIC_CREATED,
      entityType: "clinic",
      entityId: result.clinic.id,
      ipAddress: clientId,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    await createAuditLog({
      userId: result.user.id,
      action: AuditActions.USER_SIGNUP,
      ipAddress: clientId,
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: { role: "ADMIN", clinicId: result.clinic.id },
    });

    return NextResponse.json({
      message: "Clinic created successfully",
      clinicCode: result.clinic.clinicCode,
      clinic: {
        id: result.clinic.id,
        name: result.clinic.name,
        code: result.clinic.clinicCode,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Clinic setup error:", error);
    return NextResponse.json(
      { error: "Failed to create clinic" },
      { status: 500 }
    );
  } finally {
  }
}

