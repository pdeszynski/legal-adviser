import { DomainEvent } from '../../shared/base';

export * from './chat-session.events';

/**
 * Chat Message Created Event
 *
 * Emitted when a new message is added to a chat session.
 */
export interface ChatMessageCreatedEvent {
  messageId: string;
  sessionId: string;
  role: string;
  sequenceOrder: number;
  timestamp: Date;
}

/**
 * Chat Message Updated Event
 *
 * Emitted when a message content or metadata is updated.
 */
export interface ChatMessageUpdatedEvent {
  messageId: string;
  sessionId: string;
  sequenceOrder: number;
  timestamp: Date;
}

/**
 * Chat Messages Deleted Event
 *
 * Emitted when messages are deleted (e.g., session deletion).
 */
export interface ChatMessagesDeletedEvent {
  sessionId: string;
  count: number;
  timestamp: Date;
}
