import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * GraphQL Throttler Guard
 *
 * Extends the default ThrottlerGuard to work with GraphQL context.
 * It extracts the request and response objects from the GraphQL context
 * so that rate limiting can be applied to GraphQL mutations and queries.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  /**
   * Override getRequestResponse to extract the request from GraphQL context
   * instead of standard HTTP context.
   */
  protected getRequestResponse(context: ExecutionContext): {
    req: Record<string, any>;
    res: Record<string, any>;
  } {
    // If it's a GraphQL request, extract from GraphQL context
    if (context.getType<string>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext<{
        req?: Record<string, any>;
        res?: Record<string, any>;
      }>();

      // Ensure we return objects even if context is missing something
      // We provide a dummy header function to prevent "res.header is not a function"
      const res = ctx?.res || { header: () => {} };
      if (typeof res.header !== 'function') {
        res.header = () => {};
      }

      return {
        req: ctx?.req || {},
        res,
      };
    }

    // Fallback to standard HTTP context for REST endpoints
    const http = context.switchToHttp();
    return {
      req: http.getRequest<Record<string, any>>() || {},
      res: http.getResponse<Record<string, any>>() || {},
    };
  }
}
