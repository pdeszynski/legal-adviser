import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';

/**
 * Admin Guard
 *
 * Protects GraphQL resolvers and REST routes to ensure only users with admin role can access them.
 * Use as a decorator on resolvers or controller methods.
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
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req?.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has admin role (user.roles from JWT or user.role from User entity)
    const userRoles = user.roles || (user.role ? [user.role] : []);
    if (!userRoles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
