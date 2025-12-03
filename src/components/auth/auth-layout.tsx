"use client";

import { ReactNode } from "react";
import { Stethoscope, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  variant?: "split" | "centered";
  brandingContent?: ReactNode;
  footerContent?: ReactNode;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showBackButton,
  backHref,
  backLabel = "Back",
  variant = "split",
  brandingContent,
  footerContent,
}: AuthLayoutProps) {
  const BrandingSection = () => (
    <div className="max-w-md text-center">
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 rounded-3xl shadow-2xl">
          <Stethoscope className="size-16 text-white drop-shadow-lg" />
        </div>
      </div>
      
      <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4 tracking-tight">
        DentaEdge
      </h1>
      
      <p className="text-xl text-muted-foreground flex items-center justify-center gap-2 mb-6">
        <Sparkles className="size-5 text-primary" />
        Your trusted dental care partner
      </p>
      
      {brandingContent && (
        <div className="mt-8 text-muted-foreground">
          {brandingContent}
        </div>
      )}
    </div>
  );

  if (variant === "centered") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 via-blue-50/30 to-cyan-50">
        {/* Fixed Header with Logo */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-xl">
          <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full"></div>
                <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl shadow-lg">
                  <Stethoscope className="size-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                DentaEdge
              </span>
            </div>
            
            {showBackButton && backHref && (
              <Link
                href={backHref}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {backLabel}
              </Link>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
          <div className="w-full max-w-6xl">
            {(title || subtitle) && (
              <div className="text-center mb-8 sm:mb-12">
                {title && (
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t bg-white/50">
          {footerContent || <p>© 2024 DentaEdge. All rights reserved.</p>}
        </footer>
      </div>
    );
  }

  // Split variant (default)
  return (
    <div className="min-h-screen flex relative bg-gradient-to-br from-cyan-50 via-blue-50/30 to-cyan-50">
      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <BrandingSection />
        </div>
      </div>

      {/* Right Side - Form Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Back Button */}
          {showBackButton && backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
              {backLabel}
            </Link>
          )}

          {/* Mobile Branding */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
                <Stethoscope className="size-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              DentaEdge
            </h1>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Your trusted dental care partner
            </p>
          </div>

          {children}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-muted-foreground px-4">
        {footerContent || <p>© 2024 DentaEdge. All rights reserved.</p>}
      </div>
    </div>
  );
}

