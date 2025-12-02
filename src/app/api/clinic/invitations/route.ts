import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendInvitationEmail } from "@/lib/email";
import { createAuditLog, AuditActions } from "@/lib/audit-logger";
import { invitationLimiter, getClientIdentifier, checkRateLimit } from "@/lib/rate-limiter";
import crypto from "crypto";


function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const clientId = getClientIdentifier(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userClinicId = (session.user as any).clinicId;
    const userName = (session.user as any).name;

    // Rate limiting
    const rateLimit = await checkRateLimit(invitationLimiter, userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Daily invitation limit reached. Please try again tomorrow.`,
        },
        { status: 429 }
      );
    }

    if (!userClinicId) {
      return NextResponse.json({ error: "No clinic associated with user" }, { status: 400 });
    }

    const data = await request.json();
    const { invitations } = data;

    if (!invitations || !Array.isArray(invitations) || invitations.length === 0) {
      return NextResponse.json({ error: "No invitations provided" }, { status: 400 });
    }

    // Get clinic details
    const clinic = await prisma.clinic.findUnique({
      where: { id: userClinicId },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const results = {
      sent: [] as string[],
      failed: [] as { email: string; error: string }[],
    };

    // Process each invitation
    for (const invitation of invitations) {
      const { email, role } = invitation;

      if (!email || !role) {
        results.failed.push({ email: email || "unknown", error: "Missing email or role" });
        continue;
      }

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          results.failed.push({ email, error: "User already exists with this email" });
          continue;
        }

        // Check if invitation already exists and is pending
        const existingInvitation = await prisma.invitation.findFirst({
          where: {
            email,
            clinicId: userClinicId,
            status: "pending",
          },
        });

        if (existingInvitation) {
          results.failed.push({ email, error: "Pending invitation already exists" });
          continue;
        }

        // Generate invitation token
        const token = generateInvitationToken();

        // Create invitation in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

        await prisma.invitation.create({
          data: {
            email,
            role,
            token,
            clinicId: userClinicId,
            createdBy: userId,
            expiresAt,
            status: "pending",
          },
        });

        // Send invitation email
        const emailResult = await sendInvitationEmail({
          to: email,
          clinicName: clinic.name,
          clinicCode: clinic.clinicCode,
          role,
          invitedBy: userName || "Admin",
          invitationToken: token,
        });

        if (emailResult.success) {
          results.sent.push(email);
          
          // Create audit log for successful invitation
          await createAuditLog({
            userId,
            action: AuditActions.INVITATION_SENT,
            entityType: "invitation",
            ipAddress: clientId,
            userAgent: request.headers.get("user-agent") || undefined,
            metadata: { email, role, clinicId: userClinicId },
          });
        } else {
          results.failed.push({ email, error: "Failed to send email" });
        }
      } catch (error) {
        console.error(`Error processing invitation for ${email}:`, error);
        results.failed.push({ email, error: "Internal error" });
      }
    }

    return NextResponse.json({
      message: "Invitations processed",
      results,
    });
  } catch (error) {
    console.error("Invitations error:", error);
    return NextResponse.json(
      { error: "Failed to process invitations" },
      { status: 500 }
    );
  } finally {
  }
}

