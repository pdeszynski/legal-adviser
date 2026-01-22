import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IUseCase,
  NotFoundError,
  BusinessRuleViolationError,
} from '../../common';
import { SuspendUserDto, UserDto } from '../dto';
import type { IUserRepository } from '../../../domain/user-management/repositories';

/**
 * Use Case: Suspend a user account
 *
 * This use case orchestrates the suspension of a user account:
 * 1. Loads the user aggregate
 * 2. Calls the suspension business method
 * 3. Persists the updated aggregate
 * 4. Publishes domain events
 */
@Injectable()
export class SuspendUserUseCase implements IUseCase<SuspendUserDto, UserDto> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: SuspendUserDto): Promise<UserDto> {
    // Load the user aggregate
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundError('User', request.userId);
    }

    // Call the domain method (business rules enforced in aggregate)
    try {
      user.suspend(request.reason, request.suspendedBy);
    } catch (error) {
      throw new BusinessRuleViolationError(
        error instanceof Error ? error.message : 'Cannot suspend user',
        { userId: request.userId },
      );
    }

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
