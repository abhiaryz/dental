import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { emailVerificationLimiter, getClientIdentifier, checkRateLimit } from "@/lib/rate-limiter";


function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(emailVerificationLimiter, clientId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many verification requests. Please try again in ${Math.ceil((rateLimit.resetTime || 0) / 1000 / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    const { email, username, clinicCode } = await request.json();

    if (!email && !username) {
      return NextResponse.json({ error: "Email or username is required" }, { status: 400 });
    }

    // Check if user exists (by email or username)
    let user;
    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } else if (username && clinicCode) {
      user = await prisma.user.findFirst({
        where: {
          username,
          clinic: {
            clinicCode: clinicCode.toUpperCase(),
          },
        },
      });
    }

    if (!user) {
      // For security, don't reveal if email exists
      return NextResponse.json({
        message: "If an account exists, a verification email has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: "Email is already verified.",
      });
    }

    const userEmail = user.email!;

    // Delete any existing verification tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { email: userEmail },
    });

    // Generate new token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Create verification token
    await prisma.emailVerificationToken.create({
      data: {
        email: userEmail,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail({
      to: userEmail,
      verificationToken,
      userName: user.name || undefined,
    });

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification email sent successfully.",
    });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  } finally {
  }
}

