"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Loader2, AlertCircle, Mail, Lock, User as UserIcon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";

interface ClinicLoginPageProps {
  params: { clinicCode: string };
}

export default function ClinicLoginPage({ params }: ClinicLoginPageProps) {
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Fetch clinic details
    async function fetchClinic() {
      try {
        const response = await fetch(`/api/clinic/verify?code=${params.clinicCode}`);
        const data = await response.json();
        
        if (data.exists) {
          setClinic(data.clinic);
        } else {
          router.push("/login/clinic-select");
        }
      } catch (error) {
        console.error("Error fetching clinic:", error);
        router.push("/login/clinic-select");
      } finally {
        setIsVerifying(false);
      }
    }
    fetchClinic();
  }, [params.clinicCode, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowResendVerification(false);
    setIsLoading(true);

    try {
      // Check login eligibility first
      const checkResponse = await fetch("/api/auth/check-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, clinicCode: params.clinicCode }),
      });

      const checkData = await checkResponse.json();

      if (!checkData.canLogin) {
        setError(checkData.error);
        
        if (checkData.errorType === "email_not_verified") {
          setShowResendVerification(true);
          setUserEmail(checkData.email || "");
        }
        setIsLoading(false);
        return;
      }

      // Proceed with sign in
      const result = await signIn("credentials", {
        username,
        password,
        clinicCode: params.clinicCode,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: userEmail || undefined,
          username: userEmail ? undefined : username,
          clinicCode: userEmail ? undefined : params.clinicCode 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setError("Verification email sent! Please check your inbox.");
        setShowResendVerification(false);
      } else {
        setError(data.error || "Failed to resend verification email");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50/30 to-cyan-50">
        <div className="text-center">
          <Loader2 className="size-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying clinic...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return null;
  }

  return (
    <AuthLayout variant="split" showBackButton backHref="/login/clinic-select" backLabel="Change Clinic">
      <AuthCard
        title={clinic.name}
        description="Employee Login"
        icon={
          clinic.logo ? (
            <Image
              src={clinic.logo}
              alt={clinic.name}
              width={64}
              height={64}
              className="rounded-lg object-cover"
            />
          ) : (
            <Building2 className="size-8 text-primary" />
          )
        }
        headerClassName="border-b bg-primary/5"
        footerContent={
          <>
            <div className="text-sm text-center">
              <span className="text-muted-foreground">New employee? </span>
              <Link
                href={`/signup/employee/${params.clinicCode}`}
                className="text-primary hover:underline font-semibold"
              >
                Request Access
              </Link>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              Contact your clinic administrator for login credentials
            </div>
          </>
        }
      >
        {/* Clinic Code Display */}
        <div className="text-center mb-6 p-3 bg-slate-50 rounded-lg border">
          <p className="text-xs text-muted-foreground">Clinic Code</p>
          <p className="font-mono font-semibold text-primary">{clinic.clinicCode}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput
            id="username"
            label="Username"
            type="text"
            icon={<UserIcon className="size-4" />}
            placeholder="Enter your username"
            value={username}
            onChange={setUsername}
            required
            disabled={isLoading}
          />

          <AuthInput
            id="password"
            label="Password"
            type="password"
            icon={<Lock className="size-4" />}
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
            required
            disabled={isLoading}
            showPasswordToggle
          />

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
              Remember me for 30 days
            </label>
          </div>

          {error && (
            <Alert 
              variant={error.includes("sent!") ? "default" : "destructive"} 
              className={error.includes("sent!") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}
            >
              {error.includes("sent!") ? (
                <CheckCircle2 className="size-4 text-green-600" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              <AlertDescription className={error.includes("sent!") ? "text-green-800 font-medium" : "font-medium"}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {showResendVerification && (
            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 size-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
