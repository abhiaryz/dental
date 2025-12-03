import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generatePrescriptionPDF } from "@/lib/pdf-generator";

// GET - Generate and download treatment report PDF
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

    // Fetch treatment with patient data
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

    // Get user info for doctor details
    const user = await prisma.user.findUnique({
      where: {
        id: (session.user as any).id,
      },
    });

    // Calculate age from date of birth
    const age = Math.floor(
      (new Date().getTime() - new Date(treatment.patient.dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
    );

    // Prepare data for PDF generation
    const patientData = {
      id: treatment.patient.id,
      firstName: treatment.patient.firstName,
      lastName: treatment.patient.lastName,
      age,
      gender: treatment.patient.gender,
      phone: treatment.patient.mobileNumber,
      address: treatment.patient.address,
      city: treatment.patient.city,
      state: treatment.patient.state,
      pinCode: treatment.patient.pinCode,
    };

    const treatmentData = {
      id: treatment.id,
      treatmentDate: treatment.treatmentDate.toLocaleDateString(),
      treatmentType: "Dental Treatment",
      doctor: user?.name || "Dr. User",
      doctorQualification: "BDS, MDS",
      doctorRegistration: "KA/DENT/12345",
      chiefComplaint: treatment.chiefComplaint,
      diagnosis: treatment.diagnosis,
      treatmentPlan: treatment.treatmentPlan,
      medications: treatment.prescription,
      instructions: treatment.notes || "Follow post-treatment care instructions.",
      affectedTeeth: treatment.selectedTeeth,
      followupDate: treatment.followUpDate?.toLocaleDateString(),
      followupNotes: treatment.followUpNotes || undefined,
    };

    const medicalHistory = {
      conditions: treatment.patient.medicalHistory
        ? treatment.patient.medicalHistory.split(",").map((c) => c.trim())
        : [],
      allergies: treatment.patient.allergies || undefined,
      medications: treatment.patient.currentMedications || undefined,
    };

    // Generate PDF and get the blob
    const pdfDoc = generatePrescriptionPDF(patientData, treatmentData, medicalHistory);
    const pdfBlob = pdfDoc.output('arraybuffer');

    // Return PDF as downloadable file
    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="treatment-report-${treatment.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

