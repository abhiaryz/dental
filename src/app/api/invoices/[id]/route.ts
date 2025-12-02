import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";


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

    const data = await request.json();

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paidDate: data.status === "PAID" ? new Date() : undefined,
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

