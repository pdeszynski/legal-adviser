import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

/**
 * Base Authentication Exception
 *
 * All auth exceptions extend this to allow consistent handling
 */
export class BaseAuthException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, BaseAuthException.prototype);
  }
}

/**
 * Token Expired Exception
 *
 * Thrown when JWT token has expired
 * HTTP Status: 401 Unauthorized
 */
export class TokenExpiredException extends BaseAuthException {
  constructor(message: string = 'Token has expired') {
    super(message, 'TOKEN_EXPIRED', 401);
    Object.setPrototypeOf(this, TokenExpiredException.prototype);
  }
}

/**
 * Invalid Token Exception
 *
 * Thrown when JWT token is malformed or invalid
 * HTTP Status: 401 Unauthorized
 */
export class InvalidTokenException extends BaseAuthException {
  constructor(message: string = 'Invalid token') {
    super(message, 'INVALID_TOKEN', 401);
    Object.setPrototypeOf(this, InvalidTokenException.prototype);
  }
}

/**
 * Missing Token Exception
 *
 * Thrown when no authorization token is provided
 * HTTP Status: 401 Unauthorized
 */
export class MissingTokenException extends BaseAuthException {
  constructor(message: string = 'Authorization token is required') {
    super(message, 'MISSING_TOKEN', 401);
    Object.setPrototypeOf(this, MissingTokenException.prototype);
  }
}

/**
 * Forbidden Access Exception
 *
 * Thrown when user is authenticated but lacks required permissions
 * HTTP Status: 403 Forbidden
 */
export class ForbiddenAccessException extends BaseAuthException {
  constructor(message: string = 'Access forbidden') {
    super(message, 'FORBIDDEN', 403);
    Object.setPrototypeOf(this, ForbiddenAccessException.prototype);
  }
}

/**
 * User Inactive Exception
 *
 * Thrown when user account is inactive
 * HTTP Status: 403 Forbidden
 */
export class UserInactiveException extends BaseAuthException {
  constructor(message: string = 'User account is inactive') {
    super(message, 'USER_INACTIVE', 403);
    Object.setPrototypeOf(this, UserInactiveException.prototype);
  }
}

/**
 * Convert NestJS HTTP exceptions to our custom exceptions
 * Used in guards and strategies for consistent error handling
 */
export function toAuthException(
  error: any,
): BaseAuthException | UnauthorizedException | ForbiddenException {
  // If it's already one of our custom exceptions, return as-is
  if (error instanceof BaseAuthException) {
    return error;
  }

  // Convert JWT expiry error
  if (error?.name === 'TokenExpiredError') {
    return new TokenExpiredException();
  }

  // Convert JWT validation error
  if (error?.name === 'JsonWebTokenError') {
    return new InvalidTokenException(error.message);
  }

  // Convert not before error
  if (error?.name === 'NotBeforeError') {
    return new InvalidTokenException('Token not yet valid');
  }

  // Return generic unauthorized exception
  return new UnauthorizedException(error?.message || 'Authentication failed');
}
