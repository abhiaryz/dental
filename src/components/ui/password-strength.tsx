"use client";

import { useEffect, useState } from "react";
import { validatePasswordStrength, checkPasswordRequirements } from "@/lib/password-validator";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  const [strength, setStrength] = useState<any>(null);
  const [requirements, setRequirements] = useState<any>(null);

  useEffect(() => {
    if (password) {
      const strengthResult = validatePasswordStrength(password);
      setStrength(strengthResult);
      
      if (showRequirements) {
        const reqResult = checkPasswordRequirements(password);
        setRequirements(reqResult);
      }
    } else {
      setStrength(null);
      setRequirements(null);
    }
  }, [password, showRequirements]);

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Strength Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password Strength:</span>
          <span className="font-semibold capitalize" style={{ color: strength?.color }}>
            {strength?.strength?.replace("-", " ")}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out rounded-full"
            style={{
              width: `${strength?.percentage || 0}%`,
              backgroundColor: strength?.color,
            }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && requirements && (
        <div className="space-y-1.5">
          <RequirementItem met={requirements.minLength} text="At least 8 characters" />
          <RequirementItem met={requirements.hasUppercase} text="One uppercase letter" />
          <RequirementItem met={requirements.hasLowercase} text="One lowercase letter" />
          <RequirementItem met={requirements.hasNumber} text="One number" />
          <RequirementItem met={requirements.hasSpecial} text="One special character (optional)" />
        </div>
      )}

      {/* Feedback */}
      {strength?.feedback?.warning && (
        <p className="text-xs text-amber-600">{strength.feedback.warning}</p>
      )}
      
      {strength?.feedback?.suggestions && strength.feedback.suggestions.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          {strength.feedback.suggestions.map((suggestion: string, index: number) => (
            <p key={index}>• {suggestion}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="size-4 text-green-600 flex-shrink-0" />
      ) : (
        <X className="size-4 text-gray-400 flex-shrink-0" />
      )}
      <span className={met ? "text-green-600" : "text-muted-foreground"}>{text}</span>
    </div>
  );
}

