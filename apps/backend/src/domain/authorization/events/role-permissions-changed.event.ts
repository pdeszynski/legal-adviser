import { DomainEvent } from '../../shared/base';

interface RolePermissionsChangedPayload {
  roleId: string;
  roleName: string;
  addedPermissions: string[];
  removedPermissions: string[];
  currentPermissions: string[];
  changedBy: string;
  changedAt: Date;
}

/**
 * Event raised when role permissions are modified
 */
export class RolePermissionsChangedEvent extends DomainEvent {
  public readonly eventName = 'authorization.role.permissions-changed';
  public readonly aggregateType = 'Role';

  constructor(private readonly payload: RolePermissionsChangedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.roleId;
  }

  toPayload(): Record<string, unknown> {
    return {
      roleId: this.payload.roleId,
      roleName: this.payload.roleName,
      addedPermissions: this.payload.addedPermissions,
      removedPermissions: this.payload.removedPermissions,
      currentPermissions: this.payload.currentPermissions,
      changedBy: this.payload.changedBy,
      changedAt: this.payload.changedAt.toISOString(),
    };
  }
}
