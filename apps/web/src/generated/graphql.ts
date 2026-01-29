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

export type AiEngineMessageFormat = {
  __typename?: 'AIEngineMessageFormat';
  /** Message content */
  content: Scalars['String']['output'];
  /** Message role (user or assistant) */
  role: Scalars['String']['output'];
};

export type ActivateUserInput = {
  userId: Scalars['ID']['input'];
};

export type ActiveUsersCount = {
  __typename?: 'ActiveUsersCount';
  calculatedAt: Scalars['DateTime']['output'];
  /** Users active in last 7 days */
  last7Days: Scalars['Int']['output'];
  /** Users active in last 24 hours */
  last24Hours: Scalars['Int']['output'];
  /** Users active in last 30 days */
  last30Days: Scalars['Int']['output'];
};

export type AddPermissionInput = {
  permission: Scalars['String']['input'];
  roleId: Scalars['String']['input'];
};

export type AdminCreateUserInput = {
  email: Scalars['String']['input'];
  firstName?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  role?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type AdminForceDisableTwoFactorInput = {
  /** The ID of the user to disable 2FA for */
  userId: Scalars['String']['input'];
};

export type AdminForceDisableTwoFactorResponse = {
  __typename?: 'AdminForceDisableTwoFactorResponse';
  /** The user ID */
  id: Scalars['String']['output'];
  /** The updated 2FA status (should be false) */
  twoFactorEnabled: Scalars['Boolean']['output'];
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

export type AffectedUserInfo = {
  __typename?: 'AffectedUserInfo';
  /** Number of affected sessions */
  affectedSessionCount: Scalars['Int']['output'];
  /** User email (if available) */
  email?: Maybe<Scalars['String']['output']>;
  /** Number of empty messages for this user */
  emptyMessageCount: Scalars['Int']['output'];
  /** List of affected session IDs */
  sessionIds: Array<Scalars['String']['output']>;
  /** The user ID */
  userId: Scalars['ID']['output'];
};

export type AffectedUsersReport = {
  __typename?: 'AffectedUsersReport';
  /** Total number of affected users */
  totalAffectedUsers: Scalars['Int']['output'];
  /** Total number of empty messages across all users */
  totalEmptyMessages: Scalars['Int']['output'];
  /** List of affected users with details */
  users: Array<AffectedUserInfo>;
};

export type AgentLatencyMetrics = {
  __typename?: 'AgentLatencyMetrics';
  /** Agent type */
  agentType: AgentType;
  /** Average latency in milliseconds */
  avgLatency: Scalars['Float']['output'];
  /** Maximum latency in milliseconds */
  maxLatency: Scalars['Float']['output'];
  /** Median latency in milliseconds */
  medianLatency: Scalars['Float']['output'];
  /** Minimum latency in milliseconds */
  minLatency: Scalars['Float']['output'];
  /** P95 latency in milliseconds */
  p95Latency: Scalars['Int']['output'];
  /** Total request count */
  requestCount: Scalars['Int']['output'];
};

/** Type of AI agent or workflow */
export type AgentType =
  | 'CLARIFICATION_AGENT'
  | 'CLASSIFIER_AGENT'
  | 'DRAFTING_AGENT'
  | 'QA_AGENT'
  | 'UNKNOWN'
  | 'WORKFLOW';

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

export type AnalyticsTimeSeriesPoint = {
  __typename?: 'AnalyticsTimeSeriesPoint';
  count: Scalars['Int']['output'];
  timestamp: Scalars['DateTime']['output'];
  value?: Maybe<Scalars['Float']['output']>;
};

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
  /** Message type: TEXT (default question), CLARIFICATION_ANSWER (answers to clarification questions) */
  type?: InputMaybe<Scalars['String']['input']>;
};

/** Type of action performed */
export type AuditActionType =
  | 'CREATE'
  | 'DELETE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PAUSE'
  | 'READ'
  | 'RESUME'
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
export type AuditResourceType = 'DOCUMENT' | 'SCHEDULE' | 'SESSION' | 'SYSTEM' | 'USER' | 'WEBHOOK';

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
  /** JWT access token (null if 2FA is required) */
  accessToken?: Maybe<Scalars['String']['output']>;
  /** JWT refresh token for obtaining new access tokens (null if 2FA is required) */
  refreshToken?: Maybe<Scalars['String']['output']>;
  /** True if user needs to provide 2FA token to complete login */
  requiresTwoFactor: Scalars['Boolean']['output'];
  /** Temporary token for completing 2FA (only present when 2FA is required) */
  twoFactorTempToken?: Maybe<Scalars['String']['output']>;
  /** Authenticated user information (null if 2FA is required) */
  user?: Maybe<AuthUser>;
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

export type BooleanFilter = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean operators for combining search terms */
export type BooleanOperator = 'AND' | 'NOT' | 'OR';

/** Budget ranges for implementation */
export type BudgetRange =
  | 'NOT_SPECIFIED'
  | 'OVER_100K'
  | 'RANGE_5K_10K'
  | 'RANGE_10K_25K'
  | 'RANGE_25K_50K'
  | 'RANGE_50K_100K'
  | 'UNDER_5K';

export type BulkActivateUsersInput = {
  userIds: Array<Scalars['ID']['input']>;
};

export type BulkChangeUserRolesInput = {
  role: Scalars['String']['input'];
  userIds: Array<Scalars['ID']['input']>;
};

export type BulkDeleteUsersInput = {
  userIds: Array<Scalars['ID']['input']>;
};

export type BulkDeleteUsersResult = {
  __typename?: 'BulkDeleteUsersResult';
  failed: Array<BulkOperationError>;
  success: Array<Scalars['ID']['output']>;
};

export type BulkOperationError = {
  __typename?: 'BulkOperationError';
  error: Scalars['String']['output'];
  id: Scalars['String']['output'];
};

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

export type BulkSuspendUsersInput = {
  reason: Scalars['String']['input'];
  userIds: Array<Scalars['ID']['input']>;
};

export type BulkUpdateSettingsInput = {
  settings: Array<SystemSettingInput>;
};

export type BulkUsersResult = {
  __typename?: 'BulkUsersResult';
  failed: Array<BulkOperationError>;
  success: Array<User>;
};

export type CancelClarificationSessionInput = {
  /** ID of the clarification session to cancel */
  sessionId: Scalars['String']['input'];
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

export type ChatCitation = {
  __typename?: 'ChatCitation';
  article?: Maybe<Scalars['String']['output']>;
  excerpt?: Maybe<Scalars['String']['output']>;
  source: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type ChatCitationInput = {
  article?: InputMaybe<Scalars['String']['input']>;
  excerpt?: InputMaybe<Scalars['String']['input']>;
  source: Scalars['String']['input'];
  url?: InputMaybe<Scalars['String']['input']>;
};

export type ChatContentSearchResponse = {
  __typename?: 'ChatContentSearchResponse';
  /** Number of results returned */
  count: Scalars['Int']['output'];
  /** Whether there are more results */
  hasMore: Scalars['Boolean']['output'];
  /** Current offset */
  offset: Scalars['Int']['output'];
  /** List of search results */
  results: Array<ChatContentSearchResult>;
  /** Total count of matching messages */
  totalCount: Scalars['Int']['output'];
};

export type ChatContentSearchResult = {
  __typename?: 'ChatContentSearchResult';
  /** Original message content */
  content: Scalars['String']['output'];
  /** Context preview with highlighted match */
  contextPreview?: Maybe<Scalars['String']['output']>;
  /** Message creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Message content with highlighted matching text */
  highlightedContent: Scalars['String']['output'];
  /** List of matched terms */
  matchedTerms: Array<Scalars['String']['output']>;
  /** Message ID */
  messageId: Scalars['ID']['output'];
  /** Relevance ranking score (higher is more relevant) */
  rank: Scalars['Float']['output'];
  /** Role of the message sender */
  role: MessageRole;
  /** Sequence order in the session */
  sequenceOrder: Scalars['Float']['output'];
  /** Session ID */
  sessionId: Scalars['ID']['output'];
  /** Total number of messages in the session */
  sessionMessageCount: Scalars['Int']['output'];
  /** AI mode of the session */
  sessionMode: ChatMode;
  /** Session title */
  sessionTitle?: Maybe<Scalars['String']['output']>;
};

/** Export format for chat sessions */
export type ChatExportFormat = 'JSON' | 'MARKDOWN' | 'PDF';

export type ChatExportResult = {
  __typename?: 'ChatExportResult';
  /** Base64-encoded content of the export */
  contentBase64: Scalars['String']['output'];
  /** Timestamp when the export was generated */
  exportedAt: Scalars['DateTime']['output'];
  /** Size of the export in bytes */
  fileSizeBytes: Scalars['Float']['output'];
  /** Filename for the export */
  filename: Scalars['String']['output'];
  /** Format of the export */
  format: ChatExportFormat;
  /** MIME type of the export */
  mimeType: Scalars['String']['output'];
  /** Session ID that was exported */
  sessionId: Scalars['ID']['output'];
};

export type ChatMessage = {
  __typename?: 'ChatMessage';
  /** Legal citations/references in assistant responses */
  citations?: Maybe<Array<ChatCitation>>;
  /** Message content (markdown for assistant responses) */
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  messageId: Scalars['ID']['output'];
  /** Additional message metadata */
  metadata?: Maybe<ChatMessageMetadata>;
  /** Original content before AI processing */
  rawContent?: Maybe<Scalars['String']['output']>;
  /** Role of the message sender */
  role: MessageRole;
  /** Sequence order of the message within the session */
  sequenceOrder: Scalars['Float']['output'];
  /** ID of the chat session this message belongs to */
  sessionId: Scalars['ID']['output'];
  /** Type of message content */
  type?: Maybe<ChatMessageType>;
};

export type ChatMessageInterface = {
  /** Message content */
  content: Scalars['String']['output'];
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Unique message identifier */
  messageId: Scalars['ID']['output'];
  /** Role of the message sender */
  role: MessageRole;
  /** Sequence order in conversation */
  sequenceOrder: Scalars['Float']['output'];
  /** Session ID */
  sessionId: Scalars['ID']['output'];
  /** Message type discriminator for resolving concrete types */
  type?: Maybe<ChatMessageType>;
};

export type ChatMessageMetadata = {
  __typename?: 'ChatMessageMetadata';
  clarification?: Maybe<ClarificationInfoType>;
  confidence?: Maybe<Scalars['Float']['output']>;
  keyTerms?: Maybe<Array<Scalars['String']['output']>>;
  language?: Maybe<Scalars['String']['output']>;
  model?: Maybe<Scalars['String']['output']>;
  queryType?: Maybe<Scalars['String']['output']>;
};

export type ChatMessageMetadataInput = {
  /** Clarification data for messages that need clarification */
  clarification?: InputMaybe<ClarificationInfoInput>;
  /** Confidence score of AI response (0-1) */
  confidence?: InputMaybe<Scalars['Float']['input']>;
  /** Key legal terms extracted */
  keyTerms?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Language detected */
  language?: InputMaybe<Scalars['String']['input']>;
  /** Model used for generation (e.g., gpt-4o) */
  model?: InputMaybe<Scalars['String']['input']>;
  /** Query type classification */
  queryType?: InputMaybe<Scalars['String']['input']>;
};

/** The type of message content */
export type ChatMessageType =
  | 'CITATION'
  | 'CLARIFICATION_ANSWER'
  | 'CLARIFICATION_QUESTION'
  | 'ERROR'
  | 'TEXT';

/** The AI response mode for chat messages */
export type ChatMode = 'LAWYER' | 'SIMPLE';

export type ChatModeFilterComparison = {
  eq?: InputMaybe<ChatMode>;
  gt?: InputMaybe<ChatMode>;
  gte?: InputMaybe<ChatMode>;
  iLike?: InputMaybe<ChatMode>;
  in?: InputMaybe<Array<ChatMode>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<ChatMode>;
  lt?: InputMaybe<ChatMode>;
  lte?: InputMaybe<ChatMode>;
  neq?: InputMaybe<ChatMode>;
  notILike?: InputMaybe<ChatMode>;
  notIn?: InputMaybe<Array<ChatMode>>;
  notLike?: InputMaybe<ChatMode>;
};

export type ChatSession = {
  __typename?: 'ChatSession';
  createdAt: Scalars['DateTime']['output'];
  /** Soft delete timestamp, null if not deleted */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  /** Whether the session is pinned by the user */
  isPinned: Scalars['Boolean']['output'];
  /** Timestamp of the last message for sorting */
  lastMessageAt?: Maybe<Scalars['DateTime']['output']>;
  /** Number of messages in the session */
  messageCount: Scalars['Float']['output'];
  /** AI response mode for this session */
  mode: ChatMode;
  /** Session title, auto-generated from first message if not provided */
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type ChatSessionAggregateFilter = {
  and?: InputMaybe<Array<ChatSessionAggregateFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  deletedAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  isPinned?: InputMaybe<BooleanFieldComparison>;
  lastMessageAt?: InputMaybe<DateFieldComparison>;
  messageCount?: InputMaybe<NumberFieldComparison>;
  mode?: InputMaybe<ChatModeFilterComparison>;
  or?: InputMaybe<Array<ChatSessionAggregateFilter>>;
  title?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<IdFilterComparison>;
};

export type ChatSessionAggregateGroupBy = {
  __typename?: 'ChatSessionAggregateGroupBy';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isPinned?: Maybe<Scalars['Boolean']['output']>;
  lastMessageAt?: Maybe<Scalars['DateTime']['output']>;
  messageCount?: Maybe<Scalars['Float']['output']>;
  mode?: Maybe<ChatMode>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type ChatSessionAggregateGroupByCreatedAtArgs = {
  by?: GroupBy;
};

export type ChatSessionAggregateGroupByUpdatedAtArgs = {
  by?: GroupBy;
};

export type ChatSessionAggregateResponse = {
  __typename?: 'ChatSessionAggregateResponse';
  avg?: Maybe<ChatSessionAvgAggregate>;
  count?: Maybe<ChatSessionCountAggregate>;
  groupBy?: Maybe<ChatSessionAggregateGroupBy>;
  max?: Maybe<ChatSessionMaxAggregate>;
  min?: Maybe<ChatSessionMinAggregate>;
  sum?: Maybe<ChatSessionSumAggregate>;
};

export type ChatSessionAvgAggregate = {
  __typename?: 'ChatSessionAvgAggregate';
  messageCount?: Maybe<Scalars['Float']['output']>;
};

export type ChatSessionConnection = {
  __typename?: 'ChatSessionConnection';
  /** Array of edges. */
  edges: Array<ChatSessionEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type ChatSessionCountAggregate = {
  __typename?: 'ChatSessionCountAggregate';
  createdAt?: Maybe<Scalars['Int']['output']>;
  deletedAt?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  isPinned?: Maybe<Scalars['Int']['output']>;
  lastMessageAt?: Maybe<Scalars['Int']['output']>;
  messageCount?: Maybe<Scalars['Int']['output']>;
  mode?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
  userId?: Maybe<Scalars['Int']['output']>;
};

export type ChatSessionDebugInfo = {
  __typename?: 'ChatSessionDebugInfo';
  /** Messages in AI Engine format (what gets sent to AI) */
  aiEngineFormat: Array<AiEngineMessageFormat>;
  /** Total number of messages in history */
  messageCount: Scalars['Float']['output'];
  /** Message previews with full details */
  messages: Array<ConversationMessagePreview>;
  /** Role distribution in conversation */
  roleDistribution: ConversationRoleDistribution;
  /** Session ID */
  sessionId: Scalars['String']['output'];
  /** Total characters across all messages */
  totalCharacters: Scalars['Float']['output'];
  /** Verification information */
  verification: ConversationHistoryVerification;
};

export type ChatSessionDeleteResponse = {
  __typename?: 'ChatSessionDeleteResponse';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** Soft delete timestamp, null if not deleted */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  /** Whether the session is pinned by the user */
  isPinned?: Maybe<Scalars['Boolean']['output']>;
  /** Timestamp of the last message for sorting */
  lastMessageAt?: Maybe<Scalars['DateTime']['output']>;
  /** Number of messages in the session */
  messageCount?: Maybe<Scalars['Float']['output']>;
  /** AI response mode for this session */
  mode?: Maybe<ChatMode>;
  /** Session title, auto-generated from first message if not provided */
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type ChatSessionEdge = {
  __typename?: 'ChatSessionEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the ChatSession */
  node: ChatSession;
};

export type ChatSessionFilter = {
  and?: InputMaybe<Array<ChatSessionFilter>>;
  createdAt?: InputMaybe<DateFieldComparison>;
  deletedAt?: InputMaybe<DateFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  isPinned?: InputMaybe<BooleanFieldComparison>;
  lastMessageAt?: InputMaybe<DateFieldComparison>;
  messageCount?: InputMaybe<NumberFieldComparison>;
  mode?: InputMaybe<ChatModeFilterComparison>;
  or?: InputMaybe<Array<ChatSessionFilter>>;
  title?: InputMaybe<StringFieldComparison>;
  updatedAt?: InputMaybe<DateFieldComparison>;
  userId?: InputMaybe<IdFilterComparison>;
};

export type ChatSessionMaxAggregate = {
  __typename?: 'ChatSessionMaxAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  lastMessageAt?: Maybe<Scalars['DateTime']['output']>;
  messageCount?: Maybe<Scalars['Float']['output']>;
  mode?: Maybe<ChatMode>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type ChatSessionMinAggregate = {
  __typename?: 'ChatSessionMinAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  lastMessageAt?: Maybe<Scalars['DateTime']['output']>;
  messageCount?: Maybe<Scalars['Float']['output']>;
  mode?: Maybe<ChatMode>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type ChatSessionSort = {
  direction: SortDirection;
  field: ChatSessionSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type ChatSessionSortFields =
  | 'createdAt'
  | 'deletedAt'
  | 'id'
  | 'isPinned'
  | 'lastMessageAt'
  | 'messageCount'
  | 'mode'
  | 'title'
  | 'updatedAt'
  | 'userId';

export type ChatSessionSumAggregate = {
  __typename?: 'ChatSessionSumAggregate';
  messageCount?: Maybe<Scalars['Float']['output']>;
};

export type CheckEmailExistsResult = {
  __typename?: 'CheckEmailExistsResult';
  exists: Scalars['Boolean']['output'];
  userId?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type CheckPermissionInput = {
  permissionType: Scalars['String']['input'];
  resourceType: Scalars['String']['input'];
  roleNames: Array<Scalars['String']['input']>;
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

/** Message focused on legal citations and references */
export type CitationMessage = ChatMessageInterface & {
  __typename?: 'CitationMessage';
  citationCount: Scalars['Float']['output'];
  citations: Array<ChatCitation>;
  confidence?: Maybe<Scalars['Float']['output']>;
  /** Message content */
  content: Scalars['String']['output'];
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Unique message identifier */
  messageId: Scalars['ID']['output'];
  queryType?: Maybe<Scalars['String']['output']>;
  /** Role of the message sender */
  role: MessageRole;
  /** Sequence order in conversation */
  sequenceOrder: Scalars['Float']['output'];
  /** Session ID */
  sessionId: Scalars['ID']['output'];
  /** Message type discriminator for resolving concrete types */
  type?: Maybe<ChatMessageType>;
};

export type ClarificationAnswer = {
  __typename?: 'ClarificationAnswer';
  answer: Scalars['String']['output'];
  answered_at?: Maybe<Scalars['DateTime']['output']>;
  question: Scalars['String']['output'];
  question_type: Scalars['String']['output'];
};

export type ClarificationAnswerInput = {
  /** The user answer */
  answer: Scalars['String']['input'];
  /** Unique identifier of the question being answered */
  questionId: Scalars['String']['input'];
};

export type ClarificationAnswerItemType = {
  __typename?: 'ClarificationAnswerItemType';
  answer: Scalars['String']['output'];
  question: Scalars['String']['output'];
  question_type?: Maybe<Scalars['String']['output']>;
};

/** User's answers to clarification questions */
export type ClarificationAnswerMessage = ChatMessageInterface & {
  __typename?: 'ClarificationAnswerMessage';
  /** When the answers were submitted */
  answeredAt?: Maybe<Scalars['DateTime']['output']>;
  answers: Array<ClarificationAnswerItemType>;
  clarificationMessageId?: Maybe<Scalars['ID']['output']>;
  /** Message content */
  content: Scalars['String']['output'];
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Unique message identifier */
  messageId: Scalars['ID']['output'];
  /** Role of the message sender */
  role: MessageRole;
  /** Sequence order in conversation */
  sequenceOrder: Scalars['Float']['output'];
  /** Session ID */
  sessionId: Scalars['ID']['output'];
  /** Message type discriminator for resolving concrete types */
  type?: Maybe<ChatMessageType>;
};

export type ClarificationInfo = {
  __typename?: 'ClarificationInfo';
  context_summary: Scalars['String']['output'];
  needs_clarification: Scalars['Boolean']['output'];
  next_steps: Scalars['String']['output'];
  questions: Array<ClarificationQuestion>;
};

export type ClarificationInfoInput = {
  answered?: InputMaybe<Scalars['Boolean']['input']>;
  context_summary: Scalars['String']['input'];
  currentRound?: InputMaybe<Scalars['Float']['input']>;
  needs_clarification: Scalars['Boolean']['input'];
  next_steps: Scalars['String']['input'];
  questions: Array<LegacyClarificationQuestionInput>;
  totalRounds?: InputMaybe<Scalars['Float']['input']>;
};

export type ClarificationInfoType = {
  __typename?: 'ClarificationInfoType';
  answered?: Maybe<Scalars['Boolean']['output']>;
  context_summary: Scalars['String']['output'];
  currentRound?: Maybe<Scalars['Float']['output']>;
  needs_clarification: Scalars['Boolean']['output'];
  next_steps: Scalars['String']['output'];
  questions: Array<ClarificationQuestionType>;
  totalRounds?: Maybe<Scalars['Float']['output']>;
};

export type ClarificationQuestion = {
  __typename?: 'ClarificationQuestion';
  hint?: Maybe<Scalars['String']['output']>;
  options?: Maybe<Array<Scalars['String']['output']>>;
  question: Scalars['String']['output'];
  question_type: Scalars['String']['output'];
};

export type ClarificationQuestionItemType = {
  __typename?: 'ClarificationQuestionItemType';
  hint?: Maybe<Scalars['String']['output']>;
  options?: Maybe<Array<Scalars['String']['output']>>;
  question: Scalars['String']['output'];
  question_type: Scalars['String']['output'];
};

/** Message from AI asking follow-up clarification questions to the user */
export type ClarificationQuestionMessage = ChatMessageInterface & {
  __typename?: 'ClarificationQuestionMessage';
  /** Whether the clarification has been answered */
  answered?: Maybe<Scalars['Boolean']['output']>;
  /** Message content */
  content: Scalars['String']['output'];
  context_summary: Scalars['String']['output'];
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Current clarification round */
  currentRound?: Maybe<Scalars['Float']['output']>;
  /** Unique message identifier */
  messageId: Scalars['ID']['output'];
  next_steps: Scalars['String']['output'];
  questions: Array<ClarificationQuestionItemType>;
  /** Role of the message sender */
  role: MessageRole;
  /** Sequence order in conversation */
  sequenceOrder: Scalars['Float']['output'];
  /** Session ID */
  sessionId: Scalars['ID']['output'];
  /** Total clarification rounds */
  totalRounds?: Maybe<Scalars['Float']['output']>;
  /** Message type discriminator for resolving concrete types */
  type?: Maybe<ChatMessageType>;
};

export type ClarificationQuestionType = {
  __typename?: 'ClarificationQuestionType';
  hint?: Maybe<Scalars['String']['output']>;
  options?: Maybe<Array<Scalars['String']['output']>>;
  question: Scalars['String']['output'];
  questionId?: Maybe<Scalars['String']['output']>;
  questionType?: Maybe<Scalars['String']['output']>;
  question_type?: Maybe<Scalars['String']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
};

export type ClarificationSession = {
  __typename?: 'ClarificationSession';
  /** Accumulated context for AI processing */
  accumulatedContext?: Maybe<Array<Scalars['String']['output']>>;
  /** User answers to clarification questions */
  answersReceived: Array<ClarificationAnswer>;
  /** Session completion timestamp */
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** Error message if session failed */
  errorMessage?: Maybe<Scalars['String']['output']>;
  /** Session expiration timestamp */
  expiresAt: Scalars['DateTime']['output'];
  /** Final query ID with complete answer */
  finalQueryId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  originalQuery: Scalars['String']['output'];
  queryId: Scalars['ID']['output'];
  /** Array of clarification question texts */
  questionsAsked: Array<Scalars['String']['output']>;
  /** Number of clarification rounds */
  rounds: Scalars['Float']['output'];
  sessionId?: Maybe<Scalars['ID']['output']>;
  state: ClarificationState;
  updatedAt: Scalars['DateTime']['output'];
};

/** The current state of a clarification session */
export type ClarificationState = 'ANSWERED' | 'CANCELLED' | 'COMPLETE' | 'EXPIRED' | 'PENDING';

export type ClarificationValidationError = {
  __typename?: 'ClarificationValidationError';
  /** Error code for programmatic handling */
  code: Scalars['String']['output'];
  /** Error message describing what went wrong */
  message: Scalars['String']['output'];
  /** The question ID that has validation errors */
  questionId: Scalars['String']['output'];
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

export type CleanupEmptyMessagesInput = {
  /** Actually perform the cleanup (false = dry run) */
  execute?: InputMaybe<Scalars['Boolean']['input']>;
  /** Mark truly empty messages for deletion */
  markForDeletion?: InputMaybe<Scalars['Boolean']['input']>;
  /** Recover messages from clarification metadata */
  recoverFromClarification?: InputMaybe<Scalars['Boolean']['input']>;
  /** Recover messages from rawContent if available */
  recoverFromRawContent?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CleanupEmptyMessagesResult = {
  __typename?: 'CleanupEmptyMessagesResult';
  /** Number of affected sessions */
  affectedSessions: Scalars['Int']['output'];
  /** Number of affected users */
  affectedUsers: Scalars['Int']['output'];
  /** Number of messages marked for deletion (truly empty) */
  markedForDeletion: Scalars['Int']['output'];
  /** Number of messages recovered from clarification metadata */
  recoveredFromClarification: Scalars['Int']['output'];
  /** Number of messages recovered from rawContent */
  recoveredFromRawContent: Scalars['Int']['output'];
  /** List of affected session IDs */
  sessionIds: Array<Scalars['String']['output']>;
  /** Number of messages that could not be recovered */
  unrecoverable: Scalars['Int']['output'];
  /** List of affected user IDs */
  userIds: Array<Scalars['String']['output']>;
};

export type CleanupEmptySessionsInput = {
  /** Actually perform the cleanup (false = dry run) */
  execute?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CleanupEmptySessionsResult = {
  __typename?: 'CleanupEmptySessionsResult';
  /** Number of affected users */
  affectedUsers: Scalars['Int']['output'];
  /** Number of sessions that were deleted */
  deletedSessions: Scalars['Int']['output'];
  /** List of errors that occurred during cleanup */
  errors: Array<CleanupErrorDetail>;
  /** List of deleted session IDs */
  sessionIds: Array<Scalars['String']['output']>;
  /** Number of sessions skipped (had messages or other issues) */
  skippedSessions: Scalars['Int']['output'];
  /** Total number of empty sessions found */
  totalEmptySessions: Scalars['Int']['output'];
  /** List of affected user IDs */
  userIds: Array<Scalars['String']['output']>;
};

export type CleanupErrorDetail = {
  __typename?: 'CleanupErrorDetail';
  /** Error message */
  error: Scalars['String']['output'];
  /** The session ID that failed */
  sessionId: Scalars['ID']['output'];
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

/** Company size categories */
export type CompanySize =
  | 'ENTERPRISE_500_PLUS'
  | 'LARGE_201_500'
  | 'MEDIUM_51_200'
  | 'SMALL_2_10'
  | 'SMALL_11_50'
  | 'SOLO';

/** Company size categories for demo requests */
export type CompanySizeEnum = 'ENTERPRISE' | 'LARGE' | 'MEDIUM' | 'SMALL' | 'SOLO';

export type CompleteTwoFactorLoginInput = {
  /** Backup code for account recovery (alternative to TOTP token) */
  backupCode?: InputMaybe<Scalars['String']['input']>;
  /** Temporary token received from login when 2FA is required */
  twoFactorTempToken: Scalars['String']['input'];
  /** The 6-digit TOTP token from authenticator app */
  twoFactorToken?: InputMaybe<Scalars['String']['input']>;
};

export type ConditionalSectionInput = {
  condition: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
};

export type ConversationHistoryVerification = {
  __typename?: 'ConversationHistoryVerification';
  /** First message role */
  firstRole?: Maybe<Scalars['String']['output']>;
  /** Whether any messages have empty content */
  hasEmptyContent: Scalars['Boolean']['output'];
  /** Last message role */
  lastRole?: Maybe<Scalars['String']['output']>;
  /** Whether message count matches between different queries */
  messageCountMatches: Scalars['Boolean']['output'];
  /** Whether message order is valid */
  orderValid: Scalars['Boolean']['output'];
};

export type ConversationMessagePreview = {
  __typename?: 'ConversationMessagePreview';
  /** Full message content */
  content: Scalars['String']['output'];
  /** Content preview (first 100 chars) */
  contentPreview: Scalars['String']['output'];
  /** Creation timestamp */
  createdAt: Scalars['String']['output'];
  /** Message ID */
  messageId: Scalars['String']['output'];
  /** Message role (USER or ASSISTANT) */
  role: Scalars['String']['output'];
  /** Sequence order in conversation */
  sequenceOrder: Scalars['Float']['output'];
};

export type ConversationRoleDistribution = {
  __typename?: 'ConversationRoleDistribution';
  /** Number of assistant messages */
  assistant: Scalars['Float']['output'];
  /** Number of user messages */
  user: Scalars['Float']['output'];
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

export type CreateChatSessionInput = {
  /** AI response mode for the session (LAWYER or SIMPLE) */
  mode: ChatMode;
};

export type CreateCitationInput = {
  article?: InputMaybe<Scalars['String']['input']>;
  excerpt?: InputMaybe<Scalars['String']['input']>;
  source: Scalars['String']['input'];
  url?: InputMaybe<Scalars['String']['input']>;
};

export type CreateClarificationSessionInput = {
  /** Initial context for the clarification session */
  initialContext?: InputMaybe<Array<Scalars['String']['input']>>;
  /** ID of the legal query that triggered clarification */
  queryId: Scalars['String']['input'];
  /** Clarification questions to ask the user */
  questions: Array<Scalars['String']['input']>;
  /** Session ID for the user (optional) */
  sessionId?: InputMaybe<Scalars['String']['input']>;
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

export type CreateHubSpotContactInput = {
  /** Company name */
  company?: InputMaybe<Scalars['String']['input']>;
  /** Company size */
  companySize?: InputMaybe<Scalars['String']['input']>;
  /** Contact email address (required) */
  email: Scalars['String']['input'];
  /** First name */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** GDPR consent for data processing */
  gdprConsent?: InputMaybe<Scalars['Boolean']['input']>;
  /** Job title */
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  /** Last name */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Additional message */
  message?: InputMaybe<Scalars['String']['input']>;
  /** Phone number */
  phone?: InputMaybe<Scalars['String']['input']>;
  /** Lead source */
  source?: InputMaybe<Scalars['String']['input']>;
  /** Implementation timeline */
  timeline?: InputMaybe<LeadTimeline>;
  /** Use case description */
  useCase?: InputMaybe<Scalars['String']['input']>;
  /** Company website */
  website?: InputMaybe<Scalars['String']['input']>;
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

export type CreateOneChatSessionInput = {
  /** The record to create */
  chatSession: CreateChatSessionInput;
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

export type CreateOneUserPreferencesInput = {
  /** The record to create */
  userPreferences: CreateUserPreferencesInput;
};

export type CreateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  inheritsFrom?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  permissions: Array<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type CreateRulingMetadataInput = {
  keywords?: InputMaybe<Array<Scalars['String']['input']>>;
  legalArea?: InputMaybe<Scalars['String']['input']>;
  relatedCases?: InputMaybe<Array<Scalars['String']['input']>>;
  sourceReference?: InputMaybe<Scalars['String']['input']>;
};

export type CreateScheduleInput = {
  /** Action the schedule performs */
  action: ScheduleActionInput;
  /** Initial paused state */
  paused?: InputMaybe<Scalars['Boolean']['input']>;
  /** Schedule behavior policies */
  policies?: InputMaybe<SchedulePoliciesInput>;
  /** Unique identifier for the schedule */
  scheduleId: Scalars['String']['input'];
  /** Schedule specification (when it runs) */
  spec: ScheduleSpecInput;
};

export type CreateScheduleResult = {
  __typename?: 'CreateScheduleResult';
  /** Message describing the creation result */
  message?: Maybe<Scalars['String']['output']>;
  /** The ID of the created schedule */
  scheduleId: Scalars['ID']['output'];
  /** Whether the creation was successful */
  success: Scalars['Boolean']['output'];
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

export type DeleteChatSessionInput = {
  /** Session ID to delete (soft delete) */
  sessionId: Scalars['ID']['input'];
};

export type DeleteChatSessionResult = {
  __typename?: 'DeleteChatSessionResult';
  /** Deletion type (hard or soft) */
  deletionType: Scalars['String']['output'];
  /** Number of messages deleted with this session */
  messageCount: Scalars['Int']['output'];
  /** The ID of the deleted session */
  sessionId: Scalars['ID']['output'];
  /** Whether the deletion was successful */
  success: Scalars['Boolean']['output'];
};

export type DeleteDocumentInputV2 = {
  deletedBy: Scalars['ID']['input'];
  documentId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteOneChatSessionInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
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

export type DeleteOneUserPreferencesInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteOneUserSessionInput = {
  /** The id of the record to delete. */
  id: Scalars['ID']['input'];
};

export type DeleteScheduleInput = {
  /** Confirmation that the user intends to delete the schedule */
  confirm?: Scalars['Boolean']['input'];
  /** Optional reason for deletion (logged to audit trail) */
  reason?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the schedule to delete */
  scheduleId: Scalars['String']['input'];
};

/** Webhook delivery status */
export type DeliveryStatus = 'FAILED' | 'PENDING' | 'RETRYING' | 'SUCCESS';

export type DemoRequest = {
  __typename?: 'DemoRequest';
  budget?: Maybe<Scalars['String']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  companySize?: Maybe<CompanySizeEnum>;
  contactedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  hubspotContactId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  industry?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['String']['output']>;
  preferredDemoTime?: Maybe<Scalars['DateTime']['output']>;
  status: DemoRequestStatus;
  submittedAt: Scalars['DateTime']['output'];
  timeline?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  useCase: Scalars['String']['output'];
};

export type DemoRequestAggregateFilter = {
  and?: InputMaybe<Array<DemoRequestAggregateFilter>>;
  email?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<DemoRequestAggregateFilter>>;
  status?: InputMaybe<DemoRequestStatusFilterComparison>;
};

export type DemoRequestAggregateGroupBy = {
  __typename?: 'DemoRequestAggregateGroupBy';
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  status?: Maybe<DemoRequestStatus>;
};

export type DemoRequestAggregateResponse = {
  __typename?: 'DemoRequestAggregateResponse';
  count?: Maybe<DemoRequestCountAggregate>;
  groupBy?: Maybe<DemoRequestAggregateGroupBy>;
  max?: Maybe<DemoRequestMaxAggregate>;
  min?: Maybe<DemoRequestMinAggregate>;
};

export type DemoRequestAnalytics = {
  __typename?: 'DemoRequestAnalytics';
  /** Company size distribution */
  companySizeDistribution: Array<DemoRequestCompanySizeDistribution>;
  generatedAt: Scalars['DateTime']['output'];
  /** Industry breakdown */
  industryBreakdown: Array<DemoRequestIndustryBreakdown>;
  /** Lead source distribution */
  leadSources: Array<DemoRequestLeadSource>;
  metrics: DemoRequestMetrics;
  /** Requests over time (by day) */
  requestsOverTime: Array<DemoRequestTimeSeriesPoint>;
  /** Average response time metrics */
  responseTimeMetrics: DemoRequestResponseTimeMetrics;
  /** Status distribution for funnel visualization */
  statusBreakdown: Array<DemoRequestStatusBreakdown>;
  /** Top mentioned use cases */
  topUseCases: Array<DemoRequestTopUseCase>;
};

export type DemoRequestCompanySizeDistribution = {
  __typename?: 'DemoRequestCompanySizeDistribution';
  companySize: Scalars['String']['output'];
  count: Scalars['Int']['output'];
  /** Percentage of total */
  percentage: Scalars['Float']['output'];
};

export type DemoRequestConnection = {
  __typename?: 'DemoRequestConnection';
  /** Array of edges. */
  edges: Array<DemoRequestEdge>;
  /** Paging information */
  pageInfo: PageInfo;
  /** Fetch total count of records */
  totalCount: Scalars['Int']['output'];
};

export type DemoRequestCountAggregate = {
  __typename?: 'DemoRequestCountAggregate';
  email?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
};

export type DemoRequestEdge = {
  __typename?: 'DemoRequestEdge';
  /** Cursor for this node. */
  cursor: Scalars['ConnectionCursor']['output'];
  /** The node containing the DemoRequest */
  node: DemoRequest;
};

export type DemoRequestFilter = {
  and?: InputMaybe<Array<DemoRequestFilter>>;
  email?: InputMaybe<StringFieldComparison>;
  id?: InputMaybe<IdFilterComparison>;
  or?: InputMaybe<Array<DemoRequestFilter>>;
  status?: InputMaybe<DemoRequestStatusFilterComparison>;
};

export type DemoRequestIndustryBreakdown = {
  __typename?: 'DemoRequestIndustryBreakdown';
  count: Scalars['Int']['output'];
  industry: Scalars['String']['output'];
  /** Percentage of total */
  percentage: Scalars['Float']['output'];
};

export type DemoRequestInput = {
  /** Budget range for implementation */
  budget?: InputMaybe<BudgetRange>;
  /** Company name */
  company: Scalars['String']['input'];
  /** Company size (number of employees) */
  companySize: CompanySize;
  /** Email address */
  email: Scalars['String']['input'];
  /** Full name of the requester */
  fullName: Scalars['String']['input'];
  /** Industry category */
  industry: Industry;
  /** Preferred time of day for demo */
  preferredDemoTime?: InputMaybe<PreferredTimeSlot>;
  /** Referrer URL for tracking */
  referrer?: InputMaybe<Scalars['String']['input']>;
  /** Timeline for implementation */
  timeline: DemoTimeline;
  /** Specific use case or requirements */
  useCase: Scalars['String']['input'];
  /** UTM campaign parameter for tracking */
  utmCampaign?: InputMaybe<Scalars['String']['input']>;
  /** UTM content parameter for tracking */
  utmContent?: InputMaybe<Scalars['String']['input']>;
  /** UTM medium parameter for tracking */
  utmMedium?: InputMaybe<Scalars['String']['input']>;
  /** UTM source parameter for tracking */
  utmSource?: InputMaybe<Scalars['String']['input']>;
  /** UTM term parameter for tracking */
  utmTerm?: InputMaybe<Scalars['String']['input']>;
};

export type DemoRequestLeadSource = {
  __typename?: 'DemoRequestLeadSource';
  /** Number of requests from this source */
  count: Scalars['Int']['output'];
  /** UTM medium */
  medium?: Maybe<Scalars['String']['output']>;
  /** Percentage of total */
  percentage: Scalars['Float']['output'];
  /** UTM source or "direct" */
  source?: Maybe<Scalars['String']['output']>;
};

export type DemoRequestMaxAggregate = {
  __typename?: 'DemoRequestMaxAggregate';
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  status?: Maybe<DemoRequestStatus>;
};

export type DemoRequestMetrics = {
  __typename?: 'DemoRequestMetrics';
  /** Requests closed (won or lost) */
  closedRequests: Scalars['Int']['output'];
  /** Requests that have been contacted */
  contactedRequests: Scalars['Int']['output'];
  /** Contacted to scheduled conversion rate % */
  contactedToScheduledRate: Scalars['Float']['output'];
  /** New requests (not yet contacted) */
  newRequests: Scalars['Int']['output'];
  /** New to contacted conversion rate % */
  newToContactedRate: Scalars['Float']['output'];
  /** Overall funnel conversion rate % */
  overallConversionRate: Scalars['Float']['output'];
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  /** Requests qualified as leads */
  qualifiedRequests: Scalars['Int']['output'];
  /** Requests with demos scheduled */
  scheduledRequests: Scalars['Int']['output'];
  /** Total demo requests in period */
  totalRequests: Scalars['Int']['output'];
};

export type DemoRequestMinAggregate = {
  __typename?: 'DemoRequestMinAggregate';
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  status?: Maybe<DemoRequestStatus>;
};

export type DemoRequestResponse = {
  __typename?: 'DemoRequestResponse';
  /** Confirmation message with next steps */
  message: Scalars['String']['output'];
  /** Whether the lead was qualified for immediate follow-up */
  qualified?: Maybe<Scalars['Boolean']['output']>;
  /** Unique reference ID for the request */
  referenceId?: Maybe<Scalars['String']['output']>;
  /** Whether the request was submitted successfully */
  success: Scalars['Boolean']['output'];
};

export type DemoRequestResponseTimeMetrics = {
  __typename?: 'DemoRequestResponseTimeMetrics';
  /** Average hours from submission to first contact */
  avgHoursToContact: Scalars['Float']['output'];
  calculatedAt: Scalars['DateTime']['output'];
  /** Median hours to contact */
  medianHoursToContact: Scalars['Float']['output'];
  /** Total contacted requests measured */
  totalContacted: Scalars['Int']['output'];
};

export type DemoRequestSort = {
  direction: SortDirection;
  field: DemoRequestSortFields;
  nulls?: InputMaybe<SortNulls>;
};

export type DemoRequestSortFields = 'email' | 'id' | 'status';

/** Demo request status in the sales pipeline */
export type DemoRequestStatus = 'CLOSED' | 'CONTACTED' | 'NEW' | 'QUALIFIED' | 'SCHEDULED';

export type DemoRequestStatusBreakdown = {
  __typename?: 'DemoRequestStatusBreakdown';
  count: Scalars['Int']['output'];
  /** Percentage of total */
  percentage: Scalars['Float']['output'];
  status: Scalars['String']['output'];
};

export type DemoRequestStatusFilterComparison = {
  eq?: InputMaybe<DemoRequestStatus>;
  gt?: InputMaybe<DemoRequestStatus>;
  gte?: InputMaybe<DemoRequestStatus>;
  iLike?: InputMaybe<DemoRequestStatus>;
  in?: InputMaybe<Array<DemoRequestStatus>>;
  is?: InputMaybe<Scalars['Boolean']['input']>;
  isNot?: InputMaybe<Scalars['Boolean']['input']>;
  like?: InputMaybe<DemoRequestStatus>;
  lt?: InputMaybe<DemoRequestStatus>;
  lte?: InputMaybe<DemoRequestStatus>;
  neq?: InputMaybe<DemoRequestStatus>;
  notILike?: InputMaybe<DemoRequestStatus>;
  notIn?: InputMaybe<Array<DemoRequestStatus>>;
  notLike?: InputMaybe<DemoRequestStatus>;
};

export type DemoRequestTimeSeriesPoint = {
  __typename?: 'DemoRequestTimeSeriesPoint';
  count: Scalars['Int']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type DemoRequestTopUseCase = {
  __typename?: 'DemoRequestTopUseCase';
  /** Number of similar requests */
  count: Scalars['Int']['output'];
  /** Truncated use case text */
  useCase: Scalars['String']['output'];
};

/** Timeline preferences for demo */
export type DemoTimeline = 'ASAP' | 'EXPLORING' | 'WITHIN_MONTH' | 'WITHIN_QUARTER' | 'WITHIN_WEEK';

export type DisableTwoFactorInput = {
  /** User password for confirmation */
  password: Scalars['String']['input'];
};

export type DocumentActivityEntry = {
  __typename?: 'DocumentActivityEntry';
  createdAt: Scalars['DateTime']['output'];
  documentId: Scalars['ID']['output'];
  /** Document type */
  documentType?: Maybe<Scalars['String']['output']>;
  /** Error message if failed */
  errorMessage?: Maybe<Scalars['String']['output']>;
  /** The status of the document */
  status: Scalars['String']['output'];
  title: Scalars['String']['output'];
  /** When the status last changed */
  updatedAt: Scalars['DateTime']['output'];
  /** User who owns the document */
  userId?: Maybe<Scalars['ID']['output']>;
};

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

export type DocumentGenerationMetrics = {
  __typename?: 'DocumentGenerationMetrics';
  /** Average generation time in seconds */
  avgGenerationTime: Scalars['Int']['output'];
  /** Failed document generations */
  failedDocuments: Scalars['Int']['output'];
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  /** Success rate as percentage */
  successRate: Scalars['Float']['output'];
  /** Successfully generated documents */
  successfulDocuments: Scalars['Int']['output'];
  /** Total documents generated */
  totalDocuments: Scalars['Int']['output'];
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

export type DocumentQueueMetrics = {
  __typename?: 'DocumentQueueMetrics';
  calculatedAt: Scalars['DateTime']['output'];
  /** Documents in COMPLETED status (total) */
  completedCount: Scalars['Int']['output'];
  /** Documents currently in DRAFT status */
  draftCount: Scalars['Int']['output'];
  /** Documents in FAILED status (total) */
  failedCount: Scalars['Int']['output'];
  /** Documents currently in GENERATING status */
  generatingCount: Scalars['Int']['output'];
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
  | 'DEMO_REQUEST_CONFIRMATION'
  | 'DOCUMENT_COMPLETED'
  | 'DOCUMENT_FAILED'
  | 'INTEREST_CONFIRMATION'
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

export type EmptyMessageAnalysis = {
  __typename?: 'EmptyMessageAnalysis';
  /** Content field value (should be empty) */
  content?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the message was created */
  createdAt: Scalars['String']['output'];
  /** Whether metadata contains clarification data */
  hasClarificationMetadata: Scalars['Boolean']['output'];
  /** Whether rawContent has data that can be recovered */
  hasRecoverableRawContent: Scalars['Boolean']['output'];
  /** The message ID */
  messageId: Scalars['ID']['output'];
  /** Raw content field value (may have data) */
  rawContent?: Maybe<Scalars['String']['output']>;
  /** Message role */
  role: MessageRole;
  /** Sequence order in the conversation */
  sequenceOrder: Scalars['Int']['output'];
  /** The session ID */
  sessionId: Scalars['ID']['output'];
  /** The user ID */
  userId: Scalars['ID']['output'];
};

export type EmptyMessagesSummary = {
  __typename?: 'EmptyMessagesSummary';
  /** Number of affected sessions */
  affectedSessions: Scalars['Int']['output'];
  /** Number of affected users */
  affectedUsers: Scalars['Int']['output'];
  /** List of empty messages found */
  messages: Array<EmptyMessageAnalysis>;
  /** Number of messages with recoverable rawContent */
  recoverableFromRawContent: Scalars['Int']['output'];
  /** Total number of empty assistant messages found */
  totalEmptyMessages: Scalars['Int']['output'];
  /** Number of messages that are truly empty (both content and rawContent) */
  trulyEmpty: Scalars['Int']['output'];
  /** Number of messages with clarification metadata */
  withClarificationMetadata: Scalars['Int']['output'];
};

export type EmptySessionAnalysis = {
  __typename?: 'EmptySessionAnalysis';
  /** Timestamp when the session was created */
  createdAt: Scalars['String']['output'];
  /** Chat mode (LAWYER or SIMPLE) */
  mode: Scalars['String']['output'];
  /** The session ID */
  sessionId: Scalars['ID']['output'];
  /** Session title (should be null for empty sessions) */
  title?: Maybe<Scalars['String']['output']>;
  /** The user ID */
  userId: Scalars['ID']['output'];
};

export type EmptySessionsMetrics = {
  __typename?: 'EmptySessionsMetrics';
  /** Threshold for alerting (null = no threshold set) */
  alertThreshold?: Maybe<Scalars['Int']['output']>;
  /** Current count of empty sessions in the database */
  count: Scalars['Int']['output'];
  /** Whether the count exceeds the alert threshold */
  requiresAttention: Scalars['Boolean']['output'];
  /** ISO timestamp of when this metric was collected */
  timestamp: Scalars['String']['output'];
};

export type EnableTwoFactorResponse = {
  __typename?: 'EnableTwoFactorResponse';
  /** Backup codes for account recovery (show only once) */
  backupCodes: Array<Scalars['String']['output']>;
  /** QR code as base64 data URL for scanning */
  qrCodeDataUrl: Scalars['String']['output'];
  /** The TOTP secret key for storing in authenticator app */
  secret: Scalars['String']['output'];
};

export type ErrorSummary = {
  __typename?: 'ErrorSummary';
  count: Scalars['Float']['output'];
  message: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type ErrorTrackingStatus = {
  __typename?: 'ErrorTrackingStatus';
  criticalErrors: Scalars['Float']['output'];
  lastError?: Maybe<ErrorSummary>;
  recentErrors: Scalars['Float']['output'];
  totalErrors: Scalars['Float']['output'];
};

export type ExportChatSessionInput = {
  /** Optional custom filename (without extension) */
  filename?: InputMaybe<Scalars['String']['input']>;
  /** Export format (PDF, MARKDOWN, or JSON) */
  format: ChatExportFormat;
  /** ID of the chat session to export */
  sessionId: Scalars['ID']['input'];
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

export type HubSpotContactResponse = {
  __typename?: 'HubSpotContactResponse';
  /** When the contact was created */
  createdAt: Scalars['String']['output'];
  /** Contact email */
  email: Scalars['String']['output'];
  /** HubSpot contact ID */
  id: Scalars['String']['output'];
};

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

/** Industry categories */
export type Industry =
  | 'CONSULTING'
  | 'FINANCE'
  | 'GOVERNMENT'
  | 'HEALTHCARE'
  | 'LAW_FIRM'
  | 'LEGAL_DEPARTMENT'
  | 'OTHER'
  | 'REAL_ESTATE'
  | 'TECHNOLOGY';

export type InterestRequestInput = {
  /** Company name */
  company?: InputMaybe<Scalars['String']['input']>;
  /** GDPR consent checkbox */
  consent: Scalars['Boolean']['input'];
  /** Email address */
  email: Scalars['String']['input'];
  /** Full name of the requester */
  fullName: Scalars['String']['input'];
  /** How they heard about us (lead source) */
  leadSource?: InputMaybe<Scalars['String']['input']>;
  /** Job role or position */
  role?: InputMaybe<Scalars['String']['input']>;
  /** Specific use case or requirements */
  useCase?: InputMaybe<Scalars['String']['input']>;
};

export type InterestRequestResponse = {
  __typename?: 'InterestRequestResponse';
  /** Confirmation message with next steps */
  message: Scalars['String']['output'];
  /** Unique reference ID for the request */
  referenceId?: Maybe<Scalars['String']['output']>;
  /** Whether the request was submitted successfully */
  success: Scalars['Boolean']['output'];
};

export type LangfuseDebugConfig = {
  __typename?: 'LangfuseDebugConfig';
  /** Base URL for Langfuse dashboard */
  dashboardUrl?: Maybe<Scalars['String']['output']>;
  /** Whether Langfuse integration is enabled */
  enabled: Scalars['Boolean']['output'];
  /** Langfuse host URL */
  hostUrl?: Maybe<Scalars['String']['output']>;
  /** Langfuse trace URL template (use {traceId} as placeholder) */
  traceUrlTemplate?: Maybe<Scalars['String']['output']>;
};

export type LangfuseTrace = {
  __typename?: 'LangfuseTrace';
  /** Type of agent or workflow */
  agentType: AgentType;
  /** Duration in milliseconds */
  duration?: Maybe<Scalars['Float']['output']>;
  /** Timestamp when trace ended */
  endTime?: Maybe<Scalars['Timestamp']['output']>;
  /** Unique trace ID */
  id: Scalars['ID']['output'];
  /** Trace level */
  level?: Maybe<TraceLevel>;
  /** Metadata associated with the trace */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Model used for the trace */
  model: Scalars['String']['output'];
  /** Trace name (operation name) */
  name: Scalars['String']['output'];
  /** Number of observations (spans/generations) in the trace */
  observationCount: Scalars['Int']['output'];
  /** Session ID associated with the trace */
  sessionId: Scalars['String']['output'];
  /** Timestamp when trace started */
  startTime?: Maybe<Scalars['Timestamp']['output']>;
  /** Trace status */
  status: TraceStatus;
  /** Timestamp when trace was created */
  timestamp: Scalars['Timestamp']['output'];
  /** Token usage details */
  usage?: Maybe<TokenUsage>;
  /** User ID associated with the trace */
  userId: Scalars['String']['output'];
};

export type LangfuseTraceDetail = {
  __typename?: 'LangfuseTraceDetail';
  /** Type of agent or workflow */
  agentType: AgentType;
  /** Duration in milliseconds */
  duration?: Maybe<Scalars['Float']['output']>;
  /** Timestamp when trace ended */
  endTime?: Maybe<Scalars['Timestamp']['output']>;
  /** Error message if trace failed */
  errorMessage: Scalars['String']['output'];
  /** When this data was fetched */
  fetchedAt: Scalars['Timestamp']['output'];
  /** Unique trace ID */
  id: Scalars['ID']['output'];
  /** Trace level */
  level?: Maybe<TraceLevel>;
  /** Metadata associated with the trace */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Model used for the trace */
  model: Scalars['String']['output'];
  /** Trace name (operation name) */
  name: Scalars['String']['output'];
  /** All observations within the trace */
  observations: Array<TraceObservation>;
  /** Session ID associated with the trace */
  sessionId: Scalars['String']['output'];
  /** Stack trace if trace failed */
  stackTrace: Scalars['String']['output'];
  /** Timestamp when trace started */
  startTime?: Maybe<Scalars['Timestamp']['output']>;
  /** Trace status */
  status: TraceStatus;
  /** Timestamp when trace was created */
  timestamp: Scalars['Timestamp']['output'];
  /** Aggregated token usage */
  usage?: Maybe<TokenUsage>;
  /** User email if available */
  userEmail: Scalars['String']['output'];
  /** User ID associated with the trace */
  userId: Scalars['String']['output'];
};

export type LeadQualificationResponse = {
  __typename?: 'LeadQualificationResponse';
  /** Whether the lead is qualified */
  qualified: Scalars['Boolean']['output'];
  /** Reason for qualification status */
  reason?: Maybe<Scalars['String']['output']>;
  /** Lead qualification score */
  score: Scalars['Float']['output'];
};

/** Timeline for lead implementation */
export type LeadTimeline = 'EXPLORING' | 'IMMEDIATE' | 'WITHIN_MONTH' | 'WITHIN_QUARTER';

export type LegacyClarificationQuestionInput = {
  hint?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  question: Scalars['String']['input'];
  question_type: Scalars['String']['input'];
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
  clarificationInfo?: Maybe<ClarificationInfo>;
  confidence?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  keyTerms?: Maybe<Array<Scalars['String']['output']>>;
  queryType?: Maybe<Scalars['String']['output']>;
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
  clarificationInfo?: Maybe<ClarificationInfo>;
  confidence?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  keyTerms?: Maybe<Array<Scalars['String']['output']>>;
  queryType?: Maybe<Scalars['String']['output']>;
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

export type LocalStorageMigrationStatus = {
  __typename?: 'LocalStorageMigrationStatus';
  /** Whether the user has completed migration */
  hasMigrated: Scalars['Boolean']['output'];
  /** Timestamp of last migration attempt */
  lastMigrationAt?: Maybe<Scalars['String']['output']>;
  /** Number of sessions migrated */
  sessionsMigrated: Scalars['Int']['output'];
};

export type LoginInput = {
  /** Backup code for account recovery (alternative to TOTP token) */
  backupCode?: InputMaybe<Scalars['String']['input']>;
  /** User password */
  password: Scalars['String']['input'];
  /** 6-digit TOTP token (if 2FA is enabled) */
  twoFactorToken?: InputMaybe<Scalars['String']['input']>;
  /** Username or email address */
  username: Scalars['String']['input'];
};

/** The role of the message sender */
export type MessageRole = 'ASSISTANT' | 'SYSTEM' | 'USER';

export type MigrateChatBulkInput = {
  /** Sessions to migrate */
  sessions: Array<MigrateChatSessionInput>;
  /** Skip sessions that already exist in the database */
  skipDuplicates?: InputMaybe<Scalars['Boolean']['input']>;
};

export type MigrateChatBulkResult = {
  __typename?: 'MigrateChatBulkResult';
  /** Number of failed migrations */
  failedCount: Scalars['Int']['output'];
  /** Results for each session migration attempt */
  results: Array<MigrateChatSessionResult>;
  /** Number of successfully migrated sessions */
  successfulCount: Scalars['Int']['output'];
  /** Total number of messages migrated */
  totalMessagesMigrated: Scalars['Int']['output'];
  /** Total number of sessions processed */
  totalProcessed: Scalars['Int']['output'];
};

export type MigrateChatCitationInput = {
  /** Article or section reference */
  article?: InputMaybe<Scalars['String']['input']>;
  /** Brief excerpt or description */
  excerpt?: InputMaybe<Scalars['String']['input']>;
  /** Source of the citation */
  source: Scalars['String']['input'];
  /** URL to the source document */
  url?: InputMaybe<Scalars['String']['input']>;
};

export type MigrateChatMessageWithCitationsInput = {
  /** Citations for assistant messages */
  citations?: InputMaybe<Array<MigrateChatCitationInput>>;
  /** Message content */
  content: Scalars['String']['input'];
  /** Original content before AI processing */
  rawContent?: InputMaybe<Scalars['String']['input']>;
  /** Role of the message sender */
  role: MessageRole;
  /** ISO timestamp of when the message was created */
  timestamp?: InputMaybe<Scalars['String']['input']>;
};

export type MigrateChatSessionInput = {
  /** Messages to migrate */
  messages: Array<MigrateChatMessageWithCitationsInput>;
  /** AI mode used for this session */
  mode?: ChatMode;
  /** Session ID from localStorage (UUID v4) */
  sessionId: Scalars['String']['input'];
  /** Optional title for the session */
  title?: InputMaybe<Scalars['String']['input']>;
};

export type MigrateChatSessionResult = {
  __typename?: 'MigrateChatSessionResult';
  /** Error message if migration failed */
  error?: Maybe<Scalars['String']['output']>;
  /** Number of messages migrated */
  messageCount: Scalars['Int']['output'];
  /** The session ID in the database */
  sessionId: Scalars['ID']['output'];
  /** Whether migration was successful */
  success: Scalars['Boolean']['output'];
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
  /** Add a permission to a role */
  addPermissionToRole: Role;
  /** Create a backup (admin only) */
  adminCreateBackup: Backup;
  /** Create a new user with password and role (admin only) */
  adminCreateUser: User;
  /** Delete a backup (admin only) */
  adminDeleteBackup: Scalars['Boolean']['output'];
  /** Admin force-disable 2FA for a user (requires admin role) */
  adminForceDisableTwoFactor: AdminForceDisableTwoFactorResponse;
  /** Restore a backup (admin only) */
  adminRestoreBackup: Scalars['Boolean']['output'];
  /** Add AI-generated answer to a legal query */
  answerLegalQuery: LegalQuery;
  /** Approve a document after moderation review */
  approveDocument: ModerationActionResult;
  /** Ask a legal question and get AI answer synchronously */
  askLegalQuestion: LegalQuery;
  /** Activate multiple user accounts (admin only) */
  bulkActivateUsers: BulkUsersResult;
  /** Change roles for multiple users (admin only) */
  bulkChangeUserRoles: BulkUsersResult;
  /** Delete multiple user accounts (admin only) */
  bulkDeleteUsers: BulkDeleteUsersResult;
  /** Suspend multiple user accounts (admin only) */
  bulkSuspendUsers: BulkUsersResult;
  bulkUpsertSystemSettings: Array<SystemSetting>;
  /** Cancel an active clarification session */
  cancelClarificationSession: ClarificationSession;
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
  /** Cleanup empty assistant messages in the database */
  cleanupEmptyMessages: CleanupEmptyMessagesResult;
  /** Cleanup empty chat sessions (soft delete) */
  cleanupEmptySessions: CleanupEmptySessionsResult;
  /** Complete a clarification session with final answer reference */
  completeClarificationSession: ClarificationSession;
  /** Complete login with 2FA token or backup code after receiving requiresTwoFactor response */
  completeTwoFactorLogin: AuthPayload;
  /** Create a new API key. The raw key is only shown once. */
  createApiKey: CreateApiKeyResponse;
  /** Create a new chat session. Session ID is generated server-side. */
  createChatSession: ChatSession;
  /** Create a new clarification session for a query */
  createClarificationSession: ClarificationSession;
  createDocumentTemplate: DocumentTemplate;
  createDocumentV2: LegalDocumentV2;
  /** Create a contact in HubSpot from form submission */
  createHubSpotContact?: Maybe<HubSpotContactResponse>;
  /** Create a new subscription for the current user */
  createMySubscription: UserSubscription;
  createOneChatSession: ChatSession;
  createOneDocumentComment: DocumentComment;
  createOneDocumentTemplate: DocumentTemplate;
  createOneDocumentVersion: DocumentVersion;
  createOneInAppNotification: InAppNotification;
  createOneLegalAnalysis: LegalAnalysis;
  createOneLegalDocument: LegalDocument;
  createOneLegalQuery: LegalQuery;
  createOneLegalRuling: LegalRuling;
  createOneNotification: Notification;
  /** Create a new user (admin only) */
  createOneUser: User;
  createOneUserPreference: UserPreferences;
  /** Create a new custom role */
  createRole: Role;
  /** Create a new Temporal schedule for recurring workflow execution */
  createSchedule: CreateScheduleResult;
  /** Create a new subscription plan (admin only) */
  createSubscriptionPlan: SubscriptionPlan;
  createUsageRecord: AiUsageRecord;
  /** Create a new webhook. The secret is only shown once. */
  createWebhook: CreateWebhookResponse;
  /** Deactivate a webhook (temporary pause) */
  deactivateWebhook: Webhook;
  /** Delete an API key permanently. This action cannot be undone. */
  deleteApiKey: Scalars['Boolean']['output'];
  /** Soft delete a chat session */
  deleteChatSession: ChatSession;
  /** @deprecated Use deleteOneLegalDocument instead */
  deleteDocument: Scalars['Boolean']['output'];
  deleteDocumentTemplate: Scalars['Boolean']['output'];
  deleteDocumentV2: Scalars['Boolean']['output'];
  /**
   * Delete a legal query (deprecated)
   * @deprecated Use deleteOneLegalQuery instead
   */
  deleteLegalQuery: Scalars['Boolean']['output'];
  deleteOneChatSession: ChatSessionDeleteResponse;
  deleteOneDocumentComment: DocumentCommentDeleteResponse;
  deleteOneDocumentTemplate: DocumentTemplateDeleteResponse;
  deleteOneInAppNotification: InAppNotificationDeleteResponse;
  deleteOneLegalAnalysis: LegalAnalysisDeleteResponse;
  deleteOneLegalDocument: LegalDocumentDeleteResponse;
  deleteOneLegalQuery: LegalQueryDeleteResponse;
  deleteOneLegalRuling: LegalRulingDeleteResponse;
  /** Delete a user (admin only) */
  deleteOneUser: User;
  deleteOneUserPreference: UserPreferencesDeleteResponse;
  deleteOneUserSession: UserSessionDeleteResponse;
  /** Delete a custom role (system roles cannot be deleted) */
  deleteRole: Scalars['Boolean']['output'];
  /** Permanently delete a Temporal schedule (requires confirmation) */
  deleteSchedule: ScheduleDeletionResult;
  /** Delete a subscription plan (admin only) */
  deleteSubscriptionPlan: Scalars['Boolean']['output'];
  deleteSystemSetting: Scalars['Boolean']['output'];
  /** Delete a webhook permanently. This action cannot be undone. */
  deleteWebhook: Scalars['Boolean']['output'];
  /** Disable 2FA with password confirmation */
  disableTwoFactorAuth: Scalars['Boolean']['output'];
  /** Disable a webhook */
  disableWebhook: Webhook;
  /** Generate TOTP secret and QR code for 2FA setup */
  enableTwoFactorAuth: EnableTwoFactorResponse;
  /** Export a chat session to PDF, Markdown, or JSON format */
  exportChatSession: ChatExportResult;
  /** Queue a document for PDF export */
  exportDocumentToPdf: PdfExportJob;
  /** Export a document to PDF and wait for the result */
  exportDocumentToPdfSync: PdfExportResult;
  /** Flag a document for moderation review */
  flagDocumentForModeration: ModerationActionResult;
  generateDocument: LegalDocument;
  generateDocumentFromTemplate: LegalDocument;
  /** Permanently delete a chat session and all messages (cannot be undone) */
  hardDeleteChatSession: DeleteChatSessionResult;
  /** Authenticate user with username/email and password. Supports 2FA with twoFactorToken or backupCode. */
  login: AuthPayload;
  /** Mark all notifications as read for a user */
  markAllNotificationsAsRead: Scalars['Int']['output'];
  /** Mark localStorage migration as complete for the current user */
  markLocalStorageMigrated: LocalStorageMigrationStatus;
  /** Mark a notification as read */
  markNotificationAsRead: Scalars['String']['output'];
  /** Migrate a single chat session from localStorage to the database */
  migrateChatSession: MigrateChatSessionResult;
  /** Migrate multiple chat sessions from localStorage to the database */
  migrateChatSessionsBulk: MigrateChatBulkResult;
  /** Pause a running Temporal schedule */
  pauseSchedule: Scalars['Boolean']['output'];
  /** Pin or unpin a chat session */
  pinChatSession: ChatSession;
  publishDocumentV2: LegalDocumentV2;
  /** Check if a lead qualifies for deal creation */
  qualifyHubSpotLead: LeadQualificationResponse;
  /** Record usage for quota tracking */
  recordUsage: Scalars['Boolean']['output'];
  /** Refresh access token using a valid refresh token */
  refreshToken: RefreshTokenPayload;
  /** Generate new backup codes (invalidates old ones) */
  regenerateBackupCodes: RegenerateBackupCodesResponse;
  /** Register a new user account */
  register: AuthPayload;
  /** Reject a document after moderation review */
  rejectDocument: ModerationActionResult;
  /** Remove a permission from a role */
  removePermissionFromRole: Role;
  /** Render a template with variable substitution without creating a document */
  renderTemplate: Scalars['String']['output'];
  /** Reset the localStorage migration flag to allow re-migration */
  resetLocalStorageMigration: LocalStorageMigrationStatus;
  resetMyPreferences: UserPreferences;
  /** Reset a user password (admin only) */
  resetUserPassword: User;
  /** Resume a subscription that was scheduled for cancellation */
  resumeMySubscription: UserSubscription;
  /** Resume a paused Temporal schedule */
  resumeSchedule: Scalars['Boolean']['output'];
  /** Revoke an API key. This action cannot be undone. */
  revokeApiKey: ApiKey;
  /** Revoke a document share */
  revokeDocumentShare: Scalars['Boolean']['output'];
  /** Rollback a document to a previous version. Creates a new version with the old content. */
  rollbackDocumentToVersion: LegalDocument;
  /** Rotate webhook secret. The old secret will no longer work. */
  rotateWebhookSecret: Scalars['String']['output'];
  /** Save a chat message to the database (used for streaming responses) */
  saveChatMessage: SendChatMessageResponse;
  /** Schedule a demo time (admin only) */
  scheduleDemo: DemoRequest;
  seedSystemSettings: Scalars['Boolean']['output'];
  /** Send bulk notifications to multiple users */
  sendBulkNotifications: BulkSendNotificationResponse;
  /** Send a chat message and get AI response. Stores both messages in the database. */
  sendChatMessageWithAI: SendChatMessageWithAiResponse;
  /** Send a notification to a user across specified channels */
  sendNotification: SendNotificationResponse;
  /** Share a document with a user */
  shareDocument: DocumentShare;
  /** Submit answers to clarification questions. Validates answers and creates a user message. */
  submitClarificationAnswers: SubmitClarificationAnswersResponse;
  /** Submit a demo request. No authentication required. The request will be synced to HubSpot and the sales team will be notified via email. */
  submitDemoRequest: DemoRequestResponse;
  /** Submit an early access interest request. No authentication required. The request will be synced to HubSpot Early Access list. GDPR consent is required. */
  submitInterestRequest: InterestRequestResponse;
  /** Submit a new legal query for AI processing */
  submitLegalQuery: LegalQuery;
  /** Suspend a user account (admin only) */
  suspendUser: User;
  /** Sync a lead to HubSpot with automatic qualification */
  syncHubSpotLead: LeadQualificationResponse;
  /** Test a webhook by sending a test event */
  testWebhook: TestWebhookResponse;
  /** Update an existing API key (name, scopes, rate limit, expiration) */
  updateApiKey: ApiKey;
  /** Update the title of a chat session */
  updateChatSessionTitle: ChatSession;
  /** Update the answered status of a clarification message */
  updateClarificationStatus: UpdateClarificationStatusResponse;
  /** Update demo request status (admin only) */
  updateDemoRequestStatus: DemoRequest;
  updateDocument: LegalDocument;
  /** Update the permission level of a document share */
  updateDocumentSharePermission: DocumentShare;
  updateDocumentTemplate: DocumentTemplate;
  updateDocumentTitleV2: LegalDocumentV2;
  updateMyPreferences: UserPreferences;
  /** Update notification preferences for a user */
  updateNotificationPreferences: Scalars['String']['output'];
  updateOneChatSession: ChatSession;
  updateOneDocumentComment: DocumentComment;
  updateOneDocumentTemplate: DocumentTemplate;
  updateOneDocumentVersion: DocumentVersion;
  updateOneInAppNotification: InAppNotification;
  updateOneLegalAnalysis: LegalAnalysis;
  updateOneLegalDocument: LegalDocument;
  updateOneLegalQuery: LegalQuery;
  updateOneLegalRuling: LegalRuling;
  updateOneNotification: Notification;
  /** Update a user (admin only) */
  updateOneUser: User;
  updateOneUserPreference: UserPreferences;
  /** Update profile information for the current user */
  updateProfile: AuthUser;
  /** Update role name or description */
  updateRole: Role;
  /** Update an existing subscription plan (admin only) */
  updateSubscriptionPlan: SubscriptionPlan;
  /** Update an existing webhook (name, URL, events, headers, status) */
  updateWebhook: Webhook;
  upsertSystemSetting: SystemSetting;
  /** Verify 2FA setup with first TOTP token to enable */
  verifyTwoFactorSetup: VerifyTwoFactorSetupResponse;
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

export type MutationAddPermissionToRoleArgs = {
  input: AddPermissionInput;
};

export type MutationAdminCreateBackupArgs = {
  input?: InputMaybe<CreateBackupInput>;
};

export type MutationAdminCreateUserArgs = {
  input: AdminCreateUserInput;
};

export type MutationAdminDeleteBackupArgs = {
  id: Scalars['ID']['input'];
};

export type MutationAdminForceDisableTwoFactorArgs = {
  input: AdminForceDisableTwoFactorInput;
};

export type MutationAdminRestoreBackupArgs = {
  input: RestoreBackupInput;
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

export type MutationBulkActivateUsersArgs = {
  input: BulkActivateUsersInput;
};

export type MutationBulkChangeUserRolesArgs = {
  input: BulkChangeUserRolesInput;
};

export type MutationBulkDeleteUsersArgs = {
  input: BulkDeleteUsersInput;
};

export type MutationBulkSuspendUsersArgs = {
  input: BulkSuspendUsersInput;
};

export type MutationBulkUpsertSystemSettingsArgs = {
  input: BulkUpdateSettingsInput;
};

export type MutationCancelClarificationSessionArgs = {
  input: CancelClarificationSessionInput;
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

export type MutationCleanupEmptyMessagesArgs = {
  input: CleanupEmptyMessagesInput;
};

export type MutationCleanupEmptySessionsArgs = {
  input: CleanupEmptySessionsInput;
};

export type MutationCompleteClarificationSessionArgs = {
  finalQueryId: Scalars['String']['input'];
  sessionId: Scalars['String']['input'];
};

export type MutationCompleteTwoFactorLoginArgs = {
  input: CompleteTwoFactorLoginInput;
};

export type MutationCreateApiKeyArgs = {
  input: CreateApiKeyInput;
};

export type MutationCreateChatSessionArgs = {
  input: CreateChatSessionInput;
};

export type MutationCreateClarificationSessionArgs = {
  input: CreateClarificationSessionInput;
};

export type MutationCreateDocumentTemplateArgs = {
  input: CreateTemplateInput;
};

export type MutationCreateDocumentV2Args = {
  input: CreateLegalDocumentInputV2;
};

export type MutationCreateHubSpotContactArgs = {
  input: CreateHubSpotContactInput;
};

export type MutationCreateMySubscriptionArgs = {
  input: CreateUserSubscriptionInput;
};

export type MutationCreateOneChatSessionArgs = {
  input: CreateOneChatSessionInput;
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
  input: CreateUserInput;
};

export type MutationCreateOneUserPreferenceArgs = {
  input: CreateOneUserPreferencesInput;
};

export type MutationCreateRoleArgs = {
  input: CreateRoleInput;
};

export type MutationCreateScheduleArgs = {
  input: CreateScheduleInput;
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

export type MutationDeleteChatSessionArgs = {
  input: DeleteChatSessionInput;
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

export type MutationDeleteOneChatSessionArgs = {
  input: DeleteOneChatSessionInput;
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
  id: Scalars['ID']['input'];
};

export type MutationDeleteOneUserPreferenceArgs = {
  input: DeleteOneUserPreferencesInput;
};

export type MutationDeleteOneUserSessionArgs = {
  input: DeleteOneUserSessionInput;
};

export type MutationDeleteRoleArgs = {
  id: Scalars['String']['input'];
};

export type MutationDeleteScheduleArgs = {
  input: DeleteScheduleInput;
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

export type MutationDisableTwoFactorAuthArgs = {
  input: DisableTwoFactorInput;
};

export type MutationDisableWebhookArgs = {
  id: Scalars['String']['input'];
};

export type MutationExportChatSessionArgs = {
  input: ExportChatSessionInput;
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

export type MutationHardDeleteChatSessionArgs = {
  input: DeleteChatSessionInput;
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

export type MutationMigrateChatSessionArgs = {
  input: MigrateChatSessionInput;
};

export type MutationMigrateChatSessionsBulkArgs = {
  input: MigrateChatBulkInput;
};

export type MutationPauseScheduleArgs = {
  input: PauseScheduleInput;
};

export type MutationPinChatSessionArgs = {
  input: PinChatSessionInput;
};

export type MutationPublishDocumentV2Args = {
  input: PublishDocumentInputV2;
};

export type MutationQualifyHubSpotLeadArgs = {
  input: CreateHubSpotContactInput;
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

export type MutationRemovePermissionFromRoleArgs = {
  input: RemovePermissionInput;
};

export type MutationRenderTemplateArgs = {
  input: RenderTemplateInput;
};

export type MutationResetUserPasswordArgs = {
  input: ResetUserPasswordInput;
};

export type MutationResumeScheduleArgs = {
  input: ResumeScheduleInput;
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

export type MutationSaveChatMessageArgs = {
  input: SaveChatMessageInput;
};

export type MutationScheduleDemoArgs = {
  input: ScheduleDemoInput;
};

export type MutationSendBulkNotificationsArgs = {
  input: BulkSendNotificationInput;
};

export type MutationSendChatMessageWithAiArgs = {
  input: SendChatMessageWithAiInput;
};

export type MutationSendNotificationArgs = {
  input: SendNotificationInput;
};

export type MutationShareDocumentArgs = {
  input: ShareDocumentInput;
};

export type MutationSubmitClarificationAnswersArgs = {
  input: SubmitClarificationAnswersInput;
};

export type MutationSubmitDemoRequestArgs = {
  input: DemoRequestInput;
};

export type MutationSubmitInterestRequestArgs = {
  input: InterestRequestInput;
};

export type MutationSubmitLegalQueryArgs = {
  input: SubmitLegalQueryInput;
};

export type MutationSuspendUserArgs = {
  input: SuspendUserInput;
};

export type MutationSyncHubSpotLeadArgs = {
  input: CreateHubSpotContactInput;
  listType?: InputMaybe<Scalars['String']['input']>;
};

export type MutationTestWebhookArgs = {
  input: TestWebhookInput;
};

export type MutationUpdateApiKeyArgs = {
  id: Scalars['String']['input'];
  input: UpdateApiKeyInput;
};

export type MutationUpdateChatSessionTitleArgs = {
  input: UpdateChatSessionTitleInput;
};

export type MutationUpdateClarificationStatusArgs = {
  input: UpdateClarificationStatusInput;
};

export type MutationUpdateDemoRequestStatusArgs = {
  input: UpdateDemoRequestStatusInput;
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

export type MutationUpdateOneChatSessionArgs = {
  input: UpdateOneChatSessionInput;
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
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
};

export type MutationUpdateOneUserPreferenceArgs = {
  input: UpdateOneUserPreferencesInput;
};

export type MutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};

export type MutationUpdateRoleArgs = {
  id: Scalars['String']['input'];
  input: UpdateRoleInput;
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

export type MutationVerifyTwoFactorSetupArgs = {
  input: VerifyTwoFactorSetupInput;
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

/** Type of observation within a trace */
export type ObservationType = 'EVENT' | 'GENERATION' | 'SPAN';

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

export type PauseScheduleInput = {
  /** Optional reason for pausing (logged to audit trail) */
  reason?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the schedule to pause */
  scheduleId: Scalars['String']['input'];
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

export type Permission = {
  __typename?: 'Permission';
  condition?: Maybe<Scalars['String']['output']>;
  resource: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type PermissionCheckResult = {
  __typename?: 'PermissionCheckResult';
  allowed: Scalars['Boolean']['output'];
  permissions?: Maybe<Array<Scalars['String']['output']>>;
};

export type PinChatSessionInput = {
  /** True to pin, false to unpin */
  isPinned: Scalars['Boolean']['input'];
  /** Session ID to pin/unpin */
  sessionId: Scalars['ID']['input'];
};

/** Subscription plan tiers */
export type PlanTier = 'BASIC' | 'ENTERPRISE' | 'FREE' | 'PROFESSIONAL';

export type PolishFormattingRulesInput = {
  addressFormat?: InputMaybe<Scalars['String']['input']>;
  currencyFormat?: InputMaybe<Scalars['String']['input']>;
  dateFormat?: InputMaybe<Scalars['String']['input']>;
  legalCitations?: InputMaybe<Scalars['Boolean']['input']>;
  numberFormat?: InputMaybe<Scalars['String']['input']>;
};

/** Preferred time of day for demo */
export type PreferredTimeSlot = 'AFTERNOON' | 'EVENING' | 'MORNING';

export type PublishDocumentInputV2 = {
  documentId: Scalars['ID']['input'];
  publishedBy: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Get a backup by ID (admin only) */
  adminBackup?: Maybe<Backup>;
  /** Get backup statistics (admin only) */
  adminBackupStats: BackupStats;
  /** Get all backups (admin only) */
  adminBackups: Array<Backup>;
  /** Advanced search with boolean operators (AND, OR, NOT) and field-specific search */
  advancedSearchLegalRulings: AdvancedLegalRulingSearchResponse;
  /** Generate a report of users affected by empty messages */
  affectedUsersForEmptyMessages: AffectedUsersReport;
  /** Search legal rulings across multiple sources (LOCAL, SAOS, ISAP) with relevance ranking */
  aggregatedSearchLegalRulings: AggregatedLegalRulingSearchResponse;
  aiUsageMetrics: AiUsageMetrics;
  analyticsDashboard: AnalyticsDashboard;
  /** Analyze all empty assistant messages in the database */
  analyzeEmptyMessages: EmptyMessagesSummary;
  /** Analyze all empty chat sessions (messageCount = 0) */
  analyzeEmptySessions: Array<EmptySessionAnalysis>;
  auditLog: AuditLog;
  auditLogAggregate: Array<AuditLogAggregateResponse>;
  auditLogs: AuditLogConnection;
  /** Check if the current user can access a specific feature */
  canAccessFeature: Scalars['Boolean']['output'];
  /** Get a single chat message by ID with proper type resolution */
  chatMessageById?: Maybe<ChatMessageInterface>;
  /** Get all messages for a chat session in sequence order */
  chatMessages: Array<ChatMessage>;
  /** Get chat messages for a session with proper type resolution based on message type */
  chatMessagesBySession: Array<ChatMessageInterface>;
  chatSessionAggregate: Array<ChatSessionAggregateResponse>;
  chatSessionById: ChatSession;
  /** Get a chat session with all its messages */
  chatSessionDetail?: Maybe<ChatSession>;
  /** Get chat sessions for a user with filtering and sorting */
  chatSessions: Array<ChatSession>;
  chatSessionsList: ChatSessionConnection;
  /** Check if email is already registered (admin only) */
  checkEmailExists?: Maybe<CheckEmailExistsResult>;
  /** Check the current user quota for a specific resource */
  checkQuota: CheckQuotaResponse;
  /** Get the active clarification session for a specific query */
  clarificationSessionByQuery?: Maybe<ClarificationSession>;
  /** Get all clarification sessions in a specific state */
  clarificationSessionsByState: Array<ClarificationSession>;
  /** Get all clarification sessions for a user session */
  clarificationSessionsByUserSession: Array<ClarificationSession>;
  /** Count legal rulings matching filter criteria */
  countLegalRulings: Scalars['Int']['output'];
  /** Debug endpoint to inspect conversation history for a session */
  debugConversationHistory: ChatSessionDebugInfo;
  demoRequest: DemoRequest;
  demoRequestAggregate: Array<DemoRequestAggregateResponse>;
  demoRequestAnalytics: DemoRequestAnalytics;
  demoRequests: DemoRequestConnection;
  /** Get detailed information about a Temporal schedule */
  describeSchedule?: Maybe<ScheduleDetails>;
  documentComment: DocumentComment;
  documentCommentAggregate: Array<DocumentCommentAggregateResponse>;
  documentComments: DocumentCommentConnection;
  /** Get the latest version of a document */
  documentLatestVersion?: Maybe<DocumentVersion>;
  documentMetrics: DocumentMetrics;
  documentQueueMetrics: DocumentQueueMetrics;
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
  /** Get empty assistant messages for a specific session */
  emptyMessagesForSession: Array<EmptyMessageAnalysis>;
  /** Get empty assistant messages for a specific user */
  emptyMessagesForUser: Array<EmptyMessageAnalysis>;
  /** Get empty sessions count for monitoring (alert if threshold exceeded) */
  emptySessionsMetrics: EmptySessionsMetrics;
  /** Filter legal rulings by multiple criteria */
  filterLegalRulings: Array<LegalRuling>;
  getActiveUsersCount: ActiveUsersCount;
  /** Get formatted context for AI processing from a clarification session */
  getClarificationContext?: Maybe<Scalars['String']['output']>;
  getDocumentGenerationMetrics: DocumentGenerationMetrics;
  getQueryVolume: Array<AnalyticsTimeSeriesPoint>;
  getTotalDocumentCount: DocumentMetrics;
  getTotalTokenUsage: Array<TokenUsageBreakdown>;
  getUserGrowthStats: UserGrowthStats;
  /** Check if the given roles have a specific permission */
  hasPermission: PermissionCheckResult;
  inAppNotification: InAppNotification;
  inAppNotificationAggregate: Array<InAppNotificationAggregateResponse>;
  inAppNotifications: InAppNotificationConnection;
  langfuseDebugConfig?: Maybe<LangfuseDebugConfig>;
  langfuseLatencyMetrics?: Maybe<Array<AgentLatencyMetrics>>;
  langfuseTokenUsageByAgent?: Maybe<Array<TokenUsageByAgent>>;
  langfuseTraceDetail?: Maybe<LangfuseTraceDetail>;
  /** Get the URL to view a specific trace in Langfuse dashboard */
  langfuseTraceUrl?: Maybe<Scalars['String']['output']>;
  langfuseTraces?: Maybe<TracesListResponse>;
  langfuseUserAttribution?: Maybe<Array<UserTraceAttribution>>;
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
  /** Check the status of localStorage migration for the current user */
  localStorageMigrationStatus: LocalStorageMigrationStatus;
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
  recentDocumentActivity: RecentDocumentActivity;
  /** Get recent notifications for a user */
  recentNotifications: Array<InAppNotification>;
  /** Get a role by ID */
  role?: Maybe<Role>;
  /** Get a role by name */
  roleByName?: Maybe<Role>;
  /** Get all roles in the system */
  roles: Array<Role>;
  /** Full-text search across chat messages with relevance ranking and highlighting */
  searchChatContent: ChatContentSearchResponse;
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
  /** Get comprehensive system health status for admin dashboard */
  systemHealth: SystemHealthResponse;
  systemHealthMetrics: SystemHealthMetrics;
  systemSetting?: Maybe<SystemSetting>;
  systemSettings: Array<SystemSetting>;
  systemSettingsByCategory: Array<SystemSetting>;
  /** Get detailed information about a Temporal schedule by ID */
  temporalSchedule?: Maybe<ScheduleDetails>;
  /** List all Temporal schedules with pagination */
  temporalSchedules: ScheduleListResult;
  /** Get the current status of Temporal workers */
  temporalWorkerStatus: WorkerStatusResult;
  tokenUsageAnalytics: TokenUsageAnalytics;
  tokenUsageByOperation: Array<TokenUsageByOperation>;
  tokenUsageExport: TokenUsageExport;
  tokenUsageTrend: Array<TokenUsageTrend>;
  topUsersByUsage: Scalars['String']['output'];
  /** Get current 2FA settings and status */
  twoFactorSettings?: Maybe<TwoFactorSettings>;
  /** Get count of unread notifications for a user */
  unreadNotificationCount: Scalars['Int']['output'];
  usageStats: UsageStatsResponse;
  /** Get a user by ID (admin only) */
  user?: Maybe<User>;
  userGrowthMetrics: UserGrowthMetrics;
  userPreference: UserPreferences;
  userPreferences: UserPreferencesConnection;
  userPreferencesAggregate: Array<UserPreferencesAggregateResponse>;
  userSession: UserSession;
  userSessionAggregate: Array<UserSessionAggregateResponse>;
  userSessions: UserSessionConnection;
  userTokenLeaderboard: Array<UserTokenUsage>;
  userUsageRecords: Array<AiUsageRecord>;
  /** Get all users with filtering, sorting, and paging (admin only) */
  users: Array<User>;
  /** Validate an API key and check if it has the required scopes */
  validateApiKey: ValidateApiKeyResponse;
  /** Get a webhook by ID */
  webhook: Webhook;
  /** Get recent deliveries for a webhook */
  webhookDeliveries: Array<WebhookDelivery>;
  /** Get webhook statistics for the current user */
  webhookStats: WebhookStats;
};

export type QueryAdminBackupArgs = {
  id: Scalars['ID']['input'];
};

export type QueryAdminBackupsArgs = {
  limit?: InputMaybe<Scalars['Float']['input']>;
  offset?: InputMaybe<Scalars['Float']['input']>;
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

export type QueryCanAccessFeatureArgs = {
  featureKey: Scalars['String']['input'];
};

export type QueryChatMessageByIdArgs = {
  messageId: Scalars['ID']['input'];
};

export type QueryChatMessagesArgs = {
  sessionId: Scalars['ID']['input'];
};

export type QueryChatMessagesBySessionArgs = {
  sessionId: Scalars['ID']['input'];
};

export type QueryChatSessionAggregateArgs = {
  filter?: InputMaybe<ChatSessionAggregateFilter>;
};

export type QueryChatSessionByIdArgs = {
  id: Scalars['ID']['input'];
};

export type QueryChatSessionDetailArgs = {
  sessionId: Scalars['ID']['input'];
};

export type QueryChatSessionsArgs = {
  includeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  mode?: InputMaybe<ChatMode>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryChatSessionsListArgs = {
  filter?: ChatSessionFilter;
  paging?: CursorPaging;
  sorting?: Array<ChatSessionSort>;
};

export type QueryCheckEmailExistsArgs = {
  email: Scalars['String']['input'];
};

export type QueryCheckQuotaArgs = {
  input: CheckQuotaInput;
};

export type QueryClarificationSessionByQueryArgs = {
  queryId: Scalars['String']['input'];
};

export type QueryClarificationSessionsByStateArgs = {
  state: ClarificationState;
};

export type QueryClarificationSessionsByUserSessionArgs = {
  sessionId: Scalars['String']['input'];
};

export type QueryCountLegalRulingsArgs = {
  input?: InputMaybe<FilterLegalRulingsInput>;
};

export type QueryDebugConversationHistoryArgs = {
  sessionId: Scalars['ID']['input'];
};

export type QueryDemoRequestArgs = {
  id: Scalars['ID']['input'];
};

export type QueryDemoRequestAggregateArgs = {
  filter?: InputMaybe<DemoRequestAggregateFilter>;
};

export type QueryDemoRequestAnalyticsArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryDemoRequestsArgs = {
  filter?: DemoRequestFilter;
  paging?: CursorPaging;
  sorting?: Array<DemoRequestSort>;
};

export type QueryDescribeScheduleArgs = {
  scheduleId: Scalars['String']['input'];
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

export type QueryEmptyMessagesForSessionArgs = {
  sessionId: Scalars['ID']['input'];
};

export type QueryEmptyMessagesForUserArgs = {
  userId: Scalars['ID']['input'];
};

export type QueryEmptySessionsMetricsArgs = {
  alertThreshold?: InputMaybe<Scalars['Float']['input']>;
};

export type QueryFilterLegalRulingsArgs = {
  input: FilterLegalRulingsInput;
};

export type QueryGetClarificationContextArgs = {
  sessionId: Scalars['String']['input'];
};

export type QueryGetDocumentGenerationMetricsArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryGetQueryVolumeArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryGetTotalDocumentCountArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryGetTotalTokenUsageArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryGetUserGrowthStatsArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryHasPermissionArgs = {
  input: CheckPermissionInput;
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

export type QueryLangfuseLatencyMetricsArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type QueryLangfuseTokenUsageByAgentArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type QueryLangfuseTraceDetailArgs = {
  traceId: Scalars['String']['input'];
};

export type QueryLangfuseTraceUrlArgs = {
  traceId: Scalars['String']['input'];
};

export type QueryLangfuseTracesArgs = {
  input?: InputMaybe<TracesListInput>;
};

export type QueryLangfuseUserAttributionArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Float']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
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

export type QueryRecentDocumentActivityArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryRecentNotificationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
  userId: Scalars['String']['input'];
};

export type QueryRoleArgs = {
  id: Scalars['String']['input'];
};

export type QueryRoleByNameArgs = {
  name: Scalars['String']['input'];
};

export type QuerySearchChatContentArgs = {
  contextLength?: InputMaybe<Scalars['Int']['input']>;
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  dateTo?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  mode?: InputMaybe<ChatMode>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
  role?: InputMaybe<MessageRole>;
  sessionTitle?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
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

export type QueryTemporalScheduleArgs = {
  scheduleId: Scalars['String']['input'];
};

export type QueryTemporalSchedulesArgs = {
  input?: InputMaybe<ScheduleListInput>;
};

export type QueryTokenUsageAnalyticsArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryTokenUsageByOperationArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryTokenUsageExportArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
};

export type QueryTokenUsageTrendArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
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

export type QueryUserTokenLeaderboardArgs = {
  input?: InputMaybe<DashboardAnalyticsInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
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
  filter?: InputMaybe<UserFilter>;
  paging?: InputMaybe<UserPaging>;
  sorting?: InputMaybe<Array<UserSort>>;
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

export type RecentDocumentActivity = {
  __typename?: 'RecentDocumentActivity';
  /** Documents currently being generated */
  currentlyGenerating: Array<DocumentActivityEntry>;
  fetchedAt: Scalars['DateTime']['output'];
  recentCompletions: Array<DocumentActivityEntry>;
  recentFailures: Array<DocumentActivityEntry>;
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

export type RegenerateBackupCodesResponse = {
  __typename?: 'RegenerateBackupCodesResponse';
  /** New backup codes for account recovery (show only once) */
  codes: Array<Scalars['String']['output']>;
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

export type RemovePermissionInput = {
  permission: Scalars['String']['input'];
  roleId: Scalars['String']['input'];
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

export type ResumeScheduleInput = {
  /** Optional reason for resuming (logged to audit trail) */
  reason?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the schedule to resume */
  scheduleId: Scalars['String']['input'];
};

export type Role = {
  __typename?: 'Role';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  inheritsFrom?: Maybe<Scalars['String']['output']>;
  isSystemRole: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Permission>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type RulingMetadata = {
  __typename?: 'RulingMetadata';
  keywords?: Maybe<Array<Scalars['String']['output']>>;
  legalArea?: Maybe<Scalars['String']['output']>;
  relatedCases?: Maybe<Array<Scalars['String']['output']>>;
  sourceReference?: Maybe<Scalars['String']['output']>;
};

export type SaveChatMessageInput = {
  /** Citations (for assistant messages) */
  citations?: InputMaybe<Array<ChatCitationInput>>;
  /** Message content */
  content: Scalars['String']['input'];
  /** Additional metadata (for assistant messages) */
  metadata?: InputMaybe<ChatMessageMetadataInput>;
  /** Message role (USER or ASSISTANT) */
  role: Scalars['String']['input'];
  /** The session ID */
  sessionId: Scalars['ID']['input'];
  /** Type of message (text, clarification_question, clarification_answer, citation, error) */
  type?: InputMaybe<ChatMessageType>;
};

export type ScheduleActionDetails = {
  __typename?: 'ScheduleActionDetails';
  /** JSON string of arguments passed to workflow */
  args?: Maybe<Scalars['String']['output']>;
  /** Task queue for executions */
  taskQueue: Scalars['String']['output'];
  /** Workflow ID template */
  workflowId: Scalars['String']['output'];
  /** Workflow type being executed */
  workflowType: Scalars['String']['output'];
};

export type ScheduleActionInput = {
  /** JSON string of arguments to pass to the workflow */
  args?: InputMaybe<Scalars['String']['input']>;
  /** Task queue to dispatch workflows to */
  taskQueue: Scalars['String']['input'];
  /** Type of action (currently only startWorkflow is supported) */
  type: Scalars['String']['input'];
  /** Workflow ID template for each execution */
  workflowId: Scalars['String']['input'];
  /** Workflow type to execute */
  workflowType: Scalars['String']['input'];
};

export type ScheduleDeletionResult = {
  __typename?: 'ScheduleDeletionResult';
  /** Message describing the deletion result */
  message?: Maybe<Scalars['String']['output']>;
  /** The ID of the deleted schedule */
  scheduleId: Scalars['ID']['output'];
  /** Whether the deletion was successful */
  success: Scalars['Boolean']['output'];
};

export type ScheduleDemoInput = {
  demoRequestId: Scalars['ID']['input'];
  scheduledTime: Scalars['DateTime']['input'];
};

export type ScheduleDetails = {
  __typename?: 'ScheduleDetails';
  /** Action the schedule performs */
  action?: Maybe<ScheduleActionDetails>;
  /** Whether the schedule exists */
  exists: Scalars['Boolean']['output'];
  /** Number of failed actions */
  failedActions?: Maybe<Scalars['String']['output']>;
  /** ISO datetime of last run */
  lastRunAt?: Maybe<Scalars['String']['output']>;
  /** Number of missed actions */
  missedActions?: Maybe<Scalars['String']['output']>;
  /** ISO datetime of next run */
  nextRunAt?: Maybe<Scalars['String']['output']>;
  /** Overlap policy */
  overlap?: Maybe<ScheduleOverlapPolicy>;
  /** Whether the schedule is currently paused */
  paused?: Maybe<Scalars['Boolean']['output']>;
  /** Schedule ID */
  scheduleId: Scalars['ID']['output'];
  /** Schedule specification */
  spec?: Maybe<ScheduleSpecDetails>;
  /** Schedule state information */
  state?: Maybe<ScheduleStateInfo>;
  /** Number of successful actions */
  successfulActions?: Maybe<Scalars['String']['output']>;
  /** Total number of actions taken */
  totalActions?: Maybe<Scalars['String']['output']>;
};

export type ScheduleListInput = {
  /** Maximum number of results to return */
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  /** Continuation token from previous page */
  pageToken?: InputMaybe<Scalars['String']['input']>;
};

export type ScheduleListResult = {
  __typename?: 'ScheduleListResult';
  /** Continuation token for pagination */
  nextPageToken?: Maybe<Scalars['String']['output']>;
  /** List of schedule IDs */
  scheduleIds: Array<Scalars['String']['output']>;
  /** Total number of schedules */
  totalCount: Scalars['Int']['output'];
};

/** How to handle overlapping schedule executions */
export type ScheduleOverlapPolicy = 'ALLOW_ALL' | 'BUFFER_ONE' | 'SKIP';

export type SchedulePoliciesInput = {
  /** Catchup window for missed runs (duration string, e.g., "1 day") */
  catchupWindow?: InputMaybe<Scalars['String']['input']>;
  /** How to handle overlapping executions */
  overlap?: InputMaybe<ScheduleOverlapPolicy>;
  /** Whether to pause on failure */
  pauseOnFailure?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ScheduleSpecDetails = {
  __typename?: 'ScheduleSpecDetails';
  /** Cron expression (if calendar-based) */
  cronExpression?: Maybe<Scalars['String']['output']>;
  /** End time */
  endTime?: Maybe<Scalars['String']['output']>;
  /** Interval in seconds (if interval-based) */
  intervalSeconds?: Maybe<Scalars['Float']['output']>;
  /** Start time */
  startTime?: Maybe<Scalars['String']['output']>;
  /** Timezone */
  timezone?: Maybe<Scalars['String']['output']>;
};

export type ScheduleSpecInput = {
  /** Cron expression for execution schedule (e.g., "0 2 * * *" for daily at 2 AM) */
  cronExpression?: InputMaybe<Scalars['String']['input']>;
  /** End time (ISO 8601 string) */
  endTime?: InputMaybe<Scalars['String']['input']>;
  /** Start time (ISO 8601 string) */
  startTime?: InputMaybe<Scalars['String']['input']>;
  /** Timezone identifier (IANA tz database) */
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type ScheduleStateInfo = {
  __typename?: 'ScheduleStateInfo';
  /** Number of failed actions */
  failedActions?: Maybe<Scalars['Float']['output']>;
  /** Number of missed actions */
  missedActions?: Maybe<Scalars['Float']['output']>;
  /** Number of currently running actions */
  runningActions?: Maybe<Scalars['Float']['output']>;
  /** Number of successful actions */
  successfulActions?: Maybe<Scalars['Float']['output']>;
  /** Total number of actions */
  totalActions?: Maybe<Scalars['Float']['output']>;
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

export type SendChatMessageResponse = {
  __typename?: 'SendChatMessageResponse';
  /** Message content */
  content: Scalars['String']['output'];
  /** Timestamp when the message was created */
  createdAt: Scalars['String']['output'];
  /** The created message ID */
  messageId: Scalars['ID']['output'];
  /** Message role (USER or ASSISTANT) */
  role: Scalars['String']['output'];
  /** Sequence order in the conversation */
  sequenceOrder: Scalars['Float']['output'];
  /** The session ID */
  sessionId: Scalars['ID']['output'];
  /** Type of message (text, clarification_question, clarification_answer, citation, error) */
  type?: Maybe<ChatMessageType>;
};

export type SendChatMessageWithAiInput = {
  /** AI response mode (LAWYER or SIMPLE) */
  mode: Scalars['String']['input'];
  /** The user question/message */
  question: Scalars['String']['input'];
  /** Session ID (creates new session if not provided) */
  sessionId?: InputMaybe<Scalars['ID']['input']>;
};

export type SendChatMessageWithAiResponse = {
  __typename?: 'SendChatMessageWithAIResponse';
  /** AI response content (for streaming compatibility) */
  answerMarkdown?: Maybe<Scalars['String']['output']>;
  /** The AI assistant response */
  assistantMessage?: Maybe<SendChatMessageResponse>;
  /** Citations from the AI response */
  citations?: Maybe<Array<ChatCitation>>;
  /** Confidence score of the AI response */
  confidence?: Maybe<Scalars['Float']['output']>;
  /** Key legal terms extracted */
  keyTerms?: Maybe<Array<Scalars['String']['output']>>;
  /** Query type classification */
  queryType?: Maybe<Scalars['String']['output']>;
  /** The session ID */
  sessionId: Scalars['ID']['output'];
  /** The user message that was sent */
  userMessage: SendChatMessageResponse;
};

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

export type ServiceHealth = {
  __typename?: 'ServiceHealth';
  error?: Maybe<Scalars['String']['output']>;
  lastCheck?: Maybe<Scalars['String']['output']>;
  latency?: Maybe<Scalars['Float']['output']>;
  status: ServiceStatus;
};

/** Health status of a service or system component */
export type ServiceStatus = 'DEGRADED' | 'HEALTHY' | 'UNHEALTHY';

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

export type StringFilter = {
  eq?: InputMaybe<Scalars['String']['input']>;
  iLike?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubmitClarificationAnswersInput = {
  /** Array of question-answer pairs */
  answers: Array<ClarificationAnswerInput>;
  /** The message ID containing the clarification questions */
  clarificationMessageId: Scalars['ID']['input'];
  /** The session ID */
  sessionId: Scalars['ID']['input'];
};

export type SubmitClarificationAnswersResponse = {
  __typename?: 'SubmitClarificationAnswersResponse';
  /** The clarification message ID that was updated */
  clarificationMessageId: Scalars['ID']['output'];
  /** Whether the submission was successful */
  success: Scalars['Boolean']['output'];
  /** The created user message containing the answers */
  userMessage?: Maybe<SendChatMessageResponse>;
  /** Validation errors if submission failed */
  validationErrors?: Maybe<Array<ClarificationValidationError>>;
};

export type SubmitLegalQueryInput = {
  /** The legal question to be answered by the AI */
  question: Scalars['String']['input'];
  /** Session ID for the user submitting the query (optional - will be auto-created if not provided) */
  sessionId?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Real-time notifications when a new message is added */
  chatMessageAdded: ChatMessage;
  /** Real-time updates when a chat session is modified */
  chatSessionUpdated: ChatSession;
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

export type SubscriptionChatMessageAddedArgs = {
  sessionId: Scalars['ID']['input'];
};

export type SubscriptionChatSessionUpdatedArgs = {
  sessionId: Scalars['ID']['input'];
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

export type SystemHealthResponse = {
  __typename?: 'SystemHealthResponse';
  errors: ErrorTrackingStatus;
  services?: Maybe<Array<ServiceHealth>>;
  status: ServiceStatus;
  timestamp: Scalars['String']['output'];
  uptime: Scalars['Float']['output'];
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

/** Standard text message from user or assistant */
export type TextChatMessage = ChatMessageInterface & {
  __typename?: 'TextChatMessage';
  citations?: Maybe<Array<ChatCitation>>;
  /** Message content */
  content: Scalars['String']['output'];
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Unique message identifier */
  messageId: Scalars['ID']['output'];
  /** Role of the message sender */
  role: MessageRole;
  /** Sequence order in conversation */
  sequenceOrder: Scalars['Float']['output'];
  /** Session ID */
  sessionId: Scalars['ID']['output'];
  /** Message type discriminator for resolving concrete types */
  type?: Maybe<ChatMessageType>;
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

export type TokenUsage = {
  __typename?: 'TokenUsage';
  /** Completion tokens used */
  completionTokens: Scalars['Int']['output'];
  /** Prompt tokens used */
  promptTokens: Scalars['Int']['output'];
  /** Estimated cost in USD */
  totalCost: Scalars['Float']['output'];
  /** Total tokens used */
  totalTokens: Scalars['Int']['output'];
};

export type TokenUsageAnalytics = {
  __typename?: 'TokenUsageAnalytics';
  /** All-time total cost */
  allTimeCost: Scalars['Float']['output'];
  /** All-time total tokens */
  allTimeTokens: Scalars['Int']['output'];
  /** Detected usage anomalies */
  anomalies: Array<UsageAnomaly>;
  /** Average tokens per query */
  avgTokensPerQuery: Scalars['Int']['output'];
  /** Breakdown by operation type */
  byOperation: Array<TokenUsageByOperation>;
  generatedAt: Scalars['DateTime']['output'];
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  /** Cost this month */
  thisMonthCost: Scalars['Float']['output'];
  /** Tokens this month */
  thisMonthTokens: Scalars['Int']['output'];
  /** Cost today */
  todayCost: Scalars['Float']['output'];
  /** Tokens today */
  todayTokens: Scalars['Int']['output'];
  /** Token usage over time */
  trend: Array<TokenUsageTrend>;
  /** Per-user usage leaderboard */
  userLeaderboard: Array<UserTokenUsage>;
};

export type TokenUsageBreakdown = {
  __typename?: 'TokenUsageBreakdown';
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  /** Total cost in USD */
  totalCost: Scalars['Float']['output'];
  /** Total requests */
  totalRequests: Scalars['Int']['output'];
  /** Total tokens used */
  totalTokens: Scalars['Int']['output'];
};

export type TokenUsageByAgent = {
  __typename?: 'TokenUsageByAgent';
  /** Agent type */
  agentType: AgentType;
  /** Average tokens per request */
  avgTokensPerRequest: Scalars['Int']['output'];
  /** Total request count */
  requestCount: Scalars['Int']['output'];
  /** Percentage of total tokens */
  tokenPercentage: Scalars['Float']['output'];
  /** Total cost in USD */
  totalCost: Scalars['Float']['output'];
  /** Total tokens used */
  totalTokens: Scalars['Int']['output'];
};

export type TokenUsageByOperation = {
  __typename?: 'TokenUsageByOperation';
  /** Average tokens per request */
  avgTokensPerRequest: Scalars['Int']['output'];
  /** Percentage of total cost */
  costPercentage: Scalars['Float']['output'];
  operationType: AiOperationType;
  requestCount: Scalars['Int']['output'];
  /** Percentage of total tokens */
  tokenPercentage: Scalars['Float']['output'];
  totalCost: Scalars['Float']['output'];
  totalTokens: Scalars['Int']['output'];
};

export type TokenUsageExport = {
  __typename?: 'TokenUsageExport';
  exportedAt: Scalars['DateTime']['output'];
  operationBreakdown: Array<TokenUsageByOperation>;
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  trendData: Array<TokenUsageTrend>;
  userUsageData: Array<UserTokenUsage>;
};

export type TokenUsageTrend = {
  __typename?: 'TokenUsageTrend';
  /** Percentage change from previous period */
  changePercentage?: Maybe<Scalars['Float']['output']>;
  cost: Scalars['Float']['output'];
  requests: Scalars['Int']['output'];
  timestamp: Scalars['DateTime']['output'];
  tokens: Scalars['Int']['output'];
};

/** Level of a Langfuse trace */
export type TraceLevel = 'DEBUG' | 'DEFAULT' | 'ERROR' | 'INFO' | 'WARNING';

export type TraceObservation = {
  __typename?: 'TraceObservation';
  /** Duration in milliseconds */
  duration?: Maybe<Scalars['Float']['output']>;
  /** Timestamp when observation ended */
  endTime?: Maybe<Scalars['Timestamp']['output']>;
  /** Error message if failed */
  errorMessage?: Maybe<Scalars['String']['output']>;
  /** Unique observation ID */
  id: Scalars['ID']['output'];
  /** Input prompt(s) */
  input?: Maybe<Array<Scalars['String']['output']>>;
  /** Observation level */
  level?: Maybe<TraceLevel>;
  /** Metadata associated with the observation */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Model used (for generations) */
  model?: Maybe<Scalars['String']['output']>;
  /** Observation name */
  name: Scalars['String']['output'];
  /** Output completion(s) */
  output?: Maybe<Array<Scalars['String']['output']>>;
  /** Parent observation ID if nested */
  parentObservationId?: Maybe<Scalars['String']['output']>;
  /** Stack trace if failed */
  stackTrace?: Maybe<Scalars['String']['output']>;
  /** Timestamp when observation started */
  startTime: Scalars['Timestamp']['output'];
  /** Observation status */
  status?: Maybe<TraceStatus>;
  /** Type of observation */
  type: ObservationType;
  /** Token usage (for generations) */
  usage?: Maybe<TokenUsage>;
};

/** Status of a Langfuse trace */
export type TraceStatus = 'ERROR' | 'SUCCESS' | 'UNKNOWN';

export type TracesListInput = {
  /** Filter by agent type */
  agentType?: InputMaybe<AgentType>;
  /** End date for filtering (ISO 8601) */
  endDate?: InputMaybe<Scalars['String']['input']>;
  /** Number of items per page */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Page number (1-indexed) */
  page?: InputMaybe<Scalars['Int']['input']>;
  /** Search term for filtering */
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  /** Filter by session ID */
  sessionId?: InputMaybe<Scalars['String']['input']>;
  /** Sort field */
  sortBy?: InputMaybe<Scalars['String']['input']>;
  /** Sort order (ASC or DESC) */
  sortOrder?: InputMaybe<Scalars['String']['input']>;
  /** Start date for filtering (ISO 8601) */
  startDate?: InputMaybe<Scalars['String']['input']>;
  /** Filter by trace status */
  status?: InputMaybe<TraceStatus>;
  /** Filter by user ID */
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type TracesListResponse = {
  __typename?: 'TracesListResponse';
  /** When this data was fetched */
  fetchedAt: Scalars['Timestamp']['output'];
  /** Number of items per page */
  limit: Scalars['Int']['output'];
  /** Current page number (1-indexed) */
  page: Scalars['Int']['output'];
  /** Total number of traces matching the filter */
  totalCount: Scalars['Int']['output'];
  /** Total number of pages */
  totalPages: Scalars['Int']['output'];
  /** List of traces */
  traces: Array<LangfuseTrace>;
};

export type TwoFactorSettings = {
  __typename?: 'TwoFactorSettings';
  /** True if 2FA is fully enabled */
  enabled: Scalars['Boolean']['output'];
  /** Timestamp when 2FA was last verified/enabled */
  lastVerifiedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Number of remaining backup codes */
  remainingBackupCodes?: Maybe<Scalars['Int']['output']>;
  /** Current 2FA status */
  status: TwoFactorStatus;
};

/** Status of two-factor authentication */
export type TwoFactorStatus = 'DISABLED' | 'ENABLED' | 'PENDING';

export type UpdateApiKeyInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rateLimitPerMinute?: InputMaybe<Scalars['Int']['input']>;
  scopes?: InputMaybe<Array<ApiKeyScope>>;
};

export type UpdateChatSessionInput = {
  /** Update pinned status */
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  /** Update AI response mode */
  mode?: InputMaybe<ChatMode>;
  /** Update session title */
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateChatSessionTitleInput = {
  /** Session ID to update */
  sessionId: Scalars['ID']['input'];
  /** New title for the session */
  title: Scalars['String']['input'];
};

export type UpdateClarificationStatusInput = {
  /** Whether the clarification has been answered */
  answered: Scalars['Boolean']['input'];
  /** JSON string of question-answer pairs */
  answers?: InputMaybe<Scalars['String']['input']>;
  /** The message ID containing the clarification */
  messageId: Scalars['ID']['input'];
};

export type UpdateClarificationStatusResponse = {
  __typename?: 'UpdateClarificationStatusResponse';
  /** The message ID that was updated */
  messageId: Scalars['ID']['output'];
  /** The updated clarification status */
  status?: Maybe<Scalars['String']['output']>;
  /** Whether the update was successful */
  success: Scalars['Boolean']['output'];
};

export type UpdateDemoRequestStatusInput = {
  demoRequestId: Scalars['ID']['input'];
  status: Scalars['String']['input'];
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

export type UpdateOneChatSessionInput = {
  /** The id of the record to update */
  id: Scalars['ID']['input'];
  /** The update to apply. */
  update: UpdateChatSessionInput;
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

export type UpdateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
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

export type UsageAnomaly = {
  __typename?: 'UsageAnomaly';
  /** Type of anomaly detected */
  anomalyType: Scalars['String']['output'];
  /** Description of the anomaly */
  description: Scalars['String']['output'];
  detectedAt: Scalars['DateTime']['output'];
  /** Deviation from expected (percentage) */
  deviationPercentage: Scalars['Float']['output'];
  /** Expected/normal token count */
  expectedValue: Scalars['Float']['output'];
  /** Token count that triggered the anomaly */
  tokenCount: Scalars['Int']['output'];
  userEmail?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
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
  stripeCustomerId?: Maybe<Scalars['String']['output']>;
  twoFactorEnabled: Scalars['Boolean']['output'];
  twoFactorVerifiedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

export type UserFilter = {
  email?: InputMaybe<StringFilter>;
  isActive?: InputMaybe<BooleanFilter>;
  role?: InputMaybe<StringFilter>;
  username?: InputMaybe<StringFilter>;
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

export type UserGrowthStats = {
  __typename?: 'UserGrowthStats';
  /** Average growth rate */
  avgGrowthRate: Scalars['Float']['output'];
  newUsersPerPeriod: Array<AnalyticsTimeSeriesPoint>;
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  /** Total new users in range */
  totalNewUsers: Scalars['Int']['output'];
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

export type UserPaging = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
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
  direction: Scalars['String']['input'];
  field: Scalars['String']['input'];
};

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

export type UserTokenUsage = {
  __typename?: 'UserTokenUsage';
  /** Average tokens per request */
  avgTokensPerRequest: Scalars['Float']['output'];
  periodEnd: Scalars['DateTime']['output'];
  periodStart: Scalars['DateTime']['output'];
  /** Number of requests */
  requestCount: Scalars['Int']['output'];
  /** Total cost in USD */
  totalCost: Scalars['Float']['output'];
  /** Total tokens used by this user */
  totalTokens: Scalars['Int']['output'];
  userEmail?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
  userName?: Maybe<Scalars['String']['output']>;
};

export type UserTraceAttribution = {
  __typename?: 'UserTraceAttribution';
  /** First trace timestamp */
  firstTraceAt: Scalars['Timestamp']['output'];
  /** Last trace timestamp */
  lastTraceAt: Scalars['Timestamp']['output'];
  /** Total cost in USD */
  totalCost: Scalars['Float']['output'];
  /** Total tokens used */
  totalTokens: Scalars['Int']['output'];
  /** Total trace count */
  traceCount: Scalars['Int']['output'];
  /** User email */
  userEmail?: Maybe<Scalars['String']['output']>;
  /** User ID */
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

export type VerifyTwoFactorSetupInput = {
  /** The 6-digit TOTP token from authenticator app */
  token: Scalars['String']['input'];
};

export type VerifyTwoFactorSetupResponse = {
  __typename?: 'VerifyTwoFactorSetupResponse';
  /** Backup codes for account recovery */
  backupCodes?: Maybe<Array<Scalars['String']['output']>>;
  /** True if verification was successful */
  success: Scalars['Boolean']['output'];
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

export type WorkerStatusEntry = {
  __typename?: 'WorkerStatusEntry';
  /** Whether the worker is running */
  running: Scalars['Boolean']['output'];
  /** Task queue this worker processes */
  taskQueue: Scalars['String']['output'];
  /** Worker uptime in seconds */
  uptimeSeconds?: Maybe<Scalars['Int']['output']>;
  /** Worker ID for tracking */
  workerId?: Maybe<Scalars['String']['output']>;
};

export type WorkerStatusResult = {
  __typename?: 'WorkerStatusResult';
  /** Number of workers currently running */
  runningWorkers: Scalars['Int']['output'];
  /** Overall health status */
  status?: Maybe<Scalars['String']['output']>;
  /** Total number of workers */
  totalWorkers: Scalars['Int']['output'];
  /** List of worker status entries */
  workers: Array<WorkerStatusEntry>;
};

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
  twoFactorEnabled: boolean;
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
  twoFactorEnabled: boolean;
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
  paging?: InputMaybe<UserPaging>;
}>;

export type GetAdminUsersQuery = {
  __typename?: 'Query';
  users: Array<{
    __typename?: 'User';
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
    twoFactorEnabled: boolean;
    createdAt: Date;
  }>;
};

export type GetAdminUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetAdminUserQuery = {
  __typename?: 'Query';
  user?:
    | {
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
        twoFactorEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
      }
    | null
    | undefined;
};

export type AdminCreateUserMutationVariables = Exact<{
  input: CreateUserInput;
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
    twoFactorEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type AdminUpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
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
    twoFactorEnabled: boolean;
    createdAt: Date;
  };
};

export type AdminDeleteUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type AdminDeleteUserMutation = {
  __typename?: 'Mutation';
  deleteOneUser: { __typename?: 'User'; id: string; email: string };
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
    twoFactorEnabled: boolean;
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
    twoFactorEnabled: boolean;
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
    twoFactorEnabled: boolean;
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
    twoFactorEnabled: boolean;
    createdAt: Date;
  };
};

export type AdminForceDisableTwoFactorMutationVariables = Exact<{
  input: AdminForceDisableTwoFactorInput;
}>;

export type AdminForceDisableTwoFactorMutation = {
  __typename?: 'Mutation';
  adminForceDisableTwoFactor: {
    __typename?: 'AdminForceDisableTwoFactorResponse';
    id: string;
    twoFactorEnabled: boolean;
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

export type ClarificationSessionFragmentFragment = {
  __typename?: 'ClarificationSession';
  id: string;
  state: ClarificationState;
  originalQuery: string;
  questionsAsked: Array<string>;
  rounds: number;
  accumulatedContext?: Array<string> | null | undefined;
  finalQueryId?: string | null | undefined;
  completedAt?: Date | null | undefined;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  answersReceived: Array<{
    __typename?: 'ClarificationAnswer';
    question: string;
    answer: string;
    question_type: string;
  }>;
};

export type SubmitClarificationAnswersMutationVariables = Exact<{
  input: SubmitClarificationAnswersInput;
}>;

export type SubmitClarificationAnswersMutation = {
  __typename?: 'Mutation';
  submitClarificationAnswers: {
    __typename?: 'SubmitClarificationAnswersResponse';
    success: boolean;
    clarificationMessageId: string;
    validationErrors?:
      | Array<{
          __typename?: 'ClarificationValidationError';
          code: string;
          message: string;
          questionId: string;
        }>
      | null
      | undefined;
    userMessage?:
      | {
          __typename?: 'SendChatMessageResponse';
          messageId: string;
          role: string;
          content: string;
          sequenceOrder: number;
          createdAt: string;
        }
      | null
      | undefined;
  };
};

export type CancelClarificationSessionMutationVariables = Exact<{
  input: CancelClarificationSessionInput;
}>;

export type CancelClarificationSessionMutation = {
  __typename?: 'Mutation';
  cancelClarificationSession: {
    __typename?: 'ClarificationSession';
    id: string;
    state: ClarificationState;
    originalQuery: string;
    questionsAsked: Array<string>;
    rounds: number;
    accumulatedContext?: Array<string> | null | undefined;
    finalQueryId?: string | null | undefined;
    completedAt?: Date | null | undefined;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    answersReceived: Array<{
      __typename?: 'ClarificationAnswer';
      question: string;
      answer: string;
      question_type: string;
    }>;
  };
};

export type GetClarificationSessionByQueryQueryVariables = Exact<{
  queryId: Scalars['String']['input'];
}>;

export type GetClarificationSessionByQueryQuery = {
  __typename?: 'Query';
  clarificationSessionByQuery?:
    | {
        __typename?: 'ClarificationSession';
        id: string;
        state: ClarificationState;
        originalQuery: string;
        questionsAsked: Array<string>;
        rounds: number;
        accumulatedContext?: Array<string> | null | undefined;
        finalQueryId?: string | null | undefined;
        completedAt?: Date | null | undefined;
        expiresAt: Date;
        createdAt: Date;
        updatedAt: Date;
        answersReceived: Array<{
          __typename?: 'ClarificationAnswer';
          question: string;
          answer: string;
          question_type: string;
        }>;
      }
    | null
    | undefined;
};

export type ChatMessageFragmentFragment = {
  __typename?: 'ChatMessage';
  messageId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  rawContent?: string | null | undefined;
  sequenceOrder: number;
  createdAt: Date;
  citations?:
    | Array<{
        __typename?: 'ChatCitation';
        source: string;
        url?: string | null | undefined;
        article?: string | null | undefined;
        excerpt?: string | null | undefined;
      }>
    | null
    | undefined;
  metadata?:
    | {
        __typename?: 'ChatMessageMetadata';
        confidence?: number | null | undefined;
        model?: string | null | undefined;
        queryType?: string | null | undefined;
        keyTerms?: Array<string> | null | undefined;
        language?: string | null | undefined;
      }
    | null
    | undefined;
};

export type ChatSessionFragmentFragment = {
  __typename?: 'ChatSession';
  id: string;
  title?: string | null | undefined;
  mode: ChatMode;
  messageCount: number;
  lastMessageAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  deletedAt?: Date | null | undefined;
};

export type GetChatMessagesQueryVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;

export type GetChatMessagesQuery = {
  __typename?: 'Query';
  chatMessages: Array<{
    __typename?: 'ChatMessage';
    messageId: string;
    sessionId: string;
    role: MessageRole;
    content: string;
    rawContent?: string | null | undefined;
    sequenceOrder: number;
    createdAt: Date;
    citations?:
      | Array<{
          __typename?: 'ChatCitation';
          source: string;
          url?: string | null | undefined;
          article?: string | null | undefined;
          excerpt?: string | null | undefined;
        }>
      | null
      | undefined;
    metadata?:
      | {
          __typename?: 'ChatMessageMetadata';
          confidence?: number | null | undefined;
          model?: string | null | undefined;
          queryType?: string | null | undefined;
          keyTerms?: Array<string> | null | undefined;
          language?: string | null | undefined;
        }
      | null
      | undefined;
  }>;
};

export type GetChatSessionQueryVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;

export type GetChatSessionQuery = {
  __typename?: 'Query';
  chatSessionDetail?:
    | {
        __typename?: 'ChatSession';
        id: string;
        title?: string | null | undefined;
        mode: ChatMode;
        messageCount: number;
        lastMessageAt?: Date | null | undefined;
        createdAt: Date;
        updatedAt: Date;
        isPinned: boolean;
        deletedAt?: Date | null | undefined;
      }
    | null
    | undefined;
};

export type GetChatSessionsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
  mode?: InputMaybe<ChatMode>;
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  includeDeleted?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type GetChatSessionsQuery = {
  __typename?: 'Query';
  chatSessions: Array<{
    __typename?: 'ChatSession';
    id: string;
    title?: string | null | undefined;
    mode: ChatMode;
    messageCount: number;
    lastMessageAt?: Date | null | undefined;
    createdAt: Date;
    updatedAt: Date;
    isPinned: boolean;
    deletedAt?: Date | null | undefined;
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
  twoFactorEnabled: boolean;
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
  accessToken?: string | null | undefined;
  refreshToken?: string | null | undefined;
  requiresTwoFactor: boolean;
  twoFactorTempToken?: string | null | undefined;
  user?:
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
    accessToken?: string | null | undefined;
    refreshToken?: string | null | undefined;
    requiresTwoFactor: boolean;
    twoFactorTempToken?: string | null | undefined;
    user?:
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
};

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;

export type RegisterMutation = {
  __typename?: 'Mutation';
  register: {
    __typename?: 'AuthPayload';
    accessToken?: string | null | undefined;
    refreshToken?: string | null | undefined;
    requiresTwoFactor: boolean;
    twoFactorTempToken?: string | null | undefined;
    user?:
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

export type CompleteTwoFactorLoginMutationVariables = Exact<{
  input: CompleteTwoFactorLoginInput;
}>;

export type CompleteTwoFactorLoginMutation = {
  __typename?: 'Mutation';
  completeTwoFactorLogin: {
    __typename?: 'AuthPayload';
    accessToken?: string | null | undefined;
    refreshToken?: string | null | undefined;
    requiresTwoFactor: boolean;
    twoFactorTempToken?: string | null | undefined;
    user?:
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
};

export type EnableTwoFactorAuthMutationVariables = Exact<{ [key: string]: never }>;

export type EnableTwoFactorAuthMutation = {
  __typename?: 'Mutation';
  enableTwoFactorAuth: {
    __typename?: 'EnableTwoFactorResponse';
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: Array<string>;
  };
};

export type VerifyTwoFactorSetupMutationVariables = Exact<{
  input: VerifyTwoFactorSetupInput;
}>;

export type VerifyTwoFactorSetupMutation = {
  __typename?: 'Mutation';
  verifyTwoFactorSetup: {
    __typename?: 'VerifyTwoFactorSetupResponse';
    success: boolean;
    backupCodes?: Array<string> | null | undefined;
  };
};

export type DisableTwoFactorAuthMutationVariables = Exact<{
  input: DisableTwoFactorInput;
}>;

export type DisableTwoFactorAuthMutation = {
  __typename?: 'Mutation';
  disableTwoFactorAuth: boolean;
};

export type RegenerateBackupCodesMutationVariables = Exact<{ [key: string]: never }>;

export type RegenerateBackupCodesMutation = {
  __typename?: 'Mutation';
  regenerateBackupCodes: { __typename?: 'RegenerateBackupCodesResponse'; codes: Array<string> };
};

export type SubmitDemoRequestMutationVariables = Exact<{
  input: DemoRequestInput;
}>;

export type SubmitDemoRequestMutation = {
  __typename?: 'Mutation';
  submitDemoRequest: {
    __typename?: 'DemoRequestResponse';
    success: boolean;
    message: string;
    referenceId?: string | null | undefined;
    qualified?: boolean | null | undefined;
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

export type TwoFactorSettingsQueryVariables = Exact<{ [key: string]: never }>;

export type TwoFactorSettingsQuery = {
  __typename?: 'Query';
  twoFactorSettings?:
    | {
        __typename?: 'TwoFactorSettings';
        status: TwoFactorStatus;
        enabled: boolean;
        remainingBackupCodes?: number | null | undefined;
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
  paging?: InputMaybe<UserPaging>;
  sorting?: InputMaybe<Array<UserSort> | UserSort>;
}>;

export type GetUsersQuery = {
  __typename?: 'Query';
  users: Array<{
    __typename?: 'User';
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt?: Date | null | undefined;
    stripeCustomerId?: string | null | undefined;
    twoFactorEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    id: string;
    email: string;
    username?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    isActive: boolean;
    role: string;
  }>;
};

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetUserQuery = {
  __typename?: 'Query';
  user?:
    | {
        __typename?: 'User';
        disclaimerAccepted: boolean;
        disclaimerAcceptedAt?: Date | null | undefined;
        stripeCustomerId?: string | null | undefined;
        twoFactorEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: string;
        email: string;
        username?: string | null | undefined;
        firstName?: string | null | undefined;
        lastName?: string | null | undefined;
        isActive: boolean;
        role: string;
      }
    | null
    | undefined;
};

export type CreateOneUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;

export type CreateOneUserMutation = {
  __typename?: 'Mutation';
  createOneUser: {
    __typename?: 'User';
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt?: Date | null | undefined;
    stripeCustomerId?: string | null | undefined;
    twoFactorEnabled: boolean;
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
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
}>;

export type UpdateOneUserMutation = {
  __typename?: 'Mutation';
  updateOneUser: {
    __typename?: 'User';
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt?: Date | null | undefined;
    stripeCustomerId?: string | null | undefined;
    twoFactorEnabled: boolean;
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
  id: Scalars['ID']['input'];
}>;

export type DeleteOneUserMutation = {
  __typename?: 'Mutation';
  deleteOneUser: { __typename?: 'User'; id: string; email: string };
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
  twoFactorEnabled
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
  twoFactorEnabled
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
export const ClarificationSessionFragmentFragmentDoc = `
    fragment ClarificationSessionFragment on ClarificationSession {
  id
  state
  originalQuery
  questionsAsked
  answersReceived {
    question
    answer
    question_type
  }
  rounds
  accumulatedContext
  finalQueryId
  completedAt
  expiresAt
  createdAt
  updatedAt
}
    `;
export const ChatMessageFragmentFragmentDoc = `
    fragment ChatMessageFragment on ChatMessage {
  messageId
  sessionId
  role
  content
  rawContent
  citations {
    source
    url
    article
    excerpt
  }
  metadata {
    confidence
    model
    queryType
    keyTerms
    language
  }
  sequenceOrder
  createdAt
}
    `;
export const ChatSessionFragmentFragmentDoc = `
    fragment ChatSessionFragment on ChatSession {
  id
  title
  mode
  messageCount
  lastMessageAt
  createdAt
  updatedAt
  isPinned
  deletedAt
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
export const PageInfoFragmentFragmentDoc = `
    fragment PageInfoFragment on PageInfo {
  hasNextPage
  hasPreviousPage
  startCursor
  endCursor
}
    `;
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
export const UserDetailFragmentFragmentDoc = `
    fragment UserDetailFragment on User {
  ...UserFragment
  disclaimerAccepted
  disclaimerAcceptedAt
  stripeCustomerId
  twoFactorEnabled
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
  requiresTwoFactor
  twoFactorTempToken
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
    query GetAdminUsers($filter: UserFilter, $sorting: [UserSort!], $paging: UserPaging) {
  users(filter: $filter, sorting: $sorting, paging: $paging) {
    ...AdminUserMinimalFragment
  }
}
    ${AdminUserMinimalFragmentFragmentDoc}`;

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
    mutation AdminCreateUser($input: CreateUserInput!) {
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
    mutation AdminUpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateOneUser(id: $id, input: $input) {
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
    mutation AdminDeleteUser($id: ID!) {
  deleteOneUser(id: $id) {
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

export const AdminForceDisableTwoFactorDocument = `
    mutation AdminForceDisableTwoFactor($input: AdminForceDisableTwoFactorInput!) {
  adminForceDisableTwoFactor(input: $input) {
    id
    twoFactorEnabled
  }
}
    `;

export const useAdminForceDisableTwoFactorMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    AdminForceDisableTwoFactorMutation,
    TError,
    AdminForceDisableTwoFactorMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    AdminForceDisableTwoFactorMutation,
    TError,
    AdminForceDisableTwoFactorMutationVariables,
    TContext
  >({
    mutationKey: ['AdminForceDisableTwoFactor'],
    mutationFn: (variables?: AdminForceDisableTwoFactorMutationVariables) =>
      fetcher<AdminForceDisableTwoFactorMutation, AdminForceDisableTwoFactorMutationVariables>(
        AdminForceDisableTwoFactorDocument,
        variables,
      )(),
    ...options,
  });
};

useAdminForceDisableTwoFactorMutation.fetcher = (
  variables: AdminForceDisableTwoFactorMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<AdminForceDisableTwoFactorMutation, AdminForceDisableTwoFactorMutationVariables>(
    AdminForceDisableTwoFactorDocument,
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

export const SubmitClarificationAnswersDocument = `
    mutation SubmitClarificationAnswers($input: SubmitClarificationAnswersInput!) {
  submitClarificationAnswers(input: $input) {
    success
    clarificationMessageId
    validationErrors {
      code
      message
      questionId
    }
    userMessage {
      messageId
      role
      content
      sequenceOrder
      createdAt
    }
  }
}
    `;

export const useSubmitClarificationAnswersMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    SubmitClarificationAnswersMutation,
    TError,
    SubmitClarificationAnswersMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    SubmitClarificationAnswersMutation,
    TError,
    SubmitClarificationAnswersMutationVariables,
    TContext
  >({
    mutationKey: ['SubmitClarificationAnswers'],
    mutationFn: (variables?: SubmitClarificationAnswersMutationVariables) =>
      fetcher<SubmitClarificationAnswersMutation, SubmitClarificationAnswersMutationVariables>(
        SubmitClarificationAnswersDocument,
        variables,
      )(),
    ...options,
  });
};

useSubmitClarificationAnswersMutation.fetcher = (
  variables: SubmitClarificationAnswersMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<SubmitClarificationAnswersMutation, SubmitClarificationAnswersMutationVariables>(
    SubmitClarificationAnswersDocument,
    variables,
    options,
  );

export const CancelClarificationSessionDocument = `
    mutation CancelClarificationSession($input: CancelClarificationSessionInput!) {
  cancelClarificationSession(input: $input) {
    ...ClarificationSessionFragment
  }
}
    ${ClarificationSessionFragmentFragmentDoc}`;

export const useCancelClarificationSessionMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CancelClarificationSessionMutation,
    TError,
    CancelClarificationSessionMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CancelClarificationSessionMutation,
    TError,
    CancelClarificationSessionMutationVariables,
    TContext
  >({
    mutationKey: ['CancelClarificationSession'],
    mutationFn: (variables?: CancelClarificationSessionMutationVariables) =>
      fetcher<CancelClarificationSessionMutation, CancelClarificationSessionMutationVariables>(
        CancelClarificationSessionDocument,
        variables,
      )(),
    ...options,
  });
};

useCancelClarificationSessionMutation.fetcher = (
  variables: CancelClarificationSessionMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<CancelClarificationSessionMutation, CancelClarificationSessionMutationVariables>(
    CancelClarificationSessionDocument,
    variables,
    options,
  );

export const GetClarificationSessionByQueryDocument = `
    query GetClarificationSessionByQuery($queryId: String!) {
  clarificationSessionByQuery(queryId: $queryId) {
    ...ClarificationSessionFragment
  }
}
    ${ClarificationSessionFragmentFragmentDoc}`;

export const useGetClarificationSessionByQueryQuery = <
  TData = GetClarificationSessionByQueryQuery,
  TError = unknown,
>(
  variables: GetClarificationSessionByQueryQueryVariables,
  options?: Omit<
    UseQueryOptions<GetClarificationSessionByQueryQuery, TError, TData>,
    'queryKey'
  > & {
    queryKey?: UseQueryOptions<GetClarificationSessionByQueryQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetClarificationSessionByQueryQuery, TError, TData>({
    queryKey: ['GetClarificationSessionByQuery', variables],
    queryFn: fetcher<
      GetClarificationSessionByQueryQuery,
      GetClarificationSessionByQueryQueryVariables
    >(GetClarificationSessionByQueryDocument, variables),
    ...options,
  });
};

useGetClarificationSessionByQueryQuery.fetcher = (
  variables: GetClarificationSessionByQueryQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetClarificationSessionByQueryQuery, GetClarificationSessionByQueryQueryVariables>(
    GetClarificationSessionByQueryDocument,
    variables,
    options,
  );

export const GetChatMessagesDocument = `
    query GetChatMessages($sessionId: ID!) {
  chatMessages(sessionId: $sessionId) {
    ...ChatMessageFragment
  }
}
    ${ChatMessageFragmentFragmentDoc}`;

export const useGetChatMessagesQuery = <TData = GetChatMessagesQuery, TError = unknown>(
  variables: GetChatMessagesQueryVariables,
  options?: Omit<UseQueryOptions<GetChatMessagesQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetChatMessagesQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetChatMessagesQuery, TError, TData>({
    queryKey: ['GetChatMessages', variables],
    queryFn: fetcher<GetChatMessagesQuery, GetChatMessagesQueryVariables>(
      GetChatMessagesDocument,
      variables,
    ),
    ...options,
  });
};

useGetChatMessagesQuery.fetcher = (
  variables: GetChatMessagesQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetChatMessagesQuery, GetChatMessagesQueryVariables>(
    GetChatMessagesDocument,
    variables,
    options,
  );

export const GetChatSessionDocument = `
    query GetChatSession($sessionId: ID!) {
  chatSessionDetail(sessionId: $sessionId) {
    ...ChatSessionFragment
  }
}
    ${ChatSessionFragmentFragmentDoc}`;

export const useGetChatSessionQuery = <TData = GetChatSessionQuery, TError = unknown>(
  variables: GetChatSessionQueryVariables,
  options?: Omit<UseQueryOptions<GetChatSessionQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetChatSessionQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetChatSessionQuery, TError, TData>({
    queryKey: ['GetChatSession', variables],
    queryFn: fetcher<GetChatSessionQuery, GetChatSessionQueryVariables>(
      GetChatSessionDocument,
      variables,
    ),
    ...options,
  });
};

useGetChatSessionQuery.fetcher = (
  variables: GetChatSessionQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetChatSessionQuery, GetChatSessionQueryVariables>(
    GetChatSessionDocument,
    variables,
    options,
  );

export const GetChatSessionsDocument = `
    query GetChatSessions($limit: Int = 20, $offset: Int = 0, $sortBy: String = "lastMessageAt", $sortOrder: String = "DESC", $mode: ChatMode, $isPinned: Boolean, $search: String, $includeDeleted: Boolean = false) {
  chatSessions(
    limit: $limit
    offset: $offset
    sortBy: $sortBy
    sortOrder: $sortOrder
    mode: $mode
    isPinned: $isPinned
    search: $search
    includeDeleted: $includeDeleted
  ) {
    ...ChatSessionFragment
  }
}
    ${ChatSessionFragmentFragmentDoc}`;

export const useGetChatSessionsQuery = <TData = GetChatSessionsQuery, TError = unknown>(
  variables?: GetChatSessionsQueryVariables,
  options?: Omit<UseQueryOptions<GetChatSessionsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetChatSessionsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<GetChatSessionsQuery, TError, TData>({
    queryKey: variables === undefined ? ['GetChatSessions'] : ['GetChatSessions', variables],
    queryFn: fetcher<GetChatSessionsQuery, GetChatSessionsQueryVariables>(
      GetChatSessionsDocument,
      variables,
    ),
    ...options,
  });
};

useGetChatSessionsQuery.fetcher = (
  variables?: GetChatSessionsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<GetChatSessionsQuery, GetChatSessionsQueryVariables>(
    GetChatSessionsDocument,
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

export const CompleteTwoFactorLoginDocument = `
    mutation CompleteTwoFactorLogin($input: CompleteTwoFactorLoginInput!) {
  completeTwoFactorLogin(input: $input) {
    ...AuthPayloadFragment
  }
}
    ${AuthPayloadFragmentFragmentDoc}`;

export const useCompleteTwoFactorLoginMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    CompleteTwoFactorLoginMutation,
    TError,
    CompleteTwoFactorLoginMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    CompleteTwoFactorLoginMutation,
    TError,
    CompleteTwoFactorLoginMutationVariables,
    TContext
  >({
    mutationKey: ['CompleteTwoFactorLogin'],
    mutationFn: (variables?: CompleteTwoFactorLoginMutationVariables) =>
      fetcher<CompleteTwoFactorLoginMutation, CompleteTwoFactorLoginMutationVariables>(
        CompleteTwoFactorLoginDocument,
        variables,
      )(),
    ...options,
  });
};

useCompleteTwoFactorLoginMutation.fetcher = (
  variables: CompleteTwoFactorLoginMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<CompleteTwoFactorLoginMutation, CompleteTwoFactorLoginMutationVariables>(
    CompleteTwoFactorLoginDocument,
    variables,
    options,
  );

export const EnableTwoFactorAuthDocument = `
    mutation EnableTwoFactorAuth {
  enableTwoFactorAuth {
    secret
    qrCodeDataUrl
    backupCodes
  }
}
    `;

export const useEnableTwoFactorAuthMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    EnableTwoFactorAuthMutation,
    TError,
    EnableTwoFactorAuthMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    EnableTwoFactorAuthMutation,
    TError,
    EnableTwoFactorAuthMutationVariables,
    TContext
  >({
    mutationKey: ['EnableTwoFactorAuth'],
    mutationFn: (variables?: EnableTwoFactorAuthMutationVariables) =>
      fetcher<EnableTwoFactorAuthMutation, EnableTwoFactorAuthMutationVariables>(
        EnableTwoFactorAuthDocument,
        variables,
      )(),
    ...options,
  });
};

useEnableTwoFactorAuthMutation.fetcher = (
  variables?: EnableTwoFactorAuthMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<EnableTwoFactorAuthMutation, EnableTwoFactorAuthMutationVariables>(
    EnableTwoFactorAuthDocument,
    variables,
    options,
  );

export const VerifyTwoFactorSetupDocument = `
    mutation VerifyTwoFactorSetup($input: VerifyTwoFactorSetupInput!) {
  verifyTwoFactorSetup(input: $input) {
    success
    backupCodes
  }
}
    `;

export const useVerifyTwoFactorSetupMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    VerifyTwoFactorSetupMutation,
    TError,
    VerifyTwoFactorSetupMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    VerifyTwoFactorSetupMutation,
    TError,
    VerifyTwoFactorSetupMutationVariables,
    TContext
  >({
    mutationKey: ['VerifyTwoFactorSetup'],
    mutationFn: (variables?: VerifyTwoFactorSetupMutationVariables) =>
      fetcher<VerifyTwoFactorSetupMutation, VerifyTwoFactorSetupMutationVariables>(
        VerifyTwoFactorSetupDocument,
        variables,
      )(),
    ...options,
  });
};

useVerifyTwoFactorSetupMutation.fetcher = (
  variables: VerifyTwoFactorSetupMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<VerifyTwoFactorSetupMutation, VerifyTwoFactorSetupMutationVariables>(
    VerifyTwoFactorSetupDocument,
    variables,
    options,
  );

export const DisableTwoFactorAuthDocument = `
    mutation DisableTwoFactorAuth($input: DisableTwoFactorInput!) {
  disableTwoFactorAuth(input: $input)
}
    `;

export const useDisableTwoFactorAuthMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    DisableTwoFactorAuthMutation,
    TError,
    DisableTwoFactorAuthMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    DisableTwoFactorAuthMutation,
    TError,
    DisableTwoFactorAuthMutationVariables,
    TContext
  >({
    mutationKey: ['DisableTwoFactorAuth'],
    mutationFn: (variables?: DisableTwoFactorAuthMutationVariables) =>
      fetcher<DisableTwoFactorAuthMutation, DisableTwoFactorAuthMutationVariables>(
        DisableTwoFactorAuthDocument,
        variables,
      )(),
    ...options,
  });
};

useDisableTwoFactorAuthMutation.fetcher = (
  variables: DisableTwoFactorAuthMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<DisableTwoFactorAuthMutation, DisableTwoFactorAuthMutationVariables>(
    DisableTwoFactorAuthDocument,
    variables,
    options,
  );

export const RegenerateBackupCodesDocument = `
    mutation RegenerateBackupCodes {
  regenerateBackupCodes {
    codes
  }
}
    `;

export const useRegenerateBackupCodesMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    RegenerateBackupCodesMutation,
    TError,
    RegenerateBackupCodesMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    RegenerateBackupCodesMutation,
    TError,
    RegenerateBackupCodesMutationVariables,
    TContext
  >({
    mutationKey: ['RegenerateBackupCodes'],
    mutationFn: (variables?: RegenerateBackupCodesMutationVariables) =>
      fetcher<RegenerateBackupCodesMutation, RegenerateBackupCodesMutationVariables>(
        RegenerateBackupCodesDocument,
        variables,
      )(),
    ...options,
  });
};

useRegenerateBackupCodesMutation.fetcher = (
  variables?: RegenerateBackupCodesMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<RegenerateBackupCodesMutation, RegenerateBackupCodesMutationVariables>(
    RegenerateBackupCodesDocument,
    variables,
    options,
  );

export const SubmitDemoRequestDocument = `
    mutation SubmitDemoRequest($input: DemoRequestInput!) {
  submitDemoRequest(input: $input) {
    success
    message
    referenceId
    qualified
  }
}
    `;

export const useSubmitDemoRequestMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<
    SubmitDemoRequestMutation,
    TError,
    SubmitDemoRequestMutationVariables,
    TContext
  >,
) => {
  return useMutation<
    SubmitDemoRequestMutation,
    TError,
    SubmitDemoRequestMutationVariables,
    TContext
  >({
    mutationKey: ['SubmitDemoRequest'],
    mutationFn: (variables?: SubmitDemoRequestMutationVariables) =>
      fetcher<SubmitDemoRequestMutation, SubmitDemoRequestMutationVariables>(
        SubmitDemoRequestDocument,
        variables,
      )(),
    ...options,
  });
};

useSubmitDemoRequestMutation.fetcher = (
  variables: SubmitDemoRequestMutationVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<SubmitDemoRequestMutation, SubmitDemoRequestMutationVariables>(
    SubmitDemoRequestDocument,
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

export const TwoFactorSettingsDocument = `
    query TwoFactorSettings {
  twoFactorSettings {
    status
    enabled
    remainingBackupCodes
  }
}
    `;

export const useTwoFactorSettingsQuery = <TData = TwoFactorSettingsQuery, TError = unknown>(
  variables?: TwoFactorSettingsQueryVariables,
  options?: Omit<UseQueryOptions<TwoFactorSettingsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<TwoFactorSettingsQuery, TError, TData>['queryKey'];
  },
) => {
  return useQuery<TwoFactorSettingsQuery, TError, TData>({
    queryKey: variables === undefined ? ['TwoFactorSettings'] : ['TwoFactorSettings', variables],
    queryFn: fetcher<TwoFactorSettingsQuery, TwoFactorSettingsQueryVariables>(
      TwoFactorSettingsDocument,
      variables,
    ),
    ...options,
  });
};

useTwoFactorSettingsQuery.fetcher = (
  variables?: TwoFactorSettingsQueryVariables,
  options?: RequestInit['headers'],
) =>
  fetcher<TwoFactorSettingsQuery, TwoFactorSettingsQueryVariables>(
    TwoFactorSettingsDocument,
    variables,
    options,
  );

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
    query GetUsers($filter: UserFilter, $paging: UserPaging, $sorting: [UserSort!]) {
  users(filter: $filter, paging: $paging, sorting: $sorting) {
    ...UserDetailFragment
  }
}
    ${UserDetailFragmentFragmentDoc}`;

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
    mutation CreateOneUser($input: CreateUserInput!) {
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
    mutation UpdateOneUser($id: ID!, $input: UpdateUserInput!) {
  updateOneUser(id: $id, input: $input) {
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
    mutation DeleteOneUser($id: ID!) {
  deleteOneUser(id: $id) {
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
