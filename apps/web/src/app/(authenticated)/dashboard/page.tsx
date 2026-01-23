'use client';

import { useTranslate, useList, useGetIdentity } from '@refinedev/core';
import Link from 'next/link';
import { useMemo } from 'react';
import { StatCard, ActivityTimeline } from '@/components/dashboard';
import {
  StatsRowSkeleton,
  RecentDocumentsSkeleton,
  ActivityTimelineSkeleton,
} from '@/components/dashboard/DashboardSkeleton';
import { Plus, MessageSquare, FileText, Search, ArrowRight } from 'lucide-react';
import { cn } from '@legal/ui';

interface LegalDocument {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  totalDocuments: number;
  completedDocuments: number;
  draftDocuments: number;
  generatingDocuments: number;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  author?: {
    name?: string;
    email?: string;
  };
  createdAt: string;
  meta?: Record<string, unknown>;
}

interface UserIdentity {
  firstName: string;
  lastName: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  GENERATING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function DashboardPage() {
  const translate = useTranslate();
  const { data: user } = useGetIdentity<UserIdentity>();

  // Fetch recent documents
  const { result: documentsResult, query: documentsQuery } = useList<LegalDocument>({
    resource: 'documents',
    pagination: { pageSize: 5 },
    sorters: [{ field: 'createdAt', order: 'desc' }],
  });

  // Fetch stats (optimized queries)
  const { result: totalResult } = useList({ resource: 'documents', pagination: { pageSize: 1 } });
  const { result: completedResult } = useList({
    resource: 'documents',
    pagination: { pageSize: 1 },
    filters: [{ field: 'status', operator: 'eq', value: 'COMPLETED' }],
  });
  const { result: draftResult } = useList({
    resource: 'documents',
    pagination: { pageSize: 1 },
    filters: [{ field: 'status', operator: 'eq', value: 'DRAFT' }],
  });
  const { result: generatingResult } = useList({
    resource: 'documents',
    pagination: { pageSize: 1 },
    filters: [{ field: 'status', operator: 'eq', value: 'GENERATING' }],
  });

  // Fetch recent audit logs
  const { result: auditLogsResult, query: auditLogsQuery } = useList<AuditLog>({
    resource: 'audit_logs',
    pagination: { pageSize: 10 },
    sorters: [{ field: 'createdAt', order: 'desc' }],
  });

  const recentDocuments = documentsResult?.data || [];
  const auditLogs = auditLogsResult?.data || [];

  const stats = useMemo(
    () => ({
      totalDocuments: totalResult?.total ?? 0,
      completedDocuments: completedResult?.total ?? 0,
      draftDocuments: draftResult?.total ?? 0,
      generatingDocuments: generatingResult?.total ?? 0,
    }),
    [totalResult, completedResult, draftResult, generatingResult],
  );

  // Check if any stats are still loading
  const statsLoading =
    totalResult === undefined ||
    completedResult === undefined ||
    draftResult === undefined ||
    generatingResult === undefined;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-2xl border border-primary/10">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {translate('dashboard.welcome', { name: user?.firstName || 'Lawyer' })}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {translate(
            'dashboard.subtitle',
            'Your AI-powered legal assistant is ready. What would you like to achieve today?',
          )}
        </p>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/documents/create"
          className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            Create Document
          </h3>
          <p className="text-muted-foreground mb-4">
            Start a new legal document, contract, or pleading using AI assistance.
          </p>
          <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            Start Drafting <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/chat"
          className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
            Legal Q&A
          </h3>
          <p className="text-muted-foreground mb-4">
            Ask complex legal questions and get instant, cited answers from the AI.
          </p>
          <div className="flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            Ask a Question <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/documents"
          className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 mb-4 group-hover:scale-110 transition-transform">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2 group-hover:text-orange-600 transition-colors">
            Browse Cases
          </h3>
          <p className="text-muted-foreground mb-4">
            Search through your existing cases, documents, and generated drafts.
          </p>
          <div className="flex items-center text-sm font-medium text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            Search Now <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents & Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Mini Stats Row */}
          {statsLoading ? (
            <StatsRowSkeleton />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-sm text-muted-foreground">Total Docs</p>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedDocuments}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold text-orange-600">{stats.draftDocuments}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-sm text-muted-foreground">Generating</p>
                <p className="text-2xl font-bold text-blue-600">{stats.generatingDocuments}</p>
              </div>
            </div>
          )}

          {/* Recent Docs List */}
          {documentsQuery.isLoading ? (
            <RecentDocumentsSkeleton count={5} />
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-semibold">Recent Documents</h2>
                <Link href="/documents" className="text-sm text-primary hover:underline">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-border">
                {recentDocuments.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No documents found. Create one to get started!
                  </div>
                ) : (
                  recentDocuments.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/documents/show/${doc.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {doc.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString()} •{' '}
                            {translate(`documents.types.${doc.type}`)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          statusColors[doc.status],
                        )}
                      >
                        {translate(`documents.statuses.${doc.status}`)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <ActivityTimeline
            activities={auditLogs}
            loading={auditLogsQuery.isLoading}
            maxItems={5}
          />
        </div>
      </div>
    </div>
  );
}
