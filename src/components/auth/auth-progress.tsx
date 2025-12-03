"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  description?: string;
}

interface AuthProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function AuthProgress({ steps, currentStep, className }: AuthProgressProps) {
  return (
    <div className={cn("w-full py-8", className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-slate-200 -z-10"></div>
        
        {/* Active Progress Bar */}
        <div 
          className="absolute left-0 top-5 h-0.5 bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 -z-10"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={index} className="flex flex-col items-center relative flex-1">
              {/* Step Circle */}
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 shadow-lg",
                isCompleted && "bg-primary text-primary-foreground scale-110",
                isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110",
                !isCompleted && !isCurrent && "bg-white text-slate-400 border-2 border-slate-200"
              )}>
                {isCompleted ? (
                  <Check className="size-5" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-[120px]">
                <div className={cn(
                  "text-xs sm:text-sm font-medium transition-colors",
                  (isCurrent || isCompleted) ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

