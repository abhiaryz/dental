import { NextResponse } from "next/server";
import { withSuperAdminAuth, AuthenticatedSuperAdminRequest, logSuperAdminAction } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";

async function handler(
  req: AuthenticatedSuperAdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clinic = await prisma.clinic.update({
      where: { id },
      data: {
        isActive: false,
        subscriptionStatus: "SUSPENDED",
      },
    });

    // Log the action
    await logSuperAdminAction(
      req.superAdmin.id,
      "CLINIC_SUSPENDED",
      "Clinic",
      id,
      { clinicName: clinic.name }
    );

    return NextResponse.json({ 
      success: true,
      clinic,
      message: "Clinic suspended successfully" 
    });
  } catch (error) {
    console.error("Suspend clinic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withSuperAdminAuth(handler);

