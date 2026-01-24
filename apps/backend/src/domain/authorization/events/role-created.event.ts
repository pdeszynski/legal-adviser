import { DomainEvent } from '../../shared/base';

interface RoleCreatedPayload {
  roleId: string;
  name: string;
  type: string;
  permissions: string[];
  inheritsFrom?: string;
  createdAt: Date;
}

/**
 * Event raised when a new role is created
 */
export class RoleCreatedEvent extends DomainEvent {
  public readonly eventName = 'authorization.role.created';
  public readonly aggregateType = 'Role';

  constructor(private readonly payload: RoleCreatedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.roleId;
  }

  toPayload(): Record<string, unknown> {
    return {
      roleId: this.payload.roleId,
      name: this.payload.name,
      type: this.payload.type,
      permissions: this.payload.permissions,
      inheritsFrom: this.payload.inheritsFrom,
      createdAt: this.payload.createdAt.toISOString(),
    };
  }
}
