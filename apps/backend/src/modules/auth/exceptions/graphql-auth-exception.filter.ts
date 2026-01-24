import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

import {
  BaseAuthException,
  TokenExpiredException,
  InvalidTokenException,
  MissingTokenException,
  ForbiddenAccessException,
  UserInactiveException,
} from './auth.exceptions';

/**
 * GraphQL Authentication Exception Filter
 *
 * Catches authentication and authorization exceptions and:
 * 1. Sets appropriate HTTP status code on response
 * 2. Returns properly formatted GraphQL errors with code extensions
 *
 * This ensures clients receive:
 * - Correct HTTP status (401 for auth errors, 403 for forbidden)
 * - Clear error codes for client-side handling
 * - Indicators for token expiry
 */
@Injectable()
@Catch()
export class GqlAuthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // GraphQL context is accessed via GqlExecutionContext
    // The host needs to be cast to ExecutionContext for GqlExecutionContext.create
    const ctx = GqlExecutionContext.create(host as any);
    const { res } = ctx.getContext();

    // Default values
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let extensions: Record<string, any> = {};

    // Handle BaseAuthException (our custom exceptions)
    if (exception instanceof BaseAuthException) {
      status = exception.httpStatus;
      message = exception.message;
      code = exception.code;
      extensions = {
        code,
        httpStatus: exception.httpStatus,
      };

      // Add specific extension for token expiry
      if (exception instanceof TokenExpiredException) {
        extensions.expired = true;
      }
    }
    // Handle standard NestJS HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        // Handle array of messages from validation
        if (Array.isArray(message)) {
          message = message.join(', ');
        }
      } else {
        message = exception.message;
      }

      code = this.getErrorCodeFromStatus(status);
      extensions = {
        code,
        httpStatus: status,
      };

      // Detect token expiry from standard unauthorized exception
      if (
        status === HttpStatus.UNAUTHORIZED &&
        message.toLowerCase().includes('expired')
      ) {
        extensions.expired = true;
        code = 'TOKEN_EXPIRED';
      }
    }
    // Handle standard Error
    else if (exception instanceof Error) {
      message = exception.message;

      // Detect JWT errors from jsonwebtoken library
      if (exception.name === 'TokenExpiredError') {
        status = HttpStatus.UNAUTHORIZED;
        code = 'TOKEN_EXPIRED';
        message = 'Token has expired';
        extensions = { code, httpStatus: status, expired: true };
      } else if (exception.name === 'JsonWebTokenError') {
        status = HttpStatus.UNAUTHORIZED;
        code = 'INVALID_TOKEN';
        message = 'Invalid token';
        extensions = { code, httpStatus: status };
      } else if (exception.name === 'NotBeforeError') {
        status = HttpStatus.UNAUTHORIZED;
        code = 'INVALID_TOKEN';
        message = 'Token not yet valid';
        extensions = { code, httpStatus: status };
      }
    }

    // Set HTTP status code on response
    res.status(status);

    // Return GraphQL error
    return new GraphQLError(message, {
      extensions: {
        ...extensions,
        exception: {
          message,
          status,
        },
      },
    });
  }

  /**
   * Map HTTP status codes to error codes
   */
  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}

/**
 * Re-export for convenience
 */
export * from './auth.exceptions';
