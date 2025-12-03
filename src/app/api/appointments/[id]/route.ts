import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { createErrorResponse } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";
import { appointmentUpdateSchema, validateData } from "@/lib/validation";
import { sanitizeAppointmentData } from "@/lib/sanitize";
import { cacheQuery, getCacheKey, CACHE_CONFIG } from "@/lib/query-cache";
import { Cache } from "@/lib/redis";

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

      // Cache single appointment query
      const cacheKey = getCacheKey('appointment', id, req.user.clinicId || 'no-clinic');
      const appointment = await cacheQuery(
        cacheKey,
        async () => {
          return await prisma.appointment.findFirst({
            where: {
              id,
              patient: patientWhere,
            },
            include: {
              patient: true,
            },
          });
        },
        CACHE_CONFIG.MEDIUM, // 5 minutes cache
        [`appointment-${id}`]
      );

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

      // Sanitize string fields to prevent XSS
      const sanitizedData = sanitizeAppointmentData(validation.data);

      // Prepare update data
      const updateData: any = { ...sanitizedData };
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const appointment = await prisma.appointment.update({
        where: {
          id,
        },
        data: updateData,
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

      // Invalidate appointment caches
      const cacheKey = getCacheKey('appointment', id, req.user.clinicId || 'no-clinic');
      await Cache.delete(cacheKey);
      await Cache.invalidatePattern(`appointment:*:${req.user.clinicId || 'no-clinic'}:*`);

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

      // Invalidate appointment caches
      const cacheKey = getCacheKey('appointment', id, req.user.clinicId || 'no-clinic');
      await Cache.delete(cacheKey);
      await Cache.invalidatePattern(`appointment:*:${req.user.clinicId || 'no-clinic'}:*`);

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
