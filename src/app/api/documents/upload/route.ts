import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rate-limiter";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

// Allowed MIME types for document uploads
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Spreadsheets
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx',
  '.xls', '.xlsx',
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate file MIME type and extension
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type '${file.type}' is not allowed. Allowed types: images, PDF, Word, Excel` 
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { 
      valid: false, 
      error: `File extension '${extension}' is not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}` 
    };
  }

  // Additional validation: Check if extension matches MIME type
  const mimeExtensionMap: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  };

  const allowedExtensionsForMime = mimeExtensionMap[file.type];
  if (allowedExtensionsForMime && !allowedExtensionsForMime.includes(extension)) {
    return { 
      valid: false, 
      error: `File extension '${extension}' does not match MIME type '${file.type}'` 
    };
  }

  return { valid: true };
}

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

      // Validate file MIME type and extension
      const fileValidation = validateFile(file);
      if (!fileValidation.valid) {
        throw new AppError(fileValidation.error!, ErrorCodes.VALIDATION_ERROR, 400);
      }

      if (!patientId || !type) {
        throw new AppError("Patient ID and document type are required", ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Validate document type enum
      const validDocumentTypes = ['X_RAY', 'PRESCRIPTION', 'LAB_REPORT', 'TREATMENT_PLAN', 'CONSENT_FORM', 'INSURANCE', 'OTHER'];
      if (!validDocumentTypes.includes(type)) {
        throw new AppError(`Invalid document type. Allowed types: ${validDocumentTypes.join(', ')}`, ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Verify patient access with proper clinic isolation
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
        throw new AppError("Patient not found or access denied", ErrorCodes.NOT_FOUND, 404);
      }

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), "public", "uploads", "documents");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Generate unique filename with sanitization
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
