import {
  Inject,
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ForbiddenAccessException } from '../../auth/exceptions';
import { ChatAuditService } from '../services/chat-audit.service';

/**
 * Chat Session Ownership Guard
 *
 * Verifies that users can only access their own chat sessions.
 * Extracts user ID from JWT context and session ID from request parameters/args,
 * then queries the ChatSession entity to verify session.userId === context.user.id.
 *
 * Throws ForbiddenAccessException with explicit message if ownership check fails.
 * Logs unauthorized access attempts to audit logs.
 *
 * Usage:
 * @UseGuards(GqlAuthGuard, ChatSessionOwnershipGuard)
 * @Query(() => ChatSession)
 * async getChatSession(@Args('sessionId') sessionId: string) {
 *   // Guard ensures session belongs to authenticated user
 * }
 *
 * The guard expects the session ID to be provided in one of these ways:
 * 1. Via 'sessionId' argument in the args
 * 2. Via 'input.sessionId' or 'input.id' in the args
 * 3. Via 'id' argument
 */
@Injectable()
export class ChatSessionOwnershipGuard {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    private readonly auditService: ChatAuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const userId = req.user?.id;

    if (!userId) {
      // This should be caught by GqlAuthGuard first, but handle defensively
      throw new ForbiddenAccessException('User not authenticated');
    }

    // Extract session ID from arguments
    const sessionId = this.extractSessionId(ctx.getArgs());

    if (!sessionId) {
      // No session ID in arguments - this might be a list query
      // Allow access but let the service layer handle filtering
      return true;
    }

    // Verify ownership by querying the session
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      // Session doesn't exist - let the resolver handle the 404
      return true;
    }

    // Check ownership
    if (session.userId !== userId) {
      // Log unauthorized access attempt using audit service
      this.auditService.logUnauthorizedAccess(
        userId,
        sessionId,
        ctx.getHandler().name,
        this.extractIpAddress(ctx),
      );

      throw new ForbiddenAccessException(
        'You do not have permission to access this chat session',
      );
    }

    // Log successful session access for audit
    this.auditService.logSessionAccess(
      userId,
      sessionId,
      true,
      this.extractIpAddress(ctx),
    );

    return true;
  }

  /**
   * Extract client IP address from request
   */
  private extractIpAddress(ctx: GqlExecutionContext): string | undefined {
    const req = ctx.getContext().req;
    return req?.ip || req?.headers?.['x-forwarded-for'] as string | undefined;
  }

  /**
   * Extract session ID from resolver arguments
   */
  private extractSessionId(args: Record<string, unknown>): string | null {
    // Direct 'sessionId' argument
    if (args.sessionId && typeof args.sessionId === 'string') {
      return args.sessionId;
    }

    // Direct 'id' argument
    if (args.id && typeof args.id === 'string') {
      return args.id;
    }

    // Nested in 'input.sessionId' or 'input.id'
    if (args.input && typeof args.input === 'object') {
      const input = args.input as Record<string, unknown>;
      if (input.sessionId && typeof input.sessionId === 'string') {
        return input.sessionId;
      }
      if (input.id && typeof input.id === 'string') {
        return input.id;
      }
    }

    return null;
  }
}
