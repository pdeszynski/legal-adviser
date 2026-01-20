import { BaseEvent } from '../../../shared/events/base/base.event';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';
import { AuditActionType, AuditResourceType } from '../../../modules/audit-log/entities/audit-log.entity';

/**
 * Domain Event: Audit Log Created
 *
 * Emitted when a new audit log entry is successfully created.
 * Other modules can listen to this event for post-processing,
 * notifications, or analytics.
 */
export class AuditLogCreatedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.AUDIT_LOG.CREATED;

  constructor(
    public readonly auditLogId: string,
    public readonly action: AuditActionType,
    public readonly resourceType: AuditResourceType,
    public readonly resourceId: string | null,
    public readonly userId: string | null,
    public readonly createdAt: Date,
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      auditLogId: this.auditLogId,
      action: this.action,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      userId: this.userId,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
