'use client';

import { useTranslate, CrudFilter, useCustomMutation, useInvalidate } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { ColumnDef, flexRender } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
  Filter,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Flag,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@legal/ui';
import { cn } from '@legal/ui';
import { ModerationDialog } from './components/moderation-dialog';

// Document types and statuses from the backend
const DOCUMENT_TYPES = ['LAWSUIT', 'COMPLAINT', 'CONTRACT', 'OTHER'] as const;
const DOCUMENT_STATUSES = ['DRAFT', 'GENERATING', 'COMPLETED', 'FAILED'] as const;
const MODERATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

const statusColors: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  GENERATING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const moderationStatusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: <Clock className="h-3 w-3" />,
  },
  APPROVED: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REJECTED: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: <XCircle className="h-3 w-3" />,
  },
};

type LegalDocument = {
  id: string;
  sessionId: string;
  title: string;
  type: string;
  status: string;
  moderationStatus: string | null;
  moderationReason: string | null;
  moderatedById: string | null;
  flaggedAt: string | null;
  moderatedAt: string | null;
  contentRaw: string | null;
  metadata: {
    plaintiffName?: string;
    defendantName?: string;
    claimAmount?: number;
    claimCurrency?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type ModerationDialogState = {
  isOpen: boolean;
  documentId: string | null;
  documentTitle: string | null;
  action: 'flag' | 'approve' | 'reject' | null;
};

export default function AdminDocumentsPage() {
  const translate = useTranslate();
  const invalidate = useInvalidate();

  // Moderation dialog state
  const [moderationDialog, setModerationDialog] = useState<ModerationDialogState>({
    isOpen: false,
    documentId: null,
    documentTitle: null,
    action: null,
  });

  // Moderation mutation
  const moderationMutation = useCustomMutation();

  const handleModerationAction = async (
    documentId: string,
    action: 'flag' | 'approve' | 'reject',
    reason?: string,
  ) => {
    const mutations = {
      flag: 'flagDocumentForModeration',
      approve: 'approveDocument',
      reject: 'rejectDocument',
    };

    try {
      // For flag and approve, reason is optional; for reject, reason is required
      const input =
        action === 'reject'
          ? { documentId, reason: reason || '' }
          : reason
            ? { documentId, reason }
            : { documentId };

      await moderationMutation.mutateAsync({
        operation: mutations[action],
        fields: ['documentId', 'action', 'reason', 'userNotified'],
        variables: { input },
      } as any);

      // Invalidate documents list to refresh data
      invalidate({
        resource: 'documents',
        invalidates: ['list'],
      });

      // Close dialog
      setModerationDialog({ isOpen: false, documentId: null, documentTitle: null, action: null });
    } catch (error) {
      console.error('Moderation action failed:', error);
      throw error;
    }
  };

  const openModerationDialog = (
    documentId: string,
    documentTitle: string,
    action: 'flag' | 'approve' | 'reject',
  ) => {
    setModerationDialog({
      isOpen: true,
      documentId,
      documentTitle,
      action,
    });
  };

  const closeModerationDialog = () => {
    setModerationDialog({
      isOpen: false,
      documentId: null,
      documentTitle: null,
      action: null,
    });
  };

  // Filter state
  const [titleFilter, setTitleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [moderationFilter, setModerationFilter] = useState<string>('');
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const columns = useMemo<ColumnDef<LegalDocument>[]>(
    () => [
      {
        id: 'title',
        accessorKey: 'title',
        header: () => translate('documents.fields.title'),
        cell: ({ getValue, row }) => (
          <Link
            href={`/documents/show/${row.original.id}`}
            className="text-primary hover:underline font-medium block max-w-md truncate"
          >
            {getValue() as string}
          </Link>
        ),
        enableSorting: true,
      },
      {
        id: 'type',
        accessorKey: 'type',
        header: () => translate('documents.fields.type'),
        cell: ({ getValue }) => (
          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            {translate(`documents.types.${getValue()}`)}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => translate('documents.fields.status'),
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return (
            <span
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                statusColors[status] || 'bg-muted',
              )}
            >
              {translate(`documents.statuses.${status}`)}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        id: 'moderationStatus',
        accessorKey: 'moderationStatus',
        header: () => 'Moderation',
        cell: ({ getValue }) => {
          const status = getValue() as string | null;
          if (!status) {
            return <span className="text-muted-foreground text-xs">—</span>;
          }
          const config = moderationStatusConfig[status];
          return (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                config.color,
              )}
            >
              {config.icon}
              {status}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: () => translate('documents.fields.createdAt'),
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return <span className="text-muted-foreground text-sm">{date.toLocaleDateString()}</span>;
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: () => translate('table.actions'),
        cell: ({ row }) => {
          const document = row.original;
          const isPending = document.moderationStatus === 'PENDING';
          const isApproved = document.moderationStatus === 'APPROVED';
          const isRejected = document.moderationStatus === 'REJECTED';
          const hasModerationStatus = isPending || isApproved || isRejected;

          return (
            <div className="flex gap-2">
              <Link href={`/documents/show/${document.id}`}>
                <Button variant="ghost" size="sm" title="View document">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>

              {/* Moderation actions */}
              {!hasModerationStatus && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openModerationDialog(document.id, document.title, 'flag')}
                  title="Flag for moderation"
                  className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              )}

              {isPending && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModerationDialog(document.id, document.title, 'approve')}
                    title="Approve document"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModerationDialog(document.id, document.title, 'reject')}
                    title="Reject document"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Can re-flag approved/rejected documents */}
              {(isApproved || isRejected) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openModerationDialog(document.id, document.title, 'flag')}
                  title="Flag for review again"
                  className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [translate],
  );

  // Build filters array for Refine
  const refineCoreFilters = useMemo<CrudFilter[]>(() => {
    const filters: CrudFilter[] = [];
    if (titleFilter) filters.push({ field: 'title', operator: 'contains', value: titleFilter });
    if (typeFilter) filters.push({ field: 'type', operator: 'eq', value: typeFilter });
    if (statusFilter) filters.push({ field: 'status', operator: 'eq', value: statusFilter });
    if (moderationFilter)
      filters.push({ field: 'moderationStatus', operator: 'eq', value: moderationFilter });
    return filters;
  }, [titleFilter, typeFilter, statusFilter, moderationFilter]);

  const { reactTable, refineCore } = useTable<LegalDocument>({
    columns,
    refineCoreProps: {
      resource: 'documents',
      pagination: { pageSize: currentPageSize },
      filters: { permanent: refineCoreFilters },
      sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
    },
  });

  const {
    setCurrentPage,
    pageCount,
    currentPage,
    setFilters,
    setSorters,
    setPageSize,
    tableQuery: { isLoading },
  } = refineCore;
  const sorting = reactTable.getState().sorting;

  const handleSort = (columnId: string) => {
    const currentSort = sorting.find((s) => s.id === columnId);
    if (!currentSort) setSorters([{ field: columnId, order: 'desc' }]);
    else if (currentSort.desc) setSorters([{ field: columnId, order: 'asc' }]);
    else setSorters([]);
  };

  const getSortIndicator = (columnId: string) => {
    const sort = sorting.find((s) => s.id === columnId);
    if (!sort) return null;
    return sort.desc ? ' ↓' : ' ↑';
  };

  const handleClearFilters = () => {
    setTitleFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setModerationFilter('');
    setFilters([]);
  };

  const hasActiveFilters = titleFilter || typeFilter || statusFilter || moderationFilter;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage and moderate legal documents</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Documents</h3>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{reactTable.getRowModel().rows.length}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Pending Moderation</h3>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold">
              {
                reactTable
                  .getRowModel()
                  .rows.filter((r) => r.original.moderationStatus === 'PENDING').length
              }
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Approved</h3>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold">
              {
                reactTable
                  .getRowModel()
                  .rows.filter((r) => r.original.moderationStatus === 'APPROVED').length
              }
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Rejected</h3>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold">
              {
                reactTable
                  .getRowModel()
                  .rows.filter((r) => r.original.moderationStatus === 'REJECTED').length
              }
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              {translate('documents.fields.title')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={translate('common.search')}
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              {translate('documents.fields.type')}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="">{translate('common.all')}</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {translate(`documents.types.${type}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              {translate('documents.fields.status')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="">{translate('common.all')}</option>
              {DOCUMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {translate(`documents.statuses.${status}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Moderation
            </label>
            <select
              value={moderationFilter}
              onChange={(e) => setModerationFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="">{translate('common.all')}</option>
              {MODERATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              {translate('buttons.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                {reactTable.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      return (
                        <th
                          key={header.id}
                          className={cn(
                            'px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
                            canSort && 'cursor-pointer hover:bg-muted select-none',
                          )}
                          onClick={() => canSort && handleSort(header.id)}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && (
                              <span className="text-primary">
                                {getSortIndicator(header.id) || ''}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {reactTable.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      {translate('table.noData')}
                    </td>
                  </tr>
                ) : (
                  reactTable.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {translate('table.page', { current: currentPage || 1, total: pageCount || 1 })}
            </span>
            <select
              value={currentPageSize}
              onChange={(e) => {
                setCurrentPageSize(Number(e.target.value));
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((currentPage || 1) - 1)}
              disabled={currentPage === 1}
            >
              {translate('buttons.previous')}
            </Button>

            <div className="hidden sm:flex gap-1">
              {Array.from({ length: Math.min(pageCount || 1, 5) }, (_, i) => i + 1).map(
                (pageNum) => (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                ),
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((currentPage || 1) + 1)}
              disabled={currentPage === pageCount || pageCount === 0}
            >
              {translate('buttons.next')}
            </Button>
          </div>
        </div>
      </div>

      {/* Moderation Dialog */}
      {moderationDialog.isOpen && moderationDialog.documentId && (
        <ModerationDialog
          isOpen={moderationDialog.isOpen}
          onClose={closeModerationDialog}
          documentId={moderationDialog.documentId}
          documentTitle={moderationDialog.documentTitle || ''}
          action={moderationDialog.action}
          onConfirm={handleModerationAction}
          isLoading={moderationMutation.mutation.status === 'pending'}
        />
      )}
    </div>
  );
}
