import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { hasAnyPermission, hasAllPermissions, Permissions } from "./rbac";

type Permission = typeof Permissions[keyof typeof Permissions];

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
}

export interface AuthOptions {
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, ANY permission
}

/**
 * Middleware to check authentication and authorization
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  options?: AuthOptions
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const session = await auth();

      // Check if user is authenticated
      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized - Please login" },
          { status: 401 }
        );
      }

      const userRole = (session.user as any).role as Role;
      const userId = (session.user as any).id;

      // Check permissions if required
      if (options?.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasRequiredPermissions = options.requireAll
          ? hasAllPermissions(userRole, options.requiredPermissions)
          : hasAnyPermission(userRole, options.requiredPermissions);

        if (!hasRequiredPermissions) {
          return NextResponse.json(
            { error: "Forbidden - Insufficient permissions" },
            { status: 403 }
          );
        }
      }

      // Attach user info to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: userId,
        email: session.user.email!,
        name: session.user.name!,
        role: userRole,
      };

      return handler(authenticatedReq, context);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

