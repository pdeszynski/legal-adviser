import { AggregateRoot } from '../../shared/base';
import {
  RoleId,
  RoleType,
  RoleTypeEnum,
  Permission,
  PermissionTypeEnum,
  PermissionType,
  ResourceTypeEnum,
  ResourceType,
} from '../value-objects';

interface RoleProps {
  id: RoleId;
  name: string;
  description: string;
  type: RoleType;
  permissions: Permission[];
  inheritsFrom?: RoleType;
  isSystemRole: boolean;
}

/**
 * Role Aggregate Root
 *
 * Manages the lifecycle and business rules for roles in the Authorization bounded context.
 * Implements role hierarchy and permission inheritance following DDD principles.
 */
export class RoleAggregate extends AggregateRoot<string> {
  private _name: string;
  private _description: string;
  private _roleId: RoleId;
  private _type: RoleType;
  private _permissions: Permission[];
  private _inheritsFrom?: RoleType;
  private readonly _isSystemRole: boolean;

  private constructor(props: RoleProps) {
    super(props.id.toValue());
    this._name = props.name;
    this._description = props.description;
    this._roleId = props.id;
    this._type = props.type;
    this._permissions = [...props.permissions];
    this._inheritsFrom = props.inheritsFrom;
    this._isSystemRole = props.isSystemRole;
  }

  // Getters
  /** Role ID value object (contains the string UUID) */
  get roleId(): RoleId {
    return this._roleId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get type(): RoleType {
    return this._type;
  }

  get permissions(): readonly Permission[] {
    return this._permissions;
  }

  get inheritsFrom(): RoleType | undefined {
    return this._inheritsFrom;
  }

  get isSystemRole(): boolean {
    return this._isSystemRole;
  }

  // Factory methods for predefined system roles
  // System roles use dynamically generated IDs
  static createSuperAdmin(): RoleAggregate {
    return new RoleAggregate({
      id: RoleId.generate(),
      name: 'Super Administrator',
      description: 'Full system access with all permissions',
      type: RoleType.superAdmin(),
      permissions: [
        // User management
        Permission.create(PermissionTypeEnum.MANAGE, ResourceTypeEnum.USERS),
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.USER_SESSIONS,
        ),
        // Authorization
        Permission.create(PermissionTypeEnum.MANAGE, ResourceTypeEnum.ROLES),
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.PERMISSIONS,
        ),
        // Documents
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.DOCUMENTS,
        ),
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.DOCUMENT_TEMPLATES,
        ),
        // Queries and AI
        Permission.create(PermissionTypeEnum.MANAGE, ResourceTypeEnum.QUERIES),
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.AI_PROMPTS,
        ),
        // Rulings
        Permission.create(PermissionTypeEnum.MANAGE, ResourceTypeEnum.RULINGS),
        // Billing
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.SUBSCRIPTIONS,
        ),
        Permission.create(PermissionTypeEnum.MANAGE, ResourceTypeEnum.PAYMENTS),
        Permission.create(PermissionTypeEnum.MANAGE, ResourceTypeEnum.INVOICES),
        // Logs
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.AUDIT_LOGS),
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.SYSTEM_LOGS,
        ),
        // Settings
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.SYSTEM_SETTINGS,
        ),
        // Notifications
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.NOTIFICATIONS,
        ),
        // Analytics
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.ANALYTICS),
        // API keys
        Permission.create(PermissionTypeEnum.MANAGE, ResourceTypeEnum.API_KEYS),
        // Collaboration
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.COLLABORATION,
        ),
      ],
      isSystemRole: true,
    });
  }

  static createAdmin(): RoleAggregate {
    return new RoleAggregate({
      id: RoleId.generate(),
      name: 'Administrator',
      description: 'Administrative access with most permissions',
      type: RoleType.admin(),
      permissions: [
        // User management (read/write)
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.USERS),
        Permission.create(PermissionTypeEnum.WRITE, ResourceTypeEnum.USERS),
        // Documents
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.DOCUMENTS,
        ),
        Permission.create(
          PermissionTypeEnum.WRITE,
          ResourceTypeEnum.DOCUMENT_TEMPLATES,
        ),
        // Queries
        Permission.create(PermissionTypeEnum.MANAGE, ResourceTypeEnum.QUERIES),
        // Rulings
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.RULINGS),
        // Billing
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.SUBSCRIPTIONS,
        ),
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.PAYMENTS),
        // Logs
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.AUDIT_LOGS),
        // Settings (read only)
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.SYSTEM_SETTINGS,
        ),
        // Notifications
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.NOTIFICATIONS,
        ),
        // Analytics
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.ANALYTICS),
        // API keys
        Permission.create(PermissionTypeEnum.MANAGE, ResourceTypeEnum.API_KEYS),
        // Collaboration
        Permission.create(
          PermissionTypeEnum.MANAGE,
          ResourceTypeEnum.COLLABORATION,
        ),
      ],
      isSystemRole: true,
    });
  }

  static createLawyer(): RoleAggregate {
    return new RoleAggregate({
      id: RoleId.generate(),
      name: 'Lawyer',
      description:
        'Legal professional with document and query management access',
      type: RoleType.lawyer(),
      permissions: [
        // Documents
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.DOCUMENTS),
        Permission.create(PermissionTypeEnum.WRITE, ResourceTypeEnum.DOCUMENTS),
        Permission.create(
          PermissionTypeEnum.DELETE,
          ResourceTypeEnum.DOCUMENTS,
        ),
        // Document templates
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.DOCUMENT_TEMPLATES,
        ),
        Permission.create(
          PermissionTypeEnum.WRITE,
          ResourceTypeEnum.DOCUMENT_TEMPLATES,
        ),
        // Queries
        Permission.create(PermissionTypeEnum.EXECUTE, ResourceTypeEnum.QUERIES),
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.QUERIES),
        // Rulings
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.RULINGS),
        // Notifications
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.NOTIFICATIONS,
        ),
        // Analytics
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.ANALYTICS),
        // Collaboration
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.COLLABORATION,
        ),
        Permission.create(
          PermissionTypeEnum.WRITE,
          ResourceTypeEnum.COLLABORATION,
        ),
      ],
      isSystemRole: true,
    });
  }

  static createParalegal(): RoleAggregate {
    return new RoleAggregate({
      id: RoleId.generate(),
      name: 'Paralegal',
      description: 'Legal support with limited document access',
      type: RoleType.paralegal(),
      permissions: [
        // Documents (read and write only, no delete)
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.DOCUMENTS),
        Permission.create(PermissionTypeEnum.WRITE, ResourceTypeEnum.DOCUMENTS),
        // Document templates (read only)
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.DOCUMENT_TEMPLATES,
        ),
        // Queries (execute and read own)
        Permission.create(PermissionTypeEnum.EXECUTE, ResourceTypeEnum.QUERIES),
        // Rulings (read only)
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.RULINGS),
        // Notifications
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.NOTIFICATIONS,
        ),
        // Collaboration
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.COLLABORATION,
        ),
        Permission.create(
          PermissionTypeEnum.WRITE,
          ResourceTypeEnum.COLLABORATION,
        ),
      ],
      isSystemRole: true,
    });
  }

  static createClient(): RoleAggregate {
    return new RoleAggregate({
      id: RoleId.generate(),
      name: 'Client',
      description: 'Client with access to own documents and queries',
      type: RoleType.client(),
      permissions: [
        // Documents (read own, limited write)
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.DOCUMENTS),
        Permission.create(PermissionTypeEnum.WRITE, ResourceTypeEnum.DOCUMENTS),
        // Queries
        Permission.create(PermissionTypeEnum.EXECUTE, ResourceTypeEnum.QUERIES),
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.QUERIES),
        // Notifications
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.NOTIFICATIONS,
        ),
        // Collaboration (read own)
        Permission.create(
          PermissionTypeEnum.READ,
          ResourceTypeEnum.COLLABORATION,
        ),
      ],
      isSystemRole: true,
    });
  }

  static createGuest(): RoleAggregate {
    return new RoleAggregate({
      id: RoleId.generate(),
      name: 'Guest',
      description: 'Guest with very limited access',
      type: RoleType.guest(),
      permissions: [
        // Documents (public only)
        Permission.create(PermissionTypeEnum.READ, ResourceTypeEnum.DOCUMENTS),
      ],
      isSystemRole: true,
    });
  }

  /**
   * Create a custom role
   */
  static createCustom(
    name: string,
    description: string,
    type: RoleTypeEnum,
    permissions: Permission[],
    inheritsFrom?: RoleTypeEnum,
  ): RoleAggregate {
    if (name.trim().length === 0) {
      throw new Error('Role name cannot be empty');
    }

    if (permissions.length === 0) {
      throw new Error('Role must have at least one permission');
    }

    return new RoleAggregate({
      id: RoleId.generate(),
      name,
      description,
      type: RoleType.fromString(type),
      permissions,
      inheritsFrom: inheritsFrom
        ? RoleType.fromString(inheritsFrom)
        : undefined,
      isSystemRole: false,
    });
  }

  /**
   * Reconstitute from persistence (for loading from database)
   */
  static reconstitute(
    id: string,
    name: string,
    description: string,
    type: RoleTypeEnum | string,
    permissions: string[],
    inheritsFrom?: RoleTypeEnum | string,
    isSystemRole: boolean = false,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): RoleAggregate {
    const role = new RoleAggregate({
      id: RoleId.fromString(id),
      name,
      description,
      type: RoleType.fromString(type as RoleTypeEnum),
      permissions: permissions.map((p) => Permission.fromString(p)),
      inheritsFrom: inheritsFrom
        ? RoleType.fromString(inheritsFrom as RoleTypeEnum)
        : undefined,
      isSystemRole,
    });
    role._createdAt = createdAt;
    role._updatedAt = updatedAt;
    return role;
  }

  /**
   * Update role details
   */
  updateDetails(name: string, description: string): void {
    if (this._isSystemRole) {
      throw new Error('Cannot modify system role details');
    }

    if (name.trim().length === 0) {
      throw new Error('Role name cannot be empty');
    }

    this._name = name;
    this._description = description;
    this.incrementVersion();
  }

  /**
   * Add a permission to this role
   */
  addPermission(permission: Permission): void {
    if (this._isSystemRole) {
      throw new Error('Cannot modify system role permissions');
    }

    // Check if permission already exists
    if (this._permissions.some((p) => p.matches(permission))) {
      return;
    }

    this._permissions.push(permission);
    this.incrementVersion();
  }

  /**
   * Remove a permission from this role
   */
  removePermission(permission: Permission): void {
    if (this._isSystemRole) {
      throw new Error('Cannot modify system role permissions');
    }

    const index = this._permissions.findIndex((p) => p.matches(permission));
    if (index === -1) {
      return;
    }

    this._permissions.splice(index, 1);
    this.incrementVersion();
  }

  /**
   * Check if this role has a specific permission
   * Takes into account permission inheritance
   */
  hasPermission(permission: Permission): boolean {
    // Direct permission check
    if (
      this._permissions.some(
        (p) => p.matches(permission) || p.implies(permission),
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check if this role can perform an action on a resource
   */
  can(
    permissionType: PermissionTypeEnum | PermissionType,
    resource: ResourceTypeEnum | ResourceType,
  ): boolean {
    const permission = Permission.create(permissionType, resource);
    return this.hasPermission(permission);
  }

  /**
   * Set inheritance from another role type
   */
  setInheritance(inheritsFrom: RoleType): void {
    if (this._isSystemRole) {
      throw new Error('Cannot modify system role inheritance');
    }

    if (inheritsFrom.equals(this._type)) {
      throw new Error('Role cannot inherit from itself');
    }

    if (!inheritsFrom.higherThan(this._type)) {
      throw new Error('Can only inherit from higher role types');
    }

    this._inheritsFrom = inheritsFrom;
    this.incrementVersion();
  }

  /**
   * Get all permissions including inherited ones
   * This is used when combining with parent role permissions
   */
  getAllPermissions(): Permission[] {
    return [...this._permissions];
  }

  /**
   * Check if this is a system role that cannot be modified
   */
  canBeModified(): boolean {
    return !this._isSystemRole;
  }

  /**
   * Check if this is a system role that cannot be deleted
   */
  canBeDeleted(): boolean {
    return !this._isSystemRole;
  }

  /**
   * Convert permissions to string array for persistence
   */
  permissionsToStrings(): string[] {
    return this._permissions.map((p) => p.toString());
  }

  /**
   * Check if this role type is higher than another
   */
  higherThan(other: RoleAggregate): boolean {
    return this._type.higherThan(other._type);
  }
}
