import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase, NotFoundError, BusinessRuleViolationError } from '../../common';
import { FailQueryDto, LegalQueryDto } from '../dto';
import type { ILegalQueryRepository } from '../../../domain/ai-operations/repositories';

/**
 * Use Case: Mark a legal query as failed
 *
 * This use case orchestrates marking a query as failed:
 * 1. Loads the query aggregate
 * 2. Calls the fail business method
 * 3. Persists the updated aggregate
 * 4. Publishes domain events
 */
@Injectable()
export class FailQueryUseCase implements IUseCase<FailQueryDto, LegalQueryDto> {
  constructor(
    @Inject('ILegalQueryRepository')
    private readonly queryRepository: ILegalQueryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: FailQueryDto): Promise<LegalQueryDto> {
    const query = await this.queryRepository.findById(request.queryId);

    if (!query) {
      throw new NotFoundError('LegalQuery', request.queryId);
    }

    // Call the domain method (business rules enforced in aggregate)
    try {
      query.fail(request.errorMessage, request.errorCode);
    } catch (error) {
      throw new BusinessRuleViolationError(
        error instanceof Error ? error.message : 'Cannot fail query',
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
      response: undefined,
      tokenUsage: undefined,
      errorMessage: query.errorMessage,
      metadata: query.metadata,
      createdAt: query.createdAt,
      updatedAt: query.updatedAt,
    };
  }
}
