import { Injectable, Logger } from '@nestjs/common';
import { IntegrationError } from '../base/interfaces';
import {
  AIAnswerResponse,
  AIQuestionRequest,
  AICitation,
  AIDocumentGenerationRequest,
  AIDocumentGenerationResponse,
  AIDocumentStatus,
  AIClassificationRequest,
  AIClassificationResponse,
  AIDocumentType,
  LegalGround,
} from '../../../domain/ai/value-objects/ai-response.vo';
import {
  AskQuestionRequest,
  AnswerResponse,
  Citation,
  GenerateDocumentRequest,
  GenerateDocumentResponse,
  DocumentGenerationStatus,
  ClassifyCaseRequest,
  ClassifyCaseResponse,
  LegalGroundResponse,
  DocumentType,
} from '../../../shared/ai-client/ai-client.types';

/**
 * AI Engine Anti-Corruption Layer Transformer
 *
 * Translates between domain models and external AI Engine API models.
 * Isolates the domain from AI Engine API changes.
 */
@Injectable()
export class AiEngineTransformer {
  private readonly logger = new Logger(AiEngineTransformer.name);

  /**
   * Transform AI Engine response to domain answer response
   */
  toDomain(response: AnswerResponse): AIAnswerResponse {
    return {
      answer: response.answer,
      citations: response.citations.map((c) => this.citationToDomain(c)),
      confidence: response.confidence,
      sessionId: '', // Will be set by caller
      processingTimeMs: undefined,
    };
  }

  /**
   * Transform domain question request to AI Engine request
   */
  toExternal(domain: AIQuestionRequest): AskQuestionRequest {
    return {
      question: domain.question,
      session_id: domain.sessionId,
      mode: domain.mode,
    };
  }

  /**
   * Transform domain document generation request to AI Engine request
   */
  toDocumentGenerationRequest(
    domain: AIDocumentGenerationRequest,
  ): GenerateDocumentRequest {
    return {
      description: domain.description,
      document_type: this.documentTypeToExternal(domain.documentType),
      context: domain.context,
      session_id: domain.sessionId,
    };
  }

  /**
   * Transform AI Engine document generation response to domain
   */
  toDocumentGenerationResponse(
    response: GenerateDocumentResponse,
  ): AIDocumentGenerationResponse {
    return {
      taskId: response.task_id,
      status: this.statusToDomain(response.status),
      message: response.message,
    };
  }

  /**
   * Transform AI Engine document status to domain
   */
  toDocumentStatus(status: DocumentGenerationStatus): AIDocumentStatus {
    return {
      taskId: status.task_id,
      status: this.statusToDomain(status.status),
      content: status.content,
      metadata: status.metadata,
      error: status.error,
    };
  }

  /**
   * Transform domain classification request to AI Engine request
   */
  toClassificationRequest(
    domain: AIClassificationRequest,
  ): ClassifyCaseRequest {
    return {
      case_description: domain.caseDescription,
      session_id: domain.sessionId,
      context: domain.context,
    };
  }

  /**
   * Transform AI Engine classification response to domain
   */
  toClassificationResponse(
    response: ClassifyCaseResponse,
  ): AIClassificationResponse {
    return {
      identifiedGrounds: response.identified_grounds.map((g) =>
        this.legalGroundToDomain(g),
      ),
      overallConfidence: response.overall_confidence,
      summary: response.summary,
      recommendations: response.recommendations,
      caseDescription: response.case_description,
      processingTimeMs: response.processing_time_ms,
    };
  }

  /**
   * Transform citation to domain
   */
  private citationToDomain(external: Citation): AICitation {
    return {
      source: external.source,
      article: external.article,
      url: external.url,
      excerpt: undefined,
    };
  }

  /**
   * Transform legal ground to domain
   */
  private legalGroundToDomain(external: LegalGroundResponse): LegalGround {
    return {
      name: external.name,
      description: external.description,
      confidenceScore: external.confidence_score,
      legalBasis: external.legal_basis,
      notes: external.notes,
    };
  }

  /**
   * Transform domain document type to external
   */
  private documentTypeToExternal(domain: AIDocumentType): DocumentType {
    const mapping: Record<AIDocumentType, DocumentType> = {
      [AIDocumentType.LAWSUIT]: DocumentType.LAWSUIT,
      [AIDocumentType.COMPLAINT]: DocumentType.COMPLAINT,
      [AIDocumentType.CONTRACT]: DocumentType.CONTRACT,
      [AIDocumentType.OTHER]: DocumentType.OTHER,
    };
    return mapping[domain];
  }

  /**
   * Transform external status to domain status
   */
  private statusToDomain(
    status: string,
  ): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' {
    const statusMap: Record<
      string,
      'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    > = {
      pending: 'PENDING',
      processing: 'PROCESSING',
      completed: 'COMPLETED',
      failed: 'FAILED',
    };

    return (
      statusMap[status.toLowerCase()] ||
      ('PENDING' as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED')
    );
  }

  /**
   * Validate external AI Engine response
   */
  validateExternal(external: unknown): external is AnswerResponse {
    if (!external || typeof external !== 'object') {
      return false;
    }

    const response = external as Partial<AnswerResponse>;

    return (
      typeof response.answer === 'string' &&
      Array.isArray(response.citations) &&
      typeof response.confidence === 'number'
    );
  }

  /**
   * Create integration error from any error
   */
  createIntegrationError(
    error: unknown,
    retryable: boolean = true,
  ): IntegrationError {
    const code =
      error instanceof Error ? error.name : 'UNKNOWN_AI_ENGINE_ERROR';

    const message =
      error instanceof Error
        ? error.message
        : 'Unknown error in AI Engine integration';

    return {
      code,
      message,
      retryable,
      originalError: error,
    };
  }
}
