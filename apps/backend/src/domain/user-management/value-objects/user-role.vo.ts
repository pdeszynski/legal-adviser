import { SimpleValueObject } from '../../shared/base';

/**
 * User roles in the system
 */
export enum UserRoleEnum {
  ADMIN = 'admin',
  LAWYER = 'lawyer',
  CLIENT = 'client',
  GUEST = 'guest',
}

/**
 * User Role Value Object
 */
export class UserRole extends SimpleValueObject<UserRoleEnum> {
  protected validate(value: UserRoleEnum): void {
    if (!Object.values(UserRoleEnum).includes(value)) {
      throw new Error(`Invalid user role: ${value}`);
    }
  }

  static create(role: UserRoleEnum): UserRole {
    return new UserRole(role);
  }

  static fromString(role: string): UserRole {
    const enumValue = role as UserRoleEnum;
    if (!Object.values(UserRoleEnum).includes(enumValue)) {
      throw new Error(`Invalid user role: ${role}`);
    }
    return new UserRole(enumValue);
  }

  static admin(): UserRole {
    return new UserRole(UserRoleEnum.ADMIN);
  }

  static client(): UserRole {
    return new UserRole(UserRoleEnum.CLIENT);
  }

  isAdmin(): boolean {
    return this.value === UserRoleEnum.ADMIN;
  }

  isLawyer(): boolean {
    return this.value === UserRoleEnum.LAWYER;
  }

  canAccessAdminPanel(): boolean {
    return [UserRoleEnum.ADMIN, UserRoleEnum.LAWYER].includes(this.value);
  }

  canManageDocuments(): boolean {
    return [UserRoleEnum.ADMIN, UserRoleEnum.LAWYER].includes(this.value);
  }
}
