import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getPatientWhereClause } from "@/lib/auth-middleware";
import { Role } from "@prisma/client";
import { cacheAnalytics } from "@/lib/query-cache";

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

// Heavy analytics query function - performs all 12 parallel database queries
async function fetchAnalyticsData(
  userId: string,
  userRole: Role,
  isExternal: boolean,
  clinicId: string | null | undefined,
  dateFilter: any = {}
) {
  // Build patient where clause for clinic-based queries
  const patientWhere = getPatientWhereClause(
    userId,
    userRole,
    isExternal,
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

  return await Promise.all([
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
}

export interface DashboardAnalytics {
  overview: {
    totalRevenue: number;
    totalPatients: number;
    todayAppointments: number;
    totalTreatments: number;
    pendingAmount?: number;
  };
  activityFeed: {
    type: string;
    title: string;
    description: string;
    time: string;
  }[];
  weeklyVisits: number[];
  treatmentDistribution: {
    label: string;
    value: number;
    color: string;
  }[];
}

// Server-side function to get dashboard analytics
export async function getDashboardAnalytics(
  userId: string,
  userRole: Role,
  isExternal: boolean,
  clinicId: string | null | undefined,
  dateFilter: any = {}
): Promise<DashboardAnalytics> {
  // Use Redis caching with Next.js cache fallback
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
  ] = await cacheAnalytics(
    userId,
    clinicId,
    dateFilter,
    async () => {
      return await fetchAnalyticsData(
        userId,
        userRole,
        isExternal,
        clinicId,
        dateFilter
      );
    },
    60 // Cache for 60 seconds
  );

  // Calculate pending amount
  const pendingAmount =
    (totalPendingAmount._sum.cost || 0) -
    (totalPendingAmount._sum.paidAmount || 0);

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

  const totalDistributed = Object.values(treatmentCategories).reduce(
    (sum: number, count: any) => sum + (count as number),
    0
  ) as number;
  
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

  // Build activity feed with date for sorting
  const activityFeedData: any[] = [];
  
  recentActivity[0].forEach((patient: any) => {
    activityFeedData.push({
      type: "PATIENT_REGISTERED",
      title: "New patient registered",
      description: `${patient.firstName} ${patient.lastName} completed onboarding forms.`,
      time: getTimeAgo(patient.createdAt),
      date: new Date(patient.createdAt),
    });
  });

  recentActivity[1].forEach((treatment: any) => {
    activityFeedData.push({
      type: "TREATMENT_COMPLETED",
      title: "Treatment completed",
      description: `${treatment.patient.firstName} ${treatment.patient.lastName} - ${treatment.treatmentPlan || treatment.chiefComplaint}.`,
      time: getTimeAgo(treatment.treatmentDate),
      date: new Date(treatment.treatmentDate),
    });
  });

  // Sort by date (most recent first) and take first 3
  activityFeedData.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Remove date property before returning (only needed for sorting)
  const finalActivityFeed = activityFeedData.slice(0, 3).map(({ date, ...rest }) => rest);

  return {
    overview: {
      totalPatients,
      totalTreatments,
      totalRevenue: totalRevenue._sum.paidAmount || 0,
      pendingAmount,
      todayAppointments: todayAppointments.length,
    },
    activityFeed: finalActivityFeed,
    weeklyVisits: weeklyData,
    treatmentDistribution,
  };
}

