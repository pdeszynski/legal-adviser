import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@Entity('document_embeddings')
@ObjectType('DocumentEmbedding')
export class DocumentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ name: 'document_id', type: 'uuid' })
  @Field()
  documentId: string;

  @Column('jsonb')
  @Field(() => [Number])
  embedding: number[];

  @Column({ name: 'content_chunk', type: 'text' })
  @Field()
  contentChunk: string;

  @Column({ name: 'chunk_index', type: 'int' })
  @Field()
  chunkIndex: number;

  @Column({ name: 'chunk_size', type: 'int' })
  @Field()
  chunkSize: number;

  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  metadata?: string;

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;
}
