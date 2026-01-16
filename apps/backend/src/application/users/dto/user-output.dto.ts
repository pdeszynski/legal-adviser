import {
  UserRoleEnum,
  UserStatusEnum,
} from '../../../domain/user-management/value-objects';

/**
 * Standard output DTO representing a user.
 * Used for queries that return user information.
 */
export interface UserDto {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly role: UserRoleEnum;
  readonly status: UserStatusEnum;
  readonly lastLoginAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Summary DTO for user lists (without sensitive data).
 */
export interface UserSummaryDto {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRoleEnum;
  readonly status: UserStatusEnum;
  readonly createdAt: Date;
}

/**
 * Paginated result for user queries.
 */
export interface PaginatedUsersDto {
  readonly items: UserSummaryDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
