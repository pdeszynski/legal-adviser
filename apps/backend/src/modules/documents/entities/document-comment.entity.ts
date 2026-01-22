import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
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
import { LegalDocument } from './legal-document.entity';

/**
 * Comment Resolution Status Enum
 *
 * Defines the resolution status of a comment:
 * - OPEN: Comment is active and unresolved
 * - RESOLVED: Comment has been resolved/dismissed
 */
export enum CommentResolutionStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

// Register enum with GraphQL
registerEnumType(CommentResolutionStatus, {
  name: 'CommentResolutionStatus',
  description: 'Resolution status of a document comment',
});

/**
 * Comment Position/Anchor Interface
 *
 * Stores the location of an inline comment within a document:
 * - startOffset: Character offset where the comment anchor starts
 * - endOffset: Character offset where the comment anchor ends
 * - text: The actual text being commented on (optional, for context)
 * - section: Optional section identifier (e.g., paragraph number)
 */
export interface CommentPosition {
  /** Character offset where the comment anchor starts (0-based) */
  startOffset: number;
  /** Character offset where the comment anchor ends (0-based) */
  endOffset: number;
  /** The actual text being commented on (optional, for display context) */
  text?: string;
  /** Optional section identifier (e.g., "paragraph-1", "section-2") */
  section?: string;
}

/**
 * GraphQL Object Type for Comment Position
 * Used by nestjs-query for field resolution
 */
@ObjectType('CommentPosition')
export class CommentPositionType {
  @Field(() => Number)
  startOffset: number;

  @Field(() => Number)
  endOffset: number;

  @Field(() => String, { nullable: true })
  text?: string;

  @Field(() => String, { nullable: true })
  section?: string;
}

/**
 * DocumentComment Entity
 *
 * Represents an inline comment on a legal document.
 * Comments are tied to specific document sections via position anchors.
 *
 * Aggregate Root: DocumentComment (within Document collaboration context)
 * Invariants:
 *   - A comment must have both a document and an author
 *   - Comment text cannot be empty
 *   - Position must have valid offsets (endOffset >= startOffset)
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('document_comments')
@ObjectType('DocumentComment')
@QueryOptions({ enableTotalCount: true })
@Relation('document', () => LegalDocument)
@Relation('author', () => User)
@Index(['documentId'])
@Index(['authorId'])
@Index(['resolutionStatus'])
@Index(['createdAt'])
export class DocumentComment {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  @FilterableField()
  documentId: string;

  @ManyToOne(() => LegalDocument, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: LegalDocument;

  @Column({ type: 'uuid' })
  @FilterableField()
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  /**
   * The text content of the comment
   */
  @Column({ type: 'text' })
  @FilterableField()
  text: string;

  /**
   * Position/anchor information for inline comments
   * Stores where in the document the comment is attached
   */
  @Column({ type: 'jsonb' })
  @Field(() => CommentPositionType)
  position: CommentPosition;

  /**
   * Resolution status of the comment
   */
  @Column({
    type: 'enum',
    enum: CommentResolutionStatus,
    default: CommentResolutionStatus.OPEN,
  })
  @FilterableField(() => CommentResolutionStatus)
  resolutionStatus: CommentResolutionStatus;

  /**
   * Optional timestamp when the comment was resolved
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  resolvedAt: Date | null;

  /**
   * Optional ID of the user who resolved the comment
   */
  @Column({ type: 'uuid', nullable: true })
  @FilterableField(() => ID, { nullable: true })
  resolvedBy: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Check if the comment position is valid
   * Valid position has: endOffset >= startOffset, and both >= 0
   */
  hasValidPosition(): boolean {
    return (
      this.position.startOffset >= 0 &&
      this.position.endOffset >= this.position.startOffset
    );
  }

  /**
   * Check if the comment can be resolved
   * Only open comments can be resolved
   */
  canBeResolved(): boolean {
    return this.resolutionStatus === CommentResolutionStatus.OPEN;
  }

  /**
   * Check if the comment can be reopened
   * Only resolved comments can be reopened
   */
  canBeReopened(): boolean {
    return this.resolutionStatus === CommentResolutionStatus.RESOLVED;
  }

  /**
   * Mark the comment as resolved
   * @param resolvedByUserId ID of the user resolving the comment
   * @throws Error if comment is already resolved
   */
  markAsResolved(resolvedByUserId: string): void {
    if (!this.canBeResolved()) {
      throw new Error('Cannot resolve an already resolved comment');
    }
    this.resolutionStatus = CommentResolutionStatus.RESOLVED;
    this.resolvedAt = new Date();
    this.resolvedBy = resolvedByUserId;
  }

  /**
   * Reopen the comment
   * @throws Error if comment is not resolved
   */
  reopen(): void {
    if (!this.canBeReopened()) {
      throw new Error('Cannot reopen a comment that is not resolved');
    }
    this.resolutionStatus = CommentResolutionStatus.OPEN;
    this.resolvedAt = null;
    this.resolvedBy = null;
  }

  /**
   * Check if the comment is open (unresolved)
   */
  isOpen(): boolean {
    return this.resolutionStatus === CommentResolutionStatus.OPEN;
  }

  /**
   * Check if the comment is resolved
   */
  isResolved(): boolean {
    return this.resolutionStatus === CommentResolutionStatus.RESOLVED;
  }
}
