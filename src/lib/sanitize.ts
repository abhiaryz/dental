/**
 * HTML Sanitization Utility for Server-Side
 * Provides functions to sanitize user input to prevent XSS attacks
 */

// HTML entities that need to be escaped
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters in a string
 * This prevents XSS by converting special chars to HTML entities
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str).replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove potentially dangerous HTML tags and attributes
 * Allows only basic formatting tags
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs (can be used for XSS)
  sanitized = sanitized.replace(/data:/gi, '');
  
  // Remove vbscript: URLs
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*>/gi, '');
  
  // Remove object/embed tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '');
  
  // Remove form tags
  sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitize plain text input (no HTML allowed)
 * Use for fields like names, addresses, etc.
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return escapeHtml(text.trim());
}

/**
 * Sanitize an object's string properties
 * Useful for sanitizing request bodies
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldsToSanitize: (keyof T)[]
): T {
  const sanitized = { ...obj };
  
  for (const field of fieldsToSanitize) {
    const value = sanitized[field];
    if (typeof value === 'string') {
      (sanitized[field] as string) = sanitizeText(value);
    }
  }
  
  return sanitized;
}

/**
 * Fields that should be sanitized in various models
 */
export const SANITIZE_FIELDS = {
  invoice: ['notes'],
  inventory: ['name', 'notes'],
  supplier: ['name', 'contactName', 'address', 'notes'],
} as const;

/**
 * Sanitize invoice data
 */
export function sanitizeInvoiceData<T extends Record<string, unknown>>(data: T): T {
  return sanitizeObject(data, SANITIZE_FIELDS.invoice as unknown as (keyof T)[]);
}

