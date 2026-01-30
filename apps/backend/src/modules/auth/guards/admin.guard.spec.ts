import { AdminGuard } from './admin.guard';
import { UserRole } from '../enums/user-role.enum';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Create a mock execution context for testing AdminGuard
 */
function createMockContext(
  userRoles: string[] | string | null = null,
  userId = 'user-123',
): ExecutionContext {
  const mockContext = {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  // Mock GqlExecutionContext.create to return our custom context
  jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
    getContext: () => ({
      req: {
        user: userRoles
          ? {
              userId,
              roles: Array.isArray(userRoles) ? userRoles : [userRoles],
              role: Array.isArray(userRoles) ? userRoles[0] : userRoles,
            }
          : undefined,
      },
    }),
    getArgs: () => ({}),
  } as unknown as GqlExecutionContext);

  return mockContext;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AdminGuard(reflector);
    jest.clearAllMocks();
  });

  describe('with ADMIN role', () => {
    it('should allow access when user has ADMIN role', () => {
      const context = createMockContext([UserRole.ADMIN]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false); // isPublic = false

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user has single role string as ADMIN', () => {
      const context = createMockContext(UserRole.ADMIN);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('with SUPER_ADMIN role', () => {
    it('should allow access when user has SUPER_ADMIN role (higher than ADMIN)', () => {
      const context = createMockContext([UserRole.SUPER_ADMIN]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow SUPER_ADMIN to access admin-only routes', () => {
      const context = createMockContext(UserRole.SUPER_ADMIN);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('with non-admin roles', () => {
    it('should deny access when user has CLIENT role', () => {
      const context = createMockContext([UserRole.CLIENT]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });

    it('should deny access when user has LAWYER role', () => {
      const context = createMockContext([UserRole.LAWYER]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });

    it('should deny access when user has PARALEGAL role', () => {
      const context = createMockContext([UserRole.PARALEGAL]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });

    it('should deny access when user has GUEST role', () => {
      const context = createMockContext([UserRole.GUEST]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });
  });

  describe('legacy role mapping', () => {
    it('should allow access with legacy "admin" role', () => {
      const context = createMockContext(['admin']);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access with legacy "user" role', () => {
      const context = createMockContext(['user']);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });
  });

  describe('with multiple roles', () => {
    it('should use the highest role when user has multiple roles', () => {
      const context = createMockContext([UserRole.CLIENT, UserRole.ADMIN]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny when highest role is below ADMIN level', () => {
      const context = createMockContext([UserRole.GUEST, UserRole.CLIENT]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });

    it('should allow access when one of multiple roles is SUPER_ADMIN', () => {
      const context = createMockContext([
        UserRole.CLIENT,
        UserRole.LAWYER,
        UserRole.SUPER_ADMIN,
      ]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('with no authenticated user', () => {
    it('should throw missing token exception', () => {
      const context = createMockContext(null); // No user
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow(
        'User not authenticated',
      );
    });
  });

  describe('public routes', () => {
    it('should allow access when route is marked as public', () => {
      const context = createMockContext(null); // No user

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true); // isPublic = true

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should skip admin check when PUBLIC_KEY metadata is true', () => {
      const context = createMockContext([UserRole.CLIENT]); // Non-admin user

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('role hierarchy', () => {
    it('should allow SUPER_ADMIN(5) to access admin routes', () => {
      const context = createMockContext([UserRole.SUPER_ADMIN]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow ADMIN(4) to access admin routes', () => {
      const context = createMockContext([UserRole.ADMIN]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny LAWYER(3) from accessing admin routes', () => {
      const context = createMockContext([UserRole.LAWYER]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });

    it('should deny PARALEGAL(2) from accessing admin routes', () => {
      const context = createMockContext([UserRole.PARALEGAL]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });

    it('should deny CLIENT(1) from accessing admin routes', () => {
      const context = createMockContext([UserRole.CLIENT]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });

    it('should deny GUEST(0) from accessing admin routes', () => {
      const context = createMockContext([UserRole.GUEST]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });
  });

  describe('array vs single role string format', () => {
    it('should handle roles array format (from JWT)', () => {
      const context = createMockContext([UserRole.ADMIN]);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should handle single role string format (from User.entity)', () => {
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
              roles: undefined,
            },
          },
        }),
        getArgs: () => ({}),
      } as unknown as GqlExecutionContext);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should prioritize roles array over single role string when both present', () => {
      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({
          req: {
            user: {
              userId: 'user-123',
              role: UserRole.CLIENT, // Lower role in string
              roles: [UserRole.ADMIN], // Higher role in array
            },
          },
        }),
        getArgs: () => ({}),
      } as unknown as GqlExecutionContext);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);

      // Should use array (highest role from array is ADMIN)
      expect(guard.canActivate(mockContext)).toBe(true);
    });
  });
});
