"use client";

import { useState, useEffect } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { UserMenu } from "@/components/user-menu";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50">
        <SidebarProvider 
          defaultOpen={false} 
          className="[--sidebar-width:16rem] [--sidebar-width-icon:4rem] lg:[--sidebar-width:18rem]"
        >
          <AppSidebar />
          <SidebarInset>
            <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 md:px-6 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2 md:gap-3">
                <SidebarTrigger className="md:hidden" />
                <BreadcrumbNav />
              </div>

              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="gap-2 text-muted-foreground px-2 md:px-4"
                >
                  <Search className="size-4" />
                  <span className="hidden md:inline">Search</span>
                  <kbd className="hidden lg:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
                <UserMenu />
              </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8 pb-safe">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>

        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      </div>
    </ErrorBoundary>
  );
}
