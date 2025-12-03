/**
 * RBAC (Role-Based Access Control) Tests
 * Tests for permission checks and role-based access
 */

import { Role } from '@prisma/client';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  Permissions,
  canAccessAllPatients,
  canFinalizeDocuments,
  canManageStaff,
  canAccessFinance,
  canManageInventory,
  isExternalDoctor,
  getRoleName,
  getRoleDescription,
} from '@/lib/rbac';

describe('RBAC Permission Tests', () => {
  describe('Admin Role Permissions', () => {
    const role: Role = 'ADMIN';

    test('should have full access to all modules', () => {
      expect(hasPermission(role, Permissions.PATIENT_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_DELETE)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_READ_ALL)).toBe(true);
    });

    test('should have staff management permissions', () => {
      expect(hasPermission(role, Permissions.STAFF_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.STAFF_READ)).toBe(true);
      expect(hasPermission(role, Permissions.STAFF_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.STAFF_DELETE)).toBe(true);
      expect(canManageStaff(role)).toBe(true);
    });

    test('should have full treatment permissions', () => {
      expect(hasPermission(role, Permissions.TREATMENT_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_DELETE)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_FINALIZE)).toBe(true);
      expect(canFinalizeDocuments(role)).toBe(true);
    });

    test('should have full financial permissions', () => {
      expect(hasPermission(role, Permissions.FINANCE_READ)).toBe(true);
      expect(hasPermission(role, Permissions.FINANCE_CREATE_INVOICE)).toBe(true);
      expect(hasPermission(role, Permissions.FINANCE_FINALIZE_INVOICE)).toBe(true);
      expect(hasPermission(role, Permissions.FINANCE_PROCESS_PAYMENT)).toBe(true);
      expect(canAccessFinance(role)).toBe(true);
    });

    test('should have inventory management permissions', () => {
      expect(hasPermission(role, Permissions.INVENTORY_READ)).toBe(true);
      expect(hasPermission(role, Permissions.INVENTORY_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.INVENTORY_MANAGE)).toBe(true);
      expect(canManageInventory(role)).toBe(true);
    });

    test('should have advanced analytics access', () => {
      expect(hasPermission(role, Permissions.ANALYTICS_READ)).toBe(true);
      expect(hasPermission(role, Permissions.ANALYTICS_ADVANCED)).toBe(true);
    });

    test('should have settings permissions', () => {
      expect(hasPermission(role, Permissions.SETTINGS_READ)).toBe(true);
      expect(hasPermission(role, Permissions.SETTINGS_UPDATE)).toBe(true);
    });
  });

  describe('Clinic Doctor Role Permissions', () => {
    const role: Role = 'CLINIC_DOCTOR';

    test('should have full patient access', () => {
      expect(hasPermission(role, Permissions.PATIENT_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_READ_ALL)).toBe(true);
      expect(canAccessAllPatients(role)).toBe(true);
    });

    test('should NOT have patient delete permission', () => {
      expect(hasPermission(role, Permissions.PATIENT_DELETE)).toBe(false);
    });

    test('should have full clinical access', () => {
      expect(hasPermission(role, Permissions.TREATMENT_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_FINALIZE)).toBe(true);
      expect(canFinalizeDocuments(role)).toBe(true);
    });

    test('should have prescription permissions', () => {
      expect(hasPermission(role, Permissions.PRESCRIPTION_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.PRESCRIPTION_FINALIZE)).toBe(true);
    });

    test('should have read-only finance access', () => {
      expect(hasPermission(role, Permissions.FINANCE_READ)).toBe(true);
      expect(hasPermission(role, Permissions.FINANCE_CREATE_INVOICE)).toBe(false);
      expect(hasPermission(role, Permissions.FINANCE_FINALIZE_INVOICE)).toBe(false);
      expect(hasPermission(role, Permissions.FINANCE_PROCESS_PAYMENT)).toBe(false);
      expect(canAccessFinance(role)).toBe(true);
    });

    test('should NOT have staff management permissions', () => {
      expect(hasPermission(role, Permissions.STAFF_CREATE)).toBe(false);
      expect(hasPermission(role, Permissions.STAFF_UPDATE)).toBe(false);
      expect(hasPermission(role, Permissions.STAFF_DELETE)).toBe(false);
      expect(canManageStaff(role)).toBe(false);
    });

    test('should have read-only inventory access', () => {
      expect(hasPermission(role, Permissions.INVENTORY_READ)).toBe(true);
      expect(hasPermission(role, Permissions.INVENTORY_MANAGE)).toBe(false);
      expect(canManageInventory(role)).toBe(false);
    });

    test('should have analytics access', () => {
      expect(hasPermission(role, Permissions.ANALYTICS_READ)).toBe(true);
      expect(hasPermission(role, Permissions.ANALYTICS_ADVANCED)).toBe(false);
    });

    test('should have full document permissions', () => {
      expect(hasPermission(role, Permissions.DOCUMENT_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.DOCUMENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.DOCUMENT_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.DOCUMENT_DELETE)).toBe(true);
    });
  });

  describe('External Doctor Role Permissions', () => {
    const role: Role = 'EXTERNAL_DOCTOR';

    test('should have full access to own patients', () => {
      expect(hasPermission(role, Permissions.PATIENT_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_READ_ALL)).toBe(true);
      expect(canAccessAllPatients(role)).toBe(true);
      expect(isExternalDoctor(role)).toBe(true);
    });

    test('should have clinical permissions for own patients', () => {
      expect(hasPermission(role, Permissions.TREATMENT_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_FINALIZE)).toBe(true);
    });

    test('should have prescription permissions', () => {
      expect(hasPermission(role, Permissions.PRESCRIPTION_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.PRESCRIPTION_FINALIZE)).toBe(true);
    });

    test('should have finance access', () => {
      expect(hasPermission(role, Permissions.FINANCE_READ)).toBe(true);
      expect(canAccessFinance(role)).toBe(true);
    });

    test('should NOT have inventory access', () => {
      expect(hasPermission(role, Permissions.INVENTORY_READ)).toBe(false);
      expect(canManageInventory(role)).toBe(false);
    });

    test('should NOT have staff management', () => {
      expect(canManageStaff(role)).toBe(false);
    });

    test('should NOT have analytics access', () => {
      expect(hasPermission(role, Permissions.ANALYTICS_READ)).toBe(false);
    });

    test('should have document permissions for own patients', () => {
      expect(hasPermission(role, Permissions.DOCUMENT_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.DOCUMENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.DOCUMENT_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.DOCUMENT_DELETE)).toBe(true);
    });
  });

  describe('Receptionist Role Permissions', () => {
    const role: Role = 'RECEPTIONIST';

    test('should have read-only patient access', () => {
      expect(hasPermission(role, Permissions.PATIENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_READ_ALL)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_CREATE)).toBe(false);
      expect(hasPermission(role, Permissions.PATIENT_UPDATE)).toBe(false);
      expect(hasPermission(role, Permissions.PATIENT_DELETE)).toBe(false);
    });

    test('should have full appointment management', () => {
      expect(hasPermission(role, Permissions.APPOINTMENT_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.APPOINTMENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.APPOINTMENT_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.APPOINTMENT_DELETE)).toBe(true);
    });

    test('should have financial permissions', () => {
      expect(hasPermission(role, Permissions.FINANCE_READ)).toBe(true);
      expect(hasPermission(role, Permissions.FINANCE_CREATE_INVOICE)).toBe(true);
      expect(hasPermission(role, Permissions.FINANCE_FINALIZE_INVOICE)).toBe(true);
      expect(hasPermission(role, Permissions.FINANCE_PROCESS_PAYMENT)).toBe(true);
      expect(canAccessFinance(role)).toBe(true);
    });

    test('should NOT have treatment permissions', () => {
      expect(hasPermission(role, Permissions.TREATMENT_CREATE)).toBe(false);
      expect(hasPermission(role, Permissions.TREATMENT_UPDATE)).toBe(false);
      expect(hasPermission(role, Permissions.TREATMENT_FINALIZE)).toBe(false);
      expect(canFinalizeDocuments(role)).toBe(false);
    });

    test('should have read-only inventory access', () => {
      expect(hasPermission(role, Permissions.INVENTORY_READ)).toBe(true);
      expect(hasPermission(role, Permissions.INVENTORY_MANAGE)).toBe(false);
    });

    test('should have read-only document access', () => {
      expect(hasPermission(role, Permissions.DOCUMENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.DOCUMENT_CREATE)).toBe(false);
      expect(hasPermission(role, Permissions.DOCUMENT_UPDATE)).toBe(false);
      expect(hasPermission(role, Permissions.DOCUMENT_DELETE)).toBe(false);
    });

    test('should NOT have staff management', () => {
      expect(canManageStaff(role)).toBe(false);
    });

    test('should NOT have analytics access', () => {
      expect(hasPermission(role, Permissions.ANALYTICS_READ)).toBe(false);
    });
  });

  describe('Hygienist Role Permissions', () => {
    const role: Role = 'HYGIENIST';

    test('should have read-only patient access', () => {
      expect(hasPermission(role, Permissions.PATIENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_READ_ALL)).toBe(true);
      expect(hasPermission(role, Permissions.PATIENT_CREATE)).toBe(false);
      expect(hasPermission(role, Permissions.PATIENT_UPDATE)).toBe(false);
    });

    test('should have limited treatment permissions', () => {
      expect(hasPermission(role, Permissions.TREATMENT_CREATE)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_UPDATE)).toBe(true);
      expect(hasPermission(role, Permissions.TREATMENT_FINALIZE)).toBe(false);
      expect(canFinalizeDocuments(role)).toBe(false);
    });

    test('should NOT have prescription permissions', () => {
      expect(hasPermission(role, Permissions.PRESCRIPTION_CREATE)).toBe(false);
      expect(hasPermission(role, Permissions.PRESCRIPTION_FINALIZE)).toBe(false);
    });

    test('should have read-only appointment access', () => {
      expect(hasPermission(role, Permissions.APPOINTMENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.APPOINTMENT_CREATE)).toBe(false);
      expect(hasPermission(role, Permissions.APPOINTMENT_UPDATE)).toBe(false);
    });

    test('should have read-only inventory access', () => {
      expect(hasPermission(role, Permissions.INVENTORY_READ)).toBe(true);
      expect(hasPermission(role, Permissions.INVENTORY_MANAGE)).toBe(false);
    });

    test('should have read-only document access', () => {
      expect(hasPermission(role, Permissions.DOCUMENT_READ)).toBe(true);
      expect(hasPermission(role, Permissions.DOCUMENT_CREATE)).toBe(false);
    });

    test('should have finance access', () => {
      expect(hasPermission(role, Permissions.FINANCE_READ)).toBe(true);
      expect(canAccessFinance(role)).toBe(true);
    });

    test('should NOT have staff management', () => {
      expect(canManageStaff(role)).toBe(false);
    });
  });

  describe('Permission Helper Functions', () => {
    test('hasAnyPermission should return true if user has at least one permission', () => {
      const result = hasAnyPermission('CLINIC_DOCTOR', [
        Permissions.PATIENT_READ,
        Permissions.STAFF_CREATE, // Don't have this
      ]);
      expect(result).toBe(true);
    });

    test('hasAnyPermission should return false if user has none of the permissions', () => {
      const result = hasAnyPermission('RECEPTIONIST', [
        Permissions.TREATMENT_CREATE,
        Permissions.TREATMENT_FINALIZE,
        Permissions.STAFF_CREATE,
      ]);
      expect(result).toBe(false);
    });

    test('hasAllPermissions should return true if user has all permissions', () => {
      const result = hasAllPermissions('ADMIN', [
        Permissions.PATIENT_READ,
        Permissions.TREATMENT_CREATE,
        Permissions.FINANCE_READ,
      ]);
      expect(result).toBe(true);
    });

    test('hasAllPermissions should return false if user is missing any permission', () => {
      const result = hasAllPermissions('RECEPTIONIST', [
        Permissions.APPOINTMENT_READ, // Has this
        Permissions.TREATMENT_CREATE, // Doesn't have this
      ]);
      expect(result).toBe(false);
    });
  });

  describe('Role Information', () => {
    test('should return correct role names', () => {
      expect(getRoleName('ADMIN')).toBe('Admin/Owner');
      expect(getRoleName('CLINIC_DOCTOR')).toBe('Clinic Doctor');
      expect(getRoleName('HYGIENIST')).toBe('Hygienist/Assistant');
      expect(getRoleName('RECEPTIONIST')).toBe('Receptionist/Staff');
      expect(getRoleName('EXTERNAL_DOCTOR')).toBe('Individual Doctor');
    });

    test('should return role descriptions', () => {
      const adminDesc = getRoleDescription('ADMIN');
      const doctorDesc = getRoleDescription('CLINIC_DOCTOR');
      const externalDesc = getRoleDescription('EXTERNAL_DOCTOR');

      expect(adminDesc).toContain('Full system access');
      expect(doctorDesc).toContain('Full clinical access');
      expect(externalDesc).toContain('Full access to own patients');
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid role gracefully', () => {
      const result = hasPermission('INVALID_ROLE' as Role, Permissions.PATIENT_READ);
      expect(result).toBe(false);
    });

    test('should handle empty permission array', () => {
      const resultAny = hasAnyPermission('ADMIN', []);
      const resultAll = hasAllPermissions('ADMIN', []);
      
      expect(resultAny).toBe(false);
      expect(resultAll).toBe(true); // Empty array means all conditions are met
    });
  });
});

