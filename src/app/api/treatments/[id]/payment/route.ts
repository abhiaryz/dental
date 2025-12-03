import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { createErrorResponse, AppError, ErrorCodes } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { paymentAmountSchema, validateData } from "@/lib/validation";


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

// POST - Record payment for a treatment
export const POST = withAuth(
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
        throw new AppError("Invalid JSON in request body", ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Validate request body
      const validation = validateData(paymentAmountSchema, body);
      if (!validation.success) {
        throw new AppError("Validation failed", ErrorCodes.VALIDATION_ERROR, 400, validation.errors);
      }

      const { amount } = validation.data;

      // Build where clause with proper multi-tenancy isolation
      const where = getTreatmentWhereClause(
        id,
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
      );

      // Check if treatment exists and user has access
      const treatment = await prisma.treatment.findFirst({
        where,
      });

      if (!treatment) {
        throw new AppError("Treatment not found or access denied", ErrorCodes.NOT_FOUND, 404);
      }

      // Calculate new paid amount
      const newPaidAmount = treatment.paidAmount + amount;

      // Check if payment exceeds total cost
      if (newPaidAmount > treatment.cost) {
        throw new AppError("Payment amount exceeds total treatment cost", ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Update treatment with new payment
      const updatedTreatment = await prisma.treatment.update({
        where: {
          id,
        },
        data: {
          paidAmount: newPaidAmount,
        },
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

      return NextResponse.json({
        message: "Payment recorded successfully",
        treatment: updatedTreatment,
        remainingAmount: updatedTreatment.cost - newPaidAmount,
      });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to record payment");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_UPDATE],
  }
);
