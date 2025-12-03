import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { createErrorResponse } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { deleteFromBlob } from "@/lib/vercel-blob";

// GET - Fetch a single document
export const GET = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;

      // Build patient where clause with proper multi-tenancy isolation
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
      );

      const document = await prisma.document.findFirst({
        where: {
          id,
          patient: patientWhere,
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      return NextResponse.json(document);
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch document");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.PATIENT_READ],
  }
);

// DELETE - Delete a document
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      // Rate limiting for mutation
      const rateLimit = await checkRateLimit(req as any, 'api');
      if (!rateLimit.allowed) {
        return rateLimit.error || NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }

      const { id } = await context.params;

      // Build patient where clause with proper multi-tenancy isolation
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
      );

      // Check if document exists and user has access via patient
      const existingDocument = await prisma.document.findFirst({
        where: {
          id,
          patient: patientWhere,
        },
      });

      if (!existingDocument) {
        return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
      }

      // Delete file from Vercel Blob if it's a blob URL
      try {
        // Check if it's a blob URL (starts with https://) or legacy local path
        if (existingDocument.url.startsWith("https://")) {
          await deleteFromBlob(existingDocument.url);
        }
        // Note: Legacy local paths (/uploads/...) are not deleted from blob
        // They may still exist in the public folder but won't be accessible after deployment
      } catch (error) {
        console.error("Failed to delete file from blob:", error);
        // Continue with database deletion even if file deletion fails
      }

      await prisma.document.delete({
        where: {
          id,
        },
      });

      return NextResponse.json({ message: "Document deleted successfully" });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to delete document");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.PATIENT_UPDATE],
  }
);
