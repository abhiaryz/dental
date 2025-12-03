import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSuperAdminAuth } from "@/lib/super-admin-auth";
import {
  getAllTablesMetadata,
  getTableCategory,
  getDisplayableFields,
} from "@/lib/database-schema";

interface TableInfo {
  name: string;
  displayName: string;
  category: string;
  recordCount: number;
  fieldCount: number;
  fields: ReturnType<typeof getDisplayableFields>;
}

/**
 * GET /api/super-admin/database
 * Returns list of all tables with record counts and field metadata
 */
export const GET = withSuperAdminAuth(
  async () => {
    try {
      const tablesMetadata = getAllTablesMetadata();

      // Get record counts for each table
      const tableInfoPromises = tablesMetadata.map(async (table) => {
        let recordCount = 0;

        try {
          // Use dynamic prisma model access
          const modelName =
            table.name.charAt(0).toLowerCase() + table.name.slice(1);
          const model = (prisma as unknown as Record<string, { count?: () => Promise<number> }>)[modelName];

          if (model && typeof model.count === "function") {
            recordCount = await model.count();
          }
        } catch (error) {
          // If count fails, leave as 0
          console.error(`Failed to count ${table.name}:`, error);
        }

        const displayableFields = getDisplayableFields(table.name);

        return {
          name: table.name,
          displayName: table.name.replace(/([A-Z])/g, " $1").trim(),
          category: getTableCategory(table.name),
          recordCount,
          fieldCount: displayableFields.length,
          fields: displayableFields,
        } as TableInfo;
      });

      const tables = await Promise.all(tableInfoPromises);

      // Group tables by category
      const groupedTables = tables.reduce(
        (acc, table) => {
          if (!acc[table.category]) {
            acc[table.category] = [];
          }
          acc[table.category].push(table);
          return acc;
        },
        {} as Record<string, TableInfo[]>
      );

      // Sort categories and tables within each category
      const sortedGroups = Object.entries(groupedTables)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, categoryTables]) => ({
          category,
          tables: categoryTables.sort((a, b) => a.name.localeCompare(b.name)),
        }));

      return NextResponse.json({
        tables,
        groupedTables: sortedGroups,
        totalTables: tables.length,
        totalRecords: tables.reduce((sum, t) => sum + t.recordCount, 0),
      });
    } catch (error) {
      console.error("Failed to fetch database tables:", error);
      return NextResponse.json(
        { error: "Failed to fetch database tables" },
        { status: 500 }
      );
    }
  }
);

