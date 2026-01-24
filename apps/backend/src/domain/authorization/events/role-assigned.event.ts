import { DomainEvent } from '../../shared/base';

interface RoleAssignedPayload {
  userId: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
  assignedAt: Date;
}

/**
 * Event raised when a role is assigned to a user
 */
export class RoleAssignedEvent extends DomainEvent {
  public readonly eventName = 'authorization.role.assigned';
  public readonly aggregateType = 'User';

  constructor(private readonly payload: RoleAssignedPayload) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.userId;
  }

  toPayload(): Record<string, unknown> {
    return {
      userId: this.payload.userId,
      roleId: this.payload.roleId,
      roleName: this.payload.roleName,
      assignedBy: this.payload.assignedBy,
      assignedAt: this.payload.assignedAt.toISOString(),
    };
  }
}
