import { z } from "zod";

/**
 * Validation schemas for all forms in the application
 * Uses Zod for runtime type validation and error messages
 */

// Patient validation schema
export const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
  mobileNumber: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number must be at most 15 digits")
    .regex(/^\+?[0-9\s-]+$/, "Invalid mobile number format"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  aadharNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyMobileNumber: z.string().optional(),
  relationship: z.string().optional(),
  medicalHistory: z.string().optional(),
  dentalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  allergies: z.string().optional(),
  bloodGroup: z.string().optional(),
  preferredPaymentMode: z.string().optional(),
  insuranceProvider: z.string().optional(),
});

// Invoice item validation schema
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z
    .number()
    .min(1, "Quantity must be at least 1")
    .int("Quantity must be a whole number"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
});

// Invoice validation schema
export const invoiceSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(invoiceItemSchema)
    .min(1, "At least one item is required")
    .refine(
      (items) => items.some((item) => item.description.trim().length > 0),
      { message: "At least one item must have a description" }
    ),
});

// Payment validation schema
export const paymentSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount cannot exceed 1,000,000"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE"], {
    errorMap: () => ({ message: "Please select a payment method" }),
  }),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

// Payment with invoice balance check
export const paymentWithBalanceSchema = (maxAmount: number) =>
  paymentSchema.extend({
    amount: z
      .number()
      .positive("Amount must be greater than 0")
      .max(maxAmount, `Amount cannot exceed balance of ₹${maxAmount.toFixed(2)}`),
  });

// Treatment validation schema
export const treatmentSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  treatmentDate: z.string().min(1, "Treatment date is required"),
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  clinicalFindings: z.string().optional(),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  treatmentPlan: z.string().min(1, "Treatment plan is required"),
  prescription: z.string().optional(),
  cost: z
    .number()
    .min(0, "Cost cannot be negative")
    .max(1000000, "Cost cannot exceed 1,000,000"),
  paidAmount: z
    .number()
    .min(0, "Paid amount cannot be negative")
    .optional()
    .default(0),
  notes: z.string().optional(),
});

// Treatment with cost validation
export const treatmentWithCostSchema = treatmentSchema.refine(
  (data) => data.paidAmount! <= data.cost,
  {
    message: "Paid amount cannot exceed total cost",
    path: ["paidAmount"],
  }
);

// Clinic settings validation schema
export const clinicSchema = z.object({
  name: z.string().min(1, "Clinic name is required").max(200),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z
    .string()
    .regex(/^[0-9]{6}$/, "PIN code must be 6 digits")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^\+?[0-9\s-]+$/, "Invalid phone number format"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  website: z
    .string()
    .url("Invalid website URL")
    .optional()
    .or(z.literal("")),
  registrationNumber: z.string().optional(),
});

// Document upload validation schema
export const documentUploadSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  name: z.string().min(1, "Document name is required").max(200),
  type: z.enum(
    [
      "X_RAY",
      "PRESCRIPTION",
      "LAB_REPORT",
      "TREATMENT_PLAN",
      "CONSENT_FORM",
      "INSURANCE",
      "OTHER",
    ],
    {
      errorMap: () => ({ message: "Please select a document type" }),
    }
  ),
  notes: z.string().optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) =>
        [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type),
      "File must be an image, PDF, or Word document"
    ),
});

// Appointment validation schema
export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  date: z.string().min(1, "Appointment date is required"),
  time: z.string().min(1, "Appointment time is required"),
  type: z.string().min(1, "Appointment type is required"),
  notes: z.string().optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
    .optional(),
});

// Helper function to get validation errors in a user-friendly format
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });
  return errors;
}

// Helper function to validate and return errors or null
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: getValidationErrors(result.error) };
}

