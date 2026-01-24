import { SimpleValueObject } from '../../shared/base';

/**
 * Permission Types Enumeration
 * Defines the granular access control levels
 */
export enum PermissionTypeEnum {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  MANAGE = 'manage',
  EXECUTE = 'execute',
  APPROVE = 'approve',
}

/**
 * Permission Type Value Object
 * Represents a specific type of access permission
 */
export class PermissionType extends SimpleValueObject<PermissionTypeEnum> {
  protected validate(value: PermissionTypeEnum): void {
    if (!Object.values(PermissionTypeEnum).includes(value)) {
      throw new Error(`Invalid permission type: ${value}`);
    }
  }

  static create(type: PermissionTypeEnum): PermissionType {
    return new PermissionType(type);
  }

  static fromString(type: string): PermissionType {
    const enumValue = type as PermissionTypeEnum;
    if (!Object.values(PermissionTypeEnum).includes(enumValue)) {
      throw new Error(`Invalid permission type: ${type}`);
    }
    return new PermissionType(enumValue);
  }

  // Helper factory methods
  static read(): PermissionType {
    return new PermissionType(PermissionTypeEnum.READ);
  }

  static write(): PermissionType {
    return new PermissionType(PermissionTypeEnum.WRITE);
  }

  static delete(): PermissionType {
    return new PermissionType(PermissionTypeEnum.DELETE);
  }

  static manage(): PermissionType {
    return new PermissionType(PermissionTypeEnum.MANAGE);
  }

  static execute(): PermissionType {
    return new PermissionType(PermissionTypeEnum.EXECUTE);
  }

  static approve(): PermissionType {
    return new PermissionType(PermissionTypeEnum.APPROVE);
  }

  implies(other: PermissionType): boolean {
    const hierarchy: Record<PermissionTypeEnum, PermissionTypeEnum[]> = {
      [PermissionTypeEnum.MANAGE]: [
        PermissionTypeEnum.READ,
        PermissionTypeEnum.WRITE,
        PermissionTypeEnum.DELETE,
        PermissionTypeEnum.EXECUTE,
      ],
      [PermissionTypeEnum.DELETE]: [PermissionTypeEnum.READ],
      [PermissionTypeEnum.WRITE]: [PermissionTypeEnum.READ],
      [PermissionTypeEnum.APPROVE]: [
        PermissionTypeEnum.READ,
        PermissionTypeEnum.WRITE,
      ],
      [PermissionTypeEnum.READ]: [],
      [PermissionTypeEnum.EXECUTE]: [PermissionTypeEnum.READ],
    };

    return (
      this.value === other.value ||
      hierarchy[this.value]?.includes(other.value) ||
      false
    );
  }
}
