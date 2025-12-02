import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicCode = searchParams.get("code");

    if (!clinicCode) {
      return NextResponse.json(
        { error: "Clinic code required" },
        { status: 400 }
      );
    }

    const clinic = await prisma.clinic.findUnique({
      where: { 
        clinicCode: clinicCode.toUpperCase(),
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        clinicCode: true,
        logo: true,
        type: true,
        city: true,
        state: true,
      },
    });

    if (clinic) {
      return NextResponse.json({
        exists: true,
        clinic,
      });
    } else {
      return NextResponse.json({
        exists: false,
        message: "Clinic not found or inactive"
      });
    }
  } catch (error) {
    console.error("Error verifying clinic:", error);
    return NextResponse.json(
      { error: "Failed to verify clinic" },
      { status: 500 }
    );
  } finally {
  }
}

