"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Eye, 
  Ban, 
  CheckCircle, 
  UserCog,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  clinicCode: string;
  type: string;
  ownerName: string;
  ownerEmail: string;
  subscriptionStatus: string;
  mrr: number;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  patientCount: number;
}

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchClinics();
  }, [search, statusFilter, page]);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/super-admin/clinics?${params}`);
      const data = await response.json();
      
      setClinics(data.clinics);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch clinics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (clinicId: string) => {
    if (!confirm("Are you sure you want to suspend this clinic?")) return;

    try {
      const response = await fetch(`/api/super-admin/clinics/${clinicId}/suspend`, {
        method: "POST",
      });

      if (response.ok) {
        fetchClinics();
      }
    } catch (error) {
      console.error("Failed to suspend clinic:", error);
    }
  };

  const handleActivate = async (clinicId: string) => {
    try {
      const response = await fetch(`/api/super-admin/clinics/${clinicId}/activate`, {
        method: "POST",
      });

      if (response.ok) {
        fetchClinics();
      }
    } catch (error) {
      console.error("Failed to activate clinic:", error);
    }
  };

  const handleImpersonate = async (clinicId: string) => {
    if (!confirm("Are you sure you want to impersonate this clinic admin?")) return;

    try {
      const response = await fetch(`/api/super-admin/clinics/${clinicId}/impersonate`, {
        method: "POST",
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store impersonation token and redirect
        localStorage.setItem("impersonation_token", data.impersonationToken);
        window.open("/dashboard", "_blank");
      }
    } catch (error) {
      console.error("Failed to impersonate:", error);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">Inactive</span>;
    }

    const colors: Record<string, string> = {
      TRIAL: "bg-blue-100 text-blue-800",
      ACTIVE: "bg-green-100 text-green-800",
      SUSPENDED: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      EXPIRED: "bg-gray-100 text-gray-800",
    };

    const color = colors[status] || "bg-gray-100 text-gray-800";
    return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${color}`}>{status}</span>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Clinics</h1>
        <p className="text-slate-600">Manage all clinics on the platform</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, code, or owner..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="TRIAL">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Showing {clinics.length} of {total} clinics
          </div>
        </CardContent>
      </Card>

      {/* Clinics Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clinics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
            </div>
          ) : clinics.length === 0 ? (
            <div className="py-12 text-center text-slate-600">No clinics found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Clinic</th>
                    <th className="px-4 py-3 text-left font-medium">Owner</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Users</th>
                    <th className="px-4 py-3 text-left font-medium">Patients</th>
                    <th className="px-4 py-3 text-left font-medium">MRR</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {clinics.map((clinic) => (
                    <tr key={clinic.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{clinic.name}</div>
                          <div className="text-xs text-slate-500">{clinic.clinicCode}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{clinic.ownerName}</div>
                          <div className="text-xs text-slate-500">{clinic.ownerEmail}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(clinic.subscriptionStatus, clinic.isActive)}
                      </td>
                      <td className="px-4 py-3">{clinic.userCount}</td>
                      <td className="px-4 py-3">{clinic.patientCount}</td>
                      <td className="px-4 py-3">{formatCurrency(clinic.mrr)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(clinic.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link href={`/super-admin/clinics/${clinic.id}`}>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {clinic.isActive ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSuspend(clinic.id)}
                            >
                              <Ban className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleActivate(clinic.id)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleImpersonate(clinic.id)}
                          >
                            <UserCog className="h-4 w-4 text-blue-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

