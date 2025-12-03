"use client";

import { useRouter } from "next/navigation";
import { Building2, User, Sparkles } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ChoiceCard } from "@/components/auth/choice-card";

export default function SignupPage() {
  const router = useRouter();

  return (
    <AuthLayout
      variant="centered"
      title="Get Started with DentaEdge"
      subtitle="Choose the account type that best suits your practice"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
        <ChoiceCard
          icon={<Building2 className="size-10 text-primary" />}
          title="Clinic/Practice"
          description="Perfect for dental clinics with multiple staff members"
          features={[
            "Multi-user access with role-based permissions",
            "Team collaboration and patient sharing",
            "Centralized billing and reporting",
            "Employee management dashboard",
          ]}
          buttonText="Setup Clinic Account"
          onClick={() => router.push("/signup/clinic")}
          recommended
          badge="RECOMMENDED"
        />

        <ChoiceCard
          icon={<User className="size-10 text-blue-600" />}
          title="Individual Practitioner"
          description="For independent dental professionals"
          features={[
            "Personal practice management",
            "Independent patient records",
            "Simplified billing and invoicing",
            "Full control over your data",
          ]}
          buttonText="Setup Individual Account"
          onClick={() => router.push("/signup/individual")}
          variant="outline"
        />
      </div>

      <div className="mt-12 text-center max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground mb-3">
          Already have an account?
        </p>
        <button
          onClick={() => router.push("/login")}
          className="text-primary hover:underline font-semibold inline-flex items-center gap-2"
        >
          Sign in instead
          <Sparkles className="size-4" />
        </button>
      </div>
    </AuthLayout>
  );
}
