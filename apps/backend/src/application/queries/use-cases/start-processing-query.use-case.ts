import { Injectable, Inject } from '@nestjs/common';
import {
  IUseCase,
  NotFoundError,
  BusinessRuleViolationError,
} from '../../common';
import { LegalQueryDto } from '../dto';
import type { ILegalQueryRepository } from '../../../domain/ai-operations/repositories';

/**
 * Input for starting query processing
 */
export interface StartProcessingQueryInput {
  readonly queryId: string;
}

/**
 * Use Case: Start processing a legal query
 *
 * This use case marks a query as being processed by the AI system.
 */
@Injectable()
export class StartProcessingQueryUseCase implements IUseCase<
  StartProcessingQueryInput,
  LegalQueryDto
> {
  constructor(
    @Inject('ILegalQueryRepository')
    private readonly queryRepository: ILegalQueryRepository,
  ) {}

  async execute(request: StartProcessingQueryInput): Promise<LegalQueryDto> {
    const query = await this.queryRepository.findById(request.queryId);

    if (!query) {
      throw new NotFoundError('LegalQuery', request.queryId);
    }

    // Call the domain method (business rules enforced in aggregate)
    try {
      query.startProcessing();
    } catch (error) {
      throw new BusinessRuleViolationError(
        error instanceof Error
          ? error.message
          : 'Cannot start processing query',
        { queryId: request.queryId },
      );
    }

    // Persist the updated aggregate
    await this.queryRepository.save(query);

    return {
      id: query.id,
      userId: query.userId,
      queryText: query.queryText.toValue(),
      status: query.status.toValue(),
      response: undefined,
      tokenUsage: undefined,
      errorMessage: undefined,
      metadata: query.metadata,
      createdAt: query.createdAt,
      updatedAt: query.updatedAt,
    };
  }
}
