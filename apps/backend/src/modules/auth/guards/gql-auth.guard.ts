import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { MissingTokenException } from '../exceptions';

/**
 * JWT Strategy error info interface
 */
interface StrategyInfo {
  name?: string;
  message?: string;
}

/**
 * GraphQL Authentication Guard
 *
 * Extends the default JWT AuthGuard to work with GraphQL context
 * instead of standard HTTP request context.
 *
 * Throws appropriate exceptions for different authentication failure scenarios:
 * - Missing authorization header -> MissingTokenException (401)
 * - Invalid/expired token -> TokenExpiredException/InvalidTokenException (401)
 */
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  /**
   * Override getRequest to extract the request from GraphQL context
   */
  getRequest(context: ExecutionContext): unknown {
    const ctx = GqlExecutionContext.create(context);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return ctx.getContext().req;
  }

  /**
   * Override handleRequest to provide custom exception handling
   *
   * When authentication fails, this method is called with the error.
   * We convert errors to our custom exceptions for consistent error handling.
   */
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: StrategyInfo | undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ExecutionContext,
  ): TUser {
    // If authentication succeeded, return the user
    if (user) {
      return user;
    }

    // Handle specific JWT errors
    if (info?.name === 'NoAuthTokenError' || !info) {
      throw new MissingTokenException();
    }

    // Token expired - throw error that exception filter will recognize
    if (info?.name === 'TokenExpiredError') {
      const exception = new Error('Token has expired') as Error & {
        name: string;
      };
      exception.name = 'TokenExpiredError';
      throw exception;
    }

    // Invalid token - throw error that exception filter will recognize
    if (info?.name === 'JsonWebTokenError') {
      const exception = new Error('Invalid token') as Error & {
        name: string;
      };
      exception.name = 'JsonWebTokenError';
      throw exception;
    }

    // General authentication failure
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException('Authentication failed');
    }

    return user;
  }
}
