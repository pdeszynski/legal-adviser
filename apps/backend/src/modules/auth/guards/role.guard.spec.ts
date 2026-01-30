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

/**
 * Helper to setup reflector mocks with default mode
 */
function setupReflectorMock(
  reflector: Reflector,
  roles: UserRole[] | undefined,
  mode: RoleMatchMode = RoleMatchMode.ANY,
  isPublic = false,
): void {
  jest
    .spyOn(reflector, 'getAllAndOverride')
    .mockReturnValueOnce(isPublic) // PUBLIC_KEY check
    .mockReturnValueOnce(roles) // ROLES_KEY
    .mockReturnValueOnce(mode); // ROLE_MATCH_MODE_KEY
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
      setupReflectorMock(reflector, [UserRole.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access when user does not have the required role', () => {
      const context = createMockContext([UserRole.CLIENT]);
      setupReflectorMock(reflector, [UserRole.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });

    it('should allow admin to access client routes (role hierarchy)', () => {
      const context = createMockContext([UserRole.ADMIN]);
      setupReflectorMock(reflector, [UserRole.CLIENT]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny client from accessing admin routes', () => {
      const context = createMockContext([UserRole.CLIENT]);
      setupReflectorMock(reflector, [UserRole.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });
  });

  describe('with multiple required roles (ANY mode)', () => {
    it('should allow access when user has at least one required role', () => {
      const context = createMockContext([UserRole.CLIENT]);
      setupReflectorMock(reflector, [UserRole.ADMIN, UserRole.CLIENT]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access when user has none of the required roles', () => {
      const context = createMockContext([UserRole.CLIENT]);
      setupReflectorMock(reflector, [UserRole.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });
  });

  describe('with ALL match mode', () => {
    it('should allow access when admin can satisfy all roles (via hierarchy)', () => {
      const context = createMockContext([UserRole.ADMIN]);
      setupReflectorMock(
        reflector,
        [UserRole.CLIENT, UserRole.ADMIN],
        RoleMatchMode.ALL,
      );

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access when user cannot satisfy all roles', () => {
      const context = createMockContext([UserRole.CLIENT]);
      setupReflectorMock(
        reflector,
        [UserRole.CLIENT, UserRole.ADMIN],
        RoleMatchMode.ALL,
      );

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });
  });

  describe('with no required roles', () => {
    it('should allow access when no roles are required', () => {
      const context = createMockContext([UserRole.CLIENT]);
      setupReflectorMock(reflector, []);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when metadata is undefined', () => {
      const context = createMockContext([UserRole.CLIENT]);
      setupReflectorMock(reflector, undefined);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('with no authenticated user', () => {
    it('should throw missing token exception', () => {
      const context = createMockContext([]);
      setupReflectorMock(reflector, [UserRole.ADMIN]);

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

  describe('role hierarchy (SUPER_ADMIN > ADMIN > LAWYER > PARALEGAL > CLIENT > GUEST)', () => {
    it('should allow SUPER_ADMIN to access ADMIN routes', () => {
      const context = createMockContext([UserRole.SUPER_ADMIN]);
      setupReflectorMock(reflector, [UserRole.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow ADMIN to access LAWYER routes', () => {
      const context = createMockContext([UserRole.ADMIN]);
      setupReflectorMock(reflector, [UserRole.LAWYER]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow LAWYER to access PARALEGAL routes', () => {
      const context = createMockContext([UserRole.LAWYER]);
      setupReflectorMock(reflector, [UserRole.PARALEGAL]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow PARALEGAL to access CLIENT routes', () => {
      const context = createMockContext([UserRole.PARALEGAL]);
      setupReflectorMock(reflector, [UserRole.CLIENT]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny CLIENT from accessing LAWYER routes', () => {
      const context = createMockContext([UserRole.CLIENT]);
      setupReflectorMock(reflector, [UserRole.LAWYER]);

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });

    it('should deny PARALEGAL from accessing ADMIN routes', () => {
      const context = createMockContext([UserRole.PARALEGAL]);
      setupReflectorMock(reflector, [UserRole.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });

    it('should allow SUPER_ADMIN to access GUEST routes (lowest level)', () => {
      const context = createMockContext([UserRole.SUPER_ADMIN]);
      setupReflectorMock(reflector, [UserRole.GUEST]);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('legacy role mapping', () => {
    it('should map legacy "user" role to CLIENT', () => {
      const context = createMockContext(['user']);
      setupReflectorMock(reflector, [UserRole.CLIENT]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should map legacy "admin" role to ADMIN', () => {
      const context = createMockContext(['admin']);
      setupReflectorMock(reflector, [UserRole.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should handle mixed legacy and new roles', () => {
      const context = createMockContext(['user', UserRole.ADMIN]);
      setupReflectorMock(reflector, [UserRole.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('single role string format (User.entity)', () => {
    it('should handle user.role string format instead of array', () => {
      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({
          req: {
            user: {
              userId: 'user-123',
              role: UserRole.ADMIN, // Single string, not array
            },
          },
        }),
        getArgs: () => ({}),
      } as unknown as GqlExecutionContext);

      setupReflectorMock(reflector, [UserRole.ADMIN]);

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should normalize single role string to array for checking', () => {
      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({
          req: {
            user: {
              userId: 'user-123',
              role: UserRole.CLIENT,
            },
          },
        }),
        getArgs: () => ({}),
      } as unknown as GqlExecutionContext);

      setupReflectorMock(reflector, [UserRole.CLIENT]);

      expect(guard.canActivate(mockContext)).toBe(true);
    });
  });

  describe('public routes', () => {
    it('should allow access when route is marked as public', () => {
      const context = createMockContext([]); // No user

      setupReflectorMock(reflector, undefined, RoleMatchMode.ANY, true);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('decorator functions', () => {
    it('RequireRole should return a decorator function', () => {
      const decorator = RequireRole(UserRole.ADMIN);
      expect(typeof decorator).toBe('function');
    });

    it('RequireAdmin should return a decorator function', () => {
      const decorator = RequireAdmin();
      expect(typeof decorator).toBe('function');
    });

    it('SetRoleMatchMode should return a decorator function', () => {
      const decorator = SetRoleMatchMode(RoleMatchMode.ALL);
      expect(typeof decorator).toBe('function');
    });
  });
});
