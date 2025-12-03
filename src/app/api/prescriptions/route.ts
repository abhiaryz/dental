import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { uploadToBlob, generateBlobPath } from "@/lib/vercel-blob";

// Get prescriptions
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const patientId = searchParams.get("patientId");
      const treatmentId = searchParams.get("treatmentId");

      const where: any = {};

      if (patientId) {
        // Verify patient access
        const patientWhere = getPatientWhereClause(
          req.user.id,
          req.user.role,
          req.user.isExternal
        );
        const patient = await prisma.patient.findFirst({
          where: {
            id: patientId,
            ...patientWhere,
          },
        });

        if (!patient) {
          throw new AppError("Patient not found or access denied", ErrorCodes.NOT_FOUND, 404);
        }

        where.patientId = patientId;
      }

      if (treatmentId) {
        where.treatmentId = treatmentId;
      }

      const prescriptions = await prisma.prescriptionPDF.findMany({
        where,
        include: {
          treatment: {
            select: {
              diagnosis: true,
              treatmentDate: true,
            },
          },
        },
        orderBy: {
          generatedAt: 'desc',
        },
      });

      return NextResponse.json({ prescriptions });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch prescriptions");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.TREATMENT_READ],
  }
);

// Generate prescription PDF
export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { treatmentId, patientId, medications, instructions } = body;

      if (!treatmentId || !patientId || !medications) {
        throw new AppError("Treatment ID, patient ID, and medications are required", ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Verify patient access
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal
      );
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        throw new AppError("Patient not found or access denied", ErrorCodes.NOT_FOUND, 404);
      }

      // Get treatment
      const treatment = await prisma.treatment.findUnique({
        where: { id: treatmentId },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!treatment) {
        throw new AppError("Treatment not found", ErrorCodes.NOT_FOUND, 404);
      }

      // Get clinic info for letterhead
      const clinic = req.user.clinicId
        ? await prisma.clinic.findUnique({
            where: { id: req.user.clinicId },
          })
        : null;

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Letterhead
      doc.setFillColor(199, 89, 48); // Primary color
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(clinic?.name || "DentaEdge Clinic", pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(clinic?.address || "Clinic Address", pageWidth / 2, 22, { align: 'center' });

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Patient Info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("PRESCRIPTION", 20, 45);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Patient: ${patient.firstName} ${patient.lastName}`, 20, 55);
      doc.text(`Age: ${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} yrs`, 20, 62);
      doc.text(`Gender: ${patient.gender}`, 20, 69);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, 55);
      doc.text(`Diagnosis: ${treatment.diagnosis}`, 20, 76);

      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 82, pageWidth - 20, 82);

      // Medications table
      const medicationData = JSON.parse(medications);
      const tableData = medicationData.map((med: any, index: number) => [
        (index + 1).toString(),
        med.name || '',
        med.dosage || '',
        med.frequency || '',
        med.duration || '',
      ]);

      autoTable(doc, {
        startY: 88,
        head: [['#', 'Medicine', 'Dosage', 'Frequency', 'Duration']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [199, 89, 48] },
        styles: { fontSize: 10 },
      });

      // Instructions
      const finalY = (doc as any).lastAutoTable.finalY || 120;
      
      if (instructions) {
        doc.setFont('helvetica', 'bold');
        doc.text("Instructions:", 20, finalY + 15);
        doc.setFont('helvetica', 'normal');
        const instructionLines = doc.splitTextToSize(instructions, pageWidth - 40);
        doc.text(instructionLines, 20, finalY + 22);
      }

      // Doctor signature
      const signatureY = finalY + (instructions ? 45 : 30);
      doc.line(pageWidth - 80, signatureY, pageWidth - 20, signatureY);
      doc.setFontSize(10);
      doc.text(`Dr. ${treatment.user.name || 'Doctor Name'}`, pageWidth - 80, signatureY + 7);
      doc.setFontSize(8);
      doc.text("Authorized Signature", pageWidth - 80, signatureY + 12);

      // Convert PDF to buffer and upload to Vercel Blob
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      const pdfBlobPath = generateBlobPath("prescriptions", patientId, `prescription_${Date.now()}.pdf`);
      const pdfUrl = await uploadToBlob(pdfBuffer, pdfBlobPath, "application/pdf");

      // Create database record
      const prescription = await prisma.prescriptionPDF.create({
        data: {
          treatmentId,
          patientId,
          pdfUrl,
          medications,
          instructions: instructions || undefined,
          generatedBy: req.user.id,
        },
      });

      return NextResponse.json(
        {
          message: "Prescription generated successfully",
          prescription,
          pdfUrl,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Prescription generation error:", error);
      const errorResponse = createErrorResponse(error, "Failed to generate prescription");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.PRESCRIPTION_CREATE],
  }
);

