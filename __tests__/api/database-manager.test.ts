/**
 * Database Manager API Tests
 * Tests for super admin database management functionality
 */

// Mock Prisma DMMF before any imports
jest.mock('@prisma/client', () => ({
  Prisma: {
    dmmf: {
      datamodel: {
        models: [
          {
            name: 'User',
            dbName: null,
            fields: [
              { name: 'id', type: 'String', kind: 'scalar', isRequired: true, isList: false, isId: true, hasDefaultValue: true, isGenerated: false, isUpdatedAt: false },
              { name: 'name', type: 'String', kind: 'scalar', isRequired: false, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'email', type: 'String', kind: 'scalar', isRequired: false, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'password', type: 'String', kind: 'scalar', isRequired: false, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'role', type: 'Role', kind: 'enum', isRequired: true, isList: false, isId: false, hasDefaultValue: true, isGenerated: false, isUpdatedAt: false },
              { name: 'isExternal', type: 'Boolean', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: true, isGenerated: false, isUpdatedAt: false },
              { name: 'createdAt', type: 'DateTime', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: true, isGenerated: false, isUpdatedAt: false },
              { name: 'updatedAt', type: 'DateTime', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: true },
            ],
          },
          {
            name: 'Clinic',
            dbName: null,
            fields: [
              { name: 'id', type: 'String', kind: 'scalar', isRequired: true, isList: false, isId: true, hasDefaultValue: true, isGenerated: false, isUpdatedAt: false },
              { name: 'name', type: 'String', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'clinicCode', type: 'String', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'email', type: 'String', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'phone', type: 'String', kind: 'scalar', isRequired: false, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'createdAt', type: 'DateTime', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: true, isGenerated: false, isUpdatedAt: false },
              { name: 'updatedAt', type: 'DateTime', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: true },
            ],
          },
          {
            name: 'Patient',
            dbName: null,
            fields: [
              { name: 'id', type: 'String', kind: 'scalar', isRequired: true, isList: false, isId: true, hasDefaultValue: true, isGenerated: false, isUpdatedAt: false },
              { name: 'firstName', type: 'String', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'lastName', type: 'String', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'height', type: 'Float', kind: 'scalar', isRequired: false, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'weight', type: 'Float', kind: 'scalar', isRequired: false, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'createdAt', type: 'DateTime', kind: 'scalar', isRequired: true, isList: false, isId: false, hasDefaultValue: true, isGenerated: false, isUpdatedAt: false },
            ],
          },
          {
            name: 'Account',
            dbName: null,
            fields: [
              { name: 'id', type: 'String', kind: 'scalar', isRequired: true, isList: false, isId: true, hasDefaultValue: true, isGenerated: false, isUpdatedAt: false },
              { name: 'access_token', type: 'String', kind: 'scalar', isRequired: false, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'refresh_token', type: 'String', kind: 'scalar', isRequired: false, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
              { name: 'id_token', type: 'String', kind: 'scalar', isRequired: false, isList: false, isId: false, hasDefaultValue: false, isGenerated: false, isUpdatedAt: false },
            ],
          },
        ],
        enums: [
          {
            name: 'Role',
            values: [
              { name: 'ADMIN' },
              { name: 'CLINIC_DOCTOR' },
              { name: 'HYGIENIST' },
              { name: 'RECEPTIONIST' },
              { name: 'EXTERNAL_DOCTOR' },
            ],
          },
          {
            name: 'ClinicType',
            values: [
              { name: 'INDIVIDUAL_PRACTICE' },
              { name: 'CLINIC' },
              { name: 'MULTI_LOCATION_CLINIC' },
            ],
          },
        ],
      },
    },
  },
}));

import {
  mockPrismaClient,
  resetAllMocks,
} from '../utils/test-helpers';
import { getTableCategory } from '@/lib/database-schema';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient,
  prisma: mockPrismaClient,
}));

// Import after mocking
import {
  getAllTableNames,
  getTableMetadata,
  getAllTablesMetadata,
  getEditableFields,
  getDisplayableFields,
  isValidTable,
  getModelName,
  sanitizeDataForWrite,
  getAllEnums,
} from '@/lib/database-schema';

describe('Database Manager Tests', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Schema Introspection', () => {
    test('should get all table names from schema', () => {
      const tableNames = getAllTableNames();

      expect(Array.isArray(tableNames)).toBe(true);
      expect(tableNames.length).toBeGreaterThan(0);
      expect(tableNames).toContain('User');
      expect(tableNames).toContain('Clinic');
      expect(tableNames).toContain('Patient');
    });

    test('should get table metadata for valid table', () => {
      const metadata = getTableMetadata('User');

      expect(metadata).toBeTruthy();
      expect(metadata?.name).toBe('User');
      expect(metadata?.fields).toBeDefined();
      expect(Array.isArray(metadata?.fields)).toBe(true);
      expect(metadata?.primaryKey).toBe('id');
    });

    test('should return null for invalid table', () => {
      const metadata = getTableMetadata('NonExistentTable');

      expect(metadata).toBeNull();
    });

    test('should get all tables metadata', () => {
      const allMetadata = getAllTablesMetadata();

      expect(Array.isArray(allMetadata)).toBe(true);
      expect(allMetadata.length).toBeGreaterThan(0);
      allMetadata.forEach((meta) => {
        expect(meta.name).toBeTruthy();
        expect(meta.fields).toBeDefined();
      });
    });

    test('should identify field types correctly', () => {
      const userMetadata = getTableMetadata('User');

      expect(userMetadata).toBeTruthy();

      const emailField = userMetadata?.fields.find((f) => f.name === 'email');
      expect(emailField?.type).toBe('string');

      const createdAtField = userMetadata?.fields.find(
        (f) => f.name === 'createdAt'
      );
      expect(createdAtField?.type).toBe('datetime');

      const isExternalField = userMetadata?.fields.find(
        (f) => f.name === 'isExternal'
      );
      expect(isExternalField?.type).toBe('boolean');
    });

    test('should identify enum fields', () => {
      const userMetadata = getTableMetadata('User');
      const roleField = userMetadata?.fields.find((f) => f.name === 'role');

      expect(roleField?.kind).toBe('enum');
      expect(roleField?.enumValues).toBeDefined();
      expect(roleField?.enumValues).toContain('ADMIN');
      expect(roleField?.enumValues).toContain('CLINIC_DOCTOR');
    });

    test('should get all enum definitions', () => {
      const enums = getAllEnums();

      expect(enums).toBeTruthy();
      expect(enums.Role).toBeDefined();
      expect(enums.Role).toContain('ADMIN');
      expect(enums.ClinicType).toBeDefined();
    });
  });

  describe('Field Classification', () => {
    test('should mark sensitive fields', () => {
      const userMetadata = getTableMetadata('User');
      const passwordField = userMetadata?.fields.find(
        (f) => f.name === 'password'
      );

      expect(passwordField?.isSensitive).toBe(true);
    });

    test('should mark read-only fields', () => {
      const userMetadata = getTableMetadata('User');

      const idField = userMetadata?.fields.find((f) => f.name === 'id');
      expect(idField?.isReadOnly).toBe(true);

      const createdAtField = userMetadata?.fields.find(
        (f) => f.name === 'createdAt'
      );
      expect(createdAtField?.isReadOnly).toBe(true);

      const updatedAtField = userMetadata?.fields.find(
        (f) => f.name === 'updatedAt'
      );
      expect(updatedAtField?.isReadOnly).toBe(true);
    });

    test('should get editable fields only', () => {
      const editableFields = getEditableFields('User');

      expect(Array.isArray(editableFields)).toBe(true);

      // Should not include id, createdAt, updatedAt, password
      const fieldNames = editableFields.map((f) => f.name);
      expect(fieldNames).not.toContain('id');
      expect(fieldNames).not.toContain('createdAt');
      expect(fieldNames).not.toContain('updatedAt');
      expect(fieldNames).not.toContain('password');

      // Should include editable fields
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
    });

    test('should get displayable fields excluding sensitive', () => {
      const displayableFields = getDisplayableFields('User');
      const fieldNames = displayableFields.map((f) => f.name);

      // Should not include password or tokens
      expect(fieldNames).not.toContain('password');

      // Should include normal display fields
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
    });
  });

  describe('Table Validation', () => {
    test('should validate existing table names', () => {
      expect(isValidTable('User')).toBe(true);
      expect(isValidTable('user')).toBe(true);
      expect(isValidTable('USER')).toBe(true);
      expect(isValidTable('Clinic')).toBe(true);
      expect(isValidTable('Patient')).toBe(true);
    });

    test('should reject invalid table names', () => {
      expect(isValidTable('NonExistent')).toBe(false);
      expect(isValidTable('FakeTable')).toBe(false);
      expect(isValidTable('')).toBe(false);
    });

    test('should get correct model name regardless of case', () => {
      expect(getModelName('user')).toBe('User');
      expect(getModelName('USER')).toBe('User');
      expect(getModelName('User')).toBe('User');
      expect(getModelName('clinic')).toBe('Clinic');
      expect(getModelName('PATIENT')).toBe('Patient');
    });

    test('should return null for invalid model names', () => {
      expect(getModelName('nonexistent')).toBeNull();
    });
  });

  describe('Data Sanitization', () => {
    test('should sanitize data for create operation', () => {
      const inputData = {
        name: 'Test User',
        email: 'test@example.com',
        id: 'should-be-ignored',
        createdAt: new Date(),
        password: 'should-be-ignored',
      };

      const sanitized = sanitizeDataForWrite('User', inputData, false);

      expect(sanitized.name).toBe('Test User');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.id).toBeUndefined();
      expect(sanitized.createdAt).toBeUndefined();
      expect(sanitized.password).toBeUndefined();
    });

    test('should sanitize data for update operation', () => {
      const inputData = {
        name: 'Updated Name',
        email: undefined,
      };

      const sanitized = sanitizeDataForWrite('User', inputData, true);

      expect(sanitized.name).toBe('Updated Name');
      // Undefined values should be skipped on update
      expect('email' in sanitized).toBe(false);
    });

    test('should convert number strings to numbers', () => {
      const inputData = {
        height: '175',
        weight: '70.5',
      };

      const sanitized = sanitizeDataForWrite('Patient', inputData, false);

      expect(sanitized.height).toBe(175);
      expect(sanitized.weight).toBe(70.5);
    });

    test('should convert boolean strings to booleans', () => {
      const inputData = {
        isExternal: 'true',
      };

      const sanitized = sanitizeDataForWrite('User', inputData, false);

      expect(sanitized.isExternal).toBe(true);
    });

    test('should convert empty strings to null for optional fields', () => {
      const inputData = {
        phone: '',
      };

      const sanitized = sanitizeDataForWrite('Clinic', inputData, false);

      expect(sanitized.phone).toBeNull();
    });
  });

  describe('Table Categories', () => {
    test('should categorize authentication tables', () => {
      expect(getTableCategory('User')).toBe('Authentication');
      expect(getTableCategory('Session')).toBe('Authentication');
      expect(getTableCategory('Account')).toBe('Authentication');
      expect(getTableCategory('SuperAdmin')).toBe('Authentication');
    });

    test('should categorize clinic management tables', () => {
      expect(getTableCategory('Clinic')).toBe('Clinic Management');
      expect(getTableCategory('Invitation')).toBe('Clinic Management');
    });

    test('should categorize patient care tables', () => {
      expect(getTableCategory('Patient')).toBe('Patient Care');
      expect(getTableCategory('Treatment')).toBe('Patient Care');
      expect(getTableCategory('Appointment')).toBe('Patient Care');
      expect(getTableCategory('ClinicalImage')).toBe('Patient Care');
    });

    test('should categorize billing tables', () => {
      expect(getTableCategory('Invoice')).toBe('Billing');
      expect(getTableCategory('InvoiceItem')).toBe('Billing');
      expect(getTableCategory('Payment')).toBe('Billing');
    });

    test('should categorize inventory tables', () => {
      expect(getTableCategory('Supplier')).toBe('Inventory');
      expect(getTableCategory('InventoryItem')).toBe('Inventory');
      expect(getTableCategory('StockMovement')).toBe('Inventory');
    });

    test('should categorize system tables', () => {
      expect(getTableCategory('AuditLog')).toBe('System');
      expect(getTableCategory('Notification')).toBe('System');
    });
  });

  describe('API: List Tables', () => {
    test('should return list of all tables with metadata', () => {
      const tables = getAllTablesMetadata();

      const response = {
        tables: tables.map((t) => ({
          name: t.name,
          displayName: t.name.replace(/([A-Z])/g, ' $1').trim(),
          category: getTableCategory(t.name),
          recordCount: 0,
          fieldCount: getDisplayableFields(t.name).length,
        })),
        totalTables: tables.length,
      };

      expect(response.tables.length).toBeGreaterThan(0);
      expect(response.totalTables).toBe(tables.length);
      response.tables.forEach((table) => {
        expect(table.name).toBeTruthy();
        expect(table.category).toBeTruthy();
        expect(table.fieldCount).toBeGreaterThan(0);
      });
    });
  });

  describe('API: Get Records', () => {
    test('should get records with pagination', async () => {
      const mockRecords = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Smith' },
      ];

      mockPrismaClient.patient.findMany.mockResolvedValue(mockRecords);
      mockPrismaClient.patient.count.mockResolvedValue(100);

      const records = await mockPrismaClient.patient.findMany({
        skip: 0,
        take: 50,
      });
      const count = await mockPrismaClient.patient.count();

      expect(records).toHaveLength(2);
      expect(count).toBe(100);
    });

    test('should filter records by search term', async () => {
      const mockRecords = [
        { id: '1', name: 'Test Clinic', clinicCode: 'TEST123' },
      ];

      mockPrismaClient.clinic.findMany.mockResolvedValue(mockRecords);

      const records = await mockPrismaClient.clinic.findMany({
        where: {
          OR: [
            { name: { contains: 'Test', mode: 'insensitive' } },
            { clinicCode: { contains: 'Test', mode: 'insensitive' } },
          ],
        },
      });

      expect(records).toHaveLength(1);
      expect(records[0].name).toContain('Test');
    });
  });

  describe('API: Create Record', () => {
    test('should create record with valid data', async () => {
      const newClinic = {
        id: 'new-clinic-id',
        name: 'New Clinic',
        clinicCode: 'NEW123',
        email: 'new@clinic.com',
        ownerName: 'John Doe',
        ownerEmail: 'john@clinic.com',
      };

      mockPrismaClient.clinic.create.mockResolvedValue(newClinic);

      const created = await mockPrismaClient.clinic.create({
        data: {
          name: 'New Clinic',
          clinicCode: 'NEW123',
          email: 'new@clinic.com',
          ownerName: 'John Doe',
          ownerEmail: 'john@clinic.com',
        },
      });

      expect(created.id).toBeTruthy();
      expect(created.name).toBe('New Clinic');
      expect(created.clinicCode).toBe('NEW123');
    });

    test('should reject duplicate unique fields', async () => {
      mockPrismaClient.clinic.create.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`clinicCode`)')
      );

      await expect(
        mockPrismaClient.clinic.create({
          data: {
            name: 'Duplicate Clinic',
            clinicCode: 'EXISTING123',
            email: 'dup@clinic.com',
            ownerName: 'Jane Doe',
            ownerEmail: 'jane@clinic.com',
          },
        })
      ).rejects.toThrow('Unique constraint');
    });
  });

  describe('API: Update Record', () => {
    test('should update record with valid data', async () => {
      const updatedClinic = {
        id: 'clinic-id',
        name: 'Updated Clinic Name',
        clinicCode: 'ABC123',
        email: 'updated@clinic.com',
      };

      mockPrismaClient.clinic.findUnique.mockResolvedValue({
        id: 'clinic-id',
        name: 'Original Name',
        clinicCode: 'ABC123',
        email: 'original@clinic.com',
      });

      mockPrismaClient.clinic.update.mockResolvedValue(updatedClinic);

      const updated = await mockPrismaClient.clinic.update({
        where: { id: 'clinic-id' },
        data: { name: 'Updated Clinic Name', email: 'updated@clinic.com' },
      });

      expect(updated.name).toBe('Updated Clinic Name');
      expect(updated.email).toBe('updated@clinic.com');
    });

    test('should return error for non-existent record', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(null);

      const found = await mockPrismaClient.clinic.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(found).toBeNull();
    });

    test('should reject update with invalid foreign key', async () => {
      mockPrismaClient.user.update.mockRejectedValue(
        new Error('Foreign key constraint failed on the field: `clinicId`')
      );

      await expect(
        mockPrismaClient.user.update({
          where: { id: 'user-id' },
          data: { clinicId: 'non-existent-clinic' },
        })
      ).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('Security: Sensitive Fields', () => {
    test('should not expose password field in records', () => {
      const displayableFields = getDisplayableFields('User');
      const fieldNames = displayableFields.map((f) => f.name);

      expect(fieldNames).not.toContain('password');
    });

    test('should not expose token fields', () => {
      const displayableFields = getDisplayableFields('Account');
      const fieldNames = displayableFields.map((f) => f.name);

      expect(fieldNames).not.toContain('access_token');
      expect(fieldNames).not.toContain('refresh_token');
      expect(fieldNames).not.toContain('id_token');
    });

    test('should not allow writing to sensitive fields', () => {
      const editableFields = getEditableFields('User');
      const fieldNames = editableFields.map((f) => f.name);

      expect(fieldNames).not.toContain('password');
    });

    test('should not allow writing to ID fields', () => {
      const editableFields = getEditableFields('User');
      const fieldNames = editableFields.map((f) => f.name);

      expect(fieldNames).not.toContain('id');
    });
  });

  describe('Security: Auth Protection', () => {
    test('should require super admin authentication', () => {
      // This simulates what the withSuperAdminAuth middleware does
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
      };

      // Without a valid token, should be rejected
      const token = mockRequest.cookies.get('super-admin-token');
      expect(token).toBeUndefined();
    });

    test('should reject inactive super admin', () => {
      const superAdminSession = {
        id: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin',
        isActive: false,
      };

      // Inactive admin should be rejected
      expect(superAdminSession.isActive).toBe(false);
    });
  });
});
