'use client';

import React, { useState, useEffect, use } from 'react';
import { useCustom } from '@refinedev/core';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Network,
  ChevronDown,
  ChevronRight,
  Copy,
  User,
  Cpu,
  Layers,
  FileText,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@legal/ui';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Types for trace detail
interface TokenUsage {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
}

interface LangfuseDebugConfig {
  enabled: boolean;
  hostUrl?: string;
  traceUrlTemplate?: string;
  dashboardUrl?: string;
}

interface TraceObservation {
  id: string;
  type: 'SPAN' | 'GENERATION' | 'EVENT';
  name: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'DEFAULT';
  status?: 'SUCCESS' | 'ERROR' | 'UNKNOWN';
  parentObservationId?: string;
  usage?: TokenUsage;
  model?: string;
  input?: string[];
  output?: string[];
  errorMessage?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

interface LangfuseTraceDetail {
  id: string;
  name: string;
  timestamp: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status: 'SUCCESS' | 'ERROR' | 'UNKNOWN';
  level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'DEFAULT';
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  model?: string;
  usage?: TokenUsage;
  metadata?: Record<string, any>;
  observations: TraceObservation[];
  errorMessage?: string;
  stackTrace?: string;
  fetchedAt: string;
  agentType: string;
}

// Agent type config
const AGENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  QA_AGENT: {
    label: 'Q&A Agent',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  CLASSIFIER_AGENT: {
    label: 'Classifier',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  DRAFTING_AGENT: {
    label: 'Drafting',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  CLARIFICATION_AGENT: {
    label: 'Clarification',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  WORKFLOW: {
    label: 'Workflow',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  },
  UNKNOWN: {
    label: 'Unknown',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  },
};

// Observation type config
const OBSERVATION_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SPAN: {
    label: 'Span',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    icon: Layers,
  },
  GENERATION: {
    label: 'Generation',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    icon: Cpu,
  },
  EVENT: {
    label: 'Event',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    icon: FileText,
  },
};

// Utility functions
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDuration(ms?: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy HH:mm:ss');
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}

interface TraceDetailPageProps {
  params: Promise<{ traceId: string }>;
}

export default function TraceDetailPage({ params }: TraceDetailPageProps) {
  const router = useRouter();
  const { traceId } = use(params);

  const [expandedObservations, setExpandedObservations] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch Langfuse debug config
  const { result: configResult } = useCustom<{ langfuseDebugConfig: LangfuseDebugConfig | null }>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'langfuseDebugConfig',
        args: {},
        fields: ['langfuseDebugConfig { enabled hostUrl traceUrlTemplate dashboardUrl }'],
      },
    },
    queryOptions: {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  });

  // Fetch trace detail
  const { query, result } = useCustom<{ langfuseTraceDetail: LangfuseTraceDetail | null }>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'langfuseTraceDetail',
        args: { traceId },
        fields: [
          'langfuseTraceDetail { id name timestamp startTime endTime duration status level userId userEmail sessionId model usage { totalTokens promptTokens completionTokens totalCost } metadata observations { id type name startTime endTime duration level status parentObservationId usage { totalTokens promptTokens completionTokens totalCost } model input output errorMessage stackTrace metadata } errorMessage stackTrace fetchedAt agentType }',
        ],
      },
    },
    queryOptions: {
      enabled: !!traceId,
      refetchOnWindowFocus: false,
      refetchInterval: 30000,
    },
  });

  const traceData = result?.data?.langfuseTraceDetail;
  const langfuseConfig = configResult?.data?.langfuseDebugConfig;
  const { refetch, isLoading } = query;

  // Generate Langfuse trace URL
  const langfuseTraceUrl =
    langfuseConfig?.enabled && traceData ? `${langfuseConfig.hostUrl}/trace/${traceData.id}` : null;

  useEffect(() => {
    if (traceData) {
      setLastRefresh(new Date());
    }
  }, [traceData]);

  const toggleObservation = (obsId: string) => {
    setExpandedObservations((prev) => {
      const next = new Set(prev);
      if (next.has(obsId)) {
        next.delete(obsId);
      } else {
        next.add(obsId);
      }
      return next;
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading && !traceData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => router.back()} />
          <h1 className="text-2xl font-bold">Loading trace...</h1>
        </div>
      </div>
    );
  }

  if (!traceData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/ai/traces">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Trace Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>
              Unable to load trace details. The trace may not exist or Langfuse integration may be
              disabled.
            </p>
            <Link href="/admin/ai/traces">
              <Button className="mt-4">Back to Traces</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group observations by parent for tree view
  const rootObservations = traceData.observations.filter((o) => !o.parentObservationId);
  const getChildren = (parentId: string) =>
    traceData.observations.filter((o) => o.parentObservationId === parentId);

  const renderObservation = (obs: TraceObservation, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedObservations.has(obs.id);
    const children = getChildren(obs.id);
    const hasChildren = children.length > 0;
    const typeConfig = OBSERVATION_TYPE_CONFIG[obs.type] || OBSERVATION_TYPE_CONFIG.SPAN;
    const TypeIcon = typeConfig.icon;

    return (
      <div key={obs.id} className="border-l-2 border-muted pl-4 ml-4">
        <div
          className={`py-2 ${depth === 0 ? '' : 'mt-2'}`}
          style={{ marginLeft: depth > 0 ? `${depth * 16}px` : 0 }}
        >
          <div
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => toggleObservation(obs.id)}
          >
            <div className="flex items-center gap-2">
              {hasChildren && (
                <span className="text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
              )}
              <TypeIcon className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{obs.name}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
                {obs.level && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      obs.level === 'ERROR'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : obs.level === 'WARNING'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                    }`}
                  >
                    {obs.level}
                  </span>
                )}
                {obs.status === 'ERROR' && <AlertCircle className="h-4 w-4 text-red-500" />}
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {obs.duration && <span>{formatDuration(obs.duration)}</span>}
                {obs.model && <span className="font-mono text-xs">{obs.model}</span>}
                {obs.usage && (
                  <span>
                    {formatNumber(obs.usage.totalTokens)} tokens
                    {obs.usage.totalCost > 0 && ` (${formatCurrency(obs.usage.totalCost)})`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 ml-8 space-y-3">
              {/* Input */}
              {obs.input && obs.input.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">
                    Input
                  </label>
                  <div className="mt-1 p-3 bg-background rounded border text-sm font-mono overflow-x-auto">
                    {obs.input.map((line, i) => (
                      <div key={i} className="whitespace-pre-wrap break-words">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Output */}
              {obs.output && obs.output.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">
                    Output
                  </label>
                  <div className="mt-1 p-3 bg-background rounded border text-sm overflow-x-auto max-h-64 overflow-y-auto">
                    {obs.output.map((line, i) => (
                      <div key={i} className="whitespace-pre-wrap break-words">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {obs.errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                  <label className="text-xs font-medium text-red-700 dark:text-red-400 uppercase">
                    Error
                  </label>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">{obs.errorMessage}</p>
                  {obs.stackTrace && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-red-600 dark:text-red-300">
                        View stack trace
                      </summary>
                      <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-x-auto">
                        {obs.stackTrace}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Metadata */}
              {obs.metadata && Object.keys(obs.metadata).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">
                    Metadata
                  </label>
                  <div className="mt-1 p-3 bg-background rounded border text-sm overflow-x-auto">
                    <pre className="text-xs">{JSON.stringify(obs.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Token Usage Breakdown */}
              {obs.usage && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                    <div className="text-xs text-muted-foreground">Prompt</div>
                    <div className="font-medium">{formatNumber(obs.usage.promptTokens)}</div>
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
                    <div className="text-xs text-muted-foreground">Completion</div>
                    <div className="font-medium">{formatNumber(obs.usage.completionTokens)}</div>
                  </div>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="font-medium">{formatNumber(obs.usage.totalTokens)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Render children recursively */}
        {isExpanded && children.map((child) => renderObservation(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/ai/traces">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              {traceData.name}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">{traceData.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(traceData.id)}>
            <Copy className="h-4 w-4 mr-2" />
            Copy ID
          </Button>
          {langfuseTraceUrl && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={langfuseTraceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Langfuse
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {traceData.status === 'ERROR' && traceData.errorMessage && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-700 dark:text-red-400">Trace Failed</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {traceData.errorMessage}
                </p>
                {traceData.stackTrace && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer text-red-600 dark:text-red-300">
                      View stack trace
                    </summary>
                    <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900/30 p-3 rounded overflow-x-auto">
                      {traceData.stackTrace}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trace Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {traceData.status === 'SUCCESS' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-lg font-bold ${
                traceData.status === 'SUCCESS'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {traceData.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {AGENT_TYPE_CONFIG[traceData.agentType]?.label || traceData.agentType}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDuration(traceData.duration)}</div>
            <p className="text-xs text-muted-foreground">
              {traceData.startTime && traceData.endTime ? (
                <>
                  {formatDateTime(traceData.startTime)} - {formatDateTime(traceData.endTime)}
                </>
              ) : (
                formatDateTime(traceData.timestamp)
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {traceData.usage ? formatNumber(traceData.usage.totalTokens) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {traceData.usage ? `Cost: ${formatCurrency(traceData.usage.totalCost)}` : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Observations</CardTitle>
            <Layers className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{traceData.observations.length}</div>
            <p className="text-xs text-muted-foreground">
              {traceData.observations.filter((o) => o.type === 'GENERATION').length} generations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User & Session */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              User & Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">User ID:</span>
              <span className="text-sm font-mono">{traceData.userId || '-'}</span>
            </div>
            {traceData.userEmail && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm">{traceData.userEmail}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Session ID:</span>
              <span className="text-sm font-mono">{traceData.sessionId || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Model:</span>
              <span className="text-sm font-mono">{traceData.model || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Token Usage Breakdown */}
        {traceData.usage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Token Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(traceData.usage.promptTokens)}
                  </div>
                  <div className="text-xs text-muted-foreground">Prompt</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatNumber(traceData.usage.completionTokens)}
                  </div>
                  <div className="text-xs text-muted-foreground">Completion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatNumber(traceData.usage.totalTokens)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t text-center">
                <div className="text-sm text-muted-foreground">Total Cost</div>
                <div className="text-xl font-bold">{formatCurrency(traceData.usage.totalCost)}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Observations Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Execution Trace
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setExpandedObservations(new Set(traceData.observations.map((o) => o.id)))
              }
            >
              Expand All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rootObservations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No observations found for this trace.
            </p>
          ) : (
            <div className="space-y-1">{rootObservations.map((obs) => renderObservation(obs))}</div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      {traceData.metadata && Object.keys(traceData.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trace Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
              {JSON.stringify(traceData.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
