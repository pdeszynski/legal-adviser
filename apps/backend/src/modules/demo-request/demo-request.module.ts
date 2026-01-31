import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { DemoRequestService } from './demo-request.service';
import { DemoRequestResolver } from './demo-request.resolver';
import { DemoRequestsAdminResolver } from './demo-request-crud.resolver';
import { HubSpotModule } from '../integrations/hubspot/hubspot.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DemoRequest } from '../../infrastructure/persistence/entities/demo-request.entity';

/**
 * Demo Request Module
 *
 * Handles public demo request submissions and admin management.
 *
 * Features:
 * - Public GraphQL mutation for demo requests (no auth required)
 * - Admin queries for viewing all demo requests
 * - Admin mutations for updating status and scheduling demos
 * - Lead synchronization with HubSpot CRM
 * - Email notifications to internal sales team
 * - Rate limiting to prevent abuse
 * - Lead qualification scoring
 *
 * Environment Variables:
 * - DEMO_REQUEST_NOTIFICATION_EMAIL: Email address to send demo request notifications (default: sales@legal-ai.com)
 *
 * Dependencies:
 * - HubSpotModule: For CRM integration
 * - NotificationsModule: For email notifications
 */
@Module({
  imports: [
    ConfigModule,
    HubSpotModule,
    NotificationsModule,
    TypeOrmModule.forFeature([DemoRequest]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([DemoRequest])],
      resolvers: [
        {
          EntityClass: DemoRequest,
          DTOClass: DemoRequest,
          enableTotalCount: true,
          enableAggregate: true,
          guards: [],
          read: {
            many: { name: 'demoRequests' },
            one: { name: 'demoRequest' },
          },
          create: {
            one: { disabled: true },
            many: { disabled: true },
          },
          update: {
            one: { disabled: true },
            many: { disabled: true },
          },
          delete: {
            one: { disabled: true },
            many: { disabled: true },
          },
        },
      ],
    }),
  ],
  providers: [
    DemoRequestService,
    DemoRequestResolver,
    DemoRequestsAdminResolver,
  ],
  exports: [DemoRequestService],
})
export class DemoRequestModule {}
