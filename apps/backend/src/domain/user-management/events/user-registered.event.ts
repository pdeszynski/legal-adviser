import { DomainEvent } from '../../shared/base';

interface UserRegisteredPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  registeredAt: Date;
}

/**
 * Event raised when a new user registers
 */
export class UserRegisteredEvent extends DomainEvent {
  public readonly eventName = 'user-management.user.registered';
  public readonly aggregateType = 'User';

  constructor(private readonly payload: UserRegisteredPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.userId;
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.payload.userId,
      email: this.payload.email,
      firstName: this.payload.firstName,
      lastName: this.payload.lastName,
      role: this.payload.role,
      registeredAt: this.payload.registeredAt.toISOString(),
    };
  }
}
