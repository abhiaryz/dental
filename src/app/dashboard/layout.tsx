import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { UserMenu } from "@/components/user-menu";
import { ErrorBoundary } from "@/components/error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50">
        <SidebarProvider defaultOpen={false} className="[--sidebar-width:12rem] [--sidebar-width-icon:3rem]">
          <AppSidebar />
          <SidebarInset>
            <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <BreadcrumbNav />
              </div>

              <UserMenu />
            </div>
            <div className="p-6">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ErrorBoundary>
  );
}

