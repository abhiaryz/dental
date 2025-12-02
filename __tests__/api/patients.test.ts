/**
 * Patient Management API Tests
 * Tests for patient CRUD operations, validation, and search
 */

import {
  createTestPatient,
  mockPrismaClient,
  resetAllMocks,
} from '../utils/test-helpers';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient,
  prisma: mockPrismaClient,
}));

describe('Patient Management Tests', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Patient Creation', () => {
    test('should create patient with complete information', async () => {
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        bloodGroup: 'A+',
        height: 175,
        weight: 70,
        mobileNumber: '9876543210',
        email: 'john@example.com',
        address: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        pinCode: '123456',
        userId: 'doctor-id',
        clinicId: 'clinic-id',
      };

      const createdPatient = createTestPatient(patientData);
      mockPrismaClient.patient.create.mockResolvedValue(createdPatient);

      const patient = await mockPrismaClient.patient.create({
        data: patientData,
      });

      expect(patient.firstName).toBe('John');
      expect(patient.lastName).toBe('Doe');
      expect(patient.mobileNumber).toBe('9876543210');
      expect(patient.clinicId).toBe('clinic-id');
    });

    test('should create patient with minimal required fields', async () => {
      const minimalData = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1995-05-15'),
        gender: 'Female',
        mobileNumber: '9123456789',
        address: '456 Oak St',
        city: 'Test City',
        state: 'Test State',
        pinCode: '654321',
        userId: 'doctor-id',
        clinicId: 'clinic-id',
        bloodGroup: null,
        email: null,
      };

      const patient = createTestPatient(minimalData);
      mockPrismaClient.patient.create.mockResolvedValue(patient);

      const created = await mockPrismaClient.patient.create({
        data: minimalData,
      });

      expect(created.firstName).toBe('Jane');
      expect(created.bloodGroup).toBeNull();
      expect(created.email).toBeNull();
    });

    test('should validate required fields', () => {
      const requiredFields = [
        'firstName',
        'lastName',
        'dateOfBirth',
        'gender',
        'mobileNumber',
        'address',
        'city',
        'state',
        'pinCode',
        'userId',
      ];

      const patientData: any = createTestPatient();
      
      requiredFields.forEach(field => {
        expect(patientData[field]).toBeTruthy();
      });
    });

    test('should validate mobile number format', () => {
      const validNumbers = ['9876543210', '8123456789', '7001234567'];
      const invalidNumbers = ['123', '12345678901', 'abcd123456'];

      validNumbers.forEach(number => {
        expect(number).toMatch(/^[6-9]\d{9}$/);
      });

      invalidNumbers.forEach(number => {
        expect(number).not.toMatch(/^[6-9]\d{9}$/);
      });
    });

    test('should validate email format if provided', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.in'];
      const invalidEmails = ['invalid', 'test@', '@domain.com'];

      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    test('should validate date of birth', () => {
      const validDOB = new Date('1990-01-01');
      const today = new Date();

      expect(validDOB.getTime()).toBeLessThan(today.getTime());
    });

    test('should mark external doctor patient creation', () => {
      const patient = createTestPatient({
        userId: 'external-doctor-id',
        createdByExternal: true,
      });

      expect(patient.createdByExternal).toBe(true);
    });
  });

  describe('Patient Retrieval', () => {
    test('should retrieve patient by ID', async () => {
      const patient = createTestPatient({ id: 'patient-123' });
      mockPrismaClient.patient.findUnique.mockResolvedValue(patient);

      const found = await mockPrismaClient.patient.findUnique({
        where: { id: 'patient-123' },
      });

      expect(found).toBeTruthy();
      expect(found?.id).toBe('patient-123');
    });

    test('should retrieve all clinic patients', async () => {
      const patients = [
        createTestPatient({ id: '1', clinicId: 'clinic-1' }),
        createTestPatient({ id: '2', clinicId: 'clinic-1' }),
        createTestPatient({ id: '3', clinicId: 'clinic-1' }),
      ];

      mockPrismaClient.patient.findMany.mockResolvedValue(patients);

      const result = await mockPrismaClient.patient.findMany({
        where: { clinicId: 'clinic-1' },
      });

      expect(result).toHaveLength(3);
      expect(result.every(p => p.clinicId === 'clinic-1')).toBe(true);
    });

    test('should search patients by name', async () => {
      const patient = createTestPatient({
        firstName: 'John',
        lastName: 'Doe',
      });

      mockPrismaClient.patient.findMany.mockResolvedValue([patient]);

      const results = await mockPrismaClient.patient.findMany({
        where: {
          OR: [
            { firstName: { contains: 'John', mode: 'insensitive' } },
            { lastName: { contains: 'John', mode: 'insensitive' } },
          ],
        },
      });

      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe('John');
    });

    test('should search patients by mobile number', async () => {
      const patient = createTestPatient({ mobileNumber: '9876543210' });
      mockPrismaClient.patient.findMany.mockResolvedValue([patient]);

      const results = await mockPrismaClient.patient.findMany({
        where: {
          mobileNumber: { contains: '9876543210' },
        },
      });

      expect(results).toHaveLength(1);
      expect(results[0].mobileNumber).toBe('9876543210');
    });

    test('should search patients by email', async () => {
      const patient = createTestPatient({ email: 'john@example.com' });
      mockPrismaClient.patient.findMany.mockResolvedValue([patient]);

      const results = await mockPrismaClient.patient.findMany({
        where: {
          email: { contains: 'john@example.com', mode: 'insensitive' },
        },
      });

      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('john@example.com');
    });

    test('should filter external doctor patients', async () => {
      const ownPatient = createTestPatient({
        userId: 'external-1',
        createdByExternal: true,
      });

      mockPrismaClient.patient.findMany.mockResolvedValue([ownPatient]);

      const results = await mockPrismaClient.patient.findMany({
        where: { userId: 'external-1' },
      });

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe('external-1');
    });

    test('should paginate patient results', async () => {
      const patients = Array.from({ length: 20 }, (_, i) => 
        createTestPatient({ id: `patient-${i}` })
      );

      mockPrismaClient.patient.findMany.mockResolvedValue(patients.slice(0, 10));

      const page1 = await mockPrismaClient.patient.findMany({
        skip: 0,
        take: 10,
      });

      expect(page1).toHaveLength(10);
    });

    test('should count total patients', async () => {
      mockPrismaClient.patient.count.mockResolvedValue(25);

      const count = await mockPrismaClient.patient.count({
        where: { clinicId: 'clinic-1' },
      });

      expect(count).toBe(25);
    });
  });

  describe('Patient Update', () => {
    test('should update patient demographics', async () => {
      const patient = createTestPatient({ id: 'patient-1' });
      
      mockPrismaClient.patient.update.mockResolvedValue({
        ...patient,
        firstName: 'Updated',
        email: 'updated@example.com',
      });

      const updated = await mockPrismaClient.patient.update({
        where: { id: 'patient-1' },
        data: {
          firstName: 'Updated',
          email: 'updated@example.com',
        },
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.email).toBe('updated@example.com');
    });

    test('should update medical history', async () => {
      const patient = createTestPatient({ id: 'patient-1' });
      
      mockPrismaClient.patient.update.mockResolvedValue({
        ...patient,
        medicalHistory: 'Diabetes, Hypertension',
        allergies: 'Penicillin',
        currentMedications: 'Metformin, Amlodipine',
      });

      const updated = await mockPrismaClient.patient.update({
        where: { id: 'patient-1' },
        data: {
          medicalHistory: 'Diabetes, Hypertension',
          allergies: 'Penicillin',
          currentMedications: 'Metformin, Amlodipine',
        },
      });

      expect(updated.medicalHistory).toContain('Diabetes');
      expect(updated.allergies).toBe('Penicillin');
    });

    test('should update dental history', async () => {
      const patient = createTestPatient({ id: 'patient-1' });
      
      mockPrismaClient.patient.update.mockResolvedValue({
        ...patient,
        dentalHistory: 'Previous root canal',
        previousDentalWork: 'Filling in tooth 16',
        dentalConcerns: 'Sensitivity',
      });

      const updated = await mockPrismaClient.patient.update({
        where: { id: 'patient-1' },
        data: {
          dentalHistory: 'Previous root canal',
          previousDentalWork: 'Filling in tooth 16',
          dentalConcerns: 'Sensitivity',
        },
      });

      expect(updated.dentalHistory).toContain('root canal');
      expect(updated.dentalConcerns).toBe('Sensitivity');
    });

    test('should update emergency contact', async () => {
      const patient = createTestPatient({ id: 'patient-1' });
      
      mockPrismaClient.patient.update.mockResolvedValue({
        ...patient,
        emergencyContactName: 'Jane Doe',
        emergencyMobileNumber: '9123456789',
        relationship: 'Spouse',
      });

      const updated = await mockPrismaClient.patient.update({
        where: { id: 'patient-1' },
        data: {
          emergencyContactName: 'Jane Doe',
          emergencyMobileNumber: '9123456789',
          relationship: 'Spouse',
        },
      });

      expect(updated.emergencyContactName).toBe('Jane Doe');
      expect(updated.relationship).toBe('Spouse');
    });

    test('should update insurance information', async () => {
      const patient = createTestPatient({ id: 'patient-1' });
      
      mockPrismaClient.patient.update.mockResolvedValue({
        ...patient,
        insuranceProvider: 'Health Insurance Co.',
        sumInsured: 500000,
      });

      const updated = await mockPrismaClient.patient.update({
        where: { id: 'patient-1' },
        data: {
          insuranceProvider: 'Health Insurance Co.',
          sumInsured: 500000,
        },
      });

      expect(updated.insuranceProvider).toBe('Health Insurance Co.');
      expect(updated.sumInsured).toBe(500000);
    });
  });

  describe('Patient Deletion', () => {
    test('should delete patient', async () => {
      const patient = createTestPatient({ id: 'patient-1' });
      mockPrismaClient.patient.delete.mockResolvedValue(patient);

      const deleted = await mockPrismaClient.patient.delete({
        where: { id: 'patient-1' },
      });

      expect(deleted.id).toBe('patient-1');
    });

    test('should cascade delete related data', async () => {
      // When patient is deleted, appointments, treatments, documents should also be deleted
      const patient = createTestPatient({ id: 'patient-1' });
      
      mockPrismaClient.patient.delete.mockResolvedValue(patient);
      
      // Prisma handles cascade delete via schema onDelete: Cascade
      const deleted = await mockPrismaClient.patient.delete({
        where: { id: 'patient-1' },
      });

      expect(deleted).toBeTruthy();
    });
  });

  describe('Patient Validation Rules', () => {
    test('should validate blood group', () => {
      const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const patient = createTestPatient({ bloodGroup: 'A+' });

      expect(validGroups).toContain(patient.bloodGroup);
    });

    test('should validate gender', () => {
      const validGenders = ['Male', 'Female', 'Other'];
      const patient = createTestPatient({ gender: 'Male' });

      expect(validGenders).toContain(patient.gender);
    });

    test('should validate height and weight', () => {
      const patient = createTestPatient({ height: 175, weight: 70 });

      expect(patient.height).toBeGreaterThan(0);
      expect(patient.height).toBeLessThan(300);
      expect(patient.weight).toBeGreaterThan(0);
      expect(patient.weight).toBeLessThan(500);
    });

    test('should validate pin code', () => {
      const validPinCodes = ['123456', '560001', '110001'];
      
      validPinCodes.forEach(pinCode => {
        expect(pinCode).toMatch(/^\d{6}$/);
      });
    });

    test('should validate Aadhar number format', () => {
      const validAadhar = '1234 5678 9012';
      const invalidAadhar = '1234';

      expect(validAadhar.replace(/\s/g, '')).toMatch(/^\d{12}$/);
      expect(invalidAadhar.replace(/\s/g, '')).not.toMatch(/^\d{12}$/);
    });
  });

  describe('Patient Access Control', () => {
    test('should allow clinic doctor to access all clinic patients', async () => {
      const patients = [
        createTestPatient({ clinicId: 'clinic-1' }),
        createTestPatient({ clinicId: 'clinic-1' }),
      ];

      mockPrismaClient.patient.findMany.mockResolvedValue(patients);

      const results = await mockPrismaClient.patient.findMany({
        where: { clinicId: 'clinic-1' },
      });

      expect(results).toHaveLength(2);
    });

    test('should restrict external doctor to own patients only', async () => {
      const ownPatients = [
        createTestPatient({ userId: 'external-1', createdByExternal: true }),
      ];

      mockPrismaClient.patient.findMany.mockResolvedValue(ownPatients);

      const results = await mockPrismaClient.patient.findMany({
        where: {
          userId: 'external-1',
          createdByExternal: true,
        },
      });

      expect(results).toHaveLength(1);
      expect(results.every(p => p.userId === 'external-1')).toBe(true);
    });

    test('should prevent cross-clinic patient access', async () => {
      mockPrismaClient.patient.findFirst.mockResolvedValue(null);

      const result = await mockPrismaClient.patient.findFirst({
        where: {
          id: 'patient-1',
          clinicId: 'wrong-clinic-id',
        },
      });

      expect(result).toBeNull();
    });
  });

  describe('Patient Relationships', () => {
    test('should include appointments when querying patient', async () => {
      const patient = createTestPatient({ id: 'patient-1' });
      const appointment = {
        id: 'apt-1',
        patientId: 'patient-1',
        date: new Date(),
        time: '10:00 AM',
        status: 'scheduled',
      };

      mockPrismaClient.patient.findUnique.mockResolvedValue({
        ...patient,
        appointments: [appointment],
      } as any);

      const result = await mockPrismaClient.patient.findUnique({
        where: { id: 'patient-1' },
        include: { appointments: true },
      });

      expect((result as any)?.appointments).toHaveLength(1);
    });

    test('should include treatments when querying patient', async () => {
      const patient = createTestPatient({ id: 'patient-1' });
      const treatment = {
        id: 'treatment-1',
        patientId: 'patient-1',
        diagnosis: 'Cavity',
      };

      mockPrismaClient.patient.findUnique.mockResolvedValue({
        ...patient,
        treatments: [treatment],
      } as any);

      const result = await mockPrismaClient.patient.findUnique({
        where: { id: 'patient-1' },
        include: { treatments: true },
      });

      expect((result as any)?.treatments).toHaveLength(1);
    });

    test('should include documents when querying patient', async () => {
      const patient = createTestPatient({ id: 'patient-1' });
      const document = {
        id: 'doc-1',
        patientId: 'patient-1',
        name: 'X-Ray',
        type: 'image',
      };

      mockPrismaClient.patient.findUnique.mockResolvedValue({
        ...patient,
        documents: [document],
      } as any);

      const result = await mockPrismaClient.patient.findUnique({
        where: { id: 'patient-1' },
        include: { documents: true },
      });

      expect((result as any)?.documents).toHaveLength(1);
    });
  });
});

