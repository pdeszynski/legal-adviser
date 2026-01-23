import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { CsrfService } from './csrf.service';
import { SKIP_CSRF_KEY } from './csrf.decorator';

/**
 * CSRF Guard for GraphQL Mutations
 *
 * Implements double-submit cookie pattern validation for GraphQL mutations.
 * Validates that the X-CSRF-Token header matches the csrf-token cookie.
 *
 * Usage:
 * 1. Apply globally or per-resolver with @UseGuards(CsrfGuard)
 * 2. Skip validation for specific mutations with @SkipCsrf() decorator
 *
 * Note: Queries are read-only and don't require CSRF protection.
 * This guard only validates mutations.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly csrfService: CsrfService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if CSRF is explicitly skipped via decorator
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    // Determine context type (HTTP REST vs GraphQL)
    const contextType = context.getType<string>();

    // For non-GraphQL requests (HTTP REST controllers), skip CSRF
    // REST endpoints like /api/csrf-token should not require CSRF validation
    if (contextType !== 'graphql') {
      return true;
    }

    // Get GraphQL context
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();

    // Safety check: if we can't get info, skip validation
    if (!info || !info.parentType) {
      return true;
    }

    // Only validate mutations (state-changing operations)
    // Queries are read-only and don't need CSRF protection
    if (info.parentType.name !== 'Mutation') {
      return true;
    }

    const ctx = gqlContext.getContext();
    const request = ctx.req;

    if (!request) {
      throw new ForbiddenException('Request context not available');
    }

    // Get CSRF token from cookie
    const cookieName = this.csrfService.getCookieName();
    const cookieToken = this.getCookieValue(request, cookieName);

    // Get CSRF token from header
    // Headers in Express are case-insensitive but stored as lowercase
    // Try both lowercase and the original header name for compatibility
    const headerName = this.csrfService.getHeaderName();
    let headerToken = request.headers[headerName] as string | undefined;

    // If not found with original case, try lowercase
    if (!headerToken) {
      headerToken = request.headers[headerName.toLowerCase()] as
        | string
        | undefined;
    }

    // Also try with X- prefix capitalized (some clients send it this way)
    if (!headerToken && headerName.startsWith('x-')) {
      const capitalizedHeader = 'X-' + headerName.substring(2);
      headerToken = request.headers[capitalizedHeader] as string | undefined;
    }

    // Validate the tokens
    if (!this.csrfService.validateToken(cookieToken || '', headerToken || '')) {
      throw new ForbiddenException(
        'CSRF token validation failed. Please refresh your page and try again.',
      );
    }

    return true;
  }

  /**
   * Extract cookie value from request
   * Handles both parsed cookies and raw cookie header
   */
  private getCookieValue(
    request: {
      cookies?: Record<string, string>;
      headers?: Record<string, string>;
    },
    name: string,
  ): string | undefined {
    // Try parsed cookies first (if cookie-parser middleware is used)
    if (request.cookies && request.cookies[name]) {
      return request.cookies[name];
    }

    // Fall back to parsing the Cookie header manually
    const cookieHeader = request.headers?.cookie;
    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    return cookies[name];
  }
}
