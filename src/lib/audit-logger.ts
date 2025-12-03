import { prisma } from "@/lib/prisma";

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 * 
 * Uses the shared Prisma instance to avoid connection pool exhaustion.
 * Never disconnects - the shared instance manages connections automatically.
 * 
 * @param data - Audit log data
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
    // Don't throw - logging should never break the application
    // In production, consider sending to error monitoring service
  }
  // Removed $disconnect() - using shared Prisma instance
  // Disconnecting after every audit log was causing connection pool exhaustion
}

// Audit action constants
export const AuditActions = {
  USER_SIGNUP: "user:signup",
  USER_LOGIN: "user:login",
  USER_LOGOUT: "user:logout",
  USER_LOGIN_FAILED: "user:login:failed",
  EMAIL_VERIFIED: "email:verified",
  PASSWORD_RESET_REQUESTED: "password:reset:requested",
  PASSWORD_RESET_COMPLETED: "password:reset:completed",
  PASSWORD_CHANGED: "password:changed",
  INVITATION_SENT: "invitation:sent",
  INVITATION_ACCEPTED: "invitation:accepted",
  INVITATION_REVOKED: "invitation:revoked",
  CLINIC_CREATED: "clinic:created",
  SESSION_CREATED: "session:created",
  SESSION_REVOKED: "session:revoked",
  EMPLOYEE_UPDATED: "employee:updated",
  EMPLOYEE_DELETED: "employee:deleted",
  PROFILE_UPDATED: "profile:updated",
  APPOINTMENT_CREATED: "appointment:created",
  APPOINTMENT_UPDATED: "appointment:updated",
  APPOINTMENT_DELETED: "appointment:deleted",
} as const;

