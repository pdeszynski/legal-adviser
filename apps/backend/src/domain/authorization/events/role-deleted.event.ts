import { DomainEvent } from '../../shared/base';

interface RoleDeletedPayload {
  roleId: string;
  name: string;
  deletedAt: Date;
}

/**
 * Event raised when a role is deleted
 */
export class RoleDeletedEvent extends DomainEvent {
  public readonly eventName = 'authorization.role.deleted';
  public readonly aggregateType = 'Role';

  constructor(private readonly payload: RoleDeletedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.roleId;
  }

  toPayload(): Record<string, unknown> {
    return {
      roleId: this.payload.roleId,
      name: this.payload.name,
      deletedAt: this.payload.deletedAt.toISOString(),
    };
  }
}
