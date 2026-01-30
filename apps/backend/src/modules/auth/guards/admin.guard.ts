import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import {
  UserRole,
  ROLE_LEVELS,
  LEGACY_ROLE_MAP,
} from '../enums/user-role.enum';
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
 * Supports role hierarchy: ADMIN and SUPER_ADMIN can access admin-only routes.
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

    // Normalize and check user role (supports legacy 'user' and 'admin' values)
    const userRole = this.normalizeUserRole(user);
    if (!userRole) {
      throw new ForbiddenAccessException('Admin access required');
    }

    // Check if user has admin level or higher (ADMIN or SUPER_ADMIN)
    const userLevel = ROLE_LEVELS[userRole];
    const adminLevel = ROLE_LEVELS[UserRole.ADMIN];

    if (userLevel < adminLevel) {
      throw new ForbiddenAccessException('Admin access required');
    }

    return true;
  }

  /**
   * Normalize user role from request to UserRole enum
   * Handles legacy role names via LEGACY_ROLE_MAP
   */
  private normalizeUserRole(user: RequestUser): UserRole | null {
    // From JWT (roles array) - take highest role
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      let highestRole: UserRole | null = null;
      let highestLevel = -1;

      for (const roleStr of user.roles) {
        const role = this.parseRole(roleStr);
        if (role && ROLE_LEVELS[role] > highestLevel) {
          highestRole = role;
          highestLevel = ROLE_LEVELS[role];
        }
      }
      return highestRole;
    }

    // From User entity (single role string)
    if (user.role) {
      return this.parseRole(user.role);
    }

    return null;
  }

  /**
   * Parse role string to UserRole enum
   * Handles legacy role names via LEGACY_ROLE_MAP
   */
  private parseRole(role: string): UserRole | null {
    // Direct match
    if (Object.values(UserRole).includes(role as UserRole)) {
      return role as UserRole;
    }
    // Legacy role mapping
    if (role in LEGACY_ROLE_MAP) {
      return LEGACY_ROLE_MAP[role];
    }
    return null;
  }
}
