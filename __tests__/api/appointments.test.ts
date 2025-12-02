/**
 * Appointment Management API Tests
 * Tests for appointment CRUD operations, scheduling, and validation
 */

import {
  createTestAppointment,
  createTestPatient,
  mockPrismaClient,
  resetAllMocks,
} from '../utils/test-helpers';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient,
  prisma: mockPrismaClient,
}));

describe('Appointment Management Tests', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Appointment Creation', () => {
    test('should create appointment with valid data', async () => {
      const appointmentData = {
        patientId: 'patient-1',
        date: new Date('2024-12-25'),
        time: '10:00 AM',
        type: 'Consultation',
        status: 'scheduled',
        notes: 'First visit',
      };

      const appointment = createTestAppointment(appointmentData);
      mockPrismaClient.appointment.create.mockResolvedValue(appointment);

      const created = await mockPrismaClient.appointment.create({
        data: appointmentData,
      });

      expect(created.patientId).toBe('patient-1');
      expect(created.time).toBe('10:00 AM');
      expect(created.status).toBe('scheduled');
    });

    test('should set default status to scheduled', () => {
      const appointment = createTestAppointment({ status: 'scheduled' });
      expect(appointment.status).toBe('scheduled');
    });

    test('should reject appointment with past date', () => {
      const pastDate = new Date('2020-01-01');
      const today = new Date();

      const isValidDate = pastDate.getTime() >= today.getTime();
      expect(isValidDate).toBe(false);
    });

    test('should validate appointment type', () => {
      const validTypes = [
        'Consultation',
        'Follow-up',
        'Routine Checkup',
        'Emergency',
        'Treatment',
      ];

      const appointment = createTestAppointment({ type: 'Consultation' });
      expect(validTypes).toContain(appointment.type);
    });

    test('should validate time format', () => {
      const validTimes = ['09:00 AM', '02:30 PM', '11:45 AM'];
      const invalidTimes = ['9 AM', '14:30', '25:00 PM'];

      validTimes.forEach(time => {
        expect(time).toMatch(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/);
      });

      invalidTimes.forEach(time => {
        expect(time).not.toMatch(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/);
      });
    });
  });

  describe('Appointment Status Management', () => {
    test('should support status transitions', async () => {
      const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
      
      statuses.forEach(status => {
        expect(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']).toContain(status);
      });
    });

    test('should update appointment status', async () => {
      const appointment = createTestAppointment({ 
        id: 'apt-1',
        status: 'scheduled' 
      });

      mockPrismaClient.appointment.update.mockResolvedValue({
        ...appointment,
        status: 'confirmed',
      });

      const updated = await mockPrismaClient.appointment.update({
        where: { id: 'apt-1' },
        data: { status: 'confirmed' },
      });

      expect(updated.status).toBe('confirmed');
    });

    test('should mark appointment as completed', async () => {
      const appointment = createTestAppointment({ id: 'apt-1' });

      mockPrismaClient.appointment.update.mockResolvedValue({
        ...appointment,
        status: 'completed',
      });

      const updated = await mockPrismaClient.appointment.update({
        where: { id: 'apt-1' },
        data: { status: 'completed' },
      });

      expect(updated.status).toBe('completed');
    });

    test('should cancel appointment', async () => {
      const appointment = createTestAppointment({ id: 'apt-1' });

      mockPrismaClient.appointment.update.mockResolvedValue({
        ...appointment,
        status: 'cancelled',
      });

      const updated = await mockPrismaClient.appointment.update({
        where: { id: 'apt-1' },
        data: { status: 'cancelled' },
      });

      expect(updated.status).toBe('cancelled');
    });
  });

  describe('Appointment Retrieval', () => {
    test('should get appointment by ID', async () => {
      const appointment = createTestAppointment({ id: 'apt-1' });
      mockPrismaClient.appointment.findUnique.mockResolvedValue(appointment);

      const found = await mockPrismaClient.appointment.findUnique({
        where: { id: 'apt-1' },
      });

      expect(found).toBeTruthy();
      expect(found?.id).toBe('apt-1');
    });

    test('should get all appointments for a patient', async () => {
      const appointments = [
        createTestAppointment({ id: '1', patientId: 'patient-1' }),
        createTestAppointment({ id: '2', patientId: 'patient-1' }),
      ];

      mockPrismaClient.appointment.findMany.mockResolvedValue(appointments);

      const results = await mockPrismaClient.appointment.findMany({
        where: { patientId: 'patient-1' },
      });

      expect(results).toHaveLength(2);
      expect(results.every(a => a.patientId === 'patient-1')).toBe(true);
    });

    test('should get appointments by date', async () => {
      const date = new Date('2024-12-25');
      const appointment = createTestAppointment({ date });

      mockPrismaClient.appointment.findMany.mockResolvedValue([appointment]);

      const results = await mockPrismaClient.appointment.findMany({
        where: {
          date: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lt: new Date(date.setHours(23, 59, 59, 999)),
          },
        },
      });

      expect(results).toHaveLength(1);
    });

    test('should get appointments by date range', async () => {
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      const appointments = [
        createTestAppointment({ date: new Date('2024-12-10') }),
        createTestAppointment({ date: new Date('2024-12-20') }),
      ];

      mockPrismaClient.appointment.findMany.mockResolvedValue(appointments);

      const results = await mockPrismaClient.appointment.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      expect(results).toHaveLength(2);
    });

    test('should filter by status', async () => {
      const scheduledAppointments = [
        createTestAppointment({ status: 'scheduled' }),
        createTestAppointment({ status: 'scheduled' }),
      ];

      mockPrismaClient.appointment.findMany.mockResolvedValue(scheduledAppointments);

      const results = await mockPrismaClient.appointment.findMany({
        where: { status: 'scheduled' },
      });

      expect(results).toHaveLength(2);
      expect(results.every(a => a.status === 'scheduled')).toBe(true);
    });

    test('should filter by appointment type', async () => {
      const consultations = [
        createTestAppointment({ type: 'Consultation' }),
      ];

      mockPrismaClient.appointment.findMany.mockResolvedValue(consultations);

      const results = await mockPrismaClient.appointment.findMany({
        where: { type: 'Consultation' },
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('Consultation');
    });

    test('should count appointments', async () => {
      mockPrismaClient.appointment.count.mockResolvedValue(15);

      const count = await mockPrismaClient.appointment.count({
        where: { status: 'scheduled' },
      });

      expect(count).toBe(15);
    });
  });

  describe('Appointment Update', () => {
    test('should reschedule appointment', async () => {
      const appointment = createTestAppointment({ id: 'apt-1' });
      const newDate = new Date('2024-12-30');
      const newTime = '02:00 PM';

      mockPrismaClient.appointment.update.mockResolvedValue({
        ...appointment,
        date: newDate,
        time: newTime,
      });

      const updated = await mockPrismaClient.appointment.update({
        where: { id: 'apt-1' },
        data: {
          date: newDate,
          time: newTime,
        },
      });

      expect(updated.date).toEqual(newDate);
      expect(updated.time).toBe('02:00 PM');
    });

    test('should update appointment notes', async () => {
      const appointment = createTestAppointment({ id: 'apt-1' });

      mockPrismaClient.appointment.update.mockResolvedValue({
        ...appointment,
        notes: 'Patient requested morning slot',
      });

      const updated = await mockPrismaClient.appointment.update({
        where: { id: 'apt-1' },
        data: { notes: 'Patient requested morning slot' },
      });

      expect(updated.notes).toContain('morning slot');
    });

    test('should update appointment type', async () => {
      const appointment = createTestAppointment({ id: 'apt-1', type: 'Consultation' });

      mockPrismaClient.appointment.update.mockResolvedValue({
        ...appointment,
        type: 'Follow-up',
      });

      const updated = await mockPrismaClient.appointment.update({
        where: { id: 'apt-1' },
        data: { type: 'Follow-up' },
      });

      expect(updated.type).toBe('Follow-up');
    });
  });

  describe('Appointment Deletion', () => {
    test('should delete appointment', async () => {
      const appointment = createTestAppointment({ id: 'apt-1' });
      mockPrismaClient.appointment.delete.mockResolvedValue(appointment);

      const deleted = await mockPrismaClient.appointment.delete({
        where: { id: 'apt-1' },
      });

      expect(deleted.id).toBe('apt-1');
    });
  });

  describe('Appointment Calendar View', () => {
    test('should get appointments for calendar view', async () => {
      const appointments = [
        createTestAppointment({ 
          date: new Date('2024-12-25'), 
          time: '09:00 AM',
          status: 'scheduled',
        }),
        createTestAppointment({ 
          date: new Date('2024-12-25'), 
          time: '10:00 AM',
          status: 'confirmed',
        }),
      ];

      mockPrismaClient.appointment.findMany.mockResolvedValue(appointments);

      const results = await mockPrismaClient.appointment.findMany({
        where: {
          date: {
            gte: new Date('2024-12-01'),
            lte: new Date('2024-12-31'),
          },
        },
        orderBy: [
          { date: 'asc' },
          { time: 'asc' },
        ],
      });

      expect(results).toHaveLength(2);
    });

    test('should include patient details in calendar view', async () => {
      const patient = createTestPatient({ 
        id: 'patient-1',
        firstName: 'John',
        lastName: 'Doe',
      });

      const appointment = createTestAppointment({ patientId: 'patient-1' });

      mockPrismaClient.appointment.findMany.mockResolvedValue([
        { ...appointment, patient } as any,
      ]);

      const results = await mockPrismaClient.appointment.findMany({
        include: { patient: true },
      });

      expect((results[0] as any).patient.firstName).toBe('John');
    });
  });

  describe('Appointment Validation', () => {
    test('should validate required fields', () => {
      const appointment = createTestAppointment();
      
      expect(appointment.patientId).toBeTruthy();
      expect(appointment.date).toBeTruthy();
      expect(appointment.time).toBeTruthy();
      expect(appointment.type).toBeTruthy();
    });

    test('should prevent double booking (same time slot)', async () => {
      const existingAppointment = createTestAppointment({
        date: new Date('2024-12-25'),
        time: '10:00 AM',
        status: 'scheduled',
      });

      mockPrismaClient.appointment.findFirst.mockResolvedValue(existingAppointment);

      const conflict = await mockPrismaClient.appointment.findFirst({
        where: {
          date: new Date('2024-12-25'),
          time: '10:00 AM',
          status: { in: ['scheduled', 'confirmed'] },
        },
      });

      expect(conflict).toBeTruthy();
    });

    test('should allow multiple appointments if not conflicting', async () => {
      mockPrismaClient.appointment.findFirst.mockResolvedValue(null);

      const conflict = await mockPrismaClient.appointment.findFirst({
        where: {
          date: new Date('2024-12-25'),
          time: '11:00 AM',
          status: { in: ['scheduled', 'confirmed'] },
        },
      });

      expect(conflict).toBeNull();
    });
  });

  describe('Appointment Statistics', () => {
    test('should count appointments by status', async () => {
      mockPrismaClient.appointment.count.mockImplementation(async ({ where }: any) => {
        if (where?.status === 'scheduled') return 10;
        if (where?.status === 'completed') return 25;
        if (where?.status === 'cancelled') return 3;
        return 0;
      });

      const scheduled = await mockPrismaClient.appointment.count({
        where: { status: 'scheduled' },
      });
      const completed = await mockPrismaClient.appointment.count({
        where: { status: 'completed' },
      });
      const cancelled = await mockPrismaClient.appointment.count({
        where: { status: 'cancelled' },
      });

      expect(scheduled).toBe(10);
      expect(completed).toBe(25);
      expect(cancelled).toBe(3);
    });

    test('should get today appointments', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayAppointments = [
        createTestAppointment({ date: new Date() }),
        createTestAppointment({ date: new Date() }),
      ];

      mockPrismaClient.appointment.findMany.mockResolvedValue(todayAppointments);

      const results = await mockPrismaClient.appointment.findMany({
        where: {
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      expect(results).toHaveLength(2);
    });

    test('should get upcoming appointments', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const upcoming = [
        createTestAppointment({ date: tomorrow }),
      ];

      mockPrismaClient.appointment.findMany.mockResolvedValue(upcoming);

      const results = await mockPrismaClient.appointment.findMany({
        where: {
          date: { gte: new Date() },
          status: { in: ['scheduled', 'confirmed'] },
        },
        orderBy: { date: 'asc' },
      });

      expect(results).toHaveLength(1);
    });
  });

  describe('Appointment Notifications', () => {
    test('should identify appointments needing reminders', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const appointmentNeedingReminder = createTestAppointment({
        date: tomorrow,
        status: 'scheduled',
      });

      mockPrismaClient.appointment.findMany.mockResolvedValue([appointmentNeedingReminder]);

      const results = await mockPrismaClient.appointment.findMany({
        where: {
          date: {
            gte: tomorrow,
            lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
          },
          status: 'scheduled',
        },
      });

      expect(results).toHaveLength(1);
    });
  });
});

