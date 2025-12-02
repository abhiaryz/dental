import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

// Get consent templates
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const category = searchParams.get("category");
      const isActive = searchParams.get("isActive");

      const where: any = {};

      if (category) {
        where.category = category;
      }

      if (isActive !== null) {
        where.isActive = isActive === 'true';
      }

      // Filter by clinic if user has one
      if (req.user.clinicId) {
        where.OR = [
          { clinicId: req.user.clinicId },
          { clinicId: null }, // Global templates
        ];
      }

      const templates = await prisma.consentTemplate.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ templates });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch consent templates");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_READ],
  }
);

// Create consent template
export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { name, title, body: templateBody, category, requiresSignature } = body;

      if (!name || !title || !templateBody) {
        throw new AppError("Name, title, and body are required", ErrorCodes.VALIDATION_ERROR, 400);
      }

      const template = await prisma.consentTemplate.create({
        data: {
          name,
          title,
          body: templateBody,
          category: category || undefined,
          requiresSignature: requiresSignature !== false,
          clinicId: req.user.clinicId || undefined,
          createdBy: req.user.id,
        },
      });

      return NextResponse.json(
        {
          message: "Consent template created successfully",
          template,
        },
        { status: 201 }
      );
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to create consent template");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.SETTINGS_WRITE],
  }
);

