"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, User } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ChoiceCard } from "@/components/auth/choice-card";
import { AuthInput } from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClinicSelectPage() {
  const router = useRouter();
  const [showClinicForm, setShowClinicForm] = useState(false);
  const [clinicCode, setClinicCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Verify clinic exists
      const response = await fetch(`/api/clinic/verify?code=${clinicCode}`);
      const data = await response.json();

      if (response.ok && data.exists) {
        // Redirect to clinic-specific login
        router.push(`/login/${clinicCode}`);
      } else {
        setError("Clinic not found. Please check your clinic code.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showClinicForm) {
    return (
      <AuthLayout variant="centered" showBackButton backHref="/login/clinic-select" backLabel="Back">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleClinicSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border-2 border-primary/20">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Building2 className="size-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Enter Clinic Code</h2>
              <p className="text-sm text-muted-foreground">
                Enter the unique code provided by your clinic
              </p>
            </div>

            <AuthInput
              id="clinicCode"
              label="Clinic Code"
              type="text"
              placeholder="e.g., ABC123XYZ"
              value={clinicCode}
              onChange={(val) => setClinicCode(val.toUpperCase())}
              disabled={isLoading}
              helperText="Clinic codes are case-insensitive and alphanumeric"
            />

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="size-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
              disabled={isLoading || !clinicCode}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Continue to Clinic Login"
              )}
            </Button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      variant="centered"
      title="Welcome Back!"
      subtitle="Choose your account type to sign in"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <ChoiceCard
          icon={<Building2 className="size-10 text-primary" />}
          title="Clinic/Practice"
          description="For clinic staff and employees"
          features={[
            "Access your clinic's patient records",
            "Manage appointments and treatments",
            "Collaborate with your team",
          ]}
          buttonText="Sign in as Clinic Staff"
          onClick={() => setShowClinicForm(true)}
          recommended
        />

        <ChoiceCard
          icon={<User className="size-10 text-blue-600" />}
          title="Individual Practitioner"
          description="For independent dental professionals"
          features={[
            "Manage your own practice",
            "Independent patient records",
            "Personal dashboard and tools",
          ]}
          buttonText="Sign in as Individual"
          onClick={() => router.push("/login/individual")}
          variant="outline"
        />
      </div>

      <div className="mt-12 text-center max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground mb-3">
          Don't have an account?
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            variant="link"
            onClick={() => router.push("/signup/clinic")}
            className="text-primary hover:underline font-semibold"
          >
            Setup Clinic
          </Button>
          <span className="text-muted-foreground">•</span>
          <Button
            variant="link"
            onClick={() => router.push("/signup/individual")}
            className="text-primary hover:underline font-semibold"
          >
            Setup Individual Practice
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
