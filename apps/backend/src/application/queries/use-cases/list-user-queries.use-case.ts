import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../common';
import { LegalQuerySummaryDto, PaginatedQueriesDto } from '../dto';
import type { ILegalQueryRepository } from '../../../domain/ai-operations/repositories';
import { QueryStatusEnum } from '../../../domain/ai-operations/value-objects';

/**
 * Input for listing user queries
 */
export interface ListUserQueriesInput {
  readonly userId: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly status?: QueryStatusEnum;
}

/**
 * Use Case: List queries for a specific user
 *
 * This use case retrieves a paginated list of queries for a user.
 */
@Injectable()
export class ListUserQueriesUseCase
  implements IUseCase<ListUserQueriesInput, PaginatedQueriesDto>
{
  constructor(
    @Inject('ILegalQueryRepository')
    private readonly queryRepository: ILegalQueryRepository,
  ) {}

  async execute(request: ListUserQueriesInput): Promise<PaginatedQueriesDto> {
    const page = request.page ?? 1;
    const pageSize = request.pageSize ?? 20;

    // Get queries based on filters
    let queries;
    if (request.status) {
      queries = await this.queryRepository.findByUserAndStatus(
        request.userId,
        request.status,
      );
    } else {
      queries = await this.queryRepository.findByUserId(request.userId);
    }

    // Calculate pagination
    const total = queries.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedQueries = queries.slice(startIndex, startIndex + pageSize);

    // Map to DTOs
    const items: LegalQuerySummaryDto[] = paginatedQueries.map((query) => ({
      id: query.id,
      userId: query.userId,
      queryText: query.queryText.toValue(),
      status: query.status.toValue(),
      hasResponse: !!query.response,
      createdAt: query.createdAt,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}
