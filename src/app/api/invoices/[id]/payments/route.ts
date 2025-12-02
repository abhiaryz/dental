import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";


// POST - Record payment for invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canCreate = await checkPermission(userRole, "billing", "create");
    if (!canCreate) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
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
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.amount || !data.paymentMethod) {
      return NextResponse.json(
        { error: "Amount and payment method are required" },
        { status: 400 }
      );
    }

    // Calculate total paid so far
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    
    const newTotalPaid = totalPaid + data.amount;

    // Check if payment exceeds invoice amount
    if (newTotalPaid > invoice.totalAmount) {
      return NextResponse.json(
        { error: "Payment amount exceeds invoice total" },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: data.amount,
        method: data.paymentMethod,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        reference: data.reference || data.transactionId,
        notes: data.notes,
        recordedBy: userId,
      },
    });

    // Update invoice status if fully paid
    let updatedStatus = invoice.status;
    if (newTotalPaid >= invoice.totalAmount && data.status === "COMPLETED") {
      updatedStatus = "PAID";
      
      await prisma.invoice.update({
        where: { id },
        data: {
          status: "PAID",
          paidDate: new Date(),
        },
      });
    }

    return NextResponse.json({
      payment,
      invoice: {
        ...invoice,
        status: updatedStatus,
      },
      totalPaid: newTotalPaid,
      remaining: invoice.totalAmount - newTotalPaid,
    }, { status: 201 });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  } finally {
  }
}

