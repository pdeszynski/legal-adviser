import { ValueObject } from '../../shared/base';
import { PermissionType, PermissionTypeEnum } from './permission-type.vo';
import { ResourceType, ResourceTypeEnum } from './resource-type.vo';

/**
 * Permission Value Object
 * Represents a granular permission: action + resource combination
 * Immutable and self-validating
 */
export class Permission extends ValueObject<{
  type: PermissionType;
  resource: ResourceType;
  condition?: string;
}> {
  private constructor(props: {
    type: PermissionType;
    resource: ResourceType;
    condition?: string;
  }) {
    super(props);
  }

  static create(
    type: PermissionTypeEnum | PermissionType,
    resource: ResourceTypeEnum | ResourceType,
    condition?: string,
  ): Permission {
    const permissionType =
      type instanceof PermissionType ? type : PermissionType.fromString(type);
    const resourceType =
      resource instanceof ResourceType
        ? resource
        : ResourceType.fromString(resource);

    return new Permission({
      type: permissionType,
      resource: resourceType,
      condition,
    });
  }

  // Helper factory methods for common permissions
  static manageUsers(): Permission {
    return new Permission({
      type: PermissionType.manage(),
      resource: ResourceType.users(),
    });
  }

  static readUsers(): Permission {
    return new Permission({
      type: PermissionType.read(),
      resource: ResourceType.users(),
    });
  }

  static manageRoles(): Permission {
    return new Permission({
      type: PermissionType.manage(),
      resource: ResourceType.roles(),
    });
  }

  static readDocuments(): Permission {
    return new Permission({
      type: PermissionType.read(),
      resource: ResourceType.documents(),
    });
  }

  static writeDocuments(): Permission {
    return new Permission({
      type: PermissionType.write(),
      resource: ResourceType.documents(),
    });
  }

  static deleteDocuments(): Permission {
    return new Permission({
      type: PermissionType.delete(),
      resource: ResourceType.documents(),
    });
  }

  static manageDocuments(): Permission {
    return new Permission({
      type: PermissionType.manage(),
      resource: ResourceType.documents(),
    });
  }

  static executeQueries(): Permission {
    return new Permission({
      type: PermissionType.execute(),
      resource: ResourceType.queries(),
    });
  }

  static readAuditLogs(): Permission {
    return new Permission({
      type: PermissionType.read(),
      resource: ResourceType.auditLogs(),
    });
  }

  static manageSystemSettings(): Permission {
    return new Permission({
      type: PermissionType.manage(),
      resource: ResourceType.systemSettings(),
    });
  }

  // Getters
  get type(): PermissionType {
    return this.props.type;
  }

  get resource(): ResourceType {
    return this.props.resource;
  }

  get condition(): string | undefined {
    return this.props.condition;
  }

  /**
   * Check if this permission implies another permission
   * For example, MANAGE implies READ, WRITE, DELETE
   */
  implies(other: Permission): boolean {
    return (
      this.props.resource.toValue() === other.props.resource.toValue() &&
      this.props.type.implies(other.props.type)
    );
  }

  /**
   * Check if this permission matches another permission
   */
  matches(other: Permission): boolean {
    return (
      this.props.resource.equals(other.props.resource) &&
      this.props.type.equals(other.props.type)
    );
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    const condition = this.props.condition ? `:${this.props.condition}` : '';
    return `${this.props.type.toValue()}:${this.props.resource.toValue()}${condition}`;
  }

  /**
   * Parse permission from string format "type:resource:condition"
   */
  static fromString(permissionStr: string): Permission {
    const parts = permissionStr.split(':');
    if (parts.length < 2) {
      throw new Error(`Invalid permission format: ${permissionStr}`);
    }

    const [typeStr, resourceStr, condition] = parts;

    return new Permission({
      type: PermissionType.fromString(typeStr),
      resource: ResourceType.fromString(resourceStr),
      condition,
    });
  }

  /**
   * Create wildcard permission for a resource (all actions)
   */
  static wildcard(resource: ResourceTypeEnum | ResourceType): Permission {
    return new Permission({
      type: PermissionType.manage(),
      resource:
        resource instanceof ResourceType
          ? resource
          : ResourceType.fromString(resource),
    });
  }
}
