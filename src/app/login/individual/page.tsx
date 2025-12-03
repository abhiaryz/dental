"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Mail, Lock, User as UserIcon, CheckCircle2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";

function IndividualLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);

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
        body: JSON.stringify({ email }),
      });

      const checkData = await checkResponse.json();

      if (!checkData.canLogin) {
        setError(checkData.error);
        
        if (checkData.errorType === "email_not_verified") {
          setShowResendVerification(true);
        }
        setIsLoading(false);
        return;
      }

      // Proceed with sign in
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
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
        body: JSON.stringify({ email }),
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

  return (
    <AuthLayout variant="split" showBackButton backHref="/login/clinic-select" backLabel="Back to Login Options">
      <AuthCard
        title="Individual Practitioner"
        description="Sign in as an independent dental professional"
        icon={<UserIcon className="size-8 text-primary" />}
        iconBgColor="bg-blue-100"
        footerContent={
          <>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline font-medium text-center touch-manipulation"
            >
              Forgot your password?
            </Link>
            <div className="text-sm text-center">
              <span className="text-muted-foreground">New practitioner? </span>
              <Link
                href="/signup/individual"
                className="text-primary hover:underline font-semibold transition-colors touch-manipulation"
              >
                Create an account
              </Link>
            </div>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <AuthInput
            id="email"
            label="Email Address"
            type="email"
            icon={<Mail className="size-4" />}
            placeholder="doctor@example.com"
            value={email}
            onChange={setEmail}
            required
            disabled={isLoading}
            autoComplete="email"
          />

          <AuthInput
            id="password"
            label="Password"
            type="password"
            icon={<Lock className="size-4" />}
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            required
            disabled={isLoading}
            autoComplete="current-password"
            showPasswordToggle
          />

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <label
              htmlFor="remember"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
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
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation"
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

export default function IndividualLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <IndividualLoginForm />
    </Suspense>
  );
}
