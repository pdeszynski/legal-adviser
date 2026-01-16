import { Injectable, Inject } from '@nestjs/common';
import { IUseCase, NotFoundError } from '../../common';
import { LegalQueryDto } from '../dto';
import type { ILegalQueryRepository } from '../../../domain/ai-operations/repositories';

/**
 * Input for getting a query by ID
 */
export interface GetQueryInput {
  readonly queryId: string;
}

/**
 * Use Case: Get a legal query by ID
 *
 * This use case retrieves a single query by its unique identifier.
 */
@Injectable()
export class GetQueryUseCase implements IUseCase<GetQueryInput, LegalQueryDto> {
  constructor(
    @Inject('ILegalQueryRepository')
    private readonly queryRepository: ILegalQueryRepository,
  ) {}

  async execute(request: GetQueryInput): Promise<LegalQueryDto> {
    const query = await this.queryRepository.findById(request.queryId);

    if (!query) {
      throw new NotFoundError('LegalQuery', request.queryId);
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
      errorMessage: query.errorMessage,
      metadata: query.metadata,
      createdAt: query.createdAt,
      updatedAt: query.updatedAt,
    };
  }
}
