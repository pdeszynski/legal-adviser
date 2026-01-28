import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import {
  FilterableField,
  IDField,
  QueryOptions,
  Relation,
} from '@ptc-org/nestjs-query-graphql';
import {
  ObjectType,
  ID,
  Field,
  GraphQLISODateTime,
  registerEnumType,
} from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

/**
 * Chat Mode Enum
 *
 * Determines the AI response style for messages in the session.
 */
export enum ChatMode {
  /** Professional legal language with detailed citations */
  LAWYER = 'LAWYER',
  /** Simplified language for general public */
  SIMPLE = 'SIMPLE',
}

registerEnumType(ChatMode, {
  name: 'ChatMode',
  description: 'The AI response mode for chat messages',
});

/**
 * Citation Interface for Chat Messages
 *
 * Represents a single citation/reference in the AI response.
 */
export interface ChatCitation {
  /** Source of the citation (e.g., "Kodeks Cywilny", "Supreme Court") */
  source: string;
  /** Specific article or section reference */
  article?: string;
  /** URL to the source document (if available) */
  url?: string;
  /** Brief excerpt or description */
  excerpt?: string;
}

/**
 * GraphQL Object Type for Citation
 */
@ObjectType('ChatCitation')
export class ChatCitationType {
  @Field(() => String)
  source: string;

  @Field(() => String, { nullable: true })
  article?: string;

  @Field(() => String, { nullable: true })
  url?: string;

  @Field(() => String, { nullable: true })
  excerpt?: string;
}

/**
 * Chat Session Entity
 *
 * Represents a conversation session between a user and the AI assistant.
 * Groups related messages together for context preservation and history.
 *
 * Aggregate Root: ChatSession
 * Invariants:
 *   - A session must belong to a user
 *   - The title can be null initially (auto-generated from first message)
 *   - Soft delete preserves conversation history
 *   - messageCount is maintained for quick access
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 *
 * State Machine:
 *   - Active: Session is open for new messages
 *   - Archived: Session is read-only (soft deleted)
 */
@Entity('chat_sessions')
@ObjectType('ChatSession')
@QueryOptions({ enableTotalCount: true })
@Relation('user', () => User)
@Index(['userId'])
@Index(['lastMessageAt'])
@Index(['mode'])
@Index(['deletedAt'])
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the user who owns this session
   */
  @Column({ type: 'uuid' })
  @FilterableField(() => ID)
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Messages in this session
   * Cascade delete: when session is deleted, all messages are deleted
   */
  @OneToMany(() => ChatMessage, (message) => message.session, {
    onDelete: 'CASCADE',
  })
  messages: ChatMessage[];

  /**
   * Human-readable title for the session
   * Auto-generated from the first message if not provided
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @FilterableField(() => String, {
    nullable: true,
    description:
      'Session title, auto-generated from first message if not provided',
  })
  title: string | null;

  /**
   * AI response mode for this session
   */
  @Column({
    type: 'enum',
    enum: ChatMode,
    default: ChatMode.SIMPLE,
  })
  @FilterableField(() => ChatMode, {
    description: 'AI response mode for this session',
  })
  mode: ChatMode;

  /**
   * Timestamp of the last message in the session
   * Used for sorting sessions by recency
   */
  @Column({ type: 'timestamp', nullable: true })
  @FilterableField(() => GraphQLISODateTime, {
    nullable: true,
    description: 'Timestamp of the last message for sorting',
  })
  lastMessageAt: Date | null;

  /**
   * Number of messages in the session
   * Maintained for quick access without loading all messages
   */
  @Column({ type: 'int', default: 0 })
  @FilterableField(() => Number, {
    description: 'Number of messages in the session',
  })
  messageCount: number;

  /**
   * Whether the session is pinned by the user
   * Pinned sessions appear first in the list
   */
  @Column({ type: 'boolean', default: false })
  @FilterableField(() => Boolean, {
    description: 'Whether the session is pinned by the user',
  })
  isPinned: boolean;

  /**
   * Timestamp when the session was created
   */
  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  /**
   * Timestamp when the session was last updated
   */
  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Soft delete timestamp
   * Set when session is "deleted" - preserves conversation history
   */
  @Column({ type: 'timestamp', nullable: true })
  @FilterableField(() => GraphQLISODateTime, {
    nullable: true,
    description: 'Soft delete timestamp, null if not deleted',
  })
  deletedAt: Date | null;

  /**
   * Lifecycle hook to set lastMessageAt on creation
   */
  @BeforeInsert()
  initializeLastMessageAt(): void {
    if (!this.lastMessageAt) {
      this.lastMessageAt = new Date();
    }
  }

  /**
   * Check if the session is soft deleted
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * Soft delete the session
   */
  softDelete(): void {
    this.deletedAt = new Date();
  }

  /**
   * Restore a soft deleted session
   */
  restore(): void {
    this.deletedAt = null;
  }

  /**
   * Update the last message timestamp
   * Called when a new message is added
   */
  updateLastMessage(): void {
    this.lastMessageAt = new Date();
    this.messageCount += 1;
  }

  /**
   * Toggle pin status
   */
  togglePin(): void {
    this.isPinned = !this.isPinned;
  }

  /**
   * Set pin status
   */
  setPin(isPinned: boolean): void {
    this.isPinned = isPinned;
  }

  /**
   * Update the session title
   */
  updateTitle(title: string): void {
    this.title = title;
  }

  /**
   * Generate a title from the first message
   * Truncates to 50 characters if needed
   */
  generateTitleFromMessage(message: string): void {
    if (!this.title && message) {
      // Remove common prefixes
      let cleaned = message
        .replace(/^(hi|hello|hey|czesc|czesc')[,!\s]*/i, '')
        .trim();

      // Truncate to ~50 characters
      if (cleaned.length > 50) {
        cleaned = cleaned.substring(0, 47) + '...';
      }

      // Capitalize first letter
      this.title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }

  /**
   * Get a preview of the session (title + message count)
   */
  getPreview(): string {
    const title = this.title || 'Untitled Chat';
    return `${title} (${this.messageCount} messages)`;
  }
}
