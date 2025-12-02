import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";


// GET - Fetch a single appointment
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

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        patient: {
          userId: (session.user as any).id,
        },
      },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PUT - Update an appointment
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

    // Check if appointment exists and belongs to user's patients
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        patient: {
          userId: (session.user as any).id,
        },
      },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const userId = (session.user as any).id;

    const appointment = await prisma.appointment.update({
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

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.APPOINTMENT_UPDATED,
      entityType: "appointment",
      entityId: id,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: { patientId: appointment.patientId, date: appointment.date },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an appointment
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

    // Check if appointment exists and belongs to user's patients
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        patient: {
          userId: (session.user as any).id,
        },
      },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const userId = (session.user as any).id;

    await prisma.appointment.delete({
      where: {
        id,
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.APPOINTMENT_DELETED,
      entityType: "appointment",
      entityId: id,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: { patientId: existingAppointment.patientId },
    });

    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}

