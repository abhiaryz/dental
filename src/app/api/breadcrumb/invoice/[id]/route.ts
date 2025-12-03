import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// GET - Fetch invoice info for breadcrumb
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        select: {
          id: true,
          invoiceNumber: true,
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      return NextResponse.json({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        patientName: `${invoice.patient.firstName} ${invoice.patient.lastName}`,
      });
    } catch (error) {
      console.error("Error fetching invoice breadcrumb:", error);
      return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
    }
  }
);

