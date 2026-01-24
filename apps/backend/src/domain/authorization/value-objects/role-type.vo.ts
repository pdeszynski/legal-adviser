import { SimpleValueObject } from '../../shared/base';

/**
 * Role Types Enumeration
 * Defines the standard roles in the system following DDD principles
 */
export enum RoleTypeEnum {
  // Administrative roles
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',

  // Legal professional roles
  LAWYER = 'lawyer',
  PARALEGAL = 'paralegal',

  // Client roles
  CLIENT = 'client',
  GUEST = 'guest',
}

/**
 * Role Type Value Object
 * Represents the type/level of a role in the system
 */
export class RoleType extends SimpleValueObject<RoleTypeEnum> {
  protected validate(value: RoleTypeEnum): void {
    if (!Object.values(RoleTypeEnum).includes(value)) {
      throw new Error(`Invalid role type: ${value}`);
    }
  }

  static create(type: RoleTypeEnum): RoleType {
    return new RoleType(type);
  }

  static fromString(type: string): RoleType {
    const enumValue = type as RoleTypeEnum;
    if (!Object.values(RoleTypeEnum).includes(enumValue)) {
      throw new Error(`Invalid role type: ${type}`);
    }
    return new RoleType(enumValue);
  }

  // Helper factory methods
  static superAdmin(): RoleType {
    return new RoleType(RoleTypeEnum.SUPER_ADMIN);
  }

  static admin(): RoleType {
    return new RoleType(RoleTypeEnum.ADMIN);
  }

  static lawyer(): RoleType {
    return new RoleType(RoleTypeEnum.LAWYER);
  }

  static paralegal(): RoleType {
    return new RoleType(RoleTypeEnum.PARALEGAL);
  }

  static client(): RoleType {
    return new RoleType(RoleTypeEnum.CLIENT);
  }

  static guest(): RoleType {
    return new RoleType(RoleTypeEnum.GUEST);
  }

  /**
   * Check if this role is higher in hierarchy than another
   * Hierarchy: SUPER_ADMIN > ADMIN > LAWYER > PARALEGAL > CLIENT > GUEST
   */
  higherThan(other: RoleType): boolean {
    const hierarchy = [
      RoleTypeEnum.GUEST,
      RoleTypeEnum.CLIENT,
      RoleTypeEnum.PARALEGAL,
      RoleTypeEnum.LAWYER,
      RoleTypeEnum.ADMIN,
      RoleTypeEnum.SUPER_ADMIN,
    ];

    const thisIndex = hierarchy.indexOf(this.value);
    const otherIndex = hierarchy.indexOf(other.value);

    return thisIndex > otherIndex;
  }

  /**
   * Check if this role inherits permissions from another role
   */
  inheritsFrom(other: RoleType): boolean {
    return this.higherThan(other);
  }

  /**
   * Get the level of this role in the hierarchy
   */
  getLevel(): number {
    const levels: Record<RoleTypeEnum, number> = {
      [RoleTypeEnum.GUEST]: 0,
      [RoleTypeEnum.CLIENT]: 1,
      [RoleTypeEnum.PARALEGAL]: 2,
      [RoleTypeEnum.LAWYER]: 3,
      [RoleTypeEnum.ADMIN]: 4,
      [RoleTypeEnum.SUPER_ADMIN]: 5,
    };

    return levels[this.value];
  }

  /**
   * Check if this is an admin role
   */
  isAdmin(): boolean {
    return [RoleTypeEnum.ADMIN, RoleTypeEnum.SUPER_ADMIN].includes(this.value);
  }

  /**
   * Check if this is a legal professional role
   */
  isLegalProfessional(): boolean {
    return [RoleTypeEnum.LAWYER, RoleTypeEnum.PARALEGAL].includes(this.value);
  }

  /**
   * Check if this is a client role
   */
  isClient(): boolean {
    return [RoleTypeEnum.CLIENT, RoleTypeEnum.GUEST].includes(this.value);
  }
}
