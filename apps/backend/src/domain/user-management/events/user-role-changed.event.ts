import { DomainEvent } from '../../shared/base';

interface UserRoleChangedPayload {
  userId: string;
  previousRole: string;
  newRole: string;
  changedBy: string;
  changedAt: Date;
}

/**
 * Event raised when a user's role is changed
 */
export class UserRoleChangedEvent extends DomainEvent {
  public readonly eventName = 'user-management.user.role-changed';
  public readonly aggregateType = 'User';

  constructor(private readonly payload: UserRoleChangedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.userId;
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.payload.userId,
      previousRole: this.payload.previousRole,
      newRole: this.payload.newRole,
      changedBy: this.payload.changedBy,
      changedAt: this.payload.changedAt.toISOString(),
    };
  }
}
