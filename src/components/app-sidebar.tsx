"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Home, BarChart3, Settings, Users, CalendarClock, PackageSearch, DollarSign, UserCog, Cuboid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useTranslations } from 'next-intl';

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const t = useTranslations('Sidebar');

  return (
    <Sidebar 
      collapsible="icon" 
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={cn(
        "bg-gradient-to-b from-sky-50 via-emerald-50/30 to-white",
        "border-r border-white/70 backdrop-blur-xl",
        "transition-all duration-300",
        className
      )}
    >
      <SidebarHeader className="border-b border-slate-200/50">
        <div className="flex h-14 items-center gap-3 px-3">
          
          <div className="group-data-[collapsible=icon]:hidden space-y-0.5">
            <span className="text-base font-bold text-slate-900 block">DentaEdge</span>
            <span className="text-[10px] text-slate-500 block">Dental Management</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard"}
                  className="group/item"
                >
                  <Link href="/dashboard">
                    <Home className="transition-transform group-hover/item:scale-110" />
                    <span>{t('dashboard')}</span>
                    {pathname === "/dashboard" && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard/patients" || pathname.startsWith("/dashboard/patients/")}
                  className="group/item"
                >
                  <Link href="/dashboard/patients">
                    <Users className="transition-transform group-hover/item:scale-110" />
                    <span>{t('patients')}</span>
                    {(pathname === "/dashboard/patients" || pathname.startsWith("/dashboard/patients/")) && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard/appointments" || pathname.startsWith("/dashboard/appointments/")}
                  className="group/item"
                >
                  <Link href="/dashboard/appointments">
                    <CalendarClock className="transition-transform group-hover/item:scale-110" />
                    <span>{t('appointments')}</span>
                    {(pathname === "/dashboard/appointments" || pathname.startsWith("/dashboard/appointments/")) && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard/inventory" || pathname.startsWith("/dashboard/inventory/")}
                  className="group/item"
                >
                  <Link href="/dashboard/inventory">
                    <PackageSearch className="transition-transform group-hover/item:scale-110" />
                    <span>{t('inventory')}</span>
                    {(pathname === "/dashboard/inventory" || pathname.startsWith("/dashboard/inventory/")) && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard/analytics" || pathname.startsWith("/dashboard/analytics/")}
                  className="group/item"
                >
                  <Link href="/dashboard/analytics">
                    <BarChart3 className="transition-transform group-hover/item:scale-110" />
                    <span>{t('analytics')}</span>
                    {(pathname === "/dashboard/analytics" || pathname.startsWith("/dashboard/analytics/")) && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard/finance" || pathname.startsWith("/dashboard/finance/")}
                  className="group/item"
                >
                  <Link href="/dashboard/finance">
                    <DollarSign className="transition-transform group-hover/item:scale-110" />
                    <span>{t('finance')}</span>
                    {(pathname === "/dashboard/finance" || pathname.startsWith("/dashboard/finance/")) && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard/employees" || pathname.startsWith("/dashboard/employees/")}
                  className="group/item"
                >
                  <Link href="/dashboard/employees">
                    <UserCog className="transition-transform group-hover/item:scale-110" />
                    <span>{t('employees')}</span>
                    {(pathname === "/dashboard/employees" || pathname.startsWith("/dashboard/employees/")) && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/")}
                  className="group/item"
                >
                  <Link href="/dashboard/settings">
                    <Settings className="transition-transform group-hover/item:scale-110" />
                    <span>{t('settings')}</span>
                    {(pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/")) && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard/dental-explorer" || pathname.startsWith("/dashboard/dental-explorer/")}
                  className="group/item"
                >
                  <Link href="/dashboard/dental-explorer">
                    <Cuboid className="transition-transform group-hover/item:scale-110" />
                    <span>{t('dental_explorer')}</span>
                    {(pathname === "/dashboard/dental-explorer" || pathname.startsWith("/dashboard/dental-explorer/")) && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3 border-t border-slate-200/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium group-data-[collapsible=icon]:hidden">v1.0.0</span>
          <Badge variant="secondary" className="text-[10px] group-data-[collapsible=icon]:hidden">
            Beta
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
