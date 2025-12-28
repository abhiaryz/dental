import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIdentifier } from "@/lib/rate-limiter";
import { sendWelcomeEmail } from "@/lib/email";


export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    const clientId = getClientIdentifier(request);

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find the verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 404 });
    }

    // Check if token has expired
    if (new Date() > verificationToken.expiresAt) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json(
        { error: "This verification link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update user's email verification status
    const user = await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
    });

    // Delete the used verification token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Send welcome email
    await sendWelcomeEmail({
      to: user.email!,
      userName: user.name || "User",
    });

    return NextResponse.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Failed to verify email. Please try again." },
      { status: 500 }
    );
  } finally {
  }
}

