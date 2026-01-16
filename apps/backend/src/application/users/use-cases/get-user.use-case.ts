import { Injectable, Inject } from '@nestjs/common';
import { IUseCase, NotFoundError } from '../../common';
import { UserDto } from '../dto';
import type { IUserRepository } from '../../../domain/user-management/repositories';

/**
 * Input for getting a user by ID
 */
export interface GetUserInput {
  readonly userId: string;
}

/**
 * Use Case: Get a user by ID
 *
 * This use case retrieves a single user by their unique identifier.
 */
@Injectable()
export class GetUserUseCase implements IUseCase<GetUserInput, UserDto> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetUserInput): Promise<UserDto> {
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundError('User', request.userId);
    }

    return {
      id: user.id,
      email: user.email.toValue(),
      firstName: user.fullName.firstName,
      lastName: user.fullName.lastName,
      fullName: user.fullName.fullName,
      role: user.role.toValue(),
      status: user.status.toValue(),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
