import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rate-limiter";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    // Apply rate limiting for file uploads
    const rateLimit = await checkRateLimit(req as any, 'upload');
    if (!rateLimit.allowed) {
      return rateLimit.error || NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    try {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const patientId = formData.get("patientId") as string;
      const name = formData.get("name") as string;
      const type = formData.get("type") as string;
      const notes = formData.get("notes") as string;

      if (!file) {
        throw new AppError("No file uploaded", ErrorCodes.VALIDATION_ERROR, 400);
      }

      if (!patientId || !type) {
        throw new AppError("Patient ID and document type are required", ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Verify patient access
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal
      );
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        throw new AppError("Patient not found or access denied", ErrorCodes.NOT_FOUND, 404);
      }

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), "public", "uploads", "documents");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${patientId}_${timestamp}_${sanitizedFileName}`;
      const filepath = join(uploadDir, filename);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Save document record to database
      const document = await prisma.document.create({
        data: {
          patientId,
          name: name || file.name,
          type,
          url: `/uploads/documents/${filename}`,
          notes: notes || undefined,
        },
      });

      return NextResponse.json(
        {
          message: "File uploaded successfully",
          document,
        },
        { status: 201 }
      );
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to upload file");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_CREATE],
  }
);

