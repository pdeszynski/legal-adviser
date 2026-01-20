import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogApplicationService } from '../../application/audit-logs';
import {
  AuditActionType,
  AuditResourceType,
} from '../../modules/audit-log/entities/audit-log.entity';

/**
 * Audit Logging Interceptor
 *
 * Captures GraphQL mutations and creates audit log entries.
 * This interceptor operates at the presentation layer and delegates
 * to the application layer service for business logic.
 *
 * Architecture:
 * - Presentation Layer (this interceptor) → captures GraphQL context
 * - Application Layer (AuditLogApplicationService) → orchestrates use cases
 * - Domain Layer → publishes events
 * - Infrastructure Layer → persists to database
 *
 * Features:
 * - Captures mutation name, user, IP address, user agent
 * - Records success/failure status codes
 * - Extracts resource ID from mutation result if available
 * - Maps GraphQL mutation names to audit action types
 * - Non-blocking: audit failures don't affect mutation execution
 */
@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly auditLogApplicationService: AuditLogApplicationService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Only process GraphQL requests
    const contextType = context.getType<string>();
    if (contextType !== 'graphql') {
      return next.handle();
    }

    // Get GraphQL execution context
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo<{
      parentType: { name: string };
      fieldName: string;
      operation: { operation: string };
    }>();

    // Only audit mutations (skip queries)
    if (info?.parentType?.name !== 'Mutation') {
      return next.handle();
    }

    // Extract request context
    const ctx = gqlContext.getContext<{
      req?: Record<string, any>;
      request?: Record<string, any>;
    }>();
    const request = ctx?.req || ctx?.request; // Handle both common naming conventions
    const mutationName = info.fieldName;
    const args = gqlContext.getArgs<Record<string, any>>();

    // If request is missing (e.g. in some subscription or unit test scenarios),
    // skip auditing to prevent "Cannot read properties of undefined (reading 'ip')"
    if (!request) {
      return next.handle();
    }

    // Extract user ID from JWT token if authenticated
    const userId = (request.user?.userId || request.user?.id || null) as
      | string
      | null;

    // Extract IP address and user agent
    const ipAddress = this.extractIpAddress(request);
    const userAgent = (request.headers?.['user-agent'] || null) as
      | string
      | null;

    // Map mutation to action type and resource type
    const { action, resourceType } = this.mapMutationToAuditType(mutationName);

    // Execute the mutation
    return next.handle().pipe(
      tap(async (result: any) => {
        // Mutation succeeded - log with 200 status
        try {
          // Try to extract resource ID from result
          const resourceId = this.extractResourceId(result, args);

          await this.auditLogApplicationService.createAuditLog({
            action,
            resourceType,
            resourceId,
            userId,
            ipAddress,
            userAgent,
            statusCode: 200,
            errorMessage: null,
            changeDetails: {
              context: {
                mutation: mutationName,
                args: this.sanitizeArgs(args),
              },
            },
          });
        } catch (error) {
          // Log audit creation failure but don't throw
          console.error('Failed to create audit log for mutation:', error);
        }
      }),
      catchError((error: any) => {
        // Mutation failed - log with error status
        this.auditLogApplicationService
          .createAuditLog({
            action,
            resourceType,
            resourceId: this.extractResourceId(null, args),
            userId,
            ipAddress,
            userAgent,
            statusCode: (error as any).status || 500,
            errorMessage: (error as any).message || 'Unknown error',
            changeDetails: {
              context: {
                mutation: mutationName,
                args: this.sanitizeArgs(args),
                error: (error as any).message,
              },
            },
          })
          .catch((auditError: Error) => {
            console.error(
              'Failed to create audit log for error:',
              auditError.message,
            );
          });

        // Re-throw the original error
        return throwError(() => error);
      }),
    );
  }

  /**
   * Extract IP address from request
   * Handles proxy headers (X-Forwarded-For, X-Real-IP)
   */
  private extractIpAddress(request: any): string | null {
    if (!request) return null;

    const forwarded = request.headers?.['x-forwarded-for'];
    if (forwarded) {
      const ips = forwarded.split(',');
      return ips[0].trim();
    }

    const realIp = request.headers?.['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    return request.ip || request.socket?.remoteAddress || null;
  }

  /**
   * Extract resource ID from mutation result or args
   */
  private extractResourceId(result: any, args: any): string | null {
    // Try to get ID from result
    if (result?.id) return result.id;
    if (result?.data?.id) return result.data.id;

    // Try to get ID from args (for update/delete operations)
    if (args?.id) return args.id;
    if (args?.input?.id) return args.input.id;

    return null;
  }

  /**
   * Map GraphQL mutation name to audit action and resource type
   */
  private mapMutationToAuditType(mutationName: string): {
    action: AuditActionType;
    resourceType: AuditResourceType;
  } {
    // Default mapping
    let action: AuditActionType = AuditActionType.UPDATE;
    let resourceType: AuditResourceType = AuditResourceType.SYSTEM;

    // Map mutation names to actions
    if (mutationName.toLowerCase().includes('create')) {
      action = AuditActionType.CREATE;
    } else if (mutationName.toLowerCase().includes('update')) {
      action = AuditActionType.UPDATE;
    } else if (mutationName.toLowerCase().includes('delete')) {
      action = AuditActionType.DELETE;
    } else if (
      mutationName.toLowerCase().includes('export') ||
      mutationName.toLowerCase().includes('download')
    ) {
      action = AuditActionType.EXPORT;
    } else if (mutationName.toLowerCase().includes('login')) {
      action = AuditActionType.LOGIN;
    } else if (mutationName.toLowerCase().includes('logout')) {
      action = AuditActionType.LOGOUT;
    }

    // Map mutation names to resource types
    if (
      mutationName.toLowerCase().includes('user') ||
      mutationName.toLowerCase().includes('register')
    ) {
      resourceType = AuditResourceType.USER;
    } else if (
      mutationName.toLowerCase().includes('document') ||
      mutationName.toLowerCase().includes('generate')
    ) {
      resourceType = AuditResourceType.DOCUMENT;
    } else if (mutationName.toLowerCase().includes('session')) {
      resourceType = AuditResourceType.SESSION;
    }

    return { action, resourceType };
  }

  /**
   * Sanitize args to remove sensitive data before logging
   */
  private sanitizeArgs(args: any): any {
    if (!args) return null;

    const sanitized = { ...args };

    // Remove password fields
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret'];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
      if (sanitized.input?.[field]) {
        sanitized.input[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
