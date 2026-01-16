// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserRole = 'admin' | 'user' | 'guest';

// Document types
export interface Document {
  id: string;
  title: string;
  content?: string;
  userId: string;
  type: DocumentType;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentType = 'contract' | 'agreement' | 'legal_opinion' | 'other';
export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'rejected';

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: ApiError[];
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// AI Engine types
export interface AiQueryRequest {
  query: string;
  context?: string;
  documentIds?: string[];
}

export interface AiQueryResponse {
  answer: string;
  sources?: AiSource[];
  confidence?: number;
}

export interface AiSource {
  documentId: string;
  excerpt: string;
  relevance: number;
}

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
