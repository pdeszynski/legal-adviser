import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import GraphQLJSON from 'graphql-type-json';

export enum TemplateCategory {
  LAWSUIT = 'LAWSUIT',
  COMPLAINT = 'COMPLAINT',
  CONTRACT = 'CONTRACT',
  MOTION = 'MOTION',
  LETTER = 'LETTER',
  OTHER = 'OTHER',
}

registerEnumType(TemplateCategory, {
  name: 'TemplateCategory',
  description: 'Category of legal document template',
});

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  required: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface ConditionalSection {
  id: string;
  condition: string;
  description?: string;
}

export interface PolishFormattingRules {
  dateFormat?: 'DD.MM.YYYY' | 'D MMMM YYYY';
  currencyFormat?: 'PLN' | 'EUR' | 'USD';
  addressFormat?: 'polish' | 'standard';
  numberFormat?: 'pl' | 'en';
  legalCitations?: boolean;
}

@ObjectType('DocumentTemplate')
@Entity('document_templates')
@Index(['category'])
@Index(['isActive'])
export class DocumentTemplate {
  @FilterableField(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @FilterableField()
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @FilterableField(() => TemplateCategory)
  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.OTHER,
  })
  category: TemplateCategory;

  @FilterableField({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field()
  @Column({ type: 'text' })
  content: string;

  @Field(() => GraphQLJSON)
  @Column({ type: 'jsonb', default: [] })
  variables: TemplateVariable[];

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  conditionalSections?: ConditionalSection[];

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  polishFormattingRules?: PolishFormattingRules;

  @FilterableField()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field()
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @FilterableField()
  @CreateDateColumn()
  createdAt: Date;

  @FilterableField()
  @UpdateDateColumn()
  updatedAt: Date;

  incrementUsageCount(): void {
    this.usageCount += 1;
  }

  isValidVariableName(name: string): boolean {
    return this.variables.some((v) => v.name === name);
  }

  getRequiredVariables(): TemplateVariable[] {
    return this.variables.filter((v) => v.required);
  }

  hasConditionalSections(): boolean {
    return (
      this.conditionalSections !== undefined &&
      this.conditionalSections !== null &&
      this.conditionalSections.length > 0
    );
  }
}
