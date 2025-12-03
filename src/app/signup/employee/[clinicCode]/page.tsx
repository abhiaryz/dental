"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, User, Lock, Building2, Shield, Mail } from "lucide-react";

function EmployeeSignupContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const clinicCode = params.clinicCode as string;
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    email: string;
    role: string;
    clinicName: string;
  } | null>(null);

  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token) {
        setError("Invalid invitation link. Please contact your clinic administrator.");
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/clinic/verify-invitation?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setInvitationData({
            email: data.email,
            role: data.role,
            clinicName: data.clinicName,
          });
        } else {
          setError(data.error || "Invalid or expired invitation");
        }
      } catch (err) {
        console.error("Failed to verify invitation:", err);
        setError("Failed to verify invitation. Please try again.");
      } finally {
        setVerifying(false);
      }
    };

    void verifyInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }

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
      const response = await fetch("/api/clinic/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: formData.name,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show email verification message
        setEmailSent(true);
      } else {
        setError(data.error || "Failed to accept invitation");
      }
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="size-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check Your Email!</CardTitle>
            <CardDescription>We've sent you a verification link</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              We sent a verification email to <strong>{invitationData?.email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and start using DentaEdge.
            </p>
            <div className="pt-4">
              <Button onClick={() => router.push(`/login/${clinicCode}`)} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      CLINIC_DOCTOR: "Clinic Doctor",
      HYGIENIST: "Hygienist/Assistant",
      RECEPTIONIST: "Receptionist",
      ADMIN: "Admin",
    };
    return roleNames[role] || role;
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="size-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login/clinic-select")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
      {/* Left Side - Info */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-6 rounded-2xl shadow-lg">
                <Building2 className="size-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
              {invitationData?.clinicName}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Complete your registration to join the team
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">You're invited as {getRoleName(invitationData?.role || "")}</p>
                  <p className="text-sm text-muted-foreground">Role-based access included</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Instant Access</p>
                  <p className="text-sm text-muted-foreground">Start working immediately</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Team Collaboration</p>
                  <p className="text-sm text-muted-foreground">Work together efficiently</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
                <Building2 className="size-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              {invitationData?.clinicName}
            </h1>
          </div>

          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl font-bold">Complete Registration</CardTitle>
              <CardDescription className="text-base">
                Join {invitationData?.clinicName} as {getRoleName(invitationData?.role || "")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Display invitation details */}
              <div className="mb-6 p-4 bg-primary/10 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="size-4 text-primary" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold">{invitationData?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-primary" />
                  <span className="text-muted-foreground">Clinic Code:</span>
                  <span className="font-semibold font-mono">{clinicCode}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    <User className="size-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-12 border-2 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="size-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-12 border-2 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="size-4" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-12 border-2 focus:border-primary transition-colors"
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
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-sm text-center text-muted-foreground">
                <p>Already have an account?{" "}
                  <Link href={`/login/${clinicCode}`} className="text-primary hover:underline font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-sm text-muted-foreground">
        <p>© 2024 DentaEdge. All rights reserved.</p>
      </div>
    </div>
  );
}

export default function EmployeeSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
        <Loader2 className="size-12 animate-spin text-primary" />
      </div>
    }>
      <EmployeeSignupContent />
    </Suspense>
  );
}

