"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Loader2, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setIsVerified(true);
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setError(data.error || "Failed to verify email");
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        setError("An error occurred. Please try again.");
      } finally {
        setIsVerifying(false);
      }
    };

    if (token) {
      void run();
    } else {
      setError("Invalid verification link");
      setIsVerifying(false);
    }
  }, [router, token]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="size-16 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Verifying your email...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="size-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Email Verified!</CardTitle>
            <CardDescription className="text-base">
              Your account is now active
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You can now sign in and start using DentaEdge.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Continue to Login
            </Button>
            <p className="text-xs text-muted-foreground">Redirecting in 3 seconds...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
      {/* Left Side - Logo */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="max-w-md text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-primary to-primary/80 p-8 rounded-2xl shadow-lg">
              <Stethoscope className="size-16 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
            DentaEdge
          </h1>
          <p className="text-xl text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Your trusted dental care partner
          </p>
        </div>
      </div>

      {/* Right Side - Error */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="relative inline-block mb-3 sm:mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-3 sm:p-4 rounded-2xl shadow-lg">
                <Stethoscope className="size-7 sm:size-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              DentaEdge
            </h1>
          </div>

          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <AlertCircle className="size-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Verification Failed</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => router.push("/login")} className="w-full" variant="outline">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 text-center text-xs sm:text-sm text-muted-foreground px-4">
        <p>© 2024 DentaEdge. All rights reserved.</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
          <Loader2 className="size-12 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

