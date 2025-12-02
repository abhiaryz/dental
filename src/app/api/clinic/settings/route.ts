import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const clinicId = req.user.clinicId;

      if (!clinicId) {
        return NextResponse.json({
          isNew: true,
          name: "",
          logo: null,
          address: "",
          city: "",
          state: "",
          pinCode: "",
          phone: "",
          email: "",
          website: "",
          registrationNumber: "",
        });
      }

      const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
        select: {
          id: true,
          name: true,
          logo: true,
          address: true,
          city: true,
          state: true,
          pinCode: true,
          phone: true,
          email: true,
          website: true,
          registrationNumber: true,
        },
      });

      if (!clinic) {
        return NextResponse.json(
          { error: "Clinic not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(clinic);
    } catch (error) {
      console.error("Error fetching clinic settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch clinic settings" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.SETTINGS_READ],
  }
);

