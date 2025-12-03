// Client-side progress storage for onboarding
export interface OnboardingProgress {
  step: number;
  clinicData?: {
    id: string;
    code: string;
  };
  step1Data?: {
    clinicName: string;
    email: string;
    ownerName: string;
  };
  step2Data?: {
    logoPreview: string;
    address: string;
    city: string;
    state: string;
    phone: string;
  };
  lastSaved: string;
}

const STORAGE_KEY = "DentaEdge_onboarding_progress";

export function saveOnboardingProgress(progress: OnboardingProgress) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }
}

export function loadOnboardingProgress(): OnboardingProgress | null {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const progress = JSON.parse(stored);
        // Check if saved within last 24 hours
        const lastSaved = new Date(progress.lastSaved);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return progress;
        }
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
  }
  return null;
}

export function clearOnboardingProgress() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear progress:", error);
    }
  }
}

