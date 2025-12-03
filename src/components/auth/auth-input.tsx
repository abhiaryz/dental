"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReactNode, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthInputProps {
  id: string;
  label: string;
  icon?: ReactNode;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  className?: string;
}

export function AuthInput({
  id,
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  disabled,
  autoComplete,
  error,
  helperText,
  showPasswordToggle = false,
  className,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            "h-12 border-2 focus:border-primary transition-all duration-200 text-base",
            icon && "pl-10",
            showPasswordToggle && "pr-10",
            error && "border-destructive focus:border-destructive"
          )}
        />
        
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={disabled}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-destructive font-medium flex items-center gap-1">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

