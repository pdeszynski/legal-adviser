import { SimpleValueObject } from '../../shared/base';

/**
 * User account status
 */
export enum UserStatusEnum {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

/**
 * User Status Value Object
 */
export class UserStatus extends SimpleValueObject<UserStatusEnum> {
  protected validate(value: UserStatusEnum): void {
    if (!Object.values(UserStatusEnum).includes(value)) {
      throw new Error(`Invalid user status: ${value}`);
    }
  }

  static create(status: UserStatusEnum): UserStatus {
    return new UserStatus(status);
  }

  static pending(): UserStatus {
    return new UserStatus(UserStatusEnum.PENDING);
  }

  static active(): UserStatus {
    return new UserStatus(UserStatusEnum.ACTIVE);
  }

  isPending(): boolean {
    return this.value === UserStatusEnum.PENDING;
  }

  isActive(): boolean {
    return this.value === UserStatusEnum.ACTIVE;
  }

  isSuspended(): boolean {
    return this.value === UserStatusEnum.SUSPENDED;
  }

  canLogin(): boolean {
    return this.value === UserStatusEnum.ACTIVE;
  }

  canTransitionTo(newStatus: UserStatusEnum): boolean {
    const transitions: Record<UserStatusEnum, UserStatusEnum[]> = {
      [UserStatusEnum.PENDING]: [
        UserStatusEnum.ACTIVE,
        UserStatusEnum.DEACTIVATED,
      ],
      [UserStatusEnum.ACTIVE]: [
        UserStatusEnum.SUSPENDED,
        UserStatusEnum.DEACTIVATED,
      ],
      [UserStatusEnum.SUSPENDED]: [
        UserStatusEnum.ACTIVE,
        UserStatusEnum.DEACTIVATED,
      ],
      [UserStatusEnum.DEACTIVATED]: [],
    };

    return transitions[this.value]?.includes(newStatus) ?? false;
  }
}
