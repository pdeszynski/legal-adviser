import { DomainEvent } from '../../shared/base';

interface BackupCodeUsedPayload {
  userId: string;
  remainingCount: number;
  usedAt: Date;
}

/**
 * Event raised when a backup code is used for authentication.
 */
export class BackupCodeUsedEvent extends DomainEvent {
  public readonly eventName = 'two-factor-auth.backup-codes.used';
  public readonly aggregateType = 'TwoFactorAuth';

  constructor(private readonly payload: BackupCodeUsedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.userId;
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.payload.userId,
      remainingCount: this.payload.remainingCount,
      usedAt: this.payload.usedAt.toISOString(),
    };
  }
}
