import { Injectable, Inject } from '@nestjs/common';
import { IUseCase, NotFoundError } from '../../common';
import { UserDto } from '../dto';
import type { IUserRepository } from '../../../domain/user-management/repositories';

/**
 * Input for getting a user by email
 */
export interface GetUserByEmailInput {
  readonly email: string;
}

/**
 * Use Case: Get a user by email
 *
 * This use case retrieves a single user by their email address.
 */
@Injectable()
export class GetUserByEmailUseCase implements IUseCase<
  GetUserByEmailInput,
  UserDto
> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetUserByEmailInput): Promise<UserDto> {
    const user = await this.userRepository.findByEmail(request.email);

    if (!user) {
      throw new NotFoundError('User', request.email);
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
