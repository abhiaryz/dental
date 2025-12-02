import { NextRequest, NextResponse } from "next/server";
import { clearSuperAdminCookie, getSuperAdminSession, logSuperAdminAction } from "@/lib/super-admin-auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSuperAdminSession(request);
    
    if (session) {
      // Log the logout
      await logSuperAdminAction(session.id, "LOGOUT");
    }

    const response = NextResponse.json({ success: true });
    clearSuperAdminCookie(response);

    return response;
  } catch (error) {
    console.error("Super admin logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

