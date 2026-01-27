import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
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
  Float,
} from '@nestjs/graphql';
import { UserSession } from '../../users/entities/user-session.entity';

/**
 * Citation Interface
 *
 * Represents a single citation/reference in the AI response.
 * Used to provide sources for legal information.
 */
export interface Citation {
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
 * Used by nestjs-query for field resolution
 */
@ObjectType('Citation')
export class CitationType {
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
 * Clarification Question Interface
 *
 * Represents a single clarification question asked by the AI
 * when more information is needed from the user.
 */
export interface ClarificationQuestion {
  /** The question text */
  question: string;
  /** Type of information needed (e.g., 'timeline', 'documents', 'parties') */
  question_type: string;
  /** Optional predefined options for the user to choose from */
  options?: string[];
  /** Optional hint or example to help the user answer */
  hint?: string;
}

/**
 * GraphQL Object Type for Clarification Question
 */
@ObjectType('ClarificationQuestion')
export class ClarificationQuestionType {
  @Field(() => String)
  question: string;

  @Field(() => String)
  question_type: string;

  @Field(() => [String], { nullable: true })
  options?: string[];

  @Field(() => String, { nullable: true })
  hint?: string;
}

/**
 * Clarification Info Interface
 *
 * Contains information about needed clarifications
 */
export interface ClarificationInfo {
  /** Whether clarification is needed */
  needs_clarification: boolean;
  /** List of clarification questions */
  questions: ClarificationQuestion[];
  /** Summary of what we understand so far */
  context_summary: string;
  /** Explanation of what happens after clarification */
  next_steps: string;
}

/**
 * GraphQL Object Type for Clarification Info
 */
@ObjectType('ClarificationInfo')
export class ClarificationInfoType {
  @Field(() => Boolean)
  needs_clarification: boolean;

  @Field(() => [ClarificationQuestionType])
  questions: ClarificationQuestion[];

  @Field(() => String)
  context_summary: string;

  @Field(() => String)
  next_steps: string;
}

/**
 * LegalQuery Entity
 *
 * Stores Q&A conversations between users and the AI legal assistant.
 * Each query represents a single question-answer exchange with associated
 * citations and references.
 *
 * Aggregate Root: LegalQuery
 * Invariants:
 *   - A query must have a question text
 *   - The answerMarkdown may be null while generating
 *   - Citations are stored as structured JSON for rendering
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('legal_queries')
@ObjectType('LegalQuery')
@QueryOptions({ enableTotalCount: true })
@Relation('session', () => UserSession)
@Index(['sessionId'])
@Index(['createdAt'])
@Index('idx_legal_query_search', { synchronize: false }) // Full-text search index, created manually via migration/SQL
export class LegalQuery {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the user session that created this query
   * Can be null - will be auto-created from authenticated user if not provided
   */
  @Column({ type: 'uuid', nullable: true })
  @FilterableField(() => ID, { nullable: true })
  sessionId: string | null;

  @ManyToOne(() => UserSession, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session: UserSession | null;

  /**
   * The user's question/query text
   */
  @Column({ type: 'text' })
  @FilterableField()
  question: string;

  /**
   * The AI-generated answer in Markdown format
   * Nullable while the response is being generated
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  answerMarkdown: string | null;

  /**
   * List of citations/references used in the answer
   * Stored as JSONB for flexible querying and structured rendering
   */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  @Field(() => [CitationType], { nullable: true })
  citations: Citation[] | null;

  /**
   * Clarification information when more details are needed
   * Stored as JSONB for structured clarification questions
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => ClarificationInfoType, { nullable: true })
  clarificationInfo: ClarificationInfo | null;

  /**
   * Confidence score of the AI answer (0-1)
   */
  @Column({ type: 'float', nullable: true })
  @Field(() => Float, { nullable: true })
  confidence: number | null;

  /**
   * Query type classification (e.g., 'case_law', 'statute_interpretation')
   */
  @Column({ type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true })
  queryType: string | null;

  /**
   * Key legal terms extracted from the query
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => [String], { nullable: true })
  keyTerms: string[] | null;

  /**
   * Timestamp when the query was created
   */
  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  /**
   * Timestamp when the query was last updated
   */
  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * PostgreSQL tsvector column for full-text search
   * This column is automatically populated via trigger or application code
   * Searchable fields: question, answerMarkdown, citations
   * Note: This column is not exposed via GraphQL, it's internal for search queries
   */
  @Column({
    type: 'tsvector',
    nullable: true,
    select: false, // Don't select by default as it's internal
  })
  searchVector: string | null;

  /**
   * Lifecycle hook to prepare search content before insert/update
   * The actual tsvector is computed by PostgreSQL via raw query in the service
   */
  @BeforeInsert()
  @BeforeUpdate()
  prepareSearchContent(): void {
    // Search vector will be updated via raw SQL in the service
    // This hook is a placeholder for any pre-processing if needed
  }

  /**
   * Get searchable text content for full-text search indexing
   * Combines all searchable fields into a single text for tsvector creation
   */
  getSearchableContent(): string {
    const parts: string[] = [];

    // Add question
    if (this.question) {
      parts.push(this.question);
    }

    // Add answer
    if (this.answerMarkdown) {
      parts.push(this.answerMarkdown);
    }

    // Add citation sources
    if (this.citations) {
      this.citations.forEach((citation) => {
        if (citation.source) {
          parts.push(citation.source);
        }
        if (citation.article) {
          parts.push(citation.article);
        }
        if (citation.excerpt) {
          parts.push(citation.excerpt);
        }
      });
    }

    return parts.join(' ');
  }

  /**
   * Check if the query has been answered
   */
  hasAnswer(): boolean {
    return (
      this.answerMarkdown !== null && this.answerMarkdown.trim().length > 0
    );
  }

  /**
   * Check if the query has citations
   */
  hasCitations(): boolean {
    return this.citations !== null && this.citations.length > 0;
  }

  /**
   * Get the number of citations
   */
  getCitationCount(): number {
    return this.citations?.length ?? 0;
  }

  /**
   * Set the answer with optional citations
   */
  setAnswer(answer: string, citations?: Citation[]): void {
    this.answerMarkdown = answer;
    if (citations) {
      this.citations = citations;
    }
  }

  /**
   * Add a citation to the query
   */
  addCitation(citation: Citation): void {
    if (!this.citations) {
      this.citations = [];
    }
    this.citations.push(citation);
  }
}
