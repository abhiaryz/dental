"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, ArrowLeft, Loader2, AlertCircle, Mail, Lock, User as UserIcon, Sparkles, Stethoscope, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

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
    } catch (error) {
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
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
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
    <div className="min-h-screen flex relative bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
      {/* Left Side - Logo and Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="max-w-md text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-primary to-primary/80 p-8 rounded-2xl shadow-lg">
              <Stethoscope className="size-16 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
            MediCare
          </h1>
          <p className="text-xl text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Your trusted dental care partner
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => router.push("/login/clinic-select")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Change Clinic
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
                <Stethoscope className="size-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              MediCare
            </h1>
          </div>

          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          {/* Clinic Info Header */}
          <CardHeader className="text-center pb-6 border-b bg-primary/5">
            {clinic.logo && (
              <div className="relative inline-block mb-3">
                <img 
                  src={clinic.logo} 
                  alt={clinic.name} 
                  className="w-16 h-16 mx-auto rounded-lg object-cover shadow-md"
                />
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="size-5 text-primary" />
              <CardTitle className="text-2xl font-bold">{clinic.name}</CardTitle>
            </div>
            <CardDescription className="text-base">
              Employee Login
            </CardDescription>
            <div className="mt-2 text-xs text-muted-foreground">
              Code: <span className="font-mono font-semibold">{clinic.clinicCode}</span>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                  <UserIcon className="size-4" />
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    required
                    className="h-12 pl-10 border-2 focus:border-primary transition-colors"
                  />
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="size-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="h-12 pl-10 border-2 focus:border-primary transition-colors"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                </div>
              </div>

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
                  <>
                    Sign In
                    <Sparkles className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-6 border-t">
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
          </CardFooter>
        </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-sm text-muted-foreground">
        <p>© 2024 MediCare. All rights reserved.</p>
      </div>
    </div>
  );
}

