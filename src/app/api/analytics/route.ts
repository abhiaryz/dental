import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

// GET - Fetch dashboard analytics and statistics
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const userId = req.user.id;
      const clinicId = req.user.clinicId;

      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.treatmentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Build patient where clause for clinic-based queries
    const patientWhere = getPatientWhereClause(
      userId,
      req.user.role,
      req.user.isExternal,
      clinicId
    );

    // Build treatment where clause
    const treatmentWhere: any = { patient: patientWhere, ...dateFilter };

    // Get today's start time
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get last week's date
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);

    // Fetch all stats in parallel
    const [
      totalPatients,
      totalTreatments,
      totalAppointments,
      totalRevenue,
      totalPendingAmount,
      recentPatients,
      upcomingAppointments,
      treatmentsByMonth,
      todayAppointments,
      recentActivity,
      weeklyTreatments,
      allTreatments,
    ] = await Promise.all([
      // Total patients
      prisma.patient.count({
        where: patientWhere,
      }),

      // Total treatments
      prisma.treatment.count({
        where: treatmentWhere,
      }),

      // Total appointments
      prisma.appointment.count({
        where: {
          patient: patientWhere,
        },
      }),

      // Total revenue (paid amounts)
      prisma.treatment.aggregate({
        where: treatmentWhere,
        _sum: {
          paidAmount: true,
        },
      }),

      // Total pending amount
      prisma.treatment.aggregate({
        where: treatmentWhere,
        _sum: {
          cost: true,
          paidAmount: true,
        },
      }),

      // Recent patients (last 5)
      prisma.patient.findMany({
        where: patientWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: {
            select: {
              treatments: true,
            },
          },
        },
      }),

      // Upcoming appointments (next 5)
      prisma.appointment.findMany({
        where: {
          patient: patientWhere,
          date: {
            gte: new Date(),
          },
          status: {
            in: ["scheduled", "confirmed"],
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobileNumber: true,
            },
          },
        },
        orderBy: [
          { date: "asc" },
          { time: "asc" },
        ],
        take: 5,
      }),

      // Treatments by month (last 6 months)
      prisma.treatment.findMany({
        where: {
          ...treatmentWhere,
          treatmentDate: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        select: {
          treatmentDate: true,
          cost: true,
          paidAmount: true,
        },
      }),

      // Today's appointments
      prisma.appointment.findMany({
        where: {
          patient: patientWhere,
          date: {
            gte: todayStart,
            lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Recent activity (last 10 activities)
      Promise.all([
        prisma.patient.findMany({
          where: patientWhere,
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        }),
        prisma.treatment.findMany({
          where: treatmentWhere,
          orderBy: { treatmentDate: "desc" },
          take: 5,
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]),

      // Weekly treatments (last 7 days)
      prisma.treatment.findMany({
        where: {
          ...treatmentWhere,
          treatmentDate: {
            gte: lastWeekStart,
          },
        },
        select: {
          treatmentDate: true,
        },
      }),

      // All treatments for distribution
      prisma.treatment.findMany({
        where: treatmentWhere,
        select: {
          chiefComplaint: true,
          treatmentPlan: true,
        },
      }),
    ]);

    // Calculate pending amount
    const pendingAmount =
      (totalPendingAmount._sum.cost || 0) -
      (totalPendingAmount._sum.paidAmount || 0);

    // Process treatments by month for chart data
    const monthlyData = treatmentsByMonth.reduce((acc: any, item: any) => {
      const month = new Date(item.treatmentDate).toLocaleString("default", {
        month: "short",
      });
      if (!acc[month]) {
        acc[month] = {
          count: 0,
          revenue: 0,
        };
      }
      acc[month].count += 1;
      acc[month].revenue += item.paidAmount || 0;
      return acc;
    }, {});

    const chartData = Object.entries(monthlyData).map(([month, data]: any) => ({
      month,
      treatments: data.count,
      revenue: data.revenue,
    }));

    // Process weekly visits data (last 7 days)
    const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday
    weeklyTreatments.forEach((treatment: any) => {
      const day = new Date(treatment.treatmentDate).getDay();
      weeklyData[day] = (weeklyData[day] || 0) + 1;
    });

    // Process treatment distribution
    const treatmentCategories: any = {};
    allTreatments.forEach((treatment: any) => {
      const category = treatment.treatmentPlan || treatment.chiefComplaint || "Other";
      treatmentCategories[category] = (treatmentCategories[category] || 0) + 1;
    });

    const totalDistributed = Object.values(treatmentCategories).reduce((sum: number, count: any) => sum + (count as number), 0) as number;
    const treatmentDistribution = Object.entries(treatmentCategories)
      .slice(0, 4)
      .map(([label, count]: any, index) => {
        const colors = [
          "from-sky-400 to-sky-600",
          "from-emerald-400 to-emerald-600",
          "from-slate-400 to-slate-600",
          "from-sky-300 to-emerald-400",
        ];
        return {
          label: label.length > 20 ? label.substring(0, 20) + "..." : label,
          value: Math.round(((count as number) / totalDistributed) * 100),
          color: colors[index] || "from-sky-400 to-sky-600",
        };
      });

    // Build activity feed
    const activityFeedData: any[] = [];
    
    recentActivity[0].forEach((patient: any) => {
      activityFeedData.push({
        type: "PATIENT_REGISTERED",
        title: "New patient registered",
        description: `${patient.firstName} ${patient.lastName} completed onboarding forms.`,
        time: getTimeAgo(patient.createdAt),
      });
    });

    recentActivity[1].forEach((treatment: any) => {
      activityFeedData.push({
        type: "TREATMENT_COMPLETED",
        title: "Treatment completed",
        description: `${treatment.patient.firstName} ${treatment.patient.lastName} - ${treatment.treatmentPlan || treatment.chiefComplaint}.`,
        time: getTimeAgo(treatment.treatmentDate),
      });
    });

    // Sort by time (most recent first) and take last 3
    activityFeedData.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      return NextResponse.json({
        overview: {
          totalPatients,
          totalTreatments,
          totalAppointments,
          totalRevenue: totalRevenue._sum.paidAmount || 0,
          pendingAmount,
          todayAppointments: todayAppointments.length,
        },
        recentPatients,
        upcomingAppointments,
        activityFeed: activityFeedData.slice(0, 3),
        weeklyVisits: weeklyData,
        treatmentDistribution,
        chartData,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.ANALYTICS_READ],
  }
);

