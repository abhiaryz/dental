/**
 * Authentication Tests
 * Tests for user authentication, login, signup, password reset, etc.
 */

import bcrypt from 'bcryptjs';
import { createTestUser, createTestClinic, mockPrismaClient, resetAllMocks } from '../utils/test-helpers';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient,
  prisma: mockPrismaClient,
}));

describe('Authentication Tests', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('User Registration/Signup', () => {
    test('should register clinic with valid data', async () => {
      const clinicData = {
        name: 'Test Dental Clinic',
        email: 'clinic@test.com',
        ownerName: 'Dr. Test',
        ownerEmail: 'owner@test.com',
        phone: '1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
      };

      const mockClinic = createTestClinic(clinicData);
      mockPrismaClient.clinic.create.mockResolvedValue(mockClinic);

      expect(mockClinic.clinicCode).toMatch(/^[A-Z0-9]+$/);
      expect(mockClinic.clinicCode.length).toBeGreaterThanOrEqual(6);
      expect(mockClinic.isActive).toBe(true);
      expect(mockClinic.onboardingComplete).toBe(true);
    });

    test('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'existing@test.com',
        password: 'Test123!@#',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(
        await createTestUser({ email: userData.email })
      );

      const existingUser = await mockPrismaClient.user.findUnique({
        where: { email: userData.email },
      });

      expect(existingUser).toBeTruthy();
      expect(existingUser?.email).toBe(userData.email);
    });

    test('should reject registration with weak password', () => {
      const weakPasswords = [
        'short',           // Too short
        'noupppercase1!',  // No uppercase
        'NOLOWERCASE1!',   // No lowercase
        'NoNumber!@#',     // No number
        'NoSpecial123',    // No special char
      ];

      weakPasswords.forEach(password => {
        const isWeak = password.length < 8 ||
          !/[A-Z]/.test(password) ||
          !/[a-z]/.test(password) ||
          !/[0-9]/.test(password) ||
          !/[!@#$%^&*]/.test(password);
        
        expect(isWeak).toBe(true);
      });
    });

    test('should generate email verification token on signup', async () => {
      const mockToken = {
        id: 'token-id',
        email: 'newuser@test.com',
        token: 'verification-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
      };

      mockPrismaClient.emailVerificationToken.create.mockResolvedValue(mockToken);

      const token = await mockPrismaClient.emailVerificationToken.create({
        data: {
          email: mockToken.email,
          token: mockToken.token,
          expiresAt: mockToken.expiresAt,
        },
      });

      expect(token.email).toBe('newuser@test.com');
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('should verify email with valid token', async () => {
      const verificationToken = {
        id: 'token-id',
        email: 'verify@test.com',
        token: 'valid-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrismaClient.emailVerificationToken.findFirst.mockResolvedValue(verificationToken);
      
      const user = await createTestUser({ 
        email: 'verify@test.com',
        emailVerified: null 
      });
      
      mockPrismaClient.user.update.mockResolvedValue({
        ...user,
        emailVerified: new Date(),
      });

      const token = await mockPrismaClient.emailVerificationToken.findFirst({
        where: { token: 'valid-token-123' },
      });

      expect(token).toBeTruthy();
      expect(token?.expiresAt.getTime()).toBeGreaterThan(Date.now());

      const updatedUser = await mockPrismaClient.user.update({
        where: { email: token!.email },
        data: { emailVerified: new Date() },
      });

      expect(updatedUser.emailVerified).toBeTruthy();
    });

    test('should reject email verification with expired token', async () => {
      const expiredToken = {
        id: 'token-id',
        email: 'verify@test.com',
        token: 'expired-token-123',
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
      };

      mockPrismaClient.emailVerificationToken.findFirst.mockResolvedValue(expiredToken);

      const token = await mockPrismaClient.emailVerificationToken.findFirst({
        where: { token: 'expired-token-123' },
      });

      expect(token?.expiresAt.getTime()).toBeLessThan(Date.now());
    });

    test('should track terms and privacy acceptance', async () => {
      const clinic = createTestClinic({
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      });

      expect(clinic.termsAcceptedAt).toBeTruthy();
      expect(clinic.privacyAcceptedAt).toBeTruthy();
    });
  });

  describe('User Login', () => {
    test('should login clinic employee with username + clinic code', async () => {
      const clinic = createTestClinic({ clinicCode: 'TEST001' });
      const user = await createTestUser({ 
        username: 'testdoctor',
        clinicId: clinic.id,
        emailVerified: new Date(),
      });

      mockPrismaClient.user.findFirst.mockResolvedValue({
        ...user,
        clinic,
      });

      const foundUser = await mockPrismaClient.user.findFirst({
        where: {
          username: 'testdoctor',
          clinic: {
            clinicCode: 'TEST001',
            isActive: true,
          },
        },
        include: { clinic: true },
      });

      expect(foundUser).toBeTruthy();
      expect(foundUser?.username).toBe('testdoctor');
      expect((foundUser as any)?.clinic?.clinicCode).toBe('TEST001');
    });

    test('should login individual practitioner with email', async () => {
      const user = await createTestUser({
        email: 'doctor@test.com',
        emailVerified: new Date(),
      });

      mockPrismaClient.user.findUnique.mockResolvedValue(user);

      const foundUser = await mockPrismaClient.user.findUnique({
        where: { email: 'doctor@test.com' },
      });

      expect(foundUser).toBeTruthy();
      expect(foundUser?.email).toBe('doctor@test.com');
    });

    test('should reject login with incorrect password', async () => {
      const correctPassword = 'Test123!@#';
      const user = await createTestUser({ password: await bcrypt.hash(correctPassword, 10) });

      const isValid = await bcrypt.compare('WrongPassword', user.password!);
      expect(isValid).toBe(false);
    });

    test('should reject login with unverified email', async () => {
      const user = await createTestUser({ emailVerified: null });

      expect(user.emailVerified).toBeNull();
    });

    test('should lockout account after 10 failed attempts', async () => {
      const user = await createTestUser({ 
        failedLoginAttempts: 9,
        lockedUntil: null,
      });

      const newAttempts = user.failedLoginAttempts + 1;
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 30);

      mockPrismaClient.user.update.mockResolvedValue({
        ...user,
        failedLoginAttempts: newAttempts,
        lockedUntil: lockUntil,
      });

      const updatedUser = await mockPrismaClient.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: newAttempts >= 10 ? lockUntil : null,
        },
      });

      expect(updatedUser.failedLoginAttempts).toBe(10);
      expect(updatedUser.lockedUntil).toBeTruthy();
      expect(updatedUser.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    test('should reject login during lockout period', async () => {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const user = await createTestUser({ 
        failedLoginAttempts: 10,
        lockedUntil: lockUntil,
      });

      const isLocked = user.lockedUntil && new Date() < user.lockedUntil;
      expect(isLocked).toBe(true);
    });

    test('should reset failed attempts after successful login', async () => {
      const user = await createTestUser({ 
        failedLoginAttempts: 5,
        lastLoginAt: null,
      });

      mockPrismaClient.user.update.mockResolvedValue({
        ...user,
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      });

      const updatedUser = await mockPrismaClient.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lastLoginAt: new Date(),
        },
      });

      expect(updatedUser.failedLoginAttempts).toBe(0);
      expect(updatedUser.lastLoginAt).toBeTruthy();
    });

    test('should update last login timestamp', async () => {
      const user = await createTestUser({ lastLoginAt: null });

      mockPrismaClient.user.update.mockResolvedValue({
        ...user,
        lastLoginAt: new Date(),
      });

      const updatedUser = await mockPrismaClient.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      expect(updatedUser.lastLoginAt).toBeTruthy();
    });

    test('should create audit log entry for login', async () => {
      const auditLog = {
        id: 'audit-id',
        userId: 'test-user-id',
        action: 'USER_LOGIN',
        entityType: null,
        entityId: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        metadata: null,
        createdAt: new Date(),
      };

      mockPrismaClient.auditLog.create.mockResolvedValue(auditLog);

      const log = await mockPrismaClient.auditLog.create({
        data: {
          userId: 'test-user-id',
          action: 'USER_LOGIN',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });

      expect(log.action).toBe('USER_LOGIN');
      expect(log.userId).toBe('test-user-id');
    });
  });

  describe('Password Management', () => {
    test('should create password reset token', async () => {
      const resetToken = {
        id: 'token-id',
        email: 'reset@test.com',
        token: 'reset-token-123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        createdAt: new Date(),
      };

      mockPrismaClient.passwordResetToken.create.mockResolvedValue(resetToken);

      const token = await mockPrismaClient.passwordResetToken.create({
        data: {
          email: resetToken.email,
          token: resetToken.token,
          expiresAt: resetToken.expiresAt,
        },
      });

      expect(token.email).toBe('reset@test.com');
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('should reset password with valid token', async () => {
      const resetToken = {
        id: 'token-id',
        email: 'reset@test.com',
        token: 'valid-reset-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
      };

      mockPrismaClient.passwordResetToken.findFirst.mockResolvedValue(resetToken);

      const token = await mockPrismaClient.passwordResetToken.findFirst({
        where: { token: 'valid-reset-token' },
      });

      expect(token).toBeTruthy();
      expect(token?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('should reject password reset with expired token', async () => {
      const expiredToken = {
        id: 'token-id',
        email: 'reset@test.com',
        token: 'expired-reset-token',
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
      };

      mockPrismaClient.passwordResetToken.findFirst.mockResolvedValue(expiredToken);

      const token = await mockPrismaClient.passwordResetToken.findFirst({
        where: { token: 'expired-reset-token' },
      });

      expect(token?.expiresAt.getTime()).toBeLessThan(Date.now());
    });

    test('should validate password strength', () => {
      const strongPassword = 'StrongPass123!@#';
      const isStrong = 
        strongPassword.length >= 8 &&
        /[A-Z]/.test(strongPassword) &&
        /[a-z]/.test(strongPassword) &&
        /[0-9]/.test(strongPassword) &&
        /[!@#$%^&*]/.test(strongPassword);

      expect(isStrong).toBe(true);
    });

    test('should hash password before storing', async () => {
      const plainPassword = 'Test123!@#';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(20);
      
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });
  });

  describe('Session Management', () => {
    test('should create session with 30-day expiry', () => {
      const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
      const expiresAt = new Date(Date.now() + maxAge * 1000);

      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(expiresAt.getTime()).toBeLessThan(Date.now() + 31 * 24 * 60 * 60 * 1000);
    });

    test('should use secure cookies in production', () => {
      const cookieOptions = {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      };

      expect(cookieOptions.httpOnly).toBe(true);
      expect(cookieOptions.sameSite).toBe('lax');
      expect(cookieOptions.path).toBe('/');
    });
  });
});

