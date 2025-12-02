import { NextRequest, NextResponse } from "next/server";
import { withSuperAdminAuth, AuthenticatedSuperAdminRequest } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";

async function handler(req: AuthenticatedSuperAdminRequest) {
  try {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: req.superAdmin.id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!superAdmin) {
      return NextResponse.json(
        { error: "Super admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ superAdmin });
  } catch (error) {
    console.error("Get super admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(handler);

