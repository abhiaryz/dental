import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";


// POST - Record payment for a treatment
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

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    // Check if treatment exists and belongs to user
    const treatment = await prisma.treatment.findFirst({
      where: {
        id,
        userId: (session.user as any).id,
      },
    });

    if (!treatment) {
      return NextResponse.json({ error: "Treatment not found" }, { status: 404 });
    }

    // Calculate new paid amount
    const newPaidAmount = treatment.paidAmount + amount;

    // Check if payment exceeds total cost
    if (newPaidAmount > treatment.cost) {
      return NextResponse.json(
        { error: "Payment amount exceeds total treatment cost" },
        { status: 400 }
      );
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
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}

