import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rate-limiter";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

// Upload clinical image
export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    const rateLimit = await checkRateLimit(req as any, 'upload');
    if (!rateLimit.allowed) return rateLimit.error;

    try {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const patientId = formData.get("patientId") as string;
      const treatmentId = formData.get("treatmentId") as string | null;
      const type = formData.get("type") as string;
      const title = formData.get("title") as string;
      const toothNumber = formData.get("toothNumber") as string | null;
      const notes = formData.get("notes") as string | null;

      if (!file) {
        throw new AppError("No file uploaded", ErrorCodes.VALIDATION_ERROR, 400);
      }

      if (!patientId || !type || !title) {
        throw new AppError("Patient ID, type, and title are required", ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Validate image type
      const validTypes = ["XRAY", "INTRAORAL", "EXTRAORAL", "PERIAPICAL", "BITEWING", "PANORAMIC", "CEPHALOMETRIC", "CBCT", "BEFORE_TREATMENT", "DURING_TREATMENT", "AFTER_TREATMENT", "OTHER"];
      if (!validTypes.includes(type)) {
        throw new AppError("Invalid image type", ErrorCodes.VALIDATION_ERROR, 400);
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

      // Create upload directory
      const uploadDir = join(process.cwd(), "public", "uploads", "clinical-images");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${patientId}_${timestamp}_${sanitizedFileName}`;
      const filepath = join(uploadDir, filename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Create database record
      const clinicalImage = await prisma.clinicalImage.create({
        data: {
          patientId,
          treatmentId: treatmentId || undefined,
          type: type as any,
          title,
          toothNumber: toothNumber || undefined,
          notes: notes || undefined,
          fileUrl: `/uploads/clinical-images/${filename}`,
          fileSize: file.size,
          mimeType: file.type,
          capturedBy: req.user.id,
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          message: "Clinical image uploaded successfully",
          image: clinicalImage,
        },
        { status: 201 }
      );
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to upload clinical image");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_CREATE],
  }
);

// Get clinical images
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const patientId = searchParams.get("patientId");
      const treatmentId = searchParams.get("treatmentId");
      const type = searchParams.get("type");

      const where: any = {};

      if (patientId) {
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

        where.patientId = patientId;
      }

      if (treatmentId) {
        where.treatmentId = treatmentId;
      }

      if (type) {
        where.type = type;
      }

      const images = await prisma.clinicalImage.findMany({
        where,
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
        orderBy: {
          capturedAt: 'desc',
        },
      });

      return NextResponse.json({ images });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch clinical images");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_READ],
  }
);

