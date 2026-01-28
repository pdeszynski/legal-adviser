import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatSessionsService } from './services/chat-sessions.service';
import { ChatMessagesService } from './services/chat-messages.service';
import { ChatExportService } from './services/chat-export.service';
import { ChatSearchService } from './services/chat-search.service';
import { ChatMigrationService } from './services/chat-migration.service';
import { TitleGenerationService } from './services/title-generation.service';
import { ChatAuditService } from './services/chat-audit.service';
import { ChatDataCleanupService } from './services/chat-data-cleanup.service';
import { ChatSessionsResolver } from './chat-sessions.resolver';
import { ChatMessagesResolver } from './chat-messages.resolver';
import { ChatMigrationResolver } from './chat-migration.resolver';
import { ChatDataCleanupResolver } from './chat-data-cleanup.resolver';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { ChatSessionRepository } from './repositories/chat-session.repository';
import {
  CreateChatSessionInput,
  UpdateChatSessionInput,
} from './dto/chat-session.dto';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';
import { ChatSessionOwnershipGuard } from './guards';
import { GqlAuthGuard } from '../auth/guards';
import { AiClientModule } from '../../shared/ai-client/ai-client.module';

/**
 * Chat Module
 *
 * Manages chat sessions and messages for the AI legal assistant.
 * Provides GraphQL resolvers for session management and real-time updates.
 *
 * Features:
 * - Chat session CRUD operations with soft delete
 * - Message storage within sessions
 * - Filtering by mode and search by title
 * - Full-text search across message content
 * - Pin/unpin functionality for favorite sessions
 * - Export sessions to PDF/Markdown/JSON
 * - Real-time subscriptions for session updates
 * - Auto-generated nestjs-query CRUD resolvers
 * - AI-powered title generation for new sessions
 * - localStorage to database migration
 * - Data cleanup for empty assistant messages
 * - Authorization guards to ensure users can only access their own sessions
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
    HttpModule,
    UserPreferencesModule,
    AiClientModule,
    // nestjs-query auto-generated CRUD resolvers for ChatSession
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([ChatSession])],
      resolvers: [
        {
          DTOClass: ChatSession,
          EntityClass: ChatSession,
          CreateDTOClass: CreateChatSessionInput,
          UpdateDTOClass: UpdateChatSessionInput,
          enableTotalCount: true,
          enableAggregate: true,
          guards: [GqlAuthGuard],
          read: {
            many: {
              name: 'chatSessionsList',
              // Disable ownership guard for list queries - service layer handles filtering
              guards: [GqlAuthGuard],
            },
            one: { name: 'chatSessionById' },
          },
          create: {
            one: {
              name: 'createOneChatSession',
              // Create operations don't need ownership guard (creates new session)
              guards: [GqlAuthGuard],
            },
            many: { disabled: true },
          },
          update: {
            one: { name: 'updateOneChatSession' },
            many: { disabled: true },
          },
          delete: {
            one: { name: 'deleteOneChatSession' },
            many: { disabled: true },
          },
        },
      ],
    }),
  ],
  providers: [
    ChatSessionsService,
    ChatMessagesService,
    ChatExportService,
    ChatSearchService,
    ChatMigrationService,
    TitleGenerationService,
    ChatAuditService,
    ChatDataCleanupService,
    ChatSessionsResolver,
    ChatMessagesResolver,
    ChatMigrationResolver,
    ChatDataCleanupResolver,
    ChatMessageRepository,
    ChatSessionRepository,
    ChatSessionOwnershipGuard,
  ],
  exports: [
    ChatSessionsService,
    ChatMessagesService,
    ChatExportService,
    ChatSearchService,
    ChatMigrationService,
    TitleGenerationService,
    ChatAuditService,
    ChatDataCleanupService,
    ChatMessageRepository,
    ChatSessionRepository,
    TypeOrmModule,
  ],
})
export class ChatModule {}
