import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { MissingTokenException, ForbiddenAccessException } from '../exceptions';
import { PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * User object from request
 */
interface RequestUser {
  roles?: string[];
  role?: string;
}

/**
 * GraphQL request context
 */
interface GqlContext {
  req?: {
    user?: RequestUser;
  };
}

/**
 * Admin Guard
 *
 * Protects GraphQL resolvers and REST routes to ensure only users with admin role can access them.
 * Use as a decorator on resolvers or controller methods.
 *
 * Returns proper HTTP status codes:
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User authenticated but not an admin
 *
 * @example
 * @UseGuards(GqlAuthGuard, AdminGuard)
 * @Mutation(() => SomeType)
 * async adminOnlyMutation() { ... }
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GqlContext>();
    const user = gqlContext.req?.user;

    if (!user) {
      throw new MissingTokenException('User not authenticated');
    }

    // Check if user has admin role (user.roles from JWT or user.role from User entity)
    const userRoles = user.roles ?? (user.role ? [user.role] : []);
    if (!userRoles.includes(UserRole.ADMIN)) {
      throw new ForbiddenAccessException('Admin access required');
    }

    return true;
  }
}
