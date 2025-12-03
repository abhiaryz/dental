import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

// Get dental chart (selected teeth) for treatment
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: treatmentId } = await params;

      const treatment = await prisma.treatment.findUnique({
        where: { id: treatmentId },
        select: {
          id: true,
          selectedTeeth: true,
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
        req.user.isExternal,
        req.user.clinicId
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

      // Return selected teeth as chart data
      const chart = {
        selectedTeeth: treatment.selectedTeeth || [],
      };

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

// Update dental chart (selected teeth)
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: treatmentId } = await params;
      
      let body;
      try {
        body = await req.json();
      } catch {
        throw new AppError("Invalid JSON in request body", ErrorCodes.VALIDATION_ERROR, 400);
      }

      const { chart, selectedTeeth } = body;

      // Accept either chart.selectedTeeth or selectedTeeth directly
      const teethToSave = chart?.selectedTeeth || selectedTeeth;

      if (!teethToSave || !Array.isArray(teethToSave)) {
        throw new AppError("Selected teeth data is required and must be an array", ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Validate teeth values (should be strings)
      const validatedTeeth = teethToSave.map(String);

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
        req.user.isExternal,
        req.user.clinicId
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

      // Update selected teeth
      const updatedTreatment = await prisma.treatment.update({
        where: { id: treatmentId },
        data: {
          selectedTeeth: validatedTeeth,
        },
      });

      return NextResponse.json({
        message: "Dental chart updated successfully",
        chart: {
          selectedTeeth: updatedTreatment.selectedTeeth,
        },
      });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to update dental chart");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_UPDATE],
  }
);
