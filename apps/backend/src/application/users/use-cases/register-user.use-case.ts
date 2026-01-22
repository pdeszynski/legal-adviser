import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { IUseCase, BusinessRuleViolationError } from '../../common';
import { RegisterUserDto, RegisterUserResultDto } from '../dto';
import { UserAggregate } from '../../../domain/user-management/aggregates';
import type { IUserRepository } from '../../../domain/user-management/repositories';

/**
 * Use Case: Register a new user
 *
 * This use case orchestrates the registration of a new user:
 * 1. Validates that email is unique
 * 2. Creates the domain aggregate
 * 3. Persists the aggregate via repository
 * 4. Publishes domain events
 */
@Injectable()
export class RegisterUserUseCase implements IUseCase<
  RegisterUserDto,
  RegisterUserResultDto
> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: RegisterUserDto): Promise<RegisterUserResultDto> {
    // Check if email already exists
    const existingUser = await this.userRepository.existsByEmail(request.email);
    if (existingUser) {
      throw new BusinessRuleViolationError('Email address is already in use', {
        email: request.email,
      });
    }

    // Generate unique ID for the user
    const userId = uuidv4();

    // Create the domain aggregate (business rules are enforced here)
    const user = UserAggregate.register(
      userId,
      request.email,
      request.firstName,
      request.lastName,
      request.role,
      request.password, // Note: In production, this should be hashed before passing
    );

    // Persist the aggregate
    await this.userRepository.save(user);

    // Publish domain events
    const domainEvents = user.clearDomainEvents();
    for (const event of domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }

    // Return result DTO
    return {
      id: user.id,
      email: user.email.toValue(),
      fullName: user.fullName.fullName,
      role: user.role.toValue(),
      createdAt: user.createdAt,
    };
  }
}
