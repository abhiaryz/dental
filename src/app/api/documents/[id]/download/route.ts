import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
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

      // Build file path from URL
      const filepath = join(process.cwd(), "public", document.url);

      if (!existsSync(filepath)) {
        return NextResponse.json(
          { error: "File not found on server" },
          { status: 404 }
        );
      }

      // Read file
      const fileBuffer = await readFile(filepath);

      // Determine content type based on file extension
      const extension = document.url.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";

      switch (extension) {
        case "pdf":
          contentType = "application/pdf";
          break;
        case "jpg":
        case "jpeg":
          contentType = "image/jpeg";
          break;
        case "png":
          contentType = "image/png";
          break;
        case "gif":
          contentType = "image/gif";
          break;
        case "doc":
          contentType = "application/msword";
          break;
        case "docx":
          contentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          break;
        case "txt":
          contentType = "text/plain";
          break;
      }

      // Return file with appropriate headers
      return new NextResponse(fileBuffer as any, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${document.name}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
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

