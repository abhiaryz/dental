"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  HeartPulse,
  Users,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
// Simplified analytics interface
interface DashboardAnalytics {
  overview: {
    totalRevenue: number;
    totalPatients: number;
    pendingAmount: number;
  };
  activityFeed: Array<{
    type: string;
    title: string;
    description: string;
    time: string;
  }>;
}

const quickActions = [
  {
    title: "Add patient",
    description: "Create a new patient profile and share intake forms instantly.",
    href: "/dashboard/patients/add",
    icon: UserPlus,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600"
  }
];

interface DashboardContentProps {
  analytics: DashboardAnalytics;
}

export function DashboardContent({ analytics }: DashboardContentProps) {
  const router = useRouter();

  const overview = analytics.overview;
  const activityFeed = analytics.activityFeed;

  const overviewMetrics = [
    {
      title: "Active Patients",
      value: (overview.totalPatients || 0).toString(),
      icon: Users,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      accent: "from-emerald-500/15 to-emerald-500/5",
      href: "/dashboard/patients"
    },
    {
      title: "Total Revenue",
      value: `₹${(overview.totalRevenue || 0).toLocaleString()}`,
      icon: Activity,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
      accent: "from-sky-400/15 to-slate-100",
      href: "/dashboard/finance/invoices"
    }
  ];

  return (
    <main className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Welcome back! Here&apos;s your clinic overview
          </p>
        </div>
        
        <Button 
          size="lg" 
          className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
          onClick={() => router.push('/dashboard/patients/add')}
        >
          <UserPlus className="mr-2 size-4" />
          Add Patient
        </Button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <Link key={metric.title} href={metric.href} className="block h-full">
                <Card 
                  className={cn(
                    "group border-none bg-gradient-to-br p-[1px] shadow-md cursor-pointer h-full",
                    "transition-all duration-300",
                    "hover:shadow-xl hover:-translate-y-1",
                    "active:scale-95",
                    metric.accent
                  )}
                >
                  <div className="rounded-2xl bg-card/95 p-4 sm:p-5 h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground truncate">{metric.title}</p>
                        <p className="text-2xl sm:text-3xl font-semibold text-foreground break-all">{metric.value}</p>
                      </div>
                      <div className={cn(
                        "rounded-xl p-2.5 sm:p-3 shrink-0",
                        "transition-transform group-hover:scale-110",
                        metric.iconBg
                      )}>
                        <metric.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", metric.iconColor)} />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border bg-card/90 shadow-xl overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between p-4 sm:p-6">
                <div>
                  <CardTitle className="text-lg sm:text-xl text-foreground">Smart shortcuts</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Automate routine actions across your practice.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3 p-4 sm:p-6 pt-0">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href} className="group block h-full">
                    <div className="h-full rounded-xl sm:rounded-2xl border border-border bg-card/90 p-3 sm:p-4 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-sky-300 group-hover:shadow-lg active:scale-95">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className={`rounded-lg sm:rounded-xl ${action.iconBg} p-2 sm:p-3 shrink-0 group-hover:scale-110 transition-transform`}>
                          <action.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${action.iconColor}`} />
                        </div>
                        <div className="space-y-1 sm:space-y-2 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-1">{action.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/90 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                  <CardTitle className="text-lg sm:text-xl text-foreground">Today&apos;s activity</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm mt-1">Real-time updates across patients, finances, and operations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 max-h-[400px] overflow-y-auto scrollbar-hide">
                {activityFeed.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm font-medium text-foreground mb-1">No recent activity</p>
                    <p className="text-xs text-muted-foreground">Check back later for updates on patients, appointments, and more.</p>
                  </div>
                ) : (
                  activityFeed.map((item, index) => {
                    const getIconForType = (type: string) => {
                      switch (type) {
                        case "PATIENT_REGISTERED":
                          return { icon: Users, accent: "bg-emerald-100", iconColor: "text-emerald-600" };
                        default:
                          return { icon: Activity, accent: "bg-slate-100", iconColor: "text-muted-foreground" };
                      }
                    };
                    
                    const iconData = getIconForType(item.type);
                    const IconComponent = iconData.icon;
                    
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-2 sm:gap-4 rounded-xl sm:rounded-2xl border border-border bg-card/95 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className={`rounded-lg sm:rounded-xl ${iconData.accent} p-2 sm:p-3 shrink-0`}>
                          <IconComponent className={`h-3 w-3 sm:h-4 sm:w-4 ${iconData.iconColor}`} />
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm text-muted-foreground min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-semibold text-foreground line-clamp-1">{item.title}</p>
                          <p className="line-clamp-2">{item.description}</p>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">{item.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}

