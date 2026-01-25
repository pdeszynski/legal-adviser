/**
 * Two-Factor Authentication Status Enum
 *
 * Represents the current state of two-factor authentication for a user.
 */
export enum TotpStatusEnum {
  DISABLED = 'disabled',
  ENABLED = 'enabled',
  PENDING_VERIFICATION = 'pending_verification',
}

/**
 * TOTP Status Value Object
 *
 * Represents whether TOTP two-factor authentication is enabled, disabled, or pending verification.
 */
export class TotpStatus {
  private readonly value: TotpStatusEnum;

  private constructor(value: TotpStatusEnum) {
    this.value = value;
  }

  static create(status: TotpStatusEnum): TotpStatus {
    return new TotpStatus(status);
  }

  static disabled(): TotpStatus {
    return new TotpStatus(TotpStatusEnum.DISABLED);
  }

  static enabled(): TotpStatus {
    return new TotpStatus(TotpStatusEnum.ENABLED);
  }

  static pendingVerification(): TotpStatus {
    return new TotpStatus(TotpStatusEnum.PENDING_VERIFICATION);
  }

  toValue(): TotpStatusEnum {
    return this.value;
  }

  isEnabled(): boolean {
    return this.value === TotpStatusEnum.ENABLED;
  }

  isPendingVerification(): boolean {
    return this.value === TotpStatusEnum.PENDING_VERIFICATION;
  }

  isDisabled(): boolean {
    return this.value === TotpStatusEnum.DISABLED;
  }

  canTransitionTo(newStatus: TotpStatusEnum): boolean {
    const transitions: Record<TotpStatusEnum, TotpStatusEnum[]> = {
      [TotpStatusEnum.DISABLED]: [
        TotpStatusEnum.PENDING_VERIFICATION,
        TotpStatusEnum.ENABLED,
      ],
      [TotpStatusEnum.PENDING_VERIFICATION]: [
        TotpStatusEnum.ENABLED,
        TotpStatusEnum.DISABLED,
      ],
      [TotpStatusEnum.ENABLED]: [TotpStatusEnum.DISABLED],
    };

    return transitions[this.value]?.includes(newStatus) ?? false;
  }

  equals(other: TotpStatus): boolean {
    return this.value === other.value;
  }
}
