import { NextResponse } from "next/server";
import { withSuperAdminAuth, AuthenticatedSuperAdminRequest } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";

async function handler() {
  try {
    // Get MRR by clinic type
    const mrrByType = await prisma.clinic.groupBy({
      by: ["type"],
      where: {
        subscriptionStatus: "ACTIVE",
      },
      _sum: {
        mrr: true,
      },
      _count: true,
    });

    // Get total revenue (sum of all MRR)
    const totalRevenue = await prisma.clinic.aggregate({
      where: {
        subscriptionStatus: "ACTIVE",
      },
      _sum: {
        mrr: true,
      },
    });

    // Get average MRR per clinic
    const activeClinics = await prisma.clinic.count({
      where: {
        subscriptionStatus: "ACTIVE",
      },
    });

    const avgMRR = activeClinics > 0 ? (totalRevenue._sum.mrr || 0) / activeClinics : 0;

    // Get top 10 clinics by MRR
    const topClinics = await prisma.clinic.findMany({
      where: {
        subscriptionStatus: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        clinicCode: true,
        mrr: true,
        subscriptionStartDate: true,
      },
      orderBy: {
        mrr: "desc",
      },
      take: 10,
    });

    // Calculate ARR (Annual Recurring Revenue)
    const arr = (totalRevenue._sum.mrr || 0) * 12;

    return NextResponse.json({
      revenue: {
        totalMRR: totalRevenue._sum.mrr || 0,
        arr,
        avgMRR,
        activeClinics,
        mrrByType: mrrByType.map((item) => ({
          type: item.type,
          mrr: item._sum.mrr || 0,
          count: item._count,
        })),
        topClinics,
      },
    });
  } catch (error) {
    console.error("Get revenue analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

