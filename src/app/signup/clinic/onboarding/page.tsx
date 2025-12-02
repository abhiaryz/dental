"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordStrength } from "@/components/ui/password-strength";
import { saveOnboardingProgress, loadOnboardingProgress, clearOnboardingProgress } from "@/lib/progress-storage";
import Link from "next/link";
import {
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Plus,
  Mail,
  UserPlus,
  Sparkles,
  Phone,
  MapPin,
  Users,
  Zap,
  Check,
} from "lucide-react";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStep = parseInt(searchParams.get("step") || "1");

  const [step, setStep] = useState(currentStep);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clinicData, setClinicData] = useState({
    id: "",
    code: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  const [showProgressBanner, setShowProgressBanner] = useState(false);

  // Step 1: Basic Registration
  const [step1Data, setStep1Data] = useState({
    clinicName: "",
    email: "",
    ownerName: "",
    password: "",
    confirmPassword: "",
  });

  // Step 2: Branding
  const [step2Data, setStep2Data] = useState({
    logo: null as File | null,
    logoPreview: "",
    address: "",
    city: "",
    state: "",
    phone: "",
  });

  // Step 4: Team Invitations
  const [invitations, setInvitations] = useState<Array<{ email: string; role: string }>>([
    { email: "", role: "CLINIC_DOCTOR" },
  ]);

  useEffect(() => {
    setStep(currentStep);
    
    // Load saved progress
    const savedProgress = loadOnboardingProgress();
    if (savedProgress && currentStep === 1 && !hasRestoredProgress) {
      const hasData = savedProgress.step1Data?.clinicName || savedProgress.step1Data?.email;
      
      if (hasData) {
        setShowProgressBanner(true);
        setHasRestoredProgress(true);
        
        if (savedProgress.step1Data) {
          setStep1Data(prev => ({ ...prev, ...savedProgress.step1Data }));
        }
        if (savedProgress.step2Data) {
          setStep2Data(prev => ({ ...prev, ...savedProgress.step2Data }));
        }
        if (savedProgress.clinicData) {
          setClinicData(savedProgress.clinicData);
        }
      }
    }
  }, [currentStep, hasRestoredProgress]);

  // Auto-save progress
  useEffect(() => {
    if (step1Data.clinicName || step1Data.email) {
      saveOnboardingProgress({
        step,
        clinicData,
        step1Data: {
          clinicName: step1Data.clinicName,
          email: step1Data.email,
          ownerName: step1Data.ownerName,
        },
        step2Data: {
          logoPreview: step2Data.logoPreview,
          address: step2Data.address,
          city: step2Data.city,
          state: step2Data.state,
          phone: step2Data.phone,
        },
        lastSaved: new Date().toISOString(),
      });
    }
  }, [step1Data, step2Data, step, clinicData]);

  const goToStep = (newStep: number) => {
    router.push(`/signup/clinic/onboarding?step=${newStep}`);
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (step1Data.password !== step1Data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (step1Data.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!agreedToTerms || !agreedToPrivacy) {
      setError("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/clinic/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName: step1Data.clinicName,
          email: step1Data.email,
          ownerName: step1Data.ownerName,
          ownerEmail: step1Data.email,
          password: step1Data.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setClinicData({
          id: data.clinic.id,
          code: data.clinicCode,
        });

        // Show email verification message
        setEmailSent(true);
      } else {
        setError(data.error || "Failed to create clinic");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Upload logo if exists
      let logoUrl = "";
      if (step2Data.logo) {
        const formData = new FormData();
        formData.append("file", step2Data.logo);
        formData.append("type", "logo");

        const uploadResponse = await fetch("/api/clinic/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          logoUrl = uploadData.url;
        }
      }

      // Update clinic with branding
      const response = await fetch("/api/clinic/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo: logoUrl,
          address: step2Data.address,
          city: step2Data.city,
          state: step2Data.state,
          phone: step2Data.phone,
          onboardingStep: 3,
        }),
      });

      if (response.ok) {
        goToStep(3);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update clinic");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Filter out empty invitations
      const validInvitations = invitations.filter((inv) => inv.email.trim() !== "");

      if (validInvitations.length > 0) {
        const response = await fetch("/api/clinic/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitations: validInvitations }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Failed to send invitations");
          setIsLoading(false);
          return;
        }
      }

      // Mark onboarding as complete
      await fetch("/api/clinic/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingComplete: true,
          onboardingStep: 4,
        }),
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Logo file size must be less than 5MB");
        return;
      }
      setStep2Data({
        ...step2Data,
        logo: file,
        logoPreview: URL.createObjectURL(file),
      });
      setError("");
    }
  };

  const addInvitation = () => {
    setInvitations([...invitations, { email: "", role: "CLINIC_DOCTOR" }]);
  };

  const removeInvitation = (index: number) => {
    setInvitations(invitations.filter((_, i) => i !== index));
  };

  const updateInvitation = (index: number, field: string, value: string) => {
    const updated = [...invitations];
    updated[index] = { ...updated[index], [field]: value };
    setInvitations(updated);
  };

  const steps = [
    { number: 1, title: "Basic Info", icon: Building2 },
    { number: 2, title: "Branding", icon: Sparkles },
    { number: 3, title: "Team", icon: Users },
  ];

  // Email verification screen
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
              We sent a verification email to <strong>{step1Data.email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account. After verification, you can sign in and complete your clinic setup.
            </p>
            <div className="pt-4">
              <Button onClick={() => router.push("/login")} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartFresh = () => {
    clearOnboardingProgress();
    setShowProgressBanner(false);
    setStep1Data({
      clinicName: "",
      email: "",
      ownerName: "",
      password: "",
      confirmPassword: "",
    });
    setStep2Data({
      logo: null,
      logoPreview: "",
      address: "",
      city: "",
      state: "",
      phone: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50 py-6 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Restore Banner */}
        {showProgressBanner && step === 1 && (
          <div className="mb-6 animate-in slide-in-from-top-2">
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle2 className="size-4 text-blue-600" />
              <AlertDescription className="text-blue-900 flex items-center justify-between">
                <span>
                  <strong>Welcome back!</strong> We've restored your progress from your last session.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartFresh}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                >
                  Start Fresh
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-3 sm:mb-4">
            <Zap className="size-3 sm:size-4 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-primary">Quick Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent px-4">
            Setup Your Clinic
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">Complete your clinic profile in just 3 easy steps</p>
        </div>

        {/* Modern Progress Indicator */}
        <div className="mb-8 sm:mb-12 px-2">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-4 sm:top-5 left-0 right-0 h-0.5 sm:h-1 bg-gray-200 -z-10">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((s, index) => {
              const Icon = s.icon;
              const isCompleted = step > s.number;
              const isCurrent = step === s.number;
              
              return (
                <div key={s.number} className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm
                      transition-all duration-300 transform
                      ${isCurrent ? 'bg-primary text-white scale-110 shadow-lg ring-2 sm:ring-4 ring-primary/20' : ''}
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${!isCurrent && !isCompleted ? 'bg-white text-gray-400 border-2 border-gray-200' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="size-4 sm:size-5" />
                    ) : (
                      <Icon className="size-4 sm:size-5" />
                    )}
                  </div>
                  <span className={`
                    mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium transition-colors
                    ${isCurrent ? 'text-primary' : ''}
                    ${isCompleted ? 'text-green-600' : ''}
                    ${!isCurrent && !isCompleted ? 'text-gray-400' : ''}
                  `}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content with Animations */}
        <div className="transition-all duration-500 ease-in-out">
          {/* Step 1: Basic Registration */}
          {step === 1 && (
            <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="text-center pb-4 sm:pb-6 border-b bg-gradient-to-r from-primary/5 to-primary/10 px-4 sm:px-6">
                <div className="mx-auto mb-3 sm:mb-4 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="size-7 sm:size-8 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">Let's Get Started</CardTitle>
                <CardDescription className="text-sm sm:text-base">Tell us about your clinic</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-6">
                <form onSubmit={handleStep1Submit} className="space-y-4 sm:space-y-5">
                  <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="clinicName" className="text-sm font-semibold">
                        Clinic Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="clinicName"
                          placeholder="e.g., Smile Dental Clinic"
                          value={step1Data.clinicName}
                          onChange={(e) => setStep1Data({ ...step1Data, clinicName: e.target.value })}
                          required
                          disabled={isLoading}
                          className="h-11 sm:h-12 pl-10 border-2 focus:border-primary transition-colors text-base"
                          autoComplete="organization"
                        />
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerName" className="text-sm font-semibold">
                        Your Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ownerName"
                        placeholder="Dr. John Doe"
                        value={step1Data.ownerName}
                        onChange={(e) => setStep1Data({ ...step1Data, ownerName: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11 sm:h-12 border-2 focus:border-primary transition-colors text-base"
                        autoComplete="name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@clinic.com"
                          value={step1Data.email}
                          onChange={(e) => setStep1Data({ ...step1Data, email: e.target.value })}
                          required
                          disabled={isLoading}
                          className="h-11 sm:h-12 pl-10 border-2 focus:border-primary transition-colors text-base"
                          autoComplete="email"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="password" className="text-sm font-semibold">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={step1Data.password}
                        onChange={(e) => setStep1Data({ ...step1Data, password: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11 sm:h-12 border-2 focus:border-primary transition-colors text-base"
                        autoComplete="new-password"
                      />
                      {step1Data.password && <PasswordStrength password={step1Data.password} />}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={step1Data.confirmPassword}
                        onChange={(e) =>
                          setStep1Data({ ...step1Data, confirmPassword: e.target.value })
                        }
                        required
                        disabled={isLoading}
                        className="h-11 sm:h-12 border-2 focus:border-primary transition-colors text-base"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {/* Terms and Privacy */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                        className="mt-1"
                      />
                      <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                        I agree to the{" "}
                        <Link href="/terms-of-service" target="_blank" className="text-primary hover:underline font-medium">
                          Terms of Service
                        </Link>
                      </label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="privacy"
                        checked={agreedToPrivacy}
                        onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
                        className="mt-1"
                      />
                      <label htmlFor="privacy" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                        I agree to the{" "}
                        <Link href="/privacy-policy" target="_blank" className="text-primary hover:underline font-medium">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all touch-manipulation"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-5 animate-spin" />
                        Creating Clinic...
                      </>
                    ) : (
                      <>
                        Continue to Branding
                        <ArrowRight className="ml-2 size-5" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="text-center pb-4 sm:pb-6 border-b bg-gradient-to-r from-primary/5 to-primary/10 px-4 sm:px-6">
                <div className="mx-auto mb-3 sm:mb-4 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="size-7 sm:size-8 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">Make It Yours</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Customize your clinic's appearance (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-6">
                <form onSubmit={handleStep2Submit} className="space-y-4 sm:space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Clinic Logo</Label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      {step2Data.logoPreview && (
                        <div className="relative group mx-auto sm:mx-0">
                          <img
                            src={step2Data.logoPreview}
                            alt="Logo preview"
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-primary/20 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setStep2Data({ ...step2Data, logo: null, logoPreview: "" })
                            }
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-lg touch-manipulation"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 w-full cursor-pointer">
                        <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 sm:p-8 hover:border-primary hover:bg-primary/5 active:bg-primary/10 transition-all text-center">
                          <Upload className="size-6 sm:size-8 mx-auto mb-2 text-primary" />
                          <p className="text-sm font-medium text-foreground">
                            Click to upload logo
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG or SVG (Max 5MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Input
                          id="phone"
                          placeholder="(555) 123-4567"
                          value={step2Data.phone}
                          onChange={(e) => setStep2Data({ ...step2Data, phone: e.target.value })}
                          disabled={isLoading}
                          className="h-11 sm:h-12 pl-10 border-2 focus:border-primary transition-colors text-base"
                          autoComplete="tel"
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address" className="text-sm font-semibold">
                        Street Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="address"
                          placeholder="123 Main Street"
                          value={step2Data.address}
                          onChange={(e) => setStep2Data({ ...step2Data, address: e.target.value })}
                          disabled={isLoading}
                          className="h-11 sm:h-12 pl-10 border-2 focus:border-primary transition-colors text-base"
                          autoComplete="street-address"
                        />
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-semibold">City</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        value={step2Data.city}
                        onChange={(e) => setStep2Data({ ...step2Data, city: e.target.value })}
                        disabled={isLoading}
                        className="h-11 sm:h-12 border-2 focus:border-primary transition-colors text-base"
                        autoComplete="address-level2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-semibold">State</Label>
                      <Input
                        id="state"
                        placeholder="NY"
                        value={step2Data.state}
                        onChange={(e) => setStep2Data({ ...step2Data, state: e.target.value })}
                        disabled={isLoading}
                        className="h-11 sm:h-12 border-2 focus:border-primary transition-colors text-base"
                        autoComplete="address-level1"
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => goToStep(3)}
                      disabled={isLoading}
                      className="w-full sm:flex-1 h-12 text-sm sm:text-base font-medium touch-manipulation"
                    >
                      Skip for Now
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full sm:flex-1 h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all touch-manipulation"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 size-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Continue to Team
                          <ArrowRight className="ml-2 size-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Team Invitations */}
          {step === 3 && (
            <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="text-center pb-4 sm:pb-6 border-b bg-gradient-to-r from-primary/5 to-primary/10 px-4 sm:px-6">
                <div className="mx-auto mb-3 sm:mb-4 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="size-7 sm:size-8 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">Build Your Team</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Invite team members to collaborate (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-6">
                <form onSubmit={handleStep3Submit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    {invitations.map((inv, index) => (
                      <div 
                        key={index} 
                        className="flex gap-2 sm:gap-3 items-start p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border-2 border-primary/20 animate-in slide-in-from-top-2"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-1 space-y-2 sm:space-y-3">
                          <div className="relative">
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              value={inv.email}
                              onChange={(e) => updateInvitation(index, "email", e.target.value)}
                              className="h-11 pl-10 border-2 focus:border-primary text-base"
                              autoComplete="email"
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          </div>
                          <Select
                            value={inv.role}
                            onValueChange={(value) => updateInvitation(index, "role", value)}
                          >
                            <SelectTrigger className="h-11 border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CLINIC_DOCTOR">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                  <span>Doctor</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="HYGIENIST">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-primary/60" />
                                  <span>Hygienist</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="RECEPTIONIST">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                                  <span>Receptionist</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {invitations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInvitation(index)}
                            className="hover:bg-red-100 hover:text-red-600 transition-colors"
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInvitation}
                    className="w-full h-11 sm:h-12 text-sm sm:text-base border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 active:bg-primary/10 transition-all touch-manipulation"
                  >
                    <Plus className="mr-2 size-4 sm:size-5" />
                    Add Another Member
                  </Button>

                  {error && (
                    <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      disabled={isLoading}
                      className="w-full sm:flex-1 h-12 text-sm sm:text-base font-medium touch-manipulation"
                    >
                      Skip for Now
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full sm:flex-1 h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all touch-manipulation"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 size-5 animate-spin" />
                          Sending Invitations...
                        </>
                      ) : (
                        <>
                          Complete Setup
                          <Sparkles className="ml-2 size-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Need help? <a href="#" className="text-primary hover:underline font-medium touch-manipulation">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50">
        <Loader2 className="size-12 animate-spin text-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
