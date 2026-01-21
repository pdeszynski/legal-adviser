import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { LegalQuery } from './entities/legal-query.entity';
import {
  CreateLegalQueryInput,
  UpdateLegalQueryInput,
} from './dto/legal-query.dto';
import { QueriesService } from './services/queries.service';
import { QueriesResolver } from './queries.resolver';
import { AiClientModule } from '../../shared/ai-client/ai-client.module';

/**
 * Queries Module
 *
 * Handles legal Q&A conversations storage and management.
 * Part of User Story 2: AI-Powered Legal Q&A.
 *
 * Primary API: GraphQL (auto-generated CRUD) - per constitution
 *
 * Uses nestjs-query for auto-generated CRUD operations:
 * - legalQueries: Query all queries with filtering, sorting, paging
 * - legalQuery: Query single query by ID
 * - createOneLegalQuery: Create a new query
 * - updateOneLegalQuery: Update a query (add answer, citations)
 * - deleteOneLegalQuery: Delete a query
 *
 * This module stores Q&A conversation history including:
 * - User questions
 * - AI-generated answers (in Markdown)
 * - Citations with source references
 */
@Module({
  imports: [
    // TypeORM repository for custom service
    TypeOrmModule.forFeature([LegalQuery]),
    // AI Client Service for synchronous Q&A
    AiClientModule,
    // nestjs-query auto-generated CRUD resolvers
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([LegalQuery])],
      resolvers: [
        {
          DTOClass: LegalQuery,
          EntityClass: LegalQuery,
          CreateDTOClass: CreateLegalQueryInput,
          UpdateDTOClass: UpdateLegalQueryInput,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable standard read operations
            many: { name: 'legalQueries' },
            one: { name: 'legalQuery' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneLegalQuery' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation
            one: { name: 'updateOneLegalQuery' },
            many: { disabled: true },
          },
          delete: {
            // Enable delete mutation
            one: { name: 'deleteOneLegalQuery' },
            many: { disabled: true },
          },
        },
      ],
    }),
  ],
  providers: [
    // Custom service for business logic
    QueriesService,
    // Custom resolver with submitLegalQuery mutation
    QueriesResolver,
  ],
  exports: [QueriesService],
})
export class QueriesModule {}
