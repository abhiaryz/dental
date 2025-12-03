import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { createErrorResponse } from "@/lib/api-errors";
import { patientSchema, validateData } from "@/lib/validation";
import { sanitizePatientData } from "@/lib/sanitize";
import { cacheQuery, getCacheKey, CACHE_CONFIG } from "@/lib/query-cache";
import { Cache } from "@/lib/redis";

// GET - Fetch all patients for the logged-in user based on role
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      // Filter parameters
      const gender = searchParams.get("gender");
      const minAge = searchParams.get("minAge");
      const maxAge = searchParams.get("maxAge");
      const lastVisitFrom = searchParams.get("lastVisitFrom");
      const lastVisitTo = searchParams.get("lastVisitTo");
      const status = searchParams.get("status");

      // Build where clause based on user role and clinic
      const where = getPatientWhereClause(
        req.user.id, 
        req.user.role, 
        req.user.isExternal,
        req.user.clinicId
      );

      // Add search functionality
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { mobileNumber: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      // Add gender filter
      if (gender && gender !== "all") {
        where.gender = gender;
      }

      // Add age filters (calculate from dateOfBirth)
      if (minAge || maxAge) {
        const now = new Date();
        if (maxAge) {
          const maxDate = new Date(now.getFullYear() - parseInt(maxAge), now.getMonth(), now.getDate());
          where.dateOfBirth = { ...where.dateOfBirth, gte: maxDate };
        }
        if (minAge) {
          const minDate = new Date(now.getFullYear() - parseInt(minAge) - 1, now.getMonth(), now.getDate());
          where.dateOfBirth = { ...where.dateOfBirth, lte: minDate };
        }
      }

      // Add last visit date filters
      if (lastVisitFrom || lastVisitTo) {
        where.treatments = {
          some: {
            treatmentDate: {
              ...(lastVisitFrom && { gte: new Date(lastVisitFrom) }),
              ...(lastVisitTo && { lte: new Date(lastVisitTo) }),
            },
          },
        };
      }

      // Add status filter
      if (status === "active") {
        where.treatments = { some: {} };
      } else if (status === "new") {
        where.treatments = { none: {} };
      }

      // Create cache key from query parameters
      const cacheKey = getCacheKey(
        'patients-list',
        req.user.clinicId || req.user.id,
        page,
        limit,
        search || 'no-search',
        gender || 'all',
        status || 'all',
        minAge || 'no-min',
        maxAge || 'no-max'
      );

      // Cache patient list query (frequently accessed)
      const result = await cacheQuery(
        cacheKey,
        async () => {
          const [patients, total] = await Promise.all([
            prisma.patient.findMany({
              where,
              orderBy: { createdAt: "desc" },
              skip,
              take: limit,
              include: {
                _count: {
                  select: {
                    treatments: true,
                    appointments: true,
                  },
                },
              },
            }),
            prisma.patient.count({ where }),
          ]);

          return {
            patients,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          };
        },
        CACHE_CONFIG.SHORT, // 1 minute cache (frequently changing)
        [`patients-${req.user.clinicId || req.user.id}`]
      );

      return NextResponse.json(result);
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch patients");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.PATIENT_READ],
  }
);

// POST - Create a new patient
export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
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
      const validation = validateData(patientSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.errors },
          { status: 400 }
        );
      }

      // Sanitize string fields to prevent XSS
      const sanitizedData = sanitizePatientData(validation.data);

      // Convert dateOfBirth to DateTime
      const patientData: any = {
        ...sanitizedData,
        dateOfBirth: new Date(sanitizedData.dateOfBirth),
        bloodGroup: sanitizedData.bloodGroup || null,
        height: sanitizedData.height ? parseFloat(String(sanitizedData.height)) : null,
        weight: sanitizedData.weight ? parseFloat(String(sanitizedData.weight)) : null,
        alternateMobileNumber: sanitizedData.alternateMobileNumber || null,
        email: sanitizedData.email || null,
        aadharNumber: sanitizedData.aadharNumber || null,
        emergencyContactName: sanitizedData.emergencyContactName || null,
        emergencyMobileNumber: sanitizedData.emergencyMobileNumber || null,
        relationship: sanitizedData.relationship || null,
        medicalHistory: sanitizedData.medicalHistory || null,
        dentalHistory: sanitizedData.dentalHistory || null,
        allergies: sanitizedData.allergies || null,
        currentMedications: sanitizedData.currentMedications || null,
        previousSurgeries: sanitizedData.previousSurgeries || null,
        dentalConcerns: sanitizedData.dentalConcerns || null,
        previousDentalWork: sanitizedData.previousDentalWork || null,
        preferredPaymentMode: sanitizedData.preferredPaymentMode || null,
        insuranceProvider: sanitizedData.insuranceProvider || null,
        sumInsured: sanitizedData.sumInsured ? parseFloat(String(sanitizedData.sumInsured)) : null,
        userId: req.user.id,
        clinicId: req.user.clinicId,
        createdByExternal: req.user.isExternal || req.user.role === "EXTERNAL_DOCTOR",
      };

      const patient = await prisma.patient.create({
        data: patientData,
      });

      // Invalidate patient list cache
      await Cache.invalidatePattern(`patients-list:${req.user.clinicId || req.user.id}:*`);

      return NextResponse.json(patient, { status: 201 });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to create patient");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.PATIENT_CREATE],
  }
);

