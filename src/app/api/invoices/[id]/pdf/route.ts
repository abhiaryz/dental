import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/pdf-generator";

export const GET = withAuth(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const params = await context.params;
      const { id } = params;

      // Fetch invoice with patient and items
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          patient: true,
          items: true,
          payments: true,
        },
      });

      if (!invoice) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 }
        );
      }

      // Prepare patient data
      const patientData = {
        id: invoice.patient.id,
        firstName: invoice.patient.firstName,
        lastName: invoice.patient.lastName,
        age: invoice.patient.dateOfBirth
          ? Math.floor(
              (Date.now() - new Date(invoice.patient.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 0,
        gender: invoice.patient.gender,
        phone: invoice.patient.mobileNumber,
        address: invoice.patient.address,
        city: invoice.patient.city,
        state: invoice.patient.state,
        pinCode: invoice.patient.pinCode,
      };

      // Calculate paid amount from payments
      const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);

      // Prepare invoice/treatment data for PDF generator
      const treatmentData = {
        id: invoice.id,
        treatmentDate: invoice.createdAt.toISOString().split("T")[0],
        treatmentType: "Invoice",
        doctor: "Clinic",
        chiefComplaint: "",
        diagnosis: "",
        treatmentPlan: "",
        medications: "",
        instructions: invoice.notes || "",
        receiptNumber: invoice.invoiceNumber,
        treatmentCost: invoice.totalAmount.toString(),
        amountPaid: paidAmount.toString(),
        balanceAmount: (invoice.totalAmount - paidAmount).toString(),
        paymentStatus: invoice.status,
        paymentMode: invoice.payments.length > 0
          ? invoice.payments[invoice.payments.length - 1].method
          : "N/A",
        paymentDate: invoice.payments.length > 0
          ? invoice.payments[invoice.payments.length - 1].paymentDate.toISOString().split("T")[0]
          : undefined,
        items: invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          total: (item.quantity * item.unitPrice).toString(),
        })),
      };

      // Generate PDF
      const pdfDoc = generateInvoicePDF(patientData, treatmentData);
      const pdfBlob = pdfDoc.output("arraybuffer");

      // Return PDF as downloadable file
      return new NextResponse(pdfBlob, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        },
      });
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      return NextResponse.json(
        { error: "Failed to generate invoice PDF" },
        { status: 500 }
      );
    }
  },
  {}
);

