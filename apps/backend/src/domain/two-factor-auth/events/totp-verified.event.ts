import { DomainEvent } from '../../shared/base';

interface TotpVerifiedPayload {
  userId: string;
  verifiedAt: Date;
}

/**
 * Event raised when TOTP two-factor authentication is verified for the first time.
 * This occurs after the user successfully enters their first TOTP code during setup.
 */
export class TotpVerifiedEvent extends DomainEvent {
  public readonly eventName = 'two-factor-auth.totp.verified';
  public readonly aggregateType = 'TwoFactorAuth';

  constructor(private readonly payload: TotpVerifiedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.userId;
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.payload.userId,
      verifiedAt: this.payload.verifiedAt.toISOString(),
    };
  }
}
