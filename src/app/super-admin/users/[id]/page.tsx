"use client";

import { useCallback, useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Loader2, 
  Save,
  User
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  clinicId: string;
  clinic: {
    id: string;
    name: string;
    clinicCode: string;
  } | null;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    role: "",
    password: "",
    clinicId: "", // Add clinicId to form data
  });
  const [clinics, setClinics] = useState<{ id: string; name: string; clinicCode: string }[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);

  const fetchClinics = useCallback(async () => {
    setLoadingClinics(true);
    try {
      // Fetch minimal clinic data for dropdown
      const response = await fetch("/api/super-admin/clinics?limit=1000"); // Assuming this returns all or enough clinics
      if (!response.ok) throw new Error("Failed to fetch clinics");
      const data = await response.json();
      setClinics(data.clinics || []);
    } catch (error) {
      console.error("Failed to fetch clinics:", error);
    } finally {
      setLoadingClinics(false);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/super-admin/users/${resolvedParams.id}`);
      
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          username: data.user.username || "",
          role: data.user.role || "",
          password: "",
          clinicId: data.user.clinicId || "",
        });
      } else {
         throw new Error(data.error || "Failed to load user data");
      }
    } catch (error: any) {
      console.error("Failed to fetch user:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchUser();
    fetchClinics();
  }, [fetchUser, fetchClinics]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    
    try {
      const response = await fetch(`/api/super-admin/users/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("User updated successfully");
        fetchUser();
      } else {
        setError(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      setError("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-slate-600">{error || "User not found"}</p>
        <Link href="/super-admin/users">
          <Button className="mt-4">Back to Users</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit User</h1>
            <p className="text-slate-600">{user.name}</p>
          </div>
        </div>
      </div>

      {user.clinic && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full border border-slate-200">
                <User className="h-6 w-6 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Clinic Information</p>
                <p className="text-sm text-slate-600">{user.clinic.name} ({user.clinic.clinicCode})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ADMIN">Clinic Admin</option>
                <option value="CLINIC_DOCTOR">Doctor</option>
                <option value="HYGIENIST">Hygienist</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="EXTERNAL_DOCTOR">External Doctor</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinic">Assign Clinic</Label>
              <select
                id="clinic"
                value={formData.clinicId}
                onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loadingClinics}
              >
                <option value="">Select Clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} ({clinic.clinicCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password">New Password (leave blank to keep current)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

