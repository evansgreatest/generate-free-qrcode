/**
 * Get a safe error message for client responses
 * In production, returns generic messages to prevent information leakage
 */
export function getSafeErrorMessage(error: unknown, context?: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Generic error messages in production
    if (context === 'authentication') {
      return 'Authentication failed';
    }
    if (context === 'authorization') {
      return 'Access denied';
    }
    if (context === 'validation') {
      return 'Invalid input provided';
    }
    if (context === 'payment') {
      return 'Payment processing failed';
    }
    if (context === 'database') {
      return 'Database operation failed';
    }
    return 'An error occurred. Please try again later.';
  }
  
  // Detailed error messages in development
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

/**
 * Log error with context (server-side only)
 */
export function logError(error: unknown, context: string, metadata?: Record<string, unknown>): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[${context}]`, {
    message: errorMessage,
    stack: errorStack,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

