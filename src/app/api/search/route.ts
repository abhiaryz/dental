import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";

// GET - Global search across patients, appointments, invoices, treatments
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = searchParams.get("query");

      if (!query || query.trim().length < 2) {
        return NextResponse.json({
          patients: [],
          appointments: [],
          invoices: [],
          treatments: [],
        });
      }

      const searchQuery = query.trim();

      // Build where clause based on user role and clinic
      const whereClause = getPatientWhereClause(
        req.user.id,
        req.user.role,
        req.user.isExternal,
        req.user.clinicId
      );

      // Search patients
      const patients = await prisma.patient.findMany({
        where: {
          ...whereClause,
          OR: [
            { firstName: { contains: searchQuery, mode: "insensitive" } },
            { lastName: { contains: searchQuery, mode: "insensitive" } },
            { mobileNumber: { contains: searchQuery } },
            { email: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mobileNumber: true,
        },
      });

      // Search appointments
      const appointments = await prisma.appointment.findMany({
        where: {
          patient: whereClause,
          OR: [
            {
              patient: {
                OR: [
                  { firstName: { contains: searchQuery, mode: "insensitive" } },
                  { lastName: { contains: searchQuery, mode: "insensitive" } },
                ],
              },
            },
            { type: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          date: true,
          time: true,
          type: true,
          status: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { date: "desc" },
      });

      // Search invoices
      const invoices = await prisma.invoice.findMany({
        where: {
          patient: whereClause,
          OR: [
            { invoiceNumber: { contains: searchQuery, mode: "insensitive" } },
            {
              patient: {
                OR: [
                  { firstName: { contains: searchQuery, mode: "insensitive" } },
                  { lastName: { contains: searchQuery, mode: "insensitive" } },
                ],
              },
            },
          ],
        },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          status: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Search treatments
      const treatments = await prisma.treatment.findMany({
        where: {
          patient: whereClause,
          OR: [
            { diagnosis: { contains: searchQuery, mode: "insensitive" } },
            { treatmentPlan: { contains: searchQuery, mode: "insensitive" } },
            {
              patient: {
                OR: [
                  { firstName: { contains: searchQuery, mode: "insensitive" } },
                  { lastName: { contains: searchQuery, mode: "insensitive" } },
                ],
              },
            },
          ],
        },
        take: 5,
        select: {
          id: true,
          diagnosis: true,
          treatmentDate: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { treatmentDate: "desc" },
      });

      return NextResponse.json({
        patients,
        appointments,
        invoices,
        treatments,
      });
    } catch (error) {
      console.error("Error in global search:", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }
  }
);

