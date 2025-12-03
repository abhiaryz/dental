import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";

export const GET = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const params = await context.params;
      const { id } = params;

      // Fetch document record
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal
      );
      
      const document = await prisma.document.findFirst({
        where: {
          id,
          patient: patientWhere,
        },
      });

      if (!document) {
        return NextResponse.json(
          { error: "Document not found or access denied" },
          { status: 404 }
        );
      }

      // Validate that the document has a blob URL
      if (!document.url || !document.url.startsWith("https://")) {
        return NextResponse.json(
          { error: "Document file not found or invalid URL" },
          { status: 404 }
        );
      }

      // Redirect to the blob URL
      return NextResponse.redirect(document.url);
    } catch (error) {
      console.error("Error downloading file:", error);
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_READ],
  }
);

