import { NextRequest, NextResponse } from "next/server";
import { withSuperAdminAuth, AuthenticatedSuperAdminRequest } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";

async function handler(req: AuthenticatedSuperAdminRequest) {
  try {
    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total clinics by status
    const clinicsByStatus = await prisma.clinic.groupBy({
      by: ["subscriptionStatus"],
      _count: true,
    });

    const statusCounts = clinicsByStatus.reduce((acc, item) => {
      acc[item.subscriptionStatus] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Total active clinics
    const activeClinics = await prisma.clinic.count({
      where: { isActive: true },
    });

    // Total users across platform
    const totalUsers = await prisma.user.count();

    // New signups this month
    const newSignupsThisMonth = await prisma.clinic.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // New signups last month
    const newSignupsLastMonth = await prisma.clinic.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // Calculate MRR
    const mrrData = await prisma.clinic.aggregate({
      where: {
        subscriptionStatus: "ACTIVE",
      },
      _sum: {
        mrr: true,
      },
    });

    const totalMRR = mrrData._sum.mrr || 0;

    // Calculate churn rate (clinics that became inactive this month)
    const churnedThisMonth = await prisma.clinic.count({
      where: {
        subscriptionStatus: "CANCELLED",
        updatedAt: {
          gte: startOfMonth,
        },
      },
    });

    const totalActiveAtStartOfMonth = activeClinics + churnedThisMonth;
    const churnRate = totalActiveAtStartOfMonth > 0 
      ? (churnedThisMonth / totalActiveAtStartOfMonth) * 100 
      : 0;

    // Get MRR trend for last 12 months
    const mrrTrend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      
      const monthMRR = await prisma.clinic.aggregate({
        where: {
          subscriptionStatus: "ACTIVE",
          createdAt: {
            lte: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          },
        },
        _sum: {
          mrr: true,
        },
      });

      mrrTrend.push({
        month: monthKey,
        value: monthMRR._sum.mrr || 0,
      });
    }

    // Get signup trend for last 12 months
    const signupTrend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = date.toISOString().slice(0, 7);
      
      const count = await prisma.clinic.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      signupTrend.push({
        month: monthKey,
        value: count,
      });
    }

    return NextResponse.json({
      overview: {
        totalClinics: activeClinics,
        clinicsByStatus: statusCounts,
        totalUsers,
        totalMRR,
        newSignupsThisMonth,
        newSignupsLastMonth,
        signupGrowth: newSignupsLastMonth > 0 
          ? ((newSignupsThisMonth - newSignupsLastMonth) / newSignupsLastMonth) * 100 
          : 0,
        churnRate,
        churnedThisMonth,
      },
      trends: {
        mrr: mrrTrend,
        signups: signupTrend,
      },
    });
  } catch (error) {
    console.error("Get analytics overview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

