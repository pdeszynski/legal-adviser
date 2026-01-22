import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { DocumentCursor } from './entities/document-cursor.entity';
import { CollaborationService } from './services/collaboration.service';
import { CollaborationGateway } from './gateways/collaboration.gateway';
import { CollaborationSubscriptionResolver } from './collaboration.resolver';
import { LegalDocument } from '../documents/entities/legal-document.entity';

/**
 * Collaboration Module
 *
 * Enables real-time collaborative editing for legal documents.
 *
 * Features:
 * - WebSocket gateway for real-time communication
 * - Operational Transformation for conflict resolution
 * - GraphQL subscriptions for live updates
 * - Cursor tracking to show where other users are editing
 *
 * Architecture:
 * - CollaborationGateway: WebSocket connections and event handling
 * - CollaborationService: Business logic and OT transformations
 * - DocumentCursor entity: Tracks user presence and cursor positions
 *
 * Integrations:
 * - DocumentsModule: Provides LegalDocument entity
 * - GraphQL Subscriptions: Real-time updates to frontend
 *
 * Scheduled Tasks:
 * - Cleanup stale cursors every 5 minutes
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentCursor, LegalDocument]),
    BullModule.registerQueue({
      name: 'collaboration-cleanup',
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [
    CollaborationService,
    CollaborationGateway,
    CollaborationSubscriptionResolver,
  ],
  exports: [CollaborationService, CollaborationGateway],
})
export class CollaborationModule {}
