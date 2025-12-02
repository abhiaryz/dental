import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";
import jsPDF from "jspdf";

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

      // Get template
      const template = await prisma.consentTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new AppError("Template not found", ErrorCodes.NOT_FOUND, 404);
      }

      // Create upload directory
      const consentDir = join(process.cwd(), "public", "uploads", "consents");
      if (!existsSync(consentDir)) {
        await mkdir(consentDir, { recursive: true });
      }

      let signatureUrl: string | undefined;
      let pdfUrl: string | undefined;

      // Save signature if provided
      if (signatureFile) {
        const timestamp = Date.now();
        const signatureFilename = `sig_${patientId}_${timestamp}.png`;
        const signaturePath = join(consentDir, signatureFilename);
        const bytes = await signatureFile.arrayBuffer();
        await writeFile(signaturePath, Buffer.from(bytes));
        signatureUrl = `/uploads/consents/${signatureFilename}`;
      }

      // Generate PDF
      const doc = new jsPDF();
      const timestamp = Date.now();
      const pdfFilename = `consent_${patientId}_${timestamp}.pdf`;
      const pdfPath = join(consentDir, pdfFilename);

      // Add content to PDF
      doc.setFontSize(18);
      doc.text(template.title, 20, 20);
      doc.setFontSize(12);
      
      // Add template body (simple text wrapping)
      const lines = doc.splitTextToSize(template.body, 170);
      doc.text(lines, 20, 40);

      // Add signature info
      const yPos = 40 + (lines.length * 7) + 20;
      doc.text(`Signed by: ${signedBy}`, 20, yPos);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos + 10);
      doc.text(`Patient: ${patient.firstName} ${patient.lastName}`, 20, yPos + 20);

      // Save PDF
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      await writeFile(pdfPath, pdfBuffer);
      pdfUrl = `/uploads/consents/${pdfFilename}`;

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
          ipAddress: req.ip || undefined,
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

