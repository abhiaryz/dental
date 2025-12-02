"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Calendar,
  CalendarPlus,
  HeartPulse,
  IndianRupee,
  MessageSquare,
  PackageSearch,
  Pill,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  UserPlus,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { analyticsAPI } from "@/lib/api";

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
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalytics(true); // Silent refresh (no loading spinner)
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchAnalytics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await analyticsAPI.getOverview();
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const overview = analytics?.overview || {};
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
      accent: "from-sky-500/15 to-sky-500/5"
    },
    {
      title: "Active Patients",
      value: (overview.totalPatients || 0).toString(),
      change: "+12 new",
      changeLabel: "this month",
      icon: Users,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      accent: "from-emerald-500/15 to-emerald-500/5"
    },
    {
      title: "Today's Appointments",
      value: (overview.todayAppointments || 0).toString(),
      change: "3 pending",
      changeLabel: "9 completed",
      icon: Calendar,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
      accent: "from-sky-400/15 to-slate-100"
    },
    {
      title: "Active Treatments",
      value: (overview.totalTreatments || 0).toString(),
      change: "Schedule on track",
      changeLabel: "3 due follow-ups",
      icon: HeartPulse,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      accent: "from-emerald-400/15 to-slate-100"
    }
  ];

  return (
    <main className="space-y-8">
      <section className="rounded-3xl border border-white/70 bg-gradient-to-br from-sky-500/10 via-white to-emerald-300/10 p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-1 text-sm font-medium text-sky-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Morning snapshot
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Welcome back, Dr. Mehra
              </h1>
              <p className="max-w-2xl text-base text-slate-600">
                Your practice is thriving. Review collections, patient touchpoints, and operational tasks from one command center. Everything is synced, compliant, and ready for your next decision.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                100% backups verified overnight
              </span>
              <Separator orientation="vertical" className="hidden h-5 bg-slate-300 sm:block" />
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-sky-600" />
                5 patient messages awaiting follow-up
              </span>
            </div>
            
            {/* Auto-refresh controls */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="gap-2"
              >
                <Activity className={`size-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchAnalytics()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <TrendingUp className="size-4" />
                )}
                <span className="ml-2">Refresh Now</span>
              </Button>
              {lastUpdated && (
                <span className="text-xs text-slate-500">
                  Updated {getTimeAgo(lastUpdated)}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-6 text-sm text-slate-600 shadow-lg">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Focus for today</p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <Badge variant="secondary" className="rounded-full bg-sky-100 text-sky-700">
                  09:30
                </Badge>
                <span>Leadership sync — review weekly production.</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="secondary" className="rounded-full bg-emerald-100 text-emerald-700">
                  13:00
                </Badge>
                <span>Implant planning consult with Dr. Rao.</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="secondary" className="rounded-full bg-sky-100 text-sky-700">
                  16:30
                </Badge>
                <span>Quarterly compliance checklist sign-off.</span>
              </li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                View agenda
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100">
                Share daily brief
              </Button>
            </div>
          </div>
        </div>
      </section>

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
              <Card key={metric.title} className={`border-none bg-gradient-to-br ${metric.accent} p-[1px] shadow-lg`}>
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
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100">
                  Create automation
                </Button>
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
                  activityFeed.map((item: any, index: number) => {
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
                      style={{ height: `${(value / 70) * 100}%` }}
                    />
                    <span className="text-xs font-medium text-slate-500">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
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
