"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  iconBgColor?: string;
  children: ReactNode;
  footerContent?: ReactNode;
  className?: string;
  headerClassName?: string;
}

export function AuthCard({
  title,
  description,
  icon,
  iconBgColor = "bg-primary/10",
  children,
  footerContent,
  className,
  headerClassName,
}: AuthCardProps) {
  return (
    <Card className={cn(
      "shadow-2xl border-0 backdrop-blur-sm bg-white/95 hover:shadow-3xl transition-shadow duration-300",
      className
    )}>
      <CardHeader className={cn(
        "space-y-1 text-center pb-6 px-4 sm:px-6",
        headerClassName
      )}>
        {icon && (
          <div className="mx-auto mb-4">
            <div className={cn("w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center", iconBgColor)}>
              {icon}
            </div>
          </div>
        )}
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-sm sm:text-base">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6">
        {children}
      </CardContent>
      
      {footerContent && (
        <CardFooter className="flex flex-col space-y-4 pt-6 px-4 sm:px-6 pb-6 border-t bg-slate-50/50">
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
}

