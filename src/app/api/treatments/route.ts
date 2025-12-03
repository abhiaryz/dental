import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";
import { treatmentSchema, validateData } from "@/lib/validation";
import { sanitizeTreatmentData } from "@/lib/sanitize";

// GET - Fetch all treatments based on role
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const patientId = searchParams.get("patientId");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      // Build treatment filter based on role
      const where: any = {};

      // Individual doctors can only see their own treatments
      if (req.user.isExternal || req.user.role === "EXTERNAL_DOCTOR") {
        where.userId = req.user.id;
      } else {
        // Clinic users can see treatments for patients in their clinic
        // Ensure we only fetch treatments where the patient belongs to the user's clinic
        if (req.user.clinicId) {
           where.patient = {
             clinicId: req.user.clinicId
           };
        }
      }

      // If filtering by patient, verify patient access
      if (patientId) {
        const patient = await prisma.patient.findUnique({
          where: { id: patientId },
        });

        if (!patient) {
          throw new AppError("Patient not found", ErrorCodes.NOT_FOUND, 404);
        }

        // Check if user can access this patient's treatments
        const patientWhere = getPatientWhereClause(
          req.user.id, 
          req.user.role, 
          req.user.isExternal,
          req.user.clinicId
        );
        
        const hasAccess = await prisma.patient.findFirst({
          where: {
            id: patientId,
            ...patientWhere,
          },
        });

        if (!hasAccess) {
          throw new AppError(
            "You don't have permission to access this patient's treatments",
            ErrorCodes.FORBIDDEN,
            403
          );
        }

        where.patientId = patientId;
      }

      if (startDate && endDate) {
        where.treatmentDate = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const [treatments, total] = await Promise.all([
        prisma.treatment.findMany({
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
          orderBy: { treatmentDate: "desc" },
          skip,
          take: limit,
        }),
        prisma.treatment.count({ where }),
      ]);

      return NextResponse.json({
        treatments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch treatments");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_READ],
  }
);

// POST - Create a new treatment
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
      const validation = validateData(treatmentSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.errors },
          { status: 400 }
        );
      }

      // Verify patient access based on role
      const patientWhere = getPatientWhereClause(
        req.user.id, 
        req.user.role, 
        req.user.isExternal,
        req.user.clinicId
      );
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
      const sanitizedData = sanitizeTreatmentData(validation.data);

      // Prepare treatment data
      const treatmentData: any = {
        ...sanitizedData,
        treatmentDate: new Date(sanitizedData.treatmentDate),
        patientId: sanitizedData.patientId,
        userId: req.user.id,
      };

      const treatment = await prisma.treatment.create({
        data: treatmentData,
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

      return NextResponse.json(treatment, { status: 201 });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to create treatment");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_CREATE],
  }
);

