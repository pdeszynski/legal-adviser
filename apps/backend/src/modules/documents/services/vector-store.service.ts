import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEmbedding } from '../entities/document-embedding.entity';
import { AiClientService } from '../../../shared/ai-client/ai-client.service';

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export interface SearchResult {
  id: string;
  documentId: string;
  contentChunk: string;
  chunkIndex: number;
  similarity: number;
  metadata?: Record<string, unknown>;
}

export interface IndexDocumentOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly DEFAULT_CHUNK_SIZE = 500;
  private readonly DEFAULT_CHUNK_OVERLAP = 50;

  constructor(
    @InjectRepository(DocumentEmbedding)
    private readonly embeddingRepository: Repository<DocumentEmbedding>,
    private readonly aiClient: AiClientService,
  ) {}

  /**
   * Split text into overlapping chunks for embedding
   */
  private chunkText(text: string, options: ChunkOptions): string[] {
    const { chunkSize, chunkOverlap } = options;
    const chunks: string[] = [];

    // Split by paragraphs first to maintain semantic coherence
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let currentSize = 0;

    for (const paragraph of paragraphs) {
      const paragraphSize = paragraph.length;

      if (currentSize + paragraphSize > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push(currentChunk.trim());

        // Start new chunk with overlap
        const overlapText = currentChunk.slice(-chunkOverlap);
        currentChunk = overlapText + (overlapText.length > 0 ? '\n\n' : '') + paragraph;
        currentSize = currentChunk.length;
      } else {
        // Add paragraph to current chunk
        currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
        currentSize += paragraphSize;
      }
    }

    // Add last chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }

  /**
   * Index a document into the vector store
   */
  async indexDocument(
    documentId: string,
    content: string,
    options: IndexDocumentOptions = {},
  ): Promise<DocumentEmbedding[]> {
    const { chunkSize = this.DEFAULT_CHUNK_SIZE, chunkOverlap = this.DEFAULT_CHUNK_OVERLAP, metadata = {} } = options;

    this.logger.log(`Indexing document ${documentId} with vector store`);

    // Chunk the text
    const chunks = this.chunkText(content, { chunkSize, chunkOverlap });
    this.logger.debug(`Split document into ${chunks.length} chunks`);

    // Generate embeddings for all chunks
    const embeddings = await this.aiClient.generateEmbeddings(chunks);

    // Create embedding records
    const embeddingRecords = chunks.map((chunk, index) => {
      const record = this.embeddingRepository.create({
        documentId,
        embedding: embeddings[index],
        contentChunk: chunk,
        chunkIndex: index,
        chunkSize: chunk.length,
        metadata: {
          ...metadata,
          totalChunks: chunks.length,
        },
      });
      return record;
    });

    // Save to database
    const saved = await this.embeddingRepository.save(embeddingRecords);
    this.logger.log(`Successfully indexed ${saved.length} chunks for document ${documentId}`);

    return saved;
  }

  /**
   * Search for similar documents using vector similarity
   */
  async similaritySearch(
    queryEmbedding: number[],
    limit: number = 5,
    threshold: number = 0.7,
    documentId?: string,
  ): Promise<SearchResult[]> {
    const embeddingJson = JSON.stringify(queryEmbedding);

    // Build the query with pgvector cosine similarity
    let queryBuilder = this.embeddingRepository
      .createQueryBuilder('embedding')
      .select([
        'embedding.id',
        'embedding.documentId',
        'embedding.contentChunk',
        'embedding.chunkIndex',
        'embedding.metadata',
        `1 - (embedding.embedding <=> '${embeddingJson}'::vector) AS similarity`,
      ])
      .where(`1 - (embedding.embedding <=> '${embeddingJson}'::vector) >= :threshold`, {
        threshold,
      })
      .orderBy('similarity', 'DESC')
      .limit(limit);

    // Filter by document ID if provided
    if (documentId) {
      queryBuilder = queryBuilder.andWhere('embedding.documentId = :documentId', {
        documentId,
      });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((row) => ({
      id: row.embedding_id,
      documentId: row.embedding_documentId,
      contentChunk: row.embedding_contentChunk,
      chunkIndex: parseInt(row.embedding_chunkIndex, 10),
      similarity: parseFloat(row.similarity),
      metadata: row.embedding_metadata,
    }));
  }

  /**
   * Delete all embeddings for a document
   */
  async deleteDocumentEmbeddings(documentId: string): Promise<void> {
    this.logger.log(`Deleting embeddings for document ${documentId}`);
    await this.embeddingRepository.delete({ documentId });
  }

  /**
   * Get embedding count for a document
   */
  async getEmbeddingCount(documentId: string): Promise<number> {
    return this.embeddingRepository.count({ where: { documentId } });
  }
}
