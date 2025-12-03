"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2
} from "lucide-react";

interface DashboardData {
  overview: {
    totalClinics: number;
    clinicsByStatus: Record<string, number>;
    totalUsers: number;
    totalMRR: number;
    newSignupsThisMonth: number;
    newSignupsLastMonth: number;
    signupGrowth: number;
    churnRate: number;
    churnedThisMonth: number;
  };
  trends: {
    mrr: Array<{ month: string; value: number }>;
    signups: Array<{ month: string; value: number }>;
  };
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/super-admin/analytics/overview");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setData({
        overview: {
          totalClinics: 0,
          clinicsByStatus: {},
          totalUsers: 0,
          totalMRR: 0,
          newSignupsThisMonth: 0,
          newSignupsLastMonth: 0,
          signupGrowth: 0,
          churnRate: 0,
          churnedThisMonth: 0
        },
        trends: {
          mrr: [],
          signups: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-slate-600">Failed to load dashboard data</div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      TRIAL: "bg-blue-100 text-blue-800",
      ACTIVE: "bg-green-100 text-green-800",
      SUSPENDED: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      EXPIRED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Platform overview and key metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
            <Building2 className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalClinics}</div>
            <p className="text-xs text-slate-600">
              {data.overview.newSignupsThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUsers}</div>
            <p className="text-xs text-slate-600">
              Across all clinics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.overview.totalMRR)}</div>
            <p className="text-xs text-slate-600">
              MRR from active clinics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signup Growth</CardTitle>
            {data.overview.signupGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.overview.signupGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(data.overview.signupGrowth)}
            </div>
            <p className="text-xs text-slate-600">
              vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clinic Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clinic Status</CardTitle>
            <CardDescription>Distribution by subscription status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.overview.clinicsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(status)}`}>
                      {status}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Churn Metrics</CardTitle>
            <CardDescription>Customer retention analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Churn Rate</span>
                  <span className="text-2xl font-bold text-red-600">
                    {data.overview.churnRate.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {data.overview.churnedThisMonth} clinics cancelled this month
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Active Clinics</span>
                  <span className="text-lg font-semibold">{data.overview.totalClinics}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly Recurring Revenue over last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.trends.mrr.slice(-6).map((item) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.month}</span>
                <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signup Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Signup Trend</CardTitle>
          <CardDescription>New clinic signups over last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.trends.signups.slice(-6).map((item) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.month}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-blue-200" style={{ width: `${Math.max(item.value * 20, 20)}px` }}></div>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

