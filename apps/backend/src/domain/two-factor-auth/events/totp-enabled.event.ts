import { DomainEvent } from '../../shared/base';

interface TotpEnabledPayload {
  userId: string;
  enabledAt: Date;
}

/**
 * Event raised when TOTP two-factor authentication is enabled for a user.
 */
export class TotpEnabledEvent extends DomainEvent {
  public readonly eventName = 'two-factor-auth.totp.enabled';
  public readonly aggregateType = 'TwoFactorAuth';

  constructor(private readonly payload: TotpEnabledPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.userId;
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.payload.userId,
      enabledAt: this.payload.enabledAt.toISOString(),
    };
  }
}
