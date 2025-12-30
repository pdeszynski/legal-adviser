/**
 * Type definitions for AI Engine API
 *
 * These types mirror the Pydantic models from the AI Engine.
 * In production, these should be auto-generated from OpenAPI schema.
 */

export enum DocumentType {
  LAWSUIT = 'LAWSUIT',
  COMPLAINT = 'COMPLAINT',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

export interface GenerateDocumentRequest {
  description: string;
  document_type: DocumentType;
  context?: Record<string, any>;
  session_id: string;
}

export interface GenerateDocumentResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface DocumentGenerationStatus {
  task_id: string;
  status: string;
  content?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface AskQuestionRequest {
  question: string;
  session_id: string;
  mode?: string;
}

export interface Citation {
  source: string;
  article: string;
  url?: string;
}

export interface AnswerResponse {
  answer: string;
  citations: Citation[];
  confidence: number;
}

export interface SearchRulingsRequest {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
}

export interface Ruling {
  id: string;
  title: string;
  court: string;
  date: string;
  summary: string;
  url?: string;
  relevance_score: number;
}

export interface SearchRulingsResponse {
  results: Ruling[];
  total: number;
  query: string;
}
