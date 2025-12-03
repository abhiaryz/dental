import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { createErrorResponse } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { appointmentSchema, validateData } from "@/lib/validation";
import { sanitizeAppointmentData } from "@/lib/sanitize";
import { cacheAppointmentQuery, getCacheKey, CACHE_CONFIG } from "@/lib/query-cache";
import { Cache } from "@/lib/redis";

// GET - Fetch all appointments based on role
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const patientId = searchParams.get("patientId");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const status = searchParams.get("status");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      // Build patient filter based on user role with proper clinic isolation
      const patientWhere = getPatientWhereClause(req.user.id, req.user.role, req.user.isExternal, req.user.clinicId);

      const where: any = {
        patient: patientWhere,
      };

      if (patientId) {
        where.patientId = patientId;
      }

      if (status) {
        where.status = status;
      }

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      } else if (startDate) {
        where.date = {
          gte: new Date(startDate),
        };
      }

      // Cache appointment list query
      const result = await cacheAppointmentQuery(
        {
          clinicId: req.user.clinicId,
          patientId: patientId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: status || undefined,
        },
        async () => {
          const [appointments, total] = await Promise.all([
            prisma.appointment.findMany({
              where,
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
              orderBy: [
                { date: "asc" },
                { time: "asc" },
              ],
              skip,
              take: limit,
            }),
            prisma.appointment.count({ where }),
          ]);

          return {
            appointments,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          };
        },
        CACHE_CONFIG.SHORT // 1 minute cache
      );

      return NextResponse.json(result);
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch appointments");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.APPOINTMENT_READ],
  }
);

// POST - Create a new appointment
export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      // Rate limiting for mutation
      const rateLimit = await checkRateLimit(req as any, 'api');
      if (!rateLimit.allowed) {
        return rateLimit.error || NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }

      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      // Validate request body using Zod schema
      const validation = validateData(appointmentSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.errors },
          { status: 400 }
        );
      }

      // Verify patient access based on role with proper clinic isolation
      const patientWhere = getPatientWhereClause(req.user.id, req.user.role, req.user.isExternal, req.user.clinicId);
      const patient = await prisma.patient.findFirst({
        where: {
          id: validation.data.patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found or access denied" },
          { status: 404 }
        );
      }

      // Sanitize string fields to prevent XSS
      const sanitizedData = sanitizeAppointmentData(validation.data);

      // Prepare appointment data
      const appointmentData: any = {
        ...sanitizedData,
        date: new Date(sanitizedData.date),
        patientId: sanitizedData.patientId,
      };

      const appointment = await prisma.appointment.create({
        data: appointmentData,
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

      // Invalidate appointment caches
      await Cache.invalidatePattern(`appointment:*:${req.user.clinicId || 'no-clinic'}:*`);

      return NextResponse.json(appointment, { status: 201 });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to create appointment");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.APPOINTMENT_CREATE],
  }
);

