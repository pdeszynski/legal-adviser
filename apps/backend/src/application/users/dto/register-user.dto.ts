import { UserRoleEnum } from '../../../domain/user-management/value-objects';

/**
 * Input DTO for registering a new user.
 */
export interface RegisterUserDto {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly password: string;
  readonly role?: UserRoleEnum;
}

/**
 * Output DTO representing a registered user.
 */
export interface RegisterUserResultDto {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRoleEnum;
  readonly createdAt: Date;
}
