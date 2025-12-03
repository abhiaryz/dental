import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, verifyPatientAccess } from "@/lib/auth-middleware";

// GET - Fetch patient name for breadcrumb
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
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      return NextResponse.json({
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
      });
    } catch (error) {
      console.error("Error fetching patient breadcrumb:", error);
      return NextResponse.json({ error: "Failed to fetch patient" }, { status: 500 });
    }
  }
);

