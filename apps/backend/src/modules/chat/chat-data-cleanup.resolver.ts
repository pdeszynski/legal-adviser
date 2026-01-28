import { Resolver, Query, Mutation, Args, Context, ID, Info } from '@nestjs/graphql';
import type { GraphQLResolveInfo } from 'graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ChatDataCleanupService } from './services/chat-data-cleanup.service';
import {
  EmptyMessagesSummary,
  CleanupEmptyMessagesResult,
  AffectedUsersReport,
  EmptyMessageAnalysis,
  CleanupEmptyMessagesInput,
} from './dto/chat-data-cleanup.dto';

/**
 * Admin Resolver for Chat Data Cleanup
 *
 * Provides endpoints for analyzing and cleaning up empty assistant messages
 * that were saved due to streaming response bugs.
 *
 * All endpoints require admin authentication.
 *
 * Usage:
 * 1. First run analyzeEmptyMessages to see what needs to be cleaned up
 * 2. Review the results and generate affected users report
 * 3. Run cleanupEmptyMessages with execute=false for dry run
 * 4. Once satisfied, run cleanupEmptyMessages with execute=true
 */
@Resolver()
@UseGuards(GqlAuthGuard, AdminGuard)
export class ChatDataCleanupResolver {
  constructor(
    private readonly chatDataCleanupService: ChatDataCleanupService,
  ) {}

  /**
   * Query: Analyze all empty assistant messages in the database
   *
   * Returns a comprehensive summary of empty messages including
   * recovery options and affected users/sessions.
   *
   * @returns Summary of empty messages found
   */
  @Query(() => EmptyMessagesSummary, {
    name: 'analyzeEmptyMessages',
    description: 'Analyze all empty assistant messages in the database',
  })
  async analyzeEmptyMessages(
    @Info() _info: GraphQLResolveInfo,
  ): Promise<EmptyMessagesSummary> {
    return this.chatDataCleanupService.analyzeEmptyMessages();
  }

  /**
   * Query: Get empty messages for a specific session
   *
   * Useful for debugging specific user reports.
   *
   * @param sessionId - The session ID to check
   * @returns List of empty messages in the session
   */
  @Query(() => [EmptyMessageAnalysis], {
    name: 'emptyMessagesForSession',
    description: 'Get empty assistant messages for a specific session',
  })
  async emptyMessagesForSession(
    @Args('sessionId', { type: () => ID }) sessionId: string,
  ): Promise<EmptyMessageAnalysis[]> {
    return this.chatDataCleanupService.getEmptyMessagesForSession(sessionId);
  }

  /**
   * Query: Get empty messages for a specific user
   *
   * Useful for debugging specific user reports.
   *
   * @param userId - The user ID to check
   * @returns List of empty messages for the user
   */
  @Query(() => [EmptyMessageAnalysis], {
    name: 'emptyMessagesForUser',
    description: 'Get empty assistant messages for a specific user',
  })
  async emptyMessagesForUser(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<EmptyMessageAnalysis[]> {
    return this.chatDataCleanupService.getEmptyMessagesForUser(userId);
  }

  /**
   * Query: Generate a report of affected users
   *
   * Aggregates affected users for potential notification about
   * the data quality issue and cleanup.
   *
   * @returns Report of affected users
   */
  @Query(() => AffectedUsersReport, {
    name: 'affectedUsersForEmptyMessages',
    description: 'Generate a report of users affected by empty messages',
  })
  async affectedUsersReport(
    @Info() _info: GraphQLResolveInfo,
  ): Promise<AffectedUsersReport> {
    return this.chatDataCleanupService.generateAffectedUsersReport();
  }

  /**
   * Mutation: Cleanup empty assistant messages
   *
   * Performs the actual cleanup operation. Use execute=false for dry run
   * to preview what will happen without making changes.
   *
   * @param input - Cleanup options
   * @returns Cleanup result with statistics
   */
  @Mutation(() => CleanupEmptyMessagesResult, {
    name: 'cleanupEmptyMessages',
    description: 'Cleanup empty assistant messages in the database',
  })
  async cleanupEmptyMessages(
    @Args('input') input: CleanupEmptyMessagesInput,
  ): Promise<CleanupEmptyMessagesResult> {
    return this.chatDataCleanupService.cleanupEmptyMessages(input);
  }
}
