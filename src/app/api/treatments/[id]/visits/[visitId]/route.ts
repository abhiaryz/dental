import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

// Update visit
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string; visitId: string }> }) => {
    try {
      const { visitId } = await params;
      const body = await req.json();

      // Verify visit exists and user has access
      const visit = await prisma.treatmentVisit.findUnique({
        where: { id: visitId },
        include: {
          treatment: {
            include: {
              patient: true,
            },
          },
        },
      });

      if (!visit) {
        throw new AppError("Visit not found", ErrorCodes.NOT_FOUND, 404);
      }

      // Verify patient access
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal
      );
      const patient = await prisma.patient.findFirst({
        where: {
          id: visit.treatment.patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        throw new AppError("Access denied", ErrorCodes.FORBIDDEN, 403);
      }

      const updatedVisit = await prisma.treatmentVisit.update({
        where: { id: visitId },
        data: body,
      });

      return NextResponse.json({
        message: "Visit updated successfully",
        visit: updatedVisit,
      });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to update visit");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_WRITE],
  }
);

// Delete visit
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string; visitId: string }> }) => {
    try {
      const { visitId } = await params;

      // Verify visit exists and user has access
      const visit = await prisma.treatmentVisit.findUnique({
        where: { id: visitId },
        include: {
          treatment: {
            include: {
              patient: true,
            },
          },
        },
      });

      if (!visit) {
        throw new AppError("Visit not found", ErrorCodes.NOT_FOUND, 404);
      }

      // Verify patient access
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal
      );
      const patient = await prisma.patient.findFirst({
        where: {
          id: visit.treatment.patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        throw new AppError("Access denied", ErrorCodes.FORBIDDEN, 403);
      }

      await prisma.treatmentVisit.delete({
        where: { id: visitId },
      });

      return NextResponse.json({ message: "Visit deleted successfully" });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to delete visit");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_DELETE],
  }
);

