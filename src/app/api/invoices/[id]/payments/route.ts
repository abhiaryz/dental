import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { createErrorResponse, AppError, ErrorCodes } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { paymentSchema, validateData } from "@/lib/validation";


// POST - Record payment for invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting for mutation
    const rateLimit = await checkRateLimit(request, 'api');
    if (!rateLimit.allowed) {
      return rateLimit.error || NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      throw new AppError("Unauthorized", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canCreate = await checkPermission(userRole, "billing", "create");
    if (!canCreate) {
      throw new AppError("Permission denied", ErrorCodes.FORBIDDEN, 403);
    }

    // Verify invoice exists and belongs to clinic
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", ErrorCodes.NOT_FOUND, 404);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      throw new AppError("Invalid JSON in request body", ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Validate request body
    const validation = validateData(paymentSchema, data);
    if (!validation.success) {
      throw new AppError("Validation failed", ErrorCodes.VALIDATION_ERROR, 400, validation.errors);
    }

    const validatedData = validation.data;

    // Calculate total paid so far
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const newTotalPaid = totalPaid + validatedData.amount;

    // Check if payment exceeds invoice amount
    if (newTotalPaid > invoice.totalAmount) {
      throw new AppError("Payment amount exceeds invoice total", ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Use transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: id,
          amount: validatedData.amount,
          method: validatedData.paymentMethod,
          paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : new Date(),
          notes: validatedData.notes,
          recordedBy: userId,
        },
      });

      // Update invoice status if fully paid
      let updatedStatus = invoice.status;
      if (newTotalPaid >= invoice.totalAmount) {
        updatedStatus = "PAID";
        
        await tx.invoice.update({
          where: { id },
          data: {
            status: "PAID",
            paidDate: new Date(),
          },
        });
      }

      return { payment, updatedStatus };
    });

    return NextResponse.json({
      payment: result.payment,
      invoice: {
        ...invoice,
        status: result.updatedStatus,
      },
      totalPaid: newTotalPaid,
      remaining: invoice.totalAmount - newTotalPaid,
    }, { status: 201 });
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to record payment");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
