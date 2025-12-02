import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";
import jsPDF from "jspdf";
import { uploadToBlob, generateBlobPath } from "@/lib/vercel-blob";

// Get patient consents
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const patientId = searchParams.get("patientId");
      const treatmentId = searchParams.get("treatmentId");
      const status = searchParams.get("status");

      const where: any = {};

      if (patientId) {
        // Verify patient access
        const patientWhere = getPatientWhereClause(
          req.user.id,
          req.user.role,
          req.user.isExternal,
          req.user.clinicId
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

      if (status) {
        where.status = status;
      }

      const consents = await prisma.patientConsent.findMany({
        where,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          template: {
            select: {
              name: true,
              title: true,
            },
          },
          treatment: {
            select: {
              diagnosis: true,
              treatmentDate: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ consents });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch consents");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_READ],
  }
);

// Create patient consent (with signature)
export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const formData = await req.formData();
      const patientId = formData.get("patientId") as string;
      const treatmentId = formData.get("treatmentId") as string | null;
      const templateId = formData.get("templateId") as string;
      const signedBy = formData.get("signedBy") as string;
      const signatureFile = formData.get("signature") as File | null;
      const notes = formData.get("notes") as string | null;

      if (!patientId || !templateId || !signedBy) {
        throw new AppError("Patient ID, template ID, and signer name are required", ErrorCodes.VALIDATION_ERROR, 400);
      }

      // Verify patient access
      const patientWhere = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
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

      // Get template
      const template = await prisma.consentTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new AppError("Template not found", ErrorCodes.NOT_FOUND, 404);
      }

      // Get clinic details if applicable
      let clinic = null;
      if (req.user.clinicId) {
        clinic = await prisma.clinic.findUnique({
          where: { id: req.user.clinicId },
        });
      }

      // Helper to replace placeholders
      const replacePlaceholders = (text: string) => {
        let result = text;
        
        // Patient details
        result = result.replace(/{{PATIENT_NAME}}/g, `${patient.firstName} ${patient.lastName}`);
        result = result.replace(/{{PATIENT_DOB}}/g, patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "N/A");
        result = result.replace(/{{PATIENT_ADDRESS}}/g, patient.address || "N/A");
        result = result.replace(/{{PATIENT_MOBILE}}/g, patient.mobileNumber || "N/A");
        
        // Clinic details
        result = result.replace(/{{CLINIC_NAME}}/g, clinic?.name || req.user.clinicName || "Clinic");
        result = result.replace(/{{CLINIC_ADDRESS}}/g, clinic?.address || "");
        result = result.replace(/{{CLINIC_PHONE}}/g, clinic?.phone || "");
        
        // Other details
        result = result.replace(/{{DOCTOR_NAME}}/g, req.user.name || "Doctor");
        result = result.replace(/{{SIGNED_BY}}/g, signedBy);
        result = result.replace(/{{DATE}}/g, new Date().toLocaleDateString());
        
        return result;
      };

      const processedBody = replacePlaceholders(template.body);
      const processedTitle = replacePlaceholders(template.title);

      let signatureUrl: string | undefined;
      // Save signature to Vercel Blob if provided
      if (signatureFile) {
        const signatureBlobPath = generateBlobPath("consent-signatures", patientId, `signature_${Date.now()}.png`);
        signatureUrl = await uploadToBlob(signatureFile, signatureBlobPath, "image/png");
      }

      // Generate PDF
      const doc = new jsPDF();
      
      // Add content to PDF
      doc.setFontSize(18);
      doc.text(processedTitle, 20, 20);
      doc.setFontSize(12);
      
      // Add template body (simple text wrapping)
      const lines = doc.splitTextToSize(processedBody, 170);
      doc.text(lines, 20, 40);

      // Add signature info
      const yPos = 40 + (lines.length * 7) + 20;
      doc.text(`Signed by: ${signedBy}`, 20, yPos);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos + 10);
      doc.text(`Patient: ${patient.firstName} ${patient.lastName}`, 20, yPos + 20);

      // Convert PDF to buffer and upload to Vercel Blob
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      const pdfBlobPath = generateBlobPath("consent-pdfs", patientId, `consent_${Date.now()}.pdf`);
      const pdfUrl = await uploadToBlob(pdfBuffer, pdfBlobPath, "application/pdf");

      // Create consent record
      const consent = await prisma.patientConsent.create({
        data: {
          patientId,
          treatmentId: treatmentId || undefined,
          templateId,
          signedBy,
          signedByUserId: req.user.id,
          signedAt: new Date(),
          signatureUrl,
          pdfUrl,
          status: "SIGNED",
          notes: notes || undefined,
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          template: {
            select: {
              name: true,
              title: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          message: "Consent signed successfully",
          consent,
        },
        { status: 201 }
      );
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to create consent");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.DOCUMENT_CREATE],
  }
);

