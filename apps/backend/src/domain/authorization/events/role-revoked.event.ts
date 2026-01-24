import { DomainEvent } from '../../shared/base';

interface RoleRevokedPayload {
  userId: string;
  roleId: string;
  roleName: string;
  revokedBy: string;
  revokedAt: Date;
  reason?: string;
}

/**
 * Event raised when a role is revoked from a user
 */
export class RoleRevokedEvent extends DomainEvent {
  public readonly eventName = 'authorization.role.revoked';
  public readonly aggregateType = 'User';

  constructor(private readonly payload: RoleRevokedPayload) {
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
      revokedBy: this.payload.revokedBy,
      revokedAt: this.payload.revokedAt.toISOString(),
      reason: this.payload.reason,
    };
  }
}
