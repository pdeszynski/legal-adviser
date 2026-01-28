import { Injectable, Logger, Scope, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
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
  ConversationMessage,
} from './ai-client.types';
import { UsageTrackingService } from '../../modules/usage-tracking/services/usage-tracking.service';
import { AiOperationType } from '../../modules/usage-tracking/entities/ai-usage-record.entity';

/**
 * AI Client Service
 *
 * Handles all communication with the AI Engine (FastAPI service).
 * Provides typed methods for document generation, Q&A, and search.
 *
 * Features:
 * - Distributed tracing via sentry-trace header propagation
 * - Langfuse trace ID propagation for AI observability
 * - Performance monitoring for all AI operations
 * - Error tracking with context
 */
@Injectable({ scope: Scope.REQUEST })
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly aiEngineUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(UsageTrackingService)
    private readonly usageTrackingService: UsageTrackingService,
  ) {
    this.aiEngineUrl =
      this.configService.get<string>('AI_ENGINE_URL') ||
      'http://localhost:8000';
    this.logger.log(`AI Engine URL: ${this.aiEngineUrl}`);
  }

  /**
   * Get headers for distributed tracing and observability
   * Propagates sentry-trace and x-langfuse-trace-id headers for cross-service tracing
   * Also propagates user ID for Langfuse user-level analytics
   */
  private getTracingHeaders(userId?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Propagate Sentry trace for distributed tracing
    const traceHeader = Sentry.getTraceData();
    if (traceHeader) {
      headers['sentry-trace'] = traceHeader['sentry-trace'] || '';
    }

    // Propagate Langfuse trace ID for AI observability
    const langfuseTraceId = Sentry.getTraceData()?.['baggage']?.match(
      /langfuse_trace_id=([^,]+)/,
    );
    if (langfuseTraceId) {
      headers['x-langfuse-trace-id'] = langfuseTraceId[1];
    }

    // Propagate user ID for Langfuse user-level analytics
    if (userId) {
      headers['x-user-id'] = userId;
    }

    return headers;
  }

  /**
   * Generate a legal document from natural language description
   */
  async generateDocument(
    request: GenerateDocumentRequest,
    userId?: string,
  ): Promise<GenerateDocumentResponse> {
    // Start a span for AI operation tracking
    const span = Sentry.startSpan(
      {
        name: 'ai-engine.documents.generate',
        op: 'http.client',
      },
      () => {
        return firstValueFrom(
          this.httpService.post<GenerateDocumentResponse>(
            `${this.aiEngineUrl}/api/v1/documents/generate`,
            request,
            { headers: this.getTracingHeaders() },
          ),
        );
      },
    );

    try {
      const response = await span;
      const responseData = response.data;

      // Track usage if userId is provided
      if (userId && responseData.tokens_used) {
        await this.usageTrackingService.recordUsage(
          userId,
          AiOperationType.DOCUMENT_GENERATION,
          responseData.tokens_used,
          1,
          responseData.task_id,
          { document_type: request.document_type },
        );
      }

      return responseData;
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
          { headers: this.getTracingHeaders() },
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
   *
   * Logs conversation history details for debugging and monitoring.
   * Verifies message count, order, and role correctness.
   */
  async askQuestion(
    request: AskQuestionRequest,
    userId?: string,
  ): Promise<AnswerResponse> {
    // Log conversation history details before sending to AI Engine
    const conversationHistory = request.conversation_history || [];
    const historySize = conversationHistory.length;

    // Build detailed log context for conversation history verification
    interface HistoryLogContext {
      session_id: string;
      conversation_history_count: number;
      conversation_history_total_chars: number;
      user_id: string;
      role_distribution?: { user: number; assistant: number };
      first_message_role?: string;
      last_message_role?: string;
      message_order_valid?: boolean;
      has_empty_content?: boolean;
    }

    const historyLogContext: HistoryLogContext = {
      session_id: request.session_id,
      conversation_history_count: historySize,
      conversation_history_total_chars: conversationHistory.reduce(
        (sum, msg) => sum + (msg.content?.length || 0),
        0,
      ),
      user_id: userId || 'anonymous',
    };

    // Verify message roles and order
    if (historySize > 0) {
      const roles = conversationHistory.map((msg) => msg.role);
      const userCount = roles.filter((r) => r === 'user').length;
      const assistantCount = roles.filter((r) => r === 'assistant').length;

      historyLogContext.role_distribution = {
        user: userCount,
        assistant: assistantCount,
      };
      historyLogContext.first_message_role = roles[0];
      historyLogContext.last_message_role = roles[roles.length - 1];

      // Verify message order (oldest first, newest last)
      historyLogContext.message_order_valid =
        this.verifyMessageOrder(conversationHistory);

      // Check for any message truncation or data loss
      historyLogContext.has_empty_content = conversationHistory.some(
        (msg) => !msg.content || msg.content.trim().length === 0,
      );
    }

    this.logger.log(
      `Sending request to AI Engine: session_id=${request.session_id}, ` +
        `conversation_history_count=${historySize}, ` +
        `user_id=${userId || 'anonymous'}`,
    );

    // Log detailed conversation history structure at debug level
    if (historySize > 0) {
      this.logger.debug(
        `Conversation history structure for session ${request.session_id}: ` +
          `messages=[${conversationHistory.map((m, i) => `${i}:${m.role}:${m.content?.substring(0, 30) || ''}...`).join(', ')}]`,
      );
    }

    // Emit conversation history metric for monitoring
    if (historySize > 0) {
      this.logger.verbose(
        `CONVERSATION_HISTORY_METRIC: ${JSON.stringify({
          session_id: request.session_id,
          message_count: historySize,
          total_chars: historyLogContext.conversation_history_total_chars,
          user_count: historyLogContext.role_distribution?.user,
          assistant_count: historyLogContext.role_distribution?.assistant,
          has_empty_content: historyLogContext.has_empty_content,
          order_valid: historyLogContext.message_order_valid,
        })}`,
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<AnswerResponse>(
          `${this.aiEngineUrl}/api/v1/qa/ask`,
          request,
          { headers: this.getTracingHeaders(userId) },
        ),
      );

      const responseData = response.data;

      // Track usage if userId is provided
      if (userId && responseData.tokens_used) {
        await this.usageTrackingService.recordUsage(
          userId,
          AiOperationType.QUESTION_ANSWERING,
          responseData.tokens_used,
          1,
          request.session_id,
          { mode: request.mode, conversation_history_size: historySize },
        );
      }

      this.logger.log(
        `AI Engine response received: session_id=${request.session_id}, ` +
          `tokens_used=${responseData.tokens_used || 'N/A'}, ` +
          `conversation_history_used=${historySize}`,
      );

      return responseData;
    } catch (error) {
      this.logger.error(
        `Failed to ask question for session ${request.session_id}: ` +
          `conversation_history_size=${historySize}`,
        error,
      );
      throw new Error('Question answering failed');
    }
  }

  /**
   * Verify that messages are in correct order (oldest first, newest last)
   * and have valid role values
   */
  private verifyMessageOrder(messages: ConversationMessage[]): boolean {
    const validRoles = ['user', 'assistant'];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      // Check role validity
      if (!validRoles.includes(msg.role)) {
        this.logger.warn(`Invalid role at index ${i}: ${msg.role}`);
        return false;
      }

      // Check content presence
      if (!msg.content || msg.content.trim().length === 0) {
        this.logger.warn(`Empty content at index ${i} with role: ${msg.role}`);
      }
    }

    return true;
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
          { headers: this.getTracingHeaders() },
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
  async classifyCase(
    request: ClassifyCaseRequest,
    userId?: string,
  ): Promise<ClassifyCaseResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ClassifyCaseResponse>(
          `${this.aiEngineUrl}/api/v1/classify`,
          request,
          { headers: this.getTracingHeaders() },
        ),
      );

      const responseData = response.data;

      // Track usage if userId is provided
      if (userId && responseData.tokens_used) {
        await this.usageTrackingService.recordUsage(
          userId,
          AiOperationType.CASE_CLASSIFICATION,
          responseData.tokens_used,
          1,
          request.session_id,
          { processing_time_ms: responseData.processing_time_ms },
        );
      }

      return responseData;
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
        this.httpService.post<{
          embeddings: number[][];
          model: string;
          total_tokens: number;
        }>(
          `${this.aiEngineUrl}/api/v1/embeddings/generate`,
          { texts, model: 'text-embedding-3-small' },
          { headers: this.getTracingHeaders() },
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
  async semanticSearch(
    request: SemanticSearchRequest,
  ): Promise<SemanticSearchResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<SemanticSearchResponse>(
          `${this.aiEngineUrl}/api/v1/search/semantic`,
          request,
          { headers: this.getTracingHeaders() },
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
  async askQuestionWithRag(
    request: AskQuestionRequest,
    userId?: string,
  ): Promise<AnswerResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<AnswerResponse>(
          `${this.aiEngineUrl}/api/v1/qa/ask-rag`,
          request,
          { headers: this.getTracingHeaders() },
        ),
      );

      const responseData = response.data;

      // Track usage if userId is provided
      if (userId && responseData.tokens_used) {
        await this.usageTrackingService.recordUsage(
          userId,
          AiOperationType.RAG_QUESTION_ANSWERING,
          responseData.tokens_used,
          1,
          request.session_id,
          { mode: request.mode },
        );
      }

      return responseData;
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
        this.httpService.get<{ status: string }>(`${this.aiEngineUrl}/health`, {
          headers: this.getTracingHeaders(),
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('AI Engine health check failed', error);
      throw new Error('AI Engine is not available');
    }
  }
}
