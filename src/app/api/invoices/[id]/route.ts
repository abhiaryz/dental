import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/rate-limiter";
import { invoiceUpdateSchema, validateData } from "@/lib/validation";


// GET - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      throw new AppError("Please log in to access this resource", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canRead = await checkPermission(userRole, "billing", "read");
    if (!canRead) {
      throw new AppError("You don't have permission to view invoices", ErrorCodes.FORBIDDEN, 403);
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
      include: {
        patient: true,
        treatment: true,
        items: true,
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", ErrorCodes.NOT_FOUND, 404);
    }

    return NextResponse.json(invoice);
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to fetch invoice");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// PUT - Update invoice
export async function PUT(
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
      throw new AppError("Please log in to access this resource", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canUpdate = await checkPermission(userRole, "billing", "update");
    if (!canUpdate) {
      throw new AppError("You don't have permission to update invoices", ErrorCodes.FORBIDDEN, 403);
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
    });

    if (!existingInvoice) {
      throw new AppError("Invoice not found", ErrorCodes.NOT_FOUND, 404);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      throw new AppError("Invalid JSON in request body", ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Validate request body
    const validation = validateData(invoiceUpdateSchema, data);
    if (!validation.success) {
      throw new AppError("Validation failed", ErrorCodes.VALIDATION_ERROR, 400, validation.errors);
    }

    const validatedData = validation.data;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: validatedData.status,
        notes: validatedData.notes,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        paidDate: validatedData.status === "PAID" ? new Date() : undefined,
      },
      include: {
        patient: true,
        treatment: true,
        items: true,
        payments: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to update invoice");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// DELETE - Delete invoice
export async function DELETE(
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
      throw new AppError("Please log in to access this resource", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canDelete = await checkPermission(userRole, "billing", "delete");
    if (!canDelete) {
      throw new AppError("You don't have permission to delete invoices", ErrorCodes.FORBIDDEN, 403);
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinicId: userClinicId,
      },
    });

    if (!existingInvoice) {
      throw new AppError("Invoice not found", ErrorCodes.NOT_FOUND, 404);
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to delete invoice");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}
