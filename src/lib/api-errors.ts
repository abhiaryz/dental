/**
 * Centralized API Error Handling
 * Provides standardized error types and handlers for consistent error responses
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
} as const;

/**
 * Map Prisma errors to user-friendly AppError instances
 */
export function handlePrismaError(error: any): AppError {
  // Unique constraint violation
  if (error.code === 'P2002') {
    const fields = error.meta?.target || [];
    return new AppError(
      `A record with this ${fields.join(', ')} already exists`,
      ErrorCodes.DUPLICATE_ENTRY,
      409,
      { fields }
    );
  }

  // Record not found
  if (error.code === 'P2025') {
    return new AppError(
      'Record not found',
      ErrorCodes.NOT_FOUND,
      404
    );
  }

  // Foreign key constraint failed
  if (error.code === 'P2003') {
    return new AppError(
      'Referenced record does not exist',
      ErrorCodes.VALIDATION_ERROR,
      400,
      { field: error.meta?.field_name }
    );
  }

  // Required field missing
  if (error.code === 'P2011') {
    return new AppError(
      'Required field is missing',
      ErrorCodes.VALIDATION_ERROR,
      400,
      { field: error.meta?.constraint }
    );
  }

  // Invalid value
  if (error.code === 'P2006') {
    return new AppError(
      'Invalid value provided',
      ErrorCodes.VALIDATION_ERROR,
      400,
      { field: error.meta?.column_name }
    );
  }

  // Connection/timeout errors
  if (error.code?.startsWith('P1')) {
    return new AppError(
      'Database connection error. Please try again.',
      ErrorCodes.DATABASE_ERROR,
      503
    );
  }

  // Generic Prisma error
  return new AppError(
    'Database operation failed',
    ErrorCodes.DATABASE_ERROR,
    500,
    { prismaCode: error.code }
  );
}

/**
 * Format error for JSON response
 */
export function formatErrorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
    };
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    return {
      error: 'An unexpected error occurred',
      code: ErrorCodes.INTERNAL_ERROR,
    };
  }

  return {
    error: error.message || 'An unexpected error occurred',
    code: ErrorCodes.INTERNAL_ERROR,
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: unknown, defaultMessage: string = 'An error occurred') {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return {
      body: formatErrorResponse(error),
      status: error.statusCode,
    };
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string' && (error as any).code?.startsWith('P')) {
    const appError = handlePrismaError(error);
    return {
      body: formatErrorResponse(appError),
      status: appError.statusCode,
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      body: formatErrorResponse(error),
      status: 500,
    };
  }

  // Unknown error
  return {
    body: {
      error: defaultMessage,
      code: ErrorCodes.INTERNAL_ERROR,
    },
    status: 500,
  };
}

