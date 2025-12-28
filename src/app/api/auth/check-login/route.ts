import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";


export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check rate limiting
    const rateLimit = await checkRateLimit(request, 'auth');
    if (!rateLimit.allowed) {
      return rateLimit.error;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        canLogin: true, // Don't reveal if user exists
      });
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      return NextResponse.json({
        canLogin: false,
        error: `Account is locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minutes.`,
        errorType: "account_locked",
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json({
        canLogin: false,
        error: "Please verify your email before logging in. Check your inbox for the verification link.",
        errorType: "email_not_verified",
        email: user.email,
      });
    }

    return NextResponse.json({
      canLogin: true,
    });
  } catch (error) {
    console.error("Check login error:", error);
    return NextResponse.json({
      canLogin: true, // Fail open on error
    });
  } finally {
  }
}

