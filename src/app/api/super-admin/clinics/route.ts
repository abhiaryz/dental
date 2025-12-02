import { NextResponse } from "next/server";
import { withSuperAdminAuth, AuthenticatedSuperAdminRequest } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";

async function handler(req: AuthenticatedSuperAdminRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { clinicCode: { contains: search, mode: "insensitive" } },
        { ownerEmail: { contains: search, mode: "insensitive" } },
        { ownerName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      // Fallback since subscriptionStatus doesn't exist in DB
      if (status === "TRIAL") where.planType = "free";
      if (status === "ACTIVE") where.planType = { not: "free" };
      // where.subscriptionStatus = status;
    }

    // Get total count
    const total = await prisma.clinic.count({ where });

    // Get clinics with user count
    const clinics = await prisma.clinic.findMany({
      where,
      select: {
        id: true,
        name: true,
        clinicCode: true,
        type: true,
        email: true,
        ownerName: true,
        ownerEmail: true,
        planType: true,
        // subscriptionStatus: true,
        // subscriptionStartDate: true,
        // subscriptionEndDate: true,
        // mrr: true,
        // lastPaymentDate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            patients: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format response
    const formattedClinics = clinics.map((clinic) => ({
      ...clinic,
      subscriptionStatus: clinic.planType === "free" ? "TRIAL" : "ACTIVE", // Mock status
      mrr: clinic.planType === "free" ? 0 : 50, // Mock MRR
      userCount: clinic._count.users,
      patientCount: clinic._count.patients,
      _count: undefined,
    }));

    return NextResponse.json({
      clinics: formattedClinics,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get clinics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

