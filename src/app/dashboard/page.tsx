import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getDashboardAnalytics } from "@/lib/analytics-server";

export default async function DashboardHome() {
  // Get session server-side
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Extract user data from session
  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Fetch real analytics data
  const analytics = await getDashboardAnalytics(
    userId,
    userRole
  );

  return <DashboardContent analytics={analytics} />;
}
