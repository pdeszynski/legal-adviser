import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * ORM Entity for Legal Documents
 *
 * This is the persistence model used by TypeORM.
 * It maps directly to the database table structure.
 *
 * Note: This is separate from the Domain Aggregate to maintain
 * clean separation between persistence and domain concerns.
 */
@Entity('legal_documents_v2')
@Index(['ownerId', 'status'])
export class LegalDocumentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column('text', { default: '' })
  content!: string;

  @Column({ length: 50 })
  @Index()
  documentType!: string;

  @Column({ length: 50 })
  @Index()
  status!: string;

  @Column('uuid')
  @Index()
  ownerId!: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, unknown>;

  @Column('int', { default: 0 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
