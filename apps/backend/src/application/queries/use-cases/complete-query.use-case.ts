import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase, NotFoundError, BusinessRuleViolationError } from '../../common';
import { CompleteQueryDto, LegalQueryDto } from '../dto';
import type { ILegalQueryRepository } from '../../../domain/ai-operations/repositories';

/**
 * Use Case: Complete a legal query with AI response
 *
 * This use case orchestrates completing a query with the AI-generated response:
 * 1. Loads the query aggregate
 * 2. Calls the complete business method
 * 3. Persists the updated aggregate
 * 4. Publishes domain events
 */
@Injectable()
export class CompleteQueryUseCase
  implements IUseCase<CompleteQueryDto, LegalQueryDto>
{
  constructor(
    @Inject('ILegalQueryRepository')
    private readonly queryRepository: ILegalQueryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CompleteQueryDto): Promise<LegalQueryDto> {
    const query = await this.queryRepository.findById(request.queryId);

    if (!query) {
      throw new NotFoundError('LegalQuery', request.queryId);
    }

    // Call the domain method (business rules enforced in aggregate)
    try {
      query.complete(
        request.content,
        request.confidence,
        request.tokensUsed,
        request.modelUsed,
        request.processingTimeMs,
        request.citations,
      );
    } catch (error) {
      throw new BusinessRuleViolationError(
        error instanceof Error ? error.message : 'Cannot complete query',
        { queryId: request.queryId },
      );
    }

    // Persist the updated aggregate
    await this.queryRepository.save(query);

    // Publish domain events
    const domainEvents = query.clearDomainEvents();
    for (const event of domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }

    return {
      id: query.id,
      userId: query.userId,
      queryText: query.queryText.toValue(),
      status: query.status.toValue(),
      response: query.response
        ? {
            content: query.response.content,
            confidence: query.response.confidence,
            tokensUsed: query.response.tokensUsed,
            modelUsed: query.response.modelUsed,
            processingTimeMs: query.response.processingTimeMs,
            citations: query.response.citations,
          }
        : undefined,
      tokenUsage: query.tokenUsage
        ? {
            promptTokens: query.tokenUsage.promptTokens,
            completionTokens: query.tokenUsage.completionTokens,
            totalTokens: query.tokenUsage.totalTokens,
          }
        : undefined,
      errorMessage: undefined,
      metadata: query.metadata,
      createdAt: query.createdAt,
      updatedAt: query.updatedAt,
    };
  }
}
