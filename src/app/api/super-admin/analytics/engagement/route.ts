import { NextResponse } from "next/server";
import { withSuperAdminAuth } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";

async function handler() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total patients across platform
    const totalPatients = await prisma.patient.count();

    // Patients created this month
    const newPatientsThisMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Total appointments
    const totalAppointments = await prisma.appointment.count();

    // Appointments this month
    const appointmentsThisMonth = await prisma.appointment.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Total treatments
    const totalTreatments = await prisma.treatment.count();

    // Treatments this month
    const treatmentsThisMonth = await prisma.treatment.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Total invoices
    const totalInvoices = await prisma.invoice.count();

    // Invoices this month
    const invoicesThisMonth = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Invoice value this month
    const invoiceValueThisMonth = await prisma.invoice.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Average patients per clinic
    const activeClinics = await prisma.clinic.count({
      where: { isActive: true },
    });
    const avgPatientsPerClinic = activeClinics > 0 ? totalPatients / activeClinics : 0;

    // Feature adoption: Dental charts (approximated by clinics with patients having treatments)
    const clinicsWithDentalCharts = await prisma.clinic.count({
      where: {
        patients: {
          some: {
            treatments: {
              some: {},
            },
          },
        },
      },
    });

    // Feature adoption: Treatment templates
    // Note: Treatment templates are not modeled in the current schema.
    // For now, we report 0 clinics using templates until the feature is implemented.
    const clinicsWithTemplates = 0;

    // Feature adoption: Patient portal
    // Note: Patient portal access is not modeled in the current schema.
    // For now, we assume 0 patients with portal access until the feature is implemented.
    const patientsWithPortalAccess = 0;

    // Engagement trend (patients created per month, last 12 months)
    const patientTrend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = date.toISOString().slice(0, 7);
      
      const count = await prisma.patient.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      patientTrend.push({
        month: monthKey,
        value: count,
      });
    }

    return NextResponse.json({
      engagement: {
        patients: {
          total: totalPatients,
          thisMonth: newPatientsThisMonth,
          avgPerClinic: avgPatientsPerClinic,
          trend: patientTrend,
        },
        appointments: {
          total: totalAppointments,
          thisMonth: appointmentsThisMonth,
        },
        treatments: {
          total: totalTreatments,
          thisMonth: treatmentsThisMonth,
        },
        invoices: {
          total: totalInvoices,
          thisMonth: invoicesThisMonth,
          valueThisMonth: invoiceValueThisMonth._sum.totalAmount || 0,
        },
        featureAdoption: {
          dentalCharts: {
            clinics: clinicsWithDentalCharts,
            percentage: activeClinics > 0 ? (clinicsWithDentalCharts / activeClinics) * 100 : 0,
          },
          treatmentTemplates: {
            clinics: clinicsWithTemplates,
            percentage: activeClinics > 0 ? (clinicsWithTemplates / activeClinics) * 100 : 0,
          },
          patientPortal: {
            patients: patientsWithPortalAccess,
            percentage: totalPatients > 0 ? (patientsWithPortalAccess / totalPatients) * 100 : 0,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get engagement analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

