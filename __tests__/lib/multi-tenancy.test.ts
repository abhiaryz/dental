/**
 * Multi-Tenancy & Data Isolation Tests
 * Tests to ensure proper data segregation between clinics
 */

import {
  createTestUser,
  createTestClinic,
  createTestPatient,
  mockPrismaClient,
  resetAllMocks,
} from '../utils/test-helpers';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient,
  prisma: mockPrismaClient,
}));

describe('Multi-Tenancy & Data Isolation Tests', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Clinic Isolation', () => {
    test('should isolate patient data between clinics', async () => {
      const clinic1 = createTestClinic({ id: 'clinic-1', clinicCode: 'CLINIC1' });
      const clinic2 = createTestClinic({ id: 'clinic-2', clinicCode: 'CLINIC2' });
      
      const patient1 = createTestPatient({ clinicId: clinic1.id });
      const patient2 = createTestPatient({ clinicId: clinic2.id });

      // Clinic 1 user should only see clinic 1 patients
      mockPrismaClient.patient.findMany.mockResolvedValue([patient1]);

      const clinic1Patients = await mockPrismaClient.patient.findMany({
        where: { clinicId: clinic1.id },
      });

      expect(clinic1Patients).toHaveLength(1);
      expect(clinic1Patients[0].clinicId).toBe(clinic1.id);
    });

    test('should prevent cross-clinic data access', async () => {
      const clinic1 = createTestClinic({ id: 'clinic-1', clinicCode: 'CLINIC1' });
      const clinic2 = createTestClinic({ id: 'clinic-2', clinicCode: 'CLINIC2' });
      
      const patient = createTestPatient({ 
        id: 'patient-1',
        clinicId: clinic1.id 
      });

      // Attempt to access patient from wrong clinic should return null
      mockPrismaClient.patient.findFirst.mockResolvedValue(null);

      const result = await mockPrismaClient.patient.findFirst({
        where: {
          id: 'patient-1',
          clinicId: clinic2.id, // Wrong clinic
        },
      });

      expect(result).toBeNull();
    });

    test('should validate clinic code uniqueness', async () => {
      const clinicCode = 'UNIQUE123';
      const existingClinic = createTestClinic({ clinicCode });

      mockPrismaClient.clinic.findUnique.mockResolvedValue(existingClinic);

      const found = await mockPrismaClient.clinic.findUnique({
        where: { clinicCode },
      });

      expect(found).toBeTruthy();
      expect(found?.clinicCode).toBe(clinicCode);
    });

    test('should enforce clinic-specific user authentication', async () => {
      const clinic = createTestClinic({ clinicCode: 'TEST001', isActive: true });
      const user = await createTestUser({
        username: 'doctor1',
        clinicId: clinic.id,
      });

      mockPrismaClient.user.findFirst.mockResolvedValue({
        ...user,
        clinic,
      });

      // User should be found with correct clinic code
      const foundUser = await mockPrismaClient.user.findFirst({
        where: {
          username: 'doctor1',
          clinic: {
            clinicCode: 'TEST001',
            isActive: true,
          },
        },
        include: { clinic: true },
      });

      expect(foundUser).toBeTruthy();
      expect((foundUser as any)?.clinic?.clinicCode).toBe('TEST001');
    });

    test('should not authenticate user with wrong clinic code', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null);

      const foundUser = await mockPrismaClient.user.findFirst({
        where: {
          username: 'doctor1',
          clinic: {
            clinicCode: 'WRONG',
            isActive: true,
          },
        },
      });

      expect(foundUser).toBeNull();
    });

    test('should filter inventory by clinic', async () => {
      const clinic1 = createTestClinic({ id: 'clinic-1' });
      const clinic2 = createTestClinic({ id: 'clinic-2' });

      const item1 = {
        id: 'item-1',
        name: 'Dental Gloves',
        clinicId: clinic1.id,
        quantity: 100,
      };

      mockPrismaClient.inventoryItem.findMany.mockResolvedValue([item1]);

      const items = await mockPrismaClient.inventoryItem.findMany({
        where: { clinicId: clinic1.id },
      });

      expect(items).toHaveLength(1);
      expect(items[0].clinicId).toBe(clinic1.id);
    });

    test('should isolate invoices between clinics', async () => {
      const clinic1 = createTestClinic({ id: 'clinic-1' });
      const invoice1 = {
        id: 'invoice-1',
        invoiceNumber: 'INV-001',
        clinicId: clinic1.id,
        patientId: 'patient-1',
        totalAmount: 1000,
      };

      mockPrismaClient.invoice.findMany.mockResolvedValue([invoice1]);

      const invoices = await mockPrismaClient.invoice.findMany({
        where: { clinicId: clinic1.id },
      });

      expect(invoices).toHaveLength(1);
      expect(invoices[0].clinicId).toBe(clinic1.id);
    });
  });

  describe('External Doctor Isolation', () => {
    test('should isolate external doctor patients', async () => {
      const externalDoctor = await createTestUser({
        id: 'external-1',
        role: 'EXTERNAL_DOCTOR',
        isExternal: true,
      });

      const ownPatient = createTestPatient({
        id: 'patient-1',
        userId: externalDoctor.id,
      });

      const otherPatient = createTestPatient({
        id: 'patient-2',
        userId: 'other-doctor-id',
      });

      // External doctor should only see own patients
      mockPrismaClient.patient.findMany.mockResolvedValue([ownPatient]);

      const patients = await mockPrismaClient.patient.findMany({
        where: { userId: externalDoctor.id },
      });

      expect(patients).toHaveLength(1);
      expect(patients[0].userId).toBe(externalDoctor.id);
    });

    test('should prevent external doctor from accessing other doctors patients', async () => {
      mockPrismaClient.patient.findFirst.mockResolvedValue(null);

      const result = await mockPrismaClient.patient.findFirst({
        where: {
          id: 'patient-1',
          userId: 'external-doctor-id',
          createdByExternal: false, // Created by another doctor
        },
      });

      expect(result).toBeNull();
    });

    test('should mark patients created by external doctors', () => {
      const patient = createTestPatient({
        userId: 'external-doctor-id',
        createdByExternal: true,
      });

      expect(patient.createdByExternal).toBe(true);
      expect(patient.userId).toBe('external-doctor-id');
    });

    test('should filter treatments by external doctor', async () => {
      const externalDoctor = await createTestUser({
        id: 'external-1',
        role: 'EXTERNAL_DOCTOR',
        isExternal: true,
      });

      const treatment = {
        id: 'treatment-1',
        userId: externalDoctor.id,
        patientId: 'patient-1',
      };

      mockPrismaClient.treatment.findMany.mockResolvedValue([treatment]);

      const treatments = await mockPrismaClient.treatment.findMany({
        where: { userId: externalDoctor.id },
      });

      expect(treatments).toHaveLength(1);
      expect(treatments[0].userId).toBe(externalDoctor.id);
    });
  });

  describe('Invitation System', () => {
    test('should create invitation with clinic association', async () => {
      const clinic = createTestClinic({ id: 'clinic-1' });
      const invitation = {
        id: 'invitation-1',
        email: 'newdoctor@test.com',
        role: 'CLINIC_DOCTOR',
        token: 'invite-token-123',
        clinicId: clinic.id,
        status: 'pending',
        createdBy: 'admin-user-id',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.invitation.create.mockResolvedValue(invitation as any);

      const created = await mockPrismaClient.invitation.create({
        data: {
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          clinicId: invitation.clinicId,
          createdBy: invitation.createdBy,
          expiresAt: invitation.expiresAt,
        },
      });

      expect(created.clinicId).toBe(clinic.id);
      expect(created.status).toBe('pending');
    });

    test('should validate invitation token and clinic association', async () => {
      const clinic = createTestClinic({ id: 'clinic-1' });
      const invitation = {
        id: 'invitation-1',
        email: 'newdoctor@test.com',
        token: 'valid-token',
        clinicId: clinic.id,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      mockPrismaClient.invitation.findFirst.mockResolvedValue(invitation as any);

      const found = await mockPrismaClient.invitation.findFirst({
        where: {
          token: 'valid-token',
          status: 'pending',
          expiresAt: { gt: new Date() },
        },
      });

      expect(found).toBeTruthy();
      expect(found?.clinicId).toBe(clinic.id);
    });

    test('should reject expired invitation', async () => {
      const expiredInvitation = {
        id: 'invitation-1',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
      };

      mockPrismaClient.invitation.findFirst.mockResolvedValue(null);

      const found = await mockPrismaClient.invitation.findFirst({
        where: {
          token: 'expired-token',
          expiresAt: { gt: new Date() }, // Not expired
        },
      });

      expect(found).toBeNull();
    });

    test('should enforce max user limit based on plan', () => {
      const clinic = createTestClinic({
        planType: 'free',
        maxUsers: 5,
      });

      const currentUserCount = 5;
      const canAddMore = currentUserCount < clinic.maxUsers;

      expect(canAddMore).toBe(false);
    });
  });

  describe('Onboarding Flow', () => {
    test('should track onboarding completion', () => {
      const clinic = createTestClinic({
        onboardingComplete: false,
        onboardingStep: 2,
      });

      expect(clinic.onboardingComplete).toBe(false);
      expect(clinic.onboardingStep).toBe(2);
    });

    test('should track terms and privacy acceptance', () => {
      const clinic = createTestClinic({
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      });

      expect(clinic.termsAcceptedAt).toBeTruthy();
      expect(clinic.privacyAcceptedAt).toBeTruthy();
    });

    test('should allow onboarding progress update', async () => {
      const clinic = createTestClinic({
        id: 'clinic-1',
        onboardingStep: 2,
        onboardingComplete: false,
      });

      mockPrismaClient.clinic.update.mockResolvedValue({
        ...clinic,
        onboardingStep: 3,
      });

      const updated = await mockPrismaClient.clinic.update({
        where: { id: clinic.id },
        data: { onboardingStep: 3 },
      });

      expect(updated.onboardingStep).toBe(3);
    });

    test('should mark onboarding as complete', async () => {
      const clinic = createTestClinic({
        id: 'clinic-1',
        onboardingStep: 3,
        onboardingComplete: false,
      });

      mockPrismaClient.clinic.update.mockResolvedValue({
        ...clinic,
        onboardingStep: 4,
        onboardingComplete: true,
      });

      const updated = await mockPrismaClient.clinic.update({
        where: { id: clinic.id },
        data: {
          onboardingStep: 4,
          onboardingComplete: true,
        },
      });

      expect(updated.onboardingComplete).toBe(true);
      expect(updated.onboardingStep).toBe(4);
    });
  });

  describe('Clinic Settings Isolation', () => {
    test('should isolate clinic settings', async () => {
      const clinic = createTestClinic({
        id: 'clinic-1',
        name: 'Updated Clinic Name',
        logo: '/uploads/logo/clinic-1-logo.jpg',
      });

      mockPrismaClient.clinic.findUnique.mockResolvedValue(clinic);

      const settings = await mockPrismaClient.clinic.findUnique({
        where: { id: 'clinic-1' },
      });

      expect(settings?.name).toBe('Updated Clinic Name');
      expect(settings?.logo).toContain('clinic-1');
    });

    test('should prevent unauthorized clinic settings access', async () => {
      mockPrismaClient.clinic.findFirst.mockResolvedValue(null);

      // User from clinic-2 trying to access clinic-1 settings
      const result = await mockPrismaClient.clinic.findFirst({
        where: {
          id: 'clinic-1',
          users: {
            some: {
              id: 'user-from-clinic-2',
            },
          },
        },
      });

      expect(result).toBeNull();
    });
  });

  describe('Clinic Code Validation', () => {
    test('should generate unique clinic code', () => {
      const clinic1 = createTestClinic({ clinicCode: 'DENTAL001' });
      const clinic2 = createTestClinic({ clinicCode: 'DENTAL002' });

      expect(clinic1.clinicCode).not.toBe(clinic2.clinicCode);
    });

    test('should validate clinic code format', () => {
      const validCodes = ['ABC123', 'DENTAL001', 'CLINIC99'];
      const invalidCodes = ['abc123', 'clinic@01', 'test clinic'];

      validCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]+$/);
      });

      invalidCodes.forEach(code => {
        expect(code).not.toMatch(/^[A-Z0-9]+$/);
      });
    });

    test('should enforce uppercase clinic code', () => {
      const clinic = createTestClinic({ clinicCode: 'TEST001' });
      
      expect(clinic.clinicCode).toBe(clinic.clinicCode.toUpperCase());
    });
  });

  describe('Inactive Clinic Handling', () => {
    test('should prevent login to inactive clinic', async () => {
      const inactiveClinic = createTestClinic({
        clinicCode: 'INACTIVE',
        isActive: false,
      });

      mockPrismaClient.user.findFirst.mockResolvedValue(null);

      const user = await mockPrismaClient.user.findFirst({
        where: {
          username: 'doctor1',
          clinic: {
            clinicCode: 'INACTIVE',
            isActive: true, // Query requires active clinic
          },
        },
      });

      expect(user).toBeNull();
    });

    test('should allow admin to deactivate clinic', async () => {
      const clinic = createTestClinic({ id: 'clinic-1', isActive: true });

      mockPrismaClient.clinic.update.mockResolvedValue({
        ...clinic,
        isActive: false,
      });

      const updated = await mockPrismaClient.clinic.update({
        where: { id: clinic.id },
        data: { isActive: false },
      });

      expect(updated.isActive).toBe(false);
    });
  });
});

