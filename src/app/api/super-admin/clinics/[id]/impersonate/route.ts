import { NextRequest, NextResponse } from "next/server";
import { withSuperAdminAuth, AuthenticatedSuperAdminRequest, logSuperAdminAction } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

const IMPERSONATION_SECRET = new TextEncoder().encode(
  process.env.IMPERSONATION_SECRET || "impersonation-secret-change-in-production"
);

async function handler(
  req: AuthenticatedSuperAdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get clinic and an admin user
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: "ADMIN" },
          take: 1,
        },
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    if (clinic.users.length === 0) {
      return NextResponse.json(
        { error: "No admin user found for this clinic" },
        { status: 404 }
      );
    }

    const adminUser = clinic.users[0];

    // Create a time-limited impersonation token (30 minutes)
    const impersonationToken = await new SignJWT({
      userId: adminUser.id,
      clinicId: clinic.id,
      superAdminId: req.superAdmin.id,
      impersonation: true,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30m")
      .sign(IMPERSONATION_SECRET);

    // Log the impersonation
    await logSuperAdminAction(
      req.superAdmin.id,
      "IMPERSONATION_STARTED",
      "Clinic",
      id,
      {
        clinicName: clinic.name,
        targetUserId: adminUser.id,
        targetUserEmail: adminUser.email,
      }
    );

    return NextResponse.json({
      success: true,
      impersonationToken,
      clinic: {
        id: clinic.id,
        name: clinic.name,
        clinicCode: clinic.clinicCode,
      },
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
      },
    });
  } catch (error) {
    console.error("Impersonate clinic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withSuperAdminAuth(handler);

