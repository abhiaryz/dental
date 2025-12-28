import { Role } from "@prisma/client";

// Permission definitions
export const Permissions = {
  // Prescriptions
  PRESCRIPTION_CREATE: "prescription:create",
  PRESCRIPTION_FINALIZE: "prescription:finalize",
  
  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",
  
  // RAG/AI Features
  RAG_DIAGNOSIS: "rag:diagnosis",
  RAG_TREATMENT_PLAN: "rag:treatment:plan",
  RAG_CLINICAL_SUMMARY: "rag:clinical:summary",
  RAG_BASIC_QUESTIONS: "rag:basic:questions",
  RAG_PATIENT_EDUCATION: "rag:patient:education",
} as const;

type Permission = typeof Permissions[keyof typeof Permissions];

// Role-Permission mapping
export const RolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    // Full access to everything
    Permissions.PRESCRIPTION_CREATE,
    Permissions.PRESCRIPTION_FINALIZE,
    Permissions.SETTINGS_READ,
    Permissions.SETTINGS_UPDATE,
    Permissions.RAG_DIAGNOSIS,
    Permissions.RAG_TREATMENT_PLAN,
    Permissions.RAG_CLINICAL_SUMMARY,
    Permissions.RAG_BASIC_QUESTIONS,
    Permissions.RAG_PATIENT_EDUCATION,
  ],
  
  USER: [
    // Standard user access
    Permissions.PRESCRIPTION_CREATE,
    Permissions.PRESCRIPTION_FINALIZE,
    Permissions.RAG_DIAGNOSIS,
    Permissions.RAG_TREATMENT_PLAN,
    Permissions.RAG_CLINICAL_SUMMARY,
    Permissions.RAG_BASIC_QUESTIONS,
    Permissions.RAG_PATIENT_EDUCATION,
  ],
};

// Helper functions
export function hasPermission(role: Role, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) || false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

export function isExternalDoctor(role: Role): boolean {
  return false; // No longer used with simplified roles
}

export function canFinalizeDocuments(role: Role): boolean {
  return hasPermission(role, Permissions.PRESCRIPTION_FINALIZE);
}

export function canManageStaff(role: Role): boolean {
  return role === "ADMIN";
}


// Get readable role name
export function getRoleName(role: Role): string {
  const roleNames: Record<Role, string> = {
    ADMIN: "Administrator",
    USER: "User",
  };
  return roleNames[role];
}

// Get role description
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    ADMIN: "Full system access. Can manage all modules, users, and settings.",
    USER: "Standard user access. Can manage patients and access all clinical features.",
  };
  return descriptions[role];
}

// Get available roles for user creation (only admin can create users)
export function getAvailableRoles(): Role[] {
  return ["ADMIN", "USER"];
}

// Helper function to convert resource and action to permission
function getPermissionKey(resource: string, action: string): Permission | null {
  const key = `${resource.toUpperCase()}_${action.toUpperCase()}`;
  
  // Map resource:action combinations to permission keys
  const permissionMap: Record<string, keyof typeof Permissions> = {
  };
  
  const permissionKey = permissionMap[key];
  return permissionKey ? Permissions[permissionKey] : null;
}

// Permission check function for API routes
export async function checkPermission(role: any, resource: string, action: string): Promise<boolean> {
  const permission = getPermissionKey(resource, action);
  if (!permission) {
    return false;
  }
  return hasPermission(role, permission);
}

