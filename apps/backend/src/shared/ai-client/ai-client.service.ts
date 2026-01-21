import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  GenerateDocumentRequest,
  GenerateDocumentResponse,
  DocumentGenerationStatus,
  AskQuestionRequest,
  AnswerResponse,
  SearchRulingsRequest,
  SearchRulingsResponse,
  ClassifyCaseRequest,
  ClassifyCaseResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
} from './ai-client.types';

/**
 * AI Client Service
 *
 * Handles all communication with the AI Engine (FastAPI service).
 * Provides typed methods for document generation, Q&A, and search.
 */
@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly aiEngineUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiEngineUrl =
      this.configService.get<string>('AI_ENGINE_URL') ||
      'http://localhost:8000';
    this.logger.log(`AI Engine URL: ${this.aiEngineUrl}`);
  }

  /**
   * Generate a legal document from natural language description
   */
  async generateDocument(
    request: GenerateDocumentRequest,
  ): Promise<GenerateDocumentResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GenerateDocumentResponse>(
          `${this.aiEngineUrl}/api/v1/documents/generate`,
          request,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to generate document', error);
      throw new Error('Document generation failed');
    }
  }

  /**
   * Get the status of a document generation task
   */
  async getDocumentStatus(taskId: string): Promise<DocumentGenerationStatus> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<DocumentGenerationStatus>(
          `${this.aiEngineUrl}/api/v1/documents/status/${taskId}`,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get status for task ${taskId}`, error);
      throw new Error('Failed to get document status');
    }
  }

  /**
   * Ask a legal question and receive an answer with citations
   */
  async askQuestion(request: AskQuestionRequest): Promise<AnswerResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<AnswerResponse>(
          `${this.aiEngineUrl}/api/v1/qa/ask`,
          request,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to ask question', error);
      throw new Error('Question answering failed');
    }
  }

  /**
   * Search for legal rulings and case law
   */
  async searchRulings(
    request: SearchRulingsRequest,
  ): Promise<SearchRulingsResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<SearchRulingsResponse>(
          `${this.aiEngineUrl}/api/v1/search/rulings`,
          request,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to search rulings', error);
      throw new Error('Ruling search failed');
    }
  }

  /**
   * Classify a case and identify applicable legal grounds
   */
  async classifyCase(request: ClassifyCaseRequest): Promise<ClassifyCaseResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ClassifyCaseResponse>(
          `${this.aiEngineUrl}/api/v1/classify`,
          request,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to classify case', error);
      throw new Error('Case classification failed');
    }
  }

  /**
   * Generate embeddings for text chunks
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ embeddings: number[][]; model: string; total_tokens: number }>(
          `${this.aiEngineUrl}/api/v1/embeddings/generate`,
          { texts, model: 'text-embedding-3-small' },
        ),
      );
      return response.data.embeddings;
    } catch (error) {
      this.logger.error('Failed to generate embeddings', error);
      throw new Error('Embedding generation failed');
    }
  }

  /**
   * Perform semantic search over document embeddings
   */
  async semanticSearch(request: SemanticSearchRequest): Promise<SemanticSearchResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<SemanticSearchResponse>(
          `${this.aiEngineUrl}/api/v1/search/semantic`,
          request,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to perform semantic search', error);
      throw new Error('Semantic search failed');
    }
  }

  /**
   * Ask a legal question with RAG (Retrieval Augmented Generation)
   */
  async askQuestionWithRag(request: AskQuestionRequest): Promise<AnswerResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<AnswerResponse>(
          `${this.aiEngineUrl}/api/v1/qa/ask-rag`,
          request,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to ask question with RAG', error);
      throw new Error('RAG question answering failed');
    }
  }

  /**
   * Health check for AI Engine
   */
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ status: string }>(`${this.aiEngineUrl}/health`),
      );
      return response.data;
    } catch (error) {
      this.logger.error('AI Engine health check failed', error);
      throw new Error('AI Engine is not available');
    }
  }
}
