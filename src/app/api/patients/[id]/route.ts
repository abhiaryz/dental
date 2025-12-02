import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, verifyPatientAccess } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";

// GET - Fetch a single patient with all related data
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      
      // Verify patient access based on role and clinic
      const { error } = await verifyPatientAccess(
        id,
        req.user.id,
        req.user.role,
        req.user.isExternal,
        prisma,
        req.user.clinicId
      );

      if (error) return error;

      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          treatments: {
            orderBy: { treatmentDate: "desc" },
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          appointments: {
            orderBy: { date: "desc" },
          },
          documents: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      // Calculate patient statistics
      const totalTreatments = patient.treatments.length;
      const totalCost = patient.treatments.reduce((sum, t) => sum + t.cost, 0);
      const totalPaid = patient.treatments.reduce((sum, t) => sum + t.paidAmount, 0);
      const pendingAmount = totalCost - totalPaid;

      const stats = {
        totalTreatments,
        totalCost,
        totalPaid,
        pendingAmount,
        totalAppointments: patient.appointments.length,
        totalDocuments: patient.documents.length,
      };

      return NextResponse.json({
        ...patient,
        stats,
      });
    } catch (error) {
      console.error("Error fetching patient:", error);
      return NextResponse.json(
        { error: "Failed to fetch patient" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.PATIENT_READ],
  }
);

// PUT - Update a patient
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      
      // Verify patient access based on role
      const { error } = await verifyPatientAccess(
        id,
        req.user.id,
        req.user.role,
        req.user.isExternal,
        prisma
      );

      if (error) return error;

      const body = await req.json();

      const patient = await prisma.patient.update({
        where: {
          id,
        },
        data: body,
      });

      return NextResponse.json(patient);
    } catch (error) {
      console.error("Error updating patient:", error);
      return NextResponse.json(
        { error: "Failed to update patient" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.PATIENT_UPDATE],
  }
);

// DELETE - Delete a patient
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      
      // Verify patient access based on role
      const { error } = await verifyPatientAccess(
        id,
        req.user.id,
        req.user.role,
        req.user.isExternal,
        prisma
      );

      if (error) return error;

      await prisma.patient.delete({
        where: {
          id,
        },
      });

      return NextResponse.json({ message: "Patient deleted successfully" });
    } catch (error) {
      console.error("Error deleting patient:", error);
      return NextResponse.json(
        { error: "Failed to delete patient" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.PATIENT_DELETE],
  }
);

