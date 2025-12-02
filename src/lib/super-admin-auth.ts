import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const SUPER_ADMIN_SECRET = new TextEncoder().encode(
  process.env.SUPER_ADMIN_JWT_SECRET || "super-admin-secret-change-in-production"
);
const SUPER_ADMIN_COOKIE_NAME = "super-admin-token";
const TOKEN_EXPIRY = "8h";

export interface SuperAdminSession {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
}

export interface AuthenticatedSuperAdminRequest extends NextRequest {
  superAdmin: SuperAdminSession;
}

/**
 * Create a JWT token for super admin
 */
export async function createSuperAdminToken(superAdmin: SuperAdminSession): Promise<string> {
  const token = await new SignJWT({
    id: superAdmin.id,
    email: superAdmin.email,
    name: superAdmin.name,
    isActive: superAdmin.isActive,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(SUPER_ADMIN_SECRET);

  return token;
}

/**
 * Verify and decode super admin JWT token
 */
export async function verifySuperAdminToken(token: string): Promise<SuperAdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, SUPER_ADMIN_SECRET);
    
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      isActive: payload.isActive as boolean,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Get super admin session from request cookies
 */
export async function getSuperAdminSession(request: NextRequest): Promise<SuperAdminSession | null> {
  const token = request.cookies.get(SUPER_ADMIN_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return verifySuperAdminToken(token);
}

/**
 * Set super admin cookie in response
 */
export function setSuperAdminCookie(response: NextResponse, token: string): void {
  response.cookies.set(SUPER_ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

/**
 * Clear super admin cookie
 */
export function clearSuperAdminCookie(response: NextResponse): void {
  response.cookies.delete(SUPER_ADMIN_COOKIE_NAME);
}

/**
 * Middleware to protect super admin routes
 */
export function withSuperAdminAuth(
  handler: (req: AuthenticatedSuperAdminRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const session = await getSuperAdminSession(req);

      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized - Please login as super admin" },
          { status: 401 }
        );
      }

      if (!session.isActive) {
        return NextResponse.json(
          { error: "Account is inactive" },
          { status: 403 }
        );
      }

      // Verify super admin still exists in database
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { id: session.id },
      });

      if (!superAdmin || !superAdmin.isActive) {
        return NextResponse.json(
          { error: "Invalid session" },
          { status: 401 }
        );
      }

      // Attach super admin info to request
      const authenticatedReq = req as AuthenticatedSuperAdminRequest;
      authenticatedReq.superAdmin = session;

      return handler(authenticatedReq);
    } catch (error) {
      console.error("Super admin auth middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Create audit log for super admin actions
 */
export async function logSuperAdminAction(
  superAdminId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: superAdminId,
        action: `SUPER_ADMIN_${action}`,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

