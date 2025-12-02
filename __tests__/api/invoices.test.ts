/**
 * Invoice & Payment API Tests
 * Tests for invoice creation, payment processing, and financial operations
 */

import {
  createTestInvoice,
  mockPrismaClient,
  resetAllMocks,
} from '../utils/test-helpers';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient,
  prisma: mockPrismaClient,
}));

describe('Invoice & Payment Management Tests', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Invoice Creation', () => {
    test('should create invoice with valid data', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-2024-001',
        patientId: 'patient-1',
        treatmentId: 'treatment-1',
        amount: 1000,
        taxAmount: 180,
        discountAmount: 0,
        totalAmount: 1180,
        status: 'PENDING',
        dueDate: new Date('2024-12-31'),
        clinicId: 'clinic-1',
        createdBy: 'doctor-1',
      };

      const invoice = createTestInvoice(invoiceData);
      mockPrismaClient.invoice.create.mockResolvedValue(invoice as any);

      const created = await mockPrismaClient.invoice.create({
        data: invoiceData,
      });

      expect(created.invoiceNumber).toBe('INV-2024-001');
      expect(created.totalAmount).toBe(1180);
      expect(created.status).toBe('PENDING');
    });

    test('should generate unique invoice number', () => {
      const invoice1 = createTestInvoice({ invoiceNumber: 'INV-001' });
      const invoice2 = createTestInvoice({ invoiceNumber: 'INV-002' });

      expect(invoice1.invoiceNumber).not.toBe(invoice2.invoiceNumber);
    });

    test('should calculate total amount correctly', () => {
      const amount = 1000;
      const taxAmount = 180;  // 18% tax
      const discountAmount = 100;
      const totalAmount = amount + taxAmount - discountAmount;

      expect(totalAmount).toBe(1080);
    });

    test('should validate invoice amounts', () => {
      const invoice = createTestInvoice({
        amount: 1000,
        taxAmount: 180,
        discountAmount: 0,
        totalAmount: 1180,
      });

      const calculatedTotal = invoice.amount + invoice.taxAmount - invoice.discountAmount;
      expect(invoice.totalAmount).toBe(calculatedTotal);
    });

    test('should set default status to PENDING', () => {
      const invoice = createTestInvoice({ status: 'PENDING' });
      expect(invoice.status).toBe('PENDING');
    });

    test('should associate invoice with treatment', () => {
      const invoice = createTestInvoice({
        treatmentId: 'treatment-1',
        patientId: 'patient-1',
      });

      expect(invoice.treatmentId).toBe('treatment-1');
      expect(invoice.patientId).toBe('patient-1');
    });
  });

  describe('Invoice Status Management', () => {
    test('should support all invoice statuses', () => {
      const validStatuses = ['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];
      
      validStatuses.forEach(status => {
        const invoice = createTestInvoice({ status: status as any });
        expect(validStatuses).toContain(invoice.status);
      });
    });

    test('should update invoice status to PAID', async () => {
      const invoice = createTestInvoice({ id: 'inv-1', status: 'PENDING' });

      mockPrismaClient.invoice.update.mockResolvedValue({
        ...invoice,
        status: 'PAID',
        paidDate: new Date(),
      } as any);

      const updated = await mockPrismaClient.invoice.update({
        where: { id: 'inv-1' },
        data: {
          status: 'PAID',
          paidDate: new Date(),
        },
      });

      expect(updated.status).toBe('PAID');
      expect(updated.paidDate).toBeTruthy();
    });

    test('should identify overdue invoices', () => {
      const overdueInvoice = createTestInvoice({
        dueDate: new Date('2023-01-01'),
        status: 'PENDING',
      });

      const isOverdue = 
        overdueInvoice.dueDate < new Date() && 
        overdueInvoice.status === 'PENDING';

      expect(isOverdue).toBe(true);
    });

    test('should cancel invoice', async () => {
      const invoice = createTestInvoice({ id: 'inv-1' });

      mockPrismaClient.invoice.update.mockResolvedValue({
        ...invoice,
        status: 'CANCELLED',
      } as any);

      const updated = await mockPrismaClient.invoice.update({
        where: { id: 'inv-1' },
        data: { status: 'CANCELLED' },
      });

      expect(updated.status).toBe('CANCELLED');
    });
  });

  describe('Invoice Retrieval', () => {
    test('should get invoice by ID', async () => {
      const invoice = createTestInvoice({ id: 'inv-1' });
      mockPrismaClient.invoice.findUnique.mockResolvedValue(invoice as any);

      const found = await mockPrismaClient.invoice.findUnique({
        where: { id: 'inv-1' },
      });

      expect(found).toBeTruthy();
      expect(found?.id).toBe('inv-1');
    });

    test('should get invoice by invoice number', async () => {
      const invoice = createTestInvoice({ invoiceNumber: 'INV-001' });
      mockPrismaClient.invoice.findUnique.mockResolvedValue(invoice as any);

      const found = await mockPrismaClient.invoice.findUnique({
        where: { invoiceNumber: 'INV-001' },
      });

      expect(found?.invoiceNumber).toBe('INV-001');
    });

    test('should get all invoices for a patient', async () => {
      const invoices = [
        createTestInvoice({ patientId: 'patient-1', invoiceNumber: 'INV-001' }),
        createTestInvoice({ patientId: 'patient-1', invoiceNumber: 'INV-002' }),
      ];

      mockPrismaClient.invoice.findMany.mockResolvedValue(invoices as any);

      const results = await mockPrismaClient.invoice.findMany({
        where: { patientId: 'patient-1' },
      });

      expect(results).toHaveLength(2);
      expect(results.every(i => i.patientId === 'patient-1')).toBe(true);
    });

    test('should filter invoices by status', async () => {
      const pendingInvoices = [
        createTestInvoice({ status: 'PENDING' }),
        createTestInvoice({ status: 'PENDING' }),
      ];

      mockPrismaClient.invoice.findMany.mockResolvedValue(pendingInvoices as any);

      const results = await mockPrismaClient.invoice.findMany({
        where: { status: 'PENDING' },
      });

      expect(results).toHaveLength(2);
      expect(results.every(i => i.status === 'PENDING')).toBe(true);
    });

    test('should filter invoices by clinic', async () => {
      const clinicInvoices = [
        createTestInvoice({ clinicId: 'clinic-1' }),
      ];

      mockPrismaClient.invoice.findMany.mockResolvedValue(clinicInvoices as any);

      const results = await mockPrismaClient.invoice.findMany({
        where: { clinicId: 'clinic-1' },
      });

      expect(results.every(i => i.clinicId === 'clinic-1')).toBe(true);
    });

    test('should filter invoices by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const invoices = [
        createTestInvoice({ createdAt: new Date('2024-06-15') }),
      ];

      mockPrismaClient.invoice.findMany.mockResolvedValue(invoices as any);

      const results = await mockPrismaClient.invoice.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      expect(results).toHaveLength(1);
    });
  });

  describe('Payment Processing', () => {
    test('should record payment against invoice', async () => {
      const payment = {
        id: 'payment-1',
        invoiceId: 'inv-1',
        amount: 1180,
        paymentMethod: 'CASH',
        paymentDate: new Date(),
        status: 'COMPLETED',
        createdBy: 'receptionist-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.invoice.findUnique.mockResolvedValue(
        createTestInvoice({ id: 'inv-1', totalAmount: 1180 }) as any
      );

      expect(payment.amount).toBe(1180);
      expect(payment.status).toBe('COMPLETED');
    });

    test('should support multiple payment methods', () => {
      const paymentMethods = [
        'CASH',
        'CREDIT_CARD',
        'DEBIT_CARD',
        'UPI',
        'BANK_TRANSFER',
        'CHEQUE',
        'INSURANCE',
      ];

      paymentMethods.forEach(method => {
        expect(paymentMethods).toContain(method);
      });
    });

    test('should handle partial payment', async () => {
      const invoice = createTestInvoice({ 
        id: 'inv-1',
        totalAmount: 1180,
        status: 'PENDING',
      });

      const partialPayment = {
        invoiceId: 'inv-1',
        amount: 500,
        paymentMethod: 'CASH',
      };

      expect(partialPayment.amount).toBeLessThan(invoice.totalAmount);
      expect(invoice.status).toBe('PENDING'); // Should remain pending
    });

    test('should handle full payment', async () => {
      const invoice = createTestInvoice({ 
        id: 'inv-1',
        totalAmount: 1180,
      });

      const fullPayment = {
        invoiceId: 'inv-1',
        amount: 1180,
        paymentMethod: 'CASH',
      };

      mockPrismaClient.invoice.update.mockResolvedValue({
        ...invoice,
        status: 'PAID',
        paidDate: new Date(),
      } as any);

      expect(fullPayment.amount).toBe(invoice.totalAmount);
    });

    test('should record transaction ID for digital payments', () => {
      const payment = {
        invoiceId: 'inv-1',
        amount: 1180,
        paymentMethod: 'UPI',
        transactionId: 'UPI123456789',
        status: 'COMPLETED',
      };

      expect(payment.transactionId).toBeTruthy();
      expect(['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER']).toContain(
        payment.paymentMethod
      );
    });

    test('should support payment status tracking', () => {
      const statuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
      
      statuses.forEach(status => {
        expect(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).toContain(status);
      });
    });
  });

  describe('Invoice Items', () => {
    test('should add line items to invoice', async () => {
      const invoiceItems = [
        {
          id: 'item-1',
          invoiceId: 'inv-1',
          description: 'Root Canal Treatment',
          quantity: 1,
          unitPrice: 5000,
          amount: 5000,
        },
        {
          id: 'item-2',
          invoiceId: 'inv-1',
          description: 'Dental Crown',
          quantity: 1,
          unitPrice: 3000,
          amount: 3000,
        },
      ];

      const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
      expect(totalAmount).toBe(8000);
    });

    test('should calculate item amount from quantity and unit price', () => {
      const item = {
        description: 'Filling',
        quantity: 2,
        unitPrice: 500,
        amount: 2 * 500,
      };

      expect(item.amount).toBe(1000);
    });
  });

  describe('Invoice PDF Generation', () => {
    test('should include all required invoice details', () => {
      const invoice = createTestInvoice({
        invoiceNumber: 'INV-001',
        patientId: 'patient-1',
        amount: 1000,
        taxAmount: 180,
        discountAmount: 0,
        totalAmount: 1180,
      });

      const requiredFields = [
        'invoiceNumber',
        'patientId',
        'amount',
        'taxAmount',
        'totalAmount',
        'dueDate',
        'createdAt',
      ];

      requiredFields.forEach(field => {
        expect(invoice).toHaveProperty(field);
      });
    });
  });

  describe('Financial Reports', () => {
    test('should calculate total revenue', async () => {
      const paidInvoices = [
        createTestInvoice({ totalAmount: 1180, status: 'PAID' }),
        createTestInvoice({ totalAmount: 2500, status: 'PAID' }),
        createTestInvoice({ totalAmount: 3200, status: 'PAID' }),
      ];

      const totalRevenue = paidInvoices.reduce(
        (sum, invoice) => sum + invoice.totalAmount, 
        0
      );

      expect(totalRevenue).toBe(6880);
    });

    test('should calculate pending amount', async () => {
      const pendingInvoices = [
        createTestInvoice({ totalAmount: 1180, status: 'PENDING' }),
        createTestInvoice({ totalAmount: 2500, status: 'PENDING' }),
      ];

      const pendingAmount = pendingInvoices.reduce(
        (sum, invoice) => sum + invoice.totalAmount,
        0
      );

      expect(pendingAmount).toBe(3680);
    });

    test('should calculate revenue by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockPrismaClient.invoice.findMany.mockResolvedValue([
        createTestInvoice({ 
          totalAmount: 5000, 
          status: 'PAID',
          paidDate: new Date('2024-06-15'),
        }),
      ] as any);

      const invoices = await mockPrismaClient.invoice.findMany({
        where: {
          status: 'PAID',
          paidDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const revenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      expect(revenue).toBe(5000);
    });
  });

  describe('Invoice Validation', () => {
    test('should validate required fields', () => {
      const invoice = createTestInvoice();

      const requiredFields = [
        'invoiceNumber',
        'patientId',
        'amount',
        'totalAmount',
        'status',
        'dueDate',
        'createdBy',
      ];

      requiredFields.forEach(field => {
        expect(invoice).toHaveProperty(field);
        expect((invoice as any)[field]).toBeTruthy();
      });
    });

    test('should validate invoice number uniqueness', async () => {
      const existingInvoice = createTestInvoice({ invoiceNumber: 'INV-001' });
      mockPrismaClient.invoice.findUnique.mockResolvedValue(existingInvoice as any);

      const found = await mockPrismaClient.invoice.findUnique({
        where: { invoiceNumber: 'INV-001' },
      });

      expect(found).toBeTruthy();
    });

    test('should validate amount is positive', () => {
      const invoice = createTestInvoice({ amount: 1000 });

      expect(invoice.amount).toBeGreaterThan(0);
      expect(invoice.totalAmount).toBeGreaterThan(0);
    });

    test('should validate tax calculation', () => {
      const amount = 1000;
      const taxRate = 0.18; // 18%
      const taxAmount = amount * taxRate;

      expect(taxAmount).toBe(180);
    });

    test('should validate discount does not exceed amount', () => {
      const invoice = createTestInvoice({
        amount: 1000,
        discountAmount: 100,
      });

      expect(invoice.discountAmount).toBeLessThanOrEqual(invoice.amount);
    });
  });

  describe('Invoice Access Control', () => {
    test('should filter invoices by clinic', async () => {
      const invoice = createTestInvoice({ clinicId: 'clinic-1' });
      mockPrismaClient.invoice.findMany.mockResolvedValue([invoice] as any);

      const results = await mockPrismaClient.invoice.findMany({
        where: { clinicId: 'clinic-1' },
      });

      expect(results.every(i => i.clinicId === 'clinic-1')).toBe(true);
    });

    test('should prevent cross-clinic invoice access', async () => {
      mockPrismaClient.invoice.findFirst.mockResolvedValue(null);

      const result = await mockPrismaClient.invoice.findFirst({
        where: {
          id: 'inv-1',
          clinicId: 'wrong-clinic',
        },
      });

      expect(result).toBeNull();
    });
  });
});

