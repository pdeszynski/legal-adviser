/**
 * Base Event Class
 *
 * All domain events should extend this base class to ensure consistent structure
 * and metadata across the application.
 *
 * Event Naming Convention: `domain.entity.action`
 * Examples:
 * - user.created
 * - document.generated
 * - document.exported
 * - chat.query.submitted
 * - search.ruling.found
 */
export abstract class BaseEvent {
  /**
   * Timestamp when the event was created
   */
  public readonly timestamp: Date;

  /**
   * Unique identifier for this event instance
   */
  public readonly eventId: string;

  /**
   * Event name following the convention: domain.entity.action
   */
  public abstract readonly eventName: string;

  constructor() {
    this.timestamp = new Date();
    this.eventId = this.generateEventId();
  }

  /**
   * Generate a unique event ID
   * Format: timestamp-random
   */
  private generateEventId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }

  /**
   * Convert event to a plain object for logging/serialization
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      timestamp: this.timestamp.toISOString(),
      ...this.getPayload(),
    };
  }

  /**
   * Get the event-specific payload
   * Override this in child classes to include domain-specific data
   */
  protected getPayload(): Record<string, any> {
    return {};
  }
}
