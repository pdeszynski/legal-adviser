import { Injectable, Logger } from '@nestjs/common';
import { AuditLogEntry } from '../interfaces/audit-log-entry.interface';

/**
 * Chat Audit Service
 *
 * Provides centralized audit logging for all chat session operations.
 * Logs include user ID from JWT context for security auditing and compliance.
 *
 * Audit entries include:
 * - User ID (from JWT)
 * - Operation type
 * - Session ID (when applicable)
 * - Timestamp
 * - IP address
 * - Success/failure status
 * - Additional metadata
 *
 * In production, this would write to a dedicated audit log system
 * (e.g., Elasticsearch, CloudWatch, or a dedicated audit table).
 */
@Injectable()
export class ChatAuditService {
  private readonly logger = new Logger(ChatAuditService.name);

  /**
   * Log a chat operation for audit purposes
   *
   * @param entry The audit log entry
   */
  logOperation(entry: AuditLogEntry): void {
    const auditLog: Record<string, unknown> = {
      event: 'CHAT_OPERATION',
      timestamp: entry.timestamp || new Date().toISOString(),
      userId: entry.userId,
      operation: entry.operation,
      sessionId: entry.sessionId || null,
      success: entry.success ?? true,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      metadata: entry.metadata || {},
      severity: entry.success === false ? 'WARNING' : 'INFO',
    };

    // Add error details if operation failed
    if (!entry.success && entry.error) {
      auditLog.error = entry.error;
      auditLog.errorCode = entry.errorCode;
    }

    // Log with structured format for parsing
    if (entry.success === false) {
      this.logger.warn(
        `[AUDIT] Chat operation failed: ${JSON.stringify(auditLog)}`,
      );
    } else {
      this.logger.log(`[AUDIT] Chat operation: ${JSON.stringify(auditLog)}`);
    }
  }

  /**
   * Log a session access attempt (read operation)
   *
   * @param userId User ID from JWT
   * @param sessionId Session ID being accessed
   * @param success Whether access was granted
   * @param ipAddress Optional IP address
   */
  logSessionAccess(
    userId: string,
    sessionId: string,
    success: boolean,
    ipAddress?: string,
  ): void {
    this.logOperation({
      userId,
      operation: 'SESSION_ACCESS',
      sessionId,
      success,
      ipAddress,
      metadata: { accessType: 'READ' },
    });
  }

  /**
   * Log a session modification (write operation)
   *
   * @param userId User ID from JWT
   * @param operation Specific operation type
   * @param sessionId Session ID being modified
   * @param ipAddress Optional IP address
   * @param metadata Additional metadata
   */
  logSessionModification(
    userId: string,
    operation: string,
    sessionId: string,
    ipAddress?: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logOperation({
      userId,
      operation: `SESSION_${operation.toUpperCase()}`,
      sessionId,
      success: true,
      ipAddress,
      metadata,
    });
  }

  /**
   * Log unauthorized access attempt
   *
   * @param userId User ID from JWT
   * @param sessionId Session ID being accessed
   * @param operation Operation being attempted
   * @param ipAddress Optional IP address
   */
  logUnauthorizedAccess(
    userId: string,
    sessionId: string,
    operation: string,
    ipAddress?: string,
  ): void {
    this.logOperation({
      userId,
      operation: `UNAUTHORIZED_${operation.toUpperCase()}`,
      sessionId,
      success: false,
      ipAddress,
      metadata: { reason: 'Session ownership verification failed' },
      error: 'User does not have permission to access this chat session',
      errorCode: 'FORBIDDEN',
    });
  }

  /**
   * Log AI Engine request
   *
   * @param userId User ID from JWT
   * @param sessionId Session ID for the conversation
   * @param operation AI operation type
   * @param ipAddress Optional IP address
   * @param metadata Additional metadata (tokens, model, etc.)
   */
  logAIRequest(
    userId: string,
    sessionId: string,
    operation: string,
    ipAddress?: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logOperation({
      userId,
      operation: `AI_${operation.toUpperCase()}`,
      sessionId,
      success: true,
      ipAddress,
      metadata,
    });
  }

  /**
   * Log message creation
   *
   * @param userId User ID from JWT
   * @param sessionId Session ID
   * @param role Message role (USER/ASSISTANT)
   * @param ipAddress Optional IP address
   */
  logMessageCreation(
    userId: string,
    sessionId: string,
    role: string,
    ipAddress?: string,
  ): void {
    this.logOperation({
      userId,
      operation: 'MESSAGE_CREATE',
      sessionId,
      success: true,
      ipAddress,
      metadata: { messageRole: role },
    });
  }

  /**
   * Log search operation
   *
   * @param userId User ID from JWT
   * @param query Search query
   * @param resultCount Number of results returned
   * @param ipAddress Optional IP address
   */
  logSearch(
    userId: string,
    query: string,
    resultCount: number,
    ipAddress?: string,
  ): void {
    this.logOperation({
      userId,
      operation: 'SEARCH',
      success: true,
      ipAddress,
      metadata: {
        query,
        resultCount,
      },
    });
  }

  /**
   * Log session export
   *
   * @param userId User ID from JWT
   * @param sessionId Session ID
   * @param format Export format
   * @param ipAddress Optional IP address
   */
  logExport(
    userId: string,
    sessionId: string,
    format: string,
    ipAddress?: string,
  ): void {
    this.logOperation({
      userId,
      operation: 'SESSION_EXPORT',
      sessionId,
      success: true,
      ipAddress,
      metadata: { exportFormat: format },
    });
  }
}
