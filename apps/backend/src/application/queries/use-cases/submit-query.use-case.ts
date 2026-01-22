import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { IUseCase } from '../../common';
import { SubmitQueryDto, SubmitQueryResultDto } from '../dto';
import { LegalQueryAggregate } from '../../../domain/ai-operations/aggregates';
import type { ILegalQueryRepository } from '../../../domain/ai-operations/repositories';

/**
 * Use Case: Submit a new legal query
 *
 * This use case orchestrates the submission of a new legal query:
 * 1. Creates the domain aggregate
 * 2. Persists the aggregate via repository
 * 3. Publishes domain events
 *
 * Note: Actual AI processing is handled by a separate processor/worker
 */
@Injectable()
export class SubmitQueryUseCase implements IUseCase<
  SubmitQueryDto,
  SubmitQueryResultDto
> {
  constructor(
    @Inject('ILegalQueryRepository')
    private readonly queryRepository: ILegalQueryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: SubmitQueryDto): Promise<SubmitQueryResultDto> {
    // Generate unique ID for the query
    const queryId = uuidv4();

    // Create the domain aggregate (business rules are enforced here)
    const query = LegalQueryAggregate.submit(
      queryId,
      request.userId,
      request.queryText,
      request.metadata,
    );

    // Persist the aggregate
    await this.queryRepository.save(query);

    // Publish domain events
    const domainEvents = query.clearDomainEvents();
    for (const event of domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }

    // Return result DTO
    return {
      id: query.id,
      userId: query.userId,
      queryText: query.queryText.toValue(),
      status: query.status.toValue(),
      createdAt: query.createdAt,
    };
  }
}
