import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { createErrorResponse } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { treatmentUpdateSchema, validateData } from "@/lib/validation";
import { sanitizeTreatmentData } from "@/lib/sanitize";

// Helper to build treatment where clause with proper multi-tenancy isolation
function getTreatmentWhereClause(
  treatmentId: string,
  userId: string,
  userRole: string,
  isExternal: boolean,
  clinicId?: string | null
) {
  const where: any = { id: treatmentId };

  // Individual doctors only see their own treatments
  if (isExternal || userRole === "EXTERNAL_DOCTOR") {
    where.userId = userId;
  } else {
    // Clinic users can only see treatments for patients in their clinic
    if (clinicId) {
      where.patient = {
        clinicId: clinicId,
        createdByExternal: false,
      };
    }
  }

  return where;
}

// GET - Fetch a single treatment
export const GET = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;

      // Build where clause with proper multi-tenancy isolation
      const where = getTreatmentWhereClause(
        id,
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
      );

      const treatment = await prisma.treatment.findFirst({
        where,
        include: {
          patient: true,
        },
      });

      if (!treatment) {
        return NextResponse.json({ error: "Treatment not found" }, { status: 404 });
      }

      return NextResponse.json(treatment);
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch treatment");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_READ],
  }
);

// PUT - Update a treatment
export const PUT = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      // Rate limiting for mutation
      const rateLimit = await checkRateLimit(req as any, 'api');
      if (!rateLimit.allowed) {
        return rateLimit.error || NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }

      const { id } = await context.params;

      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      // Validate request body
      const validation = validateData(treatmentUpdateSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.errors },
          { status: 400 }
        );
      }

      // Build where clause with proper multi-tenancy isolation
      const where = getTreatmentWhereClause(
        id,
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
      );

      // Check if treatment exists and user has access
      const existingTreatment = await prisma.treatment.findFirst({
        where,
        include: {
          patient: {
            select: {
              id: true,
              clinicId: true,
              createdByExternal: true,
            },
          },
        },
      });

      if (!existingTreatment) {
        return NextResponse.json({ error: "Treatment not found or access denied" }, { status: 404 });
      }

      // Sanitize string fields to prevent XSS
      const sanitizedData = sanitizeTreatmentData(validation.data);

      // Prepare update data
      const updateData: any = { ...sanitizedData };
      if (updateData.treatmentDate) {
        updateData.treatmentDate = new Date(updateData.treatmentDate);
      }
      if (updateData.followUpDate) {
        updateData.followUpDate = updateData.followUpDate ? new Date(updateData.followUpDate) : null;
      }

      // Use sanitized data (schema already excludes sensitive fields like userId, patientId)
      const treatment = await prisma.treatment.update({
        where: {
          id,
        },
        data: updateData,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobileNumber: true,
            },
          },
        },
      });

      return NextResponse.json(treatment);
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to update treatment");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_UPDATE],
  }
);

// DELETE - Delete a treatment
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      // Rate limiting for mutation
      const rateLimit = await checkRateLimit(req as any, 'api');
      if (!rateLimit.allowed) {
        return rateLimit.error || NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }

      const { id } = await context.params;

      // Build where clause with proper multi-tenancy isolation
      const where = getTreatmentWhereClause(
        id,
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
      );

      // Check if treatment exists and user has access
      const existingTreatment = await prisma.treatment.findFirst({
        where,
      });

      if (!existingTreatment) {
        return NextResponse.json({ error: "Treatment not found or access denied" }, { status: 404 });
      }

      await prisma.treatment.delete({
        where: {
          id,
        },
      });

      return NextResponse.json({ message: "Treatment deleted successfully" });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to delete treatment");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_DELETE],
  }
);
