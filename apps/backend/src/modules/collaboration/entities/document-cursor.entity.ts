import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { FilterableField, IDField } from '@ptc-org/nestjs-query-graphql';

/**
 * Document Cursor Entity
 *
 * Tracks the current cursor/selection position of users editing a document.
 * Used for real-time collaboration to show where other users are editing.
 *
 * Aggregate Root: DocumentCursor (per document)
 * Invariants:
 *   - A user can only have one cursor per document
 *   - position must be >= 0
 *   - length must be >= 0
 */
@Entity('document_cursors')
@ObjectType('DocumentCursor')
@Index(['documentId'])
@Index(['userId'])
@Index(['updatedAt'])
export class DocumentCursor {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  @FilterableField()
  documentId: string;

  @Column({ type: 'uuid' })
  @FilterableField()
  userId: string;

  /**
   * Name of the user (displayed to other collaborators)
   * Denormalized for performance - avoids joining with users table
   */
  @Column({ type: 'varchar', length: 255 })
  @Field(() => String)
  userName: string;

  /**
   * Color assigned to the user's cursor (hex format)
   * Used to differentiate between collaborators in the UI
   */
  @Column({ type: 'varchar', length: 7, nullable: true })
  @Field(() => String, { nullable: true })
  color: string | null;

  /**
   * Current cursor position in the document (character offset)
   * Represents the caret position in the contentRaw field
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Number)
  position: number;

  /**
   * Length of the selection (0 for cursor, > 0 for selection)
   * Represents the number of characters selected
   */
  @Column({ type: 'int', default: 0 })
  @Field(() => Number)
  selectionLength: number;

  /**
   * Whether the user is currently active
   * Inactive users' cursors are hidden after a timeout
   */
  @Column({ type: 'boolean', default: true })
  @Field(() => Boolean)
  isActive: boolean;

  /**
   * Last activity timestamp
   * Updated whenever the user moves their cursor or makes edits
   */
  @Column({ type: 'timestamp' })
  @Field(() => GraphQLISODateTime)
  lastActivityAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Field(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Lifecycle hook to validate cursor position before insert
   */
  @BeforeInsert()
  @BeforeUpdate()
  validatePosition(): void {
    if (this.position < 0) {
      throw new Error('Cursor position cannot be negative');
    }
    if (this.selectionLength < 0) {
      throw new Error('Selection length cannot be negative');
    }
  }

  /**
   * Update cursor position and mark as active
   */
  updatePosition(position: number, selectionLength: number = 0): void {
    this.position = position;
    this.selectionLength = selectionLength;
    this.isActive = true;
    this.lastActivityAt = new Date();
  }

  /**
   * Mark cursor as inactive (user left document)
   */
  markInactive(): void {
    this.isActive = false;
  }

  /**
   * Check if cursor is stale (no activity for 30 seconds)
   */
  isStale(timeoutSeconds: number = 30): boolean {
    const now = new Date();
    const diff = now.getTime() - this.lastActivityAt.getTime();
    return diff > timeoutSeconds * 1000;
  }
}
