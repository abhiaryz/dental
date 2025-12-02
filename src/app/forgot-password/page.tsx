"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Stethoscope, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Sparkles, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "An error occurred. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Right Side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Only visible on small screens */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="relative inline-block mb-3 sm:mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-3 sm:p-4 rounded-2xl shadow-lg">
                <Stethoscope className="size-7 sm:size-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              MediCare
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground flex items-center justify-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Your trusted dental care partner
            </p>
          </div>

          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
            <CardHeader className="space-y-1 text-center pb-4 sm:pb-6 px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold">Forgot Password?</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Enter your email to receive a password reset link
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="size-4" />
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading || success}
                      className="h-11 sm:h-12 pl-10 border-2 focus:border-primary transition-colors text-base"
                      autoComplete="email"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle2 className="size-4 text-green-600" />
                    <AlertDescription className="font-medium text-green-800">
                      Password reset link has been sent to your email. Please check your inbox.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation"
                  disabled={isLoading || success}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <Sparkles className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4 sm:pt-6 px-4 sm:px-6 pb-6">
              <Link 
                href="/login" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 justify-center font-medium touch-manipulation"
              >
                <ArrowLeft className="size-4" />
                Back to Sign in
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Footer - Centered at bottom */}
      <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 text-center text-xs sm:text-sm text-muted-foreground px-4">
        <p>© 2024 MediCare. All rights reserved.</p>
      </div>
    </div>
  );
}

