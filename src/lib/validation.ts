import { z } from "zod";

/**
 * Validation schemas for all forms in the application
 * Uses Zod for runtime type validation and error messages
 */

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

// ========================================
// UPDATE SCHEMAS (Partial for PUT requests)
// ========================================

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^\+?[0-9\s-]+$/, "Invalid phone number format")
    .optional(),
}).strict();

// Notification preferences schema (matches Prisma model)
export const notificationPreferencesSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  marketing: z.boolean().optional(),
  security: z.boolean().optional(),
}).strict();


// ========================================
// HELPER FUNCTIONS
// ========================================

// Helper function to get validation errors in a user-friendly format
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.issues.forEach((err) => {
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

