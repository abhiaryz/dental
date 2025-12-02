"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Building2, User, Users, ArrowRight, Sparkles, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="w-full p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl shadow-lg">
              <Stethoscope className="size-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            MediCare
          </h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login/clinic-select" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl">
          {/* Title */}
          <div className="text-center mb-8 sm:mb-12 px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Get Started with MediCare
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the account type that best fits your practice
            </p>
          </div>

          {/* Two Options */}
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Individual Doctor */}
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardHeader className="text-center pb-4 px-4 sm:px-6">
                <div className="mx-auto mb-3 sm:mb-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="size-8 sm:size-10 text-primary" />
                </div>
                <CardTitle className="text-xl sm:text-2xl mb-2">Individual Doctor</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Solo practice with independent patient records
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Manage your own patients independently
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Complete clinical features and AI assistance
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Quick setup - Start in minutes
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Perfect for external consultants
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => router.push("/signup/individual")}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold group touch-manipulation"
                  variant="outline"
                >
                  Continue as Individual
                  <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-xs text-center text-muted-foreground pb-2">
                  No team management needed
                </p>
              </CardContent>
            </Card>

            {/* Clinic/Practice */}
            <Card className="relative overflow-hidden border-2 border-primary/30 hover:border-primary transition-all duration-300 hover:shadow-2xl shadow-lg group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/30 to-transparent rounded-bl-full" />
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                RECOMMENDED
              </div>
              
              <CardHeader className="text-center pb-4 px-4 sm:px-6">
                <div className="mx-auto mb-3 sm:mb-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="size-8 sm:size-10 text-primary" />
                </div>
                <CardTitle className="text-xl sm:text-2xl mb-2">Clinic / Practice</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Multi-doctor setup with staff management
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Centralized patient records for the entire clinic
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Team management with role-based access
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Invite doctors, hygienists, and staff
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Advanced analytics and reporting
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => router.push("/signup/clinic/onboarding?step=1")}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg group touch-manipulation"
                >
                  Setup Your Clinic
                  <Sparkles className="ml-2 size-4" />
                </Button>

                <p className="text-xs text-center text-muted-foreground pb-2">
                  Guided setup with team invitations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison */}
          <div className="mt-12 sm:mt-16 text-center px-4">
            <p className="text-sm text-muted-foreground mb-4">
              Both plans include:
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <span className="px-4 py-2 bg-white/60 rounded-full">✓ Patient Management</span>
              <span className="px-4 py-2 bg-white/60 rounded-full">✓ Treatment Records</span>
              <span className="px-4 py-2 bg-white/60 rounded-full">✓ AI Diagnosis Assistant</span>
              <span className="px-4 py-2 bg-white/60 rounded-full">✓ Appointment Scheduling</span>
              <span className="px-4 py-2 bg-white/60 rounded-full">✓ Billing & Invoicing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full p-4 sm:p-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>© 2024 MediCare. All rights reserved.</p>
      </div>
    </div>
  );
}
