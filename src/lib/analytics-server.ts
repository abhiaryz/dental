import { prisma } from "@/lib/prisma";
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

// Heavy analytics query function - performs database queries
async function fetchAnalyticsData(
  userId: string,
  userRole: Role,
  dateFilter: any = {}
) {
  // Build invoice where clause
  const invoiceWhere: any = { ...dateFilter };

  // Get last week's date
  const lastWeekStart = new Date();
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);

  return await Promise.all([
    // Total patients (0 - removed)
    0,

    // Total invoices
    prisma.invoice.count({
      where: invoiceWhere,
    }),

    // Placeholder for appointments (0)
    0,

    // Total revenue (paid invoices)
    prisma.invoice.aggregate({
      where: {
        ...invoiceWhere,
        status: "PAID",
      },
      _sum: {
        totalAmount: true,
      },
    }),

    // Total pending amount
    prisma.invoice.aggregate({
      where: {
        ...invoiceWhere,
        status: { in: ["PENDING", "DRAFT"] },
      },
      _sum: {
        totalAmount: true,
      },
    }),

    // Recent patients (empty array - removed)
    [],

    // Placeholder for upcoming appointments (empty array)
    [],

    // Invoices by month (last 6 months)
    prisma.invoice.findMany({
      where: {
        ...invoiceWhere,
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
      },
    }),

    // Placeholder for today's appointments (0)
    0,

    // Recent activity (invoices only)
    Promise.all([
      [],
      prisma.invoice.findMany({
        where: invoiceWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
    ]),

    // Weekly invoices (last 7 days)
    prisma.invoice.findMany({
      where: {
        ...invoiceWhere,
        createdAt: {
          gte: lastWeekStart,
        },
      },
      select: {
        createdAt: true,
      },
    }),

    // All invoices for distribution (using invoice items)
    prisma.invoice.findMany({
      where: invoiceWhere,
      select: {
        items: true,
      },
    }),
  ]);
}

export interface DashboardAnalytics {
  overview: {
    totalRevenue: number;
    totalPatients: number;
    pendingAmount?: number;
  };
  activityFeed: {
    type: string;
    title: string;
    description: string;
    time: string;
  }[];
  weeklyVisits: number[];
}

// Server-side function to get dashboard analytics
export async function getDashboardAnalytics(
  userId: string,
  userRole: Role,
  dateFilter: any = {}
): Promise<DashboardAnalytics> {
  // Use Next.js cache for analytics data
  const [
    totalPatients,
    totalInvoices,
    _totalAppointments,
    totalRevenue,
    totalPendingAmount,
    recentPatients,
    _upcomingAppointments,
    _invoicesByMonth,
    _todayAppointments,
    recentActivity,
    weeklyInvoices,
    allInvoices,
  ] = await cacheAnalytics(
    userId,
    dateFilter,
    async () => {
      return await fetchAnalyticsData(
        userId,
        userRole,
        dateFilter
      );
    },
    60 // Cache for 60 seconds
  );

  // Calculate pending amount
  const pendingAmount = totalPendingAmount._sum.totalAmount || 0;

  // Process weekly visits data (last 7 days)
  const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday
  weeklyInvoices.forEach((invoice: any) => {
    const day = new Date(invoice.createdAt).getDay();
    weeklyData[day] = (weeklyData[day] || 0) + 1;
  });

  // Build activity feed with date for sorting
  const activityFeedData: any[] = [];
  
  recentActivity[1].forEach((invoice: any) => {
    activityFeedData.push({
      type: "INVOICE_CREATED",
      title: "Invoice created",
      description: `Invoice #${invoice.invoiceNumber} - ₹${invoice.totalAmount}.`,
      time: getTimeAgo(invoice.createdAt),
      date: new Date(invoice.createdAt),
    });
  });

  // Sort by date (most recent first) and take first 3
  activityFeedData.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Remove date property before returning (only needed for sorting)
  const finalActivityFeed = activityFeedData.slice(0, 3).map(({ date: _date, ...rest }) => rest);

  return {
    overview: {
      totalPatients: 0,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingAmount,
    },
    activityFeed: finalActivityFeed,
    weeklyVisits: weeklyData,
  };
}

