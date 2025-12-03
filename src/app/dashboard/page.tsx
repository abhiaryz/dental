"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  UserPlus,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { analyticsAPI } from "@/lib/api";

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
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
    <main className="space-y-8">
     

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start gap-2 rounded-2xl bg-white/80 p-2 shadow">
          <TabsTrigger
            value="overview"
            className="gap-2 rounded-xl px-4 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            <Activity className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger
            value="quick-stats"
            className="gap-2 rounded-xl px-4 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            <TrendingUp className="h-4 w-4" /> Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <Card 
                key={metric.title} 
                className={`border-none bg-gradient-to-br ${metric.accent} p-[1px] shadow-lg cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1`}
                onClick={() => router.push(metric.href)}
              >
                <div className="rounded-2xl bg-white/95 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{metric.title}</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                    </div>
                    <div className={`rounded-xl ${metric.iconBg} p-3`}>
                      <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                    <Badge className="rounded-full bg-emerald-100 text-emerald-700">{metric.change}</Badge>
                    <span>{metric.changeLabel}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-slate-200 bg-white/90 shadow-xl">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl text-slate-900">Smart shortcuts</CardTitle>
                  <CardDescription>Automate routine actions across your practice.</CardDescription>
                </div>
               
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href} className="group block h-full">
                    <div className="h-full rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition group-hover:-translate-y-1 group-hover:border-sky-300 group-hover:shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-xl ${action.iconBg} p-3`}>
                          <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-base font-semibold text-slate-900">{action.title}</h3>
                          <p className="text-sm text-slate-600">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-xl text-slate-900">Today&apos;s activity</CardTitle>
                </div>
                <CardDescription>Real-time updates across patients, finances, and operations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activityFeed.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">No recent activity</p>
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
                        className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm"
                      >
                        <div className={`rounded-xl ${iconData.accent} p-3`}>
                          <IconComponent className={`h-4 w-4 ${iconData.iconColor}`} />
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                          <p className="text-base font-semibold text-slate-900">{item.title}</p>
                          <p>{item.description}</p>
                          <span className="text-xs text-slate-500">{item.time}</span>
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
