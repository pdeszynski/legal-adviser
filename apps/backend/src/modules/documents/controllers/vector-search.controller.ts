import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { VectorStoreService } from '../services/vector-store.service';

export interface VectorSearchRequest {
  query_embedding: number[];
  limit?: number;
  threshold?: number;
  document_id?: string;
}

export interface VectorSearchResponse {
  results: Array<{
    id: string;
    document_id: string;
    content_chunk: string;
    chunk_index: number;
    similarity: number;
    metadata?: Record<string, unknown>;
  }>;
  total: number;
  query: string;
}

/**
 * Vector Search REST Controller
 *
 * Provides REST API endpoints for vector similarity search.
 * Used by the AI Engine for RAG (Retrieval Augmented Generation).
 *
 * This controller exposes the VectorStoreService for internal services.
 * The AI Engine calls this endpoint to retrieve relevant document chunks.
 *
 * @example
 * POST /api/documents/vector-search
 * {
 *   "query_embedding": [0.1, 0.2, ...],
 *   "limit": 5,
 *   "threshold": 0.7
 * }
 */
@Controller('api/documents')
export class VectorSearchController {
  private readonly logger = new Logger(VectorSearchController.name);

  constructor(private readonly vectorStoreService: VectorStoreService) {}

  /**
   * Perform vector similarity search over document embeddings.
   *
   * This endpoint is used by the AI Engine's RAG tool to retrieve
   * relevant legal context from the vector store.
   *
   * The query_embedding should be generated using the same model
   * as the stored embeddings (text-embedding-3-small, 1536 dimensions).
   *
   * @param request - The search request with query embedding
   * @returns Similar document chunks ranked by cosine similarity
   */
  @Post('vector-search')
  @HttpCode(HttpStatus.OK)
  async vectorSearch(
    @Body() request: VectorSearchRequest,
  ): Promise<VectorSearchResponse> {
    const {
      query_embedding,
      limit = 5,
      threshold = 0.7,
      document_id,
    } = request;

    this.logger.debug(
      `Vector search request: limit=${limit}, threshold=${threshold}, embedding_dim=${query_embedding.length}`,
    );

    // Validate embedding dimensions
    if (query_embedding.length !== 1536) {
      this.logger.warn(
        `Unexpected embedding dimension: ${query_embedding.length}. Expected 1536 (text-embedding-3-small).`,
      );
    }

    // Perform similarity search
    const results = await this.vectorStoreService.similaritySearch(
      query_embedding,
      limit,
      threshold,
      document_id,
    );

    this.logger.debug(
      `Found ${results.length} results above threshold ${threshold}`,
    );

    return {
      results: results.map((result) => ({
        id: result.id,
        document_id: result.documentId,
        content_chunk: result.contentChunk,
        chunk_index: result.chunkIndex,
        similarity: result.similarity,
        metadata: result.metadata
          ? JSON.parse(String(result.metadata))
          : undefined,
      })),
      total: results.length,
      query: '',
    };
  }
}
