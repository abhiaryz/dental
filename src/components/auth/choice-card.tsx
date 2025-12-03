"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChoiceCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  onClick: () => void;
  recommended?: boolean;
  variant?: "outline" | "filled";
  badge?: string;
  footerText?: string;
}

export function ChoiceCard({
  icon,
  title,
  description,
  features,
  buttonText,
  onClick,
  recommended = false,
  variant = "outline",
  badge,
  footerText,
}: ChoiceCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl group cursor-pointer",
      recommended ? "border-primary/50 shadow-lg" : "hover:border-primary/50"
    )}>
      {/* Decorative gradient overlay */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        recommended ? "from-primary/30 to-transparent opacity-100" : "from-primary/20 to-transparent"
      )} />
      
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Sparkles className="size-3" />
            {badge || "RECOMMENDED"}
          </div>
        </div>
      )}
      
      <CardHeader className="text-center pb-4 px-4 sm:px-6 relative z-10">
        <div className={cn(
          "mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
          recommended ? "bg-primary/20" : "bg-primary/10"
        )}>
          {icon}
        </div>
        <CardTitle className="text-xl sm:text-2xl mb-2">{title}</CardTitle>
        <CardDescription className="text-sm sm:text-base">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-4 sm:px-6 pb-6 relative z-10">
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="size-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{feature}</p>
            </div>
          ))}
        </div>

        <Button
          onClick={onClick}
          className={cn(
            "w-full h-12 text-base font-semibold group/btn transition-all duration-200",
            recommended 
              ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg" 
              : ""
          )}
          variant={variant === "outline" && !recommended ? "outline" : "default"}
        >
          {buttonText}
          <ArrowRight className="ml-2 size-4 group-hover/btn:translate-x-1 transition-transform" />
        </Button>

        {footerText && (
          <p className="text-xs text-center text-muted-foreground pb-2">
            {footerText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

