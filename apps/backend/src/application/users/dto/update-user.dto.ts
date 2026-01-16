import { UserRoleEnum } from '../../../domain/user-management/value-objects';

/**
 * Input DTO for updating user profile.
 */
export interface UpdateUserProfileDto {
  readonly userId: string;
  readonly firstName?: string;
  readonly lastName?: string;
}

/**
 * Input DTO for updating user email.
 */
export interface UpdateUserEmailDto {
  readonly userId: string;
  readonly newEmail: string;
}

/**
 * Input DTO for changing user role.
 */
export interface ChangeUserRoleDto {
  readonly userId: string;
  readonly newRole: UserRoleEnum;
  readonly changedBy: string;
}

/**
 * Input DTO for suspending a user.
 */
export interface SuspendUserDto {
  readonly userId: string;
  readonly reason: string;
  readonly suspendedBy: string;
}
