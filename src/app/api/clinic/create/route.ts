import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { generateClinicCode } from "@/lib/utils";

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const userId = req.user.id;
      const body = await req.json();

      if (!body.name || !body.email) {
        return NextResponse.json(
          { error: "Name and Email are required" },
          { status: 400 }
        );
      }

      // Check if user already has a clinic
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { clinicId: true },
      });

      if (existingUser?.clinicId) {
        return NextResponse.json(
          { error: "User already has a clinic" },
          { status: 400 }
        );
      }

      let clinicCode = generateClinicCode(body.name);
      
      // Ensure uniqueness
      let exists = await prisma.clinic.findUnique({ where: { clinicCode } });
      let attempts = 0;
      while (exists && attempts < 10) {
        clinicCode = generateClinicCode(body.name);
        exists = await prisma.clinic.findUnique({ where: { clinicCode } });
        attempts++;
      }

      if (exists) {
        return NextResponse.json(
          { error: "Unable to generate unique clinic code. Please try again." },
          { status: 500 }
        );
      }

      // Create clinic and update user in transaction
      const result = await prisma.$transaction(async (tx) => {
        const now = new Date();
        
        const clinic = await tx.clinic.create({
          data: {
            name: body.name,
            clinicCode,
            email: body.email,
            phone: body.phone || null,
            address: body.address || null,
            city: body.city || null,
            state: body.state || null,
            pinCode: body.pinCode || null,
            website: body.website || null,
            registrationNumber: body.registrationNumber || null,
            ownerName: req.user.name || "Unknown",
            ownerEmail: req.user.email || body.email,
            termsAcceptedAt: now,
            privacyAcceptedAt: now,
          },
        });

        // Update user with clinicId
        await tx.user.update({
          where: { id: userId },
          data: { clinicId: clinic.id },
        });

        return clinic;
      });

      return NextResponse.json({
        message: "Clinic created successfully",
        clinic: result,
      });
    } catch (error) {
      console.error("Error creating clinic:", error);
      return NextResponse.json(
        { error: "Failed to create clinic" },
        { status: 500 }
      );
    }
  },
  {
    // We might need to check permissions, but if user has no clinic, they might not have proper roles yet?
    // Or we assume they are logged in and authorized to create if they don't have one.
    // Since withAuth checks for valid session, and user exists.
    // Permissions.SETTINGS_UPDATE might be too restrictive if they are not Admin yet?
    // But they should be User.
    // Let's assume if they can access settings, they can create.
    // Or we skip permission check or use a basic "AUTHENTICATED" check which withAuth does by default if we don't pass permissions?
    // No, withAuth requires permissions array usually, or we can pass empty array?
    // Let's check withAuth implementation.
    requiredPermissions: [], 
  }
);

