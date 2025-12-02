import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { hasPermission, hasAnyPermission, hasAllPermissions, Permissions } from "./rbac";

type Permission = typeof Permissions[keyof typeof Permissions];

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    isExternal: boolean;
    clinicId?: string | null;
    clinicName?: string | null;
    clinicCode?: string | null;
  };
}

export interface AuthOptions {
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, ANY permission
}

/**
 * Middleware to check authentication and authorization
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  options?: AuthOptions
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const session = await auth();

      // Check if user is authenticated
      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized - Please login" },
          { status: 401 }
        );
      }

      const userRole = (session.user as any).role as Role;
      const userId = (session.user as any).id;
      const isExternal = (session.user as any).isExternal || false;
      const clinicId = (session.user as any).clinicId || null;
      const clinicName = (session.user as any).clinicName || null;
      const clinicCode = (session.user as any).clinicCode || null;

      // Check permissions if required
      if (options?.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasRequiredPermissions = options.requireAll
          ? hasAllPermissions(userRole, options.requiredPermissions)
          : hasAnyPermission(userRole, options.requiredPermissions);

        if (!hasRequiredPermissions) {
          return NextResponse.json(
            { error: "Forbidden - Insufficient permissions" },
            { status: 403 }
          );
        }
      }

      // Attach user info to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: userId,
        email: session.user.email!,
        name: session.user.name!,
        role: userRole,
        isExternal,
        clinicId,
        clinicName,
        clinicCode,
      };

      return handler(authenticatedReq, context);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper to check if user can access a specific patient
 */
export function canAccessPatient(
  userRole: Role,
  userId: string,
  patientUserId: string,
  isExternalDoctor: boolean,
  patientCreatedByExternal: boolean,
  userClinicId?: string | null,
  patientClinicId?: string | null
): boolean {
  // Individual doctors can only access their own patients
  if (isExternalDoctor || userRole === "EXTERNAL_DOCTOR") {
    return patientUserId === userId;
  }

  // Cannot access external doctor's patients (unless you are that doctor, covered above)
  if (patientCreatedByExternal) {
    return false;
  }

  // Clinic-based access control
  if (userClinicId && patientClinicId) {
    // User must be from the same clinic as the patient
    if (userClinicId !== patientClinicId) {
      return false;
    }
  }

  // Admin and clinic doctors can access all clinic patients (within their clinic)
  if (userRole === "ADMIN" || userRole === "CLINIC_DOCTOR") {
    return true;
  }

  // Hygienists and Receptionists can view all clinic patients (within their clinic)
  if (userRole === "HYGIENIST" || userRole === "RECEPTIONIST") {
    return true;
  }

  return false;
}

/**
 * Helper to get where clause for patient queries based on user role and clinic
 */
export function getPatientWhereClause(
  userId: string, 
  userRole: Role, 
  isExternal: boolean, 
  clinicId?: string | null
) {
  const where: any = {};

  // Individual doctors only see their own patients
  if (isExternal || userRole === "EXTERNAL_DOCTOR") {
    where.userId = userId;
  } else {
    // Clinic staff see patients from their clinic only
    where.createdByExternal = false;
    
    // If user belongs to a clinic, filter by clinic
    if (clinicId) {
      where.clinicId = clinicId;
    }
  }

  return where;
}

/**
 * Helper to verify patient access and return error if unauthorized
 */
export async function verifyPatientAccess(
  patientId: string,
  userId: string,
  userRole: Role,
  isExternal: boolean,
  prisma: any,
  userClinicId?: string | null
): Promise<{ patient: any; error: NextResponse | null }> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    return {
      patient: null,
      error: NextResponse.json({ error: "Patient not found" }, { status: 404 }),
    };
  }

  if (!canAccessPatient(
    userRole, 
    userId, 
    patient.userId, 
    isExternal, 
    patient.createdByExternal,
    userClinicId,
    patient.clinicId
  )) {
    return {
      patient: null,
      error: NextResponse.json(
        { error: "Forbidden - Cannot access this patient" },
        { status: 403 }
      ),
    };
  }

  return { patient, error: null };
}

