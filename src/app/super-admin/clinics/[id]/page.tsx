"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Loader2, 
  Ban, 
  CheckCircle,
  Users,
  Building2,
  Mail,
  Calendar,
  DollarSign,
  Activity
} from "lucide-react";
import Link from "next/link";

interface Clinic {
  id: string;
  name: string;
  clinicCode: string;
  type: string;
  email: string;
  ownerName: string;
  ownerEmail: string;
  subscriptionStatus: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  billingEmail: string | null;
  mrr: number;
  lastPaymentDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    lastLoginAt: string | null;
  }>;
  patientCount: number;
  userCount: number;
  invoiceCount: number;
  inventoryCount: number;
}

export default function ClinicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Form state
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [mrr, setMrr] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

  useEffect(() => {
    fetchClinicDetails();
  }, [resolvedParams.id]);

  const fetchClinicDetails = async () => {
    try {
      const response = await fetch(`/api/super-admin/clinics/${resolvedParams.id}`);
      
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
         throw new Error("Empty response received");
      }

      const data = JSON.parse(text);
      
      if (data.clinic) {
        setClinic(data.clinic);
        setSubscriptionStatus(data.clinic.subscriptionStatus || "ACTIVE");
        setMrr((data.clinic.mrr || 0).toString());
        setBillingEmail(data.clinic.billingEmail || "");
      } else {
         throw new Error(data.error || "Failed to load clinic data");
      }
    } catch (error) {
      console.error("Failed to fetch clinic details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!clinic) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/super-admin/clinics/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionStatus,
          mrr: parseFloat(mrr),
          billingEmail: billingEmail || null,
        }),
      });

      if (response.ok) {
        alert("Clinic updated successfully");
        fetchClinicDetails();
      }
    } catch (error) {
      console.error("Failed to update clinic:", error);
      alert("Failed to update clinic");
    } finally {
      setUpdating(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm("Are you sure you want to suspend this clinic?")) return;

    try {
      const response = await fetch(`/api/super-admin/clinics/${resolvedParams.id}/suspend`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Clinic suspended successfully");
        fetchClinicDetails();
      }
    } catch (error) {
      console.error("Failed to suspend clinic:", error);
    }
  };

  const handleActivate = async () => {
    try {
      const response = await fetch(`/api/super-admin/clinics/${resolvedParams.id}/activate`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Clinic activated successfully");
        fetchClinicDetails();
      }
    } catch (error) {
      console.error("Failed to activate clinic:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="text-center">
        <p className="text-slate-600">Clinic not found</p>
        <Link href="/super-admin/clinics">
          <Button className="mt-4">Back to Clinics</Button>
        </Link>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">Inactive</span>;
    }

    const colors: Record<string, string> = {
      TRIAL: "bg-blue-100 text-blue-800",
      ACTIVE: "bg-green-100 text-green-800",
      SUSPENDED: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      EXPIRED: "bg-gray-100 text-gray-800",
    };

    const color = colors[status] || "bg-gray-100 text-gray-800";
    return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${color}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/clinics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{clinic.name}</h1>
            <p className="text-slate-600">{clinic.clinicCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {clinic.isActive ? (
            <Button variant="destructive" onClick={handleSuspend}>
              <Ban className="h-4 w-4 mr-2" />
              Suspend Clinic
            </Button>
          ) : (
            <Button variant="default" onClick={handleActivate}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate Clinic
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <div className="mt-2">{getStatusBadge(clinic.subscriptionStatus, clinic.isActive)}</div>
              </div>
              <Activity className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Users</p>
                <p className="text-2xl font-bold">{clinic.userCount}</p>
              </div>
              <Users className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Patients</p>
                <p className="text-2xl font-bold">{clinic.patientCount}</p>
              </div>
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">MRR</p>
                <p className="text-2xl font-bold">{formatCurrency(clinic.mrr)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clinic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Clinic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-slate-600">Owner</Label>
              <p className="font-medium">{clinic.ownerName}</p>
              <p className="text-sm text-slate-500">{clinic.ownerEmail}</p>
            </div>
            <div>
              <Label className="text-sm text-slate-600">Contact Email</Label>
              <p className="font-medium">{clinic.email}</p>
            </div>
            <div>
              <Label className="text-sm text-slate-600">Clinic Type</Label>
              <p className="font-medium">{clinic.type.replace(/_/g, " ")}</p>
            </div>
            <div>
              <Label className="text-sm text-slate-600">Created</Label>
              <p className="font-medium">{formatDate(clinic.createdAt)}</p>
            </div>
            <div>
              <Label className="text-sm text-slate-600">Last Payment</Label>
              <p className="font-medium">{formatDate(clinic.lastPaymentDate)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Update Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Update Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Subscription Status</Label>
              <select
                id="status"
                value={subscriptionStatus}
                onChange={(e) => setSubscriptionStatus(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="TRIAL">Trial</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <div>
              <Label htmlFor="mrr">Monthly Revenue (MRR)</Label>
              <Input
                id="mrr"
                type="number"
                value={mrr}
                onChange={(e) => setMrr(e.target.value)}
                placeholder="2999"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="billingEmail">Billing Email</Label>
              <Input
                id="billingEmail"
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="billing@clinic.com"
                className="mt-1"
              />
            </div>
            <Button onClick={handleUpdate} disabled={updating} className="w-full">
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Subscription"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({clinic.users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clinic.users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

