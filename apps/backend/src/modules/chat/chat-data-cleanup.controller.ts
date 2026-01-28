import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatDataCleanupService } from './services/chat-data-cleanup.service';
import { EmptySessionAnalysis } from './dto/chat-data-cleanup.dto';
import { UserRole } from '../auth/enums/user-role.enum';

/**
 * Request with user from JWT
 */
interface RequestWithUser extends Request {
  user?: {
    id: string;
    roles?: string[];
    role?: string;
  };
}

/**
 * Admin REST Controller for Chat Data Cleanup
 *
 * Provides REST endpoints for admin access to empty session data.
 * Complements the GraphQL resolvers with REST endpoints for debugging.
 *
 * All endpoints require admin authentication via JWT Bearer token.
 *
 * Usage:
 * ```
 * curl -H "Authorization: Bearer <token>" \
 *   http://localhost:3001/api/admin/debug/empty-sessions
 * ```
 */
@Controller('api/admin/debug')
@UseGuards(AuthGuard('jwt'))
export class ChatDataCleanupController {
  constructor(
    private readonly chatDataCleanupService: ChatDataCleanupService,
  ) {}

  /**
   * Extract and validate user from request
   */
  private validateAdmin(request: RequestWithUser): void {
    const user = request.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userRoles = user.roles ?? (user.role ? [user.role] : []);
    if (!userRoles.includes(UserRole.ADMIN)) {
      throw new Error('Admin access required');
    }
  }

  /**
   * GET /api/admin/debug/empty-sessions
   *
   * Preview endpoint to see what empty sessions would be deleted.
   * Useful for auditing before running cleanup.
   *
   * @returns List of empty sessions with metadata
   */
  @Get('empty-sessions')
  @HttpCode(HttpStatus.OK)
  async getEmptySessions(@Req() request: RequestWithUser): Promise<{
    count: number;
    sessions: EmptySessionAnalysis[];
  }> {
    this.validateAdmin(request);

    const sessions = await this.chatDataCleanupService.findEmptySessions();

    return {
      count: sessions.length,
      sessions,
    };
  }

  /**
   * GET /api/admin/debug/empty-sessions-stats
   *
   * Get detailed statistics about empty sessions without performing cleanup.
   * Includes user impact and creation date distribution.
   *
   * @returns Statistics about empty sessions
   */
  @Get('empty-sessions-stats')
  @HttpCode(HttpStatus.OK)
  async getEmptySessionsStats(@Req() request: RequestWithUser): Promise<{
    totalEmptySessions: number;
    affectedUsers: number;
    oldestSession: Date | null;
    newestSession: Date | null;
    sessionsByUser: Record<string, number>;
    sessionsByMode: Record<string, number>;
  }> {
    this.validateAdmin(request);

    const sessions = await this.chatDataCleanupService.findEmptySessions();
    const uniqueUsers = new Set(sessions.map((s) => s.userId));

    const sessionsByUser: Record<string, number> = {};
    const sessionsByMode: Record<string, number> = {};

    for (const session of sessions) {
      sessionsByUser[session.userId] =
        (sessionsByUser[session.userId] || 0) + 1;
      sessionsByMode[session.mode] = (sessionsByMode[session.mode] || 0) + 1;
    }

    const createdAtDates = sessions.map((s) => s.createdAt);
    const oldestSession =
      createdAtDates.length > 0
        ? new Date(Math.min(...createdAtDates.map((d) => d.getTime())))
        : null;
    const newestSession =
      createdAtDates.length > 0
        ? new Date(Math.max(...createdAtDates.map((d) => d.getTime())))
        : null;

    return {
      totalEmptySessions: sessions.length,
      affectedUsers: uniqueUsers.size,
      oldestSession,
      newestSession,
      sessionsByUser,
      sessionsByMode,
    };
  }

  /**
   * POST /api/admin/debug/cleanup-empty-sessions
   *
   * Perform cleanup of empty sessions.
   * Use execute=false for dry run to preview without making changes.
   *
   * Body: { "execute": false }
   *
   * @returns Cleanup result with statistics
   */
  @Post('cleanup-empty-sessions')
  @HttpCode(HttpStatus.OK)
  async cleanupEmptySessions(
    @Req() request: RequestWithUser,
    @Body() body: { execute?: boolean },
  ): Promise<{
    totalEmptySessions: number;
    deletedSessions: number;
    skippedSessions: number;
    affectedUsers: number;
    sessionIds: string[];
    userIds: string[];
    errors: Array<{
      sessionId: string;
      error: string;
    }>;
  }> {
    this.validateAdmin(request);

    const execute = body.execute === true;

    const result =
      await this.chatDataCleanupService.deleteEmptySessionsBatched(execute);

    return result;
  }

  /**
   * GET /api/admin/debug/empty-sessions-count
   *
   * Quick endpoint to get current count of empty sessions.
   * Useful for monitoring dashboards.
   *
   * @returns Current count of empty sessions
   */
  @Get('empty-sessions-count')
  @HttpCode(HttpStatus.OK)
  async getEmptySessionsCount(@Req() request: RequestWithUser): Promise<{
    count: number;
    timestamp: string;
  }> {
    this.validateAdmin(request);

    const sessions = await this.chatDataCleanupService.findEmptySessions();

    return {
      count: sessions.length,
      timestamp: new Date().toISOString(),
    };
  }
}
