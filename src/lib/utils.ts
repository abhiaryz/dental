import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextRequest } from "next/server"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse JSON from a request body
 * Returns parsed data or null if parsing fails
 */
export async function safeJsonParse<T = unknown>(
  request: NextRequest | Request
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const text = await request.text();
    if (!text || text.trim() === '') {
      return { data: null, error: "Request body is empty" };
    }
    const data = JSON.parse(text) as T;
    return { data, error: null };
  } catch (e) {
    return { 
      data: null, 
      error: e instanceof SyntaxError 
        ? "Invalid JSON in request body" 
        : "Failed to parse request body" 
    };
  }
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
