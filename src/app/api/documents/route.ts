import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { documentUploadSchema, validateData } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";
import { createErrorResponse } from "@/lib/api-errors";


// GET - Fetch all documents for a patient
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const patientId = searchParams.get("patientId");

      if (!patientId) {
        return NextResponse.json(
          { error: "Patient ID is required" },
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
          id: patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found or access denied" },
          { status: 404 }
        );
      }

      const documents = await prisma.document.findMany({
        where: {
          patientId,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(documents);
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch documents");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_READ],
  }
);

// POST - Create a new document record
// Note: File upload should be handled separately (e.g., using uploadthing, cloudinary, etc.)
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
      const validation = validateData(documentUploadSchema, body);
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

      // Sanitize string fields
      const documentData = {
        patientId: validation.data.patientId,
        name: sanitizeText(validation.data.name),
        type: validation.data.type,
        url: validation.data.url || body.url, // URL from validated data or fallback
        notes: validation.data.notes ? sanitizeText(validation.data.notes) : undefined,
      };

      const document = await prisma.document.create({
        data: documentData,
      });

      return NextResponse.json(document, { status: 201 });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to create document");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_CREATE],
  }
);

