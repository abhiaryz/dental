import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

// Get dental chart for treatment
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: treatmentId } = await params;

      const treatment = await prisma.treatment.findUnique({
        where: { id: treatmentId },
        select: {
          id: true,
          toothChart: true,
          patientId: true,
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

      const chart = treatment.toothChart ? JSON.parse(treatment.toothChart) : {};

      return NextResponse.json({ chart });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch dental chart");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_READ],
  }
);

// Update dental chart
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: treatmentId } = await params;
      const body = await req.json();
      const { chart } = body;

      if (!chart) {
        throw new AppError("Chart data is required", ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Verify treatment and patient access
      const treatment = await prisma.treatment.findUnique({
        where: { id: treatmentId },
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

      // Update dental chart
      const updatedTreatment = await prisma.treatment.update({
        where: { id: treatmentId },
        data: {
          toothChart: JSON.stringify(chart),
        },
      });

      return NextResponse.json({
        message: "Dental chart updated successfully",
        chart: JSON.parse(updatedTreatment.toothChart || '{}'),
      });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to update dental chart");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_WRITE],
  }
);

