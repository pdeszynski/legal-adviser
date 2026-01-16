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
  Float,
} from '@nestjs/graphql';
import { UserSession } from '../../users/entities/user-session.entity';

/**
 * Analysis Status Enum
 *
 * Defines the processing status of a legal analysis:
 * - PENDING: Analysis has not yet started
 * - PROCESSING: Analysis is currently being processed by AI
 * - COMPLETED: Analysis completed successfully
 * - FAILED: Analysis failed due to an error
 */
export enum AnalysisStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Register enum with GraphQL
registerEnumType(AnalysisStatus, {
  name: 'AnalysisStatus',
  description: 'Status of the legal analysis process',
});

/**
 * Legal Ground Interface
 *
 * Represents a single identified legal ground with its confidence score
 */
export interface LegalGround {
  /** Name or title of the legal ground */
  name: string;
  /** Description of the legal ground */
  description: string;
  /** Confidence score from 0 to 1 */
  confidenceScore: number;
  /** Relevant legal articles or statutes */
  legalBasis?: string[];
  /** Additional notes or context */
  notes?: string;
}

/**
 * GraphQL Object Type for Legal Ground
 * Used by nestjs-query for field resolution
 */
@ObjectType('LegalGround')
export class LegalGroundType {
  @Field(() => String)
  name: string;

  @Field(() => String)
  description: string;

  @Field(() => Float)
  confidenceScore: number;

  @Field(() => [String], { nullable: true })
  legalBasis?: string[];

  @Field(() => String, { nullable: true })
  notes?: string;
}

/**
 * Related Document Link Interface
 *
 * Represents a link to a related legal document
 */
export interface RelatedDocumentLink {
  /** ID of the related document */
  documentId: string;
  /** Type of relationship (e.g., 'reference', 'precedent', 'related') */
  relationshipType: string;
  /** Relevance score from 0 to 1 */
  relevanceScore?: number;
  /** Brief description of the relationship */
  description?: string;
}

/**
 * GraphQL Object Type for Related Document Link
 * Used by nestjs-query for field resolution
 */
@ObjectType('RelatedDocumentLink')
export class RelatedDocumentLinkType {
  @Field(() => String)
  documentId: string;

  @Field(() => String)
  relationshipType: string;

  @Field(() => Float, { nullable: true })
  relevanceScore?: number;

  @Field(() => String, { nullable: true })
  description?: string;
}

/**
 * Analysis Metadata Interface
 *
 * Additional metadata about the analysis process
 */
export interface AnalysisMetadata {
  /** AI model used for analysis */
  modelUsed?: string;
  /** Processing time in milliseconds */
  processingTimeMs?: number;
  /** Version of the analysis algorithm */
  analysisVersion?: string;
  /** Any additional context */
  [key: string]: unknown;
}

/**
 * GraphQL Object Type for Analysis Metadata
 * Used by nestjs-query for field resolution
 */
@ObjectType('AnalysisMetadata')
export class AnalysisMetadataType {
  @Field(() => String, { nullable: true })
  modelUsed?: string;

  @Field(() => Float, { nullable: true })
  processingTimeMs?: number;

  @Field(() => String, { nullable: true })
  analysisVersion?: string;
}

/**
 * LegalAnalysis Entity
 *
 * Stores the results of AI-powered case classification and analysis.
 * Each analysis is associated with a user session and can reference
 * related legal documents.
 *
 * Aggregate Root: LegalAnalysis
 * Invariants:
 *   - An analysis cannot be marked COMPLETED without identified grounds
 *   - Input description is required for processing
 *   - Confidence scores must be between 0 and 1
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('legal_analyses')
@ObjectType('LegalAnalysis')
@QueryOptions({ enableTotalCount: true })
@Relation('session', () => UserSession)
@Index(['sessionId'])
@Index(['status'])
@Index(['createdAt'])
export class LegalAnalysis {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Session ID that owns this analysis
   */
  @Column({ type: 'uuid' })
  @FilterableField()
  sessionId: string;

  @ManyToOne(() => UserSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: UserSession;

  /**
   * Title or brief summary of the analysis
   */
  @Column({ type: 'varchar', length: 500 })
  @FilterableField()
  title: string;

  /**
   * Input description of the case to be analyzed
   * This is the text provided by the user describing their legal situation
   */
  @Column({ type: 'text' })
  @Field(() => String)
  inputDescription: string;

  /**
   * Current status of the analysis
   */
  @Column({
    type: 'enum',
    enum: AnalysisStatus,
    default: AnalysisStatus.PENDING,
  })
  @FilterableField(() => AnalysisStatus)
  status: AnalysisStatus;

  /**
   * Overall confidence score for the analysis (0 to 1)
   */
  @Column({ type: 'float', nullable: true })
  @Field(() => Float, { nullable: true })
  overallConfidenceScore: number | null;

  /**
   * List of identified legal grounds with their confidence scores
   * Stored as JSONB for flexible querying
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => [LegalGroundType], { nullable: true })
  identifiedGrounds: LegalGround[] | null;

  /**
   * Links to related legal documents
   * Stored as JSONB for flexible querying
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => [RelatedDocumentLinkType], { nullable: true })
  relatedDocumentLinks: RelatedDocumentLink[] | null;

  /**
   * AI-generated summary of the case classification
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  summary: string | null;

  /**
   * AI-generated recommendations based on the analysis
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  recommendations: string | null;

  /**
   * Error message if the analysis failed
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  errorMessage: string | null;

  /**
   * Metadata about the analysis process
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => AnalysisMetadataType, { nullable: true })
  metadata: AnalysisMetadata | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Check if the analysis can be marked as completed
   * Requires at least one identified ground
   */
  canComplete(): boolean {
    return this.identifiedGrounds !== null && this.identifiedGrounds.length > 0;
  }

  /**
   * Mark the analysis as completed
   * @throws Error if no grounds have been identified
   */
  markCompleted(): void {
    if (!this.canComplete()) {
      throw new Error('Cannot complete analysis without identified grounds');
    }
    this.status = AnalysisStatus.COMPLETED;
  }

  /**
   * Mark the analysis as processing
   */
  markProcessing(): void {
    this.status = AnalysisStatus.PROCESSING;
  }

  /**
   * Mark the analysis as failed
   * @param errorMessage - Description of the error
   */
  markFailed(errorMessage: string): void {
    this.status = AnalysisStatus.FAILED;
    this.errorMessage = errorMessage;
  }

  /**
   * Check if the analysis is completed
   */
  isCompleted(): boolean {
    return this.status === AnalysisStatus.COMPLETED;
  }

  /**
   * Check if the analysis is currently processing
   */
  isProcessing(): boolean {
    return this.status === AnalysisStatus.PROCESSING;
  }

  /**
   * Check if the analysis has failed
   */
  hasFailed(): boolean {
    return this.status === AnalysisStatus.FAILED;
  }

  /**
   * Check if the analysis is pending
   */
  isPending(): boolean {
    return this.status === AnalysisStatus.PENDING;
  }

  /**
   * Get the highest confidence ground (if any)
   */
  getHighestConfidenceGround(): LegalGround | null {
    if (!this.identifiedGrounds || this.identifiedGrounds.length === 0) {
      return null;
    }
    return this.identifiedGrounds.reduce((highest, current) =>
      current.confidenceScore > highest.confidenceScore ? current : highest,
    );
  }

  /**
   * Get grounds above a certain confidence threshold
   * @param threshold - Minimum confidence score (0 to 1)
   */
  getGroundsAboveThreshold(threshold: number): LegalGround[] {
    if (!this.identifiedGrounds) {
      return [];
    }
    return this.identifiedGrounds.filter(
      (ground) => ground.confidenceScore >= threshold,
    );
  }

  /**
   * Add a related document link
   * @param link - The document link to add
   */
  addRelatedDocumentLink(link: RelatedDocumentLink): void {
    if (!this.relatedDocumentLinks) {
      this.relatedDocumentLinks = [];
    }
    this.relatedDocumentLinks.push(link);
  }

  /**
   * Calculate the average confidence score across all identified grounds
   */
  getAverageConfidenceScore(): number | null {
    if (!this.identifiedGrounds || this.identifiedGrounds.length === 0) {
      return null;
    }
    const sum = this.identifiedGrounds.reduce(
      (acc, ground) => acc + ground.confidenceScore,
      0,
    );
    return sum / this.identifiedGrounds.length;
  }
}
