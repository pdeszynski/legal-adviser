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
import { LegalDocument } from './legal-document.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Share Permission Enum
 *
 * Defines the level of access a user has to a shared document:
 * - VIEW: Can only view the document (read-only)
 * - COMMENT: Can view and add comments (future feature)
 * - EDIT: Can view and modify the document content
 * - ADMIN: Full control including sharing with others
 */
export enum SharePermission {
  VIEW = 'VIEW',
  COMMENT = 'COMMENT',
  EDIT = 'EDIT',
  ADMIN = 'ADMIN',
}

// Register enum with GraphQL
registerEnumType(SharePermission, {
  name: 'SharePermission',
  description: 'Permission level for document sharing',
});

/**
 * DocumentShare Entity
 *
 * Represents a sharing relationship between a document and a user.
 * Enables granular access control for legal documents.
 *
 * Business Rules:
 * - A document can be shared with multiple users
 * - A user can have different permissions for different documents
 * - Shares can have expiration dates
 * - Only document owner or users with ADMIN permission can share
 * - Expired shares are automatically invalid but kept for audit
 */
@Entity('document_shares')
@ObjectType('DocumentShare')
@QueryOptions({ enableTotalCount: true })
@Index('IDX_document_share_unique', ['documentId', 'sharedWithUserId'], {
  unique: true,
})
@Index('IDX_document_share_lookup', ['sharedWithUserId', 'documentId'])
@Relation('document', () => LegalDocument)
@Relation('sharedWithUser', () => User)
@Relation('sharedByUser', () => User)
export class DocumentShare {
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
  sharedWithUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sharedWithUserId' })
  sharedWithUser: User;

  @Column({ type: 'uuid' })
  @FilterableField()
  sharedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sharedByUserId' })
  sharedByUser: User;

  @Column({
    type: 'enum',
    enum: SharePermission,
    default: SharePermission.VIEW,
  })
  @FilterableField(() => SharePermission)
  permission: SharePermission;

  @Column({ type: 'timestamp', nullable: true })
  @FilterableField(() => GraphQLISODateTime, { nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Check if the share is currently active (not expired)
   */
  isActive(): boolean {
    if (!this.expiresAt) {
      return true; // No expiration = always active
    }
    return new Date() < this.expiresAt;
  }

  /**
   * Check if the share has expired
   */
  isExpired(): boolean {
    return !this.isActive();
  }

  /**
   * Check if the permission level allows editing
   */
  canEdit(): boolean {
    return (
      this.permission === SharePermission.EDIT ||
      this.permission === SharePermission.ADMIN
    );
  }

  /**
   * Check if the permission level allows sharing with others
   */
  canShare(): boolean {
    return this.permission === SharePermission.ADMIN;
  }

  /**
   * Check if the permission level allows viewing
   */
  canView(): boolean {
    return true; // All permission levels include view access
  }
}
