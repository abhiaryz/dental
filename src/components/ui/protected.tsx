"use client";

import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { hasPermission, hasAnyPermission, hasAllPermissions, Permissions } from "@/lib/rbac";

type Permission = typeof Permissions[keyof typeof Permissions];

interface ProtectedProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  requiredRoles?: Role[];
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

/**
 * Protected component that conditionally renders children based on user permissions or roles
 * 
 * @example
 * // Single permission check
 * <Protected requiredPermissions={[Permissions.PATIENT_DELETE]}>
 *   <DeleteButton />
 * </Protected>
 * 
 * @example
 * // Multiple permissions (ANY)
 * <Protected requiredPermissions={[Permissions.PATIENT_CREATE, Permissions.PATIENT_UPDATE]}>
 *   <PatientForm />
 * </Protected>
 * 
 * @example
 * // Multiple permissions (ALL)
 * <Protected 
 *   requiredPermissions={[Permissions.PATIENT_DELETE, Permissions.FINANCE_READ]}
 *   requireAll={true}
 * >
 *   <AdminPanel />
 * </Protected>
 * 
 * @example
 * // Role-based check
 * <Protected requiredRoles={["ADMIN", "CLINIC_DOCTOR"]}>
 *   <TreatmentPlanning />
 * </Protected>
 */
export function Protected({
  children,
  requiredPermissions = [],
  requireAll = false,
  requiredRoles = [],
  fallback = null,
  showLoading = false,
}: ProtectedProps) {
  const { data: session, status } = useSession();

  // Show loading state if requested
  if (status === "loading" && showLoading) {
    return <>{fallback}</>;
  }

  // Not authenticated
  if (!session?.user) {
    return <>{fallback}</>;
  }

  const userRole = (session.user as any).role as Role;

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission-based access if permissions are specified
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(userRole, requiredPermissions)
      : hasAnyPermission(userRole, requiredPermissions);

    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { data: session } = useSession();
  
  if (!session?.user) return false;
  
  const userRole = (session.user as any).role as Role;
  return hasPermission(userRole, permission);
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { data: session } = useSession();
  
  if (!session?.user) return false;
  
  const userRole = (session.user as any).role as Role;
  return hasAnyPermission(userRole, permissions);
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { data: session } = useSession();
  
  if (!session?.user) return false;
  
  const userRole = (session.user as any).role as Role;
  return hasAllPermissions(userRole, permissions);
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: Role): boolean {
  const { data: session } = useSession();
  
  if (!session?.user) return false;
  
  const userRole = (session.user as any).role as Role;
  return userRole === role;
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: Role[]): boolean {
  const { data: session } = useSession();
  
  if (!session?.user) return false;
  
  const userRole = (session.user as any).role as Role;
  return roles.includes(userRole);
}

/**
 * Hook to get current user's role
 */
export function useUserRole(): Role | null {
  const { data: session } = useSession();
  
  if (!session?.user) return null;
  
  return (session.user as any).role as Role;
}

/**
 * Hook to check if user is external doctor
 */
export function useIsExternalDoctor(): boolean {
  const { data: session } = useSession();
  
  if (!session?.user) return false;
  
  return (session.user as any).isExternal === true || (session.user as any).role === "EXTERNAL_DOCTOR";
}

