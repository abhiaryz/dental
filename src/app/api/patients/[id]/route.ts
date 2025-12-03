import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, verifyPatientAccess } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { patientUpdateSchema, validateData } from "@/lib/validation";
import { sanitizePatientData } from "@/lib/sanitize";
import { createErrorResponse } from "@/lib/api-errors";
import { cachePatientQuery, getCacheKey, CACHE_CONFIG } from "@/lib/query-cache";
import { Cache } from "@/lib/redis";

// GET - Fetch a single patient with all related data
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      
      // Verify patient access based on role and clinic
      const { error } = await verifyPatientAccess(
        id,
        req.user.id,
        req.user.role,
        req.user.isExternal,
        prisma,
        req.user.clinicId
      );

      if (error) return error;

      // Cache patient detail query (heavy query with multiple includes)
      const result = await cachePatientQuery(
        id,
        req.user.clinicId,
        async () => {
          const patient = await prisma.patient.findUnique({
            where: { id },
            include: {
              treatments: {
                orderBy: { treatmentDate: "desc" },
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              appointments: {
                orderBy: { date: "desc" },
              },
              documents: {
                orderBy: { createdAt: "desc" },
              },
            },
          });

          if (!patient) {
            return null;
          }

          // Calculate patient statistics
          const totalTreatments = patient.treatments.length;
          const totalCost = patient.treatments.reduce((sum, t) => sum + t.cost, 0);
          const totalPaid = patient.treatments.reduce((sum, t) => sum + t.paidAmount, 0);
          const pendingAmount = totalCost - totalPaid;

          const stats = {
            totalTreatments,
            totalCost,
            totalPaid,
            pendingAmount,
            totalAppointments: patient.appointments.length,
            totalDocuments: patient.documents.length,
          };

          return {
            ...patient,
            stats,
          };
        },
        CACHE_CONFIG.MEDIUM // 5 minutes cache
      );

      if (!result) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      return NextResponse.json(result);
    } catch (error) {
      console.error("Error fetching patient:", error);
      return NextResponse.json(
        { error: "Failed to fetch patient" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.PATIENT_READ],
  }
);

// PUT - Update a patient
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      
      // Verify patient access based on role and clinic
      const { error } = await verifyPatientAccess(
        id,
        req.user.id,
        req.user.role,
        req.user.isExternal,
        prisma,
        req.user.clinicId
      );

      if (error) return error;

      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      // Validate request body
      const validation = validateData(patientUpdateSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.errors },
          { status: 400 }
        );
      }

      // Sanitize string fields to prevent XSS
      const sanitizedData = sanitizePatientData(validation.data);

      // Convert dateOfBirth to Date if provided
      const updateData: any = { ...sanitizedData };
      if (updateData.dateOfBirth && typeof updateData.dateOfBirth === "string") {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      // Remove any fields that shouldn't be updated directly
      delete updateData.userId;
      delete updateData.clinicId;
      delete updateData.createdByExternal;

      const patient = await prisma.patient.update({
        where: {
          id,
        },
        data: updateData,
      });

      // Invalidate patient cache
      const cacheKey = getCacheKey('patient', id, req.user.clinicId || 'no-clinic');
      await Cache.delete(cacheKey);
      await Cache.invalidatePattern(`patient:*:${req.user.clinicId || 'no-clinic'}:*`);

      return NextResponse.json(patient);
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to update patient");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.PATIENT_UPDATE],
  }
);

// DELETE - Delete a patient
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      
      // Verify patient access based on role and clinic
      const { error } = await verifyPatientAccess(
        id,
        req.user.id,
        req.user.role,
        req.user.isExternal,
        prisma,
        req.user.clinicId
      );

      if (error) return error;

      await prisma.patient.delete({
        where: {
          id,
        },
      });

      // Invalidate patient cache
      const cacheKey = getCacheKey('patient', id, req.user.clinicId || 'no-clinic');
      await Cache.delete(cacheKey);
      await Cache.invalidatePattern(`patient:*:${req.user.clinicId || 'no-clinic'}:*`);

      return NextResponse.json({ message: "Patient deleted successfully" });
    } catch (error) {
      console.error("Error deleting patient:", error);
      return NextResponse.json(
        { error: "Failed to delete patient" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: [Permissions.PATIENT_DELETE],
  }
);

