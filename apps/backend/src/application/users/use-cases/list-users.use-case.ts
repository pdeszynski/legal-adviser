import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../common';
import { UserSummaryDto, PaginatedUsersDto } from '../dto';
import type { IUserRepository } from '../../../domain/user-management/repositories';
import { UserRoleEnum, UserStatusEnum } from '../../../domain/user-management/value-objects';

/**
 * Input for listing users with filters
 */
export interface ListUsersInput {
  readonly page?: number;
  readonly pageSize?: number;
  readonly role?: UserRoleEnum;
  readonly status?: UserStatusEnum;
}

/**
 * Use Case: List users with optional filters
 *
 * This use case retrieves a paginated list of users with optional filtering.
 */
@Injectable()
export class ListUsersUseCase
  implements IUseCase<ListUsersInput, PaginatedUsersDto>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: ListUsersInput): Promise<PaginatedUsersDto> {
    const page = request.page ?? 1;
    const pageSize = request.pageSize ?? 20;

    // Get users based on filters
    let users;
    if (request.role) {
      users = await this.userRepository.findByRole(request.role);
    } else if (request.status) {
      users = await this.userRepository.findByStatus(request.status);
    } else {
      users = await this.userRepository.findActiveUsers();
    }

    // Calculate pagination
    const total = users.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = users.slice(startIndex, startIndex + pageSize);

    // Map to DTOs
    const items: UserSummaryDto[] = paginatedUsers.map((user) => ({
      id: user.id,
      email: user.email.toValue(),
      fullName: user.fullName.fullName,
      role: user.role.toValue(),
      status: user.status.toValue(),
      createdAt: user.createdAt,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}
