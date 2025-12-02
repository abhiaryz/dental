"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Home, BarChart3, Settings, Users, CalendarClock, PackageSearch, MessageSquarePlus, MessageSquare, MoreHorizontal, DollarSign, UserCog, Cuboid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className={cn("bg-gradient-to-b from-sky-50 via-emerald-50/30 to-white border-r border-white/70 backdrop-blur", className)}>
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2">
          <div className="size-6 rounded-lg bg-gradient-to-br from-sky-600 to-emerald-500 flex items-center justify-center group-data-[collapsible=icon]:size-8">
            <span className="text-white font-bold text-xs">MC</span>
          </div>
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden text-slate-900">MediCare</span>
        </div>
        <SidebarSeparator />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/patients" || pathname.startsWith("/dashboard/patients/")}>
                  <Link href="/dashboard/patients">
                    <Users />
                    <span>Patients</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/appointments" || pathname.startsWith("/dashboard/appointments/")}>
                  <Link href="/dashboard/appointments">
                    <CalendarClock />
                    <span>Appointments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/inventory" || pathname.startsWith("/dashboard/inventory/")}>
                  <Link href="/dashboard/inventory">
                    <PackageSearch />
                    <span>Inventory</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/analytics" || pathname.startsWith("/dashboard/analytics/")}>
                  <Link href="/dashboard/analytics">
                    <BarChart3 />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/finance" || pathname.startsWith("/dashboard/finance/")}>
                  <Link href="/dashboard/finance">
                    <DollarSign />
                    <span>Finance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/employees" || pathname.startsWith("/dashboard/employees/")}>
                  <Link href="/dashboard/employees">
                    <UserCog />
                    <span>Employees</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/")}>
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/dental-explorer" || pathname.startsWith("/dashboard/dental-explorer/")}>
                  <Link href="/dashboard/dental-explorer">
                    <Cuboid />
                    <span>Dental Explorer</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

       
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <span className="text-xs text-slate-500 font-medium px-2">v1.0</span>
      </SidebarFooter>
    </Sidebar>
  );
}


