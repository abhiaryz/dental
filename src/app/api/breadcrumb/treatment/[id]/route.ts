import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// GET - Fetch treatment info for breadcrumb
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      
      const treatment = await prisma.treatment.findUnique({
        where: { id },
        select: {
          id: true,
          diagnosis: true,
          treatmentDate: true,
          userId: true,
          patient: {
            select: {
              firstName: true,
              lastName: true,
              clinicId: true,
            },
          },
        },
      });

      if (!treatment) {
        return NextResponse.json({ error: "Treatment not found" }, { status: 404 });
      }

      // Verify user has access to this treatment
      const isOwnTreatment = treatment.userId === req.user.id;
      const isSameClinic = req.user.clinicId && treatment.patient.clinicId === req.user.clinicId;
      
      if (!isOwnTreatment && !isSameClinic) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      return NextResponse.json({
        id: treatment.id,
        name: treatment.diagnosis || "Treatment",
        patientName: `${treatment.patient.firstName} ${treatment.patient.lastName}`,
      });
    } catch (error) {
      console.error("Error fetching treatment breadcrumb:", error);
      return NextResponse.json({ error: "Failed to fetch treatment" }, { status: 500 });
    }
  }
);

