import { Injectable, Inject } from '@nestjs/common';
import { IUseCaseNoInput } from '../../common';
import { LegalQuerySummaryDto } from '../dto';
import type { ILegalQueryRepository } from '../../../domain/ai-operations/repositories';

/**
 * Use Case: Get all pending queries
 *
 * This use case retrieves all queries that are waiting to be processed.
 * Used by the query processor to find work.
 */
@Injectable()
export class GetPendingQueriesUseCase implements IUseCaseNoInput<
  LegalQuerySummaryDto[]
> {
  constructor(
    @Inject('ILegalQueryRepository')
    private readonly queryRepository: ILegalQueryRepository,
  ) {}

  async execute(): Promise<LegalQuerySummaryDto[]> {
    const queries = await this.queryRepository.findPendingQueries();

    return queries.map((query) => ({
      id: query.id,
      userId: query.userId,
      queryText: query.queryText.toValue(),
      status: query.status.toValue(),
      hasResponse: false,
      createdAt: query.createdAt,
    }));
  }
}
