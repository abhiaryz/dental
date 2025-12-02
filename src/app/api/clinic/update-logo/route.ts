import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/rbac";

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

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), "public", "uploads", "clinic");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const filename = `logo_${clinicId}_${timestamp}.${extension}`;
      const filepath = join(uploadDir, filename);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Update clinic record
      const clinic = await prisma.clinic.update({
        where: { id: clinicId },
        data: {
          logo: `/uploads/clinic/${filename}`,
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
    requiredPermissions: [Permissions.CLINIC_UPDATE],
  }
);

