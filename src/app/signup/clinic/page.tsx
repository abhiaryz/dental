"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, Building2, Mail, User, Lock, Phone, MapPin } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { Label } from "@/components/ui/label";

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
      <AuthLayout variant="split">
        <Card className="shadow-2xl border-2 border-green-200">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="size-10 text-green-600" />
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
              <p>✓ Admin user setup complete</p>
              <p>✓ Verification email sent to {formData.ownerEmail}</p>
            </div>
            <Button onClick={() => router.push(`/login/${clinicCode}`)} className="w-full h-12">
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="split" showBackButton backHref="/signup" backLabel="Back to signup options">
      <AuthCard
        title="Create Clinic Account"
        description="Setup your dental clinic or practice"
        icon={<Building2 className="size-8 text-primary" />}
        footerContent={
          <div className="text-sm text-center">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline font-semibold transition-colors">
              Sign in instead
            </Link>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Clinic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Clinic Information</h3>
            
            <AuthInput
              id="clinicName"
              label="Clinic Name"
              type="text"
              icon={<Building2 className="size-4" />}
              placeholder="Smith Dental Clinic"
              value={formData.clinicName}
              onChange={(val) => setFormData({ ...formData, clinicName: val })}
              required
              disabled={isLoading}
            />

            <div className="space-y-2">
              <Label htmlFor="clinicType" className="text-sm font-medium flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Clinic Type
              </Label>
              <Select
                value={formData.clinicType}
                onValueChange={(val) => setFormData({ ...formData, clinicType: val })}
              >
                <SelectTrigger id="clinicType" className="h-12 border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLINIC">Dental Clinic</SelectItem>
                  <SelectItem value="HOSPITAL">Hospital</SelectItem>
                  <SelectItem value="PRIVATE_PRACTICE">Private Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <AuthInput
              id="email"
              label="Clinic Email"
              type="email"
              icon={<Mail className="size-4" />}
              placeholder="contact@clinic.com"
              value={formData.email}
              onChange={(val) => setFormData({ ...formData, email: val })}
              required
              disabled={isLoading}
            />

            <AuthInput
              id="phone"
              label="Clinic Phone"
              type="tel"
              icon={<Phone className="size-4" />}
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
              required
              disabled={isLoading}
            />

            <AuthInput
              id="address"
              label="Address"
              type="text"
              icon={<MapPin className="size-4" />}
              placeholder="123 Main Street"
              value={formData.address}
              onChange={(val) => setFormData({ ...formData, address: val })}
              required
              disabled={isLoading}
            />

            <div className="grid grid-cols-2 gap-4">
              <AuthInput
                id="city"
                label="City"
                type="text"
                placeholder="New York"
                value={formData.city}
                onChange={(val) => setFormData({ ...formData, city: val })}
                required
                disabled={isLoading}
              />

              <AuthInput
                id="state"
                label="State"
                type="text"
                placeholder="NY"
                value={formData.state}
                onChange={(val) => setFormData({ ...formData, state: val })}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Owner Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Owner Information</h3>
            
            <AuthInput
              id="ownerName"
              label="Owner Name"
              type="text"
              icon={<User className="size-4" />}
              placeholder="Dr. John Smith"
              value={formData.ownerName}
              onChange={(val) => setFormData({ ...formData, ownerName: val })}
              required
              disabled={isLoading}
            />

            <AuthInput
              id="ownerEmail"
              label="Owner Email"
              type="email"
              icon={<Mail className="size-4" />}
              placeholder="owner@clinic.com"
              value={formData.ownerEmail}
              onChange={(val) => setFormData({ ...formData, ownerEmail: val })}
              required
              disabled={isLoading}
            />

            <AuthInput
              id="password"
              label="Password"
              type="password"
              icon={<Lock className="size-4" />}
              placeholder="••••••••"
              value={formData.password}
              onChange={(val) => setFormData({ ...formData, password: val })}
              required
              disabled={isLoading}
              showPasswordToggle
              helperText="Must be at least 6 characters"
            />

            <AuthInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              icon={<Lock className="size-4" />}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(val) => setFormData({ ...formData, confirmPassword: val })}
              required
              disabled={isLoading}
              showPasswordToggle
            />
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="size-4" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation"
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
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
