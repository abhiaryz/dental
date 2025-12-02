import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

// Get visits for a treatment
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: treatmentId } = await params;

      // Verify treatment and patient access
      const treatment = await prisma.treatment.findUnique({
        where: { id: treatmentId },
        include: {
          patient: true,
        },
      });

      if (!treatment) {
        throw new AppError("Treatment not found", ErrorCodes.NOT_FOUND, 404);
      }

      // Verify patient access
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal
      );
      const patient = await prisma.patient.findFirst({
        where: {
          id: treatment.patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        throw new AppError("Access denied", ErrorCodes.FORBIDDEN, 403);
      }

      const visits = await prisma.treatmentVisit.findMany({
        where: {
          treatmentId,
        },
        orderBy: {
          visitNumber: 'asc',
        },
      });

      return NextResponse.json({ visits });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch visits");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_READ],
  }
);

// Create a new visit
export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: treatmentId } = await params;
      const body = await req.json();
      const { visitDate, notes, procedures, cost, duration, status, isBilled } = body;

      if (!visitDate) {
        throw new AppError("Visit date is required", ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Verify treatment and patient access
      const treatment = await prisma.treatment.findUnique({
        where: { id: treatmentId },
        include: {
          patient: true,
        },
      });

      if (!treatment) {
        throw new AppError("Treatment not found", ErrorCodes.NOT_FOUND, 404);
      }

      // Verify patient access
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal
      );
      const patient = await prisma.patient.findFirst({
        where: {
          id: treatment.patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        throw new AppError("Access denied", ErrorCodes.FORBIDDEN, 403);
      }

      // Get next visit number
      const lastVisit = await prisma.treatmentVisit.findFirst({
        where: { treatmentId },
        orderBy: { visitNumber: 'desc' },
      });

      const visitNumber = lastVisit ? lastVisit.visitNumber + 1 : 1;

      const visit = await prisma.treatmentVisit.create({
        data: {
          treatmentId,
          visitNumber,
          visitDate: new Date(visitDate),
          status: status || "COMPLETED",
          notes: notes || undefined,
          procedures: procedures || undefined,
          cost: cost || 0,
          duration: duration || undefined,
          performedBy: req.user.id,
          isBilled: isBilled || false,
        },
      });

      return NextResponse.json(
        {
          message: "Visit created successfully",
          visit,
        },
        { status: 201 }
      );
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to create visit");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_WRITE],
  }
);

