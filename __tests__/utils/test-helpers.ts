/**
 * Test Helper Utilities
 * Common functions and mocks for testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock Prisma Client for tests
export const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  clinic: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  patient: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  appointment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  treatment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  invoice: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  inventoryItem: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  emailVerificationToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  invitation: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as unknown as PrismaClient;

// Test User Factory
export const createTestUser = async (overrides = {}) => {
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);
  return {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: hashedPassword,
    role: 'CLINIC_DOCTOR',
    emailVerified: new Date(),
    isExternal: false,
    clinicId: 'test-clinic-id',
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

// Test Clinic Factory
export const createTestClinic = (overrides = {}) => ({
  id: 'test-clinic-id',
  name: 'Test Clinic',
  clinicCode: 'TEST001',
  type: 'CLINIC',
  email: 'clinic@example.com',
  phone: '1234567890',
  address: '123 Test St',
  city: 'Test City',
  state: 'Test State',
  logo: null,
  isActive: true,
  ownerName: 'Test Owner',
  ownerEmail: 'owner@example.com',
  planType: 'free',
  maxUsers: 5,
  onboardingComplete: true,
  onboardingStep: 4,
  termsAcceptedAt: new Date(),
  privacyAcceptedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Test Patient Factory
export const createTestPatient = (overrides = {}) => ({
  id: 'test-patient-id',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'Male',
  bloodGroup: 'A+',
  height: 175,
  weight: 70,
  mobileNumber: '9876543210',
  alternateMobileNumber: null,
  email: 'patient@example.com',
  address: '456 Patient St',
  city: 'Test City',
  state: 'Test State',
  pinCode: '123456',
  aadharNumber: null,
  emergencyContactName: 'Jane Doe',
  emergencyMobileNumber: '9876543211',
  relationship: 'Spouse',
  medicalHistory: null,
  dentalHistory: null,
  allergies: null,
  currentMedications: null,
  previousSurgeries: null,
  dentalConcerns: null,
  previousDentalWork: null,
  preferredPaymentMode: 'CASH',
  insuranceProvider: null,
  sumInsured: null,
  userId: 'test-user-id',
  clinicId: 'test-clinic-id',
  createdByExternal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Test Appointment Factory
export const createTestAppointment = (overrides = {}) => ({
  id: 'test-appointment-id',
  patientId: 'test-patient-id',
  date: new Date(),
  time: '10:00 AM',
  type: 'Consultation',
  status: 'scheduled',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Test Treatment Factory
export const createTestTreatment = (overrides = {}) => ({
  id: 'test-treatment-id',
  patientId: 'test-patient-id',
  userId: 'test-user-id',
  treatmentDate: new Date(),
  chiefComplaint: 'Tooth pain',
  clinicalFindings: 'Cavity in tooth 16',
  diagnosis: 'Dental caries',
  treatmentPlan: 'Filling',
  prescription: 'Pain medication',
  notes: null,
  cost: 1000,
  paidAmount: 500,
  selectedTeeth: ['16'],
  followUpDate: null,
  followUpNotes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Test Invoice Factory
export const createTestInvoice = (overrides = {}) => ({
  id: 'test-invoice-id',
  invoiceNumber: 'INV-001',
  patientId: 'test-patient-id',
  treatmentId: 'test-treatment-id',
  amount: 1000,
  taxAmount: 180,
  discountAmount: 0,
  totalAmount: 1180,
  status: 'PENDING',
  dueDate: new Date(),
  paidDate: null,
  notes: null,
  clinicId: 'test-clinic-id',
  createdBy: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock Session Data
export const createMockSession = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'CLINIC_DOCTOR',
    isExternal: false,
    clinicId: 'test-clinic-id',
    clinicName: 'Test Clinic',
    clinicCode: 'TEST001',
    ...overrides.user,
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});

// Mock NextAuth Request
export const createMockAuthRequest = (session = null) => ({
  auth: session || createMockSession(),
  cookies: new Map(),
  nextUrl: {
    pathname: '/',
    search: '',
    searchParams: new URLSearchParams(),
  },
  headers: new Map([
    ['x-forwarded-for', '127.0.0.1'],
    ['user-agent', 'test-agent'],
  ]),
});

// Mock API Request
export const createMockRequest = (options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string>;
} = {}) => {
  const { method = 'GET', body = {}, headers = {}, query = {} } = options;
  
  return {
    method,
    json: async () => body,
    headers: new Headers({
      'content-type': 'application/json',
      ...headers,
    }),
    url: `http://localhost:3000/api/test?${new URLSearchParams(query).toString()}`,
    nextUrl: {
      searchParams: new URLSearchParams(query),
    },
  };
};

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(mockPrismaClient).forEach((resource: any) => {
    if (resource && typeof resource === 'object') {
      Object.values(resource).forEach((method: any) => {
        if (typeof method?.mockReset === 'function') {
          method.mockReset();
        }
      });
    }
  });
};

// Utility to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate random string
export const randomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2);
};

// Generate unique email
export const uniqueEmail = () => {
  return `test-${randomString(8)}@example.com`;
};

// Generate unique clinic code
export const uniqueClinicCode = () => {
  return `TEST${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
};

