"use client";

import { useState, useEffect } from "react";
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
import { Search, UserPlus, Users, UserCheck, Clock, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { patientsAPI } from "@/lib/api";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // Fetch patients
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientsAPI.getAll({
        page,
        limit: 10,
        search: searchTerm || undefined,
      });
      setPatients(data.patients);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, searchTerm]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="size-8 text-primary" />
            Patients
          </h1>
          <p className="text-muted-foreground">Manage and view patient records</p>
        </div>
        <Link href="/dashboard/patients/add">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
            <UserPlus className="mr-2 size-4" />
            Add Patient
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
          <CardDescription>View and manage all patient records</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search patients..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No patients found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Treatments</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
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
          )}
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total} patients
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
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

