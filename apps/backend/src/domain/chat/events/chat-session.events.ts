import { DomainEvent } from '../../shared/base';
import { ChatMode } from '../../../modules/chat/entities/chat-session.entity';

/**
 * Chat Session Created Event
 *
 * Emitted when a new chat session is created.
 */
export class ChatSessionCreatedEvent extends DomainEvent {
  readonly eventName = 'ChatSessionCreated';
  readonly aggregateType = 'ChatSession';

  constructor(
    private readonly payload: {
      sessionId: string;
      userId: string;
      mode: ChatMode;
      title: string | null;
      createdAt: Date;
    },
  ) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.sessionId;
  }

  toPayload(): Record<string, unknown> {
    return {
      sessionId: this.payload.sessionId,
      userId: this.payload.userId,
      mode: this.payload.mode,
      title: this.payload.title,
      createdAt: this.payload.createdAt.toISOString(),
    };
  }
}

/**
 * Chat Session Title Updated Event
 *
 * Emitted when a session title is updated.
 */
export class ChatSessionTitleUpdatedEvent extends DomainEvent {
  readonly eventName = 'ChatSessionTitleUpdated';
  readonly aggregateType = 'ChatSession';

  constructor(
    private readonly payload: {
      sessionId: string;
      userId: string;
      newTitle: string;
      updatedAt: Date;
    },
  ) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.sessionId;
  }

  toPayload(): Record<string, unknown> {
    return {
      sessionId: this.payload.sessionId,
      userId: this.payload.userId,
      newTitle: this.payload.newTitle,
      updatedAt: this.payload.updatedAt.toISOString(),
    };
  }
}

/**
 * Chat Session Pinned Event
 *
 * Emitted when a session is pinned or unpinned.
 */
export class ChatSessionPinnedEvent extends DomainEvent {
  readonly eventName = 'ChatSessionPinned';
  readonly aggregateType = 'ChatSession';

  constructor(
    private readonly payload: {
      sessionId: string;
      userId: string;
      isPinned: boolean;
      updatedAt: Date;
    },
  ) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.sessionId;
  }

  toPayload(): Record<string, unknown> {
    return {
      sessionId: this.payload.sessionId,
      userId: this.payload.userId,
      isPinned: this.payload.isPinned,
      updatedAt: this.payload.updatedAt.toISOString(),
    };
  }
}

/**
 * Chat Session Deleted Event
 *
 * Emitted when a session is soft deleted.
 */
export class ChatSessionDeletedEvent extends DomainEvent {
  readonly eventName = 'ChatSessionDeleted';
  readonly aggregateType = 'ChatSession';

  constructor(
    private readonly payload: {
      sessionId: string;
      userId: string;
      deletedAt: Date;
    },
  ) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.sessionId;
  }

  toPayload(): Record<string, unknown> {
    return {
      sessionId: this.payload.sessionId,
      userId: this.payload.userId,
      deletedAt: this.payload.deletedAt.toISOString(),
    };
  }
}

/**
 * Chat Session Restored Event
 *
 * Emitted when a soft deleted session is restored.
 */
export class ChatSessionRestoredEvent extends DomainEvent {
  readonly eventName = 'ChatSessionRestored';
  readonly aggregateType = 'ChatSession';

  constructor(
    private readonly payload: {
      sessionId: string;
      userId: string;
      restoredAt: Date;
    },
  ) {
    super(1);
  }

  get aggregateId(): string {
    return this.payload.sessionId;
  }

  toPayload(): Record<string, unknown> {
    return {
      sessionId: this.payload.sessionId,
      userId: this.payload.userId,
      restoredAt: this.payload.restoredAt.toISOString(),
    };
  }
}
