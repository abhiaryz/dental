import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { createErrorResponse } from "@/lib/api-errors";
import { patientSchema, validateData } from "@/lib/validation";
import { sanitizePatientData } from "@/lib/sanitize";

// GET - Fetch all patients for the logged-in user based on role
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

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

      return NextResponse.json({
        patients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
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

