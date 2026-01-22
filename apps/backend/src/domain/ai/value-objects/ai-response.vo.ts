/**
 * Domain Value Objects: AI Responses
 *
 * Pure domain models for AI engine interactions.
 * Independent of the actual AI Engine API structure.
 */

/**
 * Domain Model: AICitation
 *
 * Standardized citation format in our domain.
 */
export interface AICitation {
  source: string;
  article: string;
  url?: string;
  excerpt?: string;
}

/**
 * Domain Model: AIAnswerResponse
 *
 * Standardized response structure for AI Q&A operations.
 */
export interface AIAnswerResponse {
  answer: string;
  citations: AICitation[];
  confidence: number;
  sessionId: string;
  processingTimeMs?: number;
}

/**
 * Domain Model: AIQuestionRequest
 *
 * Standardized request format for asking questions.
 */
export interface AIQuestionRequest {
  question: string;
  sessionId: string;
  mode?: 'SIMPLE' | 'DETAILED' | 'RAG';
}

/**
 * Domain Model: AIDocumentType
 *
 * Standardized document types for document generation.
 */
export enum AIDocumentType {
  LAWSUIT = 'LAWSUIT',
  COMPLAINT = 'COMPLAINT',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

/**
 * Domain Model: AIDocumentGenerationRequest
 */
export interface AIDocumentGenerationRequest {
  description: string;
  documentType: AIDocumentType;
  sessionId: string;
  context?: Record<string, unknown>;
}

/**
 * Domain Model: AIDocumentGenerationResponse
 */
export interface AIDocumentGenerationResponse {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message: string;
}

/**
 * Domain Model: AIDocumentStatus
 */
export interface AIDocumentStatus {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  content?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

/**
 * Domain Model: AIClassificationRequest
 */
export interface AIClassificationRequest {
  caseDescription: string;
  sessionId: string;
  context?: Record<string, unknown>;
}

/**
 * Domain Model: LegalGround
 */
export interface LegalGround {
  name: string;
  description: string;
  confidenceScore: number;
  legalBasis: string[];
  notes?: string;
}

/**
 * Domain Model: AIClassificationResponse
 */
export interface AIClassificationResponse {
  identifiedGrounds: LegalGround[];
  overallConfidence: number;
  summary: string;
  recommendations: string;
  caseDescription: string;
  processingTimeMs: number;
}
