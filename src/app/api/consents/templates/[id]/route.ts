import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

// Get single template
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;

      const template = await prisma.consentTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new AppError("Template not found", ErrorCodes.NOT_FOUND, 404);
      }

      return NextResponse.json({ template });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch template");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_READ],
  }
);

// Update template
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await req.json();

      const template = await prisma.consentTemplate.update({
        where: { id },
        data: body,
      });

      return NextResponse.json({
        message: "Template updated successfully",
        template,
      });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to update template");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.SETTINGS_WRITE],
  }
);

// Delete template
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;

      await prisma.consentTemplate.delete({
        where: { id },
      });

      return NextResponse.json({ message: "Template deleted successfully" });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to delete template");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.SETTINGS_WRITE],
  }
);

