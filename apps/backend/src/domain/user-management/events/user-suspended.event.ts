import { DomainEvent } from '../../shared/base';

interface UserSuspendedPayload {
  userId: string;
  reason: string;
  suspendedBy: string;
  suspendedAt: Date;
}

/**
 * Event raised when a user account is suspended
 */
export class UserSuspendedEvent extends DomainEvent {
  public readonly eventName = 'user-management.user.suspended';
  public readonly aggregateType = 'User';

  constructor(private readonly payload: UserSuspendedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.userId;
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.payload.userId,
      reason: this.payload.reason,
      suspendedBy: this.payload.suspendedBy,
      suspendedAt: this.payload.suspendedAt.toISOString(),
    };
  }
}
