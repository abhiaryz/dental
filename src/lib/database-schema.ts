import { Prisma } from "@prisma/client";

// Types for schema metadata
export interface FieldMetadata {
  name: string;
  type: string;
  kind: "scalar" | "enum" | "object";
  isRequired: boolean;
  isList: boolean;
  isId: boolean;
  isReadOnly: boolean;
  isSensitive: boolean;
  hasDefaultValue: boolean;
  enumValues?: string[];
  relationName?: string;
  relationToFields?: string[];
}

export interface TableMetadata {
  name: string;
  dbName: string | null;
  fields: FieldMetadata[];
  primaryKey: string;
  description?: string;
}

// Sensitive fields that should be hidden or masked
const SENSITIVE_FIELDS = [
  "password",
  "access_token",
  "refresh_token",
  "id_token",
  "token",
  "sessionToken",
];

// Fields that should be read-only (auto-generated)
const READ_ONLY_FIELDS = [
  "id",
  "createdAt",
  "updatedAt",
  "emailVerified",
];

// Map Prisma scalar types to display types
const TYPE_MAP: Record<string, string> = {
  String: "string",
  Int: "number",
  Float: "number",
  Boolean: "boolean",
  DateTime: "datetime",
  Json: "json",
  BigInt: "bigint",
  Decimal: "decimal",
  Bytes: "bytes",
};

/**
 * Get all table names from the Prisma schema
 */
export function getAllTableNames(): string[] {
  const models = Prisma.dmmf.datamodel.models;
  return models.map((model) => model.name);
}

/**
 * Get metadata for a specific table
 */
export function getTableMetadata(tableName: string): TableMetadata | null {
  const models = Prisma.dmmf.datamodel.models;
  const model = models.find(
    (m) => m.name.toLowerCase() === tableName.toLowerCase()
  );

  if (!model) {
    return null;
  }

  const fields: FieldMetadata[] = model.fields.map((field) => {
    const isId = field.isId || field.name === "id";
    const isSensitive = SENSITIVE_FIELDS.includes(field.name);
    const isReadOnly =
      READ_ONLY_FIELDS.includes(field.name) ||
      field.isGenerated ||
      field.isUpdatedAt;

    let enumValues: string[] | undefined;
    if (field.kind === "enum") {
      const enumType = Prisma.dmmf.datamodel.enums.find(
        (e) => e.name === field.type
      );
      enumValues = enumType?.values.map((v) => v.name);
    }

    return {
      name: field.name,
      type: TYPE_MAP[field.type] || field.type,
      kind: field.kind as "scalar" | "enum" | "object",
      isRequired: field.isRequired,
      isList: field.isList,
      isId,
      isReadOnly,
      isSensitive,
      hasDefaultValue: field.hasDefaultValue,
      enumValues,
      relationName: field.relationName || undefined,
      relationToFields: field.relationToFields?.length
        ? field.relationToFields
        : undefined,
    };
  });

  // Find primary key field
  const primaryKeyField = fields.find((f) => f.isId);
  const primaryKey = primaryKeyField?.name || "id";

  return {
    name: model.name,
    dbName: model.dbName || null,
    fields,
    primaryKey,
  };
}

/**
 * Get metadata for all tables
 */
export function getAllTablesMetadata(): TableMetadata[] {
  const tableNames = getAllTableNames();
  return tableNames
    .map((name) => getTableMetadata(name))
    .filter((meta): meta is TableMetadata => meta !== null);
}

/**
 * Get all enum definitions from the schema
 */
export function getAllEnums(): Record<string, string[]> {
  const enums: Record<string, string[]> = {};
  Prisma.dmmf.datamodel.enums.forEach((enumType) => {
    enums[enumType.name] = enumType.values.map((v) => v.name);
  });
  return enums;
}

/**
 * Get editable fields for a table (excluding relations and read-only fields)
 */
export function getEditableFields(tableName: string): FieldMetadata[] {
  const metadata = getTableMetadata(tableName);
  if (!metadata) return [];

  return metadata.fields.filter(
    (field) =>
      field.kind !== "object" && // Exclude relations
      !field.isReadOnly &&
      !field.isSensitive
  );
}

/**
 * Get displayable fields for a table (excluding sensitive data)
 */
export function getDisplayableFields(tableName: string): FieldMetadata[] {
  const metadata = getTableMetadata(tableName);
  if (!metadata) return [];

  return metadata.fields.filter(
    (field) =>
      field.kind !== "object" && // Exclude relations
      !field.isSensitive
  );
}

/**
 * Validate if a table name exists in the schema
 */
export function isValidTable(tableName: string): boolean {
  const tableNames = getAllTableNames();
  return tableNames.some(
    (name) => name.toLowerCase() === tableName.toLowerCase()
  );
}

/**
 * Get the correct model name (case-sensitive) from a table name
 */
export function getModelName(tableName: string): string | null {
  const tableNames = getAllTableNames();
  return (
    tableNames.find(
      (name) => name.toLowerCase() === tableName.toLowerCase()
    ) || null
  );
}

/**
 * Prepare data for insert/update by filtering out invalid fields
 */
export function sanitizeDataForWrite(
  tableName: string,
  data: Record<string, unknown>,
  isUpdate: boolean = false
): Record<string, unknown> {
  const editableFields = getEditableFields(tableName);
  const fieldNames = new Set(editableFields.map((f) => f.name));

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip if field is not editable
    if (!fieldNames.has(key)) continue;

    // Skip undefined values on update
    if (isUpdate && value === undefined) continue;

    // Convert empty strings to null for optional fields
    const field = editableFields.find((f) => f.name === key);
    if (field && !field.isRequired && value === "") {
      sanitized[key] = null;
      continue;
    }

    // Type conversions
    if (field) {
      if (field.type === "number" && typeof value === "string") {
        const num = parseFloat(value);
        sanitized[key] = isNaN(num) ? null : num;
      } else if (field.type === "boolean" && typeof value === "string") {
        sanitized[key] = value === "true";
      } else if (field.type === "datetime" && typeof value === "string") {
        sanitized[key] = value ? new Date(value) : null;
      } else {
        sanitized[key] = value;
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Get table category for grouping in UI
 */
export function getTableCategory(tableName: string): string {
  const categories: Record<string, string[]> = {
    Authentication: [
      "Account",
      "Session",
      "User",
      "SuperAdmin",
      "VerificationToken",
      "EmailVerificationToken",
      "PasswordResetToken",
      "LoginAttempt",
    ],
    "Clinic Management": ["Clinic", "Invitation"],
    "Patient Care": [
      "Patient",
      "Treatment",
      "Appointment",
      "Document",
      "ClinicalImage",
      "ConsentTemplate",
      "PatientConsent",
      "PrescriptionPDF",
    ],
    Billing: ["Invoice", "InvoiceItem", "Payment"],
    Inventory: ["Supplier", "InventoryItem", "StockMovement"],
    System: ["AuditLog", "NotificationPreference", "Notification"],
  };

  for (const [category, tables] of Object.entries(categories)) {
    if (tables.includes(tableName)) {
      return category;
    }
  }

  return "Other";
}

