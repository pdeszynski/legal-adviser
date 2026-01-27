import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { LegalQuery } from './entities/legal-query.entity';
import { ClarificationSession } from './entities/clarification-session.entity';
import {
  CreateLegalQueryInput,
  UpdateLegalQueryInput,
} from './dto/legal-query.dto';
import { QueriesService } from './services/queries.service';
import { ClarificationSessionsService } from './services/clarification-sessions.service';
import { QueriesResolver } from './queries.resolver';
import { ClarificationSessionsResolver } from './clarification-sessions.resolver';
import { AiClientModule } from '../../shared/ai-client/ai-client.module';
import { UsersModule } from '../users/users.module';
import { ScheduleModule } from '@nestjs/schedule';

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
 * - clarificationSessions: Query all clarification sessions with filtering, sorting, paging
 * - clarificationSession: Query single session by ID
 * - createOneClarificationSession: Create a new session
 * - updateOneClarificationSession: Update a session
 * - deleteOneClarificationSession: Delete a session
 *
 * This module stores:
 * - Q&A conversation history (questions, answers, citations)
 * - Multi-turn clarification flow state and context
 */
@Module({
  imports: [
    // TypeORM repositories for custom services
    TypeOrmModule.forFeature([LegalQuery, ClarificationSession]),
    // Users Module for session auto-creation
    UsersModule,
    // AI Client Service for synchronous Q&A
    AiClientModule,
    // Scheduler for cleanup tasks
    ScheduleModule.forRoot(),
    // nestjs-query auto-generated CRUD resolvers for LegalQuery
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
    // Custom services for business logic
    QueriesService,
    ClarificationSessionsService,
    // Custom resolvers with additional mutations
    QueriesResolver,
    ClarificationSessionsResolver,
  ],
  exports: [QueriesService, ClarificationSessionsService],
})
export class QueriesModule {}
