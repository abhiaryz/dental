import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";
import { deleteFromBlob } from "@/lib/vercel-blob";

// Get single clinical image
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;

      const image = await prisma.clinicalImage.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          treatment: {
            select: {
              diagnosis: true,
              treatmentDate: true,
            },
          },
        },
      });

      if (!image) {
        throw new AppError("Clinical image not found", ErrorCodes.NOT_FOUND, 404);
      }

      // Verify access
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal
      );
      const patient = await prisma.patient.findFirst({
        where: {
          id: image.patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        throw new AppError("Access denied", ErrorCodes.FORBIDDEN, 403);
      }

      return NextResponse.json({ image });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch clinical image");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_READ],
  }
);

// Delete clinical image
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;

      const image = await prisma.clinicalImage.findUnique({
        where: { id },
      });

      if (!image) {
        throw new AppError("Clinical image not found", ErrorCodes.NOT_FOUND, 404);
      }

      // Verify access
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal
      );
      const patient = await prisma.patient.findFirst({
        where: {
          id: image.patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        throw new AppError("Access denied", ErrorCodes.FORBIDDEN, 403);
      }

      // Delete file from Vercel Blob
      try {
        // Check if it's a blob URL (starts with https://) or local path
        if (image.fileUrl.startsWith("https://")) {
          await deleteFromBlob(image.fileUrl);
        }
      } catch (error) {
        console.error("Failed to delete file from blob:", error);
        // Continue with database deletion even if file deletion fails
      }

      // Delete database record
      await prisma.clinicalImage.delete({
        where: { id },
      });

      return NextResponse.json({ message: "Clinical image deleted successfully" });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to delete clinical image");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_DELETE],
  }
);

