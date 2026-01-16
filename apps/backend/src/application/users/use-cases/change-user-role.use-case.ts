import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase, NotFoundError } from '../../common';
import { ChangeUserRoleDto, UserDto } from '../dto';
import type { IUserRepository } from '../../../domain/user-management/repositories';

/**
 * Use Case: Change a user's role
 *
 * This use case orchestrates changing a user's role:
 * 1. Loads the user aggregate
 * 2. Calls the role change business method
 * 3. Persists the updated aggregate
 * 4. Publishes domain events
 */
@Injectable()
export class ChangeUserRoleUseCase
  implements IUseCase<ChangeUserRoleDto, UserDto>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: ChangeUserRoleDto): Promise<UserDto> {
    // Load the user aggregate
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundError('User', request.userId);
    }

    // Call the domain method (business rules enforced in aggregate)
    user.changeRole(request.newRole, request.changedBy);

    // Persist the updated aggregate
    await this.userRepository.save(user);

    // Publish domain events
    const domainEvents = user.clearDomainEvents();
    for (const event of domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }

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
