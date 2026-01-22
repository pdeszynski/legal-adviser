import { Injectable, Inject } from '@nestjs/common';
import { IUseCase, NotFoundError } from '../../common';
import { UpdateUserProfileDto, UserDto } from '../dto';
import type { IUserRepository } from '../../../domain/user-management/repositories';

/**
 * Use Case: Update user profile
 *
 * This use case orchestrates updating a user's profile information:
 * 1. Loads the user aggregate
 * 2. Updates profile information
 * 3. Persists the updated aggregate
 */
@Injectable()
export class UpdateUserProfileUseCase implements IUseCase<
  UpdateUserProfileDto,
  UserDto
> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: UpdateUserProfileDto): Promise<UserDto> {
    // Load the user aggregate
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundError('User', request.userId);
    }

    // Update profile if values provided
    if (request.firstName || request.lastName) {
      const firstName = request.firstName ?? user.fullName.firstName;
      const lastName = request.lastName ?? user.fullName.lastName;
      user.updateProfile(firstName, lastName);
    }

    // Persist the updated aggregate
    await this.userRepository.save(user);

    // Return updated user DTO
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
