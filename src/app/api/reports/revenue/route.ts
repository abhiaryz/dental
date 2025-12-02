import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

// GET - Generate revenue report
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new AppError("Please log in to access this resource", ErrorCodes.UNAUTHORIZED, 401);
    }

    const userRole = (session.user as any).role;
    const userClinicId = (session.user as any).clinicId;

    const canRead = await checkPermission(userRole, "billing", "read");
    if (!canRead) {
      throw new AppError("You don't have permission to view reports", ErrorCodes.FORBIDDEN, 403);
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly"; // monthly, quarterly, yearly
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")) : null;

    // Calculate date range
    let startDate: Date;
    let endDate: Date;

    if (period === "monthly" && month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else if (period === "quarterly") {
      const quarter = parseInt(searchParams.get("quarter") || "1");
      startDate = new Date(year, (quarter - 1) * 3, 1);
      endDate = new Date(year, quarter * 3, 0, 23, 59, 59);
    } else {
      // Yearly
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    }

    // Fetch invoices for the period
    const invoices = await prisma.invoice.findMany({
      where: {
        clinicId: userClinicId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch treatments for the period
    const treatments = await prisma.treatment.findMany({
      where: {
        clinicId: userClinicId,
        treatmentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculate summary statistics
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalPending = totalRevenue - totalPaid;

    const invoicesByStatus = {
      paid: invoices.filter(inv => inv.status === "PAID").length,
      pending: invoices.filter(inv => inv.status === "PENDING").length,
      overdue: invoices.filter(inv => inv.status === "OVERDUE").length,
    };

    // Payment method breakdown
    const paymentsByMethod: Record<string, number> = {};
    invoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        paymentsByMethod[payment.paymentMethod] = 
          (paymentsByMethod[payment.paymentMethod] || 0) + payment.amount;
      });
    });

    // Monthly breakdown (for quarterly and yearly reports)
    const monthlyBreakdown: Array<{ month: string; revenue: number; paid: number }> = [];
    if (period !== "monthly") {
      const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      for (let i = 0; i < months; i++) {
        const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0);
        
        const monthInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.createdAt);
          return invDate >= monthStart && invDate <= monthEnd;
        });

        monthlyBreakdown.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
          paid: monthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
        });
      }
    }

    return NextResponse.json({
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        label: period === "monthly" 
          ? startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : period === "quarterly"
          ? `Q${searchParams.get("quarter")} ${year}`
          : `Year ${year}`,
      },
      summary: {
        totalRevenue,
        totalPaid,
        totalPending,
        invoiceCount: invoices.length,
        treatmentCount: treatments.length,
        averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
      },
      invoicesByStatus,
      paymentsByMethod,
      monthlyBreakdown,
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt,
        patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
        amount: inv.totalAmount,
        paid: inv.paidAmount,
        status: inv.status,
      })),
      treatments: treatments.map(t => ({
        id: t.id,
        date: t.treatmentDate,
        patientName: `${t.patient.firstName} ${t.patient.lastName}`,
        diagnosis: t.diagnosis,
        cost: t.cost,
        paidAmount: t.paidAmount,
      })),
    });
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to generate report");
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

