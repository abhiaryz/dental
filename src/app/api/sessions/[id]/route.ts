import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getClientIdentifier } from "@/lib/rate-limiter";


// DELETE - Revoke a specific session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const clientId = getClientIdentifier(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find the session
    const userSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!userSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify the session belongs to the user
    if (userSession.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the session
    await prisma.session.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking session:", error);
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 }
    );
  } finally {
  }
}

