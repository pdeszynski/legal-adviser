import {
  RoleGuard,
  RequireRole,
  RequireAdmin,
  RoleMatchMode,
  SetRoleMatchMode,
  ROLES_KEY,
  ROLE_MATCH_MODE_KEY,
} from './role.guard';
import { UserRole } from '../enums/user-role.enum';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Create a mock execution context for testing
 */
function createMockContext(
  userRoles: string[] | string = [],
  userId = 'user-123',
): ExecutionContext {
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];

  const mockContext = {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  // Mock GqlExecutionContext.create to return our custom context
  jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
    getContext: () => ({
      req: {
        user: {
          userId,
          roles,
        },
      },
    }),
    getArgs: () => ({}),
  } as unknown as GqlExecutionContext);

  return mockContext;
}

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RoleGuard(reflector);
    jest.clearAllMocks();
  });

  describe('with single required role', () => {
    it('should allow access when user has the required role', () => {
      const context = createMockContext([UserRole.ADMIN]);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([UserRole.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access when user does not have the required role', () => {
      const context = createMockContext([UserRole.USER]);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([UserRole.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });

    it('should allow admin to access user routes (role hierarchy)', () => {
      const context = createMockContext([UserRole.ADMIN]);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([UserRole.USER]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny user from accessing admin routes', () => {
      const context = createMockContext([UserRole.USER]);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([UserRole.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });
  });

  describe('with multiple required roles (ANY mode)', () => {
    it('should allow access when user has at least one required role', () => {
      const context = createMockContext([UserRole.USER]);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([UserRole.ADMIN, UserRole.USER])
        .mockReturnValueOnce(RoleMatchMode.ANY);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access when user has none of the required roles', () => {
      const context = createMockContext([UserRole.USER]);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([UserRole.ADMIN])
        .mockReturnValueOnce(RoleMatchMode.ANY);

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });
  });

  describe('with ALL match mode', () => {
    it('should allow access when admin can satisfy all roles (via hierarchy)', () => {
      const context = createMockContext([UserRole.ADMIN]);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([UserRole.USER, UserRole.ADMIN])
        .mockReturnValueOnce(RoleMatchMode.ALL);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access when user cannot satisfy all roles', () => {
      const context = createMockContext([UserRole.USER]);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([UserRole.USER, UserRole.ADMIN])
        .mockReturnValueOnce(RoleMatchMode.ALL);

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });
  });

  describe('with no required roles', () => {
    it('should allow access when no roles are required', () => {
      const context = createMockContext([UserRole.USER]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce([]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when metadata is undefined', () => {
      const context = createMockContext([UserRole.USER]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(undefined);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('with no authenticated user', () => {
    it('should throw missing token exception', () => {
      const context = createMockContext([]);
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([UserRole.ADMIN]);

      // Override the context to have no user
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({
          req: {
            user: undefined,
          },
        }),
        getArgs: () => ({}),
      } as unknown as GqlExecutionContext);

      expect(() => guard.canActivate(context)).toThrow(
        'User not authenticated',
      );
    });
  });

  describe('decorator functions', () => {
    it('RequireRole should set metadata', () => {
      const decorator = RequireRole(UserRole.ADMIN);
      const target = {};
      const propertyKey = 'testMethod';
      const descriptor = { value: () => {} };

      decorator(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(
        ROLES_KEY,
        target,
        propertyKey,
      ) as UserRole[];
      expect(metadata).toEqual([UserRole.ADMIN]);
    });

    it('RequireAdmin should set ADMIN role metadata', () => {
      const decorator = RequireAdmin();
      const target = {};
      const propertyKey = 'testMethod';
      const descriptor = { value: () => {} };

      decorator(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(
        ROLES_KEY,
        target,
        propertyKey,
      ) as UserRole[];
      expect(metadata).toEqual([UserRole.ADMIN]);
    });

    it('SetRoleMatchMode should set mode metadata', () => {
      const decorator = SetRoleMatchMode(RoleMatchMode.ALL);
      const target = {};
      const propertyKey = 'testMethod';
      const descriptor = { value: () => {} };

      decorator(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(
        ROLE_MATCH_MODE_KEY,
        target,
        propertyKey,
      ) as RoleMatchMode;
      expect(metadata).toEqual(RoleMatchMode.ALL);
    });
  });
});
