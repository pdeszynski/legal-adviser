import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import {
  FilterableField,
  IDField,
  QueryOptions,
  Relation,
} from '@ptc-org/nestjs-query-graphql';
import { ObjectType, ID, Field, GraphQLISODateTime } from '@nestjs/graphql';
import { LegalDocument } from './legal-document.entity';
import { UserSession } from '../../users/entities/user-session.entity';

/**
 * DocumentVersion Entity
 *
 * Tracks revision history for legal documents, storing content snapshots
 * for audit trail and version control purposes.
 *
 * Part of Documents aggregate, follows Event Sourcing Lite pattern
 * with append-only storage for audit compliance.
 *
 * Invariants:
 *   - A version must always have content
 *   - Version numbers must be sequential and positive
 *   - Versions are immutable once created (append-only)
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('document_versions')
@ObjectType('DocumentVersion')
@QueryOptions({ enableTotalCount: true })
@Relation('document', () => LegalDocument)
@Relation('session', () => UserSession)
@Index(['documentId', 'versionNumber'], { unique: true })
@Index(['documentId', 'createdAt'])
export class DocumentVersion {
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
  sessionId: string;

  @ManyToOne(() => UserSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: UserSession;

  /**
   * Sequential version number for this document
   * Starts at 1 for the first version
   */
  @Column({ type: 'int' })
  @FilterableField()
  versionNumber: number;

  /**
   * Snapshot of the document content at this version
   * Stored as text (Markdown or structured text)
   */
  @Column({ type: 'text' })
  @Field(() => String)
  contentSnapshot: string;

  /**
   * Optional change description/commit message
   * Describes what changed in this version
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  changeDescription: string | null;

  /**
   * User ID who created this version
   * References the user from the session
   */
  @Column({ type: 'uuid', nullable: true })
  @FilterableField(() => String, { nullable: true })
  authorUserId: string | null;

  /**
   * Timestamp when this version was created
   * Automatically set on creation
   */
  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  /**
   * Check if the version has content
   */
  hasContent(): boolean {
    return this.contentSnapshot !== null && this.contentSnapshot.trim().length > 0;
  }

  /**
   * Check if this is the first version
   */
  isFirstVersion(): boolean {
    return this.versionNumber === 1;
  }

  /**
   * Validate version invariants
   * @throws Error if invariants are violated
   */
  validate(): void {
    if (!this.hasContent()) {
      throw new Error('Document version must have content');
    }
    if (this.versionNumber < 1) {
      throw new Error('Version number must be positive');
    }
  }
}
