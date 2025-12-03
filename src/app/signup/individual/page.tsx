"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Loader2, AlertCircle, User, Mail, Lock } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function IndividualSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!agreedToTerms || !agreedToPrivacy) {
      setError("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);

    try {
      // Create individual doctor account
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "EXTERNAL_DOCTOR",
          isExternal: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show email verification message
        setEmailSent(true);
      } else {
        setError(data.error || "An error occurred during signup");
      }
    } catch (err) {
      console.error("Failed to sign up individual account:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout variant="split">
        <Card className="shadow-2xl border-2 border-primary/20">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <Mail className="size-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email!</CardTitle>
            <CardDescription>We've sent you a verification link</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              We sent a verification email to <strong className="text-foreground">{formData.email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and start using DentaEdge.
            </p>
            <div className="pt-4">
              <Button onClick={() => router.push("/login/individual")} className="w-full h-12">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="split" showBackButton backHref="/signup" backLabel="Back to signup options">
      <AuthCard
        title="Create Individual Account"
        description="Setup your personal dental practice"
        icon={<User className="size-8 text-blue-600" />}
        iconBgColor="bg-blue-100"
        footerContent={
          <div className="text-sm text-center">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login/individual" className="text-primary hover:underline font-semibold transition-colors">
              Sign in instead
            </Link>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput
            id="name"
            label="Full Name"
            type="text"
            icon={<User className="size-4" />}
            placeholder="Dr. John Smith"
            value={formData.name}
            onChange={(val) => setFormData({ ...formData, name: val })}
            required
            disabled={isLoading}
          />

          <AuthInput
            id="email"
            label="Email Address"
            type="email"
            icon={<Mail className="size-4" />}
            placeholder="john@example.com"
            value={formData.email}
            onChange={(val) => setFormData({ ...formData, email: val })}
            required
            disabled={isLoading}
            autoComplete="email"
          />

          <div className="space-y-2">
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
              helperText="Must be at least 8 characters"
            />
            {formData.password && (
              <PasswordStrength password={formData.password} />
            )}
          </div>

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

          {/* Terms and Privacy */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer select-none leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline font-medium">
                  Terms of Service
                </Link>
              </label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="privacy"
                checked={agreedToPrivacy}
                onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
              />
              <label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer select-none leading-relaxed">
                I agree to the{" "}
                <Link href="/privacy" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
              </label>
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
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Creating Account...
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
