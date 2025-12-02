import zxcvbn from "zxcvbn";

export interface PasswordStrength {
  score: number; // 0-4
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTime: string;
  strength: "weak" | "fair" | "good" | "strong" | "very-strong";
  color: string;
  percentage: number;
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const result = zxcvbn(password);

  const strengthMap = {
    0: { label: "weak", color: "#ef4444" },
    1: { label: "fair", color: "#f59e0b" },
    2: { label: "good", color: "#eab308" },
    3: { label: "strong", color: "#22c55e" },
    4: { label: "very-strong", color: "#10b981" },
  };

  const strength = strengthMap[result.score as 0 | 1 | 2 | 3 | 4];

  return {
    score: result.score,
    feedback: {
      warning: result.feedback.warning || "",
      suggestions: result.feedback.suggestions || [],
    },
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second || "unknown",
    strength: strength.label as any,
    color: strength.color,
    percentage: (result.score / 4) * 100,
  };
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const requirements = checkPasswordRequirements(password);
  return (
    requirements.minLength &&
    requirements.hasUppercase &&
    requirements.hasLowercase &&
    requirements.hasNumber
  );
}

