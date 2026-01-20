import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * GraphQL Authentication Guard
 *
 * Extends the default JWT AuthGuard to work with GraphQL context
 * instead of standard HTTP request context.
 */
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  /**
   * Override getRequest to extract the request from GraphQL context
   */
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
