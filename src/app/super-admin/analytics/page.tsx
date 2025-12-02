"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, Activity, FileText } from "lucide-react";

interface AnalyticsData {
  revenue: {
    totalMRR: number;
    arr: number;
    avgMRR: number;
    activeClinics: number;
    mrrByType: Array<{ type: string; mrr: number; count: number }>;
    topClinics: Array<{
      id: string;
      name: string;
      clinicCode: string;
      mrr: number;
      subscriptionStartDate: string | null;
    }>;
  };
  users: {
    total: number;
    activeUsers30d: number;
    activeUsers7d: number;
    newUsersThisMonth: number;
    avgUsersPerClinic: number;
    usersByRole: Array<{ role: string; count: number }>;
    growthTrend: Array<{ month: string; value: number }>;
  };
  engagement: {
    patients: {
      total: number;
      thisMonth: number;
      avgPerClinic: number;
      trend: Array<{ month: string; value: number }>;
    };
    appointments: {
      total: number;
      thisMonth: number;
    };
    treatments: {
      total: number;
      thisMonth: number;
    };
    invoices: {
      total: number;
      thisMonth: number;
      valueThisMonth: number;
    };
    featureAdoption: {
      dentalCharts: { clinics: number; percentage: number };
      treatmentTemplates: { clinics: number; percentage: number };
      patientPortal: { patients: number; percentage: number };
    };
  };
}

export default function AnalyticsPage() {
  const [revenueData, setRevenueData] = useState<AnalyticsData["revenue"] | null>(null);
  const [userData, setUserData] = useState<AnalyticsData["users"] | null>(null);
  const [engagementData, setEngagementData] = useState<AnalyticsData["engagement"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [revenueRes, usersRes, engagementRes] = await Promise.all([
        fetch("/api/super-admin/analytics/revenue"),
        fetch("/api/super-admin/analytics/users"),
        fetch("/api/super-admin/analytics/engagement"),
      ]);

      const revenue = await revenueRes.json();
      const users = await usersRes.json();
      const engagement = await engagementRes.json();

      setRevenueData(revenue.revenue);
      setUserData(users.users);
      setEngagementData(engagement.engagement);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-600">Platform metrics and insights</p>
      </div>

      {/* Revenue Analytics */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Revenue Analytics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData?.totalMRR || 0)}</div>
              <p className="text-xs text-slate-600">
                {revenueData?.activeClinics || 0} active clinics
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARR</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData?.arr || 0)}</div>
              <p className="text-xs text-slate-600">
                Annual recurring revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg MRR</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData?.avgMRR || 0)}</div>
              <p className="text-xs text-slate-600">
                Per active clinic
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clinics</CardTitle>
              <Activity className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenueData?.activeClinics || 0}</div>
              <p className="text-xs text-slate-600">
                Paying customers
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Clinic Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {revenueData?.mrrByType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{item.type.replace(/_/g, " ")}</span>
                      <span className="ml-2 text-sm text-slate-500">({item.count} clinics)</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.mrr)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Clinics by MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {revenueData?.topClinics.slice(0, 5).map((clinic, index) => (
                  <div key={clinic.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{index + 1}. {clinic.name}</span>
                      <span className="ml-2 text-xs text-slate-500">{clinic.clinicCode}</span>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(clinic.mrr)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Analytics */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">User Analytics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData?.total || 0}</div>
              <p className="text-xs text-slate-600">
                Across all clinics
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active (30d)</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData?.activeUsers30d || 0}</div>
              <p className="text-xs text-slate-600">
                Logged in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active (7d)</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData?.activeUsers7d || 0}</div>
              <p className="text-xs text-slate-600">
                Logged in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData?.newUsersThisMonth || 0}</div>
              <p className="text-xs text-slate-600">
                Avg {userData?.avgUsersPerClinic.toFixed(1) || 0} per clinic
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-5">
                {userData?.usersByRole.map((item) => (
                  <div key={item.role} className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-sm text-slate-600">{item.role}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Engagement Analytics */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Engagement Analytics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{engagementData?.patients.total || 0}</div>
              <p className="text-xs text-slate-600">
                {engagementData?.patients.thisMonth || 0} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              <Activity className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{engagementData?.appointments.total || 0}</div>
              <p className="text-xs text-slate-600">
                {engagementData?.appointments.thisMonth || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treatments</CardTitle>
              <Activity className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{engagementData?.treatments.total || 0}</div>
              <p className="text-xs text-slate-600">
                {engagementData?.treatments.thisMonth || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoices</CardTitle>
              <FileText className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{engagementData?.invoices.total || 0}</div>
              <p className="text-xs text-slate-600">
                {formatCurrency(engagementData?.invoices.valueThisMonth || 0)} this month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Adoption</CardTitle>
              <CardDescription>Percentage of clinics/patients using key features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Dental Charts</span>
                    <span className="text-sm text-slate-600">
                      {engagementData?.featureAdoption.dentalCharts.clinics || 0} clinics ({engagementData?.featureAdoption.dentalCharts.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${engagementData?.featureAdoption.dentalCharts.percentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Treatment Templates</span>
                    <span className="text-sm text-slate-600">
                      {engagementData?.featureAdoption.treatmentTemplates.clinics || 0} clinics ({engagementData?.featureAdoption.treatmentTemplates.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-green-600"
                      style={{ width: `${engagementData?.featureAdoption.treatmentTemplates.percentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Patient Portal</span>
                    <span className="text-sm text-slate-600">
                      {engagementData?.featureAdoption.patientPortal.patients || 0} patients ({engagementData?.featureAdoption.patientPortal.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-purple-600"
                      style={{ width: `${engagementData?.featureAdoption.patientPortal.percentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

