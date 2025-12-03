import { NextResponse } from "next/server";
import { withSuperAdminAuth } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";

async function handler() {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.user.count();

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    // Active users (logged in last 30 days)
    const activeUsers30d = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: last30Days,
        },
      },
    });

    // Active users (logged in last 7 days)
    const activeUsers7d = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: last7Days,
        },
      },
    });

    // New users this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // User growth trend (last 12 months)
    const userGrowthTrend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = date.toISOString().slice(0, 7);
      
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      userGrowthTrend.push({
        month: monthKey,
        value: count,
      });
    }

    // Average users per clinic
    const totalClinics = await prisma.clinic.count({
      where: { isActive: true },
    });
    const avgUsersPerClinic = totalClinics > 0 ? totalUsers / totalClinics : 0;

    return NextResponse.json({
      users: {
        total: totalUsers,
        activeUsers30d,
        activeUsers7d,
        newUsersThisMonth,
        avgUsersPerClinic,
        usersByRole: usersByRole.map((item) => ({
          role: item.role,
          count: item._count,
        })),
        growthTrend: userGrowthTrend,
      },
    });
  } catch (error) {
    console.error("Get user analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

