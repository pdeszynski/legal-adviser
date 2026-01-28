import { AggregateRoot } from '../../shared/base';
import { ChatMode } from '../../../modules/chat/entities/chat-session.entity';
import {
  ChatSessionCreatedEvent,
  ChatSessionTitleUpdatedEvent,
  ChatSessionPinnedEvent,
  ChatSessionDeletedEvent,
} from '../events';

interface ChatSessionProps {
  title: string | null;
  mode: ChatMode;
  userId: string;
  messageCount: number;
  lastMessageAt: Date | null;
  isPinned: boolean;
}

/**
 * Chat Session Aggregate Root
 *
 * Manages the lifecycle and business rules for chat sessions.
 * A chat session groups related messages together for context preservation.
 */
export class ChatSessionAggregate extends AggregateRoot<string> {
  private _title: string | null;
  private _mode: ChatMode;
  private _userId: string;
  private _messageCount: number;
  private _lastMessageAt: Date | null;
  private _isPinned: boolean;
  private _deletedAt: Date | null;

  private constructor(id: string, props: ChatSessionProps) {
    super(id);
    this._title = props.title;
    this._mode = props.mode;
    this._userId = props.userId;
    this._messageCount = props.messageCount;
    this._lastMessageAt = props.lastMessageAt;
    this._isPinned = props.isPinned;
    this._deletedAt = null;
  }

  // Getters
  get title(): string | null {
    return this._title;
  }

  get mode(): ChatMode {
    return this._mode;
  }

  get userId(): string {
    return this._userId;
  }

  get messageCount(): number {
    return this._messageCount;
  }

  get lastMessageAt(): Date | null {
    return this._lastMessageAt;
  }

  get isPinned(): boolean {
    return this._isPinned;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  /**
   * Check if the session is soft deleted
   */
  isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  /**
   * Check if the session is active (not deleted)
   */
  isActive(): boolean {
    return this._deletedAt === null;
  }

  /**
   * Factory method to create a new chat session
   */
  static create(
    id: string,
    userId: string,
    mode: ChatMode,
    title?: string | null,
  ): ChatSessionAggregate {
    const session = new ChatSessionAggregate(id, {
      title: title ?? null,
      mode,
      userId,
      messageCount: 0,
      lastMessageAt: null,
      isPinned: false,
    });

    session.addDomainEvent(
      new ChatSessionCreatedEvent({
        sessionId: id,
        userId,
        mode,
        title: title ?? null,
        createdAt: session.createdAt,
      }),
    );

    return session;
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(
    id: string,
    userId: string,
    title: string | null,
    mode: ChatMode,
    messageCount: number,
    lastMessageAt: Date | null,
    isPinned: boolean,
    deletedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ): ChatSessionAggregate {
    const session = new ChatSessionAggregate(id, {
      title,
      mode,
      userId,
      messageCount,
      lastMessageAt,
      isPinned,
    });
    session._createdAt = createdAt;
    session._updatedAt = updatedAt;
    session._deletedAt = deletedAt;
    return session;
  }

  /**
   * Update the session title
   */
  updateTitle(newTitle: string): void {
    if (this._deletedAt !== null) {
      throw new Error('Cannot update title of a deleted session');
    }

    this._title = newTitle;
    this.incrementVersion();

    this.addDomainEvent(
      new ChatSessionTitleUpdatedEvent({
        sessionId: this.id,
        userId: this._userId,
        newTitle,
        updatedAt: this.updatedAt,
      }),
    );
  }

  /**
   * Auto-generate title from first message
   */
  generateTitleFromMessage(message: string): void {
    if (this._title || this._deletedAt !== null) {
      return; // Title already set or session deleted
    }

    // Remove common prefixes
    let cleaned = message
      .replace(/^(hi|hello|hey|czesc|czesc')[,!\s]*/i, '')
      .trim();

    // Truncate to ~50 characters
    if (cleaned.length > 50) {
      cleaned = cleaned.substring(0, 47) + '...';
    }

    // Capitalize first letter
    const title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

    this._title = title;
    this.touch();
  }

  /**
   * Update message count and last message timestamp
   * Called when a new message is added to the session
   */
  addMessage(): void {
    if (this._deletedAt !== null) {
      throw new Error('Cannot add message to a deleted session');
    }

    this._messageCount += 1;
    this._lastMessageAt = new Date();
    this.touch();
  }

  /**
   * Toggle pinned status
   */
  togglePin(): void {
    if (this._deletedAt !== null) {
      throw new Error('Cannot pin a deleted session');
    }

    this._isPinned = !this._isPinned;
    this.touch();

    this.addDomainEvent(
      new ChatSessionPinnedEvent({
        sessionId: this.id,
        userId: this._userId,
        isPinned: this._isPinned,
        updatedAt: this.updatedAt,
      }),
    );
  }

  /**
   * Set pinned status explicitly
   */
  setPin(isPinned: boolean): void {
    if (this._deletedAt !== null) {
      throw new Error('Cannot pin a deleted session');
    }

    if (this._isPinned !== isPinned) {
      this._isPinned = isPinned;
      this.touch();

      this.addDomainEvent(
        new ChatSessionPinnedEvent({
          sessionId: this.id,
          userId: this._userId,
          isPinned: this._isPinned,
          updatedAt: this.updatedAt,
        }),
      );
    }
  }

  /**
   * Soft delete the session
   * Preserves conversation history but marks as deleted
   */
  softDelete(): void {
    if (this._deletedAt !== null) {
      return; // Already deleted
    }

    this._deletedAt = new Date();
    this.incrementVersion();

    this.addDomainEvent(
      new ChatSessionDeletedEvent({
        sessionId: this.id,
        userId: this._userId,
        deletedAt: this._deletedAt,
      }),
    );
  }

  /**
   * Restore a soft deleted session
   */
  restore(): void {
    if (this._deletedAt === null) {
      return; // Not deleted
    }

    this._deletedAt = null;
    this.touch();
  }

  /**
   * Get a preview of the session
   */
  getPreview(): string {
    const title = this._title || 'Untitled Chat';
    return `${title} (${this._messageCount} messages)`;
  }
}
