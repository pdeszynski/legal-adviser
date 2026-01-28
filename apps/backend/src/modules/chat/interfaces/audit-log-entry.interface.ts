/**
 * Audit Log Entry Interface
 *
 * Defines the structure for chat session audit log entries.
 * All chat operations are logged with user context for security auditing.
 */
export interface AuditLogEntry {
  /** User ID from JWT token */
  userId: string;

  /** Operation type (e.g., SESSION_ACCESS, MESSAGE_CREATE, AI_ASK) */
  operation: string;

  /** Session ID (optional for list operations) */
  sessionId?: string;

  /** Timestamp of the operation (defaults to now) */
  timestamp?: string;

  /** Whether the operation succeeded */
  success?: boolean;

  /** Client IP address */
  ipAddress?: string;

  /** Client user agent */
  userAgent?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Error message (if operation failed) */
  error?: string;

  /** Error code (if operation failed) */
  errorCode?: string;
}
