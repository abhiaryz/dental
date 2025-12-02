import { NextRequest, NextResponse } from "next/server";
import { withSuperAdminAuth, AuthenticatedSuperAdminRequest, logSuperAdminAction } from "@/lib/super-admin-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function getHandler(
  req: AuthenticatedSuperAdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        clinicId: true,
        isExternal: true,
        clinic: {
          select: {
            id: true,
            name: true,
            clinicCode: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function patchHandler(
  req: AuthenticatedSuperAdminRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { name, email, username, role, password, clinicId } = body;

    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (clinicId) updateData.clinicId = clinicId; // Allow updating clinicId
    
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Check for unique constraints if email or username is changed
    if (email || username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            email ? { email: email, id: { not: id } } : {},
            username ? { username: username, id: { not: id } } : {},
          ],
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email or username already in use" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Log the action
    await logSuperAdminAction(
      req.superAdmin.id,
      "USER_UPDATED",
      "User",
      id,
      { updates: { ...updateData, password: password ? "CHANGED" : undefined } }
    );

    return NextResponse.json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      } 
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(getHandler);
export const PATCH = withSuperAdminAuth(patchHandler);

