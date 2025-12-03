import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  withSuperAdminAuth,
  AuthenticatedSuperAdminRequest,
  logSuperAdminAction,
} from "@/lib/super-admin-auth";
import {
  isValidTable,
  getModelName,
  getTableMetadata,
  getDisplayableFields,
  sanitizeDataForWrite,
} from "@/lib/database-schema";

interface RouteContext {
  params: Promise<{ table: string }>;
}

type PrismaModel = {
  count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  findMany: (args?: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, string>;
  }) => Promise<Record<string, unknown>[]>;
  create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
};

type PrismaClientDynamic = Record<string, PrismaModel | undefined>;

/**
 * GET /api/super-admin/database/[table]
 * Get paginated records for a specific table
 */
export const GET = withSuperAdminAuth(
  async (req: AuthenticatedSuperAdminRequest, context: RouteContext) => {
    try {
      const { table } = await context.params;
      const { searchParams } = new URL(req.url);

      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "50");
      const search = searchParams.get("search") || "";
      const sortBy = searchParams.get("sortBy") || "createdAt";
      const sortOrder = searchParams.get("sortOrder") || "desc";

      // Validate table name
      if (!isValidTable(table)) {
        return NextResponse.json(
          { error: "Invalid table name" },
          { status: 400 }
        );
      }

      const modelName = getModelName(table);
      if (!modelName) {
        return NextResponse.json({ error: "Table not found" }, { status: 404 });
      }

      const tableMetadata = getTableMetadata(modelName);
      if (!tableMetadata) {
        return NextResponse.json(
          { error: "Table metadata not found" },
          { status: 404 }
        );
      }

      // Get the Prisma model dynamically
      const prismaModelName =
        modelName.charAt(0).toLowerCase() + modelName.slice(1);
      const model = (prisma as unknown as PrismaClientDynamic)[prismaModelName];

      if (!model) {
        return NextResponse.json(
          { error: "Model not found in Prisma client" },
          { status: 404 }
        );
      }

      // Build where clause for search
      let whereClause: Record<string, unknown> = {};

      if (search) {
        const displayableFields = getDisplayableFields(modelName);
        const stringFields = displayableFields.filter(
          (f) => f.type === "string" && !f.isSensitive
        );

        if (stringFields.length > 0) {
          whereClause = {
            OR: stringFields.map((field) => ({
              [field.name]: {
                contains: search,
                mode: "insensitive",
              },
            })),
          };
        }
      }

      // Check if sortBy field exists
      const validSortField = tableMetadata.fields.some(
        (f) => f.name === sortBy
      );
      const orderByField = validSortField ? sortBy : "id";

      // Get total count
      const total = await model.count({ where: whereClause });

      // Get records with pagination
      const records = await model.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [orderByField]: sortOrder === "asc" ? "asc" : "desc",
        },
      });

      // Filter out sensitive fields from response
      const displayableFields = getDisplayableFields(modelName);
      const displayableFieldNames = new Set(displayableFields.map((f) => f.name));

      const sanitizedRecords = records.map((record) => {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(record)) {
          // Always include id field
          if (key === "id" || displayableFieldNames.has(key)) {
            sanitized[key] = value;
          }
        }
        return sanitized;
      });

      return NextResponse.json({
        records: sanitizedRecords,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        metadata: {
          tableName: modelName,
          fields: displayableFields,
        },
      });
    } catch (error) {
      console.error("Failed to fetch table records:", error);
      return NextResponse.json(
        { error: "Failed to fetch table records" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/super-admin/database/[table]
 * Create a new record in the table
 */
export const POST = withSuperAdminAuth(
  async (req: AuthenticatedSuperAdminRequest, context: RouteContext) => {
    try {
      const { table } = await context.params;
      const body = await req.json();

      // Validate table name
      if (!isValidTable(table)) {
        return NextResponse.json(
          { error: "Invalid table name" },
          { status: 400 }
        );
      }

      const modelName = getModelName(table);
      if (!modelName) {
        return NextResponse.json({ error: "Table not found" }, { status: 404 });
      }

      // Get the Prisma model dynamically
      const prismaModelName =
        modelName.charAt(0).toLowerCase() + modelName.slice(1);
      const model = (prisma as unknown as PrismaClientDynamic)[prismaModelName];

      if (!model) {
        return NextResponse.json(
          { error: "Model not found in Prisma client" },
          { status: 404 }
        );
      }

      // Sanitize and validate data
      const sanitizedData = sanitizeDataForWrite(modelName, body, false);

      // Create record
      const record = await model.create({
        data: sanitizedData,
      });

      // Log the action
      await logSuperAdminAction(
        req.superAdmin.id,
        "DATABASE_CREATE",
        modelName,
        record.id as string,
        { tableName: modelName, createdFields: Object.keys(sanitizedData) }
      );

      return NextResponse.json({
        success: true,
        record,
        message: `Record created successfully in ${modelName}`,
      });
    } catch (error) {
      console.error("Failed to create record:", error);

      // Handle Prisma validation errors
      if (error instanceof Error) {
        if (error.message.includes("Unique constraint")) {
          return NextResponse.json(
            { error: "A record with this value already exists" },
            { status: 400 }
          );
        }
        if (error.message.includes("Foreign key constraint")) {
          return NextResponse.json(
            { error: "Related record not found" },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: "Failed to create record" },
        { status: 500 }
      );
    }
  }
);
