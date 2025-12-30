import { BaseEvent } from '../base/base.event';
import { EVENT_PATTERNS } from '../base/event-patterns';

/**
 * User Created Event
 *
 * Emitted when a new user is created in the system.
 * Other modules can listen to this event to perform actions like:
 * - Sending welcome emails
 * - Creating default settings
 * - Logging user registration
 */
export class UserCreatedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.USER.CREATED;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly createdAt: Date = new Date(),
  ) {
    super();
  }

  protected getPayload(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
      createdAt: this.createdAt.toISOString(),
    };
  }
}

/**
 * User Updated Event
 *
 * Emitted when user information is updated.
 */
export class UserUpdatedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.USER.UPDATED;

  constructor(
    public readonly userId: string,
    public readonly updatedFields: string[],
  ) {
    super();
  }

  protected getPayload(): Record<string, any> {
    return {
      userId: this.userId,
      updatedFields: this.updatedFields,
    };
  }
}

/**
 * User Authenticated Event
 *
 * Emitted when a user successfully authenticates.
 */
export class UserAuthenticatedEvent extends BaseEvent {
  public readonly eventName = EVENT_PATTERNS.USER.AUTHENTICATED;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ipAddress?: string,
  ) {
    super();
  }

  protected getPayload(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
      ipAddress: this.ipAddress,
    };
  }
}
