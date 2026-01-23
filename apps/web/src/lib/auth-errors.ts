/**
 * Authentication error types and utilities for user-friendly error messages
 */

/**
 * Authentication error codes from backend
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Authentication error type
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  userMessage: string;
}

/**
 * Error response structure from GraphQL/Backend
 */
interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
    originalError?: {
      message?: string | string[];
      statusCode?: number;
    };
  };
}

/**
 * Extract error code from error name or message
 */
function getErrorCodeFromError(errorName: string, errorMessage: string): AuthErrorCode {
  const upperName = errorName.toUpperCase();
  const upperMessage = errorMessage.toUpperCase();

  if (upperName === 'NETWORKERROR' || upperMessage.includes('NETWORK') || upperMessage.includes('FETCH')) {
    return AuthErrorCode.NETWORK_ERROR;
  }

  if (upperMessage.includes('TIMEOUT') || upperMessage.includes('ECONNABORTED')) {
    return AuthErrorCode.TIMEOUT_ERROR;
  }

  if (upperMessage.includes('500') || upperMessage.includes('INTERNAL SERVER ERROR')) {
    return AuthErrorCode.SERVER_ERROR;
  }

  if (upperMessage.includes('401') || upperMessage.includes('UNAUTHORIZED')) {
    return AuthErrorCode.UNAUTHORIZED;
  }

  if (upperMessage.includes('INVALID CREDENTIALS') || upperMessage.includes('UNAUTHORIZED')) {
    return AuthErrorCode.INVALID_CREDENTIALS;
  }

  if (errorMessage.includes('validation') || upperName === 'VALIDATION_ERROR') {
    return AuthErrorCode.VALIDATION_ERROR;
  }

  return AuthErrorCode.UNKNOWN_ERROR;
}

/**
 * Get user-friendly error message based on error code
 */
function getUserMessageForCode(code: AuthErrorCode, originalMessage?: string): string {
  switch (code) {
    case AuthErrorCode.INVALID_CREDENTIALS:
      return 'Invalid email or password. Please try again.';

    case AuthErrorCode.VALIDATION_ERROR:
      return originalMessage || 'Please check your input and try again.';

    case AuthErrorCode.NETWORK_ERROR:
      return 'Network error. Please check your connection and try again.';

    case AuthErrorCode.TIMEOUT_ERROR:
      return 'Request timed out. Please try again.';

    case AuthErrorCode.SERVER_ERROR:
      return 'Server error. Please try again later.';

    case AuthErrorCode.UNAUTHORIZED:
      return 'You are not authorized to perform this action.';

    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Parse authentication error from Refine error object
 * Refine passes error as { name: string; message: string }
 */
export function parseAuthError(error: { name?: string; message?: string } | Error | null | undefined): AuthError | null {
  if (!error) {
    return null;
  }

  const errorName = error.name || 'UnknownError';
  const errorMessage = error.message || 'An unknown error occurred';

  const code = getErrorCodeFromError(errorName, errorMessage);
  const userMessage = getUserMessageForCode(code, errorMessage);

  return {
    code,
    message: errorMessage,
    userMessage,
  };
}

/**
 * Parse authentication error from GraphQL response errors
 */
export function parseGraphQLError(errors: GraphQLError[]): AuthError | null {
  if (!errors || errors.length === 0) {
    return null;
  }

  const firstError = errors[0];
  const errorMessage = firstError.message;

  // Check for validation errors in extensions
  if (firstError.extensions?.originalError?.message) {
    const originalMessage = firstError.extensions.originalError.message;
    const messageString = Array.isArray(originalMessage) ? originalMessage[0] : originalMessage;
    return {
      code: AuthErrorCode.VALIDATION_ERROR,
      message: messageString,
      userMessage: messageString,
    };
  }

  // Check for specific error codes
  if (firstError.extensions?.code) {
    const code = getErrorCodeFromError(firstError.extensions.code as string, errorMessage);
    return {
      code,
      message: errorMessage,
      userMessage: getUserMessageForCode(code, errorMessage),
    };
  }

  // Parse error message
  const code = getErrorCodeFromError('', errorMessage);
  const userMessage = getUserMessageForCode(code, errorMessage);

  return {
    code,
    message: errorMessage,
    userMessage,
  };
}

/**
 * Parse error from caught exception during login
 */
export function parseExceptionError(error: unknown): AuthError {
  if (error instanceof Error) {
    const code = getErrorCodeFromError(error.name, error.message);
    return {
      code,
      message: error.message,
      userMessage: getUserMessageForCode(code, error.message),
    };
  }

  return {
    code: AuthErrorCode.UNKNOWN_ERROR,
    message: String(error),
    userMessage: getUserMessageForCode(AuthErrorCode.UNKNOWN_ERROR),
  };
}
