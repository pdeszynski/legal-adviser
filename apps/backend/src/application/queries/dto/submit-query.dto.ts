/**
 * Input DTO for submitting a legal query.
 */
export interface SubmitQueryDto {
  readonly userId: string;
  readonly queryText: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Output DTO representing a submitted query.
 */
export interface SubmitQueryResultDto {
  readonly id: string;
  readonly userId: string;
  readonly queryText: string;
  readonly status: string;
  readonly createdAt: Date;
}
