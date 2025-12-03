import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";
import { invoiceSchema, validateData } from "@/lib/validation";
import { sanitizeInvoiceData } from "@/lib/sanitize";

// Generate unique invoice number
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

// GET - List all invoices
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {};
    
    if (userClinicId) {
      where.clinicId = userClinicId;
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (patientId) {
      where.patientId = patientId;
    }

    // Search across invoice number and patient name
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobileNumber: true,
          },
        },
        treatment: {
          select: {
            id: true,
            chiefComplaint: true,
            treatmentDate: true,
          },
        },
        items: true,
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate stats
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidAmount = invoices
      .filter(inv => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pendingAmount = invoices
      .filter(inv => inv.status === "PENDING")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const overdueAmount = invoices
      .filter(inv => inv.status === "OVERDUE")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    return NextResponse.json({
      invoices,
      stats: {
        total: totalAmount,
        paid: paidAmount,
        pending: pendingAmount,
        overdue: overdueAmount,
        count: {
          total: invoices.length,
          paid: invoices.filter(inv => inv.status === "PAID").length,
          pending: invoices.filter(inv => inv.status === "PENDING").length,
          overdue: invoices.filter(inv => inv.status === "OVERDUE").length,
        },
      },
    });
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to fetch invoices");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AppError("Please log in to access this resource", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canCreate = await checkPermission(userRole, "billing", "create");
    if (!canCreate) {
      throw new AppError("You don't have permission to create invoices", ErrorCodes.FORBIDDEN, 403);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      throw new AppError("Invalid JSON in request body", ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Validate request body using Zod schema
    const validation = validateData(invoiceSchema, data);
    if (!validation.success) {
      throw new AppError("Validation failed", ErrorCodes.VALIDATION_ERROR, 400, validation.errors);
    }

    // Sanitize string fields to prevent XSS
    const sanitizedData = sanitizeInvoiceData(validation.data);

    // Calculate amounts
    const amount = sanitizedData.items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    const taxAmount = data.taxAmount || 0;
    const discountAmount = data.discountAmount || 0;
    const totalAmount = amount + taxAmount - discountAmount;

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Set due date (default: 15 days from now)
    const dueDate = sanitizedData.dueDate ? new Date(sanitizedData.dueDate) : new Date();
    if (!sanitizedData.dueDate) {
      dueDate.setDate(dueDate.getDate() + 15);
    }

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: sanitizedData.patientId,
        treatmentId: data.treatmentId || null,
        amount,
        taxAmount,
        discountAmount,
        totalAmount,
        status: data.status || "PENDING",
        dueDate,
        notes: sanitizedData.notes,
        clinicId: userClinicId,
        createdBy: userId,
        items: {
          create: sanitizedData.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        patient: true,
        treatment: true,
        items: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to create invoice");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

