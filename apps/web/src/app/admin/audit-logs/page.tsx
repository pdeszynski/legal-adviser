'use client';

import React, { useState, useMemo } from 'react';
import { useList } from '@refinedev/core';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@legal/ui';
import { Search, RefreshCw, Filter } from 'lucide-react';
import type { AuditLog } from '@/generated/graphql';

interface AuditLogFilters {
  action: string;
  resourceType: string;
  userId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface RefineFilter {
  field: string;
  operator:
    | 'eq'
    | 'ne'
    | 'contains'
    | 'startswith'
    | 'endswith'
    | 'in'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte';
  value: string | Date;
}

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'READ', label: 'Read' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'PAUSE', label: 'Pause' },
  { value: 'RESUME', label: 'Resume' },
];

const RESOURCE_TYPES = [
  { value: 'all', label: 'All Resources' },
  { value: 'USER', label: 'User' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'SESSION', label: 'Session' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'WEBHOOK', label: 'Webhook' },
  { value: 'SCHEDULE', label: 'Schedule' },
];

function getActionBadgeColor(action: string): string {
  const baseColors = {
    CREATE: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
    READ: 'bg-gray-50 text-gray-700 ring-gray-500/10 dark:bg-gray-900/30 dark:text-gray-400',
    UPDATE:
      'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400',
    DELETE: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400',
    EXPORT:
      'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-400',
    LOGIN: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
    LOGOUT:
      'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400',
    PAUSE: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400',
    RESUME: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-900/30 dark:text-teal-400',
  };
  return baseColors[action as keyof typeof baseColors] || baseColors.READ;
}

export default function AdminAuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    action: 'all',
    resourceType: 'all',
    userId: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Build Refine filters from state
  const refineFilters = useMemo((): RefineFilter[] => {
    const filterList: RefineFilter[] = [];

    if (filters.action && filters.action !== 'all') {
      filterList.push({ field: 'action', operator: 'eq', value: filters.action });
    }

    if (filters.resourceType && filters.resourceType !== 'all') {
      filterList.push({ field: 'resourceType', operator: 'eq', value: filters.resourceType });
    }

    if (filters.userId) {
      filterList.push({ field: 'userId', operator: 'eq', value: filters.userId });
    }

    if (filters.dateFrom) {
      // Start of the day (UTC) to ensure we capture all records from that date
      const startDate = new Date(filters.dateFrom);
      startDate.setUTCHours(0, 0, 0, 0);
      filterList.push({ field: 'createdAt', operator: 'gte', value: startDate.toISOString() });
    }

    if (filters.dateTo) {
      // End of the day (UTC) to ensure we capture all records up to and including that date
      const endDate = new Date(filters.dateTo);
      endDate.setUTCHours(23, 59, 59, 999);
      filterList.push({ field: 'createdAt', operator: 'lte', value: endDate.toISOString() });
    }

    if (filters.search) {
      // Search in multiple fields using OR logic
      filterList.push({ field: 'resourceId', operator: 'contains', value: filters.search });
    }

    return filterList;
  }, [filters]);

  // Use Refine's useList hook for data fetching
  const { query, result } = useList<AuditLog>({
    resource: 'audit_logs',
    pagination: {
      currentPage,
      pageSize,
    },
    filters: refineFilters.length > 0 ? refineFilters : undefined,
    sorters: [{ field: 'createdAt', order: 'desc' }],
  });

  const { data, isLoading, refetch } = query;
  const logs = result?.data || [];
  const total = result?.total || 0;

  const totalPages = Math.ceil(total / pageSize);

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: 'all',
      resourceType: 'all',
      userId: '',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v !== 'all');

  const getUserName = (log: AuditLog): string => {
    if (log.user) {
      const name = [log.user.firstName, log.user.lastName].filter(Boolean).join(' ');
      return name || log.user.email;
    }
    return 'System';
  };

  const handleActionChange = (value: string) => handleFilterChange('action', value);
  const handleResourceTypeChange = (value: string) => handleFilterChange('resourceType', value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">System activity and user actions</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Logs</h3>
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-2xl font-bold">{total}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Create Actions</h3>
              <span className="text-2xl text-blue-600">+</span>
            </div>
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action === 'CREATE').length}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Update Actions</h3>
              <span className="text-2xl text-yellow-600">✎</span>
            </div>
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action === 'UPDATE').length}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Delete Actions</h3>
              <span className="text-2xl text-red-600">−</span>
            </div>
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action === 'DELETE').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Filters</h3>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Action Type Filter */}
          <Select value={filters.action} onValueChange={handleActionChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((action) => (
                <SelectItem key={action.value} value={action.value}>
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Resource Type Filter */}
          <Select value={filters.resourceType} onValueChange={handleResourceTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Resources" />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPES.map((resource) => (
                <SelectItem key={resource.value} value={resource.value}>
                  {resource.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* User ID Filter */}
          <div className="relative">
            <Input
              placeholder="User ID..."
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
            />
          </div>

          {/* Date From Filter */}
          <div>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          {/* Date To Filter */}
          <div>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by resource ID..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 text-left font-medium text-sm">Timestamp</th>
                <th className="p-4 text-left font-medium text-sm">User</th>
                <th className="p-4 text-left font-medium text-sm">Action</th>
                <th className="p-4 text-left font-medium text-sm">Resource Type</th>
                <th className="p-4 text-left font-medium text-sm">Resource ID</th>
                <th className="p-4 text-left font-medium text-sm">IP Address</th>
                <th className="p-4 text-left font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {hasActiveFilters ? 'No audit logs match your filters' : 'No audit logs found'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4 text-sm whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-sm">{getUserName(log)}</div>
                      {log.user && (
                        <div className="text-xs text-muted-foreground">{log.user.email}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getActionBadgeColor(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{log.resourceType}</td>
                    <td className="p-4 font-mono text-xs">{log.resourceId || '-'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{log.ipAddress || '-'}</td>
                    <td className="p-4">
                      {log.statusCode ? (
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            log.statusCode >= 200 && log.statusCode < 300
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : log.statusCode >= 300 && log.statusCode < 400
                                ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {log.statusCode}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * pageSize + 1, total)} to{' '}
              {Math.min(currentPage * pageSize, total)} of {total} logs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
