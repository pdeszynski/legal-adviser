import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../common';
import { LegalQuerySummaryDto } from '../dto';
import type { ILegalQueryRepository } from '../../../domain/ai-operations/repositories';

/**
 * Input for getting recent queries
 */
export interface GetRecentQueriesInput {
  readonly userId: string;
  readonly limit?: number;
}

/**
 * Use Case: Get recent queries for a user
 *
 * This use case retrieves the most recent queries for a user.
 */
@Injectable()
export class GetRecentQueriesUseCase
  implements IUseCase<GetRecentQueriesInput, LegalQuerySummaryDto[]>
{
  constructor(
    @Inject('ILegalQueryRepository')
    private readonly queryRepository: ILegalQueryRepository,
  ) {}

  async execute(request: GetRecentQueriesInput): Promise<LegalQuerySummaryDto[]> {
    const limit = request.limit ?? 10;

    const queries = await this.queryRepository.findRecentByUserId(
      request.userId,
      limit,
    );

    return queries.map((query) => ({
      id: query.id,
      userId: query.userId,
      queryText: query.queryText.toValue(),
      status: query.status.toValue(),
      hasResponse: !!query.response,
      createdAt: query.createdAt,
    }));
  }
}
