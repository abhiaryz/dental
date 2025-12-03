import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";

// Get visits for a treatment - Feature not yet implemented
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: treatmentId } = await params;
    
    // TreatmentVisit model not yet available in schema
    // Return empty visits array for compatibility
    return NextResponse.json({ 
      visits: [],
      treatmentId,
      message: "Multi-visit tracking feature is planned for a future release" 
    });
  },
  {
    requiredPermissions: [Permissions.TREATMENT_READ],
  }
);

// Create a new visit - Feature not yet implemented
export const POST = withAuth(
  async (_req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: treatmentId } = await params;
    
    // TreatmentVisit model not yet available in schema
    return NextResponse.json(
      { 
        error: "Multi-visit tracking feature is not yet available",
        treatmentId,
      },
      { status: 501 }
    );
  },
  {
    requiredPermissions: [Permissions.TREATMENT_UPDATE],
  }
);
