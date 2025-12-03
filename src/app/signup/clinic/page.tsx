"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Stethoscope, Loader2, AlertCircle, CheckCircle2, Building2, ArrowLeft } from "lucide-react";

export default function ClinicSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    clinicName: "",
    clinicType: "CLINIC",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    ownerName: "",
    ownerEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clinicCode, setClinicCode] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/clinic/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setClinicCode(data.clinicCode);
        setSuccess(true);
        // Redirect after showing clinic code
        setTimeout(() => {
          router.push(`/login/${data.clinicCode}`);
        }, 5000);
      } else {
        setError(data.error || "Failed to create clinic");
      }
    } catch (error) {
      console.error("Error creating clinic:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success && clinicCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Clinic Created Successfully!</CardTitle>
            <CardDescription>Save your clinic code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-primary/10 rounded-lg text-center border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Your Clinic Code</p>
              <p className="text-3xl font-bold font-mono text-primary tracking-wider">{clinicCode}</p>
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="size-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Important:</strong> Save this code! Your employees will need it to login.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Clinic account created</p>
              <p>✓ Admin account setup complete</p>
              <p>✓ You can now add employees</p>
            </div>
            <Button 
              onClick={() => router.push(`/login/${clinicCode}`)}
              className="w-full"
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/login/clinic-select")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Login
        </button>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-6">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
                <Building2 className="size-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Setup Your Clinic</CardTitle>
            <CardDescription className="text-base">
              Create your clinic account and get started
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Clinic Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 pb-2 border-b">
                  <Building2 className="size-5" />
                  Clinic Information
                </h2>
                
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name *</Label>
                  <Input
                    id="clinicName"
                    placeholder="e.g., Smile Dental Clinic"
                    value={formData.clinicName}
                    onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicType">Clinic Type *</Label>
                  <Select
                    value={formData.clinicType}
                    onValueChange={(value) => setFormData({...formData, clinicType: value})}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL_PRACTICE">Individual Practice</SelectItem>
                      <SelectItem value="CLINIC">Clinic</SelectItem>
                      <SelectItem value="MULTI_LOCATION_CLINIC">Multi-Location Clinic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Clinic Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="clinic@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Owner/Admin Information */}
              <div className="space-y-4 pt-4 border-t">
                <h2 className="text-xl font-semibold flex items-center gap-2 pb-2">
                  <Stethoscope className="size-5" />
                  Admin Account
                </h2>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Your Name *</Label>
                  <Input
                    id="ownerName"
                    placeholder="Dr. John Doe"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Your Email *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Creating Clinic...
                  </>
                ) : (
                  "Create Clinic"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login/clinic-select" className="text-primary hover:underline font-semibold">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

