import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { createErrorResponse } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";
import { appointmentUpdateSchema, validateData } from "@/lib/validation";

// GET - Fetch a single appointment
export const GET = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;

      // Build patient where clause with proper multi-tenancy isolation
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
      );

      const appointment = await prisma.appointment.findFirst({
        where: {
          id,
          patient: patientWhere,
        },
        include: {
          patient: true,
        },
      });

      if (!appointment) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }

      return NextResponse.json(appointment);
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch appointment");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.APPOINTMENT_READ],
  }
);

// PUT - Update an appointment
export const PUT = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      // Rate limiting for mutation
      const rateLimit = await checkRateLimit(req as any, 'api');
      if (!rateLimit.allowed) {
        return rateLimit.error || NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }

      const { id } = await context.params;

      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      // Validate request body
      const validation = validateData(appointmentUpdateSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.errors },
          { status: 400 }
        );
      }

      // Build patient where clause with proper multi-tenancy isolation
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
      );

      // Check if appointment exists and user has access
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          patient: patientWhere,
        },
      });

      if (!existingAppointment) {
        return NextResponse.json({ error: "Appointment not found or access denied" }, { status: 404 });
      }

      const appointment = await prisma.appointment.update({
        where: {
          id,
        },
        data: validation.data,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobileNumber: true,
            },
          },
        },
      });

      // Audit log
      await createAuditLog({
        userId: req.user.id,
        action: AuditActions.APPOINTMENT_UPDATED,
        entityType: "appointment",
        entityId: id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || undefined,
        metadata: { patientId: appointment.patientId, date: appointment.date },
      });

      return NextResponse.json(appointment);
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to update appointment");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.APPOINTMENT_UPDATE],
  }
);

// DELETE - Delete an appointment
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      // Rate limiting for mutation
      const rateLimit = await checkRateLimit(req as any, 'api');
      if (!rateLimit.allowed) {
        return rateLimit.error || NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }

      const { id } = await context.params;

      // Build patient where clause with proper multi-tenancy isolation
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
      );

      // Check if appointment exists and user has access
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id,
          patient: patientWhere,
        },
      });

      if (!existingAppointment) {
        return NextResponse.json({ error: "Appointment not found or access denied" }, { status: 404 });
      }

      await prisma.appointment.delete({
        where: {
          id,
        },
      });

      // Audit log
      await createAuditLog({
        userId: req.user.id,
        action: AuditActions.APPOINTMENT_DELETED,
        entityType: "appointment",
        entityId: id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || undefined,
        metadata: { patientId: existingAppointment.patientId },
      });

      return NextResponse.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to delete appointment");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.APPOINTMENT_DELETE],
  }
);
