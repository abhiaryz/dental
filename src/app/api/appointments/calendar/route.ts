import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";


// GET - Fetch appointments for calendar view
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      patient: {
        userId: (session.user as any).id,
      },
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const appointments = await prisma.appointment.findMany({
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
      },
      orderBy: [
        { date: "asc" },
        { time: "asc" },
      ],
    });

    // Group appointments by date for calendar view
    const groupedAppointments = appointments.reduce((acc: any, appointment) => {
      const dateKey = appointment.date.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(appointment);
      return acc;
    }, {});

    return NextResponse.json({
      appointments,
      groupedByDate: groupedAppointments,
      total: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching calendar appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar appointments" },
      { status: 500 }
    );
  }
}

