import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
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
 * Metadata key for storing required roles
 */
export const ROLES_KEY = 'roles';

/**
 * Role matching mode for access control
 */
export enum RoleMatchMode {
  /**
   * User must have at least one of the required roles (OR)
   */
  ANY = 'any',

  /**
   * User must have all of the required roles (AND)
   */
  ALL = 'all',
}

/**
 * Metadata key for storing role match mode
 */
export const ROLE_MATCH_MODE_KEY = 'roleMatchMode';

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
 * Role metadata configuration
 */
interface RoleMetadata {
  roles: UserRole[];
  mode: RoleMatchMode;
}

/**
 * Role Guard
 *
 * Protects GraphQL resolvers and REST routes based on user roles.
 * Supports role hierarchy where ADMIN can access USER routes.
 *
 * Usage with single role:
 * @UseGuards(GqlAuthGuard, RoleGuard)
 * @RequireRole(UserRole.ADMIN)
 * @Mutation(() => SomeType)
 * async adminOnlyMutation() { ... }
 *
 * Usage with multiple roles (any):
 * @UseGuards(GqlAuthGuard, RoleGuard)
 * @RequireRole(UserRole.ADMIN, UserRole.USER)
 * @Query(() => SomeType)
 * async flexibleQuery() { ... }
 *
 * Usage with role match mode:
 * @UseGuards(GqlAuthGuard, RoleGuard)
 * @RequireRole(UserRole.ADMIN, UserRole.USER, { mode: RoleMatchMode.ALL })
 * @Mutation(() => SomeType)
 * async requiresAllRoles() { ... }
 *
 * Returns proper HTTP status codes:
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User authenticated but lacks required roles
 */
@Injectable()
export class RoleGuard implements CanActivate {
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

    // Get required roles from decorator metadata
    const metadata = this.getRoleMetadata(context);

    // No roles required - allow access
    if (!metadata.roles || metadata.roles.length === 0) {
      return true;
    }

    // Get GraphQL context and extract user
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GqlContext>();
    const user = gqlContext.req?.user;

    if (!user) {
      throw new MissingTokenException('User not authenticated');
    }

    // Get user roles (from JWT roles array or entity role string)
    const userRoles = this.getUserRoles(user);

    // Check if user has required roles based on match mode
    const hasAccess = this.checkRoles(userRoles, metadata.roles, metadata.mode);

    if (!hasAccess) {
      throw new ForbiddenAccessException(
        `Insufficient permissions. Required role: ${this.formatRequiredRoles(metadata.roles, metadata.mode)}`,
      );
    }

    return true;
  }

  /**
   * Extract role metadata from decorator
   */
  private getRoleMetadata(context: ExecutionContext): RoleMetadata {
    const roles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const mode =
      this.reflector.getAllAndOverride<RoleMatchMode>(ROLE_MATCH_MODE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? RoleMatchMode.ANY;

    return { roles, mode };
  }

  /**
   * Get user roles from request user object
   * Handles legacy role names via LEGACY_ROLE_MAP
   */
  private getUserRoles(user: RequestUser): UserRole[] {
    // From JWT (roles array)
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles
        .map((r) => this.normalizeRole(r))
        .filter((r): r is UserRole => r !== null);
    }

    // From User entity (single role string)
    if (user.role) {
      const normalized = this.normalizeRole(user.role);
      if (normalized) return [normalized];
    }

    return [];
  }

  /**
   * Normalize role string to UserRole enum
   * Handles legacy role names via LEGACY_ROLE_MAP
   */
  private normalizeRole(role: string): UserRole | null {
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

  /**
   * Check if user roles satisfy required roles based on match mode
   */
  private checkRoles(
    userRoles: UserRole[],
    requiredRoles: UserRole[],
    mode: RoleMatchMode,
  ): boolean {
    if (requiredRoles.length === 0) {
      return true;
    }

    if (userRoles.length === 0) {
      return false;
    }

    switch (mode) {
      case RoleMatchMode.ALL:
        return this.checkAllRoles(userRoles, requiredRoles);

      case RoleMatchMode.ANY:
      default:
        return this.checkAnyRole(userRoles, requiredRoles);
    }
  }

  /**
   * Check if user has at least one of the required roles (considering hierarchy)
   */
  private checkAnyRole(
    userRoles: UserRole[],
    requiredRoles: UserRole[],
  ): boolean {
    for (const requiredRole of requiredRoles) {
      for (const userRole of userRoles) {
        if (this.hasRoleOrHigher(userRole, requiredRole)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if user has all of the required roles (considering hierarchy)
   */
  private checkAllRoles(
    userRoles: UserRole[],
    requiredRoles: UserRole[],
  ): boolean {
    // For ALL mode, each required role must be satisfied by at least one user role
    return requiredRoles.every((requiredRole) =>
      userRoles.some((userRole) =>
        this.hasRoleOrHigher(userRole, requiredRole),
      ),
    );
  }

  /**
   * Check if userRole has the required role or higher in hierarchy
   * Uses ROLE_LEVELS from user-role.enum for consistent hierarchy checking
   *
   * Hierarchy: SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)
   */
  private hasRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
    const userLevel = ROLE_LEVELS[userRole];
    const requiredLevel = ROLE_LEVELS[requiredRole];

    // User has access if their role is at the same level or higher
    return userLevel >= requiredLevel;
  }

  /**
   * Format required roles for error message
   */
  private formatRequiredRoles(roles: UserRole[], mode: RoleMatchMode): string {
    if (roles.length === 1) {
      return roles[0];
    }

    const roleList = roles.join(', ');
    return mode === RoleMatchMode.ALL
      ? `all of: [${roleList}]`
      : `any of: [${roleList}]`;
  }
}

/**
 * Decorator for specifying required roles
 *
 * @param roles - One or more UserRole values required for access
 * @param options - Optional configuration for role matching
 *
 * @example
 * // Single required role
 * @RequireRole(UserRole.ADMIN)
 *
 * @example
 * // Multiple roles - user needs at least one (default)
 * @RequireRole(UserRole.ADMIN, UserRole.MODERATOR)
 *
 * @example
 * // Multiple roles - user needs all
 * @RequireRole(UserRole.ADMIN, UserRole.MODERATOR, { mode: RoleMatchMode.ALL })
 */
export const RequireRole = (
  ...roles: [UserRole, ...UserRole[]]
): MethodDecorator & ClassDecorator => {
  const [firstRole, ...restRoles] = roles;
  const roleValues: UserRole[] = [firstRole, ...restRoles];

  return (
    target: object | Record<string, unknown>,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    // For method decorators (descriptor present)
    if (descriptor && propertyKey) {
      SetMetadata(ROLES_KEY, roleValues)(target, propertyKey, descriptor);
    }
    // For class decorators (descriptor undefined)
    else {
      SetMetadata(ROLES_KEY, roleValues)(target as Function);
    }
  };
};

/**
 * Decorator for specifying role match mode
 * Used in combination with @RequireRole
 *
 * @example
 * @RequireRole(UserRole.ADMIN, UserRole.MODERATOR)
 * @RoleMatchMode(RoleMatchMode.ALL)
 */
export const SetRoleMatchMode = (
  mode: RoleMatchMode,
): MethodDecorator & ClassDecorator => {
  return (
    target: object | Record<string, unknown>,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor && propertyKey) {
      SetMetadata(ROLE_MATCH_MODE_KEY, mode)(target, propertyKey, descriptor);
    } else {
      SetMetadata(ROLE_MATCH_MODE_KEY, mode)(target as Function);
    }
  };
};

/**
 * Convenience decorator for requiring admin role
 *
 * @example
 * @UseGuards(GqlAuthGuard, RoleGuard)
 * @RequireAdmin
 * @Mutation(() => SomeType)
 * async adminOnlyMutation() { ... }
 */
export const RequireAdmin = (): MethodDecorator & ClassDecorator =>
  RequireRole(UserRole.ADMIN);
