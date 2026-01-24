import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { MissingTokenException } from '../exceptions';

/**
 * GraphQL Hybrid Authentication Guard
 *
 * Supports both JWT and API key authentication methods.
 * Tries JWT first, then falls back to API key authentication.
 *
 * Priority:
 * 1. JWT Bearer token (Authorization: Bearer <jwt>)
 * 2. API Key (Authorization: Bearer pk_... or X-API-Key: pk_...)
 *
 * Usage:
 * @UseGuards(GqlHybridAuthGuard)
 *
 * The authenticated user is available in context.req.user
 * with authMethod indicating which method was used.
 */
@Injectable()
export class GqlHybridAuthGuard extends AuthGuard(['jwt', 'api-key']) {
  /**
   * Override getRequest to extract the request from GraphQL context
   */
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  /**
   * Override handleRequest to allow fallback between strategies
   * When JWT fails, try API key authentication
   */
  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      // Check if request has an API key header
      const req = this.getRequest(context);
      const hasApiKey = this.hasApiKeyHeader(req);

      // Check for missing auth
      const hasJwt = this.hasJwtHeader(req);

      if (!hasApiKey && !hasJwt) {
        throw new MissingTokenException(
          'Authentication required. Provide a valid JWT token or API key.',
        );
      }

      if (hasApiKey) {
        // API key was provided but authentication failed
        throw new UnauthorizedException('Invalid or expired API key');
      }

      // JWT was provided but failed
      if (info?.name === 'TokenExpiredError') {
        const exception = new Error('Token has expired');
        (exception as any).name = 'TokenExpiredError';
        throw exception;
      }

      // No valid authentication found
      throw new UnauthorizedException(
        'Authentication failed. Provide a valid JWT token or API key.',
      );
    }

    return user;
  }

  /**
   * Check if the request contains an API key header
   */
  private hasApiKeyHeader(req: any): boolean {
    const authHeader = req.headers?.authorization;
    const xApiKey = req.headers?.['x-api-key'];

    // Check X-API-Key header
    if (xApiKey) {
      return true;
    }

    // Check Authorization header for API key format (Bearer pk_...)
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        return token.startsWith('pk_');
      }
    }

    return false;
  }

  /**
   * Check if the request contains a JWT token in Authorization header
   */
  private hasJwtHeader(req: any): boolean {
    const authHeader = req.headers?.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        // JWT tokens don't start with pk_ (which is API key format)
        return token.length > 0 && !token.startsWith('pk_');
      }
    }
    return false;
  }

  /**
   * Override canActivate to try both strategies sequentially
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = this.getRequest(context);
    const hasApiKey = this.hasApiKeyHeader(req);

    // If API key header is present, use API key strategy
    if (hasApiKey) {
      return super.canActivate(context);
    }

    // Otherwise, use JWT strategy (default)
    return super.canActivate(context);
  }
}
