import { AggregateRoot } from '../../shared/base';
import {
  QueryText,
  QueryStatus,
  QueryStatusEnum,
  AIResponse,
  TokenUsage,
} from '../value-objects';
import {
  QuerySubmittedEvent,
  QueryProcessedEvent,
  QueryFailedEvent,
} from '../events';

interface LegalQueryProps {
  userId: string;
  queryText: QueryText;
  status: QueryStatus;
  response?: AIResponse;
  tokenUsage?: TokenUsage;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Legal Query Aggregate Root
 * Manages the lifecycle of AI-powered legal queries
 */
export class LegalQueryAggregate extends AggregateRoot<string> {
  private _userId: string;
  private _queryText: QueryText;
  private _status: QueryStatus;
  private _response?: AIResponse;
  private _tokenUsage?: TokenUsage;
  private _errorMessage?: string;
  private _metadata: Record<string, unknown>;

  private constructor(id: string, props: LegalQueryProps) {
    super(id);
    this._userId = props.userId;
    this._queryText = props.queryText;
    this._status = props.status;
    this._response = props.response;
    this._tokenUsage = props.tokenUsage;
    this._errorMessage = props.errorMessage;
    this._metadata = props.metadata || {};
  }

  // Getters
  get userId(): string {
    return this._userId;
  }

  get queryText(): QueryText {
    return this._queryText;
  }

  get status(): QueryStatus {
    return this._status;
  }

  get response(): AIResponse | undefined {
    return this._response;
  }

  get tokenUsage(): TokenUsage | undefined {
    return this._tokenUsage;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  // Factory method
  static submit(
    id: string,
    userId: string,
    queryText: string,
    metadata?: Record<string, unknown>,
  ): LegalQueryAggregate {
    const query = new LegalQueryAggregate(id, {
      userId,
      queryText: QueryText.create(queryText),
      status: QueryStatus.pending(),
      metadata,
    });

    query.addDomainEvent(
      new QuerySubmittedEvent({
        queryId: id,
        userId,
        queryText,
        submittedAt: query.createdAt,
      }),
    );

    return query;
  }

  // Reconstitute from persistence
  static reconstitute(
    id: string,
    userId: string,
    queryText: string,
    status: QueryStatusEnum,
    createdAt: Date,
    updatedAt: Date,
    response?: {
      content: string;
      confidence: number;
      tokensUsed: number;
      modelUsed: string;
      processingTimeMs: number;
      citations?: string[];
    },
    tokenUsage?: { promptTokens: number; completionTokens: number },
    errorMessage?: string,
    metadata?: Record<string, unknown>,
  ): LegalQueryAggregate {
    const query = new LegalQueryAggregate(id, {
      userId,
      queryText: QueryText.create(queryText),
      status: QueryStatus.create(status),
      response: response
        ? AIResponse.create(
            response.content,
            response.confidence,
            response.tokensUsed,
            response.modelUsed,
            response.processingTimeMs,
            response.citations,
          )
        : undefined,
      tokenUsage: tokenUsage
        ? TokenUsage.create(
            tokenUsage.promptTokens,
            tokenUsage.completionTokens,
          )
        : undefined,
      errorMessage,
      metadata,
    });
    query._createdAt = createdAt;
    query._updatedAt = updatedAt;
    return query;
  }

  // Business methods
  startProcessing(): void {
    if (!this._status.canTransitionTo(QueryStatusEnum.PROCESSING)) {
      throw new Error('Cannot start processing query in current status');
    }

    this._status = QueryStatus.processing();
    this.incrementVersion();
  }

  complete(
    content: string,
    confidence: number,
    tokensUsed: number,
    modelUsed: string,
    processingTimeMs: number,
    citations?: string[],
  ): void {
    if (!this._status.canTransitionTo(QueryStatusEnum.COMPLETED)) {
      throw new Error('Cannot complete query in current status');
    }

    this._response = AIResponse.create(
      content,
      confidence,
      tokensUsed,
      modelUsed,
      processingTimeMs,
      citations,
    );
    this._status = QueryStatus.completed();
    this.incrementVersion();

    this.addDomainEvent(
      new QueryProcessedEvent({
        queryId: this.id,
        userId: this._userId,
        tokensUsed,
        confidence,
        processingTimeMs,
        processedAt: this.updatedAt,
      }),
    );
  }

  fail(errorMessage: string, errorCode?: string): void {
    if (!this._status.canTransitionTo(QueryStatusEnum.FAILED)) {
      throw new Error('Cannot fail query in current status');
    }

    this._errorMessage = errorMessage;
    this._status = QueryStatus.failed();
    this.incrementVersion();

    this.addDomainEvent(
      new QueryFailedEvent({
        queryId: this.id,
        userId: this._userId,
        errorMessage,
        errorCode,
        failedAt: this.updatedAt,
      }),
    );
  }

  cancel(): void {
    if (!this._status.canTransitionTo(QueryStatusEnum.CANCELLED)) {
      throw new Error('Cannot cancel query in current status');
    }

    this._status = QueryStatus.create(QueryStatusEnum.CANCELLED);
    this.incrementVersion();
  }

  retry(): void {
    if (!this._status.canTransitionTo(QueryStatusEnum.PENDING)) {
      throw new Error('Cannot retry query in current status');
    }

    this._status = QueryStatus.pending();
    this._errorMessage = undefined;
    this.incrementVersion();
  }

  setTokenUsage(promptTokens: number, completionTokens: number): void {
    this._tokenUsage = TokenUsage.create(promptTokens, completionTokens);
    this.touch();
  }

  setMetadata(key: string, value: unknown): void {
    this._metadata[key] = value;
    this.touch();
  }
}
