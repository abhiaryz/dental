import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

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
      const body = await req.json();

      // Validate required fields
      const requiredFields = [
        "firstName",
        "lastName",
        "dateOfBirth",
        "gender",
        "mobileNumber",
        "address",
        "city",
        "state",
        "pinCode",
      ];

      for (const field of requiredFields) {
        if (!body[field]) {
          throw new AppError(
            `${field} is required`,
            ErrorCodes.VALIDATION_ERROR,
            400
          );
        }
      }

      // Convert dateOfBirth to DateTime if it's just a date string
      if (body.dateOfBirth && typeof body.dateOfBirth === "string") {
        body.dateOfBirth = new Date(body.dateOfBirth);
      }

      // Extract only the fields that exist in the Patient model
      const patientData = {
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        bloodGroup: body.bloodGroup || null,
        height: body.height ? parseFloat(body.height) : null,
        weight: body.weight ? parseFloat(body.weight) : null,
        mobileNumber: body.mobileNumber,
        alternateMobileNumber: body.alternateMobileNumber || null,
        email: body.email || null,
        address: body.address,
        city: body.city,
        state: body.state,
        pinCode: body.pinCode,
        aadharNumber: body.aadharNumber || null,
        emergencyContactName: body.emergencyContactName || null,
        emergencyMobileNumber: body.emergencyMobileNumber || null,
        relationship: body.relationship || null,
        medicalHistory: body.medicalHistory || null,
        dentalHistory: body.dentalHistory || null,
        allergies: body.allergies || null,
        currentMedications: body.currentMedications || null,
        previousSurgeries: body.previousSurgeries || null,
        dentalConcerns: body.dentalConcerns || null,
        previousDentalWork: body.previousDentalWork || null,
        preferredPaymentMode: body.preferredPaymentMode || null,
        insuranceProvider: body.insuranceProvider || null,
        sumInsured: body.sumInsured ? parseFloat(body.sumInsured) : null,
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

