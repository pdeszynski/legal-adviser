import { DomainEvent } from '../../shared/base';

interface TotpDisabledPayload {
  userId: string;
  disabledAt: Date;
}

/**
 * Event raised when TOTP two-factor authentication is disabled for a user.
 */
export class TotpDisabledEvent extends DomainEvent {
  public readonly eventName = 'two-factor-auth.totp.disabled';
  public readonly aggregateType = 'TwoFactorAuth';

  constructor(private readonly payload: TotpDisabledPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.userId;
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.payload.userId,
      disabledAt: this.payload.disabledAt.toISOString(),
    };
  }
}
