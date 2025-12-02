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

    // Total clinics by status (using planType as a proxy since subscriptionStatus is missing)
    const clinicsByPlan = await prisma.clinic.groupBy({
      by: ["planType"],
      _count: true,
    });

    const statusCounts = clinicsByPlan.reduce((acc, item) => {
      // Map plan types to status-like categories for the dashboard
      // free -> TRIAL, premium -> ACTIVE, etc.
      const status = item.planType === "free" ? "TRIAL" : "ACTIVE";
      acc[status] = (acc[status] || 0) + item._count;
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

    // Calculate MRR (Mock calculation as mrr field is missing)
    // Assuming "premium" plan is $50/mo, "enterprise" is $100/mo
    const mrrData = await prisma.clinic.findMany({
      where: {
        isActive: true,
        planType: { not: "free" }
      },
      select: {
        planType: true
      }
    });

    const totalMRR = mrrData.reduce((sum, clinic) => {
       // This is a placeholder logic. Adjust based on your real pricing model.
       if (clinic.planType === "premium") return sum + 50;
       if (clinic.planType === "enterprise") return sum + 100;
       return sum;
    }, 0);

    // Calculate churn rate (clinics that became inactive this month)
    // Using isActive flag and updatedAt as proxy
    const churnedThisMonth = await prisma.clinic.count({
      where: {
        isActive: false,
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
      
      // MRR Trend (Mock)
      const monthMRR = await prisma.clinic.count({
        where: {
          isActive: true,
          planType: { not: "free" },
          createdAt: {
            lte: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          },
        },
      });

      // Simple mock: count * 50
      mrrTrend.push({
        month: monthKey,
        value: monthMRR * 50,
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

