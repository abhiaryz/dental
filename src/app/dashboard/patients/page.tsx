"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, UserPlus, Users, UserCheck, Clock, AlertCircle, TrendingUp, Loader2, Filter } from "lucide-react";
import Link from "next/link";
import { patientsAPI } from "@/lib/api";
import { PatientFilters, PatientFilterState } from "@/components/patient-filters";
import { PatientCardView } from "@/components/patient-card-view";
import { EmptyState } from "@/components/ui/empty-state";

function PatientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<PatientFilterState>({
    gender: searchParams.get("gender") || "all",
    minAge: searchParams.get("minAge") || "",
    maxAge: searchParams.get("maxAge") || "",
    lastVisitFrom: searchParams.get("lastVisitFrom") || "",
    lastVisitTo: searchParams.get("lastVisitTo") || "",
    status: searchParams.get("status") || "all",
  });

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(
    ([, value]) => value !== "" && value !== "all"
  ).length;

  // Update URL with filters
  const updateURL = useCallback((newFilters: PatientFilterState, newSearch: string) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      }
    });
    const queryString = params.toString();
    router.push(`/dashboard/patients${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [router]);

  // Fetch patients
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 10,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (filters.gender && filters.gender !== "all") params.gender = filters.gender;
      if (filters.minAge) params.minAge = filters.minAge;
      if (filters.maxAge) params.maxAge = filters.maxAge;
      if (filters.lastVisitFrom) params.lastVisitFrom = filters.lastVisitFrom;
      if (filters.lastVisitTo) params.lastVisitTo = filters.lastVisitTo;
      if (filters.status && filters.status !== "all") params.status = filters.status;

      const data = await patientsAPI.getAll(params);
      setPatients(data.patients);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filters]);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  const handleFilterChange = (newFilters: PatientFilterState) => {
    setFilters(newFilters);
    updateURL(newFilters, searchTerm);
    setPage(1);
  };

  const handleClearFilters = () => {
    const emptyFilters: PatientFilterState = {
      gender: "all",
      minAge: "",
      maxAge: "",
      lastVisitFrom: "",
      lastVisitTo: "",
      status: "all",
    };
    setFilters(emptyFilters);
    updateURL(emptyFilters, searchTerm);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    updateURL(filters, value);
    setPage(1);
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const age = Math.floor(
      (new Date().getTime() - new Date(dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
    );
    return age;
  };

  const totalPatients = pagination?.total || 0;
  const activePatients = patients.filter(p => p._count?.treatments > 0).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <Users className="size-6 sm:size-8 text-primary shrink-0" />
            <span>Patients</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage and view patient records
          </p>
        </div>
        <Link href="/dashboard/patients/add" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" size="lg">
            <UserPlus className="mr-2 size-4" />
            Add Patient
          </Button>
        </Link>
      </div>

      <div className="relative -mx-4 sm:mx-0">
        <div className="overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
          <div className="grid grid-flow-col auto-cols-[280px] sm:auto-cols-auto sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="size-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalPatients}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-success text-success-foreground gap-1">
                    <TrendingUp className="size-3" />
                    All patients
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-accent hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Patients</CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg">
                  <UserCheck className="size-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activePatients}</div>
                <Badge variant="secondary" className="mt-2">
                  {totalPatients > 0 ? Math.round((activePatients / totalPatients) * 100) : 0}% of total
                </Badge>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New This Week</CardTitle>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock className="size-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">8</div>
                <Badge className="mt-2 bg-blue-500 text-white">This week</Badge>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-destructive hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertCircle className="size-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">5</div>
                <Badge className="mt-2 bg-destructive text-white">Requires Attention</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Patient List</CardTitle>
              <CardDescription className="text-xs sm:text-sm">View and manage all patient records</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 w-full sm:w-auto"
            >
              <Filter className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
          <div className="relative mt-3 sm:mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search patients..." 
              className="pl-10 h-11 text-base"
              style={{ fontSize: '16px' }}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </CardHeader>
        {showFilters && (
          <PatientFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="size-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading patients...</p>
              </div>
            </div>
          ) : patients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No patients found"
              description={
                searchTerm 
                  ? "Try adjusting your search or filters" 
                  : "Get started by adding your first patient"
              }
              action={!searchTerm ? {
                label: "Add First Patient",
                onClick: () => router.push('/dashboard/patients/add'),
                icon: UserPlus
              } : undefined}
            />
          ) : (
            <>
              {/* Mobile: Card view, Desktop: Table view */}
              <div className="sm:hidden">
                <PatientCardView patients={patients} />
              </div>
              
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Patient ID</TableHead>
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap">Age</TableHead>
                      <TableHead className="whitespace-nowrap">Gender</TableHead>
                      <TableHead className="whitespace-nowrap">Mobile</TableHead>
                      <TableHead className="whitespace-nowrap">Treatments</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.id.slice(0, 8)}</TableCell>
                        <TableCell>{patient.firstName} {patient.lastName}</TableCell>
                        <TableCell>{calculateAge(patient.dateOfBirth)}</TableCell>
                        <TableCell className="capitalize">{patient.gender}</TableCell>
                        <TableCell>{patient.mobileNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{patient._count?.treatments || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={patient._count?.treatments > 0 ? "default" : "secondary"}
                            className={patient._count?.treatments > 0 ? "bg-success text-success-foreground" : ""}
                          >
                            {patient._count?.treatments > 0 ? "Active" : "New"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/patients/${patient.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-4 p-4 sm:p-0 border-t sm:border-t-0">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total} patients
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex-1 sm:flex-none min-touch"
                >
                  Previous
                </Button>
                <div className="flex items-center px-3 text-sm font-medium">
                  {page} / {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="flex-1 sm:flex-none min-touch"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <PatientsPageContent />
    </Suspense>
  );
}
