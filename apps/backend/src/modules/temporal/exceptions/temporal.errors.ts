/**
 * Temporal Error Classes
 *
 * Custom error classes for Temporal-specific errors.
 * All errors extend ApplicationError for consistent error handling.
 */

import { ApplicationError } from '../../../application/common/application-error';

/**
 * Base Temporal Error
 *
 * All Temporal-specific errors extend this class.
 */
export abstract class TemporalError extends ApplicationError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(message, code, details);
    this.name = this.constructor.name;
  }
}

/**
 * Schedule Not Found Error
 *
 * Thrown when attempting to operate on a non-existent schedule.
 */
export class ScheduleNotFoundError extends TemporalError {
  constructor(scheduleId: string) {
    super(`Schedule '${scheduleId}' not found`, 'SCHEDULE_NOT_FOUND', {
      scheduleId,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Schedule Already Exists Error
 *
 * Thrown when attempting to create a schedule with an ID that already exists.
 */
export class ScheduleAlreadyExistsError extends TemporalError {
  constructor(scheduleId: string) {
    super(
      `Schedule '${scheduleId}' already exists`,
      'SCHEDULE_ALREADY_EXISTS',
      {
        scheduleId,
        timestamp: new Date().toISOString(),
      },
    );
  }
}

/**
 * Invalid Cron Expression Error
 *
 * Thrown when a cron expression is malformed or invalid.
 */
export class InvalidCronExpressionError extends TemporalError {
  constructor(expression: string, reason: string) {
    super(`Invalid cron expression: ${reason}`, 'INVALID_CRON_EXPRESSION', {
      expression,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Workflow Not Found Error
 *
 * Thrown when a workflow referenced by a schedule cannot be found.
 */
export class WorkflowNotFoundError extends TemporalError {
  constructor(workflowType: string, taskQueue: string) {
    super(
      `Workflow '${workflowType}' not found in task queue '${taskQueue}'`,
      'WORKFLOW_NOT_FOUND',
      {
        workflowType,
        taskQueue,
        timestamp: new Date().toISOString(),
      },
    );
  }
}

/**
 * Temporal Connection Error
 *
 * Thrown when unable to connect to the Temporal server.
 */
export class TemporalConnectionError extends TemporalError {
  constructor(endpoint: string, reason?: string) {
    super(
      `Failed to connect to Temporal server at ${endpoint}${reason ? `: ${reason}` : ''}`,
      'TEMPORAL_CONNECTION_ERROR',
      {
        endpoint,
        reason,
        timestamp: new Date().toISOString(),
      },
    );
  }
}

/**
 * Schedule Operation Error
 *
 * Generic error for schedule operations that fail for specific reasons.
 */
export class ScheduleOperationError extends TemporalError {
  constructor(operation: string, scheduleId: string, reason: string) {
    super(
      `Failed to ${operation} schedule '${scheduleId}': ${reason}`,
      'SCHEDULE_OPERATION_FAILED',
      {
        operation,
        scheduleId,
        reason,
        timestamp: new Date().toISOString(),
      },
    );
  }
}

/**
 * Schedule Already Paused Error
 *
 * Thrown when attempting to pause a schedule that is already paused.
 */
export class ScheduleAlreadyPausedError extends TemporalError {
  constructor(scheduleId: string) {
    super(
      `Schedule '${scheduleId}' is already paused`,
      'SCHEDULE_ALREADY_PAUSED',
      {
        scheduleId,
        timestamp: new Date().toISOString(),
      },
    );
  }
}

/**
 * Schedule Not Paused Error
 *
 * Thrown when attempting to resume a schedule that is not paused.
 */
export class ScheduleNotPausedError extends TemporalError {
  constructor(scheduleId: string) {
    super(`Schedule '${scheduleId}' is not paused`, 'SCHEDULE_NOT_PAUSED', {
      scheduleId,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Invalid Schedule Spec Error
 *
 * Thrown when the schedule specification is invalid.
 */
export class InvalidScheduleSpecError extends TemporalError {
  constructor(reason: string, details?: Record<string, unknown>) {
    super(
      `Invalid schedule specification: ${reason}`,
      'INVALID_SCHEDULE_SPEC',
      {
        reason,
        ...details,
        timestamp: new Date().toISOString(),
      },
    );
  }
}

/**
 * Temporal Service Unavailable Error
 *
 * Thrown when the Temporal service is temporarily unavailable.
 */
export class TemporalServiceUnavailableError extends TemporalError {
  constructor(reason?: string) {
    super(
      `Temporal service temporarily unavailable${reason ? `: ${reason}` : ''}`,
      'TEMPORAL_SERVICE_UNAVAILABLE',
      {
        reason,
        timestamp: new Date().toISOString(),
      },
    );
  }
}

/**
 * User-friendly error messages for API responses
 */
export const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  SCHEDULE_NOT_FOUND:
    'The requested schedule does not exist. It may have been deleted.',
  SCHEDULE_ALREADY_EXISTS:
    'A schedule with this identifier already exists. Please use a different ID.',
  INVALID_CRON_EXPRESSION:
    'The schedule timing is invalid. Please check the cron expression format.',
  WORKFLOW_NOT_FOUND:
    'The workflow type specified for this schedule is not registered.',
  TEMPORAL_CONNECTION_ERROR:
    'Unable to connect to the scheduling service. Please try again later.',
  SCHEDULE_OPERATION_FAILED:
    'The requested operation could not be completed. Please try again.',
  SCHEDULE_ALREADY_PAUSED: 'This schedule is already paused.',
  SCHEDULE_NOT_PAUSED:
    'This schedule is currently running and cannot be resumed.',
  INVALID_SCHEDULE_SPEC:
    'The schedule configuration is invalid. Please review your settings.',
  TEMPORAL_SERVICE_UNAVAILABLE:
    'The scheduling service is temporarily unavailable. Please try again later.',
};

/**
 * Get user-friendly error message for an error code
 */
export function getUserFriendlyMessage(
  errorCode: string,
  defaultMessage?: string,
): string {
  return (
    USER_FRIENDLY_MESSAGES[errorCode] ||
    defaultMessage ||
    'An error occurred while processing your request.'
  );
}

/**
 * Map Temporal SDK error messages to our custom error types
 */
export function mapTemporalError(
  error: unknown,
  scheduleId: string,
  operation: string,
): TemporalError {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check for specific error patterns
  if (
    errorMessage.includes('not found') ||
    errorMessage.includes('does not exist')
  ) {
    return new ScheduleNotFoundError(scheduleId);
  }

  if (errorMessage.includes('already exists')) {
    return new ScheduleAlreadyExistsError(scheduleId);
  }

  if (errorMessage.includes('cron') || errorMessage.includes('calendar spec')) {
    return new InvalidCronExpressionError('', errorMessage);
  }

  if (errorMessage.includes('workflow') && errorMessage.includes('not found')) {
    return new WorkflowNotFoundError('', '');
  }

  if (errorMessage.includes('connection') || errorMessage.includes('connect')) {
    return new TemporalConnectionError('');
  }

  // Default to generic operation error
  return new ScheduleOperationError(operation, scheduleId, errorMessage);
}
