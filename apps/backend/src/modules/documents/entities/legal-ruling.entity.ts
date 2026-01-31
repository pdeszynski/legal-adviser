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
import {
  FilterableField,
  IDField,
  QueryOptions,
} from '@ptc-org/nestjs-query-graphql';
import {
  ObjectType,
  ID,
  Field,
  GraphQLISODateTime,
  registerEnumType,
} from '@nestjs/graphql';

/**
 * Court Type Enum
 *
 * Defines the type/level of court:
 * - SUPREME_COURT: Supreme Court (Sad Najwyzszy)
 * - APPELLATE_COURT: Appellate/Appeal Court (Sad Apelacyjny)
 * - REGIONAL_COURT: Regional Court (Sad Okregowy)
 * - DISTRICT_COURT: District Court (Sad Rejonowy)
 * - ADMINISTRATIVE_COURT: Administrative Court (Sad Administracyjny)
 * - CONSTITUTIONAL_TRIBUNAL: Constitutional Tribunal (Trybunal Konstytucyjny)
 * - OTHER: Other court types
 */
export enum CourtType {
  SUPREME_COURT = 'SUPREME_COURT',
  APPELLATE_COURT = 'APPELLATE_COURT',
  REGIONAL_COURT = 'REGIONAL_COURT',
  DISTRICT_COURT = 'DISTRICT_COURT',
  ADMINISTRATIVE_COURT = 'ADMINISTRATIVE_COURT',
  CONSTITUTIONAL_TRIBUNAL = 'CONSTITUTIONAL_TRIBUNAL',
  OTHER = 'OTHER',
}

// Register enum with GraphQL
registerEnumType(CourtType, {
  name: 'CourtType',
  description: 'Type/level of court that issued the ruling',
});

/**
 * Ruling Metadata Interface
 *
 * Additional metadata about the ruling
 * Extended to support full judgment details from SAOS
 */
export interface RulingMetadata {
  /** Legal area/domain (e.g., civil, criminal, administrative) */
  legalArea?: string;
  /** Related case numbers */
  relatedCases?: string[];
  /** Keywords/tags for searching */
  keywords?: string[];
  /** Source URL or database reference */
  sourceReference?: string;
  /** Division name (wydział) within the court */
  divisionName?: string;
  /** Full legal basis (podstawa prawna) for the judgment */
  legalBasis?: string[];
  /** Referenced regulations (przepisy) cited in the judgment */
  referencedRegulations?: Array<{
    raw: string;
    journalNo?: string;
    year?: number;
    position?: number;
    text?: string;
  }>;
  /** Parties to the proceedings (strony) */
  parties?: Array<{
    name: string;
    type: 'PERSON' | 'INSTITUTION' | 'UNKNOWN';
    role?: string;
  }>;
  /** Attorneys/representatives (pełnomocnicy) */
  attorneys?: Array<{
    name: string;
    role?: string;
    representedParty?: string;
  }>;
  /** Type of proceeding (typ postępowania) */
  proceedingType?: string;
  /** Judges who presided over the case */
  judges?: Array<{
    name: string;
    function?: string;
    specialRoles?: string[];
  }>;
  /** Referenced court cases */
  referencedCourtCases?: Array<{
    caseNumber: string;
    href?: string;
  }>;
  /** Additional context */
  [key: string]: unknown;
}

/**
 * GraphQL Object Type for Ruling Metadata
 * Used by nestjs-query for field resolution
 */
@ObjectType('RulingMetadata')
export class RulingMetadataType {
  @Field(() => String, { nullable: true })
  legalArea?: string;

  @Field(() => [String], { nullable: true })
  relatedCases?: string[];

  @Field(() => [String], { nullable: true })
  keywords?: string[];

  @Field(() => String, { nullable: true })
  sourceReference?: string;

  @Field(() => String, { nullable: true })
  divisionName?: string;

  @Field(() => [String], { nullable: true })
  legalBasis?: string[];

  @Field(() => [JudgesMetadataType], { nullable: true })
  judges?: Array<{
    name: string;
    function?: string;
    specialRoles?: string[];
  }>;

  @Field(() => String, { nullable: true })
  proceedingType?: string;
}

/**
 * GraphQL Object Type for Judges Metadata
 */
@ObjectType('JudgesMetadata')
export class JudgesMetadataType {
  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  function?: string;

  @Field(() => [String], { nullable: true })
  specialRoles?: string[];
}

/**
 * LegalRuling Entity
 *
 * Represents a legal ruling (case law / court decision) stored in the system.
 * Used for referencing precedents and supporting legal analysis.
 *
 * Aggregate Root: LegalRuling
 * Invariants:
 *   - A ruling must have a signature (case identifier)
 *   - A ruling must have a court name
 *   - Ruling date must be a valid date
 *   - The combination of courtName + signature + rulingDate must be unique
 *
 * Uniqueness Note:
 *   Signatures are unique within a single court, not nationwide.
 *   Different courts can issue judgments with identical signatures
 *   (e.g., 'I C 697/19' can appear in multiple regional courts).
 *   Therefore, the unique constraint uses a composite key: (courtName, signature, rulingDate).
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('legal_rulings')
@ObjectType('LegalRuling')
@QueryOptions({ enableTotalCount: true })
@Index(['courtName', 'signature', 'rulingDate'], { unique: true })
@Index(['courtName'])
@Index(['courtType'])
@Index(['rulingDate'])
@Index(['createdAt'])
@Index('idx_legal_ruling_search', { synchronize: false }) // Full-text search index, created manually via migration/SQL
export class LegalRuling {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Case signature/identifier (e.g., "III CZP 8/21")
   * This is the official court case reference number.
   *
   * Note: This field is NOT unique by itself. The uniqueness is guaranteed
   * by the composite index on (courtName, signature, rulingDate).
   */
  @Column({ type: 'varchar', length: 100 })
  @FilterableField()
  signature: string;

  /**
   * Date when the ruling was issued
   * Uses a transformer to convert date strings from PostgreSQL to proper Date objects
   */
  @Column({
    type: 'date',
    transformer: {
      to: (value: Date | string): string | null => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        return value.toISOString().split('T')[0];
      },
      from: (value: string | Date): Date | null => {
        if (!value) return null;
        if (value instanceof Date) return value;
        // Convert date string to Date object at midnight UTC
        return new Date(`${value}T00:00:00.000Z`);
      },
    },
  })
  @FilterableField(() => GraphQLISODateTime)
  rulingDate: Date;

  /**
   * Name of the court that issued the ruling
   * (e.g., "Sad Najwyzszy", "Sad Apelacyjny w Warszawie")
   */
  @Column({ type: 'varchar', length: 300 })
  @FilterableField()
  courtName: string;

  /**
   * Type/level of the court
   */
  @Column({
    type: 'enum',
    enum: CourtType,
    default: CourtType.OTHER,
  })
  @FilterableField(() => CourtType)
  courtType: CourtType;

  /**
   * Brief summary of the ruling (thesis/key points)
   * This is a concise description of the legal principle established
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  summary: string | null;

  /**
   * Full text of the ruling
   * Contains the complete court decision text
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  fullText: string | null;

  /**
   * Metadata containing additional information about the ruling
   * Stored as JSON (e.g., legal area, keywords, related cases)
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => RulingMetadataType, { nullable: true })
  metadata: RulingMetadata | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * PostgreSQL tsvector column for full-text search
   * This column is automatically populated via trigger or application code
   * Searchable fields: signature, courtName, summary, fullText, keywords from metadata
   * Note: This column is not exposed via GraphQL, it's internal for search queries
   */
  @Column({
    type: 'tsvector',
    nullable: true,
    select: false, // Don't select by default as it's internal
  })
  searchVector: string | null;

  /**
   * Lifecycle hook to prepare search content before insert
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
   *
   * Enhanced to include judges, parties, legal basis, and other details
   * for improved search relevance.
   */
  getSearchableContent(): string {
    const parts: string[] = [];

    // Add signature with highest weight (primary identifier)
    if (this.signature) {
      parts.push(this.signature);
    }

    // Add court name
    if (this.courtName) {
      parts.push(this.courtName);
    }

    // Add summary
    if (this.summary) {
      parts.push(this.summary);
    }

    // Add full text (most important content)
    if (this.fullText) {
      parts.push(this.fullText);
    }

    // Add keywords from metadata
    if (this.metadata?.keywords) {
      parts.push(...this.metadata.keywords);
    }

    // Add legal area from metadata
    if (this.metadata?.legalArea) {
      parts.push(this.metadata.legalArea);
    }

    // Add division name for more specific court context
    if (this.metadata?.divisionName) {
      parts.push(this.metadata.divisionName);
    }

    // Add judges' names for judge-specific searches
    if (this.metadata?.judges) {
      for (const judge of this.metadata.judges) {
        parts.push(judge.name);
      }
    }

    // Add legal basis for legal provision searches
    if (this.metadata?.legalBasis) {
      parts.push(...this.metadata.legalBasis);
    }

    // Add referenced regulations
    if (this.metadata?.referencedRegulations) {
      for (const reg of this.metadata.referencedRegulations) {
        parts.push(reg.raw);
        if (reg.text) {
          parts.push(reg.text);
        }
      }
    }

    // Add parties for case participant searches
    if (this.metadata?.parties) {
      for (const party of this.metadata.parties) {
        parts.push(party.name);
      }
    }

    // Add attorneys for legal representative searches
    if (this.metadata?.attorneys) {
      for (const attorney of this.metadata.attorneys) {
        parts.push(attorney.name);
      }
    }

    // Add proceeding type
    if (this.metadata?.proceedingType) {
      parts.push(this.metadata.proceedingType);
    }

    // Add related cases
    if (this.metadata?.relatedCases) {
      parts.push(...this.metadata.relatedCases);
    }

    // Add referenced court cases
    if (this.metadata?.referencedCourtCases) {
      for (const refCase of this.metadata.referencedCourtCases) {
        parts.push(refCase.caseNumber);
      }
    }

    return parts.join(' ');
  }

  /**
   * Check if the ruling has a summary
   */
  hasSummary(): boolean {
    return this.summary !== null && this.summary.trim().length > 0;
  }

  /**
   * Check if the ruling has full text
   */
  hasFullText(): boolean {
    return this.fullText !== null && this.fullText.trim().length > 0;
  }

  /**
   * Check if the ruling has complete content (both summary and full text)
   */
  isComplete(): boolean {
    return this.hasSummary() && this.hasFullText();
  }

  /**
   * Get the year of the ruling
   */
  getRulingYear(): number {
    return this.rulingDate.getFullYear();
  }

  /**
   * Check if the ruling is from a higher court (Supreme, Appellate, Constitutional)
   */
  isFromHigherCourt(): boolean {
    return [
      CourtType.SUPREME_COURT,
      CourtType.APPELLATE_COURT,
      CourtType.CONSTITUTIONAL_TRIBUNAL,
    ].includes(this.courtType);
  }

  /**
   * Get keywords from metadata
   */
  getKeywords(): string[] {
    return this.metadata?.keywords ?? [];
  }

  /**
   * Get the legal area from metadata
   */
  getLegalArea(): string | null {
    return this.metadata?.legalArea ?? null;
  }

  /**
   * Add a keyword to the metadata
   * @param keyword - The keyword to add
   */
  addKeyword(keyword: string): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    if (!this.metadata.keywords) {
      this.metadata.keywords = [];
    }
    if (!this.metadata.keywords.includes(keyword)) {
      this.metadata.keywords.push(keyword);
    }
  }

  /**
   * Add a related case to the metadata
   * @param caseNumber - The related case number
   */
  addRelatedCase(caseNumber: string): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    if (!this.metadata.relatedCases) {
      this.metadata.relatedCases = [];
    }
    if (!this.metadata.relatedCases.includes(caseNumber)) {
      this.metadata.relatedCases.push(caseNumber);
    }
  }
}
