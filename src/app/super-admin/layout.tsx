"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Building2, 
  Users,
  BarChart3, 
  Settings, 
  LogOut,
  Shield,
  Loader2,
  Menu,
  X,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuperAdmin {
  id: string;
  email: string;
  name: string;
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/super-admin/auth/me");
      
      if (!response.ok) {
        router.push("/super-admin");
        return;
      }

      const data = await response.json();
      setSuperAdmin(data.superAdmin);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/super-admin");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch("/api/super-admin/auth/logout", {
        method: "POST",
      });
      router.push("/super-admin");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/super-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Clinics",
      href: "/super-admin/clinics",
      icon: Building2,
    },
    {
      name: "Users",
      href: "/super-admin/users",
      icon: Users,
    },
    {
      name: "Database",
      href: "/super-admin/database",
      icon: Database,
    },
    {
      name: "Analytics",
      href: "/super-admin/analytics",
      icon: BarChart3,
    },
    {
      name: "Settings",
      href: "/super-admin/settings",
      icon: Settings,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Don't show layout on login page
  if (pathname === "/super-admin") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Super Admin</p>
              <p className="text-xs text-slate-400">Platform Control</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info & Logout */}
          <div className="border-t border-slate-800 p-4">
            <div className="mb-3 rounded-lg bg-slate-800 p-3">
              <p className="text-sm font-medium text-white">{superAdmin?.name}</p>
              <p className="text-xs text-slate-400">{superAdmin?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 lg:justify-end">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? (
              <X className="h-6 w-6 text-slate-900" />
            ) : (
              <Menu className="h-6 w-6 text-slate-900" />
            )}
          </button>

          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
            <Shield className="h-3 w-3" />
            Super Admin Mode
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

