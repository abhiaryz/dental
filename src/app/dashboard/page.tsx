import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardAnalytics } from "@/lib/analytics-server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardHome() {
  // Get session server-side
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const isExternal = (session.user as any).isExternal || false;
  const clinicId = (session.user as any).clinicId || null;

  // Fetch analytics data server-side
  let analytics;
  try {
    analytics = await getDashboardAnalytics(
      userId,
      userRole,
      isExternal,
      clinicId
    );
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    // Return default/empty analytics on error
    analytics = {
      overview: {
        totalRevenue: 0,
        totalPatients: 0,
        todayAppointments: 0,
        totalTreatments: 0,
        pendingAmount: 0,
      },
      activityFeed: [],
      weeklyVisits: [0, 0, 0, 0, 0, 0, 0],
      treatmentDistribution: [],
    };
  }

  return <DashboardContent analytics={analytics} />;
}
