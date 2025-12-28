"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";

function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setError("");
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "An error occurred during signup");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout variant="split">
        <AuthCard
          title="Account Created!"
          description="Please check your email to verify your account"
        >
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="size-4 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">
              We've sent a verification email to {email}. Please check your inbox and click the verification link to activate your account.
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="split">
      <AuthCard
        title="Create Account"
        description="Sign up to get started with DentaEdge"
        footerContent={
          <div className="text-sm text-center">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline font-semibold transition-colors touch-manipulation">
              Sign in
            </Link>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <AuthInput
            id="name"
            label="Full Name"
            type="text"
            icon={<User className="size-4" />}
            placeholder="John Doe"
            value={name}
            onChange={setName}
            required
            disabled={isLoading}
            autoComplete="name"
          />

          <AuthInput
            id="email"
            label="Email Address"
            type="email"
            icon={<Mail className="size-4" />}
            placeholder="john@example.com"
            value={email}
            onChange={setEmail}
            required
            disabled={isLoading}
            autoComplete="email"
          />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Lock className="size-4 text-primary" />
                Password
              </span>
            </div>
            <AuthInput
              id="password"
              label=""
              type="password"
              icon={<Lock className="size-4" />}
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              required
              disabled={isLoading}
              autoComplete="new-password"
              showPasswordToggle
            />
          </div>

          <AuthInput
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            icon={<Lock className="size-4" />}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            disabled={isLoading}
            autoComplete="new-password"
            showPasswordToggle
          />

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground cursor-pointer select-none leading-relaxed"
            >
              I agree to the{" "}
              <Link href="/terms-of-service" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
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
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
