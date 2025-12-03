import { NextResponse } from "next/server";
import { withSuperAdminAuth } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";

async function handler() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Active clinics (isActive flag in schema)
    const activeClinics = await prisma.clinic.count({
      where: { isActive: true },
    });

    // Paid invoices this month (used as proxy for MRR)
    const paidInvoicesThisMonth = await prisma.invoice.findMany({
      where: {
        status: "PAID",
        createdAt: {
          gte: startOfMonth,
        },
      },
      include: {
        clinic: true,
      },
    });

    const totalMRR = paidInvoicesThisMonth.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0
    );

    // Group revenue by clinic type
    const mrrByTypeMap = new Map<
      string,
      { type: string; mrr: number; count: number }
    >();

    paidInvoicesThisMonth.forEach((inv) => {
      const type = inv.clinic?.type || "UNKNOWN";
      const entry = mrrByTypeMap.get(type) || { type, mrr: 0, count: 0 };
      entry.mrr += inv.totalAmount;
      entry.count += 1;
      mrrByTypeMap.set(type, entry);
    });

    const mrrByType = Array.from(mrrByTypeMap.values());

    // Top 10 clinics by revenue this month
    const revenueByClinic = new Map<
      string,
      {
        id: string;
        name: string;
        clinicCode: string;
        revenue: number;
        firstInvoiceDate?: Date;
      }
    >();

    paidInvoicesThisMonth.forEach((inv) => {
      if (!inv.clinic) return;
      const existing = revenueByClinic.get(inv.clinic.id) || {
        id: inv.clinic.id,
        name: inv.clinic.name,
        clinicCode: inv.clinic.clinicCode,
        revenue: 0,
        firstInvoiceDate: inv.createdAt,
      };
      existing.revenue += inv.totalAmount;
      if (
        !existing.firstInvoiceDate ||
        inv.createdAt < existing.firstInvoiceDate
      ) {
        existing.firstInvoiceDate = inv.createdAt;
      }
      revenueByClinic.set(inv.clinic.id, existing);
    });

    const topClinics = Array.from(revenueByClinic.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        name: c.name,
        clinicCode: c.clinicCode,
        mrr: c.revenue,
        subscriptionStartDate: c.firstInvoiceDate || null,
      }));

    // Calculate ARR (Annual Recurring Revenue) as 12x current month paid revenue
    const arr = totalMRR * 12;

    const avgMRR = activeClinics > 0 ? totalMRR / activeClinics : 0;

    return NextResponse.json({
      revenue: {
        totalMRR,
        arr,
        avgMRR,
        activeClinics,
        mrrByType,
        topClinics,
      },
    });
  } catch (error) {
    console.error("Get revenue analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

