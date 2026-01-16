import { Injectable, Inject } from '@nestjs/common';
import { IUseCase, NotFoundError, BusinessRuleViolationError } from '../../common';
import { LegalQueryDto } from '../dto';
import type { ILegalQueryRepository } from '../../../domain/ai-operations/repositories';

/**
 * Input for retrying a query
 */
export interface RetryQueryInput {
  readonly queryId: string;
}

/**
 * Use Case: Retry a failed legal query
 *
 * This use case orchestrates retrying a failed query by resetting its status.
 */
@Injectable()
export class RetryQueryUseCase
  implements IUseCase<RetryQueryInput, LegalQueryDto>
{
  constructor(
    @Inject('ILegalQueryRepository')
    private readonly queryRepository: ILegalQueryRepository,
  ) {}

  async execute(request: RetryQueryInput): Promise<LegalQueryDto> {
    const query = await this.queryRepository.findById(request.queryId);

    if (!query) {
      throw new NotFoundError('LegalQuery', request.queryId);
    }

    // Call the domain method (business rules enforced in aggregate)
    try {
      query.retry();
    } catch (error) {
      throw new BusinessRuleViolationError(
        error instanceof Error ? error.message : 'Cannot retry query',
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
