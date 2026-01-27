import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ValueTransformer,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * Value transformer for pgvector type
 * Converts between number[] in TypeScript and vector string format in PostgreSQL
 */
export class VectorTransformer implements ValueTransformer {
  to(value: number[]): string {
    // Convert number array to pgvector format: '[0.1,0.2,0.3]'
    return `[${value.join(',')}]`;
  }

  from(value: string): number[] {
    // Convert pgvector format to number array
    if (typeof value === 'string') {
      return value
        .slice(1, -1) // Remove brackets
        .split(',')
        .map((v) => parseFloat(v));
    }
    return value as unknown as number[];
  }
}

@Entity('document_embeddings')
@ObjectType('DocumentEmbedding')
export class DocumentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ name: 'document_id', type: 'uuid' })
  @Field()
  documentId: string;

  @Column({
    type: 'vector',
    transformer: new VectorTransformer(),
  })
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
