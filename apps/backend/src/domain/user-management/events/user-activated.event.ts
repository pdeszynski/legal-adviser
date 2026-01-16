import { DomainEvent } from '../../shared/base';

interface UserActivatedPayload {
  userId: string;
  activatedAt: Date;
}

/**
 * Event raised when a user account is activated
 */
export class UserActivatedEvent extends DomainEvent {
  public readonly eventName = 'user-management.user.activated';
  public readonly aggregateType = 'User';

  constructor(private readonly payload: UserActivatedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.userId;
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.payload.userId,
      activatedAt: this.payload.activatedAt.toISOString(),
    };
  }
}
