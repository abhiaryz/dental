"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, User, Stethoscope, Loader2, AlertCircle, ArrowRight } from "lucide-react";

export default function ClinicSelectPage() {
  const router = useRouter();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
              <Stethoscope className="size-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            MediCare
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome! Choose how to continue
          </p>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Select your account type to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Option 1: Clinic Login */}
            <form onSubmit={handleClinicSubmit} className="space-y-4">
              <div className="p-5 border-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Clinic/Practice</h3>
                    <p className="text-sm text-muted-foreground">
                      Sign in as a clinic employee
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clinicCode" className="text-sm font-medium">
                    Enter Your Clinic Code
                  </Label>
                  <Input
                    id="clinicCode"
                    placeholder="e.g., ABC123XYZ"
                    value={clinicCode}
                    onChange={(e) => setClinicCode(e.target.value.toUpperCase())}
                    disabled={isLoading}
                    className="h-11 font-mono text-center tracking-wider"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="mt-3 border-red-200 bg-red-50">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full mt-4 h-11"
                  disabled={isLoading || !clinicCode}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue to Clinic
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-card text-muted-foreground font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Option 2: Individual Practitioner */}
            <div className="p-5 border-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="size-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Individual Practitioner</h3>
                  <p className="text-sm text-muted-foreground">
                    For independent dental professionals
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full h-11"
                onClick={() => router.push("/login/individual")}
              >
                Continue as Individual
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>

            {/* Setup Links */}
            <div className="pt-4 border-t text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Don't have an account?
              </p>
              <div className="flex gap-3 justify-center text-sm">
                <Link
                  href="/signup/clinic"
                  className="text-primary hover:underline font-semibold"
                >
                  Setup Clinic
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link
                  href="/signup/individual"
                  className="text-primary hover:underline font-semibold"
                >
                  Setup Individual Practice
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 MediCare. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

