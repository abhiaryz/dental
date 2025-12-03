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
  sanitizeDataForWrite,
} from "@/lib/database-schema";

interface RouteContext {
  params: Promise<{ table: string; id: string }>;
}

type PrismaModel = {
  findUnique: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
  update: (args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }) => Promise<Record<string, unknown>>;
};

type PrismaClientDynamic = Record<string, PrismaModel | undefined>;

/**
 * GET /api/super-admin/database/[table]/[id]
 * Get a single record by ID
 */
export const GET = withSuperAdminAuth(
  async (_req: AuthenticatedSuperAdminRequest, context: RouteContext) => {
    try {
      const { table, id } = await context.params;

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

      // Find record by primary key
      const record = await model.findUnique({
        where: { [tableMetadata.primaryKey]: id },
      });

      if (!record) {
        return NextResponse.json(
          { error: "Record not found" },
          { status: 404 }
        );
      }

      // Filter out sensitive fields
      const sensitiveFields = tableMetadata.fields
        .filter((f) => f.isSensitive)
        .map((f) => f.name);

      const sanitizedRecord: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(record)) {
        if (!sensitiveFields.includes(key)) {
          sanitizedRecord[key] = value;
        }
      }

      return NextResponse.json({
        record: sanitizedRecord,
        metadata: {
          tableName: modelName,
          fields: tableMetadata.fields.filter((f) => !f.isSensitive),
        },
      });
    } catch (error) {
      console.error("Failed to fetch record:", error);
      return NextResponse.json(
        { error: "Failed to fetch record" },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/super-admin/database/[table]/[id]
 * Update a record by ID
 */
export const PATCH = withSuperAdminAuth(
  async (req: AuthenticatedSuperAdminRequest, context: RouteContext) => {
    try {
      const { table, id } = await context.params;
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

      // Check if record exists
      const existingRecord = await model.findUnique({
        where: { [tableMetadata.primaryKey]: id },
      });

      if (!existingRecord) {
        return NextResponse.json(
          { error: "Record not found" },
          { status: 404 }
        );
      }

      // Sanitize and validate data
      const sanitizedData = sanitizeDataForWrite(modelName, body, true);

      // Update record
      const updatedRecord = await model.update({
        where: { [tableMetadata.primaryKey]: id },
        data: sanitizedData,
      });

      // Log the action
      await logSuperAdminAction(
        req.superAdmin.id,
        "DATABASE_UPDATE",
        modelName,
        id,
        { 
          tableName: modelName, 
          updatedFields: Object.keys(sanitizedData),
          previousValues: Object.fromEntries(
            Object.keys(sanitizedData).map((key) => [
              key,
              existingRecord[key],
            ])
          ),
        }
      );

      // Filter out sensitive fields from response
      const sensitiveFields = tableMetadata.fields
        .filter((f) => f.isSensitive)
        .map((f) => f.name);

      const sanitizedResponse: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updatedRecord)) {
        if (!sensitiveFields.includes(key)) {
          sanitizedResponse[key] = value;
        }
      }

      return NextResponse.json({
        success: true,
        record: sanitizedResponse,
        message: `Record updated successfully in ${modelName}`,
      });
    } catch (error) {
      console.error("Failed to update record:", error);

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
        { error: "Failed to update record" },
        { status: 500 }
      );
    }
  }
);
