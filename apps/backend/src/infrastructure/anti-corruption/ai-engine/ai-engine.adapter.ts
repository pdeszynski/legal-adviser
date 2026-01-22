import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  IntegrationResult,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
} from '../base/interfaces';
import { AiEngineTransformer } from './ai-engine.transformer';
import {
  AIQuestionRequest,
  AIAnswerResponse,
  AIDocumentGenerationRequest,
  AIDocumentGenerationResponse,
  AIDocumentStatus,
  AIClassificationRequest,
  AIClassificationResponse,
} from '../../../domain/ai/value-objects/ai-response.vo';
import {
  AskQuestionRequest,
  AnswerResponse,
  GenerateDocumentRequest,
  GenerateDocumentResponse,
  DocumentGenerationStatus,
  ClassifyCaseRequest,
  ClassifyCaseResponse,
} from '../../../shared/ai-client/ai-client.types';

/**
 * AI Engine Anti-Corruption Layer Adapter
 *
 * Provides a clean interface to the AI Engine, isolating the domain
 * from external API changes and handling transformation, validation,
 * and error recovery.
 */
@Injectable()
export class AiEngineAdapter {
  private readonly logger = new Logger(AiEngineAdapter.name);
  private readonly aiEngineUrl: string;
  private readonly retryConfig: RetryConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly transformer: AiEngineTransformer,
  ) {
    this.aiEngineUrl =
      this.configService.get<string>('AI_ENGINE_URL') ||
      'http://localhost:8000';
    this.retryConfig = DEFAULT_RETRY_CONFIG;
    this.logger.log(
      `AI Engine Adapter initialized with URL: ${this.aiEngineUrl}`,
    );
  }

  /**
   * Ask a legal question
   */
  async askQuestion(
    request: AIQuestionRequest,
  ): Promise<IntegrationResult<AIAnswerResponse>> {
    try {
      const externalRequest = this.transformer.toExternal(request);

      const response = await this.executeWithRetry<AnswerResponse>(async () => {
        const result = await firstValueFrom(
          this.httpService.post<AnswerResponse>(
            `${this.aiEngineUrl}/api/v1/qa/ask`,
            externalRequest,
          ),
        );
        return result.data;
      }, 'askQuestion');

      if (!this.transformer.validateExternal(response)) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'AI Engine returned invalid response format',
            retryable: true,
          },
        };
      }

      const domainResponse = this.transformer.toDomain(response);
      domainResponse.sessionId = request.sessionId;

      return {
        success: true,
        data: domainResponse,
      };
    } catch (error) {
      this.logger.error('Failed to ask question', error);
      return {
        success: false,
        error: this.transformer.createIntegrationError(error),
      };
    }
  }

  /**
   * Ask a question with RAG
   */
  async askQuestionWithRag(
    request: AIQuestionRequest,
  ): Promise<IntegrationResult<AIAnswerResponse>> {
    try {
      const externalRequest = this.transformer.toExternal(request);

      const response = await this.executeWithRetry<AnswerResponse>(async () => {
        const result = await firstValueFrom(
          this.httpService.post<AnswerResponse>(
            `${this.aiEngineUrl}/api/v1/qa/ask-rag`,
            externalRequest,
          ),
        );
        return result.data;
      }, 'askQuestionWithRag');

      if (!this.transformer.validateExternal(response)) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'AI Engine returned invalid response format',
            retryable: true,
          },
        };
      }

      const domainResponse = this.transformer.toDomain(response);
      domainResponse.sessionId = request.sessionId;

      return {
        success: true,
        data: domainResponse,
      };
    } catch (error) {
      this.logger.error('Failed to ask question with RAG', error);
      return {
        success: false,
        error: this.transformer.createIntegrationError(error),
      };
    }
  }

  /**
   * Generate a document
   */
  async generateDocument(
    request: AIDocumentGenerationRequest,
  ): Promise<IntegrationResult<AIDocumentGenerationResponse>> {
    try {
      const externalRequest =
        this.transformer.toDocumentGenerationRequest(request);

      const response = await this.executeWithRetry<GenerateDocumentResponse>(
        async () => {
          const result = await firstValueFrom(
            this.httpService.post<GenerateDocumentResponse>(
              `${this.aiEngineUrl}/api/v1/documents/generate`,
              externalRequest,
            ),
          );
          return result.data;
        },
        'generateDocument',
      );

      const domainResponse =
        this.transformer.toDocumentGenerationResponse(response);

      return {
        success: true,
        data: domainResponse,
      };
    } catch (error) {
      this.logger.error('Failed to generate document', error);
      return {
        success: false,
        error: this.transformer.createIntegrationError(error),
      };
    }
  }

  /**
   * Get document generation status
   */
  async getDocumentStatus(
    taskId: string,
  ): Promise<IntegrationResult<AIDocumentStatus>> {
    try {
      const response = await this.executeWithRetry<DocumentGenerationStatus>(
        async () => {
          const result = await firstValueFrom(
            this.httpService.get<DocumentGenerationStatus>(
              `${this.aiEngineUrl}/api/v1/documents/status/${taskId}`,
            ),
          );
          return result.data;
        },
        'getDocumentStatus',
      );

      const domainStatus = this.transformer.toDocumentStatus(response);

      return {
        success: true,
        data: domainStatus,
      };
    } catch (error) {
      this.logger.error(`Failed to get status for task ${taskId}`, error);
      return {
        success: false,
        error: this.transformer.createIntegrationError(error, false),
      };
    }
  }

  /**
   * Classify a case
   */
  async classifyCase(
    request: AIClassificationRequest,
  ): Promise<IntegrationResult<AIClassificationResponse>> {
    try {
      const externalRequest = this.transformer.toClassificationRequest(request);

      const response = await this.executeWithRetry<ClassifyCaseResponse>(
        async () => {
          const result = await firstValueFrom(
            this.httpService.post<ClassifyCaseResponse>(
              `${this.aiEngineUrl}/api/v1/classify`,
              externalRequest,
            ),
          );
          return result.data;
        },
        'classifyCase',
      );

      const domainResponse =
        this.transformer.toClassificationResponse(response);

      return {
        success: true,
        data: domainResponse,
      };
    } catch (error) {
      this.logger.error('Failed to classify case', error);
      return {
        success: false,
        error: this.transformer.createIntegrationError(error),
      };
    }
  }

  /**
   * Health check for AI Engine
   */
  async healthCheck(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get<{ status: string }>(`${this.aiEngineUrl}/health`),
      );
      return true;
    } catch (error) {
      this.logger.error('AI Engine health check failed', error);
      return false;
    }
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: unknown;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorCode = this.extractErrorCode(error);

        if (!this.isRetryable(errorCode)) {
          this.logger.error(
            `Non-retryable error in ${operationName}: ${errorCode}`,
            error,
          );
          throw error;
        }

        if (attempt < this.retryConfig.maxAttempts) {
          this.logger.warn(
            `Attempt ${attempt}/${this.retryConfig.maxAttempts} failed for ${operationName}. Retrying in ${delay}ms...`,
          );
          await this.sleep(delay);
          delay = Math.min(
            delay * this.retryConfig.backoffMultiplier,
            this.retryConfig.maxDelayMs,
          );
        }
      }
    }

    this.logger.error(
      `All ${this.retryConfig.maxAttempts} attempts failed for ${operationName}`,
      lastError,
    );
    throw lastError;
  }

  /**
   * Extract error code from error object
   */
  private extractErrorCode(error: unknown): string {
    if (error instanceof Error) {
      return error.name;
    }
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return String(error.code);
    }
    return 'UNKNOWN';
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(errorCode: string): boolean {
    return this.retryConfig.retryableErrors.includes(errorCode);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute generic operation (for IIntegrationAdapter interface compliance)
   */
  async execute(
    request:
      | AIQuestionRequest
      | AIDocumentGenerationRequest
      | AIClassificationRequest,
  ): Promise<
    IntegrationResult<
      AIAnswerResponse | AIDocumentGenerationResponse | AIClassificationResponse
    >
  > {
    if ('caseDescription' in request) {
      return this.classifyCase(request);
    } else if ('description' in request) {
      return this.generateDocument(request);
    } else {
      return this.askQuestion(request);
    }
  }
}
