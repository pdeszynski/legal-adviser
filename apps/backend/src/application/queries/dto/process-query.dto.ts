/**
 * Input DTO for completing a query with AI response.
 */
export interface CompleteQueryDto {
  readonly queryId: string;
  readonly content: string;
  readonly confidence: number;
  readonly tokensUsed: number;
  readonly modelUsed: string;
  readonly processingTimeMs: number;
  readonly citations?: string[];
}

/**
 * Input DTO for failing a query.
 */
export interface FailQueryDto {
  readonly queryId: string;
  readonly errorMessage: string;
  readonly errorCode?: string;
}
