import { Injectable, Logger } from '@nestjs/common';
import {
  ServiceResult,
  successResult,
  failureResult,
  PaginationParams,
  PaginatedResult,
  paginatedResult,
} from '../../common';
import { ApplicationError, NotFoundError } from '../../common/application-error';
import {
  RegisterUserDto,
  RegisterUserResultDto,
  UserDto,
  UserSummaryDto,
  PaginatedUsersDto,
  UpdateUserProfileDto,
  ChangeUserRoleDto,
  SuspendUserDto,
} from '../dto';
import { RegisterUserUseCase } from '../use-cases/register-user.use-case';
import { GetUserUseCase, GetUserInput } from '../use-cases/get-user.use-case';
import { GetUserByEmailUseCase } from '../use-cases/get-user-by-email.use-case';
import { ListUsersUseCase, ListUsersInput } from '../use-cases/list-users.use-case';
import { ActivateUserUseCase } from '../use-cases/activate-user.use-case';
import { SuspendUserUseCase } from '../use-cases/suspend-user.use-case';
import { ChangeUserRoleUseCase } from '../use-cases/change-user-role.use-case';
import { UpdateUserProfileUseCase } from '../use-cases/update-user-profile.use-case';
import {
  UserRoleEnum,
  UserStatusEnum,
} from '../../../domain/user-management/value-objects';

/**
 * User Application Service
 *
 * This service acts as an orchestrator for user management operations.
 * It coordinates between use cases, handles cross-cutting concerns,
 * and provides a unified API for the presentation layer.
 *
 * Key responsibilities:
 * - Coordinate multiple use cases when needed
 * - Handle error transformation
 * - Provide consistent result structure
 * - Support pagination and filtering
 * - Authorization checks (if needed)
 */
@Injectable()
export class UserApplicationService {
  private readonly logger = new Logger(UserApplicationService.name);

  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
    private readonly suspendUserUseCase: SuspendUserUseCase,
    private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
  ) {}

  /**
   * Registers a new user.
   *
   * @param dto - User registration data
   * @returns Service result with registered user info
   */
  async registerUser(
    dto: RegisterUserDto,
  ): Promise<ServiceResult<RegisterUserResultDto>> {
    try {
      this.logger.log(`Registering new user with email: ${dto.email}`);
      const result = await this.registerUserUseCase.execute(dto);
      this.logger.log(`User registered successfully: ${result.id}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<RegisterUserResultDto>(error, 'register user');
    }
  }

  /**
   * Retrieves a user by ID.
   *
   * @param userId - The user ID
   * @returns Service result with user data
   */
  async getUser(userId: string): Promise<ServiceResult<UserDto>> {
    try {
      this.logger.log(`Getting user: ${userId}`);
      const result = await this.getUserUseCase.execute({ userId });
      return successResult(result);
    } catch (error) {
      return this.handleError<UserDto>(error, 'get user');
    }
  }

  /**
   * Retrieves a user by email.
   *
   * @param email - The user's email
   * @returns Service result with user data
   */
  async getUserByEmail(email: string): Promise<ServiceResult<UserDto>> {
    try {
      this.logger.log(`Getting user by email: ${email}`);
      const result = await this.getUserByEmailUseCase.execute({ email });
      return successResult(result);
    } catch (error) {
      return this.handleError<UserDto>(error, 'get user by email');
    }
  }

  /**
   * Lists users with optional filters.
   *
   * @param input - Filter and pagination options
   * @returns Service result with paginated user list
   */
  async listUsers(input: ListUsersInput): Promise<ServiceResult<PaginatedUsersDto>> {
    try {
      this.logger.log(
        `Listing users - page: ${input.page}, role: ${input.role}, status: ${input.status}`,
      );
      const result = await this.listUsersUseCase.execute(input);
      return successResult(result);
    } catch (error) {
      return this.handleError<PaginatedUsersDto>(error, 'list users');
    }
  }

  /**
   * Lists users by role.
   *
   * @param role - The user role to filter by
   * @param pagination - Pagination parameters
   * @returns Service result with paginated user list
   */
  async listUsersByRole(
    role: UserRoleEnum,
    pagination?: PaginationParams,
  ): Promise<ServiceResult<PaginatedUsersDto>> {
    return this.listUsers({
      role,
      page: pagination?.page,
      pageSize: pagination?.limit,
    });
  }

  /**
   * Lists users by status.
   *
   * @param status - The user status to filter by
   * @param pagination - Pagination parameters
   * @returns Service result with paginated user list
   */
  async listUsersByStatus(
    status: UserStatusEnum,
    pagination?: PaginationParams,
  ): Promise<ServiceResult<PaginatedUsersDto>> {
    return this.listUsers({
      status,
      page: pagination?.page,
      pageSize: pagination?.limit,
    });
  }

  /**
   * Activates a pending user.
   *
   * @param userId - The user ID to activate
   * @returns Service result with activated user data
   */
  async activateUser(userId: string): Promise<ServiceResult<UserDto>> {
    try {
      this.logger.log(`Activating user: ${userId}`);
      const result = await this.activateUserUseCase.execute({ userId });
      this.logger.log(`User activated successfully: ${userId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<UserDto>(error, 'activate user');
    }
  }

  /**
   * Suspends a user account.
   *
   * @param dto - Suspension data including reason
   * @returns Service result with suspended user data
   */
  async suspendUser(dto: SuspendUserDto): Promise<ServiceResult<UserDto>> {
    try {
      this.logger.log(`Suspending user: ${dto.userId} by ${dto.suspendedBy}`);
      const result = await this.suspendUserUseCase.execute(dto);
      this.logger.log(`User suspended successfully: ${dto.userId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<UserDto>(error, 'suspend user');
    }
  }

  /**
   * Changes a user's role.
   *
   * @param dto - Role change data
   * @returns Service result with updated user data
   */
  async changeUserRole(dto: ChangeUserRoleDto): Promise<ServiceResult<UserDto>> {
    try {
      this.logger.log(
        `Changing role for user: ${dto.userId} to ${dto.newRole} by ${dto.changedBy}`,
      );
      const result = await this.changeUserRoleUseCase.execute(dto);
      this.logger.log(`User role changed successfully: ${dto.userId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<UserDto>(error, 'change user role');
    }
  }

  /**
   * Updates a user's profile.
   *
   * @param dto - Profile update data
   * @returns Service result with updated user data
   */
  async updateUserProfile(dto: UpdateUserProfileDto): Promise<ServiceResult<UserDto>> {
    try {
      this.logger.log(`Updating profile for user: ${dto.userId}`);
      const result = await this.updateUserProfileUseCase.execute(dto);
      this.logger.log(`User profile updated successfully: ${dto.userId}`);
      return successResult(result);
    } catch (error) {
      return this.handleError<UserDto>(error, 'update user profile');
    }
  }

  /**
   * Checks if a user exists by email.
   *
   * @param email - The email to check
   * @returns Service result with existence status
   */
  async userExistsByEmail(email: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.getUserByEmail(email);
      return successResult(result.success);
    } catch (error) {
      return successResult(false);
    }
  }

  /**
   * Gets user statistics.
   *
   * @returns Service result with user statistics
   */
  async getUserStatistics(): Promise<
    ServiceResult<{
      total: number;
      byRole: Record<UserRoleEnum, number>;
      byStatus: Record<UserStatusEnum, number>;
    }>
  > {
    try {
      this.logger.log('Getting user statistics');

      // Get all users to calculate statistics
      const result = await this.listUsersUseCase.execute({ pageSize: 10000 });

      const byRole = result.items.reduce(
        (acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        },
        {} as Record<UserRoleEnum, number>,
      );

      const byStatus = result.items.reduce(
        (acc, user) => {
          acc[user.status] = (acc[user.status] || 0) + 1;
          return acc;
        },
        {} as Record<UserStatusEnum, number>,
      );

      return successResult({
        total: result.total,
        byRole,
        byStatus,
      });
    } catch (error) {
      return this.handleError(error, 'get user statistics');
    }
  }

  /**
   * Handles errors and transforms them into service results.
   */
  private handleError<T>(error: unknown, operation: string): ServiceResult<T> {
    if (error instanceof NotFoundError) {
      this.logger.warn(`Not found during ${operation}: ${error.message}`);
      return failureResult('NOT_FOUND', error.message, error.details);
    }

    if (error instanceof ApplicationError) {
      this.logger.warn(`Application error during ${operation}: ${error.message}`);
      return failureResult(error.code, error.message, error.details);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Unexpected error during ${operation}: ${errorMessage}`);
    return failureResult('INTERNAL_ERROR', `Failed to ${operation}`, {
      originalError: errorMessage,
    });
  }
}
