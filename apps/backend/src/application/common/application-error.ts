/**
 * Base error class for Application layer errors.
 * These errors represent business rule violations and invalid operations.
 */
export abstract class ApplicationError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' was not found`, 'NOT_FOUND', {
      resource,
      id,
    });
  }
}

/**
 * Error thrown when a business rule is violated.
 */
export class BusinessRuleViolationError extends ApplicationError {
  constructor(rule: string, details?: Record<string, unknown>) {
    super(`Business rule violation: ${rule}`, 'BUSINESS_RULE_VIOLATION', {
      rule,
      ...details,
    });
  }
}

/**
 * Error thrown when validation fails.
 */
export class ValidationError extends ApplicationError {
  constructor(field: string, reason: string) {
    super(
      `Validation failed for field '${field}': ${reason}`,
      'VALIDATION_ERROR',
      {
        field,
        reason,
      },
    );
  }
}

/**
 * Error thrown when a user is not authorized to perform an action.
 */
export class UnauthorizedError extends ApplicationError {
  constructor(action: string, resource?: string) {
    super(
      `Not authorized to ${action}${resource ? ` on ${resource}` : ''}`,
      'UNAUTHORIZED',
      { action, resource },
    );
  }
}

/**
 * Error thrown when an operation is forbidden.
 */
export class ForbiddenError extends ApplicationError {
  constructor(action: string, reason?: string) {
    super(
      `Operation '${action}' is forbidden${reason ? `: ${reason}` : ''}`,
      'FORBIDDEN',
      { action, reason },
    );
  }
}
