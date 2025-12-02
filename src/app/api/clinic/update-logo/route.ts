import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";
import { uploadToBlob, generateBlobPath } from "@/lib/vercel-blob";

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const clinicId = req.user.clinicId;

      if (!clinicId) {
        return NextResponse.json(
          { error: "No clinic associated with user" },
          { status: 400 }
        );
      }

      const formData = await req.formData();
      const file = formData.get("logo") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 400 }
        );
      }

      // Generate blob path and upload to Vercel Blob
      const blobPath = generateBlobPath("clinic-logos", clinicId, file.name);
      const logoUrl = await uploadToBlob(file, blobPath, file.type);

      // Update clinic record
      const clinic = await prisma.clinic.update({
        where: { id: clinicId },
        data: {
          logo: logoUrl,
        },
      });

      return NextResponse.json({
        message: "Logo uploaded successfully",
        logo: clinic.logo,
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      return NextResponse.json(
        { error: "Failed to upload logo" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.SETTINGS_UPDATE],
  }
);

