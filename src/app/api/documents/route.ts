import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";


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
      const patientWhere = getPatientWhereClause(req.user.id, req.user.role, req.user.isExternal);
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
      console.error("Error fetching documents:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
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
      const body = await req.json();

      // Validate required fields
      const requiredFields = ["patientId", "name", "type", "url"];

      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { error: `${field} is required` },
            { status: 400 }
          );
        }
      }

      // Verify patient access based on role
      const patientWhere = getPatientWhereClause(req.user.id, req.user.role, req.user.isExternal);
      const patient = await prisma.patient.findFirst({
        where: {
          id: body.patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found or access denied" },
          { status: 404 }
        );
      }

      const document = await prisma.document.create({
        data: body,
      });

      return NextResponse.json(document, { status: 201 });
    } catch (error) {
      console.error("Error creating document:", error);
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_CREATE],
  }
);

