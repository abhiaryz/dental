import { NextRequest, NextResponse } from "next/server";
import { withSuperAdminAuth, AuthenticatedSuperAdminRequest, logSuperAdminAction } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";

async function getHandler(
  req: AuthenticatedSuperAdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isExternal: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            patients: true,
            users: true,
            invoices: true,
          },
        },
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Get recent activity (last 10 audit logs)
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        userId: {
          in: clinic.users.map((u) => u.id),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      clinic: {
        ...clinic,
        patientCount: clinic._count.patients,
        userCount: clinic._count.users,
        invoiceCount: clinic._count.invoices,
        inventoryCount: 0, // Mock as inventory is not yet implemented
        subscriptionStatus: clinic.planType === "free" ? "TRIAL" : "ACTIVE",
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Get clinic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function patchHandler(
  req: AuthenticatedSuperAdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      subscriptionStatus,
      subscriptionStartDate,
      subscriptionEndDate,
      billingEmail,
      mrr,
      isActive,
    } = body;

    const updateData: any = {};

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    
    // Map subscriptionStatus to planType if needed (simple mock logic)
    if (subscriptionStatus === "TRIAL") {
       updateData.planType = "free";
    } else if (subscriptionStatus === "ACTIVE") {
       // Preserve existing plan or default to premium if currently free
       // updateData.planType = "premium"; 
    }

    const clinic = await prisma.clinic.update({
      where: { id },
      data: updateData,
    });

    // Log the action
    await logSuperAdminAction(
      req.superAdmin.id,
      "CLINIC_UPDATED",
      "Clinic",
      id,
      { updates: updateData }
    );

    return NextResponse.json({ clinic });
  } catch (error) {
    console.error("Update clinic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(getHandler);
export const PATCH = withSuperAdminAuth(patchHandler);

