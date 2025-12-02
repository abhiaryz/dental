import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const clinicId = req.user.clinicId;

      if (!clinicId) {
        return NextResponse.json(
          { error: "No clinic associated with user" },
          { status: 400 }
        );
      }

      const body = await req.json();

      // Update clinic
      const clinic = await prisma.clinic.update({
        where: { id: clinicId },
        data: {
          name: body.name,
          address: body.address,
          city: body.city,
          state: body.state,
          pinCode: body.pinCode,
          phone: body.phone,
          email: body.email,
          website: body.website,
          registrationNumber: body.registrationNumber,
        },
      });

      return NextResponse.json({
        message: "Clinic updated successfully",
        clinic,
      });
    } catch (error) {
      console.error("Error updating clinic:", error);
      return NextResponse.json(
        { error: "Failed to update clinic" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.CLINIC_UPDATE],
  }
);
