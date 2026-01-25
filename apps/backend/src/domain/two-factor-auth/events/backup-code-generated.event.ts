import { DomainEvent } from '../../shared/base';

interface BackupCodeGeneratedPayload {
  userId: string;
  codeCount: number;
  generatedAt: Date;
}

/**
 * Event raised when backup codes are generated for a user.
 */
export class BackupCodeGeneratedEvent extends DomainEvent {
  public readonly eventName = 'two-factor-auth.backup-codes.generated';
  public readonly aggregateType = 'TwoFactorAuth';

  constructor(private readonly payload: BackupCodeGeneratedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.userId;
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.payload.userId,
      codeCount: this.payload.codeCount,
      generatedAt: this.payload.generatedAt.toISOString(),
    };
  }
}
