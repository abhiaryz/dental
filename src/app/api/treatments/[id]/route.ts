import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";


// GET - Fetch a single treatment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const treatment = await prisma.treatment.findFirst({
      where: {
        id,
        userId: (session.user as any).id,
      },
      include: {
        patient: true,
      },
    });

    if (!treatment) {
      return NextResponse.json({ error: "Treatment not found" }, { status: 404 });
    }

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Error fetching treatment:", error);
    return NextResponse.json(
      { error: "Failed to fetch treatment" },
      { status: 500 }
    );
  }
}

// PUT - Update a treatment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check if treatment exists and belongs to user
    const existingTreatment = await prisma.treatment.findFirst({
      where: {
        id,
        userId: (session.user as any).id,
      },
    });

    if (!existingTreatment) {
      return NextResponse.json({ error: "Treatment not found" }, { status: 404 });
    }

    const treatment = await prisma.treatment.update({
      where: {
        id,
      },
      data: body,
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
    console.error("Error updating treatment:", error);
    return NextResponse.json(
      { error: "Failed to update treatment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a treatment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if treatment exists and belongs to user
    const existingTreatment = await prisma.treatment.findFirst({
      where: {
        id,
        userId: (session.user as any).id,
      },
    });

    if (!existingTreatment) {
      return NextResponse.json({ error: "Treatment not found" }, { status: 404 });
    }

    await prisma.treatment.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Treatment deleted successfully" });
  } catch (error) {
    console.error("Error deleting treatment:", error);
    return NextResponse.json(
      { error: "Failed to delete treatment" },
      { status: 500 }
    );
  }
}

