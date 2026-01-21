"use client";

import { useTranslate, useList } from "@refinedev/core";
import Link from "next/link";
import { useMemo } from "react";
import { StatCard, ActivityTimeline } from "@/components/dashboard";

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

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  GENERATING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const translate = useTranslate();

  // Fetch recent documents
  const { data: documentsData, isLoading: isLoadingDocuments } = useList<LegalDocument>({
    resource: "documents",
    pagination: {
      pageSize: 5,
    },
    sorters: [
      {
        field: "createdAt",
        order: "desc",
      },
    ],
  });

  // Fetch all documents for statistics
  const { data: allDocumentsData, isLoading: isLoadingStats } = useList<LegalDocument>({
    resource: "documents",
    pagination: {
      pageSize: 1000,
    },
  });

  // Fetch recent audit logs for activity timeline
  const { data: auditLogsData, isLoading: isLoadingAuditLogs } = useList<AuditLog>({
    resource: "audit_logs",
    pagination: {
      pageSize: 10,
    },
    sorters: [
      {
        field: "createdAt",
        order: "desc",
      },
    ],
  });

  const recentDocuments = documentsData?.data || [];
  const allDocuments = allDocumentsData?.data || [];
  const auditLogs = auditLogsData?.data || [];

  // Calculate statistics
  const stats: DashboardStats = useMemo(() => {
    const total = allDocuments.length;
    const completed = allDocuments.filter((doc) => doc.status === "COMPLETED").length;
    const draft = allDocuments.filter((doc) => doc.status === "DRAFT").length;
    const generating = allDocuments.filter((doc) => doc.status === "GENERATING").length;

    return {
      totalDocuments: total,
      completedDocuments: completed,
      draftDocuments: draft,
      generatingDocuments: generating,
    };
  }, [allDocuments]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {translate("dashboard.title")}
        </h1>
        <p className="text-gray-600">
          {translate("dashboard.subtitle")}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={translate("dashboard.stats.totalDocuments")}
          value={stats.totalDocuments}
          loading={isLoadingStats}
          iconColor="text-blue-600"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title={translate("dashboard.stats.completed")}
          value={stats.completedDocuments}
          loading={isLoadingStats}
          iconColor="text-green-600"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title={translate("dashboard.stats.drafts")}
          value={stats.draftDocuments}
          loading={isLoadingStats}
          iconColor="text-gray-600"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <StatCard
          title={translate("dashboard.stats.generating")}
          value={stats.generatingDocuments}
          loading={isLoadingStats}
          iconColor="text-blue-600"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {translate("dashboard.recentDocuments.title")}
              </h2>
            </div>
            <div className="p-6">
              {isLoadingDocuments ? (
                <div className="text-center py-8 text-gray-500">
                  {translate("loading")}
                </div>
              ) : recentDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {translate("dashboard.recentDocuments.noDocuments")}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDocuments.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/documents/show/${doc.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {doc.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {translate(`documents.types.${doc.type}`)}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[doc.status] || "bg-gray-100"}`}
                        >
                          {translate(`documents.statuses.${doc.status}`)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {recentDocuments.length > 0 && (
                <div className="mt-6 text-center">
                  <Link
                    href="/documents"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    {translate("dashboard.recentDocuments.viewAll")} →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Activity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {translate("dashboard.quickActions.title")}
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <Link
                  href="/documents/create"
                  className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  {translate("dashboard.quickActions.createDocument")}
                </Link>
                <Link
                  href="/documents"
                  className="block w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
                >
                  {translate("dashboard.quickActions.viewDocuments")}
                </Link>
                <Link
                  href="/audit-logs"
                  className="block w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
                >
                  {translate("dashboard.quickActions.auditLogs")}
                </Link>
              </div>

              {/* Help Section */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">
                  {translate("dashboard.help.title")}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {translate("dashboard.help.description")}
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  {translate("dashboard.help.learnMore")} →
                </button>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <ActivityTimeline
            activities={auditLogs}
            loading={isLoadingAuditLogs}
            maxItems={5}
          />
        </div>
      </div>
    </div>
  );
}
