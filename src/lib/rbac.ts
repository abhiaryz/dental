import { Role } from "@prisma/client";

// Permission definitions
export const Permissions = {
  // Patient Management
  PATIENT_CREATE: "patient:create",
  PATIENT_READ: "patient:read",
  PATIENT_UPDATE: "patient:update",
  PATIENT_DELETE: "patient:delete",
  PATIENT_READ_ALL: "patient:read:all", // Read all clinic patients
  
  // Clinical/Treatment
  TREATMENT_CREATE: "treatment:create",
  TREATMENT_READ: "treatment:read",
  TREATMENT_UPDATE: "treatment:update",
  TREATMENT_DELETE: "treatment:delete",
  TREATMENT_FINALIZE: "treatment:finalize",
  
  // Prescriptions
  PRESCRIPTION_CREATE: "prescription:create",
  PRESCRIPTION_FINALIZE: "prescription:finalize",
  
  // Appointments
  APPOINTMENT_CREATE: "appointment:create",
  APPOINTMENT_READ: "appointment:read",
  APPOINTMENT_UPDATE: "appointment:update",
  APPOINTMENT_DELETE: "appointment:delete",
  
  // Finance
  FINANCE_READ: "finance:read",
  FINANCE_CREATE_INVOICE: "finance:create:invoice",
  FINANCE_FINALIZE_INVOICE: "finance:finalize:invoice",
  FINANCE_PROCESS_PAYMENT: "finance:process:payment",
  
  // Inventory
  INVENTORY_READ: "inventory:read",
  INVENTORY_UPDATE: "inventory:update",
  INVENTORY_MANAGE: "inventory:manage",
  
  // Staff Management
  STAFF_READ: "staff:read",
  STAFF_CREATE: "staff:create",
  STAFF_UPDATE: "staff:update",
  STAFF_DELETE: "staff:delete",
  
  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",
  
  // Analytics
  ANALYTICS_READ: "analytics:read",
  ANALYTICS_ADVANCED: "analytics:advanced",
  
  // RAG/AI Features
  RAG_DIAGNOSIS: "rag:diagnosis",
  RAG_TREATMENT_PLAN: "rag:treatment:plan",
  RAG_CLINICAL_SUMMARY: "rag:clinical:summary",
  RAG_BASIC_QUESTIONS: "rag:basic:questions",
  RAG_PATIENT_EDUCATION: "rag:patient:education",
  
  // Documents
  DOCUMENT_CREATE: "document:create",
  DOCUMENT_READ: "document:read",
  DOCUMENT_UPDATE: "document:update",
  DOCUMENT_DELETE: "document:delete",
} as const;

type Permission = typeof Permissions[keyof typeof Permissions];

// Role-Permission mapping
export const RolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    // Full access to everything
    Permissions.PATIENT_CREATE,
    Permissions.PATIENT_READ,
    Permissions.PATIENT_UPDATE,
    Permissions.PATIENT_DELETE,
    Permissions.PATIENT_READ_ALL,
    Permissions.TREATMENT_CREATE,
    Permissions.TREATMENT_READ,
    Permissions.TREATMENT_UPDATE,
    Permissions.TREATMENT_DELETE,
    Permissions.TREATMENT_FINALIZE,
    Permissions.PRESCRIPTION_CREATE,
    Permissions.PRESCRIPTION_FINALIZE,
    Permissions.APPOINTMENT_CREATE,
    Permissions.APPOINTMENT_READ,
    Permissions.APPOINTMENT_UPDATE,
    Permissions.APPOINTMENT_DELETE,
    Permissions.FINANCE_READ,
    Permissions.FINANCE_CREATE_INVOICE,
    Permissions.FINANCE_FINALIZE_INVOICE,
    Permissions.FINANCE_PROCESS_PAYMENT,
    Permissions.INVENTORY_READ,
    Permissions.INVENTORY_UPDATE,
    Permissions.INVENTORY_MANAGE,
    Permissions.STAFF_READ,
    Permissions.STAFF_CREATE,
    Permissions.STAFF_UPDATE,
    Permissions.STAFF_DELETE,
    Permissions.SETTINGS_READ,
    Permissions.SETTINGS_UPDATE,
    Permissions.ANALYTICS_READ,
    Permissions.ANALYTICS_ADVANCED,
    Permissions.RAG_DIAGNOSIS,
    Permissions.RAG_TREATMENT_PLAN,
    Permissions.RAG_CLINICAL_SUMMARY,
    Permissions.RAG_BASIC_QUESTIONS,
    Permissions.RAG_PATIENT_EDUCATION,
    Permissions.DOCUMENT_CREATE,
    Permissions.DOCUMENT_READ,
    Permissions.DOCUMENT_UPDATE,
    Permissions.DOCUMENT_DELETE,
  ],
  
  CLINIC_DOCTOR: [
    // Full clinical access
    Permissions.PATIENT_CREATE,
    Permissions.PATIENT_READ,
    Permissions.PATIENT_UPDATE,
    Permissions.PATIENT_READ_ALL,
    Permissions.TREATMENT_CREATE,
    Permissions.TREATMENT_READ,
    Permissions.TREATMENT_UPDATE,
    Permissions.TREATMENT_FINALIZE,
    Permissions.PRESCRIPTION_CREATE,
    Permissions.PRESCRIPTION_FINALIZE,
    Permissions.APPOINTMENT_CREATE,
    Permissions.APPOINTMENT_READ,
    Permissions.APPOINTMENT_UPDATE,
    Permissions.FINANCE_READ,
    Permissions.INVENTORY_READ,
    Permissions.ANALYTICS_READ,
    Permissions.RAG_DIAGNOSIS,
    Permissions.RAG_TREATMENT_PLAN,
    Permissions.RAG_CLINICAL_SUMMARY,
    Permissions.RAG_BASIC_QUESTIONS,
    Permissions.RAG_PATIENT_EDUCATION,
    Permissions.DOCUMENT_CREATE,
    Permissions.DOCUMENT_READ,
    Permissions.DOCUMENT_UPDATE,
    Permissions.DOCUMENT_DELETE,
  ],
  
  HYGIENIST: [
    // Limited clinical, operational access
    Permissions.PATIENT_READ,
    Permissions.PATIENT_READ_ALL,
    Permissions.TREATMENT_CREATE, // Can create initial notes
    Permissions.TREATMENT_READ,
    Permissions.TREATMENT_UPDATE, // Can update but not finalize
    Permissions.APPOINTMENT_READ,
    Permissions.INVENTORY_READ,
    Permissions.RAG_BASIC_QUESTIONS,
    Permissions.RAG_PATIENT_EDUCATION,
    Permissions.DOCUMENT_READ,
  ],
  
  RECEPTIONIST: [
    // Operational core
    Permissions.PATIENT_READ, // Read-only demographics
    Permissions.PATIENT_READ_ALL,
    Permissions.APPOINTMENT_CREATE,
    Permissions.APPOINTMENT_READ,
    Permissions.APPOINTMENT_UPDATE,
    Permissions.APPOINTMENT_DELETE,
    Permissions.FINANCE_READ,
    Permissions.FINANCE_CREATE_INVOICE,
    Permissions.FINANCE_FINALIZE_INVOICE,
    Permissions.FINANCE_PROCESS_PAYMENT,
    Permissions.INVENTORY_READ,
    Permissions.DOCUMENT_READ,
  ],
  
  EXTERNAL_DOCTOR: [
    // Individual Doctor (Full access to own data)
    Permissions.PATIENT_CREATE,
    Permissions.PATIENT_READ,
    Permissions.PATIENT_UPDATE,
    Permissions.PATIENT_DELETE,
    Permissions.PATIENT_READ_ALL, // Access to all own patients
    Permissions.TREATMENT_CREATE,
    Permissions.TREATMENT_READ,
    Permissions.TREATMENT_UPDATE,
    Permissions.TREATMENT_FINALIZE,
    Permissions.PRESCRIPTION_CREATE,
    Permissions.PRESCRIPTION_FINALIZE,
    Permissions.APPOINTMENT_CREATE,
    Permissions.APPOINTMENT_READ,
    Permissions.APPOINTMENT_UPDATE,
    Permissions.APPOINTMENT_DELETE,
    Permissions.FINANCE_READ,
    Permissions.FINANCE_CREATE_INVOICE,
    Permissions.FINANCE_FINALIZE_INVOICE,
    Permissions.FINANCE_PROCESS_PAYMENT,
    Permissions.RAG_DIAGNOSIS,
    Permissions.RAG_TREATMENT_PLAN,
    Permissions.RAG_CLINICAL_SUMMARY,
    Permissions.RAG_BASIC_QUESTIONS,
    Permissions.RAG_PATIENT_EDUCATION,
    Permissions.DOCUMENT_CREATE,
    Permissions.DOCUMENT_READ,
    Permissions.DOCUMENT_UPDATE,
    Permissions.DOCUMENT_DELETE,
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

// Role hierarchy check
export function canAccessAllPatients(role: Role): boolean {
  return hasPermission(role, Permissions.PATIENT_READ_ALL);
}

export function isExternalDoctor(role: Role): boolean {
  return role === "EXTERNAL_DOCTOR";
}

export function canFinalizeDocuments(role: Role): boolean {
  return hasPermission(role, Permissions.TREATMENT_FINALIZE);
}

export function canManageStaff(role: Role): boolean {
  return role === "ADMIN";
}

export function canAccessFinance(role: Role): boolean {
  return hasPermission(role, Permissions.FINANCE_READ);
}

export function canManageInventory(role: Role): boolean {
  return hasPermission(role, Permissions.INVENTORY_MANAGE);
}

// Get readable role name
export function getRoleName(role: Role): string {
  const roleNames: Record<Role, string> = {
    ADMIN: "Admin/Owner",
    CLINIC_DOCTOR: "Clinic Doctor",
    HYGIENIST: "Hygienist/Assistant",
    RECEPTIONIST: "Receptionist/Staff",
    EXTERNAL_DOCTOR: "Individual Doctor",
  };
  return roleNames[role];
}

// Get role description
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    ADMIN: "Full system access. Can manage all modules, users, and clinic-wide settings.",
    CLINIC_DOCTOR: "Full clinical access. Can manage patient records, treatments, and access all AI features.",
    HYGIENIST: "Limited clinical access. Can input vitals, create notes, and access patient education.",
    RECEPTIONIST: "Operational access. Can manage appointments, billing, and view patient demographics.",
    EXTERNAL_DOCTOR: "Full access to own patients, appointments, and finance. Independent of any clinic.",
  };
  return descriptions[role];
}

// Get available roles for user creation (only admin can create users)
export function getAvailableRoles(): Role[] {
  return ["ADMIN", "CLINIC_DOCTOR", "HYGIENIST", "RECEPTIONIST", "EXTERNAL_DOCTOR"];
}

// Helper function to convert resource and action to permission
function getPermissionKey(resource: string, action: string): Permission | null {
  const key = `${resource.toUpperCase()}_${action.toUpperCase()}`;
  
  // Map resource:action combinations to permission keys
  const permissionMap: Record<string, keyof typeof Permissions> = {
    "INVENTORY_READ": "INVENTORY_READ",
    "INVENTORY_UPDATE": "INVENTORY_UPDATE",
    "INVENTORY_CREATE": "INVENTORY_MANAGE",
    "INVENTORY_DELETE": "INVENTORY_MANAGE",
    "INVENTORY_MANAGE": "INVENTORY_MANAGE",
    
    "BILLING_READ": "FINANCE_READ",
    "BILLING_CREATE": "FINANCE_CREATE_INVOICE",
    "BILLING_UPDATE": "FINANCE_FINALIZE_INVOICE",
    "BILLING_DELETE": "FINANCE_READ",
    
    "EMPLOYEES_READ": "STAFF_READ",
    "EMPLOYEES_CREATE": "STAFF_CREATE",
    "EMPLOYEES_UPDATE": "STAFF_UPDATE",
    "EMPLOYEES_DELETE": "STAFF_DELETE",
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

