'use client';

import { useTranslate, CrudFilter } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { ColumnDef, flexRender, HeaderGroup, Row, Cell, Header } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { GraphQLErrorAlert } from '@/components/data/GraphQLErrorAlert';
import { AuditLogTableSkeleton } from '@/components/skeleton/TableSkeleton';

/**
 * User type for audit log author
 */
interface AuditLogUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Change details for audit log
 */
interface ChangeDetails {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/**
 * Audit Log type matching GraphQL AuditLog
 */
interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  userId?: string;
  user?: AuditLogUser;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  errorMessage?: string;
  changeDetails?: ChangeDetails;
  createdAt: string;
  updatedAt: string;
}

/**
 * Audit action types
 */
const AUDIT_ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT'] as const;

/**
 * Resource types
 */
const RESOURCE_TYPES = ['USER', 'DOCUMENT', 'SESSION', 'SYSTEM'] as const;

/**
 * Action color mapping for badges
 */
const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  READ: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  EXPORT: 'bg-purple-100 text-purple-800',
  LOGIN: 'bg-indigo-100 text-indigo-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
};

/**
 * Resource color mapping for badges
 */
const resourceColors: Record<string, string> = {
  USER: 'bg-blue-100 text-blue-800',
  DOCUMENT: 'bg-purple-100 text-purple-800',
  SESSION: 'bg-indigo-100 text-indigo-800',
  SYSTEM: 'bg-gray-100 text-gray-800',
};

/**
 * Get user display name from audit log user
 */
function getUserDisplayName(user?: AuditLogUser): string {
  if (!user) return 'System';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.email;
}

export default function AuditLogList() {
  const translate = useTranslate();

  // Filter state
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: () => 'Date & Time',
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <div className="text-sm">
              <div className="font-medium text-gray-900">{date.toLocaleDateString()}</div>
              <div className="text-gray-500">
                {date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: 'user',
        accessorKey: 'user',
        header: () => 'User',
        cell: ({ row }) => {
          const userName = getUserDisplayName(row.original.user);
          return (
            <div className="text-sm">
              <div className="font-medium text-gray-900">{userName}</div>
              {row.original.ipAddress && (
                <div className="text-gray-500 text-xs">{row.original.ipAddress}</div>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'action',
        accessorKey: 'action',
        header: () => 'Action',
        cell: ({ getValue }) => {
          const action = getValue() as string;
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${actionColors[action] || 'bg-gray-100'}`}
            >
              {action}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        id: 'resourceType',
        accessorKey: 'resourceType',
        header: () => 'Resource',
        cell: ({ getValue, row }) => {
          const resourceType = getValue() as string;
          return (
            <div className="text-sm">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${resourceColors[resourceType] || 'bg-gray-100'}`}
              >
                {resourceType}
              </span>
              {row.original.resourceId && (
                <div className="text-gray-500 text-xs mt-1 font-mono">
                  ID: {row.original.resourceId.substring(0, 8)}...
                </div>
              )}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: 'status',
        accessorKey: 'statusCode',
        header: () => 'Status',
        cell: ({ getValue, row }) => {
          const statusCode = getValue() as number | undefined;
          const hasError = row.original.errorMessage;

          if (!statusCode) return <span className="text-gray-400">-</span>;

          const isSuccess = statusCode >= 200 && statusCode < 400;

          return (
            <div className="text-sm">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {statusCode}
              </span>
              {hasError && (
                <div className="text-red-600 text-xs mt-1" title={row.original.errorMessage}>
                  Error
                </div>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'details',
        header: () => 'Details',
        cell: ({ row }) => {
          const hasChanges =
            row.original.changeDetails?.before || row.original.changeDetails?.after;
          const userAgent = row.original.userAgent;

          return (
            <div className="text-xs text-gray-600 max-w-xs">
              {hasChanges && <div className="mb-1 text-blue-600">Has change data</div>}
              {userAgent && (
                <div className="truncate" title={userAgent}>
                  {userAgent.substring(0, 40)}...
                </div>
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

    if (actionFilter) {
      filters.push({ field: 'action', operator: 'eq', value: actionFilter });
    }
    if (resourceTypeFilter) {
      filters.push({ field: 'resourceType', operator: 'eq', value: resourceTypeFilter });
    }
    if (userIdFilter) {
      filters.push({ field: 'userId', operator: 'eq', value: userIdFilter });
    }

    return filters;
  }, [actionFilter, resourceTypeFilter, userIdFilter]);

  const { reactTable, refineCore } = useTable<AuditLog>({
    columns,
    refineCoreProps: {
      resource: 'audit_logs',
      pagination: {
        pageSize: currentPageSize,
      },
      filters: {
        permanent: refineCoreFilters,
      },
      sorters: {
        initial: [{ field: 'createdAt', order: 'desc' }],
      },
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

  const isLoading = tableQuery.isLoading;

  // Check for GraphQL errors in the result
  // The result may have _errors attached when data is returned alongside errors
  const dataErrors = useMemo(() => {
    if (!refineCore.result) return [];
    const result = refineCore.result as unknown as { _errors?: unknown[] };
    return result._errors ?? [];
  }, [refineCore.result]);

  // State for dismissing the error banner
  const [dismissedErrors, setDismissedErrors] = useState(false);

  const sorting = reactTable.getState().sorting;

  // Handle sorting click on column headers
  const handleSort = (columnId: string) => {
    const currentSort = sorting.find((s) => s.id === columnId);

    if (!currentSort) {
      setSorters([{ field: columnId, order: 'desc' }]);
    } else if (currentSort.desc) {
      setSorters([{ field: columnId, order: 'asc' }]);
    } else {
      setSorters([]);
    }
  };

  // Get sort indicator for column
  const getSortIndicator = (columnId: string) => {
    const sort = sorting.find((s) => s.id === columnId);
    if (!sort) return null;
    return sort.desc ? ' ↓' : ' ↑';
  };

  // Handle filter clear
  const handleClearFilters = () => {
    setActionFilter('');
    setResourceTypeFilter('');
    setUserIdFilter('');
    setFilters([]);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setCurrentPageSize(newSize);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const hasActiveFilters = actionFilter || resourceTypeFilter || userIdFilter;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
        <p className="text-gray-600">View complete activity history across all resources</p>
      </div>

      {/* GraphQL Errors Display */}
      {dataErrors.length > 0 && !dismissedErrors && (
        <GraphQLErrorAlert
          errors={dataErrors as { message: string }[]}
          title={`${dataErrors.length} error${dataErrors.length > 1 ? 's' : ''} loading audit logs`}
          onDismiss={() => setDismissedErrors(true)}
        />
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Action Filter */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Type Filter */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Resources</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* User ID Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              placeholder="Filter by user ID..."
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <AuditLogTableSkeleton rows={currentPageSize} />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {reactTable.getHeaderGroups().map((headerGroup: HeaderGroup<AuditLog>) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header: Header<AuditLog, unknown>) => {
                      const canSort = header.column.getCanSort();
                      return (
                        <th
                          key={header.id}
                          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            canSort ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                          }`}
                          onClick={() => canSort && handleSort(header.id)}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && (
                              <span className="text-blue-600">
                                {getSortIndicator(header.id) || ' ↕'}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reactTable.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  reactTable.getRowModel().rows.map((row: Row<AuditLog>) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map((cell: Cell<AuditLog, unknown>) => (
                        <td key={cell.id} className="px-6 py-4 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Page {currentPage || 1} of {pageCount || 1}
          </span>
          <select
            value={currentPageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((currentPage || 1) - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>

          {/* Page numbers */}
          <div className="hidden sm:flex gap-1">
            {Array.from({ length: Math.min(pageCount || 1, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 border rounded-md transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((currentPage || 1) + 1)}
            disabled={currentPage === pageCount || pageCount === 0}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
