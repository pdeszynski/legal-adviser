'use client';

import { useTranslate, CrudFilter } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { ColumnDef, flexRender, HeaderGroup, Row, Cell, Header } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  FileText,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  Search,
  Filter,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { cn } from '@legal/ui';
import { DocumentTableSkeleton, DocumentGridSkeleton } from '@/components/skeleton/TableSkeleton';

interface DocumentMetadata {
  plaintiffName?: string;
  defendantName?: string;
  claimAmount?: number;
  claimCurrency?: string;
}

interface LegalDocument {
  id: string;
  title: string;
  type: string;
  status: string;
  sessionId: string;
  contentRaw?: string | null;
  metadata?: DocumentMetadata | null;
  createdAt: string;
  updatedAt: string;
}

const DOCUMENT_TYPES = ['LAWSUIT', 'COMPLAINT', 'CONTRACT', 'OTHER'] as const;
const DOCUMENT_STATUSES = ['DRAFT', 'GENERATING', 'COMPLETED', 'FAILED'] as const;

const statusColors: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  GENERATING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function DocumentList() {
  const translate = useTranslate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter state
  const [titleFilter, setTitleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPageSize, setCurrentPageSize] = useState(10);

  const columns = useMemo<ColumnDef<LegalDocument>[]>(
    () => [
      {
        id: 'title',
        accessorKey: 'title',
        header: () => translate('documents.fields.title'),
        cell: ({ getValue, row }) => (
          <Link
            href={`/documents/show/${row.original.id}`}
            className="text-primary hover:underline font-medium"
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
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-muted'}`}
            >
              {translate(`documents.statuses.${status}`)}
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
          return (
            <span className="text-muted-foreground">
              {date.toLocaleDateString()}{' '}
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: () => translate('table.actions'),
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Link
              href={`/documents/show/${row.original.id}`}
              className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors border border-border"
            >
              {translate('buttons.show')}
            </Link>
          </div>
        ),
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
    return filters;
  }, [titleFilter, typeFilter, statusFilter]);

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
    tableQuery,
  } = refineCore;
  const sorting = reactTable.getState().sorting;

  const isLoading = tableQuery.isLoading;

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
    setFilters([]);
  };

  const hasActiveFilters = titleFilter || typeFilter || statusFilter;

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {translate('documents.titles.list')}
          </h1>
          <p className="text-muted-foreground mt-1">Manage and organize your legal documents</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-all',
                viewMode === 'grid'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-all',
                viewMode === 'list'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              title="List View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
          <Link href="/documents/create">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm">
              <Plus className="h-4 w-4" />
              {translate('buttons.create')}
            </button>
          </Link>
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
      {/* Content Area */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <DocumentGridSkeleton cards={currentPageSize} />
        ) : (
          <DocumentTableSkeleton rows={currentPageSize} />
        )
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reactTable.getRowModel().rows.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              {translate('table.noData')}
            </div>
          ) : (
            reactTable.getRowModel().rows.map((row) => {
              const doc = row.original;
              return (
                <Link key={doc.id} href={`/documents/show/${doc.id}`}>
                  <div className="group h-full bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          statusColors[doc.status] || 'bg-muted text-muted-foreground',
                        )}
                      >
                        {translate(`documents.statuses.${doc.status}`)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-lg text-card-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {doc.title}
                    </h3>

                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="bg-muted px-2 py-0.5 rounded text-xs truncate max-w-[100px]">
                        {translate(`documents.types.${doc.type}`)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      ) : (
        /* List View (Table) */
        (<div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
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
                          className={`px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                            canSort ? 'cursor-pointer hover:bg-muted select-none' : ''
                          }`}
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
        </div>)
      )}
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
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
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((currentPage || 1) - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-input rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            {translate('buttons.previous')}
          </button>

          <div className="hidden sm:flex gap-1">
            {Array.from({ length: Math.min(pageCount || 1, 5) }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors',
                  currentPage === pageNum
                    ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                    : 'hover:bg-muted text-muted-foreground',
                )}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((currentPage || 1) + 1)}
            disabled={currentPage === pageCount || pageCount === 0}
            className="px-3 py-1.5 border border-input rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            {translate('buttons.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
