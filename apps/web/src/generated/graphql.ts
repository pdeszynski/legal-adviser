import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { fetcher } from './graphql-fetcher';
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** Cursor for paging through collections */
  ConnectionCursor: { input: string; output: string };
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: Date; output: Date };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: unknown; output: unknown };
  /** `Date` type as integer. Type represents date and time as number of milliseconds from start of UNIX epoch. */
  Timestamp: { input: Date; output: Date };
};

export type ActivateUserInput = {
  userId: Scalars['ID']['input'];
};

export type AdvancedLegalRulingSearchResponse = {
  __typename?: 'AdvancedLegalRulingSearchResponse';
  /** Number of results returned */
  count: Scalars['Int']['output'];
  /** Whether there are more results */
  hasMore: Scalars['Boolean']['output'];
  /** Current offset */
  offset: Scalars['Int']['output'];
  /** Human-readable explanation of the search query that was executed */
  queryExplanation?: Maybe<Scalars['String']['output']>;
  /** Search results with relevance ranking */
  results: Array<AggregatedLegalRulingSearchResult>;
  /** Total number of matching results (for pagination) */
  totalCount: Scalars['Int']['output'];
};

export type AdvancedSearchLegalRulingsInput = {
  /** Filter by court type */
  courtType?: InputMaybe<CourtType>;
  /** Filter by ruling date from (ISO 8601 date string) */
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  /** Filter by ruling date to (ISO 8601 date string) */
  dateTo?: InputMaybe<Scalars['String']['input']>;
  /** Filter by keywords (must match all) */
  keywords?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Filter by legal area from metadata */
  legalArea?: InputMaybe<Scalars['String']['input']>;
  /** Maximum number of results to return (default: 20, max: 100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of results to skip for pagination */
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Array of search terms with operators and field specifications */
  searchTerms: Array<AdvancedSearchTermInput>;
  /** Sources to search (default: all sources) */
  sources?: InputMaybe<Array<SearchSource>>;
};

export type AdvancedSearchTermInput = {
  /** Field to search in (default: ALL) */
  field?: SearchField;
  /** Boolean operator to combine with previous term (default: AND) */
  operator?: BooleanOperator;
  /** Search term text */
  term: Scalars['String']['input'];
};

export type AggregatedLegalRulingSearchResponse = {
  __typename?: 'AggregatedLegalRulingSearchResponse';
  /** Number of results returned */
  count: Scalars['Int']['output'];
  /** Whether there are more results */
  hasMore: Scalars['Boolean']['output'];
  /** Current offset */
  offset: Scalars['Int']['output'];
  /** Search results with relevance ranking from multiple sources */
  results: Array<AggregatedLegalRulingSearchResult>;
  /** Total number of matching results (for pagination) */
  totalCount: Scalars['Int']['output'];
};

export type AggregatedLegalRulingSearchResult = {
  __typename?: 'AggregatedLegalRulingSearchResult';
  /** Highlighted snippet of matching content */
  headline?: Maybe<Scalars['String']['output']>;
  /** Relevance score (higher is better) */
  rank: Scalars['Float']['output'];
  /** The matching legal ruling */
  ruling: LegalRuling;
  /** Source of the result */
  source: SearchSource;
};

export type AggregatedSearchLegalRulingsInput = {
  /** Filter by court type */
  courtType?: InputMaybe<CourtType>;
  /** Filter by ruling date from (ISO 8601 date string) */
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  /** Filter by ruling date to (ISO 8601 date string) */
  dateTo?: InputMaybe<Scalars['String']['input']>;
  /** Maximum number of results to return (default: 20, max: 100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of results to skip for pagination */
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Search query text */
  query: Scalars['String']['input'];
  /** Sources to search (default: all sources) */
  sources?: InputMaybe<Array<SearchSource>>;
};

/** Available AI models for legal operations */
export type AiModelType =
  | 'CLAUDE_3_OPUS'
  | 'CLAUDE_3_SONNET'
  | 'GPT_3_5_TURBO'
  | 'GPT_4'
  | 'GPT_4_TURBO';

export type AiModelTypeFilterComparison = {
  eq?: InputMaybe<AiModelType>;
  gt?: InputMaybe<AiModelType>;
  gte?: InputMaybe<AiModelType>;
  iLike?: InputMaybe<AiModelType>;
  in?: InputMaybe<Array<AiModelType>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<AiModelType>;
  lt?: InputMaybe<AiModelType>;
  lte?: InputMaybe<AiModelType>;
  neq?: InputMaybe<AiModelType>;
  notILike?: InputMaybe<AiModelType>;
  notIn?: InputMaybe<Array<AiModelType>>;
  notLike?: InputMaybe<AiModelType>;
};

export type AiOperationBreakdown = {
  __typename?: 'AiOperationBreakdown';
  /** Percentage of total cost */
  costPercentage: Scalars['Float']['output'];
  operationType: Scalars['String']['output'];
  requestCount: Scalars['Int']['output'];
  totalCost: Scalars['Float']['output'];
  totalTokens: Scalars['Int']['output'];
};

export type AiOperationType =
  | 'CASE_CLASSIFICATION'
  | 'DOCUMENT_GENERATION'
  | 'EMBEDDING_GENERATION'
  | 'QUESTION_ANSWERING'
  | 'RAG_QUESTION_ANSWERING'
  | 'RULING_SEARCH'
  | 'SEMANTIC_SEARCH';

export type AiUsageMetrics = {
  __typename?: 'AiUsageMetrics';
  /** Average cost per request */
  avgCostPerRequest: Scalars['Float']['output'];
  /** Average tokens per request */
  avgTokensPerRequest: Scalars['Int']['output'];
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  /** Total cost in USD */
  totalCost: Scalars['Float']['output'];
  totalRequests: Scalars['Int']['output'];
  totalTokens: Scalars['Int']['output'];
};

export type AiUsageRecord = {
  __typename?: 'AiUsageRecord';
  costCalculated: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  metadata?: Maybe<Scalars['String']['output']>;
  operationType: AiOperationType;
  requestCount: Scalars['Float']['output'];
  resourceId?: Maybe<Scalars['ID']['output']>;
  tokensUsed: Scalars['Float']['output'];
  userId: Scalars['String']['output'];
};

export type AnalysisMetadata = {
  __typename?: 'AnalysisMetadata';
  analysisVersion?: Maybe<Scalars['String']['output']>;
  modelUsed?: Maybe<Scalars['String']['output']>;
  processingTimeMs?: Maybe<Scalars['Float']['output']>;
};

export type AnalysisMetadataInput = {
  analysisVersion?: InputMaybe<Scalars['String']['input']>;
  modelUsed?: InputMaybe<Scalars['String']['input']>;
  processingTimeMs?: InputMaybe<Scalars['Float']['input']>;
};

/** Status of the legal analysis process */
export type AnalysisStatus = 'COMPLETED' | 'FAILED' | 'PENDING' | 'PROCESSING';

export type AnalysisStatusFilterComparison = {
  eq?: InputMaybe<AnalysisStatus>;
  gt?: InputMaybe<AnalysisStatus>;
  gte?: InputMaybe<AnalysisStatus>;
  iLike?: InputMaybe<AnalysisStatus>;
  in?: InputMaybe<Array<AnalysisStatus>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<AnalysisStatus>;
  lt?: InputMaybe<AnalysisStatus>;
  lte?: InputMaybe<AnalysisStatus>;
  neq?: InputMaybe<AnalysisStatus>;
  notILike?: InputMaybe<AnalysisStatus>;
  notIn?: InputMaybe<Array<AnalysisStatus>>;
  notLike?: InputMaybe<AnalysisStatus>;
};

export type AnalyticsDashboard = {
  __typename?: 'AnalyticsDashboard';
  aiOperationBreakdown: Array<AiOperationBreakdown>;
  aiUsage: AiUsageMetrics;
  documentTypeDistribution: Array<DocumentTypeDistribution>;
  documents: DocumentMetrics;
  generatedAt: Scalars['DateTime']['output'];
  queries: QueryMetrics;
  systemHealth: SystemHealthMetrics;
  userGrowth: UserGrowthMetrics;
};

/** Time period granularity for analytics data */
export type AnalyticsPeriod = 'DAILY' | 'HOURLY' | 'MONTHLY' | 'WEEKLY' | 'YEARLY';

export type AnswerLegalQueryInput = {
  /** The AI-generated answer in Markdown format */
  answerMarkdown: Scalars['String']['input'];
  /** Citations and references for the answer */
  citations?: InputMaybe<Array<CreateCitationInput>>;
};

export type ApiKey = {
  __typename?: 'ApiKey';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  keyPrefix: Scalars['String']['output'];
  lastUsedAt?: Maybe<Scalars['DateTime']['output']>;
  lastUsedIp?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  rateLimitPerMinute?: Maybe<Scalars['Int']['output']>;
  scopes: Array<ApiKeyScope>;
  status: ApiKeyStatus;
  updatedAt: Scalars['DateTime']['output'];
  usageCount: Scalars['Float']['output'];
  userId: Scalars['String']['output'];
};

/** API key scopes/permissions */
export type ApiKeyScope =
  | 'AI_ANALYZE'
  | 'AI_GENERATE'
  | 'DOCUMENTS_DELETE'
  | 'DOCUMENTS_READ'
  | 'DOCUMENTS_WRITE'
  | 'PROFILE_READ'
  | 'PROFILE_WRITE'
  | 'QUERIES_DELETE'
  | 'QUERIES_READ'
  | 'QUERIES_WRITE'
  | 'RULINGS_READ'
  | 'RULINGS_SEARCH'
  | 'TEMPLATES_READ'
  | 'TEMPLATES_WRITE';

/** API key status */
export type ApiKeyStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export type ApproveDocumentInput = {
  /** Document ID to approve */
  documentId: Scalars['ID']['input'];
  /** Optional reason for approval */
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type AskLegalQuestionInput = {
  /** Response mode: LAWYER (detailed legal analysis) or SIMPLE (layperson-friendly) */
  mode?: InputMaybe<Scalars['String']['input']>;
  /** The legal question to ask the AI */
  question: Scalars['String']['input'];
  /** Session ID for the user asking the question (optional - will be auto-created if not provided) */
  sessionId?: InputMaybe<Scalars['String']['input']>;
};

/** Type of action performed */
export type AuditActionType =
  | 'CREATE'
  | 'DELETE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'READ'
  | 'UPDATE';

export type AuditActionTypeFilterComparison = {
  eq?: InputMaybe<AuditActionType>;
  gt?: InputMaybe<AuditActionType>;
  gte?: InputMaybe<AuditActionType>;
  iLike?: InputMaybe<AuditActionType>;
  in?: InputMaybe<Array<AuditActionType>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<AuditActionType>;
  lt?: InputMaybe<AuditActionType>;
  lte?: InputMaybe<AuditActionType>;
  neq?: InputMaybe<AuditActionType>;
  notILike?: InputMaybe<AuditActionType>;
  notIn?: InputMaybe<Array<AuditActionType>>;
  notLike?: InputMaybe<AuditActionType>;
};

export type AuditLog = {
  __typename?: 'AuditLog';
  action: AuditActionType;
  changeDetails?: Maybe<Scalars['JSON']['output']>;
  createdAt: Scalars['DateTime']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  resourceId?: Maybe<Scalars['String']['output']>;
  resourceType: AuditResourceType;
  statusCode?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userAgent?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type AuditLogAggregateFilter = {
  action?: InputMaybe<AuditActionTypeFilterComparison>;
  and?: InputMaybe<Array<AuditLogAggregateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  ipAddress?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<AuditLogAggregateFilter>>;
  resourceId?: InputMaybe<StringFieldComparison>;
  resourceType?: InputMaybe<AuditResourceTypeFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type AuditLogAggregateGroupBy = {
  __typename?: 'AuditLogAggregateGroupBy';
  action?: Maybe<AuditActionType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  ipAddress?: Maybe<Scalars['String']['output']>;
  resourceId?: Maybe<Scalars['String']['output']>;
  resourceType?: Maybe<AuditResourceType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type AuditLogAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type AuditLogAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type AuditLogAggregateResponse = {
  __typename?: 'AuditLogAggregateResponse';
  count?: Maybe<AuditLogCountAggregate>;
  groupBy?: Maybe<AuditLogAggregateGroupBy>;
  max?: Maybe<AuditLogMaxAggregate>;
  min?: Maybe<AuditLogMinAggregate>;
};

export type AuditLogConnection = {
  __typename?: 'AuditLogConnection';
  /** Array of edges. */
  edges: Array<AuditLogEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type AuditLogCountAggregate = {
  __typename?: 'AuditLogCountAggregate';
  action?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  ipAddress?: Maybe<Scalars['Int']['output']>;
  resourceId?: Maybe<Scalars['Int']['output']>;
  resourceType?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
  userId?: Maybe<Scalars['Int']['output']>;
};

export type AuditLogEdge = {
  __typename?: 'AuditLogEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the AuditLog */
  node: AuditLog;
};

export type AuditLogFilter = {
  action?: InputMaybe<AuditActionTypeFilterComparison>;
  and?: InputMaybe<Array<AuditLogFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  ipAddress?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<AuditLogFilter>>;
  resourceId?: InputMaybe<StringFieldComparison>;
  resourceType?: InputMaybe<AuditResourceTypeFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type AuditLogMaxAggregate = {
  __typename?: 'AuditLogMaxAggregate';
  action?: Maybe<AuditActionType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  ipAddress?: Maybe<Scalars['String']['output']>;
  resourceId?: Maybe<Scalars['String']['output']>;
  resourceType?: Maybe<AuditResourceType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type AuditLogMinAggregate = {
  __typename?: 'AuditLogMinAggregate';
  action?: Maybe<AuditActionType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  ipAddress?: Maybe<Scalars['String']['output']>;
  resourceId?: Maybe<Scalars['String']['output']>;
  resourceType?: Maybe<AuditResourceType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type AuditLogSort = {
  direction: SortDirection;
  field: AuditLogSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type AuditLogSortFields =
  | 'action'
  | 'createdAt'
  | 'id'
  | 'ipAddress'
  | 'resourceId'
  | 'resourceType'
  | 'updatedAt'
  | 'userId';

/** Type of resource affected */
export type AuditResourceType = 'DOCUMENT' | 'SESSION' | 'SYSTEM' | 'USER';

export type AuditResourceTypeFilterComparison = {
  eq?: InputMaybe<AuditResourceType>;
  gt?: InputMaybe<AuditResourceType>;
  gte?: InputMaybe<AuditResourceType>;
  iLike?: InputMaybe<AuditResourceType>;
  in?: InputMaybe<Array<AuditResourceType>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<AuditResourceType>;
  lt?: InputMaybe<AuditResourceType>;
  lte?: InputMaybe<AuditResourceType>;
  neq?: InputMaybe<AuditResourceType>;
  notILike?: InputMaybe<AuditResourceType>;
  notIn?: InputMaybe<Array<AuditResourceType>>;
  notLike?: InputMaybe<AuditResourceType>;
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  /** JWT access token */
  accessToken: Scalars['String']['output'];
  /** JWT refresh token for obtaining new access tokens */
  refreshToken: Scalars['String']['output'];
  /** Authenticated user information */
  user: AuthUser;
};

export type AuthUser = {
  __typename?: 'AuthUser';
  disclaimerAccepted: Scalars['Boolean']['output'];
  disclaimerAcceptedAt?: Maybe<Scalars['DateTime']['output']>;
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

export type Backup = {
  __typename?: 'Backup';
  createdAt?: Maybe<Scalars['Timestamp']['output']>;
  expiresAt?: Maybe<Scalars['Timestamp']['output']>;
  filename: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isRestored: Scalars['Boolean']['output'];
  metadata?: Maybe<BackupMetadata>;
  restoreDate?: Maybe<Scalars['Timestamp']['output']>;
  sizeBytes: Scalars['Int']['output'];
  /** Size in human-readable format (MB) */
  sizeMB: Scalars['Float']['output'];
  status: Scalars['String']['output'];
  storagePath?: Maybe<Scalars['String']['output']>;
  storageType: Scalars['String']['output'];
};

export type BackupMetadata = {
  __typename?: 'BackupMetadata';
  compression?: Maybe<Scalars['String']['output']>;
  database: Scalars['String']['output'];
  host: Scalars['String']['output'];
  pgVersion?: Maybe<Scalars['String']['output']>;
};

export type BackupStats = {
  __typename?: 'BackupStats';
  activeBackups: Scalars['Int']['output'];
  failedBackups: Scalars['Int']['output'];
  lastBackupDate?: Maybe<Scalars['Timestamp']['output']>;
  lastSuccessfulBackupDate?: Maybe<Scalars['Timestamp']['output']>;
  successfulBackups: Scalars['Int']['output'];
  totalBackups: Scalars['Int']['output'];
  totalSizeMB: Scalars['Float']['output'];
};

export type BillingInfo = {
  __typename?: 'BillingInfo';
  cancelAtPeriodEnd: Scalars['Boolean']['output'];
  currentPeriodEnd: Scalars['String']['output'];
  currentPeriodStart: Scalars['String']['output'];
  daysRemaining: Scalars['Int']['output'];
  nextBillingAmount?: Maybe<Scalars['String']['output']>;
  paymentHistory: Array<PaymentHistoryItem>;
  paymentMethods?: Maybe<Array<PaymentMethodInfo>>;
  planName: Scalars['String']['output'];
  planTier: PlanTier;
  status: SubscriptionStatus;
  subscriptionId: Scalars['ID']['output'];
  usage: Scalars['String']['output'];
};

/** Billing interval options */
export type BillingInterval = 'MONTHLY' | 'YEARLY';

export type BooleanFieldComparison = {
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean operators for combining search terms */
export type BooleanOperator = 'AND' | 'NOT' | 'OR';

export type BulkSendNotificationInput = {
  /** Channel to send notification through */
  channel?: InputMaybe<NotificationChannel>;
  /** Custom message override */
  customMessage?: InputMaybe<Scalars['String']['input']>;
  /** Data for template rendering (JSON string) */
  templateData?: InputMaybe<Scalars['String']['input']>;
  /** Type of notification template to use */
  templateType: NotificationTemplateType;
  /** List of user IDs */
  userIds: Array<Scalars['String']['input']>;
};

export type BulkSendNotificationResponse = {
  __typename?: 'BulkSendNotificationResponse';
  /** Number of failed notifications */
  failed: Scalars['Int']['output'];
  /** List of user IDs that failed */
  failedUserIds?: Maybe<Array<Scalars['String']['output']>>;
  /** Number of successful notifications */
  successful: Scalars['Int']['output'];
  /** Total number of notifications sent */
  totalSent: Scalars['Int']['output'];
};

export type BulkUpdateSettingsInput = {
  settings: Array<SystemSettingInput>;
};

export type CancelSubscriptionInput = {
  immediately?: Scalars['Boolean']['input'];
};

export type ChangePasswordInput = {
  /** Current password */
  currentPassword: Scalars['String']['input'];
  /** New password */
  newPassword: Scalars['String']['input'];
};

export type ChangeUserRoleInput = {
  role: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type CheckQuotaInput = {
  amount?: InputMaybe<Scalars['Int']['input']>;
  quotaKey: Scalars['String']['input'];
};

export type CheckQuotaResponse = {
  __typename?: 'CheckQuotaResponse';
  allowed: Scalars['Boolean']['output'];
  limit: Scalars['Int']['output'];
  message?: Maybe<Scalars['String']['output']>;
  remaining: Scalars['Int']['output'];
};

export type Citation = {
  __typename?: 'Citation';
  article?: Maybe<Scalars['String']['output']>;
  excerpt?: Maybe<Scalars['String']['output']>;
  source: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type ClassifyCaseInput = {
  /** Detailed description of the legal case to analyze */
  caseDescription: Scalars['String']['input'];
  /** Additional context for the analysis */
  context?: InputMaybe<Scalars['String']['input']>;
  /** User session ID for tracking */
  sessionId: Scalars['String']['input'];
  /** Title or brief summary of the analysis */
  title: Scalars['String']['input'];
};

export type CommentPosition = {
  __typename?: 'CommentPosition';
  endOffset: Scalars['Float']['output'];
  section?: Maybe<Scalars['String']['output']>;
  startOffset: Scalars['Float']['output'];
  text?: Maybe<Scalars['String']['output']>;
};

/** Resolution status of a document comment */
export type CommentResolutionStatus = 'OPEN' | 'RESOLVED';

export type CommentResolutionStatusFilterComparison = {
  eq?: InputMaybe<CommentResolutionStatus>;
  gt?: InputMaybe<CommentResolutionStatus>;
  gte?: InputMaybe<CommentResolutionStatus>;
  iLike?: InputMaybe<CommentResolutionStatus>;
  in?: InputMaybe<Array<CommentResolutionStatus>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<CommentResolutionStatus>;
  lt?: InputMaybe<CommentResolutionStatus>;
  lte?: InputMaybe<CommentResolutionStatus>;
  neq?: InputMaybe<CommentResolutionStatus>;
  notILike?: InputMaybe<CommentResolutionStatus>;
  notIn?: InputMaybe<Array<CommentResolutionStatus>>;
  notLike?: InputMaybe<CommentResolutionStatus>;
};

export type ConditionalSectionInput = {
  condition: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
};

/** Type/level of court that issued the ruling */
export type CourtType =
  | 'ADMINISTRATIVE_COURT'
  | 'APPELLATE_COURT'
  | 'CONSTITUTIONAL_TRIBUNAL'
  | 'DISTRICT_COURT'
  | 'OTHER'
  | 'REGIONAL_COURT'
  | 'SUPREME_COURT';

export type CourtTypeFilterComparison = {
  eq?: InputMaybe<CourtType>;
  gt?: InputMaybe<CourtType>;
  gte?: InputMaybe<CourtType>;
  iLike?: InputMaybe<CourtType>;
  in?: InputMaybe<Array<CourtType>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<CourtType>;
  lt?: InputMaybe<CourtType>;
  lte?: InputMaybe<CourtType>;
  neq?: InputMaybe<CourtType>;
  notILike?: InputMaybe<CourtType>;
  notIn?: InputMaybe<Array<CourtType>>;
  notLike?: InputMaybe<CourtType>;
};

export type CreateAiUsageRecordInput = {
  metadata?: InputMaybe<Scalars['String']['input']>;
  operationType: AiOperationType;
  requestCount?: InputMaybe<Scalars['Int']['input']>;
  resourceId?: InputMaybe<Scalars['ID']['input']>;
  tokensUsed: Scalars['Int']['input'];
};

export type CreateApiKeyInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  rateLimitPerMinute?: InputMaybe<Scalars['Int']['input']>;
  scopes: Array<ApiKeyScope>;
};

export type CreateApiKeyResponse = {
  __typename?: 'CreateApiKeyResponse';
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  keyPrefix: Scalars['String']['output'];
  name: Scalars['String']['output'];
  rateLimitPerMinute: Scalars['Int']['output'];
  rawKey: Scalars['String']['output'];
  scopes: Array<ApiKeyScope>;
  status: ApiKeyStatus;
  updatedAt: Scalars['String']['output'];
};

export type CreateBackupInput = {
  /** Description of the backup */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Optional custom name for the backup */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Tags for the backup */
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CreateCitationInput = {
  article?: InputMaybe<Scalars['String']['input']>;
  excerpt?: InputMaybe<Scalars['String']['input']>;
  source: Scalars['String']['input'];
  url?: InputMaybe<Scalars['String']['input']>;
};

export type CreateCommentPositionInput = {
  endOffset: Scalars['Float']['input'];
  section?: InputMaybe<Scalars['String']['input']>;
  startOffset: Scalars['Float']['input'];
  text?: InputMaybe<Scalars['String']['input']>;
};

export type CreateDocumentCommentInput = {
  authorId: Scalars['String']['input'];
  documentId: Scalars['String']['input'];
  position: CreateCommentPositionInput;
  resolutionStatus?: InputMaybe<CommentResolutionStatus>;
  text: Scalars['String']['input'];
};

export type CreateDocumentMetadataInput = {
  claimAmount?: InputMaybe<Scalars['Float']['input']>;
  claimCurrency?: InputMaybe<Scalars['String']['input']>;
  defendantName?: InputMaybe<Scalars['String']['input']>;
  plaintiffName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateDocumentTemplateInput = {
  category: TemplateCategory;
  conditionalSections?: InputMaybe<Array<ConditionalSectionInput>>;
  content: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  polishFormattingRules?: InputMaybe<PolishFormattingRulesInput>;
  variables: Array<TemplateVariableInput>;
};

export type CreateDocumentVersionInput = {
  authorUserId?: InputMaybe<Scalars['ID']['input']>;
  changeDescription?: InputMaybe<Scalars['String']['input']>;
  contentSnapshot: Scalars['String']['input'];
  documentId: Scalars['ID']['input'];
  sessionId: Scalars['ID']['input'];
};

export type CreateInAppNotificationInput = {
  /** Optional action label for the action link button */
  actionLabel?: InputMaybe<Scalars['String']['input']>;
  /** Optional action link for navigation (e.g., /documents/123) */
  actionLink?: InputMaybe<Scalars['String']['input']>;
  /** The notification message content */
  message: Scalars['String']['input'];
  /** Additional metadata for extensibility (JSON string) */
  metadata?: InputMaybe<Scalars['String']['input']>;
  /** Read status - defaults to false (unread) */
  read?: InputMaybe<Scalars['Boolean']['input']>;
  /** Type of notification for UI styling */
  type?: InputMaybe<Scalars['String']['input']>;
  /** User ID to receive the notification */
  userId: Scalars['String']['input'];
};

export type CreateLegalAnalysisInput = {
  identifiedGrounds?: InputMaybe<Array<LegalGroundInput>>;
  inputDescription: Scalars['String']['input'];
  metadata?: InputMaybe<AnalysisMetadataInput>;
  relatedDocumentLinks?: InputMaybe<Array<RelatedDocumentLinkInput>>;
  sessionId: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateLegalDocumentInput = {
  metadata?: InputMaybe<CreateDocumentMetadataInput>;
  sessionId: Scalars['String']['input'];
  title: Scalars['String']['input'];
  type?: DocumentType;
};

export type CreateLegalDocumentInputV2 = {
  content: Scalars['String']['input'];
  documentType: DocumentTypeV2;
  /** JSON metadata as string */
  metadataJson?: InputMaybe<Scalars['String']['input']>;
  ownerId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type CreateLegalQueryInput = {
  answerMarkdown?: InputMaybe<Scalars['String']['input']>;
  citations?: InputMaybe<Array<CreateCitationInput>>;
  question: Scalars['String']['input'];
  sessionId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateLegalRulingInput = {
  courtName: Scalars['String']['input'];
  courtType?: CourtType;
  fullText?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<CreateRulingMetadataInput>;
  rulingDate: Scalars['String']['input'];
  signature: Scalars['String']['input'];
  summary?: InputMaybe<Scalars['String']['input']>;
};

export type CreateNotificationInput = {
  /** Error message if sending failed */
  errorMessage?: InputMaybe<Scalars['String']['input']>;
  /** SendGrid message ID */
  messageId?: InputMaybe<Scalars['String']['input']>;
  /** Additional metadata (JSON string) */
  metadata?: InputMaybe<Scalars['String']['input']>;
  /** Recipient email address */
  recipientEmail: Scalars['String']['input'];
  /** Timestamp when email was sent */
  sentAt?: InputMaybe<Scalars['String']['input']>;
  /** Notification status */
  status?: InputMaybe<NotificationStatus>;
  /** Email subject line */
  subject: Scalars['String']['input'];
  /** Email template type */
  template: EmailTemplateType;
  /** Template data for rendering (JSON string) */
  templateData?: InputMaybe<Scalars['String']['input']>;
  /** User ID (if notification is for a registered user) */
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateOneDocumentCommentInput = {
  /** The record to create */
  documentComment: CreateDocumentCommentInput;
};

export type CreateOneDocumentTemplateInput = {
  /** The record to create */
  documentTemplate: CreateDocumentTemplateInput;
};

export type CreateOneDocumentVersionInput = {
  /** The record to create */
  documentVersion: CreateDocumentVersionInput;
};

export type CreateOneInAppNotificationInput = {
  /** The record to create */
  inAppNotification: CreateInAppNotificationInput;
};

export type CreateOneLegalAnalysisInput = {
  /** The record to create */
  legalAnalysis: CreateLegalAnalysisInput;
};

export type CreateOneLegalDocumentInput = {
  /** The record to create */
  legalDocument: CreateLegalDocumentInput;
};

export type CreateOneLegalQueryInput = {
  /** The record to create */
  legalQuery: CreateLegalQueryInput;
};

export type CreateOneLegalRulingInput = {
  /** The record to create */
  legalRuling: CreateLegalRulingInput;
};

export type CreateOneNotificationInput = {
  /** The record to create */
  notification: CreateNotificationInput;
};

export type CreateOneUserInput = {
  /** The record to create */
  user: CreateUserInput;
};

export type CreateOneUserPreferencesInput = {
  /** The record to create */
  userPreferences: CreateUserPreferencesInput;
};

export type CreateRulingMetadataInput = {
  keywords?: InputMaybe<Array<Scalars['String']['input']>>;
  legalArea?: InputMaybe<Scalars['String']['input']>;
  relatedCases?: InputMaybe<Array<Scalars['String']['input']>>;
  sourceReference?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSubscriptionPlanInput = {
  billingInterval?: InputMaybe<BillingInterval>;
  description?: InputMaybe<Scalars['String']['input']>;
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  features: Scalars['String']['input'];
  maxUsers?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  price: Scalars['Int']['input'];
  stripePriceId?: InputMaybe<Scalars['String']['input']>;
  stripeYearlyPriceId?: InputMaybe<Scalars['String']['input']>;
  tier: PlanTier;
  trialDays?: InputMaybe<Scalars['Int']['input']>;
  yearlyDiscount?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateTemplateInput = {
  category: TemplateCategory;
  conditionalSections?: InputMaybe<Scalars['JSON']['input']>;
  content: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  polishFormattingRules?: InputMaybe<Scalars['JSON']['input']>;
  variables: Scalars['JSON']['input'];
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  firstName?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type CreateUserPreferencesInput = {
  aiModel?: InputMaybe<AiModelType>;
  dateFormat?: InputMaybe<Scalars['String']['input']>;
  emailNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  inAppNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  notificationPreferences?: InputMaybe<NotificationPreferencesInput>;
  theme?: InputMaybe<ThemePreference>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};

export type CreateUserSubscriptionInput = {
  planId: Scalars['ID']['input'];
  stripeCustomerId?: InputMaybe<Scalars['String']['input']>;
  stripeSubscriptionId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateWebhookInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  events: Array<WebhookEvent>;
  headers?: InputMaybe<Scalars['String']['input']>;
  maxRetries?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  timeoutMs?: InputMaybe<Scalars['Int']['input']>;
  url: Scalars['String']['input'];
};

export type CreateWebhookResponse = {
  __typename?: 'CreateWebhookResponse';
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  events: Array<WebhookEvent>;
  failureCount: Scalars['Int']['output'];
  headers?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastDeliveryAt?: Maybe<Scalars['String']['output']>;
  lastSuccessAt?: Maybe<Scalars['String']['output']>;
  maxRetries: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  secret: Scalars['String']['output'];
  status: WebhookStatus;
  successCount: Scalars['Int']['output'];
  timeoutMs: Scalars['Int']['output'];
  updatedAt: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type CursorEventPayload = {
  __typename?: 'CursorEventPayload';
  color?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  position: Scalars['Float']['output'];
  selectionLength: Scalars['Float']['output'];
  timestamp: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
  userName: Scalars['String']['output'];
};

export type CursorPaging = {
  /** Paginate after opaque cursor */
  after?: InputMaybe<Scalars['ConnectionCursor']['input']>;
  /** Paginate before opaque cursor */
  before?: InputMaybe<Scalars['ConnectionCursor']['input']>;
  /** Paginate first */
  first?: InputMaybe<Scalars['Int']['input']>;
  /** Paginate last */
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type DailyUsage = {
  __typename?: 'DailyUsage';
  date: Scalars['DateTime']['output'];
  totalCost: Scalars['Float']['output'];
  totalRequests: Scalars['Int']['output'];
  totalTokens: Scalars['Int']['output'];
};

export type DailyUsageResponse = {
  __typename?: 'DailyUsageResponse';
  dailyUsage: Array<DailyUsage>;
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  totalCost: Scalars['Float']['output'];
  totalRequests: Scalars['Int']['output'];
  totalTokens: Scalars['Int']['output'];
};

export type DashboardAnalyticsInput = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  period?: InputMaybe<AnalyticsPeriod>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type DateFieldComparison = {
  between?: InputMaybe<DateFieldComparisonBetween>;
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  neq?: InputMaybe<Scalars['DateTime']['input']>;
  notBetween?: InputMaybe<DateFieldComparisonBetween>;
  notIn?: InputMaybe<Array<Scalars['DateTime']['input']>>;
};

export type DateFieldComparisonBetween = {
  lower: Scalars['DateTime']['input'];
  upper: Scalars['DateTime']['input'];
};

export type DeleteDocumentInputV2 = {
  deletedBy: Scalars['ID']['input'];
  documentId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteOneDocumentCommentInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneDocumentTemplateInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneInAppNotificationInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneLegalAnalysisInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneLegalDocumentInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneLegalQueryInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneLegalRulingInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneUserInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneUserPreferencesInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneUserSessionInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

/** Webhook delivery status */
export type DeliveryStatus = 'FAILED' | 'PENDING' | 'RETRYING' | 'SUCCESS';

export type DocumentComment = {
  __typename?: 'DocumentComment';
  author: User;
  authorId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  document: LegalDocument;
  documentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  position: CommentPosition;
  resolutionStatus: CommentResolutionStatus;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  resolvedBy?: Maybe<Scalars['ID']['output']>;
  text: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type DocumentCommentAggregateFilter = {
  and?: InputMaybe<Array<DocumentCommentAggregateFilter>>;
  authorId?: InputMaybe<StringFieldComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  documentId?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<DocumentCommentAggregateFilter>>;
  resolutionStatus?: InputMaybe<CommentResolutionStatusFilterComparison>;
  resolvedBy?: InputMaybe<IdFilterComparison>;
  text?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type DocumentCommentAggregateGroupBy = {
  __typename?: 'DocumentCommentAggregateGroupBy';
  authorId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  resolutionStatus?: Maybe<CommentResolutionStatus>;
  resolvedBy?: Maybe<Scalars['ID']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DocumentCommentAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type DocumentCommentAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type DocumentCommentAggregateResponse = {
  __typename?: 'DocumentCommentAggregateResponse';
  count?: Maybe<DocumentCommentCountAggregate>;
  groupBy?: Maybe<DocumentCommentAggregateGroupBy>;
  max?: Maybe<DocumentCommentMaxAggregate>;
  min?: Maybe<DocumentCommentMinAggregate>;
};

export type DocumentCommentConnection = {
  __typename?: 'DocumentCommentConnection';
  /** Array of edges. */
  edges: Array<DocumentCommentEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type DocumentCommentCountAggregate = {
  __typename?: 'DocumentCommentCountAggregate';
  authorId?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['Int']['output']>;
  documentId?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  resolutionStatus?: Maybe<Scalars['Int']['output']>;
  resolvedBy?: Maybe<Scalars['Int']['output']>;
  text?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type DocumentCommentDeleteResponse = {
  __typename?: 'DocumentCommentDeleteResponse';
  authorId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  position?: Maybe<CommentPosition>;
  resolutionStatus?: Maybe<CommentResolutionStatus>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  resolvedBy?: Maybe<Scalars['ID']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DocumentCommentEdge = {
  __typename?: 'DocumentCommentEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the DocumentComment */
  node: DocumentComment;
};

export type DocumentCommentFilter = {
  and?: InputMaybe<Array<DocumentCommentFilter>>;
  authorId?: InputMaybe<StringFieldComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  documentId?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<DocumentCommentFilter>>;
  resolutionStatus?: InputMaybe<CommentResolutionStatusFilterComparison>;
  resolvedBy?: InputMaybe<IdFilterComparison>;
  text?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type DocumentCommentMaxAggregate = {
  __typename?: 'DocumentCommentMaxAggregate';
  authorId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  resolutionStatus?: Maybe<CommentResolutionStatus>;
  resolvedBy?: Maybe<Scalars['ID']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DocumentCommentMinAggregate = {
  __typename?: 'DocumentCommentMinAggregate';
  authorId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  resolutionStatus?: Maybe<CommentResolutionStatus>;
  resolvedBy?: Maybe<Scalars['ID']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DocumentCommentSort = {
  direction: SortDirection;
  field: DocumentCommentSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type DocumentCommentSortFields =
  | 'authorId'
  | 'createdAt'
  | 'documentId'
  | 'id'
  | 'resolutionStatus'
  | 'resolvedBy'
  | 'text'
  | 'updatedAt';

export type DocumentEditEventPayload = {
  __typename?: 'DocumentEditEventPayload';
  documentId: Scalars['ID']['output'];
  operation: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
  userName: Scalars['String']['output'];
  version: Scalars['Float']['output'];
};

export type DocumentMetadata = {
  __typename?: 'DocumentMetadata';
  claimAmount?: Maybe<Scalars['Float']['output']>;
  claimCurrency?: Maybe<Scalars['String']['output']>;
  defendantName?: Maybe<Scalars['String']['output']>;
  plaintiffName?: Maybe<Scalars['String']['output']>;
};

export type DocumentMetadataInput = {
  claimAmount?: InputMaybe<Scalars['Float']['input']>;
  claimCurrency?: InputMaybe<Scalars['String']['input']>;
  defendantName?: InputMaybe<Scalars['String']['input']>;
  plaintiffName?: InputMaybe<Scalars['String']['input']>;
};

export type DocumentMetrics = {
  __typename?: 'DocumentMetrics';
  completedDocuments: Scalars['Int']['output'];
  draftDocuments: Scalars['Int']['output'];
  failedDocuments: Scalars['Int']['output'];
  /** Documents currently generating */
  generatingDocuments: Scalars['Int']['output'];
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  /** Success rate as percentage */
  successRate: Scalars['Float']['output'];
  totalDocuments: Scalars['Int']['output'];
};

export type DocumentShare = {
  __typename?: 'DocumentShare';
  createdAt: Scalars['DateTime']['output'];
  documentId: Scalars['String']['output'];
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  permission: SharePermission;
  sharedByUserId: Scalars['String']['output'];
  sharedWithUserId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Status of document generation */
export type DocumentStatus = 'COMPLETED' | 'DRAFT' | 'FAILED' | 'GENERATING';

export type DocumentStatusChange = {
  __typename?: 'DocumentStatusChange';
  /** ID of the document */
  documentId: Scalars['String']['output'];
  /** Error message if status is FAILED */
  error?: Maybe<Scalars['String']['output']>;
  /** Optional message describing the status change */
  message?: Maybe<Scalars['String']['output']>;
  /** New status after the change */
  newStatus: DocumentStatus;
  /** Previous status before the change */
  previousStatus: DocumentStatus;
  /** ID of the session */
  sessionId: Scalars['String']['output'];
  /** ISO timestamp of the status change */
  timestamp: Scalars['String']['output'];
};

export type DocumentStatusFilterComparison = {
  eq?: InputMaybe<DocumentStatus>;
  gt?: InputMaybe<DocumentStatus>;
  gte?: InputMaybe<DocumentStatus>;
  iLike?: InputMaybe<DocumentStatus>;
  in?: InputMaybe<Array<DocumentStatus>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<DocumentStatus>;
  lt?: InputMaybe<DocumentStatus>;
  lte?: InputMaybe<DocumentStatus>;
  neq?: InputMaybe<DocumentStatus>;
  notILike?: InputMaybe<DocumentStatus>;
  notIn?: InputMaybe<Array<DocumentStatus>>;
  notLike?: InputMaybe<DocumentStatus>;
};

/** Status of the document lifecycle */
export type DocumentStatusV2 =
  | 'APPROVED'
  | 'ARCHIVED'
  | 'DELETED'
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED';

export type DocumentTemplate = {
  __typename?: 'DocumentTemplate';
  category: TemplateCategory;
  conditionalSections?: Maybe<Scalars['JSON']['output']>;
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  polishFormattingRules?: Maybe<Scalars['JSON']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  usageCount: Scalars['Float']['output'];
  variables: Scalars['JSON']['output'];
};

export type DocumentTemplateAggregateFilter = {
  and?: InputMaybe<Array<DocumentTemplateAggregateFilter>>;
  category?: InputMaybe<TemplateCategoryFilterComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  description?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  isActive?: InputMaybe<BooleanFieldComparison>;
  name?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<DocumentTemplateAggregateFilter>>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type DocumentTemplateAggregateGroupBy = {
  __typename?: 'DocumentTemplateAggregateGroupBy';
  category?: Maybe<TemplateCategory>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DocumentTemplateAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type DocumentTemplateAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type DocumentTemplateAggregateResponse = {
  __typename?: 'DocumentTemplateAggregateResponse';
  count?: Maybe<DocumentTemplateCountAggregate>;
  groupBy?: Maybe<DocumentTemplateAggregateGroupBy>;
  max?: Maybe<DocumentTemplateMaxAggregate>;
  min?: Maybe<DocumentTemplateMinAggregate>;
};

export type DocumentTemplateConnection = {
  __typename?: 'DocumentTemplateConnection';
  /** Array of edges. */
  edges: Array<DocumentTemplateEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type DocumentTemplateCountAggregate = {
  __typename?: 'DocumentTemplateCountAggregate';
  category?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  isActive?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type DocumentTemplateDeleteResponse = {
  __typename?: 'DocumentTemplateDeleteResponse';
  category?: Maybe<TemplateCategory>;
  conditionalSections?: Maybe<Scalars['JSON']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  polishFormattingRules?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  usageCount?: Maybe<Scalars['Float']['output']>;
  variables?: Maybe<Scalars['JSON']['output']>;
};

export type DocumentTemplateEdge = {
  __typename?: 'DocumentTemplateEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the DocumentTemplate */
  node: DocumentTemplate;
};

export type DocumentTemplateFilter = {
  and?: InputMaybe<Array<DocumentTemplateFilter>>;
  category?: InputMaybe<TemplateCategoryFilterComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  description?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  isActive?: InputMaybe<BooleanFieldComparison>;
  name?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<DocumentTemplateFilter>>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type DocumentTemplateMaxAggregate = {
  __typename?: 'DocumentTemplateMaxAggregate';
  category?: Maybe<TemplateCategory>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DocumentTemplateMinAggregate = {
  __typename?: 'DocumentTemplateMinAggregate';
  category?: Maybe<TemplateCategory>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DocumentTemplateSort = {
  direction: SortDirection;
  field: DocumentTemplateSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type DocumentTemplateSortFields =
  | 'category'
  | 'createdAt'
  | 'description'
  | 'id'
  | 'isActive'
  | 'name'
  | 'updatedAt';

/** Type of legal document */
export type DocumentType = 'COMPLAINT' | 'CONTRACT' | 'LAWSUIT' | 'OTHER';

export type DocumentTypeDistribution = {
  __typename?: 'DocumentTypeDistribution';
  count: Scalars['Int']['output'];
  documentType: Scalars['String']['output'];
  /** Percentage of total */
  percentage: Scalars['Float']['output'];
};

export type DocumentTypeFilterComparison = {
  eq?: InputMaybe<DocumentType>;
  gt?: InputMaybe<DocumentType>;
  gte?: InputMaybe<DocumentType>;
  iLike?: InputMaybe<DocumentType>;
  in?: InputMaybe<Array<DocumentType>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<DocumentType>;
  lt?: InputMaybe<DocumentType>;
  lte?: InputMaybe<DocumentType>;
  neq?: InputMaybe<DocumentType>;
  notILike?: InputMaybe<DocumentType>;
  notIn?: InputMaybe<Array<DocumentType>>;
  notLike?: InputMaybe<DocumentType>;
};

/** Type of legal document */
export type DocumentTypeV2 =
  | 'AGREEMENT'
  | 'CONTRACT'
  | 'COURT_RULING'
  | 'LEGAL_OPINION'
  | 'OTHER'
  | 'POLICY'
  | 'REGULATION'
  | 'STATUTE';

export type DocumentVersion = {
  __typename?: 'DocumentVersion';
  authorUserId?: Maybe<Scalars['String']['output']>;
  changeDescription?: Maybe<Scalars['String']['output']>;
  contentSnapshot: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  document: LegalDocument;
  documentId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  session: UserSession;
  sessionId: Scalars['String']['output'];
  versionNumber: Scalars['Float']['output'];
};

export type DocumentVersionAggregateFilter = {
  and?: InputMaybe<Array<DocumentVersionAggregateFilter>>;
  authorUserId?: InputMaybe<StringFieldComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  documentId?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<DocumentVersionAggregateFilter>>;
  sessionId?: InputMaybe<StringFieldComparison>;
  versionNumber?: InputMaybe<NumberFieldComparison>;
};

export type DocumentVersionAggregateGroupBy = {
  __typename?: 'DocumentVersionAggregateGroupBy';
  authorUserId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  sessionId?: Maybe<Scalars['String']['output']>;
  versionNumber?: Maybe<Scalars['Float']['output']>;
};

export type DocumentVersionAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type DocumentVersionAggregateResponse = {
  __typename?: 'DocumentVersionAggregateResponse';
  avg?: Maybe<DocumentVersionAvgAggregate>;
  count?: Maybe<DocumentVersionCountAggregate>;
  groupBy?: Maybe<DocumentVersionAggregateGroupBy>;
  max?: Maybe<DocumentVersionMaxAggregate>;
  min?: Maybe<DocumentVersionMinAggregate>;
  sum?: Maybe<DocumentVersionSumAggregate>;
};

export type DocumentVersionAvgAggregate = {
  __typename?: 'DocumentVersionAvgAggregate';
  versionNumber?: Maybe<Scalars['Float']['output']>;
};

export type DocumentVersionConnection = {
  __typename?: 'DocumentVersionConnection';
  /** Array of edges. */
  edges: Array<DocumentVersionEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type DocumentVersionCountAggregate = {
  __typename?: 'DocumentVersionCountAggregate';
  authorUserId?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['Int']['output']>;
  documentId?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  sessionId?: Maybe<Scalars['Int']['output']>;
  versionNumber?: Maybe<Scalars['Int']['output']>;
};

export type DocumentVersionEdge = {
  __typename?: 'DocumentVersionEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the DocumentVersion */
  node: DocumentVersion;
};

export type DocumentVersionFilter = {
  and?: InputMaybe<Array<DocumentVersionFilter>>;
  authorUserId?: InputMaybe<StringFieldComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  documentId?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<DocumentVersionFilter>>;
  sessionId?: InputMaybe<StringFieldComparison>;
  versionNumber?: InputMaybe<NumberFieldComparison>;
};

export type DocumentVersionMaxAggregate = {
  __typename?: 'DocumentVersionMaxAggregate';
  authorUserId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  sessionId?: Maybe<Scalars['String']['output']>;
  versionNumber?: Maybe<Scalars['Float']['output']>;
};

export type DocumentVersionMinAggregate = {
  __typename?: 'DocumentVersionMinAggregate';
  authorUserId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  documentId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  sessionId?: Maybe<Scalars['String']['output']>;
  versionNumber?: Maybe<Scalars['Float']['output']>;
};

export type DocumentVersionSort = {
  direction: SortDirection;
  field: DocumentVersionSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type DocumentVersionSortFields =
  | 'authorUserId'
  | 'createdAt'
  | 'documentId'
  | 'id'
  | 'sessionId'
  | 'versionNumber';

export type DocumentVersionSumAggregate = {
  __typename?: 'DocumentVersionSumAggregate';
  versionNumber?: Maybe<Scalars['Float']['output']>;
};

/** Email template types available in the system */
export type EmailTemplateType =
  | 'DOCUMENT_COMPLETED'
  | 'DOCUMENT_FAILED'
  | 'SYSTEM_NOTIFICATION'
  | 'WELCOME';

export type EmailTemplateTypeFilterComparison = {
  eq?: InputMaybe<EmailTemplateType>;
  gt?: InputMaybe<EmailTemplateType>;
  gte?: InputMaybe<EmailTemplateType>;
  iLike?: InputMaybe<EmailTemplateType>;
  in?: InputMaybe<Array<EmailTemplateType>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<EmailTemplateType>;
  lt?: InputMaybe<EmailTemplateType>;
  lte?: InputMaybe<EmailTemplateType>;
  neq?: InputMaybe<EmailTemplateType>;
  notILike?: InputMaybe<EmailTemplateType>;
  notIn?: InputMaybe<Array<EmailTemplateType>>;
  notLike?: InputMaybe<EmailTemplateType>;
};

export type ExportDocumentToPdfInput = {
  /** ID of the document to export */
  documentId: Scalars['ID']['input'];
  /** PDF export options */
  options?: InputMaybe<PdfExportOptionsInput>;
};

export type FilterLegalRulingsInput = {
  /** Filter by court name (partial match) */
  courtName?: InputMaybe<Scalars['String']['input']>;
  /** Filter by court type */
  courtType?: InputMaybe<CourtType>;
  /** Filter by ruling date from (ISO 8601 date string) */
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  /** Filter by ruling date to (ISO 8601 date string) */
  dateTo?: InputMaybe<Scalars['String']['input']>;
  /** Filter by legal area from metadata (partial match) */
  legalArea?: InputMaybe<Scalars['String']['input']>;
  /** Maximum number of results to return (default: 20, max: 100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of results to skip for pagination */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type FlagDocumentForModerationInput = {
  /** Document ID to flag for moderation */
  documentId: Scalars['ID']['input'];
  /** Reason for flagging the document */
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type GenerateDocumentInput = {
  metadata?: InputMaybe<DocumentMetadataInput>;
  sessionId: Scalars['String']['input'];
  title: Scalars['String']['input'];
  type?: DocumentType;
};

export type GenerateFromTemplateInput = {
  sessionId: Scalars['String']['input'];
  templateId: Scalars['String']['input'];
  title: Scalars['String']['input'];
  variables: Scalars['JSON']['input'];
};

/** Group by */
export type GroupBy = 'DAY' | 'MONTH' | 'WEEK' | 'YEAR';

export type IdFilterComparison = {
  eq?: InputMaybe<Scalars['ID']['input']>;
  gt?: InputMaybe<Scalars['ID']['input']>;
  gte?: InputMaybe<Scalars['ID']['input']>;
  iLike?: InputMaybe<Scalars['ID']['input']>;
  in?: InputMaybe<Array<Scalars['ID']['input']>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['ID']['input']>;
  lt?: InputMaybe<Scalars['ID']['input']>;
  lte?: InputMaybe<Scalars['ID']['input']>;
  neq?: InputMaybe<Scalars['ID']['input']>;
  notILike?: InputMaybe<Scalars['ID']['input']>;
  notIn?: InputMaybe<Array<Scalars['ID']['input']>>;
  notLike?: InputMaybe<Scalars['ID']['input']>;
};

export type InAppNotification = {
  __typename?: 'InAppNotification';
  actionLabel?: Maybe<Scalars['String']['output']>;
  actionLink?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  read: Scalars['Boolean']['output'];
  type: InAppNotificationType;
  user: User;
  userId: Scalars['String']['output'];
};

export type InAppNotificationAggregateFilter = {
  and?: InputMaybe<Array<InAppNotificationAggregateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  message?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<InAppNotificationAggregateFilter>>;
  read?: InputMaybe<BooleanFieldComparison>;
  type?: InputMaybe<InAppNotificationTypeFilterComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type InAppNotificationAggregateGroupBy = {
  __typename?: 'InAppNotificationAggregateGroupBy';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  read?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<InAppNotificationType>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type InAppNotificationAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type InAppNotificationAggregateResponse = {
  __typename?: 'InAppNotificationAggregateResponse';
  count?: Maybe<InAppNotificationCountAggregate>;
  groupBy?: Maybe<InAppNotificationAggregateGroupBy>;
  max?: Maybe<InAppNotificationMaxAggregate>;
  min?: Maybe<InAppNotificationMinAggregate>;
};

export type InAppNotificationConnection = {
  __typename?: 'InAppNotificationConnection';
  /** Array of edges. */
  edges: Array<InAppNotificationEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type InAppNotificationCountAggregate = {
  __typename?: 'InAppNotificationCountAggregate';
  createdAt?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  message?: Maybe<Scalars['Int']['output']>;
  read?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['Int']['output']>;
  userId?: Maybe<Scalars['Int']['output']>;
};

export type InAppNotificationCreatedPayload = {
  __typename?: 'InAppNotificationCreatedPayload';
  /** Optional action label for the action link */
  actionLabel?: Maybe<Scalars['String']['output']>;
  /** Optional action link for navigation */
  actionLink?: Maybe<Scalars['String']['output']>;
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Notification message */
  message: Scalars['String']['output'];
  /** Additional metadata */
  metadata?: Maybe<Scalars['String']['output']>;
  /** Notification ID */
  notificationId: Scalars['ID']['output'];
  /** Type of notification */
  type: InAppNotificationType;
  /** User ID who received the notification */
  userId: Scalars['ID']['output'];
};

export type InAppNotificationDeleteResponse = {
  __typename?: 'InAppNotificationDeleteResponse';
  actionLabel?: Maybe<Scalars['String']['output']>;
  actionLink?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  read?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<InAppNotificationType>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type InAppNotificationEdge = {
  __typename?: 'InAppNotificationEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the InAppNotification */
  node: InAppNotification;
};

export type InAppNotificationFilter = {
  and?: InputMaybe<Array<InAppNotificationFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  message?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<InAppNotificationFilter>>;
  read?: InputMaybe<BooleanFieldComparison>;
  type?: InputMaybe<InAppNotificationTypeFilterComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type InAppNotificationMaxAggregate = {
  __typename?: 'InAppNotificationMaxAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  type?: Maybe<InAppNotificationType>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type InAppNotificationMinAggregate = {
  __typename?: 'InAppNotificationMinAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  type?: Maybe<InAppNotificationType>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type InAppNotificationSort = {
  direction: SortDirection;
  field: InAppNotificationSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type InAppNotificationSortFields =
  | 'createdAt'
  | 'id'
  | 'message'
  | 'read'
  | 'type'
  | 'userId';

/** Types of in-app notifications */
export type InAppNotificationType = 'ERROR' | 'INFO' | 'SUCCESS' | 'SYSTEM' | 'WARNING';

export type InAppNotificationTypeFilterComparison = {
  eq?: InputMaybe<InAppNotificationType>;
  gt?: InputMaybe<InAppNotificationType>;
  gte?: InputMaybe<InAppNotificationType>;
  iLike?: InputMaybe<InAppNotificationType>;
  in?: InputMaybe<Array<InAppNotificationType>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<InAppNotificationType>;
  lt?: InputMaybe<InAppNotificationType>;
  lte?: InputMaybe<InAppNotificationType>;
  neq?: InputMaybe<InAppNotificationType>;
  notILike?: InputMaybe<InAppNotificationType>;
  notIn?: InputMaybe<Array<InAppNotificationType>>;
  notLike?: InputMaybe<InAppNotificationType>;
};

export type LegalAnalysis = {
  __typename?: 'LegalAnalysis';
  createdAt: Scalars['DateTime']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  identifiedGrounds?: Maybe<Array<LegalGround>>;
  inputDescription: Scalars['String']['output'];
  metadata?: Maybe<AnalysisMetadata>;
  overallConfidenceScore?: Maybe<Scalars['Float']['output']>;
  recommendations?: Maybe<Scalars['String']['output']>;
  relatedDocumentLinks?: Maybe<Array<RelatedDocumentLink>>;
  session: UserSession;
  sessionId: Scalars['String']['output'];
  status: AnalysisStatus;
  summary?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type LegalAnalysisAggregateFilter = {
  and?: InputMaybe<Array<LegalAnalysisAggregateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<LegalAnalysisAggregateFilter>>;
  sessionId?: InputMaybe<StringFieldComparison>;
  status?: InputMaybe<AnalysisStatusFilterComparison>;
  title?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type LegalAnalysisAggregateGroupBy = {
  __typename?: 'LegalAnalysisAggregateGroupBy';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  sessionId?: Maybe<Scalars['String']['output']>;
  status?: Maybe<AnalysisStatus>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalAnalysisAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type LegalAnalysisAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type LegalAnalysisAggregateResponse = {
  __typename?: 'LegalAnalysisAggregateResponse';
  count?: Maybe<LegalAnalysisCountAggregate>;
  groupBy?: Maybe<LegalAnalysisAggregateGroupBy>;
  max?: Maybe<LegalAnalysisMaxAggregate>;
  min?: Maybe<LegalAnalysisMinAggregate>;
};

export type LegalAnalysisConnection = {
  __typename?: 'LegalAnalysisConnection';
  /** Array of edges. */
  edges: Array<LegalAnalysisEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type LegalAnalysisCountAggregate = {
  __typename?: 'LegalAnalysisCountAggregate';
  createdAt?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  sessionId?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type LegalAnalysisDeleteResponse = {
  __typename?: 'LegalAnalysisDeleteResponse';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  identifiedGrounds?: Maybe<Array<LegalGround>>;
  inputDescription?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<AnalysisMetadata>;
  overallConfidenceScore?: Maybe<Scalars['Float']['output']>;
  recommendations?: Maybe<Scalars['String']['output']>;
  relatedDocumentLinks?: Maybe<Array<RelatedDocumentLink>>;
  sessionId?: Maybe<Scalars['String']['output']>;
  status?: Maybe<AnalysisStatus>;
  summary?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalAnalysisEdge = {
  __typename?: 'LegalAnalysisEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the LegalAnalysis */
  node: LegalAnalysis;
};

export type LegalAnalysisFilter = {
  and?: InputMaybe<Array<LegalAnalysisFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<LegalAnalysisFilter>>;
  sessionId?: InputMaybe<StringFieldComparison>;
  status?: InputMaybe<AnalysisStatusFilterComparison>;
  title?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type LegalAnalysisMaxAggregate = {
  __typename?: 'LegalAnalysisMaxAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  sessionId?: Maybe<Scalars['String']['output']>;
  status?: Maybe<AnalysisStatus>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalAnalysisMinAggregate = {
  __typename?: 'LegalAnalysisMinAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  sessionId?: Maybe<Scalars['String']['output']>;
  status?: Maybe<AnalysisStatus>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalAnalysisSort = {
  direction: SortDirection;
  field: LegalAnalysisSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type LegalAnalysisSortFields =
  | 'createdAt'
  | 'id'
  | 'sessionId'
  | 'status'
  | 'title'
  | 'updatedAt';

export type LegalDocument = {
  __typename?: 'LegalDocument';
  contentRaw?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** When the document was flagged for moderation */
  flaggedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  metadata?: Maybe<DocumentMetadata>;
  /** When the document was moderated */
  moderatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** ID of the admin who moderated this document */
  moderatedById?: Maybe<Scalars['ID']['output']>;
  /** Reason for moderation decision */
  moderationReason?: Maybe<Scalars['String']['output']>;
  /** Moderation status of the document */
  moderationStatus?: Maybe<ModerationStatus>;
  pdfUrl?: Maybe<Scalars['String']['output']>;
  session: UserSession;
  sessionId: Scalars['String']['output'];
  status: DocumentStatus;
  title: Scalars['String']['output'];
  type: DocumentType;
  updatedAt: Scalars['DateTime']['output'];
};

export type LegalDocumentAggregateFilter = {
  and?: InputMaybe<Array<LegalDocumentAggregateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  moderationStatus?: InputMaybe<ModerationStatusFilterComparison>;
  or?: InputMaybe<Array<LegalDocumentAggregateFilter>>;
  sessionId?: InputMaybe<StringFieldComparison>;
  status?: InputMaybe<DocumentStatusFilterComparison>;
  title?: InputMaybe<StringFieldComparison>;
  type?: InputMaybe<DocumentTypeFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type LegalDocumentAggregateGroupBy = {
  __typename?: 'LegalDocumentAggregateGroupBy';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  moderationStatus?: Maybe<ModerationStatus>;
  sessionId?: Maybe<Scalars['String']['output']>;
  status?: Maybe<DocumentStatus>;
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<DocumentType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalDocumentAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type LegalDocumentAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type LegalDocumentAggregateResponse = {
  __typename?: 'LegalDocumentAggregateResponse';
  count?: Maybe<LegalDocumentCountAggregate>;
  groupBy?: Maybe<LegalDocumentAggregateGroupBy>;
  max?: Maybe<LegalDocumentMaxAggregate>;
  min?: Maybe<LegalDocumentMinAggregate>;
};

export type LegalDocumentConnection = {
  __typename?: 'LegalDocumentConnection';
  /** Array of edges. */
  edges: Array<LegalDocumentEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type LegalDocumentCountAggregate = {
  __typename?: 'LegalDocumentCountAggregate';
  createdAt?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  moderationStatus?: Maybe<Scalars['Int']['output']>;
  sessionId?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type LegalDocumentDeleteResponse = {
  __typename?: 'LegalDocumentDeleteResponse';
  contentRaw?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** When the document was flagged for moderation */
  flaggedAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  metadata?: Maybe<DocumentMetadata>;
  /** When the document was moderated */
  moderatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** ID of the admin who moderated this document */
  moderatedById?: Maybe<Scalars['ID']['output']>;
  /** Reason for moderation decision */
  moderationReason?: Maybe<Scalars['String']['output']>;
  /** Moderation status of the document */
  moderationStatus?: Maybe<ModerationStatus>;
  /** Signed URL to download the PDF version of this document */
  pdfUrl?: Maybe<Scalars['String']['output']>;
  sessionId?: Maybe<Scalars['String']['output']>;
  status?: Maybe<DocumentStatus>;
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<DocumentType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalDocumentEdge = {
  __typename?: 'LegalDocumentEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the LegalDocument */
  node: LegalDocument;
};

export type LegalDocumentFilter = {
  and?: InputMaybe<Array<LegalDocumentFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  moderationStatus?: InputMaybe<ModerationStatusFilterComparison>;
  or?: InputMaybe<Array<LegalDocumentFilter>>;
  sessionId?: InputMaybe<StringFieldComparison>;
  status?: InputMaybe<DocumentStatusFilterComparison>;
  title?: InputMaybe<StringFieldComparison>;
  type?: InputMaybe<DocumentTypeFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type LegalDocumentMaxAggregate = {
  __typename?: 'LegalDocumentMaxAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  moderationStatus?: Maybe<ModerationStatus>;
  sessionId?: Maybe<Scalars['String']['output']>;
  status?: Maybe<DocumentStatus>;
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<DocumentType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalDocumentMinAggregate = {
  __typename?: 'LegalDocumentMinAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  moderationStatus?: Maybe<ModerationStatus>;
  sessionId?: Maybe<Scalars['String']['output']>;
  status?: Maybe<DocumentStatus>;
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<DocumentType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalDocumentSearchResponse = {
  __typename?: 'LegalDocumentSearchResponse';
  count: Scalars['Int']['output'];
  hasMore: Scalars['Boolean']['output'];
  offset: Scalars['Int']['output'];
  results: Array<LegalDocumentSearchResult>;
  totalCount: Scalars['Int']['output'];
};

export type LegalDocumentSearchResult = {
  __typename?: 'LegalDocumentSearchResult';
  contentRaw?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** Highlighted snippet of matching content */
  headline?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  pdfUrl?: Maybe<Scalars['String']['output']>;
  /** Relevance ranking score (higher is more relevant) */
  rank: Scalars['Float']['output'];
  sessionId: Scalars['String']['output'];
  status: DocumentStatus;
  title: Scalars['String']['output'];
  type: DocumentType;
  updatedAt: Scalars['DateTime']['output'];
};

export type LegalDocumentSort = {
  direction: SortDirection;
  field: LegalDocumentSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type LegalDocumentSortFields =
  | 'createdAt'
  | 'id'
  | 'moderationStatus'
  | 'sessionId'
  | 'status'
  | 'title'
  | 'type'
  | 'updatedAt';

export type LegalDocumentV2 = {
  __typename?: 'LegalDocumentV2';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  documentType: DocumentTypeV2;
  id: Scalars['ID']['output'];
  /** JSON metadata as string */
  metadataJson?: Maybe<Scalars['String']['output']>;
  ownerId: Scalars['ID']['output'];
  status: DocumentStatusV2;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Float']['output'];
};

export type LegalGround = {
  __typename?: 'LegalGround';
  confidenceScore: Scalars['Float']['output'];
  description: Scalars['String']['output'];
  legalBasis?: Maybe<Array<Scalars['String']['output']>>;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
};

export type LegalGroundInput = {
  confidenceScore: Scalars['Float']['input'];
  description: Scalars['String']['input'];
  legalBasis?: InputMaybe<Array<Scalars['String']['input']>>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type LegalQuery = {
  __typename?: 'LegalQuery';
  answerMarkdown?: Maybe<Scalars['String']['output']>;
  citations?: Maybe<Array<Citation>>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  question: Scalars['String']['output'];
  session: UserSession;
  sessionId?: Maybe<Scalars['ID']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type LegalQueryAggregateFilter = {
  and?: InputMaybe<Array<LegalQueryAggregateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<LegalQueryAggregateFilter>>;
  question?: InputMaybe<StringFieldComparison>;
  sessionId?: InputMaybe<IdFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type LegalQueryAggregateGroupBy = {
  __typename?: 'LegalQueryAggregateGroupBy';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  question?: Maybe<Scalars['String']['output']>;
  sessionId?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalQueryAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type LegalQueryAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type LegalQueryAggregateResponse = {
  __typename?: 'LegalQueryAggregateResponse';
  count?: Maybe<LegalQueryCountAggregate>;
  groupBy?: Maybe<LegalQueryAggregateGroupBy>;
  max?: Maybe<LegalQueryMaxAggregate>;
  min?: Maybe<LegalQueryMinAggregate>;
};

export type LegalQueryConnection = {
  __typename?: 'LegalQueryConnection';
  /** Array of edges. */
  edges: Array<LegalQueryEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type LegalQueryCountAggregate = {
  __typename?: 'LegalQueryCountAggregate';
  createdAt?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  question?: Maybe<Scalars['Int']['output']>;
  sessionId?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type LegalQueryDeleteResponse = {
  __typename?: 'LegalQueryDeleteResponse';
  answerMarkdown?: Maybe<Scalars['String']['output']>;
  citations?: Maybe<Array<Citation>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  question?: Maybe<Scalars['String']['output']>;
  sessionId?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalQueryEdge = {
  __typename?: 'LegalQueryEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the LegalQuery */
  node: LegalQuery;
};

export type LegalQueryFilter = {
  and?: InputMaybe<Array<LegalQueryFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<LegalQueryFilter>>;
  question?: InputMaybe<StringFieldComparison>;
  sessionId?: InputMaybe<IdFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type LegalQueryMaxAggregate = {
  __typename?: 'LegalQueryMaxAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  question?: Maybe<Scalars['String']['output']>;
  sessionId?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalQueryMinAggregate = {
  __typename?: 'LegalQueryMinAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  question?: Maybe<Scalars['String']['output']>;
  sessionId?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalQuerySearchResponse = {
  __typename?: 'LegalQuerySearchResponse';
  count: Scalars['Int']['output'];
  hasMore: Scalars['Boolean']['output'];
  offset: Scalars['Int']['output'];
  results: Array<LegalQuerySearchResult>;
  totalCount: Scalars['Int']['output'];
};

export type LegalQuerySearchResult = {
  __typename?: 'LegalQuerySearchResult';
  answerMarkdown?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** Highlighted snippet of matching content */
  headline?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  question: Scalars['String']['output'];
  /** Relevance ranking score (higher is more relevant) */
  rank: Scalars['Float']['output'];
  sessionId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type LegalQuerySort = {
  direction: SortDirection;
  field: LegalQuerySortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type LegalQuerySortFields = 'createdAt' | 'id' | 'question' | 'sessionId' | 'updatedAt';

export type LegalRuling = {
  __typename?: 'LegalRuling';
  courtName: Scalars['String']['output'];
  courtType: CourtType;
  createdAt: Scalars['DateTime']['output'];
  fullText?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  metadata?: Maybe<RulingMetadata>;
  rulingDate: Scalars['DateTime']['output'];
  signature: Scalars['String']['output'];
  summary?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type LegalRulingAggregateFilter = {
  and?: InputMaybe<Array<LegalRulingAggregateFilter>>;
  courtName?: InputMaybe<StringFieldComparison>;
  courtType?: InputMaybe<CourtTypeFilterComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<LegalRulingAggregateFilter>>;
  rulingDate?: InputMaybe<DateFieldComparison>;
  signature?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type LegalRulingAggregateGroupBy = {
  __typename?: 'LegalRulingAggregateGroupBy';
  courtName?: Maybe<Scalars['String']['output']>;
  courtType?: Maybe<CourtType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  rulingDate?: Maybe<Scalars['DateTime']['output']>;
  signature?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalRulingAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type LegalRulingAggregateGroupByRulingDateArgs = {
  by?: GroupBy;
};

export type LegalRulingAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type LegalRulingAggregateResponse = {
  __typename?: 'LegalRulingAggregateResponse';
  count?: Maybe<LegalRulingCountAggregate>;
  groupBy?: Maybe<LegalRulingAggregateGroupBy>;
  max?: Maybe<LegalRulingMaxAggregate>;
  min?: Maybe<LegalRulingMinAggregate>;
};

export type LegalRulingConnection = {
  __typename?: 'LegalRulingConnection';
  /** Array of edges. */
  edges: Array<LegalRulingEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type LegalRulingCountAggregate = {
  __typename?: 'LegalRulingCountAggregate';
  courtName?: Maybe<Scalars['Int']['output']>;
  courtType?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  rulingDate?: Maybe<Scalars['Int']['output']>;
  signature?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type LegalRulingDeleteResponse = {
  __typename?: 'LegalRulingDeleteResponse';
  courtName?: Maybe<Scalars['String']['output']>;
  courtType?: Maybe<CourtType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  fullText?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  metadata?: Maybe<RulingMetadata>;
  rulingDate?: Maybe<Scalars['DateTime']['output']>;
  signature?: Maybe<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalRulingEdge = {
  __typename?: 'LegalRulingEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the LegalRuling */
  node: LegalRuling;
};

export type LegalRulingFilter = {
  and?: InputMaybe<Array<LegalRulingFilter>>;
  courtName?: InputMaybe<StringFieldComparison>;
  courtType?: InputMaybe<CourtTypeFilterComparison>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<LegalRulingFilter>>;
  rulingDate?: InputMaybe<DateFieldComparison>;
  signature?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type LegalRulingMaxAggregate = {
  __typename?: 'LegalRulingMaxAggregate';
  courtName?: Maybe<Scalars['String']['output']>;
  courtType?: Maybe<CourtType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  rulingDate?: Maybe<Scalars['DateTime']['output']>;
  signature?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalRulingMinAggregate = {
  __typename?: 'LegalRulingMinAggregate';
  courtName?: Maybe<Scalars['String']['output']>;
  courtType?: Maybe<CourtType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  rulingDate?: Maybe<Scalars['DateTime']['output']>;
  signature?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LegalRulingSearchResponse = {
  __typename?: 'LegalRulingSearchResponse';
  /** Number of results returned */
  count: Scalars['Int']['output'];
  /** Whether there are more results */
  hasMore: Scalars['Boolean']['output'];
  /** Current offset */
  offset: Scalars['Int']['output'];
  /** Search results with relevance ranking */
  results: Array<LegalRulingSearchResult>;
  /** Total number of matching results (for pagination) */
  totalCount: Scalars['Int']['output'];
};

export type LegalRulingSearchResult = {
  __typename?: 'LegalRulingSearchResult';
  /** Highlighted snippet of matching content */
  headline?: Maybe<Scalars['String']['output']>;
  /** Relevance score (higher is better) */
  rank: Scalars['Float']['output'];
  /** The matching legal ruling */
  ruling: LegalRuling;
};

export type LegalRulingSort = {
  direction: SortDirection;
  field: LegalRulingSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type LegalRulingSortFields =
  | 'courtName'
  | 'courtType'
  | 'createdAt'
  | 'id'
  | 'rulingDate'
  | 'signature'
  | 'updatedAt';

export type LoginInput = {
  /** User password */
  password: Scalars['String']['input'];
  /** Username or email address */
  username: Scalars['String']['input'];
};

export type ModerationActionResult = {
  __typename?: 'ModerationActionResult';
  /** Action performed */
  action: Scalars['String']['output'];
  /** Document ID */
  documentId: Scalars['ID']['output'];
  /** Reason for the action */
  reason?: Maybe<Scalars['String']['output']>;
  /** Whether user was notified */
  userNotified: Scalars['Boolean']['output'];
};

/** Moderation status of document */
export type ModerationStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export type ModerationStatusFilterComparison = {
  eq?: InputMaybe<ModerationStatus>;
  gt?: InputMaybe<ModerationStatus>;
  gte?: InputMaybe<ModerationStatus>;
  iLike?: InputMaybe<ModerationStatus>;
  in?: InputMaybe<Array<ModerationStatus>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<ModerationStatus>;
  lt?: InputMaybe<ModerationStatus>;
  lte?: InputMaybe<ModerationStatus>;
  neq?: InputMaybe<ModerationStatus>;
  notILike?: InputMaybe<ModerationStatus>;
  notIn?: InputMaybe<Array<ModerationStatus>>;
  notLike?: InputMaybe<ModerationStatus>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Accept the legal disclaimer for the current user */
  acceptDisclaimer: AuthUser;
  /** Activate a user account (admin only) */
  activateUser: User;
  /** Activate a webhook */
  activateWebhook: Webhook;
  /** Add a citation to an existing legal query */
  addCitationToQuery: LegalQuery;
  /** Add AI-generated answer to a legal query */
  answerLegalQuery: LegalQuery;
  /** Approve a document after moderation review */
  approveDocument: ModerationActionResult;
  /** Ask a legal question and get AI answer synchronously */
  askLegalQuestion: LegalQuery;
  bulkUpsertSystemSettings: Array<SystemSetting>;
  /** Cancel the current user subscription */
  cancelMySubscription: UserSubscription;
  /** Change password for the current user */
  changePassword: Scalars['Boolean']['output'];
  /** Upgrade or downgrade the current user subscription */
  changeSubscriptionPlan: UserSubscription;
  /** Change a user role (admin only) */
  changeUserRole: User;
  /** Analyze a case description using AI and identify applicable legal grounds */
  classifyCase: LegalAnalysis;
  /** Create a new API key. The raw key is only shown once. */
  createApiKey: CreateApiKeyResponse;
  createBackup: Backup;
  createDocumentTemplate: DocumentTemplate;
  createDocumentV2: LegalDocumentV2;
  /** Create a new subscription for the current user */
  createMySubscription: UserSubscription;
  createOneDocumentComment: DocumentComment;
  createOneDocumentTemplate: DocumentTemplate;
  createOneDocumentVersion: DocumentVersion;
  createOneInAppNotification: InAppNotification;
  createOneLegalAnalysis: LegalAnalysis;
  createOneLegalDocument: LegalDocument;
  createOneLegalQuery: LegalQuery;
  createOneLegalRuling: LegalRuling;
  createOneNotification: Notification;
  createOneUser: User;
  createOneUserPreference: UserPreferences;
  /** Create a new subscription plan */
  createSubscriptionPlan: SubscriptionPlan;
  createUsageRecord: AiUsageRecord;
  /** Create a new webhook. The secret is only shown once. */
  createWebhook: CreateWebhookResponse;
  /** Deactivate a webhook (temporary pause) */
  deactivateWebhook: Webhook;
  /** Delete an API key permanently. This action cannot be undone. */
  deleteApiKey: Scalars['Boolean']['output'];
  deleteBackup: Scalars['Boolean']['output'];
  /** @deprecated Use deleteOneLegalDocument instead */
  deleteDocument: Scalars['Boolean']['output'];
  deleteDocumentTemplate: Scalars['Boolean']['output'];
  deleteDocumentV2: Scalars['Boolean']['output'];
  /**
   * Delete a legal query (deprecated)
   * @deprecated Use deleteOneLegalQuery instead
   */
  deleteLegalQuery: Scalars['Boolean']['output'];
  deleteOneDocumentComment: DocumentCommentDeleteResponse;
  deleteOneDocumentTemplate: DocumentTemplateDeleteResponse;
  deleteOneInAppNotification: InAppNotificationDeleteResponse;
  deleteOneLegalAnalysis: LegalAnalysisDeleteResponse;
  deleteOneLegalDocument: LegalDocumentDeleteResponse;
  deleteOneLegalQuery: LegalQueryDeleteResponse;
  deleteOneLegalRuling: LegalRulingDeleteResponse;
  deleteOneUser: UserDeleteResponse;
  deleteOneUserPreference: UserPreferencesDeleteResponse;
  deleteOneUserSession: UserSessionDeleteResponse;
  /** Delete a subscription plan */
  deleteSubscriptionPlan: Scalars['Boolean']['output'];
  deleteSystemSetting: Scalars['Boolean']['output'];
  /** Delete a webhook permanently. This action cannot be undone. */
  deleteWebhook: Scalars['Boolean']['output'];
  /** Disable a webhook */
  disableWebhook: Webhook;
  /** Queue a document for PDF export */
  exportDocumentToPdf: PdfExportJob;
  /** Export a document to PDF and wait for the result */
  exportDocumentToPdfSync: PdfExportResult;
  /** Flag a document for moderation review */
  flagDocumentForModeration: ModerationActionResult;
  generateDocument: LegalDocument;
  generateDocumentFromTemplate: LegalDocument;
  /** Authenticate user with username/email and password */
  login: AuthPayload;
  /** Mark all notifications as read for a user */
  markAllNotificationsAsRead: Scalars['Int']['output'];
  /** Mark a notification as read */
  markNotificationAsRead: Scalars['String']['output'];
  publishDocumentV2: LegalDocumentV2;
  /** Record usage for quota tracking */
  recordUsage: Scalars['Boolean']['output'];
  /** Refresh access token using a valid refresh token */
  refreshToken: RefreshTokenPayload;
  /** Register a new user account */
  register: AuthPayload;
  /** Reject a document after moderation review */
  rejectDocument: ModerationActionResult;
  /** Render a template with variable substitution without creating a document */
  renderTemplate: Scalars['String']['output'];
  resetMyPreferences: UserPreferences;
  /** Reset a user password (admin only) */
  resetUserPassword: User;
  restoreBackup: Scalars['Boolean']['output'];
  /** Resume a subscription that was scheduled for cancellation */
  resumeMySubscription: UserSubscription;
  /** Revoke an API key. This action cannot be undone. */
  revokeApiKey: ApiKey;
  /** Revoke a document share */
  revokeDocumentShare: Scalars['Boolean']['output'];
  /** Rollback a document to a previous version. Creates a new version with the old content. */
  rollbackDocumentToVersion: LegalDocument;
  /** Rotate webhook secret. The old secret will no longer work. */
  rotateWebhookSecret: Scalars['String']['output'];
  seedSystemSettings: Scalars['Boolean']['output'];
  /** Send bulk notifications to multiple users */
  sendBulkNotifications: BulkSendNotificationResponse;
  /** Send a notification to a user across specified channels */
  sendNotification: SendNotificationResponse;
  /** Share a document with a user */
  shareDocument: DocumentShare;
  /** Submit a new legal query for AI processing */
  submitLegalQuery: LegalQuery;
  /** Suspend a user account (admin only) */
  suspendUser: User;
  /** Test a webhook by sending a test event */
  testWebhook: TestWebhookResponse;
  /** Update an existing API key (name, scopes, rate limit, expiration) */
  updateApiKey: ApiKey;
  updateDocument: LegalDocument;
  /** Update the permission level of a document share */
  updateDocumentSharePermission: DocumentShare;
  updateDocumentTemplate: DocumentTemplate;
  updateDocumentTitleV2: LegalDocumentV2;
  updateMyPreferences: UserPreferences;
  /** Update notification preferences for a user */
  updateNotificationPreferences: Scalars['String']['output'];
  updateOneDocumentComment: DocumentComment;
  updateOneDocumentTemplate: DocumentTemplate;
  updateOneDocumentVersion: DocumentVersion;
  updateOneInAppNotification: InAppNotification;
  updateOneLegalAnalysis: LegalAnalysis;
  updateOneLegalDocument: LegalDocument;
  updateOneLegalQuery: LegalQuery;
  updateOneLegalRuling: LegalRuling;
  updateOneNotification: Notification;
  updateOneUser: User;
  updateOneUserPreference: UserPreferences;
  /** Update profile information for the current user */
  updateProfile: AuthUser;
  /** Update an existing subscription plan */
  updateSubscriptionPlan: SubscriptionPlan;
  /** Update an existing webhook (name, URL, events, headers, status) */
  updateWebhook: Webhook;
  upsertSystemSetting: SystemSetting;
};

export type MutationActivateUserArgs = {
  input: ActivateUserInput;
};

export type MutationActivateWebhookArgs = {
  id: Scalars['String']['input'];
};

export type MutationAddCitationToQueryArgs = {
  citation: CreateCitationInput;
  queryId: Scalars['ID']['input'];
};

export type MutationAnswerLegalQueryArgs = {
  id: Scalars['ID']['input'];
  input: AnswerLegalQueryInput;
};

export type MutationApproveDocumentArgs = {
  input: ApproveDocumentInput;
};

export type MutationAskLegalQuestionArgs = {
  input: AskLegalQuestionInput;
};

export type MutationBulkUpsertSystemSettingsArgs = {
  input: BulkUpdateSettingsInput;
};

export type MutationCancelMySubscriptionArgs = {
  input: CancelSubscriptionInput;
};

export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};

export type MutationChangeSubscriptionPlanArgs = {
  newPlanId: Scalars['String']['input'];
};

export type MutationChangeUserRoleArgs = {
  input: ChangeUserRoleInput;
};

export type MutationClassifyCaseArgs = {
  input: ClassifyCaseInput;
};

export type MutationCreateApiKeyArgs = {
  input: CreateApiKeyInput;
};

export type MutationCreateBackupArgs = {
  input?: InputMaybe<CreateBackupInput>;
};

export type MutationCreateDocumentTemplateArgs = {
  input: CreateTemplateInput;
};

export type MutationCreateDocumentV2Args = {
  input: CreateLegalDocumentInputV2;
};

export type MutationCreateMySubscriptionArgs = {
  input: CreateUserSubscriptionInput;
};

export type MutationCreateOneDocumentCommentArgs = {
  input: CreateOneDocumentCommentInput;
};

export type MutationCreateOneDocumentTemplateArgs = {
  input: CreateOneDocumentTemplateInput;
};

export type MutationCreateOneDocumentVersionArgs = {
  input: CreateOneDocumentVersionInput;
};

export type MutationCreateOneInAppNotificationArgs = {
  input: CreateOneInAppNotificationInput;
};

export type MutationCreateOneLegalAnalysisArgs = {
  input: CreateOneLegalAnalysisInput;
};

export type MutationCreateOneLegalDocumentArgs = {
  input: CreateOneLegalDocumentInput;
};

export type MutationCreateOneLegalQueryArgs = {
  input: CreateOneLegalQueryInput;
};

export type MutationCreateOneLegalRulingArgs = {
  input: CreateOneLegalRulingInput;
};

export type MutationCreateOneNotificationArgs = {
  input: CreateOneNotificationInput;
};

export type MutationCreateOneUserArgs = {
  input: CreateOneUserInput;
};

export type MutationCreateOneUserPreferenceArgs = {
  input: CreateOneUserPreferencesInput;
};

export type MutationCreateSubscriptionPlanArgs = {
  input: CreateSubscriptionPlanInput;
};

export type MutationCreateUsageRecordArgs = {
  input: CreateAiUsageRecordInput;
};

export type MutationCreateWebhookArgs = {
  input: CreateWebhookInput;
};

export type MutationDeactivateWebhookArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeleteApiKeyArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeleteBackupArgs = {
  id: Scalars['ID']['input'];
};

export type MutationDeleteDocumentArgs = {
  id: Scalars['ID']['input'];
};

export type MutationDeleteDocumentTemplateArgs = {
  id: Scalars['ID']['input'];
};

export type MutationDeleteDocumentV2Args = {
  input: DeleteDocumentInputV2;
};

export type MutationDeleteLegalQueryArgs = {
  id: Scalars['ID']['input'];
};

export type MutationDeleteOneDocumentCommentArgs = {
  input: DeleteOneDocumentCommentInput;
};

export type MutationDeleteOneDocumentTemplateArgs = {
  input: DeleteOneDocumentTemplateInput;
};

export type MutationDeleteOneInAppNotificationArgs = {
  input: DeleteOneInAppNotificationInput;
};

export type MutationDeleteOneLegalAnalysisArgs = {
  input: DeleteOneLegalAnalysisInput;
};

export type MutationDeleteOneLegalDocumentArgs = {
  input: DeleteOneLegalDocumentInput;
};

export type MutationDeleteOneLegalQueryArgs = {
  input: DeleteOneLegalQueryInput;
};

export type MutationDeleteOneLegalRulingArgs = {
  input: DeleteOneLegalRulingInput;
};

export type MutationDeleteOneUserArgs = {
  input: DeleteOneUserInput;
};

export type MutationDeleteOneUserPreferenceArgs = {
  input: DeleteOneUserPreferencesInput;
};

export type MutationDeleteOneUserSessionArgs = {
  input: DeleteOneUserSessionInput;
};

export type MutationDeleteSubscriptionPlanArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeleteSystemSettingArgs = {
  key: Scalars['String']['input'];
};

export type MutationDeleteWebhookArgs = {
  id: Scalars['String']['input'];
};

export type MutationDisableWebhookArgs = {
  id: Scalars['String']['input'];
};

export type MutationExportDocumentToPdfArgs = {
  input: ExportDocumentToPdfInput;
};

export type MutationExportDocumentToPdfSyncArgs = {
  input: ExportDocumentToPdfInput;
};

export type MutationFlagDocumentForModerationArgs = {
  input: FlagDocumentForModerationInput;
};

export type MutationGenerateDocumentArgs = {
  input: GenerateDocumentInput;
};

export type MutationGenerateDocumentFromTemplateArgs = {
  input: GenerateFromTemplateInput;
};

export type MutationLoginArgs = {
  input: LoginInput;
};

export type MutationMarkAllNotificationsAsReadArgs = {
  userId: Scalars['String']['input'];
};

export type MutationMarkNotificationAsReadArgs = {
  notificationId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type MutationPublishDocumentV2Args = {
  input: PublishDocumentInputV2;
};

export type MutationRecordUsageArgs = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  quotaKey: Scalars['String']['input'];
};

export type MutationRefreshTokenArgs = {
  input: RefreshTokenInput;
};

export type MutationRegisterArgs = {
  input: RegisterInput;
};

export type MutationRejectDocumentArgs = {
  input: RejectDocumentInput;
};

export type MutationRenderTemplateArgs = {
  input: RenderTemplateInput;
};

export type MutationResetUserPasswordArgs = {
  input: ResetUserPasswordInput;
};

export type MutationRestoreBackupArgs = {
  input: RestoreBackupInput;
};

export type MutationRevokeApiKeyArgs = {
  id: Scalars['String']['input'];
};

export type MutationRevokeDocumentShareArgs = {
  shareId: Scalars['ID']['input'];
};

export type MutationRollbackDocumentToVersionArgs = {
  authorUserId?: InputMaybe<Scalars['ID']['input']>;
  documentId: Scalars['ID']['input'];
  sessionId: Scalars['ID']['input'];
  versionNumber: Scalars['Float']['input'];
};

export type MutationRotateWebhookSecretArgs = {
  id: Scalars['String']['input'];
};

export type MutationSendBulkNotificationsArgs = {
  input: BulkSendNotificationInput;
};

export type MutationSendNotificationArgs = {
  input: SendNotificationInput;
};

export type MutationShareDocumentArgs = {
  input: ShareDocumentInput;
};

export type MutationSubmitLegalQueryArgs = {
  input: SubmitLegalQueryInput;
};

export type MutationSuspendUserArgs = {
  input: SuspendUserInput;
};

export type MutationTestWebhookArgs = {
  input: TestWebhookInput;
};

export type MutationUpdateApiKeyArgs = {
  id: Scalars['String']['input'];
  input: UpdateApiKeyInput;
};

export type MutationUpdateDocumentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDocumentInput;
};

export type MutationUpdateDocumentSharePermissionArgs = {
  input: UpdateSharePermissionInput;
};

export type MutationUpdateDocumentTemplateArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTemplateInput;
};

export type MutationUpdateDocumentTitleV2Args = {
  input: UpdateDocumentTitleInputV2;
};

export type MutationUpdateMyPreferencesArgs = {
  input: UpdateUserPreferencesInput;
};

export type MutationUpdateNotificationPreferencesArgs = {
  input: NotificationDeliveryPreferencesInput;
};

export type MutationUpdateOneDocumentCommentArgs = {
  input: UpdateOneDocumentCommentInput;
};

export type MutationUpdateOneDocumentTemplateArgs = {
  input: UpdateOneDocumentTemplateInput;
};

export type MutationUpdateOneDocumentVersionArgs = {
  input: UpdateOneDocumentVersionInput;
};

export type MutationUpdateOneInAppNotificationArgs = {
  input: UpdateOneInAppNotificationInput;
};

export type MutationUpdateOneLegalAnalysisArgs = {
  input: UpdateOneLegalAnalysisInput;
};

export type MutationUpdateOneLegalDocumentArgs = {
  input: UpdateOneLegalDocumentInput;
};

export type MutationUpdateOneLegalQueryArgs = {
  input: UpdateOneLegalQueryInput;
};

export type MutationUpdateOneLegalRulingArgs = {
  input: UpdateOneLegalRulingInput;
};

export type MutationUpdateOneNotificationArgs = {
  input: UpdateOneNotificationInput;
};

export type MutationUpdateOneUserArgs = {
  input: UpdateOneUserInput;
};

export type MutationUpdateOneUserPreferenceArgs = {
  input: UpdateOneUserPreferencesInput;
};

export type MutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};

export type MutationUpdateSubscriptionPlanArgs = {
  id: Scalars['String']['input'];
  input: UpdateSubscriptionPlanInput;
};

export type MutationUpdateWebhookArgs = {
  id: Scalars['String']['input'];
  input: UpdateWebhookInput;
};

export type MutationUpsertSystemSettingArgs = {
  input: SystemSettingInput;
};

export type Notification = {
  __typename?: 'Notification';
  createdAt: Scalars['DateTime']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  messageId?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['String']['output']>;
  recipientEmail: Scalars['String']['output'];
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  status: NotificationStatus;
  subject: Scalars['String']['output'];
  template: EmailTemplateType;
  templateData?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type NotificationAggregateFilter = {
  and?: InputMaybe<Array<NotificationAggregateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  errorMessage?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  messageId?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<NotificationAggregateFilter>>;
  recipientEmail?: InputMaybe<StringFieldComparison>;
  sentAt?: InputMaybe<DateFieldComparison>;
  status?: InputMaybe<NotificationStatusFilterComparison>;
  subject?: InputMaybe<StringFieldComparison>;
  template?: InputMaybe<EmailTemplateTypeFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type NotificationAggregateGroupBy = {
  __typename?: 'NotificationAggregateGroupBy';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  messageId?: Maybe<Scalars['String']['output']>;
  recipientEmail?: Maybe<Scalars['String']['output']>;
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<NotificationStatus>;
  subject?: Maybe<Scalars['String']['output']>;
  template?: Maybe<EmailTemplateType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type NotificationAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type NotificationAggregateGroupBySentAtArgs = {
  by?: GroupBy;
};

export type NotificationAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type NotificationAggregateResponse = {
  __typename?: 'NotificationAggregateResponse';
  count?: Maybe<NotificationCountAggregate>;
  groupBy?: Maybe<NotificationAggregateGroupBy>;
  max?: Maybe<NotificationMaxAggregate>;
  min?: Maybe<NotificationMinAggregate>;
};

/** Notification channel types */
export type NotificationChannel = 'BOTH' | 'EMAIL' | 'IN_APP';

export type NotificationChannels = {
  __typename?: 'NotificationChannels';
  email: Scalars['Boolean']['output'];
  inApp: Scalars['Boolean']['output'];
  push: Scalars['Boolean']['output'];
};

export type NotificationChannelsInput = {
  email?: InputMaybe<Scalars['Boolean']['input']>;
  inApp?: InputMaybe<Scalars['Boolean']['input']>;
  push?: InputMaybe<Scalars['Boolean']['input']>;
};

export type NotificationConnection = {
  __typename?: 'NotificationConnection';
  /** Array of edges. */
  edges: Array<NotificationEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type NotificationCountAggregate = {
  __typename?: 'NotificationCountAggregate';
  createdAt?: Maybe<Scalars['Int']['output']>;
  errorMessage?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  messageId?: Maybe<Scalars['Int']['output']>;
  recipientEmail?: Maybe<Scalars['Int']['output']>;
  sentAt?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  subject?: Maybe<Scalars['Int']['output']>;
  template?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
  userId?: Maybe<Scalars['Int']['output']>;
};

export type NotificationDeliveryPreferences = {
  __typename?: 'NotificationDeliveryPreferences';
  /** Enable email notifications */
  emailEnabled: Scalars['Boolean']['output'];
  /** Notification types to exclude from email */
  excludeEmailTypes?: Maybe<Array<NotificationTemplateType>>;
  /** Notification types to exclude from in-app */
  excludeInAppTypes?: Maybe<Array<NotificationTemplateType>>;
  /** Enable in-app notifications */
  inAppEnabled: Scalars['Boolean']['output'];
  /** User ID */
  userId: Scalars['String']['output'];
};

export type NotificationDeliveryPreferencesInput = {
  /** Enable email notifications */
  emailEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Notification types to exclude from email */
  excludeEmailTypes?: InputMaybe<Array<NotificationTemplateType>>;
  /** Notification types to exclude from in-app */
  excludeInAppTypes?: InputMaybe<Array<NotificationTemplateType>>;
  /** Enable in-app notifications */
  inAppEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** User ID */
  userId: Scalars['String']['input'];
};

export type NotificationEdge = {
  __typename?: 'NotificationEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the Notification */
  node: Notification;
};

export type NotificationFilter = {
  and?: InputMaybe<Array<NotificationFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  errorMessage?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  messageId?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<NotificationFilter>>;
  recipientEmail?: InputMaybe<StringFieldComparison>;
  sentAt?: InputMaybe<DateFieldComparison>;
  status?: InputMaybe<NotificationStatusFilterComparison>;
  subject?: InputMaybe<StringFieldComparison>;
  template?: InputMaybe<EmailTemplateTypeFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type NotificationMaxAggregate = {
  __typename?: 'NotificationMaxAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  messageId?: Maybe<Scalars['String']['output']>;
  recipientEmail?: Maybe<Scalars['String']['output']>;
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<NotificationStatus>;
  subject?: Maybe<Scalars['String']['output']>;
  template?: Maybe<EmailTemplateType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type NotificationMinAggregate = {
  __typename?: 'NotificationMinAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  messageId?: Maybe<Scalars['String']['output']>;
  recipientEmail?: Maybe<Scalars['String']['output']>;
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<NotificationStatus>;
  subject?: Maybe<Scalars['String']['output']>;
  template?: Maybe<EmailTemplateType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type NotificationPreferences = {
  __typename?: 'NotificationPreferences';
  channels: NotificationChannels;
  documentUpdates: Scalars['Boolean']['output'];
  marketingEmails: Scalars['Boolean']['output'];
  queryResponses: Scalars['Boolean']['output'];
  systemAlerts: Scalars['Boolean']['output'];
};

export type NotificationPreferencesInput = {
  channels?: InputMaybe<NotificationChannelsInput>;
  documentUpdates?: InputMaybe<Scalars['Boolean']['input']>;
  marketingEmails?: InputMaybe<Scalars['Boolean']['input']>;
  queryResponses?: InputMaybe<Scalars['Boolean']['input']>;
  systemAlerts?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Priority levels for notifications */
export type NotificationPriority = 'HIGH' | 'LOW' | 'NORMAL' | 'URGENT';

export type NotificationSort = {
  direction: SortDirection;
  field: NotificationSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type NotificationSortFields =
  | 'createdAt'
  | 'errorMessage'
  | 'id'
  | 'messageId'
  | 'recipientEmail'
  | 'sentAt'
  | 'status'
  | 'subject'
  | 'template'
  | 'updatedAt'
  | 'userId';

/** Status of email notifications */
export type NotificationStatus = 'BOUNCED' | 'FAILED' | 'PENDING' | 'QUEUED' | 'SENT';

export type NotificationStatusFilterComparison = {
  eq?: InputMaybe<NotificationStatus>;
  gt?: InputMaybe<NotificationStatus>;
  gte?: InputMaybe<NotificationStatus>;
  iLike?: InputMaybe<NotificationStatus>;
  in?: InputMaybe<Array<NotificationStatus>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<NotificationStatus>;
  lt?: InputMaybe<NotificationStatus>;
  lte?: InputMaybe<NotificationStatus>;
  neq?: InputMaybe<NotificationStatus>;
  notILike?: InputMaybe<NotificationStatus>;
  notIn?: InputMaybe<Array<NotificationStatus>>;
  notLike?: InputMaybe<NotificationStatus>;
};

/** Notification template types */
export type NotificationTemplateType =
  | 'DOCUMENT_COMPLETED'
  | 'DOCUMENT_FAILED'
  | 'DOCUMENT_SHARED'
  | 'EMAIL_VERIFICATION'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'QUERY_COMPLETED'
  | 'QUERY_FAILED'
  | 'RULING_INDEXED'
  | 'RULING_SEARCH_READY'
  | 'SECURITY_ALERT'
  | 'SYSTEM_MAINTENANCE'
  | 'SYSTEM_UPDATE'
  | 'WELCOME';

export type NumberFieldComparison = {
  between?: InputMaybe<NumberFieldComparisonBetween>;
  eq?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  in?: InputMaybe<Array<Scalars['Float']['input']>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  neq?: InputMaybe<Scalars['Float']['input']>;
  notBetween?: InputMaybe<NumberFieldComparisonBetween>;
  notIn?: InputMaybe<Array<Scalars['Float']['input']>>;
};

export type NumberFieldComparisonBetween = {
  lower: Scalars['Float']['input'];
  upper: Scalars['Float']['input'];
};

export type OperationBreakdown = {
  __typename?: 'OperationBreakdown';
  cost: Scalars['Float']['output'];
  operationType: AiOperationType;
  requestCount: Scalars['Int']['output'];
  tokenCount: Scalars['Int']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  /** The cursor of the last returned record. */
  endCursor?: Maybe<Scalars['ConnectionCursor']['output']>;
  /** true if paging forward and there are more records. */
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  /** true if paging backwards and there are more records. */
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  /** The cursor of the first returned record. */
  startCursor?: Maybe<Scalars['ConnectionCursor']['output']>;
};

export type PaymentHistoryItem = {
  __typename?: 'PaymentHistoryItem';
  amount: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  invoiceId?: Maybe<Scalars['String']['output']>;
  method: PaymentMethod;
  refundAmount?: Maybe<Scalars['String']['output']>;
  refundedAt?: Maybe<Scalars['String']['output']>;
  status: PaymentStatus;
};

/** Payment method */
export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'OTHER' | 'PAYPAL';

export type PaymentMethodInfo = {
  __typename?: 'PaymentMethodInfo';
  brand: Scalars['String']['output'];
  expiryMonth: Scalars['String']['output'];
  expiryYear: Scalars['String']['output'];
  id: Scalars['String']['output'];
  isDefault: Scalars['Boolean']['output'];
  last4: Scalars['String']['output'];
};

/** Payment status */
export type PaymentStatus = 'COMPLETED' | 'FAILED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED';

export type PdfExportJob = {
  __typename?: 'PdfExportJob';
  /** Document ID being exported */
  documentId: Scalars['ID']['output'];
  /** Unique job ID for tracking */
  jobId: Scalars['ID']['output'];
  /** Message describing current state */
  message: Scalars['String']['output'];
  /** Current status of the job */
  status: Scalars['String']['output'];
};

export type PdfExportOptionsInput = {
  /** Page format (default: A4) */
  format?: InputMaybe<PdfPageFormat>;
  /** Include footer with page numbers */
  includeFooter?: InputMaybe<Scalars['Boolean']['input']>;
  /** Include header with document title and date */
  includeHeader?: InputMaybe<Scalars['Boolean']['input']>;
  /** Include table of contents */
  includeTableOfContents?: InputMaybe<Scalars['Boolean']['input']>;
  /** Language for formatting (default: "pl" for Polish) */
  language?: InputMaybe<Scalars['String']['input']>;
  /** Watermark text (e.g., "DRAFT") */
  watermark?: InputMaybe<Scalars['String']['input']>;
};

export type PdfExportResult = {
  __typename?: 'PdfExportResult';
  /** Document ID that was exported */
  documentId: Scalars['ID']['output'];
  /** Size of the PDF file in bytes */
  fileSizeBytes: Scalars['Float']['output'];
  /** Generated filename for the PDF */
  filename: Scalars['String']['output'];
  /** Time taken to generate the PDF in milliseconds */
  generationTimeMs: Scalars['Float']['output'];
  /** Number of pages in the PDF */
  pageCount: Scalars['Float']['output'];
  /** Base64-encoded PDF content */
  pdfBase64: Scalars['String']['output'];
};

export type PdfExportStatus = {
  __typename?: 'PdfExportStatus';
  /** Error message if job failed */
  error?: Maybe<Scalars['String']['output']>;
  /** Job ID */
  jobId: Scalars['ID']['output'];
  /** Job progress (0-100) */
  progress?: Maybe<Scalars['Float']['output']>;
  /** Result if job is completed */
  result?: Maybe<PdfExportResult>;
  /** Current job status */
  status: Scalars['String']['output'];
};

/** Page format for PDF export */
export type PdfPageFormat = 'A4' | 'LEGAL' | 'LETTER';

/** Subscription plan tiers */
export type PlanTier = 'BASIC' | 'ENTERPRISE' | 'FREE' | 'PROFESSIONAL';

export type PolishFormattingRulesInput = {
  addressFormat?: InputMaybe<Scalars['String']['input']>;
  currencyFormat?: InputMaybe<Scalars['String']['input']>;
  dateFormat?: InputMaybe<Scalars['String']['input']>;
  legalCitations?: InputMaybe<Scalars['Boolean']['input']>;
  numberFormat?: InputMaybe<Scalars['String']['input']>;
};

export type PublishDocumentInputV2 = {
  documentId: Scalars['ID']['input'];
  publishedBy: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Advanced search with boolean operators (AND, OR, NOT) and field-specific search */
  advancedSearchLegalRulings: AdvancedLegalRulingSearchResponse;
  /** Search legal rulings across multiple sources (LOCAL, SAOS, ISAP) with relevance ranking */
  aggregatedSearchLegalRulings: AggregatedLegalRulingSearchResponse;
  aiUsageMetrics: AiUsageMetrics;
  analyticsDashboard: AnalyticsDashboard;
  auditLog: AuditLog;
  auditLogAggregate: Array<AuditLogAggregateResponse>;
  auditLogs: AuditLogConnection;
  backup?: Maybe<Backup>;
  backupStats: BackupStats;
  backups: Array<Backup>;
  /** Check if the current user can access a specific feature */
  canAccessFeature: Scalars['Boolean']['output'];
  /** Check the current user quota for a specific resource */
  checkQuota: CheckQuotaResponse;
  /** Count legal rulings matching filter criteria */
  countLegalRulings: Scalars['Int']['output'];
  documentComment: DocumentComment;
  documentCommentAggregate: Array<DocumentCommentAggregateResponse>;
  documentComments: DocumentCommentConnection;
  /** Get the latest version of a document */
  documentLatestVersion?: Maybe<DocumentVersion>;
  documentMetrics: DocumentMetrics;
  /** Get all shares for a document */
  documentShares: Array<DocumentShare>;
  documentTemplate: DocumentTemplate;
  documentTemplateAggregate: Array<DocumentTemplateAggregateResponse>;
  documentTemplates: DocumentTemplateConnection;
  documentV2?: Maybe<LegalDocumentV2>;
  documentVersion: DocumentVersion;
  documentVersionAggregate: Array<DocumentVersionAggregateResponse>;
  /** Get a specific version of a document */
  documentVersionByNumber: DocumentVersion;
  /** Count total versions for a document */
  documentVersionCount: Scalars['Float']['output'];
  /** Get all versions for a document, ordered by version number descending */
  documentVersionHistory: Array<DocumentVersion>;
  documentVersions: DocumentVersionConnection;
  documentsByOwnerV2: Array<LegalDocumentV2>;
  documentsBySession: Array<LegalDocument>;
  /** Get all documents shared with the current user */
  documentsSharedWithMe: Array<DocumentShare>;
  /** Filter legal rulings by multiple criteria */
  filterLegalRulings: Array<LegalRuling>;
  inAppNotification: InAppNotification;
  inAppNotificationAggregate: Array<InAppNotificationAggregateResponse>;
  inAppNotifications: InAppNotificationConnection;
  legalAnalyses: LegalAnalysisConnection;
  legalAnalysis: LegalAnalysis;
  legalAnalysisAggregate: Array<LegalAnalysisAggregateResponse>;
  legalDocument: LegalDocument;
  legalDocumentAggregate: Array<LegalDocumentAggregateResponse>;
  legalDocuments: LegalDocumentConnection;
  legalQueries: LegalQueryConnection;
  legalQuery: LegalQuery;
  legalQueryAggregate: Array<LegalQueryAggregateResponse>;
  legalRuling: LegalRuling;
  legalRulingAggregate: Array<LegalRulingAggregateResponse>;
  /** Find a legal ruling by its unique case signature */
  legalRulingBySignature?: Maybe<LegalRuling>;
  legalRulings: LegalRulingConnection;
  /** Get legal rulings filtered by court type */
  legalRulingsByCourtType: Array<LegalRuling>;
  /** Get legal rulings from higher courts (Supreme, Appellate, Constitutional) */
  legalRulingsFromHigherCourts: Array<LegalRuling>;
  /** Get current authenticated user information */
  me?: Maybe<AuthUser>;
  /** Get all API keys for the current user */
  myApiKeys: Array<ApiKey>;
  /** Get billing information including subscription status and payment history */
  myBillingInfo?: Maybe<BillingInfo>;
  myDailyUsage: DailyUsageResponse;
  /** Get payment history for the current user */
  myPaymentHistory: Array<PaymentHistoryItem>;
  myPreferences: UserPreferences;
  /** Get the current user subscription */
  mySubscription?: Maybe<UserSubscription>;
  myTotalCost: Scalars['Float']['output'];
  myUsageRecords: Array<AiUsageRecord>;
  /** Get usage statistics for the current user subscription */
  myUsageStats?: Maybe<SubscriptionUsageStats>;
  /** Get all webhooks for the current user */
  myWebhooks: Array<Webhook>;
  notification: Notification;
  notificationAggregate: Array<NotificationAggregateResponse>;
  /** Get notification preferences for a user */
  notificationPreferences: NotificationDeliveryPreferences;
  notifications: NotificationConnection;
  /** Get the status of a PDF export job */
  pdfExportStatus: PdfExportStatus;
  /** Get all documents pending moderation review */
  pendingModerationDocuments: Array<LegalDocument>;
  /** Get legal queries that are waiting for AI answers */
  pendingQueries: Array<LegalQuery>;
  publicSystemSettings: Array<SystemSetting>;
  /** Get all legal queries for a specific session */
  queriesBySession: Array<LegalQuery>;
  queryMetrics: QueryMetrics;
  /** Get recent notifications for a user */
  recentNotifications: Array<InAppNotification>;
  /** Full-text search across documents with relevance ranking */
  searchLegalDocuments: LegalDocumentSearchResponse;
  /** Full-text search across queries with relevance ranking */
  searchLegalQueries: LegalQuerySearchResponse;
  /** Full-text search for legal rulings with relevance ranking */
  searchLegalRulings: LegalRulingSearchResponse;
  /** Get a subscription plan by ID */
  subscriptionPlan?: Maybe<SubscriptionPlan>;
  /** Get all active subscription plans ordered by price */
  subscriptionPlans: Array<SubscriptionPlan>;
  systemHealthMetrics: SystemHealthMetrics;
  systemSetting?: Maybe<SystemSetting>;
  systemSettings: Array<SystemSetting>;
  systemSettingsByCategory: Array<SystemSetting>;
  topUsersByUsage: Scalars['String']['output'];
  /** Get count of unread notifications for a user */
  unreadNotificationCount: Scalars['Int']['output'];
  usageStats: UsageStatsResponse;
  user: User;
  userAggregate: Array<UserAggregateResponse>;
  userGrowthMetrics: UserGrowthMetrics;
  userPreference: UserPreferences;
  userPreferences: UserPreferencesConnection;
  userPreferencesAggregate: Array<UserPreferencesAggregateResponse>;
  userSession: UserSession;
  userSessionAggregate: Array<UserSessionAggregateResponse>;
  userSessions: UserSessionConnection;
  userUsageRecords: Array<AiUsageRecord>;
  users: UserConnection;
  /** Validate an API key and check if it has the required scopes */
  validateApiKey: ValidateApiKeyResponse;
  /** Get a webhook by ID */
  webhook: Webhook;
  /** Get recent deliveries for a webhook */
  webhookDeliveries: Array<WebhookDelivery>;
  /** Get webhook statistics for the current user */
  webhookStats: WebhookStats;
};

export type QueryAdvancedSearchLegalRulingsArgs = {
  input: AdvancedSearchLegalRulingsInput;
};

export type QueryAggregatedSearchLegalRulingsArgs = {
  input: AggregatedSearchLegalRulingsInput;
};

export type QueryAiUsageMetricsArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryAnalyticsDashboardArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryAuditLogArgs = {
  id: Scalars['ID']['input'];
};

export type QueryAuditLogAggregateArgs = {
  filter?: InputMaybe<AuditLogAggregateFilter>;
};

export type QueryAuditLogsArgs = {
  filter?: AuditLogFilter;
  paging?: CursorPaging;
  sorting?: Array<AuditLogSort>;
};

export type QueryBackupArgs = {
  id: Scalars['ID']['input'];
};

export type QueryBackupsArgs = {
  limit?: InputMaybe<Scalars['Float']['input']>;
  offset?: InputMaybe<Scalars['Float']['input']>;
};

export type QueryCanAccessFeatureArgs = {
  featureKey: Scalars['String']['input'];
};

export type QueryCheckQuotaArgs = {
  input: CheckQuotaInput;
};

export type QueryCountLegalRulingsArgs = {
  input?: InputMaybe<FilterLegalRulingsInput>;
};

export type QueryDocumentCommentArgs = {
  id: Scalars['ID']['input'];
};

export type QueryDocumentCommentAggregateArgs = {
  filter?: InputMaybe<DocumentCommentAggregateFilter>;
};

export type QueryDocumentCommentsArgs = {
  filter?: DocumentCommentFilter;
  paging?: CursorPaging;
  sorting?: Array<DocumentCommentSort>;
};

export type QueryDocumentLatestVersionArgs = {
  documentId: Scalars['ID']['input'];
};

export type QueryDocumentMetricsArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryDocumentSharesArgs = {
  documentId: Scalars['ID']['input'];
};

export type QueryDocumentTemplateArgs = {
  id: Scalars['ID']['input'];
};

export type QueryDocumentTemplateAggregateArgs = {
  filter?: InputMaybe<DocumentTemplateAggregateFilter>;
};

export type QueryDocumentTemplatesArgs = {
  filter?: DocumentTemplateFilter;
  paging?: CursorPaging;
  sorting?: Array<DocumentTemplateSort>;
};

export type QueryDocumentV2Args = {
  id: Scalars['ID']['input'];
};

export type QueryDocumentVersionArgs = {
  id: Scalars['ID']['input'];
};

export type QueryDocumentVersionAggregateArgs = {
  filter?: InputMaybe<DocumentVersionAggregateFilter>;
};

export type QueryDocumentVersionByNumberArgs = {
  documentId: Scalars['ID']['input'];
  versionNumber: Scalars['Float']['input'];
};

export type QueryDocumentVersionCountArgs = {
  documentId: Scalars['ID']['input'];
};

export type QueryDocumentVersionHistoryArgs = {
  documentId: Scalars['ID']['input'];
};

export type QueryDocumentVersionsArgs = {
  filter?: DocumentVersionFilter;
  paging?: CursorPaging;
  sorting?: Array<DocumentVersionSort>;
};

export type QueryDocumentsByOwnerV2Args = {
  ownerId: Scalars['ID']['input'];
  status?: InputMaybe<DocumentStatusV2>;
};

export type QueryDocumentsBySessionArgs = {
  sessionId: Scalars['String']['input'];
};

export type QueryDocumentsSharedWithMeArgs = {
  permission?: InputMaybe<SharePermission>;
};

export type QueryFilterLegalRulingsArgs = {
  input: FilterLegalRulingsInput;
};

export type QueryInAppNotificationArgs = {
  id: Scalars['ID']['input'];
};

export type QueryInAppNotificationAggregateArgs = {
  filter?: InputMaybe<InAppNotificationAggregateFilter>;
};

export type QueryInAppNotificationsArgs = {
  filter?: InAppNotificationFilter;
  paging?: CursorPaging;
  sorting?: Array<InAppNotificationSort>;
};

export type QueryLegalAnalysesArgs = {
  filter?: LegalAnalysisFilter;
  paging?: CursorPaging;
  sorting?: Array<LegalAnalysisSort>;
};

export type QueryLegalAnalysisArgs = {
  id: Scalars['ID']['input'];
};

export type QueryLegalAnalysisAggregateArgs = {
  filter?: InputMaybe<LegalAnalysisAggregateFilter>;
};

export type QueryLegalDocumentArgs = {
  id: Scalars['ID']['input'];
};

export type QueryLegalDocumentAggregateArgs = {
  filter?: InputMaybe<LegalDocumentAggregateFilter>;
};

export type QueryLegalDocumentsArgs = {
  filter?: LegalDocumentFilter;
  paging?: CursorPaging;
  sorting?: Array<LegalDocumentSort>;
};

export type QueryLegalQueriesArgs = {
  filter?: LegalQueryFilter;
  paging?: CursorPaging;
  sorting?: Array<LegalQuerySort>;
};

export type QueryLegalQueryArgs = {
  id: Scalars['ID']['input'];
};

export type QueryLegalQueryAggregateArgs = {
  filter?: InputMaybe<LegalQueryAggregateFilter>;
};

export type QueryLegalRulingArgs = {
  id: Scalars['ID']['input'];
};

export type QueryLegalRulingAggregateArgs = {
  filter?: InputMaybe<LegalRulingAggregateFilter>;
};

export type QueryLegalRulingBySignatureArgs = {
  signature: Scalars['String']['input'];
};

export type QueryLegalRulingsArgs = {
  filter?: LegalRulingFilter;
  paging?: CursorPaging;
  sorting?: Array<LegalRulingSort>;
};

export type QueryLegalRulingsByCourtTypeArgs = {
  courtType: CourtType;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryLegalRulingsFromHigherCourtsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryMyDailyUsageArgs = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type QueryMyTotalCostArgs = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type QueryMyUsageRecordsArgs = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Float']['input']>;
  offset?: InputMaybe<Scalars['Float']['input']>;
  operationType?: InputMaybe<AiOperationType>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type QueryMyWebhooksArgs = {
  status?: InputMaybe<Scalars['String']['input']>;
};

export type QueryNotificationArgs = {
  id: Scalars['ID']['input'];
};

export type QueryNotificationAggregateArgs = {
  filter?: InputMaybe<NotificationAggregateFilter>;
};

export type QueryNotificationPreferencesArgs = {
  userId: Scalars['String']['input'];
};

export type QueryNotificationsArgs = {
  filter?: NotificationFilter;
  paging?: CursorPaging;
  sorting?: Array<NotificationSort>;
};

export type QueryPdfExportStatusArgs = {
  jobId: Scalars['ID']['input'];
};

export type QueryPendingQueriesArgs = {
  limit?: InputMaybe<Scalars['Float']['input']>;
};

export type QueryQueriesBySessionArgs = {
  sessionId: Scalars['String']['input'];
};

export type QueryQueryMetricsArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryRecentNotificationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
  userId: Scalars['String']['input'];
};

export type QuerySearchLegalDocumentsArgs = {
  input: SearchLegalDocumentsInput;
};

export type QuerySearchLegalQueriesArgs = {
  input: SearchLegalQueriesInput;
};

export type QuerySearchLegalRulingsArgs = {
  input: SearchLegalRulingsInput;
};

export type QuerySubscriptionPlanArgs = {
  id: Scalars['String']['input'];
};

export type QuerySystemHealthMetricsArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QuerySystemSettingArgs = {
  key: Scalars['String']['input'];
};

export type QuerySystemSettingsByCategoryArgs = {
  category: SettingCategory;
};

export type QueryTopUsersByUsageArgs = {
  by?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Float']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type QueryUnreadNotificationCountArgs = {
  userId: Scalars['String']['input'];
};

export type QueryUsageStatsArgs = {
  query: UsageStatsQueryInput;
};

export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};

export type QueryUserAggregateArgs = {
  filter?: InputMaybe<UserAggregateFilter>;
};

export type QueryUserGrowthMetricsArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryUserPreferenceArgs = {
  id: Scalars['ID']['input'];
};

export type QueryUserPreferencesArgs = {
  filter?: UserPreferencesFilter;
  paging?: CursorPaging;
  sorting?: Array<UserPreferencesSort>;
};

export type QueryUserPreferencesAggregateArgs = {
  filter?: InputMaybe<UserPreferencesAggregateFilter>;
};

export type QueryUserSessionArgs = {
  id: Scalars['ID']['input'];
};

export type QueryUserSessionAggregateArgs = {
  filter?: InputMaybe<UserSessionAggregateFilter>;
};

export type QueryUserSessionsArgs = {
  filter?: UserSessionFilter;
  paging?: CursorPaging;
  sorting?: Array<UserSessionSort>;
};

export type QueryUserUsageRecordsArgs = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Float']['input']>;
  offset?: InputMaybe<Scalars['Float']['input']>;
  operationType?: InputMaybe<AiOperationType>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  userId: Scalars['String']['input'];
};

export type QueryUsersArgs = {
  filter?: UserFilter;
  paging?: CursorPaging;
  sorting?: Array<UserSort>;
};

export type QueryValidateApiKeyArgs = {
  input: ValidateApiKeyInput;
};

export type QueryWebhookArgs = {
  id: Scalars['String']['input'];
};

export type QueryWebhookDeliveriesArgs = {
  limit?: InputMaybe<Scalars['Float']['input']>;
  webhookId: Scalars['String']['input'];
};

export type QueryMetrics = {
  __typename?: 'QueryMetrics';
  /** Average citations per query */
  avgCitationsPerQuery: Scalars['Float']['output'];
  /** Average queries per user */
  avgQueriesPerUser: Scalars['Float']['output'];
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  /** Total citations across all queries */
  totalCitations: Scalars['Int']['output'];
  totalQueries: Scalars['Int']['output'];
  uniqueUsers: Scalars['Int']['output'];
};

export type RefreshTokenInput = {
  /** Refresh token */
  refreshToken: Scalars['String']['input'];
};

export type RefreshTokenPayload = {
  __typename?: 'RefreshTokenPayload';
  /** New JWT access token */
  accessToken: Scalars['String']['output'];
  /** New JWT refresh token */
  refreshToken: Scalars['String']['output'];
};

export type RegisterInput = {
  /** Email address */
  email: Scalars['String']['input'];
  /** First name */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Last name */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** User password */
  password: Scalars['String']['input'];
  /** Optional username */
  username?: InputMaybe<Scalars['String']['input']>;
};

export type RejectDocumentInput = {
  /** Document ID to reject */
  documentId: Scalars['ID']['input'];
  /** Reason for rejection (required) */
  reason: Scalars['String']['input'];
};

export type RelatedDocumentLink = {
  __typename?: 'RelatedDocumentLink';
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['String']['output'];
  relationshipType: Scalars['String']['output'];
  relevanceScore?: Maybe<Scalars['Float']['output']>;
};

export type RelatedDocumentLinkInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  documentId: Scalars['String']['input'];
  relationshipType: Scalars['String']['input'];
  relevanceScore?: InputMaybe<Scalars['Float']['input']>;
};

export type RenderTemplateInput = {
  templateId: Scalars['String']['input'];
  variables: Scalars['JSON']['input'];
};

export type ResetUserPasswordInput = {
  newPassword: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type RestoreBackupInput = {
  /** Create a new database instead of overwriting */
  createNewDatabase?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  /** New database name if createNewDatabase is true */
  newDatabaseName?: InputMaybe<Scalars['String']['input']>;
  /** Target database name (defaults to current) */
  targetDatabase?: InputMaybe<Scalars['String']['input']>;
};

export type RulingMetadata = {
  __typename?: 'RulingMetadata';
  keywords?: Maybe<Array<Scalars['String']['output']>>;
  legalArea?: Maybe<Scalars['String']['output']>;
  relatedCases?: Maybe<Array<Scalars['String']['output']>>;
  sourceReference?: Maybe<Scalars['String']['output']>;
};

/** Specific fields to search in */
export type SearchField =
  | 'ALL'
  | 'COURT_NAME'
  | 'FULL_TEXT'
  | 'KEYWORDS'
  | 'LEGAL_AREA'
  | 'SIGNATURE'
  | 'SUMMARY';

export type SearchLegalDocumentsInput = {
  /** End date for date range filter (ISO 8601 format) */
  endDate?: InputMaybe<Scalars['String']['input']>;
  /** Maximum number of results to return */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of results to skip for pagination */
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Search query for full-text search across title and content */
  query: Scalars['String']['input'];
  /** Filter by session ID */
  sessionId?: InputMaybe<Scalars['String']['input']>;
  /** Start date for date range filter (ISO 8601 format) */
  startDate?: InputMaybe<Scalars['String']['input']>;
  /** Filter by document status */
  status?: InputMaybe<DocumentStatus>;
  /** Filter by document type */
  type?: InputMaybe<DocumentType>;
};

export type SearchLegalQueriesInput = {
  /** End date for date range filter (ISO 8601 format) */
  endDate?: InputMaybe<Scalars['String']['input']>;
  /** Maximum number of results to return */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of results to skip for pagination */
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Search query for full-text search across questions and answers */
  query: Scalars['String']['input'];
  /** Filter by session ID */
  sessionId?: InputMaybe<Scalars['String']['input']>;
  /** Start date for date range filter (ISO 8601 format) */
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type SearchLegalRulingsInput = {
  /** Filter by court type */
  courtType?: InputMaybe<CourtType>;
  /** Filter by ruling date from (ISO 8601 date string) */
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  /** Filter by ruling date to (ISO 8601 date string) */
  dateTo?: InputMaybe<Scalars['String']['input']>;
  /** Maximum number of results to return (default: 20, max: 100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of results to skip for pagination */
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Search query text */
  query: Scalars['String']['input'];
};

/** Source of the search result (LOCAL, SAOS, or ISAP) */
export type SearchSource = 'ISAP' | 'LOCAL' | 'SAOS';

export type SendNotificationInput = {
  /** Optional action label for the action link button */
  actionLabel?: InputMaybe<Scalars['String']['input']>;
  /** Optional action link for navigation */
  actionLink?: InputMaybe<Scalars['String']['input']>;
  /** Channel to send notification through */
  channel?: InputMaybe<NotificationChannel>;
  /** Optional custom message for in-app notification */
  customMessage?: InputMaybe<Scalars['String']['input']>;
  /** Type of in-app notification for UI styling */
  inAppType?: InputMaybe<InAppNotificationType>;
  /** Additional metadata for tracking */
  metadata?: InputMaybe<Scalars['String']['input']>;
  /** Priority level of the notification */
  priority?: InputMaybe<NotificationPriority>;
  /** Data for template rendering (JSON string) */
  templateData?: InputMaybe<Scalars['String']['input']>;
  /** Type of notification template to use */
  templateType: NotificationTemplateType;
  /** User email address */
  userEmail: Scalars['String']['input'];
  /** User ID to receive the notification */
  userId: Scalars['String']['input'];
};

export type SendNotificationResponse = {
  __typename?: 'SendNotificationResponse';
  /** Whether the email notification was sent */
  emailSent: Scalars['Boolean']['output'];
  /** Whether the in-app notification was created */
  inAppCreated: Scalars['Boolean']['output'];
  /** ID of the created in-app notification */
  notificationId?: Maybe<Scalars['String']['output']>;
};

/** Mode of operation for a user session */
export type SessionMode = 'LAWYER' | 'SIMPLE';

export type SessionModeFilterComparison = {
  eq?: InputMaybe<SessionMode>;
  gt?: InputMaybe<SessionMode>;
  gte?: InputMaybe<SessionMode>;
  iLike?: InputMaybe<SessionMode>;
  in?: InputMaybe<Array<SessionMode>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<SessionMode>;
  lt?: InputMaybe<SessionMode>;
  lte?: InputMaybe<SessionMode>;
  neq?: InputMaybe<SessionMode>;
  notILike?: InputMaybe<SessionMode>;
  notIn?: InputMaybe<Array<SessionMode>>;
  notLike?: InputMaybe<SessionMode>;
};

/** System setting categories */
export type SettingCategory = 'AI' | 'FEATURE_FLAGS' | 'GENERAL' | 'MAINTENANCE';

/** System setting value types */
export type SettingValueType = 'BOOLEAN' | 'JSON' | 'NUMBER' | 'STRING';

export type ShareDocumentInput = {
  /** ID of the document to share */
  documentId: Scalars['ID']['input'];
  /** Optional expiration date for the share (ISO 8601 format) */
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  /** Permission level to grant */
  permission?: SharePermission;
  /** ID of the user to share the document with */
  sharedWithUserId: Scalars['ID']['input'];
};

/** Permission level for document sharing */
export type SharePermission = 'ADMIN' | 'COMMENT' | 'EDIT' | 'VIEW';

/** Sort Directions */
export type SortDirection = 'ASC' | 'DESC';

/** Sort Nulls Options */
export type SortNulls = 'NULLS_FIRST' | 'NULLS_LAST';

export type StringFieldComparison = {
  eq?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  gte?: InputMaybe<Scalars['String']['input']>;
  iLike?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
  lte?: InputMaybe<Scalars['String']['input']>;
  neq?: InputMaybe<Scalars['String']['input']>;
  notILike?: InputMaybe<Scalars['String']['input']>;
  notIn?: InputMaybe<Array<Scalars['String']['input']>>;
  notLike?: InputMaybe<Scalars['String']['input']>;
};

export type SubmitLegalQueryInput = {
  /** The legal question to be answered by the AI */
  question: Scalars['String']['input'];
  /** Session ID for the user submitting the query (optional - will be auto-created if not provided) */
  sessionId?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Subscribe to cursor position updates for a document */
  cursorUpdated: CursorEventPayload;
  /** Subscribe to document edits for real-time collaboration */
  documentEdited: DocumentEditEventPayload;
  /** Subscribe to document status changes */
  documentStatusChanged: DocumentStatusChange;
  /** Subscribe to new in-app notifications */
  inAppNotificationCreated: InAppNotificationCreatedPayload;
  /** Subscribe to user joined events for a document */
  userJoinedDocument: UserJoinedEventPayload;
  /** Subscribe to user left events for a document */
  userLeftDocument: UserLeftEventPayload;
};

export type SubscriptionCursorUpdatedArgs = {
  documentId: Scalars['String']['input'];
};

export type SubscriptionDocumentEditedArgs = {
  documentId: Scalars['String']['input'];
};

export type SubscriptionDocumentStatusChangedArgs = {
  documentId?: InputMaybe<Scalars['String']['input']>;
  sessionId?: InputMaybe<Scalars['String']['input']>;
};

export type SubscriptionInAppNotificationCreatedArgs = {
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type SubscriptionUserJoinedDocumentArgs = {
  documentId: Scalars['String']['input'];
};

export type SubscriptionUserLeftDocumentArgs = {
  documentId: Scalars['String']['input'];
};

export type SubscriptionPlan = {
  __typename?: 'SubscriptionPlan';
  billingInterval: BillingInterval;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  displayOrder: Scalars['Float']['output'];
  features: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  maxUsers?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  stripePriceId?: Maybe<Scalars['String']['output']>;
  stripeYearlyPriceId?: Maybe<Scalars['String']['output']>;
  tier: PlanTier;
  trialDays: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  yearlyDiscount: Scalars['Float']['output'];
};

/** Subscription status */
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE' | 'TRIALING';

export type SubscriptionUsageStats = {
  __typename?: 'SubscriptionUsageStats';
  daysRemaining: Scalars['Int']['output'];
  periodEnd: Scalars['String']['output'];
  periodStart: Scalars['String']['output'];
  planTier: PlanTier;
  subscriptionId: Scalars['ID']['output'];
  usage: Scalars['String']['output'];
};

export type SuspendUserInput = {
  reason: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type SystemHealthMetrics = {
  __typename?: 'SystemHealthMetrics';
  /** Active user sessions (placeholder) */
  activeSessions: Scalars['Int']['output'];
  /** Average AI response time in ms (placeholder) */
  avgResponseTime: Scalars['Float']['output'];
  /** Document generation success rate */
  documentSuccessRate: Scalars['Float']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type SystemSetting = {
  __typename?: 'SystemSetting';
  category: SettingCategory;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  metadata?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  value?: Maybe<Scalars['String']['output']>;
  valueType: SettingValueType;
};

export type SystemSettingInput = {
  category?: InputMaybe<SettingCategory>;
  description?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  metadata?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
  valueType?: InputMaybe<SettingValueType>;
};

/** Category of legal document template */
export type TemplateCategory = 'COMPLAINT' | 'CONTRACT' | 'LAWSUIT' | 'LETTER' | 'MOTION' | 'OTHER';

export type TemplateCategoryFilterComparison = {
  eq?: InputMaybe<TemplateCategory>;
  gt?: InputMaybe<TemplateCategory>;
  gte?: InputMaybe<TemplateCategory>;
  iLike?: InputMaybe<TemplateCategory>;
  in?: InputMaybe<Array<TemplateCategory>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<TemplateCategory>;
  lt?: InputMaybe<TemplateCategory>;
  lte?: InputMaybe<TemplateCategory>;
  neq?: InputMaybe<TemplateCategory>;
  notILike?: InputMaybe<TemplateCategory>;
  notIn?: InputMaybe<Array<TemplateCategory>>;
  notLike?: InputMaybe<TemplateCategory>;
};

export type TemplateVariableInput = {
  defaultValue?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  name: Scalars['String']['input'];
  required: Scalars['Boolean']['input'];
  type: Scalars['String']['input'];
  validation?: InputMaybe<Scalars['JSON']['input']>;
};

export type TestWebhookInput = {
  event?: InputMaybe<Scalars['String']['input']>;
  payload?: InputMaybe<Scalars['String']['input']>;
  webhookId: Scalars['String']['input'];
};

export type TestWebhookResponse = {
  __typename?: 'TestWebhookResponse';
  durationMs: Scalars['Int']['output'];
  error?: Maybe<Scalars['String']['output']>;
  response?: Maybe<Scalars['String']['output']>;
  statusCode?: Maybe<Scalars['Int']['output']>;
  success: Scalars['Boolean']['output'];
};

/** Available theme options for the UI */
export type ThemePreference = 'DARK' | 'LIGHT' | 'SYSTEM';

export type ThemePreferenceFilterComparison = {
  eq?: InputMaybe<ThemePreference>;
  gt?: InputMaybe<ThemePreference>;
  gte?: InputMaybe<ThemePreference>;
  iLike?: InputMaybe<ThemePreference>;
  in?: InputMaybe<Array<ThemePreference>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<ThemePreference>;
  lt?: InputMaybe<ThemePreference>;
  lte?: InputMaybe<ThemePreference>;
  neq?: InputMaybe<ThemePreference>;
  notILike?: InputMaybe<ThemePreference>;
  notIn?: InputMaybe<Array<ThemePreference>>;
  notLike?: InputMaybe<ThemePreference>;
};

export type UpdateApiKeyInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rateLimitPerMinute?: InputMaybe<Scalars['Int']['input']>;
  scopes?: InputMaybe<Array<ApiKeyScope>>;
};

export type UpdateDocumentCommentInput = {
  position?: InputMaybe<CreateCommentPositionInput>;
  resolutionStatus?: InputMaybe<CommentResolutionStatus>;
  /** ID of the user who resolved the comment (required when marking as resolved) */
  resolvedBy?: InputMaybe<Scalars['String']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDocumentInput = {
  metadata?: InputMaybe<DocumentMetadataInput>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDocumentTemplateInput = {
  category?: InputMaybe<TemplateCategory>;
  conditionalSections?: InputMaybe<Array<ConditionalSectionInput>>;
  content?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  polishFormattingRules?: InputMaybe<PolishFormattingRulesInput>;
  variables?: InputMaybe<Array<TemplateVariableInput>>;
};

export type UpdateDocumentTitleInputV2 = {
  documentId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
  updatedBy: Scalars['ID']['input'];
};

export type UpdateDocumentVersionInput = {
  changeDescription?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInAppNotificationInput = {
  /** Optional action label for the action link button */
  actionLabel?: InputMaybe<Scalars['String']['input']>;
  /** Optional action link for navigation */
  actionLink?: InputMaybe<Scalars['String']['input']>;
  /** The notification message content */
  message?: InputMaybe<Scalars['String']['input']>;
  /** Additional metadata for extensibility (JSON string) */
  metadata?: InputMaybe<Scalars['String']['input']>;
  /** Read status */
  read?: InputMaybe<Scalars['Boolean']['input']>;
  /** Type of notification for UI styling */
  type?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLegalAnalysisInput = {
  identifiedGrounds?: InputMaybe<Array<LegalGroundInput>>;
  inputDescription?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<AnalysisMetadataInput>;
  overallConfidenceScore?: InputMaybe<Scalars['Float']['input']>;
  recommendations?: InputMaybe<Scalars['String']['input']>;
  relatedDocumentLinks?: InputMaybe<Array<RelatedDocumentLinkInput>>;
  summary?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLegalDocumentInput = {
  contentRaw?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<CreateDocumentMetadataInput>;
  /** Signed URL to download the PDF version of this document */
  pdfUrl?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<DocumentType>;
};

export type UpdateLegalQueryInput = {
  answerMarkdown?: InputMaybe<Scalars['String']['input']>;
  citations?: InputMaybe<Array<CreateCitationInput>>;
  question?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLegalRulingInput = {
  courtName?: InputMaybe<Scalars['String']['input']>;
  courtType?: InputMaybe<CourtType>;
  fullText?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<CreateRulingMetadataInput>;
  rulingDate?: InputMaybe<Scalars['String']['input']>;
  signature?: InputMaybe<Scalars['String']['input']>;
  summary?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateNotificationInput = {
  /** Error message if sending failed */
  errorMessage?: InputMaybe<Scalars['String']['input']>;
  /** SendGrid message ID */
  messageId?: InputMaybe<Scalars['String']['input']>;
  /** Additional metadata (JSON string) */
  metadata?: InputMaybe<Scalars['String']['input']>;
  /** Recipient email address */
  recipientEmail?: InputMaybe<Scalars['String']['input']>;
  /** Timestamp when email was sent */
  sentAt?: InputMaybe<Scalars['String']['input']>;
  /** Notification status */
  status?: InputMaybe<NotificationStatus>;
  /** Email subject line */
  subject?: InputMaybe<Scalars['String']['input']>;
  /** Email template type */
  template?: InputMaybe<EmailTemplateType>;
  /** Template data for rendering (JSON string) */
  templateData?: InputMaybe<Scalars['String']['input']>;
  /** User ID */
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateOneDocumentCommentInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateDocumentCommentInput;
};

export type UpdateOneDocumentTemplateInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateDocumentTemplateInput;
};

export type UpdateOneDocumentVersionInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateDocumentVersionInput;
};

export type UpdateOneInAppNotificationInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateInAppNotificationInput;
};

export type UpdateOneLegalAnalysisInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateLegalAnalysisInput;
};

export type UpdateOneLegalDocumentInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateLegalDocumentInput;
};

export type UpdateOneLegalQueryInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateLegalQueryInput;
};

export type UpdateOneLegalRulingInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateLegalRulingInput;
};

export type UpdateOneNotificationInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateNotificationInput;
};

export type UpdateOneUserInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateUserInput;
};

export type UpdateOneUserPreferencesInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateUserPreferencesInput;
};

export type UpdateProfileInput = {
  /** Email address */
  email?: InputMaybe<Scalars['String']['input']>;
  /** First name */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Last name */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Username */
  username?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSharePermissionInput = {
  /** New permission level */
  permission: SharePermission;
  /** ID of the share to update */
  shareId: Scalars['ID']['input'];
};

export type UpdateSubscriptionPlanInput = {
  billingInterval?: InputMaybe<BillingInterval>;
  description?: InputMaybe<Scalars['String']['input']>;
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  features?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  maxUsers?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Int']['input']>;
  stripePriceId?: InputMaybe<Scalars['String']['input']>;
  stripeYearlyPriceId?: InputMaybe<Scalars['String']['input']>;
  trialDays?: InputMaybe<Scalars['Int']['input']>;
  yearlyDiscount?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateTemplateInput = {
  category?: InputMaybe<TemplateCategory>;
  conditionalSections?: InputMaybe<Scalars['JSON']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  polishFormattingRules?: InputMaybe<Scalars['JSON']['input']>;
  variables?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateUserInput = {
  disclaimerAccepted?: InputMaybe<Scalars['Boolean']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserPreferencesInput = {
  aiModel?: InputMaybe<AiModelType>;
  dateFormat?: InputMaybe<Scalars['String']['input']>;
  emailNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  inAppNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  notificationPreferences?: InputMaybe<NotificationPreferencesInput>;
  theme?: InputMaybe<ThemePreference>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWebhookInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  events?: InputMaybe<Array<WebhookEvent>>;
  headers?: InputMaybe<Scalars['String']['input']>;
  maxRetries?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<WebhookStatus>;
  timeoutMs?: InputMaybe<Scalars['Int']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type UsageStatsQueryInput = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  operationType?: InputMaybe<AiOperationType>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type UsageStatsResponse = {
  __typename?: 'UsageStatsResponse';
  breakdownByOperation?: Maybe<Array<OperationBreakdown>>;
  operationCount: Scalars['Int']['output'];
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  totalCost: Scalars['Float']['output'];
  totalRequests: Scalars['Int']['output'];
  totalTokens: Scalars['Int']['output'];
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  disclaimerAccepted: Scalars['Boolean']['output'];
  disclaimerAcceptedAt?: Maybe<Scalars['DateTime']['output']>;
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  sessions?: Maybe<UserSession>;
  stripeCustomerId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

export type UserAggregateFilter = {
  and?: InputMaybe<Array<UserAggregateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  email?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  isActive?: InputMaybe<BooleanFieldComparison>;
  or?: InputMaybe<Array<UserAggregateFilter>>;
  role?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type UserAggregateGroupBy = {
  __typename?: 'UserAggregateGroupBy';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type UserAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type UserAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type UserAggregateResponse = {
  __typename?: 'UserAggregateResponse';
  count?: Maybe<UserCountAggregate>;
  groupBy?: Maybe<UserAggregateGroupBy>;
  max?: Maybe<UserMaxAggregate>;
  min?: Maybe<UserMinAggregate>;
};

export type UserConnection = {
  __typename?: 'UserConnection';
  /** Array of edges. */
  edges: Array<UserEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type UserCountAggregate = {
  __typename?: 'UserCountAggregate';
  createdAt?: Maybe<Scalars['Int']['output']>;
  email?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  isActive?: Maybe<Scalars['Int']['output']>;
  role?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type UserDeleteResponse = {
  __typename?: 'UserDeleteResponse';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  disclaimerAccepted?: Maybe<Scalars['Boolean']['output']>;
  disclaimerAcceptedAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  stripeCustomerId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type UserEdge = {
  __typename?: 'UserEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the User */
  node: User;
};

export type UserFilter = {
  and?: InputMaybe<Array<UserFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  email?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  isActive?: InputMaybe<BooleanFieldComparison>;
  or?: InputMaybe<Array<UserFilter>>;
  role?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
};

export type UserGrowthMetrics = {
  __typename?: 'UserGrowthMetrics';
  activeUsers: Scalars['Int']['output'];
  adminUsers: Scalars['Int']['output'];
  /** Growth rate as percentage */
  growthRate: Scalars['Float']['output'];
  newUsers: Scalars['Int']['output'];
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  totalUsers: Scalars['Int']['output'];
};

export type UserJoinedEventPayload = {
  __typename?: 'UserJoinedEventPayload';
  color?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['ID']['output'];
  timestamp: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
  userName: Scalars['String']['output'];
};

export type UserLeftEventPayload = {
  __typename?: 'UserLeftEventPayload';
  documentId: Scalars['ID']['output'];
  timestamp: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
  userName: Scalars['String']['output'];
};

export type UserMaxAggregate = {
  __typename?: 'UserMaxAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type UserMinAggregate = {
  __typename?: 'UserMinAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type UserPreferences = {
  __typename?: 'UserPreferences';
  aiModel: AiModelType;
  createdAt: Scalars['DateTime']['output'];
  dateFormat?: Maybe<Scalars['String']['output']>;
  emailNotifications: Scalars['Boolean']['output'];
  getNotificationPreferences: NotificationPreferences;
  id: Scalars['ID']['output'];
  inAppNotifications: Scalars['Boolean']['output'];
  locale: Scalars['String']['output'];
  theme: ThemePreference;
  timezone?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export type UserPreferencesAggregateFilter = {
  aiModel?: InputMaybe<AiModelTypeFilterComparison>;
  and?: InputMaybe<Array<UserPreferencesAggregateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  emailNotifications?: InputMaybe<BooleanFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  inAppNotifications?: InputMaybe<BooleanFieldComparison>;
  locale?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<UserPreferencesAggregateFilter>>;
  theme?: InputMaybe<ThemePreferenceFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type UserPreferencesAggregateGroupBy = {
  __typename?: 'UserPreferencesAggregateGroupBy';
  aiModel?: Maybe<AiModelType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  emailNotifications?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  inAppNotifications?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  theme?: Maybe<ThemePreference>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type UserPreferencesAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type UserPreferencesAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type UserPreferencesAggregateResponse = {
  __typename?: 'UserPreferencesAggregateResponse';
  count?: Maybe<UserPreferencesCountAggregate>;
  groupBy?: Maybe<UserPreferencesAggregateGroupBy>;
  max?: Maybe<UserPreferencesMaxAggregate>;
  min?: Maybe<UserPreferencesMinAggregate>;
};

export type UserPreferencesConnection = {
  __typename?: 'UserPreferencesConnection';
  /** Array of edges. */
  edges: Array<UserPreferencesEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type UserPreferencesCountAggregate = {
  __typename?: 'UserPreferencesCountAggregate';
  aiModel?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['Int']['output']>;
  emailNotifications?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  inAppNotifications?: Maybe<Scalars['Int']['output']>;
  locale?: Maybe<Scalars['Int']['output']>;
  theme?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
  userId?: Maybe<Scalars['Int']['output']>;
};

export type UserPreferencesDeleteResponse = {
  __typename?: 'UserPreferencesDeleteResponse';
  aiModel?: Maybe<AiModelType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  dateFormat?: Maybe<Scalars['String']['output']>;
  emailNotifications?: Maybe<Scalars['Boolean']['output']>;
  getNotificationPreferences?: Maybe<NotificationPreferences>;
  id?: Maybe<Scalars['ID']['output']>;
  inAppNotifications?: Maybe<Scalars['Boolean']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  theme?: Maybe<ThemePreference>;
  timezone?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type UserPreferencesEdge = {
  __typename?: 'UserPreferencesEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the UserPreferences */
  node: UserPreferences;
};

export type UserPreferencesFilter = {
  aiModel?: InputMaybe<AiModelTypeFilterComparison>;
  and?: InputMaybe<Array<UserPreferencesFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  emailNotifications?: InputMaybe<BooleanFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  inAppNotifications?: InputMaybe<BooleanFieldComparison>;
  locale?: InputMaybe<StringFieldComparison>;
  or?: InputMaybe<Array<UserPreferencesFilter>>;
  theme?: InputMaybe<ThemePreferenceFilterComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type UserPreferencesMaxAggregate = {
  __typename?: 'UserPreferencesMaxAggregate';
  aiModel?: Maybe<AiModelType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  theme?: Maybe<ThemePreference>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type UserPreferencesMinAggregate = {
  __typename?: 'UserPreferencesMinAggregate';
  aiModel?: Maybe<AiModelType>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  theme?: Maybe<ThemePreference>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type UserPreferencesSort = {
  direction: SortDirection;
  field: UserPreferencesSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type UserPreferencesSortFields =
  | 'aiModel'
  | 'createdAt'
  | 'emailNotifications'
  | 'id'
  | 'inAppNotifications'
  | 'locale'
  | 'theme'
  | 'updatedAt'
  | 'userId';

export type UserSession = {
  __typename?: 'UserSession';
  createdAt: Scalars['DateTime']['output'];
  endedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  mode: SessionMode;
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export type UserSessionAggregateFilter = {
  and?: InputMaybe<Array<UserSessionAggregateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  mode?: InputMaybe<SessionModeFilterComparison>;
  or?: InputMaybe<Array<UserSessionAggregateFilter>>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type UserSessionAggregateGroupBy = {
  __typename?: 'UserSessionAggregateGroupBy';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  mode?: Maybe<SessionMode>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type UserSessionAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type UserSessionAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type UserSessionAggregateResponse = {
  __typename?: 'UserSessionAggregateResponse';
  count?: Maybe<UserSessionCountAggregate>;
  groupBy?: Maybe<UserSessionAggregateGroupBy>;
  max?: Maybe<UserSessionMaxAggregate>;
  min?: Maybe<UserSessionMinAggregate>;
};

export type UserSessionConnection = {
  __typename?: 'UserSessionConnection';
  /** Array of edges. */
  edges: Array<UserSessionEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type UserSessionCountAggregate = {
  __typename?: 'UserSessionCountAggregate';
  createdAt?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  mode?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
  userId?: Maybe<Scalars['Int']['output']>;
};

export type UserSessionDeleteResponse = {
  __typename?: 'UserSessionDeleteResponse';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  endedAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  mode?: Maybe<SessionMode>;
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type UserSessionEdge = {
  __typename?: 'UserSessionEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the UserSession */
  node: UserSession;
};

export type UserSessionFilter = {
  and?: InputMaybe<Array<UserSessionFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  mode?: InputMaybe<SessionModeFilterComparison>;
  or?: InputMaybe<Array<UserSessionFilter>>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<StringFieldComparison>;
};

export type UserSessionMaxAggregate = {
  __typename?: 'UserSessionMaxAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  mode?: Maybe<SessionMode>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type UserSessionMinAggregate = {
  __typename?: 'UserSessionMinAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  mode?: Maybe<SessionMode>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type UserSessionSort = {
  direction: SortDirection;
  field: UserSessionSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type UserSessionSortFields = 'createdAt' | 'id' | 'mode' | 'updatedAt' | 'userId';

export type UserSort = {
  direction: SortDirection;
  field: UserSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type UserSortFields = 'createdAt' | 'email' | 'id' | 'isActive' | 'role' | 'updatedAt';

export type UserSubscription = {
  __typename?: 'UserSubscription';
  cancelAtPeriodEnd: Scalars['Boolean']['output'];
  canceledAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  currentPeriodEnd: Scalars['DateTime']['output'];
  currentPeriodStart: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  lastPaymentAmount?: Maybe<Scalars['Int']['output']>;
  lastPaymentAt?: Maybe<Scalars['DateTime']['output']>;
  planId: Scalars['String']['output'];
  startDate: Scalars['DateTime']['output'];
  status: SubscriptionStatus;
  stripeCustomerId?: Maybe<Scalars['String']['output']>;
  stripeSubscriptionId?: Maybe<Scalars['String']['output']>;
  trialEndDate?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  usage: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type ValidateApiKeyInput = {
  rawKey: Scalars['String']['input'];
  requiredScopes?: InputMaybe<Array<ApiKeyScope>>;
};

export type ValidateApiKeyResponse = {
  __typename?: 'ValidateApiKeyResponse';
  apiKeyId?: Maybe<Scalars['ID']['output']>;
  isValid: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  scopes?: Maybe<Array<ApiKeyScope>>;
  status?: Maybe<ApiKeyStatus>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type Webhook = {
  __typename?: 'Webhook';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  events: Array<WebhookEvent>;
  failureCount: Scalars['Float']['output'];
  headers?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastDeliveryAt?: Maybe<Scalars['DateTime']['output']>;
  lastSuccessAt?: Maybe<Scalars['DateTime']['output']>;
  maxRetries: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  status: WebhookStatus;
  successCount: Scalars['Float']['output'];
  timeoutMs: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type WebhookDelivery = {
  __typename?: 'WebhookDelivery';
  attemptCount: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  durationMs?: Maybe<Scalars['Int']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  event: Scalars['String']['output'];
  httpResponseCode?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  jobId?: Maybe<Scalars['String']['output']>;
  nextRetryAt?: Maybe<Scalars['DateTime']['output']>;
  payload: Scalars['String']['output'];
  responseBody?: Maybe<Scalars['String']['output']>;
  status: DeliveryStatus;
  webhookId: Scalars['String']['output'];
};

/** Events that can be subscribed to */
export type WebhookEvent =
  | 'DOCUMENT_CREATED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_EXPORTED'
  | 'DOCUMENT_GENERATION_COMPLETED'
  | 'DOCUMENT_UPDATED'
  | 'QUERY_ANSWERED'
  | 'QUERY_ASKED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPGRADED'
  | 'USER_CREATED'
  | 'USER_UPDATED';

export type WebhookStats = {
  __typename?: 'WebhookStats';
  activeWebhooks: Scalars['Int']['output'];
  failedDeliveries: Scalars['Int']['output'];
  pendingDeliveries: Scalars['Int']['output'];
  successfulDeliveries: Scalars['Int']['output'];
  totalDeliveries: Scalars['Int']['output'];
  totalWebhooks: Scalars['Int']['output'];
};

/** Webhook status */
export type WebhookStatus = 'ACTIVE' | 'DISABLED' | 'INACTIVE';

export type AdminUserFragmentFragment = {
  __typename?: 'User';
  id: string;
  email: string;
  username?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  isActive: boolean;
  role: string;
  disclaimerAccepted: boolean;
  disclaimerAcceptedAt?: Date | null | undefined;
  stripeCustomerId?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminUserMinimalFragmentFragment = {
  __typename?: 'User';
  id: string;
  email: string;
  username?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  isActive: boolean;
  role: string;
  createdAt: Date;
};

export type GetAdminAnalyticsDashboardQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetAdminAnalyticsDashboardQuery = {
  __typename?: 'Query';
  analyticsDashboard: {
    __typename?: 'AnalyticsDashboard';
    generatedAt: Date;
    userGrowth: {
      __typename?: 'UserGrowthMetrics';
      totalUsers: number;
      activeUsers: number;
      newUsers: number;
      adminUsers: number;
      growthRate: number;
      periodStart: Date;
      periodEnd: Date;
    };
    documents: {
      __typename?: 'DocumentMetrics';
      totalDocuments: number;
      completedDocuments: number;
      draftDocuments: number;
      failedDocuments: number;
      generatingDocuments: number;
      successRate: number;
      periodStart: Date;
      periodEnd: Date;
    };
    documentTypeDistribution: Array<{
      __typename?: 'DocumentTypeDistribution';
      documentType: string;
      count: number;
      percentage: number;
    }>;
    queries: {
      __typename?: 'QueryMetrics';
      totalQueries: number;
      uniqueUsers: number;
      avgQueriesPerUser: number;
      totalCitations: number;
      avgCitationsPerQuery: number;
      periodStart: Date;
      periodEnd: Date;
    };
    aiUsage: {
      __typename?: 'AiUsageMetrics';
      totalRequests: number;
      totalTokens: number;
      totalCost: number;
      avgCostPerRequest: number;
      avgTokensPerRequest: number;
      periodStart: Date;
      periodEnd: Date;
    };
    aiOperationBreakdown: Array<{
      __typename?: 'AiOperationBreakdown';
      operationType: string;
      requestCount: number;
      totalTokens: number;
      totalCost: number;
      costPercentage: number;
    }>;
    systemHealth: {
      __typename?: 'SystemHealthMetrics';
      documentSuccessRate: number;
      avgResponseTime: number;
      activeSessions: number;
      timestamp: Date;
    };
  };
};

export type GetAdminUserGrowthMetricsQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetAdminUserGrowthMetricsQuery = {
  __typename?: 'Query';
  userGrowthMetrics: {
    __typename?: 'UserGrowthMetrics';
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    adminUsers: number;
    growthRate: number;
    periodStart: Date;
    periodEnd: Date;
  };
};

export type GetAdminDocumentMetricsQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetAdminDocumentMetricsQuery = {
  __typename?: 'Query';
  documentMetrics: {
    __typename?: 'DocumentMetrics';
    totalDocuments: number;
    completedDocuments: number;
    draftDocuments: number;
    failedDocuments: number;
    generatingDocuments: number;
    successRate: number;
    periodStart: Date;
    periodEnd: Date;
  };
};

export type GetAdminQueryMetricsQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetAdminQueryMetricsQuery = {
  __typename?: 'Query';
  queryMetrics: {
    __typename?: 'QueryMetrics';
    totalQueries: number;
    uniqueUsers: number;
    avgQueriesPerUser: number;
    totalCitations: number;
    avgCitationsPerQuery: number;
    periodStart: Date;
    periodEnd: Date;
  };
};

export type GetAdminAiUsageMetricsQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetAdminAiUsageMetricsQuery = {
  __typename?: 'Query';
  aiUsageMetrics: {
    __typename?: 'AiUsageMetrics';
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    avgCostPerRequest: number;
    avgTokensPerRequest: number;
    periodStart: Date;
    periodEnd: Date;
  };
};

export type GetAdminSystemHealthMetricsQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetAdminSystemHealthMetricsQuery = {
  __typename?: 'Query';
  systemHealthMetrics: {
    __typename?: 'SystemHealthMetrics';
    documentSuccessRate: number;
    avgResponseTime: number;
    activeSessions: number;
    timestamp: Date;
  };
};

export type GetAdminUsersQueryVariables = Exact<{
  filter?: InputMaybe<UserFilter>;
  sorting?: InputMaybe<Array<UserSort> | UserSort>;
  paging?: InputMaybe<CursorPaging>;
}>;

export type GetAdminUsersQuery = {
  __typename?: 'Query';
  users: {
    __typename?: 'UserConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'UserEdge';
      node: {
        __typename?: 'User';
        id: string;
        email: string;
        username?: string | null | undefined;
        firstName?: string | null | undefined;
        lastName?: string | null | undefined;
        isActive: boolean;
        role: string;
      };
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage?: boolean | null | undefined;
      hasPreviousPage?: boolean | null | undefined;
      startCursor?: string | null | undefined;
      endCursor?: string | null | undefined;
    };
  };
};

export type GetAdminUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetAdminUserQuery = {
  __typename?: 'Query';
  user: {
    __typename?: 'User';
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt?: Date | null | undefined;
    stripeCustomerId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type AdminCreateUserMutationVariables = Exact<{
  input: CreateOneUserInput;
}>;

export type AdminCreateUserMutation = {
  __typename?: 'Mutation';
  createOneUser: {
    __typename?: 'User';
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt?: Date | null | undefined;
    stripeCustomerId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type AdminUpdateUserMutationVariables = Exact<{
  input: UpdateOneUserInput;
}>;

export type AdminUpdateUserMutation = {
  __typename?: 'Mutation';
  updateOneUser: {
    __typename?: 'User';
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
    createdAt: Date;
  };
};

export type AdminDeleteUserMutationVariables = Exact<{
  input: DeleteOneUserInput;
}>;

export type AdminDeleteUserMutation = {
  __typename?: 'Mutation';
  deleteOneUser: {
    __typename?: 'UserDeleteResponse';
    id?: string | null | undefined;
    email?: string | null | undefined;
  };
};

export type AdminSuspendUserMutationVariables = Exact<{
  input: SuspendUserInput;
}>;

export type AdminSuspendUserMutation = {
  __typename?: 'Mutation';
  suspendUser: {
    __typename?: 'User';
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
    createdAt: Date;
  };
};

export type AdminActivateUserMutationVariables = Exact<{
  input: ActivateUserInput;
}>;

export type AdminActivateUserMutation = {
  __typename?: 'Mutation';
  activateUser: {
    __typename?: 'User';
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
    createdAt: Date;
  };
};

export type AdminChangeUserRoleMutationVariables = Exact<{
  input: ChangeUserRoleInput;
}>;

export type AdminChangeUserRoleMutation = {
  __typename?: 'Mutation';
  changeUserRole: {
    __typename?: 'User';
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
    createdAt: Date;
  };
};

export type AdminResetUserPasswordMutationVariables = Exact<{
  input: ResetUserPasswordInput;
}>;

export type AdminResetUserPasswordMutation = {
  __typename?: 'Mutation';
  resetUserPassword: {
    __typename?: 'User';
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
    createdAt: Date;
  };
};

export type AuditLogFragmentFragment = {
  __typename?: 'AuditLog';
  id: string;
  action: AuditActionType;
  resourceType: AuditResourceType;
  resourceId?: string | null | undefined;
  userId?: string | null | undefined;
  ipAddress?: string | null | undefined;
  statusCode?: number | null | undefined;
  errorMessage?: string | null | undefined;
  userAgent?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  user?:
    | {
        __typename?: 'User';
        id: string;
        email: string;
        firstName?: string | null | undefined;
        lastName?: string | null | undefined;
      }
    | null
    | undefined;
};

export type AuditLogDetailFragmentFragment = {
  __typename?: 'AuditLog';
  changeDetails?: unknown | null | undefined;
  id: string;
  action: AuditActionType;
  resourceType: AuditResourceType;
  resourceId?: string | null | undefined;
  userId?: string | null | undefined;
  ipAddress?: string | null | undefined;
  statusCode?: number | null | undefined;
  errorMessage?: string | null | undefined;
  userAgent?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  user?:
    | {
        __typename?: 'User';
        id: string;
        email: string;
        firstName?: string | null | undefined;
        lastName?: string | null | undefined;
      }
    | null
    | undefined;
};

export type AuditLogsQueryVariables = Exact<{
  filter?: InputMaybe<AuditLogFilter>;
  paging?: InputMaybe<CursorPaging>;
  sorting?: InputMaybe<Array<AuditLogSort> | AuditLogSort>;
}>;

export type AuditLogsQuery = {
  __typename?: 'Query';
  auditLogs: {
    __typename?: 'AuditLogConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'AuditLogEdge';
      node: {
        __typename?: 'AuditLog';
        id: string;
        action: AuditActionType;
        resourceType: AuditResourceType;
        resourceId?: string | null | undefined;
        userId?: string | null | undefined;
        ipAddress?: string | null | undefined;
        statusCode?: number | null | undefined;
        errorMessage?: string | null | undefined;
        userAgent?: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
        user?:
          | {
              __typename?: 'User';
              id: string;
              email: string;
              firstName?: string | null | undefined;
              lastName?: string | null | undefined;
            }
          | null
          | undefined;
      };
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage?: boolean | null | undefined;
      hasPreviousPage?: boolean | null | undefined;
      startCursor?: string | null | undefined;
      endCursor?: string | null | undefined;
    };
  };
};

export type AuditLogQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type AuditLogQuery = {
  __typename?: 'Query';
  auditLog: {
    __typename?: 'AuditLog';
    id: string;
    action: AuditActionType;
    resourceType: AuditResourceType;
    resourceId?: string | null | undefined;
    userId?: string | null | undefined;
    ipAddress?: string | null | undefined;
    statusCode?: number | null | undefined;
    errorMessage?: string | null | undefined;
    userAgent?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    user?:
      | {
          __typename?: 'User';
          id: string;
          email: string;
          firstName?: string | null | undefined;
          lastName?: string | null | undefined;
        }
      | null
      | undefined;
  };
};

export type MyBillingInfoQueryVariables = Exact<{ [key: string]: never }>;

export type MyBillingInfoQuery = {
  __typename?: 'Query';
  myBillingInfo?:
    | {
        __typename?: 'BillingInfo';
        subscriptionId: string;
        planTier: PlanTier;
        planName: string;
        status: SubscriptionStatus;
        currentPeriodStart: string;
        currentPeriodEnd: string;
        daysRemaining: number;
        cancelAtPeriodEnd: boolean;
        usage: string;
        nextBillingAmount?: string | null | undefined;
        paymentHistory: Array<{
          __typename?: 'PaymentHistoryItem';
          id: string;
          amount: string;
          currency: string;
          status: PaymentStatus;
          method: PaymentMethod;
          description?: string | null | undefined;
          invoiceId?: string | null | undefined;
          createdAt: string;
          refundedAt?: string | null | undefined;
          refundAmount?: string | null | undefined;
        }>;
        paymentMethods?:
          | Array<{
              __typename?: 'PaymentMethodInfo';
              id: string;
              brand: string;
              last4: string;
              expiryMonth: string;
              expiryYear: string;
              isDefault: boolean;
            }>
          | null
          | undefined;
      }
    | null
    | undefined;
};

export type MyPaymentHistoryQueryVariables = Exact<{ [key: string]: never }>;

export type MyPaymentHistoryQuery = {
  __typename?: 'Query';
  myPaymentHistory: Array<{
    __typename?: 'PaymentHistoryItem';
    id: string;
    amount: string;
    currency: string;
    status: PaymentStatus;
    method: PaymentMethod;
    description?: string | null | undefined;
    invoiceId?: string | null | undefined;
    createdAt: string;
    refundedAt?: string | null | undefined;
    refundAmount?: string | null | undefined;
  }>;
};

export type SubscriptionPlansQueryVariables = Exact<{ [key: string]: never }>;

export type SubscriptionPlansQuery = {
  __typename?: 'Query';
  subscriptionPlans: Array<{
    __typename?: 'SubscriptionPlan';
    id: string;
    name: string;
    description?: string | null | undefined;
    price: number;
    billingInterval: BillingInterval;
    features: string;
    tier: PlanTier;
    isActive: boolean;
    displayOrder: number;
    maxUsers?: number | null | undefined;
    createdAt: Date;
  }>;
};

export type SubscriptionPlanQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;

export type SubscriptionPlanQuery = {
  __typename?: 'Query';
  subscriptionPlan?:
    | {
        __typename?: 'SubscriptionPlan';
        id: string;
        name: string;
        description?: string | null | undefined;
        price: number;
        billingInterval: BillingInterval;
        features: string;
        tier: PlanTier;
        isActive: boolean;
        displayOrder: number;
        maxUsers?: number | null | undefined;
        createdAt: Date;
      }
    | null
    | undefined;
};

export type CancelMySubscriptionMutationVariables = Exact<{
  input: CancelSubscriptionInput;
}>;

export type CancelMySubscriptionMutation = {
  __typename?: 'Mutation';
  cancelMySubscription: {
    __typename?: 'UserSubscription';
    id: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date | null | undefined;
    trialEndDate?: Date | null | undefined;
    startDate: Date;
    lastPaymentAt?: Date | null | undefined;
    lastPaymentAmount?: number | null | undefined;
    stripeCustomerId?: string | null | undefined;
    stripeSubscriptionId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type ResumeMySubscriptionMutationVariables = Exact<{ [key: string]: never }>;

export type ResumeMySubscriptionMutation = {
  __typename?: 'Mutation';
  resumeMySubscription: {
    __typename?: 'UserSubscription';
    id: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date | null | undefined;
    trialEndDate?: Date | null | undefined;
    startDate: Date;
    lastPaymentAt?: Date | null | undefined;
    lastPaymentAmount?: number | null | undefined;
    stripeCustomerId?: string | null | undefined;
    stripeSubscriptionId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type ChangeSubscriptionPlanMutationVariables = Exact<{
  newPlanId: Scalars['String']['input'];
}>;

export type ChangeSubscriptionPlanMutation = {
  __typename?: 'Mutation';
  changeSubscriptionPlan: {
    __typename?: 'UserSubscription';
    id: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date | null | undefined;
    trialEndDate?: Date | null | undefined;
    startDate: Date;
    lastPaymentAt?: Date | null | undefined;
    lastPaymentAmount?: number | null | undefined;
    stripeCustomerId?: string | null | undefined;
    stripeSubscriptionId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type CreateMySubscriptionMutationVariables = Exact<{
  input: CreateUserSubscriptionInput;
}>;

export type CreateMySubscriptionMutation = {
  __typename?: 'Mutation';
  createMySubscription: {
    __typename?: 'UserSubscription';
    id: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date | null | undefined;
    trialEndDate?: Date | null | undefined;
    startDate: Date;
    lastPaymentAt?: Date | null | undefined;
    lastPaymentAmount?: number | null | undefined;
    stripeCustomerId?: string | null | undefined;
    stripeSubscriptionId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type LegalQueryFragmentFragment = {
  __typename?: 'LegalQuery';
  id: string;
  question: string;
  answerMarkdown?: string | null | undefined;
  sessionId?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  citations?:
    | Array<{
        __typename?: 'Citation';
        source: string;
        url?: string | null | undefined;
        excerpt?: string | null | undefined;
        article?: string | null | undefined;
      }>
    | null
    | undefined;
};

export type AskLegalQuestionMutationVariables = Exact<{
  input: AskLegalQuestionInput;
}>;

export type AskLegalQuestionMutation = {
  __typename?: 'Mutation';
  askLegalQuestion: {
    __typename?: 'LegalQuery';
    id: string;
    question: string;
    answerMarkdown?: string | null | undefined;
    sessionId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    citations?:
      | Array<{
          __typename?: 'Citation';
          source: string;
          url?: string | null | undefined;
          excerpt?: string | null | undefined;
          article?: string | null | undefined;
        }>
      | null
      | undefined;
  };
};

export type GetLegalQueryQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetLegalQueryQuery = {
  __typename?: 'Query';
  legalQuery: {
    __typename?: 'LegalQuery';
    id: string;
    question: string;
    answerMarkdown?: string | null | undefined;
    sessionId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    citations?:
      | Array<{
          __typename?: 'Citation';
          source: string;
          url?: string | null | undefined;
          excerpt?: string | null | undefined;
          article?: string | null | undefined;
        }>
      | null
      | undefined;
  };
};

export type GetSessionQueriesQueryVariables = Exact<{
  sessionId: Scalars['String']['input'];
}>;

export type GetSessionQueriesQuery = {
  __typename?: 'Query';
  queriesBySession: Array<{
    __typename?: 'LegalQuery';
    id: string;
    question: string;
    answerMarkdown?: string | null | undefined;
    sessionId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    citations?:
      | Array<{
          __typename?: 'Citation';
          source: string;
          url?: string | null | undefined;
          excerpt?: string | null | undefined;
          article?: string | null | undefined;
        }>
      | null
      | undefined;
  }>;
};

export type GetPendingQueriesQueryVariables = Exact<{ [key: string]: never }>;

export type GetPendingQueriesQuery = {
  __typename?: 'Query';
  pendingQueries: Array<{
    __typename?: 'LegalQuery';
    id: string;
    question: string;
    answerMarkdown?: string | null | undefined;
    sessionId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    citations?:
      | Array<{
          __typename?: 'Citation';
          source: string;
          url?: string | null | undefined;
          excerpt?: string | null | undefined;
          article?: string | null | undefined;
        }>
      | null
      | undefined;
  }>;
};

export type GetLegalDocumentsQueryVariables = Exact<{
  filter?: InputMaybe<LegalDocumentFilter>;
  paging?: InputMaybe<CursorPaging>;
  sorting?: InputMaybe<Array<LegalDocumentSort> | LegalDocumentSort>;
}>;

export type GetLegalDocumentsQuery = {
  __typename?: 'Query';
  legalDocuments: {
    __typename?: 'LegalDocumentConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'LegalDocumentEdge';
      node: {
        __typename?: 'LegalDocument';
        id: string;
        sessionId: string;
        title: string;
        type: DocumentType;
        status: DocumentStatus;
        contentRaw?: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
        metadata?:
          | {
              __typename?: 'DocumentMetadata';
              plaintiffName?: string | null | undefined;
              defendantName?: string | null | undefined;
              claimAmount?: number | null | undefined;
              claimCurrency?: string | null | undefined;
            }
          | null
          | undefined;
      };
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage?: boolean | null | undefined;
      hasPreviousPage?: boolean | null | undefined;
      startCursor?: string | null | undefined;
      endCursor?: string | null | undefined;
    };
  };
};

export type GetLegalDocumentQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetLegalDocumentQuery = {
  __typename?: 'Query';
  legalDocument: {
    __typename?: 'LegalDocument';
    id: string;
    sessionId: string;
    title: string;
    type: DocumentType;
    status: DocumentStatus;
    contentRaw?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    metadata?:
      | {
          __typename?: 'DocumentMetadata';
          plaintiffName?: string | null | undefined;
          defendantName?: string | null | undefined;
          claimAmount?: number | null | undefined;
          claimCurrency?: string | null | undefined;
        }
      | null
      | undefined;
  };
};

export type GenerateDocumentMutationVariables = Exact<{
  input: GenerateDocumentInput;
}>;

export type GenerateDocumentMutation = {
  __typename?: 'Mutation';
  generateDocument: {
    __typename?: 'LegalDocument';
    id: string;
    sessionId: string;
    title: string;
    type: DocumentType;
    status: DocumentStatus;
    contentRaw?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    metadata?:
      | {
          __typename?: 'DocumentMetadata';
          plaintiffName?: string | null | undefined;
          defendantName?: string | null | undefined;
          claimAmount?: number | null | undefined;
          claimCurrency?: string | null | undefined;
        }
      | null
      | undefined;
  };
};

export type UpdateDocumentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDocumentInput;
}>;

export type UpdateDocumentMutation = {
  __typename?: 'Mutation';
  updateDocument: {
    __typename?: 'LegalDocument';
    id: string;
    sessionId: string;
    title: string;
    type: DocumentType;
    status: DocumentStatus;
    contentRaw?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    metadata?:
      | {
          __typename?: 'DocumentMetadata';
          plaintiffName?: string | null | undefined;
          defendantName?: string | null | undefined;
          claimAmount?: number | null | undefined;
          claimCurrency?: string | null | undefined;
        }
      | null
      | undefined;
  };
};

export type DeleteDocumentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteDocumentMutation = { __typename?: 'Mutation'; deleteDocument: boolean };

export type GetDocumentTemplatesQueryVariables = Exact<{
  filter?: InputMaybe<DocumentTemplateFilter>;
  paging?: InputMaybe<CursorPaging>;
}>;

export type GetDocumentTemplatesQuery = {
  __typename?: 'Query';
  documentTemplates: {
    __typename?: 'DocumentTemplateConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'DocumentTemplateEdge';
      node: {
        __typename?: 'DocumentTemplate';
        id: string;
        name: string;
        category: TemplateCategory;
        description?: string | null | undefined;
        content: string;
        variables: unknown;
        conditionalSections?: unknown | null | undefined;
        polishFormattingRules?: unknown | null | undefined;
        isActive: boolean;
        usageCount: number;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage?: boolean | null | undefined;
      hasPreviousPage?: boolean | null | undefined;
      startCursor?: string | null | undefined;
      endCursor?: string | null | undefined;
    };
  };
};

export type GetDocumentTemplateQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetDocumentTemplateQuery = {
  __typename?: 'Query';
  documentTemplate: {
    __typename?: 'DocumentTemplate';
    id: string;
    name: string;
    category: TemplateCategory;
    description?: string | null | undefined;
    content: string;
    variables: unknown;
    conditionalSections?: unknown | null | undefined;
    polishFormattingRules?: unknown | null | undefined;
    isActive: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type CreateDocumentTemplateMutationVariables = Exact<{
  input: CreateTemplateInput;
}>;

export type CreateDocumentTemplateMutation = {
  __typename?: 'Mutation';
  createDocumentTemplate: {
    __typename?: 'DocumentTemplate';
    id: string;
    name: string;
    category: TemplateCategory;
    description?: string | null | undefined;
    content: string;
    variables: unknown;
    conditionalSections?: unknown | null | undefined;
    polishFormattingRules?: unknown | null | undefined;
    isActive: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type UpdateDocumentTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateTemplateInput;
}>;

export type UpdateDocumentTemplateMutation = {
  __typename?: 'Mutation';
  updateDocumentTemplate: {
    __typename?: 'DocumentTemplate';
    id: string;
    name: string;
    category: TemplateCategory;
    description?: string | null | undefined;
    content: string;
    variables: unknown;
    conditionalSections?: unknown | null | undefined;
    polishFormattingRules?: unknown | null | undefined;
    isActive: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type DeleteDocumentTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteDocumentTemplateMutation = {
  __typename?: 'Mutation';
  deleteDocumentTemplate: boolean;
};

export type UserGrowthMetricsFragmentFragment = {
  __typename?: 'UserGrowthMetrics';
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  adminUsers: number;
  growthRate: number;
  periodStart: Date;
  periodEnd: Date;
};

export type DocumentMetricsFragmentFragment = {
  __typename?: 'DocumentMetrics';
  totalDocuments: number;
  completedDocuments: number;
  draftDocuments: number;
  failedDocuments: number;
  generatingDocuments: number;
  successRate: number;
  periodStart: Date;
  periodEnd: Date;
};

export type DocumentTypeDistributionFragmentFragment = {
  __typename?: 'DocumentTypeDistribution';
  documentType: string;
  count: number;
  percentage: number;
};

export type QueryMetricsFragmentFragment = {
  __typename?: 'QueryMetrics';
  totalQueries: number;
  uniqueUsers: number;
  avgQueriesPerUser: number;
  totalCitations: number;
  avgCitationsPerQuery: number;
  periodStart: Date;
  periodEnd: Date;
};

export type AiUsageMetricsFragmentFragment = {
  __typename?: 'AiUsageMetrics';
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerRequest: number;
  avgTokensPerRequest: number;
  periodStart: Date;
  periodEnd: Date;
};

export type AiOperationBreakdownFragmentFragment = {
  __typename?: 'AiOperationBreakdown';
  operationType: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  costPercentage: number;
};

export type SystemHealthMetricsFragmentFragment = {
  __typename?: 'SystemHealthMetrics';
  documentSuccessRate: number;
  avgResponseTime: number;
  activeSessions: number;
  timestamp: Date;
};

export type PaymentHistoryItemFragmentFragment = {
  __typename?: 'PaymentHistoryItem';
  id: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  description?: string | null | undefined;
  invoiceId?: string | null | undefined;
  createdAt: string;
  refundedAt?: string | null | undefined;
  refundAmount?: string | null | undefined;
};

export type PaymentMethodInfoFragmentFragment = {
  __typename?: 'PaymentMethodInfo';
  id: string;
  brand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
};

export type BillingInfoFragmentFragment = {
  __typename?: 'BillingInfo';
  subscriptionId: string;
  planTier: PlanTier;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  daysRemaining: number;
  cancelAtPeriodEnd: boolean;
  usage: string;
  nextBillingAmount?: string | null | undefined;
  paymentHistory: Array<{
    __typename?: 'PaymentHistoryItem';
    id: string;
    amount: string;
    currency: string;
    status: PaymentStatus;
    method: PaymentMethod;
    description?: string | null | undefined;
    invoiceId?: string | null | undefined;
    createdAt: string;
    refundedAt?: string | null | undefined;
    refundAmount?: string | null | undefined;
  }>;
  paymentMethods?:
    | Array<{
        __typename?: 'PaymentMethodInfo';
        id: string;
        brand: string;
        last4: string;
        expiryMonth: string;
        expiryYear: string;
        isDefault: boolean;
      }>
    | null
    | undefined;
};

export type UserSubscriptionFragmentFragment = {
  __typename?: 'UserSubscription';
  id: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date | null | undefined;
  trialEndDate?: Date | null | undefined;
  startDate: Date;
  lastPaymentAt?: Date | null | undefined;
  lastPaymentAmount?: number | null | undefined;
  stripeCustomerId?: string | null | undefined;
  stripeSubscriptionId?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
};

export type SubscriptionPlanFragmentFragment = {
  __typename?: 'SubscriptionPlan';
  id: string;
  name: string;
  description?: string | null | undefined;
  price: number;
  billingInterval: BillingInterval;
  features: string;
  tier: PlanTier;
  isActive: boolean;
  displayOrder: number;
  maxUsers?: number | null | undefined;
  createdAt: Date;
};

export type DocumentTemplateFragmentFragment = {
  __typename?: 'DocumentTemplate';
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string | null | undefined;
  content: string;
  variables: unknown;
  conditionalSections?: unknown | null | undefined;
  polishFormattingRules?: unknown | null | undefined;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type LegalDocumentFragmentFragment = {
  __typename?: 'LegalDocument';
  id: string;
  sessionId: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  contentRaw?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  metadata?:
    | {
        __typename?: 'DocumentMetadata';
        plaintiffName?: string | null | undefined;
        defendantName?: string | null | undefined;
        claimAmount?: number | null | undefined;
        claimCurrency?: string | null | undefined;
      }
    | null
    | undefined;
};

export type LegalDocumentDetailFragmentFragment = {
  __typename?: 'LegalDocument';
  pdfUrl?: string | null | undefined;
  moderationStatus?: ModerationStatus | null | undefined;
  flaggedAt?: Date | null | undefined;
  moderatedAt?: Date | null | undefined;
  moderatedById?: string | null | undefined;
  moderationReason?: string | null | undefined;
  id: string;
  sessionId: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  contentRaw?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  metadata?:
    | {
        __typename?: 'DocumentMetadata';
        plaintiffName?: string | null | undefined;
        defendantName?: string | null | undefined;
        claimAmount?: number | null | undefined;
        claimCurrency?: string | null | undefined;
      }
    | null
    | undefined;
};

export type LegalRulingFragmentFragment = {
  __typename?: 'LegalRuling';
  id: string;
  signature: string;
  courtName: string;
  courtType: CourtType;
  rulingDate: Date;
  summary?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
};

export type LegalRulingDetailFragmentFragment = {
  __typename?: 'LegalRuling';
  fullText?: string | null | undefined;
  id: string;
  signature: string;
  courtName: string;
  courtType: CourtType;
  rulingDate: Date;
  summary?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  metadata?:
    | {
        __typename?: 'RulingMetadata';
        legalArea?: string | null | undefined;
        keywords?: Array<string> | null | undefined;
        relatedCases?: Array<string> | null | undefined;
        sourceReference?: string | null | undefined;
      }
    | null
    | undefined;
};

export type NotificationFragmentFragment = {
  __typename?: 'InAppNotification';
  id: string;
  userId: string;
  type: InAppNotificationType;
  message: string;
  read: boolean;
  actionLink?: string | null | undefined;
  actionLabel?: string | null | undefined;
  metadata?: unknown | null | undefined;
  createdAt: Date;
};

export type PageInfoFragmentFragment = {
  __typename?: 'PageInfo';
  hasNextPage?: boolean | null | undefined;
  hasPreviousPage?: boolean | null | undefined;
  startCursor?: string | null | undefined;
  endCursor?: string | null | undefined;
};

export type UserPageResultFragmentFragment = {
  __typename?: 'UserConnection';
  totalCount: number;
  edges: Array<{
    __typename?: 'UserEdge';
    node: {
      __typename?: 'User';
      id: string;
      email: string;
      username?: string | null | undefined;
      firstName?: string | null | undefined;
      lastName?: string | null | undefined;
      isActive: boolean;
      role: string;
    };
  }>;
  pageInfo: {
    __typename?: 'PageInfo';
    hasNextPage?: boolean | null | undefined;
    hasPreviousPage?: boolean | null | undefined;
    startCursor?: string | null | undefined;
    endCursor?: string | null | undefined;
  };
};

export type LegalDocumentPageResultFragmentFragment = {
  __typename?: 'LegalDocumentConnection';
  totalCount: number;
  edges: Array<{
    __typename?: 'LegalDocumentEdge';
    node: {
      __typename?: 'LegalDocument';
      id: string;
      sessionId: string;
      title: string;
      type: DocumentType;
      status: DocumentStatus;
      contentRaw?: string | null | undefined;
      createdAt: Date;
      updatedAt: Date;
      metadata?:
        | {
            __typename?: 'DocumentMetadata';
            plaintiffName?: string | null | undefined;
            defendantName?: string | null | undefined;
            claimAmount?: number | null | undefined;
            claimCurrency?: string | null | undefined;
          }
        | null
        | undefined;
    };
  }>;
  pageInfo: {
    __typename?: 'PageInfo';
    hasNextPage?: boolean | null | undefined;
    hasPreviousPage?: boolean | null | undefined;
    startCursor?: string | null | undefined;
    endCursor?: string | null | undefined;
  };
};

export type AuditLogPageResultFragmentFragment = {
  __typename?: 'AuditLogConnection';
  totalCount: number;
  edges: Array<{
    __typename?: 'AuditLogEdge';
    node: {
      __typename?: 'AuditLog';
      id: string;
      action: AuditActionType;
      resourceType: AuditResourceType;
      resourceId?: string | null | undefined;
      userId?: string | null | undefined;
      ipAddress?: string | null | undefined;
      statusCode?: number | null | undefined;
      errorMessage?: string | null | undefined;
      userAgent?: string | null | undefined;
      createdAt: Date;
      updatedAt: Date;
      user?:
        | {
            __typename?: 'User';
            id: string;
            email: string;
            firstName?: string | null | undefined;
            lastName?: string | null | undefined;
          }
        | null
        | undefined;
    };
  }>;
  pageInfo: {
    __typename?: 'PageInfo';
    hasNextPage?: boolean | null | undefined;
    hasPreviousPage?: boolean | null | undefined;
    startCursor?: string | null | undefined;
    endCursor?: string | null | undefined;
  };
};

export type LegalRulingPageResultFragmentFragment = {
  __typename?: 'LegalRulingConnection';
  totalCount: number;
  edges: Array<{
    __typename?: 'LegalRulingEdge';
    node: {
      __typename?: 'LegalRuling';
      id: string;
      signature: string;
      courtName: string;
      courtType: CourtType;
      rulingDate: Date;
      summary?: string | null | undefined;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
  pageInfo: {
    __typename?: 'PageInfo';
    hasNextPage?: boolean | null | undefined;
    hasPreviousPage?: boolean | null | undefined;
    startCursor?: string | null | undefined;
    endCursor?: string | null | undefined;
  };
};

export type RulingSearchMetadataFragmentFragment = {
  __typename?: 'RulingMetadata';
  keywords?: Array<string> | null | undefined;
  legalArea?: string | null | undefined;
  relatedCases?: Array<string> | null | undefined;
  sourceReference?: string | null | undefined;
};

export type SimpleRulingSearchResultFragmentFragment = {
  __typename?: 'LegalRulingSearchResult';
  rank: number;
  ruling: { __typename?: 'LegalRuling'; id: string; signature: string; courtName: string };
};

export type AggregatedRulingSearchResultFragmentFragment = {
  __typename?: 'AggregatedLegalRulingSearchResult';
  rank: number;
  headline?: string | null | undefined;
  source: SearchSource;
  ruling: {
    __typename?: 'LegalRuling';
    id: string;
    courtName: string;
    courtType: CourtType;
    rulingDate: Date;
    signature: string;
    summary?: string | null | undefined;
    fullText?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    metadata?:
      | {
          __typename?: 'RulingMetadata';
          keywords?: Array<string> | null | undefined;
          legalArea?: string | null | undefined;
          relatedCases?: Array<string> | null | undefined;
          sourceReference?: string | null | undefined;
        }
      | null
      | undefined;
  };
};

export type AdvancedRulingSearchResultFragmentFragment = {
  __typename?: 'AggregatedLegalRulingSearchResult';
  rank: number;
  headline?: string | null | undefined;
  source: SearchSource;
  ruling: {
    __typename?: 'LegalRuling';
    id: string;
    courtName: string;
    courtType: CourtType;
    rulingDate: Date;
    signature: string;
    summary?: string | null | undefined;
    fullText?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    metadata?:
      | {
          __typename?: 'RulingMetadata';
          keywords?: Array<string> | null | undefined;
          legalArea?: string | null | undefined;
          relatedCases?: Array<string> | null | undefined;
          sourceReference?: string | null | undefined;
        }
      | null
      | undefined;
  };
};

export type SystemSettingFragmentFragment = {
  __typename?: 'SystemSetting';
  id: string;
  key: string;
  value?: string | null | undefined;
  valueType: SettingValueType;
  category: SettingCategory;
  description?: string | null | undefined;
  metadata?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
};

export type UserPreferencesFragmentFragment = {
  __typename?: 'UserPreferences';
  id: string;
  userId: string;
  locale: string;
  theme: ThemePreference;
  aiModel: AiModelType;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  timezone?: string | null | undefined;
  dateFormat?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  getNotificationPreferences: {
    __typename?: 'NotificationPreferences';
    documentUpdates: boolean;
    queryResponses: boolean;
    systemAlerts: boolean;
    marketingEmails: boolean;
    channels: {
      __typename?: 'NotificationChannels';
      email: boolean;
      inApp: boolean;
      push: boolean;
    };
  };
};

export type UserFragmentFragment = {
  __typename?: 'User';
  id: string;
  email: string;
  username?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  isActive: boolean;
  role: string;
};

export type UserDetailFragmentFragment = {
  __typename?: 'User';
  disclaimerAccepted: boolean;
  disclaimerAcceptedAt?: Date | null | undefined;
  stripeCustomerId?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  email: string;
  username?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  isActive: boolean;
  role: string;
};

export type AuthUserFragmentFragment = {
  __typename?: 'AuthUser';
  id: string;
  email: string;
  username?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  isActive: boolean;
  disclaimerAccepted: boolean;
  disclaimerAcceptedAt?: Date | null | undefined;
  role: string;
};

export type UserMinimalFragmentFragment = {
  __typename?: 'User';
  id: string;
  email: string;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
};

export type AuthPayloadFragmentFragment = {
  __typename?: 'AuthPayload';
  accessToken: string;
  refreshToken: string;
  user: {
    __typename?: 'AuthUser';
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt?: Date | null | undefined;
    role: string;
  };
};

export type RefreshTokenPayloadFragmentFragment = {
  __typename?: 'RefreshTokenPayload';
  accessToken: string;
  refreshToken: string;
};

export type GetLegalRulingsQueryVariables = Exact<{
  filter?: InputMaybe<LegalRulingFilter>;
  paging?: InputMaybe<CursorPaging>;
  sorting?: InputMaybe<Array<LegalRulingSort> | LegalRulingSort>;
}>;

export type GetLegalRulingsQuery = {
  __typename?: 'Query';
  legalRulings: {
    __typename?: 'LegalRulingConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'LegalRulingEdge';
      node: {
        __typename?: 'LegalRuling';
        id: string;
        signature: string;
        courtName: string;
        courtType: CourtType;
        rulingDate: Date;
        summary?: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage?: boolean | null | undefined;
      hasPreviousPage?: boolean | null | undefined;
      startCursor?: string | null | undefined;
      endCursor?: string | null | undefined;
    };
  };
};

export type GetLegalRulingQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetLegalRulingQuery = {
  __typename?: 'Query';
  legalRuling: {
    __typename?: 'LegalRuling';
    id: string;
    signature: string;
    courtName: string;
    courtType: CourtType;
    rulingDate: Date;
    summary?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type GetLegalRulingDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetLegalRulingDetailQuery = {
  __typename?: 'Query';
  legalRuling: {
    __typename?: 'LegalRuling';
    fullText?: string | null | undefined;
    id: string;
    signature: string;
    courtName: string;
    courtType: CourtType;
    rulingDate: Date;
    summary?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    metadata?:
      | {
          __typename?: 'RulingMetadata';
          legalArea?: string | null | undefined;
          keywords?: Array<string> | null | undefined;
          relatedCases?: Array<string> | null | undefined;
          sourceReference?: string | null | undefined;
        }
      | null
      | undefined;
  };
};

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;

export type LoginMutation = {
  __typename?: 'Mutation';
  login: {
    __typename?: 'AuthPayload';
    accessToken: string;
    refreshToken: string;
    user: {
      __typename?: 'AuthUser';
      id: string;
      email: string;
      username?: string | null | undefined;
      firstName?: string | null | undefined;
      lastName?: string | null | undefined;
      isActive: boolean;
      disclaimerAccepted: boolean;
      disclaimerAcceptedAt?: Date | null | undefined;
      role: string;
    };
  };
};

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;

export type RegisterMutation = {
  __typename?: 'Mutation';
  register: {
    __typename?: 'AuthPayload';
    accessToken: string;
    refreshToken: string;
    user: {
      __typename?: 'AuthUser';
      id: string;
      email: string;
      username?: string | null | undefined;
      firstName?: string | null | undefined;
      lastName?: string | null | undefined;
      isActive: boolean;
      disclaimerAccepted: boolean;
      disclaimerAcceptedAt?: Date | null | undefined;
      role: string;
    };
  };
};

export type RefreshTokenMutationVariables = Exact<{
  input: RefreshTokenInput;
}>;

export type RefreshTokenMutation = {
  __typename?: 'Mutation';
  refreshToken: { __typename?: 'RefreshTokenPayload'; accessToken: string; refreshToken: string };
};

export type AcceptDisclaimerMutationVariables = Exact<{ [key: string]: never }>;

export type AcceptDisclaimerMutation = {
  __typename?: 'Mutation';
  acceptDisclaimer: {
    __typename?: 'AuthUser';
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt?: Date | null | undefined;
    role: string;
  };
};

export type MarkNotificationAsReadMutationVariables = Exact<{
  notificationId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
}>;

export type MarkNotificationAsReadMutation = {
  __typename?: 'Mutation';
  markNotificationAsRead: string;
};

export type MarkAllNotificationsAsReadMutationVariables = Exact<{
  userId: Scalars['String']['input'];
}>;

export type MarkAllNotificationsAsReadMutation = {
  __typename?: 'Mutation';
  markAllNotificationsAsRead: number;
};

export type UpsertSystemSettingMutationVariables = Exact<{
  input: SystemSettingInput;
}>;

export type UpsertSystemSettingMutation = {
  __typename?: 'Mutation';
  upsertSystemSetting: {
    __typename?: 'SystemSetting';
    id: string;
    key: string;
    value?: string | null | undefined;
    valueType: SettingValueType;
    category: SettingCategory;
    description?: string | null | undefined;
    metadata?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type BulkUpsertSystemSettingsMutationVariables = Exact<{
  input: BulkUpdateSettingsInput;
}>;

export type BulkUpsertSystemSettingsMutation = {
  __typename?: 'Mutation';
  bulkUpsertSystemSettings: Array<{
    __typename?: 'SystemSetting';
    id: string;
    key: string;
    value?: string | null | undefined;
    valueType: SettingValueType;
    category: SettingCategory;
    description?: string | null | undefined;
    metadata?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export type UpdateMyPreferencesMutationVariables = Exact<{
  input: UpdateUserPreferencesInput;
}>;

export type UpdateMyPreferencesMutation = {
  __typename?: 'Mutation';
  updateMyPreferences: {
    __typename?: 'UserPreferences';
    id: string;
    userId: string;
    locale: string;
    theme: ThemePreference;
    aiModel: AiModelType;
    emailNotifications: boolean;
    inAppNotifications: boolean;
    timezone?: string | null | undefined;
    dateFormat?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    getNotificationPreferences: {
      __typename?: 'NotificationPreferences';
      documentUpdates: boolean;
      queryResponses: boolean;
      systemAlerts: boolean;
      marketingEmails: boolean;
      channels: {
        __typename?: 'NotificationChannels';
        email: boolean;
        inApp: boolean;
        push: boolean;
      };
    };
  };
};

export type ResetMyPreferencesMutationVariables = Exact<{ [key: string]: never }>;

export type ResetMyPreferencesMutation = {
  __typename?: 'Mutation';
  resetMyPreferences: {
    __typename?: 'UserPreferences';
    id: string;
    userId: string;
    locale: string;
    theme: ThemePreference;
    aiModel: AiModelType;
    emailNotifications: boolean;
    inAppNotifications: boolean;
    timezone?: string | null | undefined;
    dateFormat?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    getNotificationPreferences: {
      __typename?: 'NotificationPreferences';
      documentUpdates: boolean;
      queryResponses: boolean;
      systemAlerts: boolean;
      marketingEmails: boolean;
      channels: {
        __typename?: 'NotificationChannels';
        email: boolean;
        inApp: boolean;
        push: boolean;
      };
    };
  };
};

export type UpdateOneUserPreferenceMutationVariables = Exact<{
  input: UpdateOneUserPreferencesInput;
}>;

export type UpdateOneUserPreferenceMutation = {
  __typename?: 'Mutation';
  updateOneUserPreference: {
    __typename?: 'UserPreferences';
    id: string;
    userId: string;
    locale: string;
    theme: ThemePreference;
    aiModel: AiModelType;
    emailNotifications: boolean;
    inAppNotifications: boolean;
    timezone?: string | null | undefined;
    dateFormat?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    getNotificationPreferences: {
      __typename?: 'NotificationPreferences';
      documentUpdates: boolean;
      queryResponses: boolean;
      systemAlerts: boolean;
      marketingEmails: boolean;
      channels: {
        __typename?: 'NotificationChannels';
        email: boolean;
        inApp: boolean;
        push: boolean;
      };
    };
  };
};

export type CreateOneUserPreferenceMutationVariables = Exact<{
  input: CreateOneUserPreferencesInput;
}>;

export type CreateOneUserPreferenceMutation = {
  __typename?: 'Mutation';
  createOneUserPreference: {
    __typename?: 'UserPreferences';
    id: string;
    userId: string;
    locale: string;
    theme: ThemePreference;
    aiModel: AiModelType;
    emailNotifications: boolean;
    inAppNotifications: boolean;
    timezone?: string | null | undefined;
    dateFormat?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    getNotificationPreferences: {
      __typename?: 'NotificationPreferences';
      documentUpdates: boolean;
      queryResponses: boolean;
      systemAlerts: boolean;
      marketingEmails: boolean;
      channels: {
        __typename?: 'NotificationChannels';
        email: boolean;
        inApp: boolean;
        push: boolean;
      };
    };
  };
};

export type DeleteOneUserPreferenceMutationVariables = Exact<{
  input: DeleteOneUserPreferencesInput;
}>;

export type DeleteOneUserPreferenceMutation = {
  __typename?: 'Mutation';
  deleteOneUserPreference: {
    __typename?: 'UserPreferencesDeleteResponse';
    id?: string | null | undefined;
  };
};

export type GetRecentNotificationsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;

export type GetRecentNotificationsQuery = {
  __typename?: 'Query';
  recentNotifications: Array<{
    __typename?: 'InAppNotification';
    id: string;
    userId: string;
    type: InAppNotificationType;
    message: string;
    read: boolean;
    actionLink?: string | null | undefined;
    actionLabel?: string | null | undefined;
    metadata?: unknown | null | undefined;
    createdAt: Date;
  }>;
};

export type GetUnreadNotificationCountQueryVariables = Exact<{
  userId: Scalars['String']['input'];
}>;

export type GetUnreadNotificationCountQuery = {
  __typename?: 'Query';
  unreadNotificationCount: number;
};

export type InAppNotificationCreatedSubscriptionVariables = Exact<{
  userId?: InputMaybe<Scalars['String']['input']>;
}>;

export type InAppNotificationCreatedSubscription = {
  __typename?: 'Subscription';
  inAppNotificationCreated: {
    __typename?: 'InAppNotificationCreatedPayload';
    notificationId: string;
    userId: string;
    type: InAppNotificationType;
    message: string;
    actionLink?: string | null | undefined;
    actionLabel?: string | null | undefined;
    metadata?: string | null | undefined;
    createdAt: Date;
  };
};

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type GetCurrentUserQuery = {
  __typename?: 'Query';
  me?:
    | {
        __typename?: 'AuthUser';
        id: string;
        email: string;
        username?: string | null | undefined;
        firstName?: string | null | undefined;
        lastName?: string | null | undefined;
        isActive: boolean;
        disclaimerAccepted: boolean;
        disclaimerAcceptedAt?: Date | null | undefined;
        role: string;
      }
    | null
    | undefined;
};

export type GetAnalyticsDashboardQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetAnalyticsDashboardQuery = {
  __typename?: 'Query';
  analyticsDashboard: {
    __typename?: 'AnalyticsDashboard';
    generatedAt: Date;
    userGrowth: {
      __typename?: 'UserGrowthMetrics';
      totalUsers: number;
      activeUsers: number;
      newUsers: number;
      adminUsers: number;
      growthRate: number;
      periodStart: Date;
      periodEnd: Date;
    };
    documents: {
      __typename?: 'DocumentMetrics';
      totalDocuments: number;
      completedDocuments: number;
      draftDocuments: number;
      failedDocuments: number;
      generatingDocuments: number;
      successRate: number;
      periodStart: Date;
      periodEnd: Date;
    };
    documentTypeDistribution: Array<{
      __typename?: 'DocumentTypeDistribution';
      documentType: string;
      count: number;
      percentage: number;
    }>;
    queries: {
      __typename?: 'QueryMetrics';
      totalQueries: number;
      uniqueUsers: number;
      avgQueriesPerUser: number;
      totalCitations: number;
      avgCitationsPerQuery: number;
      periodStart: Date;
      periodEnd: Date;
    };
    aiUsage: {
      __typename?: 'AiUsageMetrics';
      totalRequests: number;
      totalTokens: number;
      totalCost: number;
      avgCostPerRequest: number;
      avgTokensPerRequest: number;
      periodStart: Date;
      periodEnd: Date;
    };
    aiOperationBreakdown: Array<{
      __typename?: 'AiOperationBreakdown';
      operationType: string;
      requestCount: number;
      totalTokens: number;
      totalCost: number;
      costPercentage: number;
    }>;
    systemHealth: {
      __typename?: 'SystemHealthMetrics';
      documentSuccessRate: number;
      avgResponseTime: number;
      activeSessions: number;
      timestamp: Date;
    };
  };
};

export type GetUserGrowthMetricsQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetUserGrowthMetricsQuery = {
  __typename?: 'Query';
  userGrowthMetrics: {
    __typename?: 'UserGrowthMetrics';
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    adminUsers: number;
    growthRate: number;
    periodStart: Date;
    periodEnd: Date;
  };
};

export type GetDocumentMetricsQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetDocumentMetricsQuery = {
  __typename?: 'Query';
  documentMetrics: {
    __typename?: 'DocumentMetrics';
    totalDocuments: number;
    completedDocuments: number;
    draftDocuments: number;
    failedDocuments: number;
    generatingDocuments: number;
    successRate: number;
    periodStart: Date;
    periodEnd: Date;
  };
};

export type GetQueryMetricsQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetQueryMetricsQuery = {
  __typename?: 'Query';
  queryMetrics: {
    __typename?: 'QueryMetrics';
    totalQueries: number;
    uniqueUsers: number;
    avgQueriesPerUser: number;
    totalCitations: number;
    avgCitationsPerQuery: number;
    periodStart: Date;
    periodEnd: Date;
  };
};

export type GetAiUsageMetricsQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetAiUsageMetricsQuery = {
  __typename?: 'Query';
  aiUsageMetrics: {
    __typename?: 'AiUsageMetrics';
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    avgCostPerRequest: number;
    avgTokensPerRequest: number;
    periodStart: Date;
    periodEnd: Date;
  };
};

export type GetSystemHealthMetricsQueryVariables = Exact<{
  input?: InputMaybe<DashboardAnalyticsInput>;
}>;

export type GetSystemHealthMetricsQuery = {
  __typename?: 'Query';
  systemHealthMetrics: {
    __typename?: 'SystemHealthMetrics';
    documentSuccessRate: number;
    avgResponseTime: number;
    activeSessions: number;
    timestamp: Date;
  };
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: 'Query';
  me?:
    | {
        __typename?: 'AuthUser';
        id: string;
        email: string;
        username?: string | null | undefined;
        firstName?: string | null | undefined;
        lastName?: string | null | undefined;
        isActive: boolean;
        disclaimerAccepted: boolean;
        disclaimerAcceptedAt?: Date | null | undefined;
        role: string;
      }
    | null
    | undefined;
};

export type GetSystemSettingsQueryVariables = Exact<{ [key: string]: never }>;

export type GetSystemSettingsQuery = {
  __typename?: 'Query';
  systemSettings: Array<{
    __typename?: 'SystemSetting';
    id: string;
    key: string;
    value?: string | null | undefined;
    valueType: SettingValueType;
    category: SettingCategory;
    description?: string | null | undefined;
    metadata?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export type GetSystemSettingsByCategoryQueryVariables = Exact<{
  category: SettingCategory;
}>;

export type GetSystemSettingsByCategoryQuery = {
  __typename?: 'Query';
  systemSettingsByCategory: Array<{
    __typename?: 'SystemSetting';
    id: string;
    key: string;
    value?: string | null | undefined;
    valueType: SettingValueType;
    category: SettingCategory;
    description?: string | null | undefined;
    metadata?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export type GetSystemSettingQueryVariables = Exact<{
  key: Scalars['String']['input'];
}>;

export type GetSystemSettingQuery = {
  __typename?: 'Query';
  systemSetting?:
    | {
        __typename?: 'SystemSetting';
        id: string;
        key: string;
        value?: string | null | undefined;
        valueType: SettingValueType;
        category: SettingCategory;
        description?: string | null | undefined;
        metadata?: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
      }
    | null
    | undefined;
};

export type GetMyPreferencesQueryVariables = Exact<{ [key: string]: never }>;

export type GetMyPreferencesQuery = {
  __typename?: 'Query';
  myPreferences: {
    __typename?: 'UserPreferences';
    id: string;
    userId: string;
    locale: string;
    theme: ThemePreference;
    aiModel: AiModelType;
    emailNotifications: boolean;
    inAppNotifications: boolean;
    timezone?: string | null | undefined;
    dateFormat?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    getNotificationPreferences: {
      __typename?: 'NotificationPreferences';
      documentUpdates: boolean;
      queryResponses: boolean;
      systemAlerts: boolean;
      marketingEmails: boolean;
      channels: {
        __typename?: 'NotificationChannels';
        email: boolean;
        inApp: boolean;
        push: boolean;
      };
    };
  };
};

export type AggregatedSearchLegalRulingsQueryVariables = Exact<{
  input: AggregatedSearchLegalRulingsInput;
}>;

export type AggregatedSearchLegalRulingsQuery = {
  __typename?: 'Query';
  aggregatedSearchLegalRulings: {
    __typename?: 'AggregatedLegalRulingSearchResponse';
    count: number;
    hasMore: boolean;
    offset: number;
    totalCount: number;
    results: Array<{
      __typename?: 'AggregatedLegalRulingSearchResult';
      rank: number;
      headline?: string | null | undefined;
      source: SearchSource;
      ruling: {
        __typename?: 'LegalRuling';
        id: string;
        courtName: string;
        courtType: CourtType;
        rulingDate: Date;
        signature: string;
        summary?: string | null | undefined;
        fullText?: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
        metadata?:
          | {
              __typename?: 'RulingMetadata';
              keywords?: Array<string> | null | undefined;
              legalArea?: string | null | undefined;
              relatedCases?: Array<string> | null | undefined;
              sourceReference?: string | null | undefined;
            }
          | null
          | undefined;
      };
    }>;
  };
};

export type AdvancedSearchLegalRulingsQueryVariables = Exact<{
  input: AdvancedSearchLegalRulingsInput;
}>;

export type AdvancedSearchLegalRulingsQuery = {
  __typename?: 'Query';
  advancedSearchLegalRulings: {
    __typename?: 'AdvancedLegalRulingSearchResponse';
    count: number;
    hasMore: boolean;
    offset: number;
    totalCount: number;
    queryExplanation?: string | null | undefined;
    results: Array<{
      __typename?: 'AggregatedLegalRulingSearchResult';
      rank: number;
      headline?: string | null | undefined;
      source: SearchSource;
      ruling: {
        __typename?: 'LegalRuling';
        id: string;
        courtName: string;
        courtType: CourtType;
        rulingDate: Date;
        signature: string;
        summary?: string | null | undefined;
        fullText?: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
        metadata?:
          | {
              __typename?: 'RulingMetadata';
              keywords?: Array<string> | null | undefined;
              legalArea?: string | null | undefined;
              relatedCases?: Array<string> | null | undefined;
              sourceReference?: string | null | undefined;
            }
          | null
          | undefined;
      };
    }>;
  };
};

export type SearchLegalRulingsQueryVariables = Exact<{
  input: SearchLegalRulingsInput;
}>;

export type SearchLegalRulingsQuery = {
  __typename?: 'Query';
  searchLegalRulings: {
    __typename?: 'LegalRulingSearchResponse';
    results: Array<{
      __typename?: 'LegalRulingSearchResult';
      rank: number;
      ruling: { __typename?: 'LegalRuling'; id: string; signature: string; courtName: string };
    }>;
  };
};

export type SearchDocumentsQueryVariables = Exact<{
  filter: LegalDocumentFilter;
}>;

export type SearchDocumentsQuery = {
  __typename?: 'Query';
  legalDocuments: {
    __typename?: 'LegalDocumentConnection';
    edges: Array<{
      __typename?: 'LegalDocumentEdge';
      node: { __typename?: 'LegalDocument'; id: string; title: string; type: DocumentType };
    }>;
  };
};

export type GetUsersQueryVariables = Exact<{
  filter?: InputMaybe<UserFilter>;
  paging?: InputMaybe<CursorPaging>;
  sorting?: InputMaybe<Array<UserSort> | UserSort>;
}>;

export type GetUsersQuery = {
  __typename?: 'Query';
  users: {
    __typename?: 'UserConnection';
    totalCount: number;
    edges: Array<{
      __typename?: 'UserEdge';
      node: {
        __typename?: 'User';
        disclaimerAccepted: boolean;
        disclaimerAcceptedAt?: Date | null | undefined;
        stripeCustomerId?: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
        id: string;
        email: string;
        username?: string | null | undefined;
        firstName?: string | null | undefined;
        lastName?: string | null | undefined;
        isActive: boolean;
        role: string;
      };
    }>;
    pageInfo: {
      __typename?: 'PageInfo';
      hasNextPage?: boolean | null | undefined;
      hasPreviousPage?: boolean | null | undefined;
      startCursor?: string | null | undefined;
      endCursor?: string | null | undefined;
    };
  };
};

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetUserQuery = {
  __typename?: 'Query';
  user: {
    __typename?: 'User';
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt?: Date | null | undefined;
    stripeCustomerId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
  };
};

export type CreateOneUserMutationVariables = Exact<{
  input: CreateOneUserInput;
}>;

export type CreateOneUserMutation = {
  __typename?: 'Mutation';
  createOneUser: {
    __typename?: 'User';
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt?: Date | null | undefined;
    stripeCustomerId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
  };
};

export type UpdateOneUserMutationVariables = Exact<{
  input: UpdateOneUserInput;
}>;

export type UpdateOneUserMutation = {
  __typename?: 'Mutation';
  updateOneUser: {
    __typename?: 'User';
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt?: Date | null | undefined;
    stripeCustomerId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
  };
};

export type DeleteOneUserMutationVariables = Exact<{
  input: DeleteOneUserInput;
}>;

export type DeleteOneUserMutation = {
  __typename?: 'Mutation';
  deleteOneUser: {
    __typename?: 'UserDeleteResponse';
    id?: string | null | undefined;
    email?: string | null | undefined;
  };
};

export const AdminUserFragmentFragmentDoc = `
    fragment AdminUserFragment on User {
  id
  email
  username
  firstName
  lastName
  isActive
  role
  disclaimerAccepted
  disclaimerAcceptedAt
  stripeCustomerId
  createdAt
  updatedAt
}
    `;
export const AdminUserMinimalFragmentFragmentDoc = `
    fragment AdminUserMinimalFragment on User {
  id
  email
  username
  firstName
  lastName
  isActive
  role
  createdAt
}
    `;
export const UserMinimalFragmentFragmentDoc = `
    fragment UserMinimalFragment on User {
  id
  email
  firstName
  lastName
}
    `;
export const AuditLogFragmentFragmentDoc = `
    fragment AuditLogFragment on AuditLog {
  id
  action
  resourceType
  resourceId
  userId
  ipAddress
  statusCode
  errorMessage
  userAgent
  createdAt
  updatedAt
  user {
    ...UserMinimalFragment
  }
}
    ${UserMinimalFragmentFragmentDoc}`;
export const AuditLogDetailFragmentFragmentDoc = `
    fragment AuditLogDetailFragment on AuditLog {
  ...AuditLogFragment
  changeDetails
}
    ${AuditLogFragmentFragmentDoc}`;
export const LegalQueryFragmentFragmentDoc = `
    fragment LegalQueryFragment on LegalQuery {
  id
  question
  answerMarkdown
  citations {
    source
    url
    excerpt
    article
  }
  sessionId
  createdAt
  updatedAt
}
    `;
export const UserGrowthMetricsFragmentFragmentDoc = `
    fragment UserGrowthMetricsFragment on UserGrowthMetrics {
  totalUsers
  activeUsers
  newUsers
  adminUsers
  growthRate
  periodStart
  periodEnd
}
    `;
export const DocumentMetricsFragmentFragmentDoc = `
    fragment DocumentMetricsFragment on DocumentMetrics {
  totalDocuments
  completedDocuments
  draftDocuments
  failedDocuments
  generatingDocuments
  successRate
  periodStart
  periodEnd
}
    `;
export const DocumentTypeDistributionFragmentFragmentDoc = `
    fragment DocumentTypeDistributionFragment on DocumentTypeDistribution {
  documentType
  count
  percentage
}
    `;
export const QueryMetricsFragmentFragmentDoc = `
    fragment QueryMetricsFragment on QueryMetrics {
  totalQueries
  uniqueUsers
  avgQueriesPerUser
  totalCitations
  avgCitationsPerQuery
  periodStart
  periodEnd
}
    `;
export const AiUsageMetricsFragmentFragmentDoc = `
    fragment AiUsageMetricsFragment on AiUsageMetrics {
  totalRequests
  totalTokens
  totalCost
  avgCostPerRequest
  avgTokensPerRequest
  periodStart
  periodEnd
}
    `;
export const AiOperationBreakdownFragmentFragmentDoc = `
    fragment AiOperationBreakdownFragment on AiOperationBreakdown {
  operationType
  requestCount
  totalTokens
  totalCost
  costPercentage
}
    `;
export const SystemHealthMetricsFragmentFragmentDoc = `
    fragment SystemHealthMetricsFragment on SystemHealthMetrics {
  documentSuccessRate
  avgResponseTime
  activeSessions
  timestamp
}
    `;
export const PaymentHistoryItemFragmentFragmentDoc = `
    fragment PaymentHistoryItemFragment on PaymentHistoryItem {
  id
  amount
  currency
  status
  method
  description
  invoiceId
  createdAt
  refundedAt
  refundAmount
}
    `;
export const PaymentMethodInfoFragmentFragmentDoc = `
    fragment PaymentMethodInfoFragment on PaymentMethodInfo {
  id
  brand
  last4
  expiryMonth
  expiryYear
  isDefault
}
    `;
export const BillingInfoFragmentFragmentDoc = `
    fragment BillingInfoFragment on BillingInfo {
  subscriptionId
  planTier
  planName
  status
  currentPeriodStart
  currentPeriodEnd
  daysRemaining
  cancelAtPeriodEnd
  usage
  nextBillingAmount
  paymentHistory {
    ...PaymentHistoryItemFragment
  }
  paymentMethods {
    ...PaymentMethodInfoFragment
  }
}
    ${PaymentHistoryItemFragmentFragmentDoc}
${PaymentMethodInfoFragmentFragmentDoc}`;
export const UserSubscriptionFragmentFragmentDoc = `
    fragment UserSubscriptionFragment on UserSubscription {
  id
  planId
  status
  currentPeriodStart
  currentPeriodEnd
  cancelAtPeriodEnd
  canceledAt
  trialEndDate
  startDate
  lastPaymentAt
  lastPaymentAmount
  stripeCustomerId
  stripeSubscriptionId
  createdAt
  updatedAt
}
    `;
export const SubscriptionPlanFragmentFragmentDoc = `
    fragment SubscriptionPlanFragment on SubscriptionPlan {
  id
  name
  description
  price
  billingInterval
  features
  tier
  isActive
  displayOrder
  maxUsers
  createdAt
}
    `;
export const DocumentTemplateFragmentFragmentDoc = `
    fragment DocumentTemplateFragment on DocumentTemplate {
  id
  name
  category
  description
  content
  variables
  conditionalSections
  polishFormattingRules
  isActive
  usageCount
  createdAt
  updatedAt
}
    `;
export const LegalDocumentFragmentFragmentDoc = `
    fragment LegalDocumentFragment on LegalDocument {
  id
  sessionId
  title
  type
  status
  contentRaw
  metadata {
    plaintiffName
    defendantName
    claimAmount
    claimCurrency
  }
  createdAt
  updatedAt
}
    `;
export const LegalDocumentDetailFragmentFragmentDoc = `
    fragment LegalDocumentDetailFragment on LegalDocument {
  ...LegalDocumentFragment
  pdfUrl
  moderationStatus
  flaggedAt
  moderatedAt
  moderatedById
  moderationReason
}
    ${LegalDocumentFragmentFragmentDoc}`;
export const LegalRulingFragmentFragmentDoc = `
    fragment LegalRulingFragment on LegalRuling {
  id
  signature
  courtName
  courtType
  rulingDate
  summary
  createdAt
  updatedAt
}
    `;
export const LegalRulingDetailFragmentFragmentDoc = `
    fragment LegalRulingDetailFragment on LegalRuling {
  ...LegalRulingFragment
  fullText
  metadata {
    legalArea
    keywords
    relatedCases
    sourceReference
  }
}
    ${LegalRulingFragmentFragmentDoc}`;
export const NotificationFragmentFragmentDoc = `
    fragment NotificationFragment on InAppNotification {
  id
  userId
  type
  message
  read
  actionLink
  actionLabel
  metadata
  createdAt
}
    `;
export const UserFragmentFragmentDoc = `
    fragment UserFragment on User {
  id
  email
  username
  firstName
  lastName
  isActive
  role
}
    `;
export const PageInfoFragmentFragmentDoc = `
    fragment PageInfoFragment on PageInfo {
  hasNextPage
  hasPreviousPage
  startCursor
  endCursor
}
    `;
export const UserPageResultFragmentFragmentDoc = `
    fragment UserPageResultFragment on UserConnection {
  totalCount
  edges {
    node {
      ...UserFragment
    }
  }
  pageInfo {
    ...PageInfoFragment
  }
}
    ${UserFragmentFragmentDoc}
${PageInfoFragmentFragmentDoc}`;
export const LegalDocumentPageResultFragmentFragmentDoc = `
    fragment LegalDocumentPageResultFragment on LegalDocumentConnection {
  totalCount
  edges {
    node {
      ...LegalDocumentFragment
    }
  }
  pageInfo {
    ...PageInfoFragment
  }
}
    ${LegalDocumentFragmentFragmentDoc}
${PageInfoFragmentFragmentDoc}`;
export const AuditLogPageResultFragmentFragmentDoc = `
    fragment AuditLogPageResultFragment on AuditLogConnection {
  totalCount
  edges {
    node {
      ...AuditLogFragment
    }
  }
  pageInfo {
    ...PageInfoFragment
  }
}
    ${AuditLogFragmentFragmentDoc}
${PageInfoFragmentFragmentDoc}`;
export const LegalRulingPageResultFragmentFragmentDoc = `
    fragment LegalRulingPageResultFragment on LegalRulingConnection {
  totalCount
  edges {
    node {
      ...LegalRulingFragment
    }
  }
  pageInfo {
    ...PageInfoFragment
  }
}
    ${LegalRulingFragmentFragmentDoc}
${PageInfoFragmentFragmentDoc}`;
export const RulingSearchMetadataFragmentFragmentDoc = `
    fragment RulingSearchMetadataFragment on RulingMetadata {
  keywords
  legalArea
  relatedCases
  sourceReference
}
    `;
export const SimpleRulingSearchResultFragmentFragmentDoc = `
    fragment SimpleRulingSearchResultFragment on LegalRulingSearchResult {
  ruling {
    id
    signature
    courtName
  }
  rank
}
    `;
export const AggregatedRulingSearchResultFragmentFragmentDoc = `
    fragment AggregatedRulingSearchResultFragment on AggregatedLegalRulingSearchResult {
  ruling {
    id
    courtName
    courtType
    rulingDate
    signature
    summary
    fullText
    metadata {
      keywords
      legalArea
      relatedCases
      sourceReference
    }
    createdAt
    updatedAt
  }
  rank
  headline
  source
}
    `;
export const AdvancedRulingSearchResultFragmentFragmentDoc = `
    fragment AdvancedRulingSearchResultFragment on AggregatedLegalRulingSearchResult {
  ruling {
    id
    courtName
    courtType
    rulingDate
    signature
    summary
    fullText
    metadata {
      keywords
      legalArea
      relatedCases
      sourceReference
    }
    createdAt
    updatedAt
  }
  rank
  headline
  source
}
    `;
export const SystemSettingFragmentFragmentDoc = `
    fragment SystemSettingFragment on SystemSetting {
  id
  key
  value
  valueType
  category
  description
  metadata
  createdAt
  updatedAt
}
    `;
export const UserPreferencesFragmentFragmentDoc = `
    fragment UserPreferencesFragment on UserPreferences {
  id
  userId
  locale
  theme
  aiModel
  getNotificationPreferences {
    documentUpdates
    queryResponses
    systemAlerts
    marketingEmails
    channels {
      email
      inApp
      push
    }
  }
  emailNotifications
  inAppNotifications
  timezone
  dateFormat
  createdAt
  updatedAt
}
    `;
export const UserDetailFragmentFragmentDoc = `
    fragment UserDetailFragment on User {
  ...UserFragment
  disclaimerAccepted
  disclaimerAcceptedAt
  stripeCustomerId
  createdAt
  updatedAt
}
    ${UserFragmentFragmentDoc}`;
export const AuthUserFragmentFragmentDoc = `
    fragment AuthUserFragment on AuthUser {
  id
  email
  username
  firstName
  lastName
  isActive
  disclaimerAccepted
  disclaimerAcceptedAt
  role
}
    `;
export const AuthPayloadFragmentFragmentDoc = `
    fragment AuthPayloadFragment on AuthPayload {
  accessToken
  refreshToken
  user {
    ...AuthUserFragment
  }
}
    ${AuthUserFragmentFragmentDoc}`;
export const RefreshTokenPayloadFragmentFragmentDoc = `
    fragment RefreshTokenPayloadFragment on RefreshTokenPayload {
  accessToken
  refreshToken
}
    `;
export const GetAdminAnalyticsDashboardDocument = `
    query GetAdminAnalyticsDashboard($input: DashboardAnalyticsInput) {
  analyticsDashboard(input: $input) {
    userGrowth {
      ...UserGrowthMetricsFragment
    }
    documents {
      ...DocumentMetricsFragment
    }
    documentTypeDistribution {
      ...DocumentTypeDistributionFragment
    }
    queries {
      ...QueryMetricsFragment
    }
    aiUsage {
      ...AiUsageMetricsFragment
    }
    aiOperationBreakdown {
      ...AiOperationBreakdownFragment
    }
    systemHealth {
      ...SystemHealthMetricsFragment
    }
    generatedAt
  }
}
    ${UserGrowthMetricsFragmentFragmentDoc}
${DocumentMetricsFragmentFragmentDoc}
${DocumentTypeDistributionFragmentFragmentDoc}
${QueryMetricsFragmentFragmentDoc}
${AiUsageMetricsFragmentFragmentDoc}
${AiOperationBreakdownFragmentFragmentDoc}
${SystemHealthMetricsFragmentFragmentDoc}`;

export const useGetAdminAnalyticsDashboardQuery = <
  TData = GetAdminAnalyticsDashboardQuery,
  TError = unknown,
>(
  variables?: GetAdminAnalyticsDashboardQueryVariables,
  options?: Omit<UseQueryOptions<GetAdminAnalyticsDashboardQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetAdminAnalyticsDashboardQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetAdminAnalyticsDashboardQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ['GetAdminAnalyticsDashboard']
        : ['GetAdminAnalyticsDashboard', variables],
    queryFn: fetcher<GetAdminAnalyticsDashboardQuery, GetAdminAnalyticsDashboardQueryVariables>(
      GetAdminAnalyticsDashboardDocument,
      variables,
    ),
    ...options,
  });
};

useGetAdminAnalyticsDashboardQuery.fetcher = (
  variables?: GetAdminAnalyticsDashboardQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetAdminAnalyticsDashboardQuery, GetAdminAnalyticsDashboardQueryVariables>(
    GetAdminAnalyticsDashboardDocument,
    variables,
    options,
  );

export const GetAdminUserGrowthMetricsDocument = `
    query GetAdminUserGrowthMetrics($input: DashboardAnalyticsInput) {
  userGrowthMetrics(input: $input) {
    ...UserGrowthMetricsFragment
  }
}
    ${UserGrowthMetricsFragmentFragmentDoc}`;

export const useGetAdminUserGrowthMetricsQuery = <
  TData = GetAdminUserGrowthMetricsQuery,
  TError = unknown,
>(
  variables?: GetAdminUserGrowthMetricsQueryVariables,
  options?: Omit<UseQueryOptions<GetAdminUserGrowthMetricsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetAdminUserGrowthMetricsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetAdminUserGrowthMetricsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ['GetAdminUserGrowthMetrics']
        : ['GetAdminUserGrowthMetrics', variables],
    queryFn: fetcher<GetAdminUserGrowthMetricsQuery, GetAdminUserGrowthMetricsQueryVariables>(
      GetAdminUserGrowthMetricsDocument,
      variables,
    ),
    ...options,
  });
};

useGetAdminUserGrowthMetricsQuery.fetcher = (
  variables?: GetAdminUserGrowthMetricsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetAdminUserGrowthMetricsQuery, GetAdminUserGrowthMetricsQueryVariables>(
    GetAdminUserGrowthMetricsDocument,
    variables,
    options,
  );

export const GetAdminDocumentMetricsDocument = `
    query GetAdminDocumentMetrics($input: DashboardAnalyticsInput) {
  documentMetrics(input: $input) {
    ...DocumentMetricsFragment
  }
}
    ${DocumentMetricsFragmentFragmentDoc}`;

export const useGetAdminDocumentMetricsQuery = <
  TData = GetAdminDocumentMetricsQuery,
  TError = unknown,
>(
  variables?: GetAdminDocumentMetricsQueryVariables,
  options?: Omit<UseQueryOptions<GetAdminDocumentMetricsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetAdminDocumentMetricsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetAdminDocumentMetricsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ['GetAdminDocumentMetrics']
        : ['GetAdminDocumentMetrics', variables],
    queryFn: fetcher<GetAdminDocumentMetricsQuery, GetAdminDocumentMetricsQueryVariables>(
      GetAdminDocumentMetricsDocument,
      variables,
    ),
    ...options,
  });
};

useGetAdminDocumentMetricsQuery.fetcher = (
  variables?: GetAdminDocumentMetricsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetAdminDocumentMetricsQuery, GetAdminDocumentMetricsQueryVariables>(
    GetAdminDocumentMetricsDocument,
    variables,
    options,
  );

export const GetAdminQueryMetricsDocument = `
    query GetAdminQueryMetrics($input: DashboardAnalyticsInput) {
  queryMetrics(input: $input) {
    ...QueryMetricsFragment
  }
}
    ${QueryMetricsFragmentFragmentDoc}`;

export const useGetAdminQueryMetricsQuery = <TData = GetAdminQueryMetricsQuery, TError = unknown>(
  variables?: GetAdminQueryMetricsQueryVariables,
  options?: Omit<UseQueryOptions<GetAdminQueryMetricsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetAdminQueryMetricsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetAdminQueryMetricsQuery, TError, TData>({
    queryKey:
      variables === undefined ? ['GetAdminQueryMetrics'] : ['GetAdminQueryMetrics', variables],
    queryFn: fetcher<GetAdminQueryMetricsQuery, GetAdminQueryMetricsQueryVariables>(
      GetAdminQueryMetricsDocument,
      variables,
    ),
    ...options,
  });
};

useGetAdminQueryMetricsQuery.fetcher = (
  variables?: GetAdminQueryMetricsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetAdminQueryMetricsQuery, GetAdminQueryMetricsQueryVariables>(
    GetAdminQueryMetricsDocument,
    variables,
    options,
  );

export const GetAdminAiUsageMetricsDocument = `
    query GetAdminAiUsageMetrics($input: DashboardAnalyticsInput) {
  aiUsageMetrics(input: $input) {
    ...AiUsageMetricsFragment
  }
}
    ${AiUsageMetricsFragmentFragmentDoc}`;

export const useGetAdminAiUsageMetricsQuery = <
  TData = GetAdminAiUsageMetricsQuery,
  TError = unknown,
>(
  variables?: GetAdminAiUsageMetricsQueryVariables,
  options?: Omit<UseQueryOptions<GetAdminAiUsageMetricsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetAdminAiUsageMetricsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetAdminAiUsageMetricsQuery, TError, TData>({
    queryKey:
      variables === undefined ? ['GetAdminAiUsageMetrics'] : ['GetAdminAiUsageMetrics', variables],
    queryFn: fetcher<GetAdminAiUsageMetricsQuery, GetAdminAiUsageMetricsQueryVariables>(
      GetAdminAiUsageMetricsDocument,
      variables,
    ),
    ...options,
  });
};

useGetAdminAiUsageMetricsQuery.fetcher = (
  variables?: GetAdminAiUsageMetricsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetAdminAiUsageMetricsQuery, GetAdminAiUsageMetricsQueryVariables>(
    GetAdminAiUsageMetricsDocument,
    variables,
    options,
  );

export const GetAdminSystemHealthMetricsDocument = `
    query GetAdminSystemHealthMetrics($input: DashboardAnalyticsInput) {
  systemHealthMetrics(input: $input) {
    ...SystemHealthMetricsFragment
  }
}
    ${SystemHealthMetricsFragmentFragmentDoc}`;

export const useGetAdminSystemHealthMetricsQuery = <
  TData = GetAdminSystemHealthMetricsQuery,
  TError = unknown,
>(
  variables?: GetAdminSystemHealthMetricsQueryVariables,
  options?: Omit<UseQueryOptions<GetAdminSystemHealthMetricsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetAdminSystemHealthMetricsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetAdminSystemHealthMetricsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ['GetAdminSystemHealthMetrics']
        : ['GetAdminSystemHealthMetrics', variables],
    queryFn: fetcher<GetAdminSystemHealthMetricsQuery, GetAdminSystemHealthMetricsQueryVariables>(
      GetAdminSystemHealthMetricsDocument,
      variables,
    ),
    ...options,
  });
};

useGetAdminSystemHealthMetricsQuery.fetcher = (
  variables?: GetAdminSystemHealthMetricsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetAdminSystemHealthMetricsQuery, GetAdminSystemHealthMetricsQueryVariables>(
    GetAdminSystemHealthMetricsDocument,
    variables,
    options,
  );

export const GetAdminUsersDocument = `
    query GetAdminUsers($filter: UserFilter, $sorting: [UserSort!], $paging: CursorPaging) {
  users(filter: $filter, sorting: $sorting, paging: $paging) {
    ...UserPageResultFragment
  }
}
    ${UserPageResultFragmentFragmentDoc}`;

export const useGetAdminUsersQuery = <TData = GetAdminUsersQuery, TError = unknown>(
  variables?: GetAdminUsersQueryVariables,
  options?: Omit<UseQueryOptions<GetAdminUsersQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetAdminUsersQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetAdminUsersQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetAdminUsers'] : ['GetAdminUsers', variables],
    queryFn: fetcher<GetAdminUsersQuery, GetAdminUsersQueryVariables>(
      GetAdminUsersDocument,
      variables,
    ),
    ...options,
  });
};

useGetAdminUsersQuery.fetcher = (
  variables?: GetAdminUsersQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetAdminUsersQuery, GetAdminUsersQueryVariables>(
    GetAdminUsersDocument,
    variables,
    options,
  );

export const GetAdminUserDocument = `
    query GetAdminUser($id: ID!) {
  user(id: $id) {
    ...AdminUserFragment
  }
}
    ${AdminUserFragmentFragmentDoc}`;

export const useGetAdminUserQuery = <TData = GetAdminUserQuery, TError = unknown>(
  variables: GetAdminUserQueryVariables,
  options?: Omit<UseQueryOptions<GetAdminUserQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetAdminUserQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetAdminUserQuery, TError, TData>({
    queryKey: ['GetAdminUser', variables],
    queryFn: fetcher<GetAdminUserQuery, GetAdminUserQueryVariables>(
      GetAdminUserDocument,
      variables,
    ),
    ...options,
  });
};

useGetAdminUserQuery.fetcher = (
  variables: GetAdminUserQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetAdminUserQuery, GetAdminUserQueryVariables>(GetAdminUserDocument, variables, options);

export const AdminCreateUserDocument = `
    mutation AdminCreateUser($input: CreateOneUserInput!) {
  createOneUser(input: $input) {
    ...AdminUserFragment
  }
}
    ${AdminUserFragmentFragmentDoc}`;

export const useAdminCreateUserMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    AdminCreateUserMutation,
    TError,
    AdminCreateUserMutationVariables,
    TContext
  >,
) => {
  return useMutation<AdminCreateUserMutation, TError, AdminCreateUserMutationVariables, TContext>({
    mutationKey: ['AdminCreateUser'],
    mutationFn: (variables?: AdminCreateUserMutationVariables) =>
      fetcher<AdminCreateUserMutation, AdminCreateUserMutationVariables>(
        AdminCreateUserDocument,
        variables,
      )(),
    ...options,
  });
};

useAdminCreateUserMutation.fetcher = (
  variables: AdminCreateUserMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AdminCreateUserMutation, AdminCreateUserMutationVariables>(
    AdminCreateUserDocument,
    variables,
    options,
  );

export const AdminUpdateUserDocument = `
    mutation AdminUpdateUser($input: UpdateOneUserInput!) {
  updateOneUser(input: $input) {
    ...AdminUserMinimalFragment
  }
}
    ${AdminUserMinimalFragmentFragmentDoc}`;

export const useAdminUpdateUserMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    AdminUpdateUserMutation,
    TError,
    AdminUpdateUserMutationVariables,
    TContext
  >,
) => {
  return useMutation<AdminUpdateUserMutation, TError, AdminUpdateUserMutationVariables, TContext>({
    mutationKey: ['AdminUpdateUser'],
    mutationFn: (variables?: AdminUpdateUserMutationVariables) =>
      fetcher<AdminUpdateUserMutation, AdminUpdateUserMutationVariables>(
        AdminUpdateUserDocument,
        variables,
      )(),
    ...options,
  });
};

useAdminUpdateUserMutation.fetcher = (
  variables: AdminUpdateUserMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AdminUpdateUserMutation, AdminUpdateUserMutationVariables>(
    AdminUpdateUserDocument,
    variables,
    options,
  );

export const AdminDeleteUserDocument = `
    mutation AdminDeleteUser($input: DeleteOneUserInput!) {
  deleteOneUser(input: $input) {
    id
    email
  }
}
    `;

export const useAdminDeleteUserMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    AdminDeleteUserMutation,
    TError,
    AdminDeleteUserMutationVariables,
    TContext
  >,
) => {
  return useMutation<AdminDeleteUserMutation, TError, AdminDeleteUserMutationVariables, TContext>({
    mutationKey: ['AdminDeleteUser'],
    mutationFn: (variables?: AdminDeleteUserMutationVariables) =>
      fetcher<AdminDeleteUserMutation, AdminDeleteUserMutationVariables>(
        AdminDeleteUserDocument,
        variables,
      )(),
    ...options,
  });
};

useAdminDeleteUserMutation.fetcher = (
  variables: AdminDeleteUserMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AdminDeleteUserMutation, AdminDeleteUserMutationVariables>(
    AdminDeleteUserDocument,
    variables,
    options,
  );

export const AdminSuspendUserDocument = `
    mutation AdminSuspendUser($input: SuspendUserInput!) {
  suspendUser(input: $input) {
    ...AdminUserMinimalFragment
  }
}
    ${AdminUserMinimalFragmentFragmentDoc}`;

export const useAdminSuspendUserMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    AdminSuspendUserMutation,
    TError,
    AdminSuspendUserMutationVariables,
    TContext
  >,
) => {
  return useMutation<AdminSuspendUserMutation, TError, AdminSuspendUserMutationVariables, TContext>(
    {
      mutationKey: ['AdminSuspendUser'],
      mutationFn: (variables?: AdminSuspendUserMutationVariables) =>
        fetcher<AdminSuspendUserMutation, AdminSuspendUserMutationVariables>(
          AdminSuspendUserDocument,
          variables,
        )(),
      ...options,
    },
  );
};

useAdminSuspendUserMutation.fetcher = (
  variables: AdminSuspendUserMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AdminSuspendUserMutation, AdminSuspendUserMutationVariables>(
    AdminSuspendUserDocument,
    variables,
    options,
  );

export const AdminActivateUserDocument = `
    mutation AdminActivateUser($input: ActivateUserInput!) {
  activateUser(input: $input) {
    ...AdminUserMinimalFragment
  }
}
    ${AdminUserMinimalFragmentFragmentDoc}`;

export const useAdminActivateUserMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    AdminActivateUserMutation,
    TError,
    AdminActivateUserMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    AdminActivateUserMutation,
    TError,
    AdminActivateUserMutationVariables,
    TContext
  >({
    mutationKey: ['AdminActivateUser'],
    mutationFn: (variables?: AdminActivateUserMutationVariables) =>
      fetcher<AdminActivateUserMutation, AdminActivateUserMutationVariables>(
        AdminActivateUserDocument,
        variables,
      )(),
    ...options,
  });
};

useAdminActivateUserMutation.fetcher = (
  variables: AdminActivateUserMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AdminActivateUserMutation, AdminActivateUserMutationVariables>(
    AdminActivateUserDocument,
    variables,
    options,
  );

export const AdminChangeUserRoleDocument = `
    mutation AdminChangeUserRole($input: ChangeUserRoleInput!) {
  changeUserRole(input: $input) {
    ...AdminUserMinimalFragment
  }
}
    ${AdminUserMinimalFragmentFragmentDoc}`;

export const useAdminChangeUserRoleMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    AdminChangeUserRoleMutation,
    TError,
    AdminChangeUserRoleMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    AdminChangeUserRoleMutation,
    TError,
    AdminChangeUserRoleMutationVariables,
    TContext
  >({
    mutationKey: ['AdminChangeUserRole'],
    mutationFn: (variables?: AdminChangeUserRoleMutationVariables) =>
      fetcher<AdminChangeUserRoleMutation, AdminChangeUserRoleMutationVariables>(
        AdminChangeUserRoleDocument,
        variables,
      )(),
    ...options,
  });
};

useAdminChangeUserRoleMutation.fetcher = (
  variables: AdminChangeUserRoleMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AdminChangeUserRoleMutation, AdminChangeUserRoleMutationVariables>(
    AdminChangeUserRoleDocument,
    variables,
    options,
  );

export const AdminResetUserPasswordDocument = `
    mutation AdminResetUserPassword($input: ResetUserPasswordInput!) {
  resetUserPassword(input: $input) {
    ...AdminUserMinimalFragment
  }
}
    ${AdminUserMinimalFragmentFragmentDoc}`;

export const useAdminResetUserPasswordMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    AdminResetUserPasswordMutation,
    TError,
    AdminResetUserPasswordMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    AdminResetUserPasswordMutation,
    TError,
    AdminResetUserPasswordMutationVariables,
    TContext
  >({
    mutationKey: ['AdminResetUserPassword'],
    mutationFn: (variables?: AdminResetUserPasswordMutationVariables) =>
      fetcher<AdminResetUserPasswordMutation, AdminResetUserPasswordMutationVariables>(
        AdminResetUserPasswordDocument,
        variables,
      )(),
    ...options,
  });
};

useAdminResetUserPasswordMutation.fetcher = (
  variables: AdminResetUserPasswordMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AdminResetUserPasswordMutation, AdminResetUserPasswordMutationVariables>(
    AdminResetUserPasswordDocument,
    variables,
    options,
  );

export const AuditLogsDocument = `
    query AuditLogs($filter: AuditLogFilter, $paging: CursorPaging, $sorting: [AuditLogSort!]) {
  auditLogs(filter: $filter, paging: $paging, sorting: $sorting) {
    edges {
      node {
        ...AuditLogFragment
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    ${AuditLogFragmentFragmentDoc}`;

export const useAuditLogsQuery = <TData = AuditLogsQuery, TError = unknown>(
  variables?: AuditLogsQueryVariables,
  options?: Omit<UseQueryOptions<AuditLogsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<AuditLogsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<AuditLogsQuery, TError, TData>({
    queryKey: variables === undefined ? ['AuditLogs'] : ['AuditLogs', variables],
    queryFn: fetcher<AuditLogsQuery, AuditLogsQueryVariables>(AuditLogsDocument, variables),
    ...options,
  });
};

useAuditLogsQuery.fetcher = (
  variables?: AuditLogsQueryVariables,
  options?: RequestInit['headers'],
) => fetcher<AuditLogsQuery, AuditLogsQueryVariables>(AuditLogsDocument, variables, options);

export const AuditLogDocument = `
    query AuditLog($id: ID!) {
  auditLog(id: $id) {
    ...AuditLogFragment
  }
}
    ${AuditLogFragmentFragmentDoc}`;

export const useAuditLogQuery = <TData = AuditLogQuery, TError = unknown>(
  variables: AuditLogQueryVariables,
  options?: Omit<UseQueryOptions<AuditLogQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<AuditLogQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<AuditLogQuery, TError, TData>({
    queryKey: ['AuditLog', variables],
    queryFn: fetcher<AuditLogQuery, AuditLogQueryVariables>(AuditLogDocument, variables),
    ...options,
  });
};

useAuditLogQuery.fetcher = (variables: AuditLogQueryVariables, options?: RequestInit['headers']) =>
  fetcher<AuditLogQuery, AuditLogQueryVariables>(AuditLogDocument, variables, options);

export const MyBillingInfoDocument = `
    query MyBillingInfo {
  myBillingInfo {
    ...BillingInfoFragment
  }
}
    ${BillingInfoFragmentFragmentDoc}`;

export const useMyBillingInfoQuery = <TData = MyBillingInfoQuery, TError = unknown>(
  variables?: MyBillingInfoQueryVariables,
  options?: Omit<UseQueryOptions<MyBillingInfoQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<MyBillingInfoQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<MyBillingInfoQuery, TError, TData>({
    queryKey: variables === undefined ? ['MyBillingInfo'] : ['MyBillingInfo', variables],
    queryFn: fetcher<MyBillingInfoQuery, MyBillingInfoQueryVariables>(
      MyBillingInfoDocument,
      variables,
    ),
    ...options,
  });
};

useMyBillingInfoQuery.fetcher = (
  variables?: MyBillingInfoQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<MyBillingInfoQuery, MyBillingInfoQueryVariables>(
    MyBillingInfoDocument,
    variables,
    options,
  );

export const MyPaymentHistoryDocument = `
    query MyPaymentHistory {
  myPaymentHistory {
    ...PaymentHistoryItemFragment
  }
}
    ${PaymentHistoryItemFragmentFragmentDoc}`;

export const useMyPaymentHistoryQuery = <TData = MyPaymentHistoryQuery, TError = unknown>(
  variables?: MyPaymentHistoryQueryVariables,
  options?: Omit<UseQueryOptions<MyPaymentHistoryQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<MyPaymentHistoryQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<MyPaymentHistoryQuery, TError, TData>({
    queryKey: variables === undefined ? ['MyPaymentHistory'] : ['MyPaymentHistory', variables],
    queryFn: fetcher<MyPaymentHistoryQuery, MyPaymentHistoryQueryVariables>(
      MyPaymentHistoryDocument,
      variables,
    ),
    ...options,
  });
};

useMyPaymentHistoryQuery.fetcher = (
  variables?: MyPaymentHistoryQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<MyPaymentHistoryQuery, MyPaymentHistoryQueryVariables>(
    MyPaymentHistoryDocument,
    variables,
    options,
  );

export const SubscriptionPlansDocument = `
    query SubscriptionPlans {
  subscriptionPlans {
    ...SubscriptionPlanFragment
  }
}
    ${SubscriptionPlanFragmentFragmentDoc}`;

export const useSubscriptionPlansQuery = <TData = SubscriptionPlansQuery, TError = unknown>(
  variables?: SubscriptionPlansQueryVariables,
  options?: Omit<UseQueryOptions<SubscriptionPlansQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<SubscriptionPlansQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<SubscriptionPlansQuery, TError, TData>({
    queryKey: variables === undefined ? ['SubscriptionPlans'] : ['SubscriptionPlans', variables],
    queryFn: fetcher<SubscriptionPlansQuery, SubscriptionPlansQueryVariables>(
      SubscriptionPlansDocument,
      variables,
    ),
    ...options,
  });
};

useSubscriptionPlansQuery.fetcher = (
  variables?: SubscriptionPlansQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<SubscriptionPlansQuery, SubscriptionPlansQueryVariables>(
    SubscriptionPlansDocument,
    variables,
    options,
  );

export const SubscriptionPlanDocument = `
    query SubscriptionPlan($id: String!) {
  subscriptionPlan(id: $id) {
    ...SubscriptionPlanFragment
  }
}
    ${SubscriptionPlanFragmentFragmentDoc}`;

export const useSubscriptionPlanQuery = <TData = SubscriptionPlanQuery, TError = unknown>(
  variables: SubscriptionPlanQueryVariables,
  options?: Omit<UseQueryOptions<SubscriptionPlanQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<SubscriptionPlanQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<SubscriptionPlanQuery, TError, TData>({
    queryKey: ['SubscriptionPlan', variables],
    queryFn: fetcher<SubscriptionPlanQuery, SubscriptionPlanQueryVariables>(
      SubscriptionPlanDocument,
      variables,
    ),
    ...options,
  });
};

useSubscriptionPlanQuery.fetcher = (
  variables: SubscriptionPlanQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<SubscriptionPlanQuery, SubscriptionPlanQueryVariables>(
    SubscriptionPlanDocument,
    variables,
    options,
  );

export const CancelMySubscriptionDocument = `
    mutation CancelMySubscription($input: CancelSubscriptionInput!) {
  cancelMySubscription(input: $input) {
    ...UserSubscriptionFragment
  }
}
    ${UserSubscriptionFragmentFragmentDoc}`;

export const useCancelMySubscriptionMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CancelMySubscriptionMutation,
    TError,
    CancelMySubscriptionMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CancelMySubscriptionMutation,
    TError,
    CancelMySubscriptionMutationVariables,
    TContext
  >({
    mutationKey: ['CancelMySubscription'],
    mutationFn: (variables?: CancelMySubscriptionMutationVariables) =>
      fetcher<CancelMySubscriptionMutation, CancelMySubscriptionMutationVariables>(
        CancelMySubscriptionDocument,
        variables,
      )(),
    ...options,
  });
};

useCancelMySubscriptionMutation.fetcher = (
  variables: CancelMySubscriptionMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<CancelMySubscriptionMutation, CancelMySubscriptionMutationVariables>(
    CancelMySubscriptionDocument,
    variables,
    options,
  );

export const ResumeMySubscriptionDocument = `
    mutation ResumeMySubscription {
  resumeMySubscription {
    ...UserSubscriptionFragment
  }
}
    ${UserSubscriptionFragmentFragmentDoc}`;

export const useResumeMySubscriptionMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    ResumeMySubscriptionMutation,
    TError,
    ResumeMySubscriptionMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    ResumeMySubscriptionMutation,
    TError,
    ResumeMySubscriptionMutationVariables,
    TContext
  >({
    mutationKey: ['ResumeMySubscription'],
    mutationFn: (variables?: ResumeMySubscriptionMutationVariables) =>
      fetcher<ResumeMySubscriptionMutation, ResumeMySubscriptionMutationVariables>(
        ResumeMySubscriptionDocument,
        variables,
      )(),
    ...options,
  });
};

useResumeMySubscriptionMutation.fetcher = (
  variables?: ResumeMySubscriptionMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<ResumeMySubscriptionMutation, ResumeMySubscriptionMutationVariables>(
    ResumeMySubscriptionDocument,
    variables,
    options,
  );

export const ChangeSubscriptionPlanDocument = `
    mutation ChangeSubscriptionPlan($newPlanId: String!) {
  changeSubscriptionPlan(newPlanId: $newPlanId) {
    ...UserSubscriptionFragment
  }
}
    ${UserSubscriptionFragmentFragmentDoc}`;

export const useChangeSubscriptionPlanMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    ChangeSubscriptionPlanMutation,
    TError,
    ChangeSubscriptionPlanMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    ChangeSubscriptionPlanMutation,
    TError,
    ChangeSubscriptionPlanMutationVariables,
    TContext
  >({
    mutationKey: ['ChangeSubscriptionPlan'],
    mutationFn: (variables?: ChangeSubscriptionPlanMutationVariables) =>
      fetcher<ChangeSubscriptionPlanMutation, ChangeSubscriptionPlanMutationVariables>(
        ChangeSubscriptionPlanDocument,
        variables,
      )(),
    ...options,
  });
};

useChangeSubscriptionPlanMutation.fetcher = (
  variables: ChangeSubscriptionPlanMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<ChangeSubscriptionPlanMutation, ChangeSubscriptionPlanMutationVariables>(
    ChangeSubscriptionPlanDocument,
    variables,
    options,
  );

export const CreateMySubscriptionDocument = `
    mutation CreateMySubscription($input: CreateUserSubscriptionInput!) {
  createMySubscription(input: $input) {
    ...UserSubscriptionFragment
  }
}
    ${UserSubscriptionFragmentFragmentDoc}`;

export const useCreateMySubscriptionMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CreateMySubscriptionMutation,
    TError,
    CreateMySubscriptionMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CreateMySubscriptionMutation,
    TError,
    CreateMySubscriptionMutationVariables,
    TContext
  >({
    mutationKey: ['CreateMySubscription'],
    mutationFn: (variables?: CreateMySubscriptionMutationVariables) =>
      fetcher<CreateMySubscriptionMutation, CreateMySubscriptionMutationVariables>(
        CreateMySubscriptionDocument,
        variables,
      )(),
    ...options,
  });
};

useCreateMySubscriptionMutation.fetcher = (
  variables: CreateMySubscriptionMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<CreateMySubscriptionMutation, CreateMySubscriptionMutationVariables>(
    CreateMySubscriptionDocument,
    variables,
    options,
  );

export const AskLegalQuestionDocument = `
    mutation AskLegalQuestion($input: AskLegalQuestionInput!) {
  askLegalQuestion(input: $input) {
    ...LegalQueryFragment
  }
}
    ${LegalQueryFragmentFragmentDoc}`;

export const useAskLegalQuestionMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    AskLegalQuestionMutation,
    TError,
    AskLegalQuestionMutationVariables,
    TContext
  >,
) => {
  return useMutation<AskLegalQuestionMutation, TError, AskLegalQuestionMutationVariables, TContext>(
    {
      mutationKey: ['AskLegalQuestion'],
      mutationFn: (variables?: AskLegalQuestionMutationVariables) =>
        fetcher<AskLegalQuestionMutation, AskLegalQuestionMutationVariables>(
          AskLegalQuestionDocument,
          variables,
        )(),
      ...options,
    },
  );
};

useAskLegalQuestionMutation.fetcher = (
  variables: AskLegalQuestionMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AskLegalQuestionMutation, AskLegalQuestionMutationVariables>(
    AskLegalQuestionDocument,
    variables,
    options,
  );

export const GetLegalQueryDocument = `
    query GetLegalQuery($id: ID!) {
  legalQuery(id: $id) {
    ...LegalQueryFragment
  }
}
    ${LegalQueryFragmentFragmentDoc}`;

export const useGetLegalQueryQuery = <TData = GetLegalQueryQuery, TError = unknown>(
  variables: GetLegalQueryQueryVariables,
  options?: Omit<UseQueryOptions<GetLegalQueryQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetLegalQueryQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetLegalQueryQuery, TError, TData>({
    queryKey: ['GetLegalQuery', variables],
    queryFn: fetcher<GetLegalQueryQuery, GetLegalQueryQueryVariables>(
      GetLegalQueryDocument,
      variables,
    ),
    ...options,
  });
};

useGetLegalQueryQuery.fetcher = (
  variables: GetLegalQueryQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetLegalQueryQuery, GetLegalQueryQueryVariables>(
    GetLegalQueryDocument,
    variables,
    options,
  );

export const GetSessionQueriesDocument = `
    query GetSessionQueries($sessionId: String!) {
  queriesBySession(sessionId: $sessionId) {
    ...LegalQueryFragment
  }
}
    ${LegalQueryFragmentFragmentDoc}`;

export const useGetSessionQueriesQuery = <TData = GetSessionQueriesQuery, TError = unknown>(
  variables: GetSessionQueriesQueryVariables,
  options?: Omit<UseQueryOptions<GetSessionQueriesQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetSessionQueriesQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetSessionQueriesQuery, TError, TData>({
    queryKey: ['GetSessionQueries', variables],
    queryFn: fetcher<GetSessionQueriesQuery, GetSessionQueriesQueryVariables>(
      GetSessionQueriesDocument,
      variables,
    ),
    ...options,
  });
};

useGetSessionQueriesQuery.fetcher = (
  variables: GetSessionQueriesQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetSessionQueriesQuery, GetSessionQueriesQueryVariables>(
    GetSessionQueriesDocument,
    variables,
    options,
  );

export const GetPendingQueriesDocument = `
    query GetPendingQueries {
  pendingQueries {
    ...LegalQueryFragment
  }
}
    ${LegalQueryFragmentFragmentDoc}`;

export const useGetPendingQueriesQuery = <TData = GetPendingQueriesQuery, TError = unknown>(
  variables?: GetPendingQueriesQueryVariables,
  options?: Omit<UseQueryOptions<GetPendingQueriesQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetPendingQueriesQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetPendingQueriesQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetPendingQueries'] : ['GetPendingQueries', variables],
    queryFn: fetcher<GetPendingQueriesQuery, GetPendingQueriesQueryVariables>(
      GetPendingQueriesDocument,
      variables,
    ),
    ...options,
  });
};

useGetPendingQueriesQuery.fetcher = (
  variables?: GetPendingQueriesQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetPendingQueriesQuery, GetPendingQueriesQueryVariables>(
    GetPendingQueriesDocument,
    variables,
    options,
  );

export const GetLegalDocumentsDocument = `
    query GetLegalDocuments($filter: LegalDocumentFilter, $paging: CursorPaging, $sorting: [LegalDocumentSort!]) {
  legalDocuments(filter: $filter, paging: $paging, sorting: $sorting) {
    totalCount
    edges {
      node {
        ...LegalDocumentFragment
      }
    }
    pageInfo {
      ...PageInfoFragment
    }
  }
}
    ${LegalDocumentFragmentFragmentDoc}
${PageInfoFragmentFragmentDoc}`;

export const useGetLegalDocumentsQuery = <TData = GetLegalDocumentsQuery, TError = unknown>(
  variables?: GetLegalDocumentsQueryVariables,
  options?: Omit<UseQueryOptions<GetLegalDocumentsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetLegalDocumentsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetLegalDocumentsQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetLegalDocuments'] : ['GetLegalDocuments', variables],
    queryFn: fetcher<GetLegalDocumentsQuery, GetLegalDocumentsQueryVariables>(
      GetLegalDocumentsDocument,
      variables,
    ),
    ...options,
  });
};

useGetLegalDocumentsQuery.fetcher = (
  variables?: GetLegalDocumentsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetLegalDocumentsQuery, GetLegalDocumentsQueryVariables>(
    GetLegalDocumentsDocument,
    variables,
    options,
  );

export const GetLegalDocumentDocument = `
    query GetLegalDocument($id: ID!) {
  legalDocument(id: $id) {
    ...LegalDocumentFragment
  }
}
    ${LegalDocumentFragmentFragmentDoc}`;

export const useGetLegalDocumentQuery = <TData = GetLegalDocumentQuery, TError = unknown>(
  variables: GetLegalDocumentQueryVariables,
  options?: Omit<UseQueryOptions<GetLegalDocumentQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetLegalDocumentQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetLegalDocumentQuery, TError, TData>({
    queryKey: ['GetLegalDocument', variables],
    queryFn: fetcher<GetLegalDocumentQuery, GetLegalDocumentQueryVariables>(
      GetLegalDocumentDocument,
      variables,
    ),
    ...options,
  });
};

useGetLegalDocumentQuery.fetcher = (
  variables: GetLegalDocumentQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetLegalDocumentQuery, GetLegalDocumentQueryVariables>(
    GetLegalDocumentDocument,
    variables,
    options,
  );

export const GenerateDocumentDocument = `
    mutation GenerateDocument($input: GenerateDocumentInput!) {
  generateDocument(input: $input) {
    ...LegalDocumentFragment
  }
}
    ${LegalDocumentFragmentFragmentDoc}`;

export const useGenerateDocumentMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    GenerateDocumentMutation,
    TError,
    GenerateDocumentMutationVariables,
    TContext
  >,
) => {
  return useMutation<GenerateDocumentMutation, TError, GenerateDocumentMutationVariables, TContext>(
    {
      mutationKey: ['GenerateDocument'],
      mutationFn: (variables?: GenerateDocumentMutationVariables) =>
        fetcher<GenerateDocumentMutation, GenerateDocumentMutationVariables>(
          GenerateDocumentDocument,
          variables,
        )(),
      ...options,
    },
  );
};

useGenerateDocumentMutation.fetcher = (
  variables: GenerateDocumentMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GenerateDocumentMutation, GenerateDocumentMutationVariables>(
    GenerateDocumentDocument,
    variables,
    options,
  );

export const UpdateDocumentDocument = `
    mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {
  updateDocument(id: $id, input: $input) {
    ...LegalDocumentFragment
  }
}
    ${LegalDocumentFragmentFragmentDoc}`;

export const useUpdateDocumentMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    UpdateDocumentMutation,
    TError,
    UpdateDocumentMutationVariables,
    TContext
  >,
) => {
  return useMutation<UpdateDocumentMutation, TError, UpdateDocumentMutationVariables, TContext>({
    mutationKey: ['UpdateDocument'],
    mutationFn: (variables?: UpdateDocumentMutationVariables) =>
      fetcher<UpdateDocumentMutation, UpdateDocumentMutationVariables>(
        UpdateDocumentDocument,
        variables,
      )(),
    ...options,
  });
};

useUpdateDocumentMutation.fetcher = (
  variables: UpdateDocumentMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<UpdateDocumentMutation, UpdateDocumentMutationVariables>(
    UpdateDocumentDocument,
    variables,
    options,
  );

export const DeleteDocumentDocument = `
    mutation DeleteDocument($id: ID!) {
  deleteDocument(id: $id)
}
    `;

export const useDeleteDocumentMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    DeleteDocumentMutation,
    TError,
    DeleteDocumentMutationVariables,
    TContext
  >,
) => {
  return useMutation<DeleteDocumentMutation, TError, DeleteDocumentMutationVariables, TContext>({
    mutationKey: ['DeleteDocument'],
    mutationFn: (variables?: DeleteDocumentMutationVariables) =>
      fetcher<DeleteDocumentMutation, DeleteDocumentMutationVariables>(
        DeleteDocumentDocument,
        variables,
      )(),
    ...options,
  });
};

useDeleteDocumentMutation.fetcher = (
  variables: DeleteDocumentMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<DeleteDocumentMutation, DeleteDocumentMutationVariables>(
    DeleteDocumentDocument,
    variables,
    options,
  );

export const GetDocumentTemplatesDocument = `
    query GetDocumentTemplates($filter: DocumentTemplateFilter, $paging: CursorPaging) {
  documentTemplates(filter: $filter, paging: $paging) {
    totalCount
    edges {
      node {
        ...DocumentTemplateFragment
      }
    }
    pageInfo {
      ...PageInfoFragment
    }
  }
}
    ${DocumentTemplateFragmentFragmentDoc}
${PageInfoFragmentFragmentDoc}`;

export const useGetDocumentTemplatesQuery = <TData = GetDocumentTemplatesQuery, TError = unknown>(
  variables?: GetDocumentTemplatesQueryVariables,
  options?: Omit<UseQueryOptions<GetDocumentTemplatesQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetDocumentTemplatesQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetDocumentTemplatesQuery, TError, TData>({
    queryKey:
      variables === undefined ? ['GetDocumentTemplates'] : ['GetDocumentTemplates', variables],
    queryFn: fetcher<GetDocumentTemplatesQuery, GetDocumentTemplatesQueryVariables>(
      GetDocumentTemplatesDocument,
      variables,
    ),
    ...options,
  });
};

useGetDocumentTemplatesQuery.fetcher = (
  variables?: GetDocumentTemplatesQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetDocumentTemplatesQuery, GetDocumentTemplatesQueryVariables>(
    GetDocumentTemplatesDocument,
    variables,
    options,
  );

export const GetDocumentTemplateDocument = `
    query GetDocumentTemplate($id: ID!) {
  documentTemplate(id: $id) {
    ...DocumentTemplateFragment
  }
}
    ${DocumentTemplateFragmentFragmentDoc}`;

export const useGetDocumentTemplateQuery = <TData = GetDocumentTemplateQuery, TError = unknown>(
  variables: GetDocumentTemplateQueryVariables,
  options?: Omit<UseQueryOptions<GetDocumentTemplateQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetDocumentTemplateQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetDocumentTemplateQuery, TError, TData>({
    queryKey: ['GetDocumentTemplate', variables],
    queryFn: fetcher<GetDocumentTemplateQuery, GetDocumentTemplateQueryVariables>(
      GetDocumentTemplateDocument,
      variables,
    ),
    ...options,
  });
};

useGetDocumentTemplateQuery.fetcher = (
  variables: GetDocumentTemplateQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetDocumentTemplateQuery, GetDocumentTemplateQueryVariables>(
    GetDocumentTemplateDocument,
    variables,
    options,
  );

export const CreateDocumentTemplateDocument = `
    mutation CreateDocumentTemplate($input: CreateTemplateInput!) {
  createDocumentTemplate(input: $input) {
    ...DocumentTemplateFragment
  }
}
    ${DocumentTemplateFragmentFragmentDoc}`;

export const useCreateDocumentTemplateMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CreateDocumentTemplateMutation,
    TError,
    CreateDocumentTemplateMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CreateDocumentTemplateMutation,
    TError,
    CreateDocumentTemplateMutationVariables,
    TContext
  >({
    mutationKey: ['CreateDocumentTemplate'],
    mutationFn: (variables?: CreateDocumentTemplateMutationVariables) =>
      fetcher<CreateDocumentTemplateMutation, CreateDocumentTemplateMutationVariables>(
        CreateDocumentTemplateDocument,
        variables,
      )(),
    ...options,
  });
};

useCreateDocumentTemplateMutation.fetcher = (
  variables: CreateDocumentTemplateMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<CreateDocumentTemplateMutation, CreateDocumentTemplateMutationVariables>(
    CreateDocumentTemplateDocument,
    variables,
    options,
  );

export const UpdateDocumentTemplateDocument = `
    mutation UpdateDocumentTemplate($id: ID!, $input: UpdateTemplateInput!) {
  updateDocumentTemplate(id: $id, input: $input) {
    ...DocumentTemplateFragment
  }
}
    ${DocumentTemplateFragmentFragmentDoc}`;

export const useUpdateDocumentTemplateMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    UpdateDocumentTemplateMutation,
    TError,
    UpdateDocumentTemplateMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    UpdateDocumentTemplateMutation,
    TError,
    UpdateDocumentTemplateMutationVariables,
    TContext
  >({
    mutationKey: ['UpdateDocumentTemplate'],
    mutationFn: (variables?: UpdateDocumentTemplateMutationVariables) =>
      fetcher<UpdateDocumentTemplateMutation, UpdateDocumentTemplateMutationVariables>(
        UpdateDocumentTemplateDocument,
        variables,
      )(),
    ...options,
  });
};

useUpdateDocumentTemplateMutation.fetcher = (
  variables: UpdateDocumentTemplateMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<UpdateDocumentTemplateMutation, UpdateDocumentTemplateMutationVariables>(
    UpdateDocumentTemplateDocument,
    variables,
    options,
  );

export const DeleteDocumentTemplateDocument = `
    mutation DeleteDocumentTemplate($id: ID!) {
  deleteDocumentTemplate(id: $id)
}
    `;

export const useDeleteDocumentTemplateMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    DeleteDocumentTemplateMutation,
    TError,
    DeleteDocumentTemplateMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    DeleteDocumentTemplateMutation,
    TError,
    DeleteDocumentTemplateMutationVariables,
    TContext
  >({
    mutationKey: ['DeleteDocumentTemplate'],
    mutationFn: (variables?: DeleteDocumentTemplateMutationVariables) =>
      fetcher<DeleteDocumentTemplateMutation, DeleteDocumentTemplateMutationVariables>(
        DeleteDocumentTemplateDocument,
        variables,
      )(),
    ...options,
  });
};

useDeleteDocumentTemplateMutation.fetcher = (
  variables: DeleteDocumentTemplateMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<DeleteDocumentTemplateMutation, DeleteDocumentTemplateMutationVariables>(
    DeleteDocumentTemplateDocument,
    variables,
    options,
  );

export const GetLegalRulingsDocument = `
    query GetLegalRulings($filter: LegalRulingFilter, $paging: CursorPaging, $sorting: [LegalRulingSort!]) {
  legalRulings(filter: $filter, paging: $paging, sorting: $sorting) {
    totalCount
    edges {
      node {
        ...LegalRulingFragment
      }
    }
    pageInfo {
      ...PageInfoFragment
    }
  }
}
    ${LegalRulingFragmentFragmentDoc}
${PageInfoFragmentFragmentDoc}`;

export const useGetLegalRulingsQuery = <TData = GetLegalRulingsQuery, TError = unknown>(
  variables?: GetLegalRulingsQueryVariables,
  options?: Omit<UseQueryOptions<GetLegalRulingsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetLegalRulingsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetLegalRulingsQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetLegalRulings'] : ['GetLegalRulings', variables],
    queryFn: fetcher<GetLegalRulingsQuery, GetLegalRulingsQueryVariables>(
      GetLegalRulingsDocument,
      variables,
    ),
    ...options,
  });
};

useGetLegalRulingsQuery.fetcher = (
  variables?: GetLegalRulingsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetLegalRulingsQuery, GetLegalRulingsQueryVariables>(
    GetLegalRulingsDocument,
    variables,
    options,
  );

export const GetLegalRulingDocument = `
    query GetLegalRuling($id: ID!) {
  legalRuling(id: $id) {
    ...LegalRulingFragment
  }
}
    ${LegalRulingFragmentFragmentDoc}`;

export const useGetLegalRulingQuery = <TData = GetLegalRulingQuery, TError = unknown>(
  variables: GetLegalRulingQueryVariables,
  options?: Omit<UseQueryOptions<GetLegalRulingQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetLegalRulingQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetLegalRulingQuery, TError, TData>({
    queryKey: ['GetLegalRuling', variables],
    queryFn: fetcher<GetLegalRulingQuery, GetLegalRulingQueryVariables>(
      GetLegalRulingDocument,
      variables,
    ),
    ...options,
  });
};

useGetLegalRulingQuery.fetcher = (
  variables: GetLegalRulingQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetLegalRulingQuery, GetLegalRulingQueryVariables>(
    GetLegalRulingDocument,
    variables,
    options,
  );

export const GetLegalRulingDetailDocument = `
    query GetLegalRulingDetail($id: ID!) {
  legalRuling(id: $id) {
    ...LegalRulingDetailFragment
  }
}
    ${LegalRulingDetailFragmentFragmentDoc}`;

export const useGetLegalRulingDetailQuery = <TData = GetLegalRulingDetailQuery, TError = unknown>(
  variables: GetLegalRulingDetailQueryVariables,
  options?: Omit<UseQueryOptions<GetLegalRulingDetailQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetLegalRulingDetailQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetLegalRulingDetailQuery, TError, TData>({
    queryKey: ['GetLegalRulingDetail', variables],
    queryFn: fetcher<GetLegalRulingDetailQuery, GetLegalRulingDetailQueryVariables>(
      GetLegalRulingDetailDocument,
      variables,
    ),
    ...options,
  });
};

useGetLegalRulingDetailQuery.fetcher = (
  variables: GetLegalRulingDetailQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetLegalRulingDetailQuery, GetLegalRulingDetailQueryVariables>(
    GetLegalRulingDetailDocument,
    variables,
    options,
  );

export const LoginDocument = `
    mutation Login($input: LoginInput!) {
  login(input: $input) {
    ...AuthPayloadFragment
  }
}
    ${AuthPayloadFragmentFragmentDoc}`;

export const useLoginMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<LoginMutation, TError, LoginMutationVariables, TContext>,
) => {
  return useMutation<LoginMutation, TError, LoginMutationVariables, TContext>({
    mutationKey: ['Login'],
    mutationFn: (variables?: LoginMutationVariables) =>
      fetcher<LoginMutation, LoginMutationVariables>(LoginDocument, variables)(),
    ...options,
  });
};

useLoginMutation.fetcher = (variables: LoginMutationVariables, options?: RequestInit['headers']) =>
  fetcher<LoginMutation, LoginMutationVariables>(LoginDocument, variables, options);

export const RegisterDocument = `
    mutation Register($input: RegisterInput!) {
  register(input: $input) {
    ...AuthPayloadFragment
  }
}
    ${AuthPayloadFragmentFragmentDoc}`;

export const useRegisterMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<RegisterMutation, TError, RegisterMutationVariables, TContext>,
) => {
  return useMutation<RegisterMutation, TError, RegisterMutationVariables, TContext>({
    mutationKey: ['Register'],
    mutationFn: (variables?: RegisterMutationVariables) =>
      fetcher<RegisterMutation, RegisterMutationVariables>(RegisterDocument, variables)(),
    ...options,
  });
};

useRegisterMutation.fetcher = (
  variables: RegisterMutationVariables,
  options?: RequestInit['headers'],
) => fetcher<RegisterMutation, RegisterMutationVariables>(RegisterDocument, variables, options);

export const RefreshTokenDocument = `
    mutation RefreshToken($input: RefreshTokenInput!) {
  refreshToken(input: $input) {
    ...RefreshTokenPayloadFragment
  }
}
    ${RefreshTokenPayloadFragmentFragmentDoc}`;

export const useRefreshTokenMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    RefreshTokenMutation,
    TError,
    RefreshTokenMutationVariables,
    TContext
  >,
) => {
  return useMutation<RefreshTokenMutation, TError, RefreshTokenMutationVariables, TContext>({
    mutationKey: ['RefreshToken'],
    mutationFn: (variables?: RefreshTokenMutationVariables) =>
      fetcher<RefreshTokenMutation, RefreshTokenMutationVariables>(
        RefreshTokenDocument,
        variables,
      )(),
    ...options,
  });
};

useRefreshTokenMutation.fetcher = (
  variables: RefreshTokenMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<RefreshTokenMutation, RefreshTokenMutationVariables>(
    RefreshTokenDocument,
    variables,
    options,
  );

export const AcceptDisclaimerDocument = `
    mutation AcceptDisclaimer {
  acceptDisclaimer {
    ...AuthUserFragment
  }
}
    ${AuthUserFragmentFragmentDoc}`;

export const useAcceptDisclaimerMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    AcceptDisclaimerMutation,
    TError,
    AcceptDisclaimerMutationVariables,
    TContext
  >,
) => {
  return useMutation<AcceptDisclaimerMutation, TError, AcceptDisclaimerMutationVariables, TContext>(
    {
      mutationKey: ['AcceptDisclaimer'],
      mutationFn: (variables?: AcceptDisclaimerMutationVariables) =>
        fetcher<AcceptDisclaimerMutation, AcceptDisclaimerMutationVariables>(
          AcceptDisclaimerDocument,
          variables,
        )(),
      ...options,
    },
  );
};

useAcceptDisclaimerMutation.fetcher = (
  variables?: AcceptDisclaimerMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AcceptDisclaimerMutation, AcceptDisclaimerMutationVariables>(
    AcceptDisclaimerDocument,
    variables,
    options,
  );

export const MarkNotificationAsReadDocument = `
    mutation MarkNotificationAsRead($notificationId: String!, $userId: String!) {
  markNotificationAsRead(notificationId: $notificationId, userId: $userId)
}
    `;

export const useMarkNotificationAsReadMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    MarkNotificationAsReadMutation,
    TError,
    MarkNotificationAsReadMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    MarkNotificationAsReadMutation,
    TError,
    MarkNotificationAsReadMutationVariables,
    TContext
  >({
    mutationKey: ['MarkNotificationAsRead'],
    mutationFn: (variables?: MarkNotificationAsReadMutationVariables) =>
      fetcher<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>(
        MarkNotificationAsReadDocument,
        variables,
      )(),
    ...options,
  });
};

useMarkNotificationAsReadMutation.fetcher = (
  variables: MarkNotificationAsReadMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>(
    MarkNotificationAsReadDocument,
    variables,
    options,
  );

export const MarkAllNotificationsAsReadDocument = `
    mutation MarkAllNotificationsAsRead($userId: String!) {
  markAllNotificationsAsRead(userId: $userId)
}
    `;

export const useMarkAllNotificationsAsReadMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    MarkAllNotificationsAsReadMutation,
    TError,
    MarkAllNotificationsAsReadMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    MarkAllNotificationsAsReadMutation,
    TError,
    MarkAllNotificationsAsReadMutationVariables,
    TContext
  >({
    mutationKey: ['MarkAllNotificationsAsRead'],
    mutationFn: (variables?: MarkAllNotificationsAsReadMutationVariables) =>
      fetcher<MarkAllNotificationsAsReadMutation, MarkAllNotificationsAsReadMutationVariables>(
        MarkAllNotificationsAsReadDocument,
        variables,
      )(),
    ...options,
  });
};

useMarkAllNotificationsAsReadMutation.fetcher = (
  variables: MarkAllNotificationsAsReadMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<MarkAllNotificationsAsReadMutation, MarkAllNotificationsAsReadMutationVariables>(
    MarkAllNotificationsAsReadDocument,
    variables,
    options,
  );

export const UpsertSystemSettingDocument = `
    mutation UpsertSystemSetting($input: SystemSettingInput!) {
  upsertSystemSetting(input: $input) {
    ...SystemSettingFragment
  }
}
    ${SystemSettingFragmentFragmentDoc}`;

export const useUpsertSystemSettingMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    UpsertSystemSettingMutation,
    TError,
    UpsertSystemSettingMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    UpsertSystemSettingMutation,
    TError,
    UpsertSystemSettingMutationVariables,
    TContext
  >({
    mutationKey: ['UpsertSystemSetting'],
    mutationFn: (variables?: UpsertSystemSettingMutationVariables) =>
      fetcher<UpsertSystemSettingMutation, UpsertSystemSettingMutationVariables>(
        UpsertSystemSettingDocument,
        variables,
      )(),
    ...options,
  });
};

useUpsertSystemSettingMutation.fetcher = (
  variables: UpsertSystemSettingMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<UpsertSystemSettingMutation, UpsertSystemSettingMutationVariables>(
    UpsertSystemSettingDocument,
    variables,
    options,
  );

export const BulkUpsertSystemSettingsDocument = `
    mutation BulkUpsertSystemSettings($input: BulkUpdateSettingsInput!) {
  bulkUpsertSystemSettings(input: $input) {
    ...SystemSettingFragment
  }
}
    ${SystemSettingFragmentFragmentDoc}`;

export const useBulkUpsertSystemSettingsMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    BulkUpsertSystemSettingsMutation,
    TError,
    BulkUpsertSystemSettingsMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    BulkUpsertSystemSettingsMutation,
    TError,
    BulkUpsertSystemSettingsMutationVariables,
    TContext
  >({
    mutationKey: ['BulkUpsertSystemSettings'],
    mutationFn: (variables?: BulkUpsertSystemSettingsMutationVariables) =>
      fetcher<BulkUpsertSystemSettingsMutation, BulkUpsertSystemSettingsMutationVariables>(
        BulkUpsertSystemSettingsDocument,
        variables,
      )(),
    ...options,
  });
};

useBulkUpsertSystemSettingsMutation.fetcher = (
  variables: BulkUpsertSystemSettingsMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<BulkUpsertSystemSettingsMutation, BulkUpsertSystemSettingsMutationVariables>(
    BulkUpsertSystemSettingsDocument,
    variables,
    options,
  );

export const UpdateMyPreferencesDocument = `
    mutation UpdateMyPreferences($input: UpdateUserPreferencesInput!) {
  updateMyPreferences(input: $input) {
    ...UserPreferencesFragment
  }
}
    ${UserPreferencesFragmentFragmentDoc}`;

export const useUpdateMyPreferencesMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    UpdateMyPreferencesMutation,
    TError,
    UpdateMyPreferencesMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    UpdateMyPreferencesMutation,
    TError,
    UpdateMyPreferencesMutationVariables,
    TContext
  >({
    mutationKey: ['UpdateMyPreferences'],
    mutationFn: (variables?: UpdateMyPreferencesMutationVariables) =>
      fetcher<UpdateMyPreferencesMutation, UpdateMyPreferencesMutationVariables>(
        UpdateMyPreferencesDocument,
        variables,
      )(),
    ...options,
  });
};

useUpdateMyPreferencesMutation.fetcher = (
  variables: UpdateMyPreferencesMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<UpdateMyPreferencesMutation, UpdateMyPreferencesMutationVariables>(
    UpdateMyPreferencesDocument,
    variables,
    options,
  );

export const ResetMyPreferencesDocument = `
    mutation ResetMyPreferences {
  resetMyPreferences {
    ...UserPreferencesFragment
  }
}
    ${UserPreferencesFragmentFragmentDoc}`;

export const useResetMyPreferencesMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    ResetMyPreferencesMutation,
    TError,
    ResetMyPreferencesMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    ResetMyPreferencesMutation,
    TError,
    ResetMyPreferencesMutationVariables,
    TContext
  >({
    mutationKey: ['ResetMyPreferences'],
    mutationFn: (variables?: ResetMyPreferencesMutationVariables) =>
      fetcher<ResetMyPreferencesMutation, ResetMyPreferencesMutationVariables>(
        ResetMyPreferencesDocument,
        variables,
      )(),
    ...options,
  });
};

useResetMyPreferencesMutation.fetcher = (
  variables?: ResetMyPreferencesMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<ResetMyPreferencesMutation, ResetMyPreferencesMutationVariables>(
    ResetMyPreferencesDocument,
    variables,
    options,
  );

export const UpdateOneUserPreferenceDocument = `
    mutation UpdateOneUserPreference($input: UpdateOneUserPreferencesInput!) {
  updateOneUserPreference(input: $input) {
    ...UserPreferencesFragment
  }
}
    ${UserPreferencesFragmentFragmentDoc}`;

export const useUpdateOneUserPreferenceMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    UpdateOneUserPreferenceMutation,
    TError,
    UpdateOneUserPreferenceMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    UpdateOneUserPreferenceMutation,
    TError,
    UpdateOneUserPreferenceMutationVariables,
    TContext
  >({
    mutationKey: ['UpdateOneUserPreference'],
    mutationFn: (variables?: UpdateOneUserPreferenceMutationVariables) =>
      fetcher<UpdateOneUserPreferenceMutation, UpdateOneUserPreferenceMutationVariables>(
        UpdateOneUserPreferenceDocument,
        variables,
      )(),
    ...options,
  });
};

useUpdateOneUserPreferenceMutation.fetcher = (
  variables: UpdateOneUserPreferenceMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<UpdateOneUserPreferenceMutation, UpdateOneUserPreferenceMutationVariables>(
    UpdateOneUserPreferenceDocument,
    variables,
    options,
  );

export const CreateOneUserPreferenceDocument = `
    mutation CreateOneUserPreference($input: CreateOneUserPreferencesInput!) {
  createOneUserPreference(input: $input) {
    ...UserPreferencesFragment
  }
}
    ${UserPreferencesFragmentFragmentDoc}`;

export const useCreateOneUserPreferenceMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CreateOneUserPreferenceMutation,
    TError,
    CreateOneUserPreferenceMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CreateOneUserPreferenceMutation,
    TError,
    CreateOneUserPreferenceMutationVariables,
    TContext
  >({
    mutationKey: ['CreateOneUserPreference'],
    mutationFn: (variables?: CreateOneUserPreferenceMutationVariables) =>
      fetcher<CreateOneUserPreferenceMutation, CreateOneUserPreferenceMutationVariables>(
        CreateOneUserPreferenceDocument,
        variables,
      )(),
    ...options,
  });
};

useCreateOneUserPreferenceMutation.fetcher = (
  variables: CreateOneUserPreferenceMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<CreateOneUserPreferenceMutation, CreateOneUserPreferenceMutationVariables>(
    CreateOneUserPreferenceDocument,
    variables,
    options,
  );

export const DeleteOneUserPreferenceDocument = `
    mutation DeleteOneUserPreference($input: DeleteOneUserPreferencesInput!) {
  deleteOneUserPreference(input: $input) {
    id
  }
}
    `;

export const useDeleteOneUserPreferenceMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    DeleteOneUserPreferenceMutation,
    TError,
    DeleteOneUserPreferenceMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    DeleteOneUserPreferenceMutation,
    TError,
    DeleteOneUserPreferenceMutationVariables,
    TContext
  >({
    mutationKey: ['DeleteOneUserPreference'],
    mutationFn: (variables?: DeleteOneUserPreferenceMutationVariables) =>
      fetcher<DeleteOneUserPreferenceMutation, DeleteOneUserPreferenceMutationVariables>(
        DeleteOneUserPreferenceDocument,
        variables,
      )(),
    ...options,
  });
};

useDeleteOneUserPreferenceMutation.fetcher = (
  variables: DeleteOneUserPreferenceMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<DeleteOneUserPreferenceMutation, DeleteOneUserPreferenceMutationVariables>(
    DeleteOneUserPreferenceDocument,
    variables,
    options,
  );

export const GetRecentNotificationsDocument = `
    query GetRecentNotifications($userId: String!, $limit: Int) {
  recentNotifications(userId: $userId, limit: $limit) {
    ...NotificationFragment
  }
}
    ${NotificationFragmentFragmentDoc}`;

export const useGetRecentNotificationsQuery = <
  TData = GetRecentNotificationsQuery,
  TError = unknown,
>(
  variables: GetRecentNotificationsQueryVariables,
  options?: Omit<UseQueryOptions<GetRecentNotificationsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetRecentNotificationsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetRecentNotificationsQuery, TError, TData>({
    queryKey: ['GetRecentNotifications', variables],
    queryFn: fetcher<GetRecentNotificationsQuery, GetRecentNotificationsQueryVariables>(
      GetRecentNotificationsDocument,
      variables,
    ),
    ...options,
  });
};

useGetRecentNotificationsQuery.fetcher = (
  variables: GetRecentNotificationsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetRecentNotificationsQuery, GetRecentNotificationsQueryVariables>(
    GetRecentNotificationsDocument,
    variables,
    options,
  );

export const GetUnreadNotificationCountDocument = `
    query GetUnreadNotificationCount($userId: String!) {
  unreadNotificationCount(userId: $userId)
}
    `;

export const useGetUnreadNotificationCountQuery = <
  TData = GetUnreadNotificationCountQuery,
  TError = unknown,
>(
  variables: GetUnreadNotificationCountQueryVariables,
  options?: Omit<UseQueryOptions<GetUnreadNotificationCountQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetUnreadNotificationCountQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetUnreadNotificationCountQuery, TError, TData>({
    queryKey: ['GetUnreadNotificationCount', variables],
    queryFn: fetcher<GetUnreadNotificationCountQuery, GetUnreadNotificationCountQueryVariables>(
      GetUnreadNotificationCountDocument,
      variables,
    ),
    ...options,
  });
};

useGetUnreadNotificationCountQuery.fetcher = (
  variables: GetUnreadNotificationCountQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetUnreadNotificationCountQuery, GetUnreadNotificationCountQueryVariables>(
    GetUnreadNotificationCountDocument,
    variables,
    options,
  );

export const InAppNotificationCreatedDocument = `
    subscription InAppNotificationCreated($userId: String) {
  inAppNotificationCreated(userId: $userId) {
    notificationId
    userId
    type
    message
    actionLink
    actionLabel
    metadata
    createdAt
  }
}
    `;
export const GetCurrentUserDocument = `
    query GetCurrentUser {
  me {
    id
    email
    username
    firstName
    lastName
    isActive
    disclaimerAccepted
    disclaimerAcceptedAt
    role
  }
}
    `;

export const useGetCurrentUserQuery = <TData = GetCurrentUserQuery, TError = unknown>(
  variables?: GetCurrentUserQueryVariables,
  options?: Omit<UseQueryOptions<GetCurrentUserQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetCurrentUserQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetCurrentUserQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetCurrentUser'] : ['GetCurrentUser', variables],
    queryFn: fetcher<GetCurrentUserQuery, GetCurrentUserQueryVariables>(
      GetCurrentUserDocument,
      variables,
    ),
    ...options,
  });
};

useGetCurrentUserQuery.fetcher = (
  variables?: GetCurrentUserQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetCurrentUserQuery, GetCurrentUserQueryVariables>(
    GetCurrentUserDocument,
    variables,
    options,
  );

export const GetAnalyticsDashboardDocument = `
    query GetAnalyticsDashboard($input: DashboardAnalyticsInput) {
  analyticsDashboard(input: $input) {
    userGrowth {
      ...UserGrowthMetricsFragment
    }
    documents {
      ...DocumentMetricsFragment
    }
    documentTypeDistribution {
      ...DocumentTypeDistributionFragment
    }
    queries {
      ...QueryMetricsFragment
    }
    aiUsage {
      ...AiUsageMetricsFragment
    }
    aiOperationBreakdown {
      ...AiOperationBreakdownFragment
    }
    systemHealth {
      ...SystemHealthMetricsFragment
    }
    generatedAt
  }
}
    ${UserGrowthMetricsFragmentFragmentDoc}
${DocumentMetricsFragmentFragmentDoc}
${DocumentTypeDistributionFragmentFragmentDoc}
${QueryMetricsFragmentFragmentDoc}
${AiUsageMetricsFragmentFragmentDoc}
${AiOperationBreakdownFragmentFragmentDoc}
${SystemHealthMetricsFragmentFragmentDoc}`;

export const useGetAnalyticsDashboardQuery = <TData = GetAnalyticsDashboardQuery, TError = unknown>(
  variables?: GetAnalyticsDashboardQueryVariables,
  options?: Omit<UseQueryOptions<GetAnalyticsDashboardQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetAnalyticsDashboardQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetAnalyticsDashboardQuery, TError, TData>({
    queryKey:
      variables === undefined ? ['GetAnalyticsDashboard'] : ['GetAnalyticsDashboard', variables],
    queryFn: fetcher<GetAnalyticsDashboardQuery, GetAnalyticsDashboardQueryVariables>(
      GetAnalyticsDashboardDocument,
      variables,
    ),
    ...options,
  });
};

useGetAnalyticsDashboardQuery.fetcher = (
  variables?: GetAnalyticsDashboardQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetAnalyticsDashboardQuery, GetAnalyticsDashboardQueryVariables>(
    GetAnalyticsDashboardDocument,
    variables,
    options,
  );

export const GetUserGrowthMetricsDocument = `
    query GetUserGrowthMetrics($input: DashboardAnalyticsInput) {
  userGrowthMetrics(input: $input) {
    ...UserGrowthMetricsFragment
  }
}
    ${UserGrowthMetricsFragmentFragmentDoc}`;

export const useGetUserGrowthMetricsQuery = <TData = GetUserGrowthMetricsQuery, TError = unknown>(
  variables?: GetUserGrowthMetricsQueryVariables,
  options?: Omit<UseQueryOptions<GetUserGrowthMetricsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetUserGrowthMetricsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetUserGrowthMetricsQuery, TError, TData>({
    queryKey:
      variables === undefined ? ['GetUserGrowthMetrics'] : ['GetUserGrowthMetrics', variables],
    queryFn: fetcher<GetUserGrowthMetricsQuery, GetUserGrowthMetricsQueryVariables>(
      GetUserGrowthMetricsDocument,
      variables,
    ),
    ...options,
  });
};

useGetUserGrowthMetricsQuery.fetcher = (
  variables?: GetUserGrowthMetricsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetUserGrowthMetricsQuery, GetUserGrowthMetricsQueryVariables>(
    GetUserGrowthMetricsDocument,
    variables,
    options,
  );

export const GetDocumentMetricsDocument = `
    query GetDocumentMetrics($input: DashboardAnalyticsInput) {
  documentMetrics(input: $input) {
    ...DocumentMetricsFragment
  }
}
    ${DocumentMetricsFragmentFragmentDoc}`;

export const useGetDocumentMetricsQuery = <TData = GetDocumentMetricsQuery, TError = unknown>(
  variables?: GetDocumentMetricsQueryVariables,
  options?: Omit<UseQueryOptions<GetDocumentMetricsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetDocumentMetricsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetDocumentMetricsQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetDocumentMetrics'] : ['GetDocumentMetrics', variables],
    queryFn: fetcher<GetDocumentMetricsQuery, GetDocumentMetricsQueryVariables>(
      GetDocumentMetricsDocument,
      variables,
    ),
    ...options,
  });
};

useGetDocumentMetricsQuery.fetcher = (
  variables?: GetDocumentMetricsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetDocumentMetricsQuery, GetDocumentMetricsQueryVariables>(
    GetDocumentMetricsDocument,
    variables,
    options,
  );

export const GetQueryMetricsDocument = `
    query GetQueryMetrics($input: DashboardAnalyticsInput) {
  queryMetrics(input: $input) {
    ...QueryMetricsFragment
  }
}
    ${QueryMetricsFragmentFragmentDoc}`;

export const useGetQueryMetricsQuery = <TData = GetQueryMetricsQuery, TError = unknown>(
  variables?: GetQueryMetricsQueryVariables,
  options?: Omit<UseQueryOptions<GetQueryMetricsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetQueryMetricsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetQueryMetricsQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetQueryMetrics'] : ['GetQueryMetrics', variables],
    queryFn: fetcher<GetQueryMetricsQuery, GetQueryMetricsQueryVariables>(
      GetQueryMetricsDocument,
      variables,
    ),
    ...options,
  });
};

useGetQueryMetricsQuery.fetcher = (
  variables?: GetQueryMetricsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetQueryMetricsQuery, GetQueryMetricsQueryVariables>(
    GetQueryMetricsDocument,
    variables,
    options,
  );

export const GetAiUsageMetricsDocument = `
    query GetAiUsageMetrics($input: DashboardAnalyticsInput) {
  aiUsageMetrics(input: $input) {
    ...AiUsageMetricsFragment
  }
}
    ${AiUsageMetricsFragmentFragmentDoc}`;

export const useGetAiUsageMetricsQuery = <TData = GetAiUsageMetricsQuery, TError = unknown>(
  variables?: GetAiUsageMetricsQueryVariables,
  options?: Omit<UseQueryOptions<GetAiUsageMetricsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetAiUsageMetricsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetAiUsageMetricsQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetAiUsageMetrics'] : ['GetAiUsageMetrics', variables],
    queryFn: fetcher<GetAiUsageMetricsQuery, GetAiUsageMetricsQueryVariables>(
      GetAiUsageMetricsDocument,
      variables,
    ),
    ...options,
  });
};

useGetAiUsageMetricsQuery.fetcher = (
  variables?: GetAiUsageMetricsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetAiUsageMetricsQuery, GetAiUsageMetricsQueryVariables>(
    GetAiUsageMetricsDocument,
    variables,
    options,
  );

export const GetSystemHealthMetricsDocument = `
    query GetSystemHealthMetrics($input: DashboardAnalyticsInput) {
  systemHealthMetrics(input: $input) {
    ...SystemHealthMetricsFragment
  }
}
    ${SystemHealthMetricsFragmentFragmentDoc}`;

export const useGetSystemHealthMetricsQuery = <
  TData = GetSystemHealthMetricsQuery,
  TError = unknown,
>(
  variables?: GetSystemHealthMetricsQueryVariables,
  options?: Omit<UseQueryOptions<GetSystemHealthMetricsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetSystemHealthMetricsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetSystemHealthMetricsQuery, TError, TData>({
    queryKey:
      variables === undefined ? ['GetSystemHealthMetrics'] : ['GetSystemHealthMetrics', variables],
    queryFn: fetcher<GetSystemHealthMetricsQuery, GetSystemHealthMetricsQueryVariables>(
      GetSystemHealthMetricsDocument,
      variables,
    ),
    ...options,
  });
};

useGetSystemHealthMetricsQuery.fetcher = (
  variables?: GetSystemHealthMetricsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetSystemHealthMetricsQuery, GetSystemHealthMetricsQueryVariables>(
    GetSystemHealthMetricsDocument,
    variables,
    options,
  );

export const MeDocument = `
    query Me {
  me {
    ...AuthUserFragment
  }
}
    ${AuthUserFragmentFragmentDoc}`;

export const useMeQuery = <TData = MeQuery, TError = unknown>(
  variables?: MeQueryVariables,
  options?: Omit<UseQueryOptions<MeQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<MeQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<MeQuery, TError, TData>({
    queryKey: variables === undefined ? ['Me'] : ['Me', variables],
    queryFn: fetcher<MeQuery, MeQueryVariables>(MeDocument, variables),
    ...options,
  });
};

useMeQuery.fetcher = (variables?: MeQueryVariables, options?: RequestInit['headers']) =>
  fetcher<MeQuery, MeQueryVariables>(MeDocument, variables, options);

export const GetSystemSettingsDocument = `
    query GetSystemSettings {
  systemSettings {
    ...SystemSettingFragment
  }
}
    ${SystemSettingFragmentFragmentDoc}`;

export const useGetSystemSettingsQuery = <TData = GetSystemSettingsQuery, TError = unknown>(
  variables?: GetSystemSettingsQueryVariables,
  options?: Omit<UseQueryOptions<GetSystemSettingsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetSystemSettingsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetSystemSettingsQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetSystemSettings'] : ['GetSystemSettings', variables],
    queryFn: fetcher<GetSystemSettingsQuery, GetSystemSettingsQueryVariables>(
      GetSystemSettingsDocument,
      variables,
    ),
    ...options,
  });
};

useGetSystemSettingsQuery.fetcher = (
  variables?: GetSystemSettingsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetSystemSettingsQuery, GetSystemSettingsQueryVariables>(
    GetSystemSettingsDocument,
    variables,
    options,
  );

export const GetSystemSettingsByCategoryDocument = `
    query GetSystemSettingsByCategory($category: SettingCategory!) {
  systemSettingsByCategory(category: $category) {
    ...SystemSettingFragment
  }
}
    ${SystemSettingFragmentFragmentDoc}`;

export const useGetSystemSettingsByCategoryQuery = <
  TData = GetSystemSettingsByCategoryQuery,
  TError = unknown,
>(
  variables: GetSystemSettingsByCategoryQueryVariables,
  options?: Omit<UseQueryOptions<GetSystemSettingsByCategoryQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetSystemSettingsByCategoryQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetSystemSettingsByCategoryQuery, TError, TData>({
    queryKey: ['GetSystemSettingsByCategory', variables],
    queryFn: fetcher<GetSystemSettingsByCategoryQuery, GetSystemSettingsByCategoryQueryVariables>(
      GetSystemSettingsByCategoryDocument,
      variables,
    ),
    ...options,
  });
};

useGetSystemSettingsByCategoryQuery.fetcher = (
  variables: GetSystemSettingsByCategoryQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetSystemSettingsByCategoryQuery, GetSystemSettingsByCategoryQueryVariables>(
    GetSystemSettingsByCategoryDocument,
    variables,
    options,
  );

export const GetSystemSettingDocument = `
    query GetSystemSetting($key: String!) {
  systemSetting(key: $key) {
    ...SystemSettingFragment
  }
}
    ${SystemSettingFragmentFragmentDoc}`;

export const useGetSystemSettingQuery = <TData = GetSystemSettingQuery, TError = unknown>(
  variables: GetSystemSettingQueryVariables,
  options?: Omit<UseQueryOptions<GetSystemSettingQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetSystemSettingQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetSystemSettingQuery, TError, TData>({
    queryKey: ['GetSystemSetting', variables],
    queryFn: fetcher<GetSystemSettingQuery, GetSystemSettingQueryVariables>(
      GetSystemSettingDocument,
      variables,
    ),
    ...options,
  });
};

useGetSystemSettingQuery.fetcher = (
  variables: GetSystemSettingQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetSystemSettingQuery, GetSystemSettingQueryVariables>(
    GetSystemSettingDocument,
    variables,
    options,
  );

export const GetMyPreferencesDocument = `
    query GetMyPreferences {
  myPreferences {
    ...UserPreferencesFragment
  }
}
    ${UserPreferencesFragmentFragmentDoc}`;

export const useGetMyPreferencesQuery = <TData = GetMyPreferencesQuery, TError = unknown>(
  variables?: GetMyPreferencesQueryVariables,
  options?: Omit<UseQueryOptions<GetMyPreferencesQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetMyPreferencesQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetMyPreferencesQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetMyPreferences'] : ['GetMyPreferences', variables],
    queryFn: fetcher<GetMyPreferencesQuery, GetMyPreferencesQueryVariables>(
      GetMyPreferencesDocument,
      variables,
    ),
    ...options,
  });
};

useGetMyPreferencesQuery.fetcher = (
  variables?: GetMyPreferencesQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetMyPreferencesQuery, GetMyPreferencesQueryVariables>(
    GetMyPreferencesDocument,
    variables,
    options,
  );

export const AggregatedSearchLegalRulingsDocument = `
    query AggregatedSearchLegalRulings($input: AggregatedSearchLegalRulingsInput!) {
  aggregatedSearchLegalRulings(input: $input) {
    count
    hasMore
    offset
    totalCount
    results {
      ...AggregatedRulingSearchResultFragment
    }
  }
}
    ${AggregatedRulingSearchResultFragmentFragmentDoc}`;

export const useAggregatedSearchLegalRulingsQuery = <
  TData = AggregatedSearchLegalRulingsQuery,
  TError = unknown,
>(
  variables: AggregatedSearchLegalRulingsQueryVariables,
  options?: Omit<UseQueryOptions<AggregatedSearchLegalRulingsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<AggregatedSearchLegalRulingsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<AggregatedSearchLegalRulingsQuery, TError, TData>({
    queryKey: ['AggregatedSearchLegalRulings', variables],
    queryFn: fetcher<AggregatedSearchLegalRulingsQuery, AggregatedSearchLegalRulingsQueryVariables>(
      AggregatedSearchLegalRulingsDocument,
      variables,
    ),
    ...options,
  });
};

useAggregatedSearchLegalRulingsQuery.fetcher = (
  variables: AggregatedSearchLegalRulingsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AggregatedSearchLegalRulingsQuery, AggregatedSearchLegalRulingsQueryVariables>(
    AggregatedSearchLegalRulingsDocument,
    variables,
    options,
  );

export const AdvancedSearchLegalRulingsDocument = `
    query AdvancedSearchLegalRulings($input: AdvancedSearchLegalRulingsInput!) {
  advancedSearchLegalRulings(input: $input) {
    count
    hasMore
    offset
    totalCount
    queryExplanation
    results {
      ...AdvancedRulingSearchResultFragment
    }
  }
}
    ${AdvancedRulingSearchResultFragmentFragmentDoc}`;

export const useAdvancedSearchLegalRulingsQuery = <
  TData = AdvancedSearchLegalRulingsQuery,
  TError = unknown,
>(
  variables: AdvancedSearchLegalRulingsQueryVariables,
  options?: Omit<UseQueryOptions<AdvancedSearchLegalRulingsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<AdvancedSearchLegalRulingsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<AdvancedSearchLegalRulingsQuery, TError, TData>({
    queryKey: ['AdvancedSearchLegalRulings', variables],
    queryFn: fetcher<AdvancedSearchLegalRulingsQuery, AdvancedSearchLegalRulingsQueryVariables>(
      AdvancedSearchLegalRulingsDocument,
      variables,
    ),
    ...options,
  });
};

useAdvancedSearchLegalRulingsQuery.fetcher = (
  variables: AdvancedSearchLegalRulingsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AdvancedSearchLegalRulingsQuery, AdvancedSearchLegalRulingsQueryVariables>(
    AdvancedSearchLegalRulingsDocument,
    variables,
    options,
  );

export const SearchLegalRulingsDocument = `
    query SearchLegalRulings($input: SearchLegalRulingsInput!) {
  searchLegalRulings(input: $input) {
    results {
      ...SimpleRulingSearchResultFragment
    }
  }
}
    ${SimpleRulingSearchResultFragmentFragmentDoc}`;

export const useSearchLegalRulingsQuery = <TData = SearchLegalRulingsQuery, TError = unknown>(
  variables: SearchLegalRulingsQueryVariables,
  options?: Omit<UseQueryOptions<SearchLegalRulingsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<SearchLegalRulingsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<SearchLegalRulingsQuery, TError, TData>({
    queryKey: ['SearchLegalRulings', variables],
    queryFn: fetcher<SearchLegalRulingsQuery, SearchLegalRulingsQueryVariables>(
      SearchLegalRulingsDocument,
      variables,
    ),
    ...options,
  });
};

useSearchLegalRulingsQuery.fetcher = (
  variables: SearchLegalRulingsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<SearchLegalRulingsQuery, SearchLegalRulingsQueryVariables>(
    SearchLegalRulingsDocument,
    variables,
    options,
  );

export const SearchDocumentsDocument = `
    query SearchDocuments($filter: LegalDocumentFilter!) {
  legalDocuments(filter: $filter, paging: {first: 3}) {
    edges {
      node {
        id
        title
        type
      }
    }
  }
}
    `;

export const useSearchDocumentsQuery = <TData = SearchDocumentsQuery, TError = unknown>(
  variables: SearchDocumentsQueryVariables,
  options?: Omit<UseQueryOptions<SearchDocumentsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<SearchDocumentsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<SearchDocumentsQuery, TError, TData>({
    queryKey: ['SearchDocuments', variables],
    queryFn: fetcher<SearchDocumentsQuery, SearchDocumentsQueryVariables>(
      SearchDocumentsDocument,
      variables,
    ),
    ...options,
  });
};

useSearchDocumentsQuery.fetcher = (
  variables: SearchDocumentsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<SearchDocumentsQuery, SearchDocumentsQueryVariables>(
    SearchDocumentsDocument,
    variables,
    options,
  );

export const GetUsersDocument = `
    query GetUsers($filter: UserFilter, $paging: CursorPaging, $sorting: [UserSort!]) {
  users(filter: $filter, paging: $paging, sorting: $sorting) {
    totalCount
    edges {
      node {
        ...UserDetailFragment
      }
    }
    pageInfo {
      ...PageInfoFragment
    }
  }
}
    ${UserDetailFragmentFragmentDoc}
${PageInfoFragmentFragmentDoc}`;

export const useGetUsersQuery = <TData = GetUsersQuery, TError = unknown>(
  variables?: GetUsersQueryVariables,
  options?: Omit<UseQueryOptions<GetUsersQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetUsersQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetUsersQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetUsers'] : ['GetUsers', variables],
    queryFn: fetcher<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, variables),
    ...options,
  });
};

useGetUsersQuery.fetcher = (variables?: GetUsersQueryVariables, options?: RequestInit['headers']) =>
  fetcher<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, variables, options);

export const GetUserDocument = `
    query GetUser($id: ID!) {
  user(id: $id) {
    ...UserDetailFragment
  }
}
    ${UserDetailFragmentFragmentDoc}`;

export const useGetUserQuery = <TData = GetUserQuery, TError = unknown>(
  variables: GetUserQueryVariables,
  options?: Omit<UseQueryOptions<GetUserQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetUserQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetUserQuery, TError, TData>({
    queryKey: ['GetUser', variables],
    queryFn: fetcher<GetUserQuery, GetUserQueryVariables>(GetUserDocument, variables),
    ...options,
  });
};

useGetUserQuery.fetcher = (variables: GetUserQueryVariables, options?: RequestInit['headers']) =>
  fetcher<GetUserQuery, GetUserQueryVariables>(GetUserDocument, variables, options);

export const CreateOneUserDocument = `
    mutation CreateOneUser($input: CreateOneUserInput!) {
  createOneUser(input: $input) {
    ...UserDetailFragment
  }
}
    ${UserDetailFragmentFragmentDoc}`;

export const useCreateOneUserMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CreateOneUserMutation,
    TError,
    CreateOneUserMutationVariables,
    TContext
  >,
) => {
  return useMutation<CreateOneUserMutation, TError, CreateOneUserMutationVariables, TContext>({
    mutationKey: ['CreateOneUser'],
    mutationFn: (variables?: CreateOneUserMutationVariables) =>
      fetcher<CreateOneUserMutation, CreateOneUserMutationVariables>(
        CreateOneUserDocument,
        variables,
      )(),
    ...options,
  });
};

useCreateOneUserMutation.fetcher = (
  variables: CreateOneUserMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<CreateOneUserMutation, CreateOneUserMutationVariables>(
    CreateOneUserDocument,
    variables,
    options,
  );

export const UpdateOneUserDocument = `
    mutation UpdateOneUser($input: UpdateOneUserInput!) {
  updateOneUser(input: $input) {
    ...UserDetailFragment
  }
}
    ${UserDetailFragmentFragmentDoc}`;

export const useUpdateOneUserMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    UpdateOneUserMutation,
    TError,
    UpdateOneUserMutationVariables,
    TContext
  >,
) => {
  return useMutation<UpdateOneUserMutation, TError, UpdateOneUserMutationVariables, TContext>({
    mutationKey: ['UpdateOneUser'],
    mutationFn: (variables?: UpdateOneUserMutationVariables) =>
      fetcher<UpdateOneUserMutation, UpdateOneUserMutationVariables>(
        UpdateOneUserDocument,
        variables,
      )(),
    ...options,
  });
};

useUpdateOneUserMutation.fetcher = (
  variables: UpdateOneUserMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<UpdateOneUserMutation, UpdateOneUserMutationVariables>(
    UpdateOneUserDocument,
    variables,
    options,
  );

export const DeleteOneUserDocument = `
    mutation DeleteOneUser($input: DeleteOneUserInput!) {
  deleteOneUser(input: $input) {
    id
    email
  }
}
    `;

export const useDeleteOneUserMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    DeleteOneUserMutation,
    TError,
    DeleteOneUserMutationVariables,
    TContext
  >,
) => {
  return useMutation<DeleteOneUserMutation, TError, DeleteOneUserMutationVariables, TContext>({
    mutationKey: ['DeleteOneUser'],
    mutationFn: (variables?: DeleteOneUserMutationVariables) =>
      fetcher<DeleteOneUserMutation, DeleteOneUserMutationVariables>(
        DeleteOneUserDocument,
        variables,
      )(),
    ...options,
  });
};

useDeleteOneUserMutation.fetcher = (
  variables: DeleteOneUserMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<DeleteOneUserMutation, DeleteOneUserMutationVariables>(
    DeleteOneUserDocument,
    variables,
    options,
  );
