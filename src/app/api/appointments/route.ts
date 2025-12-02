import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest, getPatientWhereClause } from "@/lib/auth-middleware";
import { Permissions } from "@/lib/rbac";
import { AppError, ErrorCodes, createErrorResponse } from "@/lib/api-errors";

// GET - Fetch all appointments based on role
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const patientId = searchParams.get("patientId");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const status = searchParams.get("status");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      // Build patient filter based on user role
      const patientWhere = getPatientWhereClause(req.user.id, req.user.role, req.user.isExternal);

      const where: any = {
        patient: patientWhere,
      };

      if (patientId) {
        where.patientId = patientId;
      }

      if (status) {
        where.status = status;
      }

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      } else if (startDate) {
        where.date = {
          gte: new Date(startDate),
        };
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                mobileNumber: true,
              },
            },
          },
          orderBy: [
            { date: "asc" },
            { time: "asc" },
          ],
          skip,
          take: limit,
        }),
        prisma.appointment.count({ where }),
      ]);

      return NextResponse.json({
        appointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to fetch appointments");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.APPOINTMENT_READ],
  }
);

// POST - Create a new appointment
export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();

      // Validate required fields
      const requiredFields = ["patientId", "date", "time", "type"];

      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { error: `${field} is required` },
            { status: 400 }
          );
        }
      }

      // Verify patient access based on role
      const patientWhere = getPatientWhereClause(req.user.id, req.user.role, req.user.isExternal);
      const patient = await prisma.patient.findFirst({
        where: {
          id: body.patientId,
          ...patientWhere,
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found or access denied" },
          { status: 404 }
        );
      }

      const appointment = await prisma.appointment.create({
        data: body,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mobileNumber: true,
            },
          },
        },
      });

      return NextResponse.json(appointment, { status: 201 });
    } catch (error) {
      const errorResponse = createErrorResponse(error, "Failed to create appointment");
      return NextResponse.json(errorResponse.body, { status: errorResponse.status });
    }
  },
  {
    requiredPermissions: [Permissions.APPOINTMENT_CREATE],
  }
);

