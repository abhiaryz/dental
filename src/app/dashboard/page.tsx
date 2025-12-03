"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonMetrics } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Activity,
  Calendar,
  CalendarPlus,
  HeartPulse,
  IndianRupee,
  PackageSearch,
  Pill,
  TrendingUp,
  Users,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { analyticsAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DashboardAnalytics {
  overview: {
    totalRevenue: number;
    totalPatients: number;
    todayAppointments: number;
    totalTreatments: number;
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

const quickActions = [
  {
    title: "Add patient",
    description: "Create a new patient profile and share intake forms instantly.",
    href: "/dashboard/patients/add",
    icon: UserPlus,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600"
  },
  {
    title: "Schedule visit",
    description: "Fill chair-time gaps with smart scheduling suggestions.",
    href: "/dashboard/appointments",
    icon: CalendarPlus,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600"
  },
  {
    title: "Inventory audit",
    description: "Review stock alerts, expiries, and procurement tasks.",
    href: "/dashboard/inventory",
    icon: Pill,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600"
  }
];

export default function DashboardHome() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await analyticsAPI.getOverview();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <SkeletonMetrics />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {
    totalRevenue: 0,
    totalPatients: 0,
    todayAppointments: 0,
    totalTreatments: 0,
    pendingAmount: 0
  };
  const activityFeed = analytics?.activityFeed || [];
  const weeklyData = analytics?.weeklyVisits || [0, 0, 0, 0, 0, 0, 0];
  const treatmentDistribution = analytics?.treatmentDistribution || [];

  const overviewMetrics = [
    {
      title: "Collections",
      value: `₹${(overview.totalRevenue || 0).toLocaleString()}`,
      change: "+12.5%",
      changeLabel: "vs last month",
      icon: IndianRupee,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
      accent: "from-sky-500/15 to-sky-500/5",
      href: "/dashboard/finance?status=paid"
    },
    {
      title: "Active Patients",
      value: (overview.totalPatients || 0).toString(),
      change: "+12 new",
      changeLabel: "this month",
      icon: Users,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      accent: "from-emerald-500/15 to-emerald-500/5",
      href: "/dashboard/patients"
    },
    {
      title: "Today's Appointments",
      value: (overview.todayAppointments || 0).toString(),
      change: "3 pending",
      changeLabel: "9 completed",
      icon: Calendar,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
      accent: "from-sky-400/15 to-slate-100",
      href: "/dashboard/appointments?date=today"
    },
    {
      title: "Active Treatments",
      value: (overview.totalTreatments || 0).toString(),
      change: "Schedule on track",
      changeLabel: "3 due follow-ups",
      icon: HeartPulse,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      accent: "from-emerald-400/15 to-slate-100",
      href: "/dashboard/patients"
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

      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <div className="relative -mx-4 sm:mx-0">
          <div className="overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
            <TabsList className="inline-flex sm:w-full justify-start gap-2 rounded-2xl bg-white/80 p-2 shadow-md min-w-max">
              <TabsTrigger
                value="overview"
                className="gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm sm:text-base data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
              >
                <Activity className="h-4 w-4 shrink-0" /> 
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="quick-stats"
                className="gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm sm:text-base data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
              >
                <TrendingUp className="h-4 w-4 shrink-0" /> 
                <span>Performance</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <Card 
                key={metric.title} 
                className={cn(
                  "group border-none bg-gradient-to-br p-[1px] shadow-md cursor-pointer",
                  "transition-all duration-300",
                  "hover:shadow-xl hover:-translate-y-1",
                  "active:scale-95",
                  metric.accent
                )}
                onClick={() => router.push(metric.href)}
              >
                <div className="rounded-2xl bg-white/95 p-4 sm:p-5 h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] text-slate-500 truncate">{metric.title}</p>
                      <p className="text-2xl sm:text-3xl font-semibold text-slate-900 break-all">{metric.value}</p>
                    </div>
                    <div className={cn(
                      "rounded-xl p-2.5 sm:p-3 shrink-0",
                      "transition-transform group-hover:scale-110",
                      metric.iconBg
                    )}>
                      <metric.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", metric.iconColor)} />
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <Badge className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs">{metric.change}</Badge>
                    <span className="text-slate-600 text-[10px] sm:text-xs truncate">{metric.changeLabel}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-slate-200 bg-white/90 shadow-xl overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between p-4 sm:p-6">
                <div>
                  <CardTitle className="text-lg sm:text-xl text-slate-900">Smart shortcuts</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Automate routine actions across your practice.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3 p-4 sm:p-6 pt-0">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href} className="group block h-full">
                    <div className="h-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-sky-300 group-hover:shadow-lg active:scale-95">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className={`rounded-lg sm:rounded-xl ${action.iconBg} p-2 sm:p-3 shrink-0 group-hover:scale-110 transition-transform`}>
                          <action.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${action.iconColor}`} />
                        </div>
                        <div className="space-y-1 sm:space-y-2 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-1">{action.title}</h3>
                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90 shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                  <CardTitle className="text-lg sm:text-xl text-slate-900">Today&apos;s activity</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm mt-1">Real-time updates across patients, finances, and operations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 max-h-[400px] overflow-y-auto scrollbar-hide">
                {activityFeed.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No recent activity"
                    description="Check back later for updates on patients, appointments, and more."
                  />
                ) : (
                  activityFeed.map((item, index) => {
                    const getIconForType = (type: string) => {
                      switch (type) {
                        case "PATIENT_REGISTERED":
                          return { icon: Users, accent: "bg-emerald-100", iconColor: "text-emerald-600" };
                        case "TREATMENT_COMPLETED":
                          return { icon: Calendar, accent: "bg-sky-100", iconColor: "text-sky-600" };
                        case "INVOICE_PAID":
                          return { icon: PackageSearch, accent: "bg-emerald-100", iconColor: "text-emerald-600" };
                        default:
                          return { icon: Activity, accent: "bg-slate-100", iconColor: "text-slate-600" };
                      }
                    };
                    
                    const iconData = getIconForType(item.type);
                    const IconComponent = iconData.icon;
                    
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-2 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-white/95 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className={`rounded-lg sm:rounded-xl ${iconData.accent} p-2 sm:p-3 shrink-0`}>
                          <IconComponent className={`h-3 w-3 sm:h-4 sm:w-4 ${iconData.iconColor}`} />
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm text-slate-600 min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                          <p className="line-clamp-2">{item.description}</p>
                          <span className="text-[10px] sm:text-xs text-slate-500">{item.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quick-stats" className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white/90 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-xl text-slate-900">Weekly production</CardTitle>
              </div>
              <CardDescription>Patient visits over the last seven days.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-52 items-end justify-between gap-3">
                {weeklyData.map((value, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-2xl bg-gradient-to-t from-sky-400 to-emerald-400"
                      style={{ height: `${Math.min((value / 20) * 100, 100)}%` }}
                    />
                    <span className="text-xs font-medium text-slate-500">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-xl text-slate-900">Treatment mix</CardTitle>
              </div>
              <CardDescription>Share of treatment categories for the current month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {treatmentDistribution.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
