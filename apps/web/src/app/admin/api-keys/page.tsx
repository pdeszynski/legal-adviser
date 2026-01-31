'use client';

import { useList, useDelete } from '@refinedev/core';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Key,
  Trash2,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@legal/ui';
import { Input } from '@legal/ui';

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  description?: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  scopes: string[];
  status: string;
  rateLimitPerMinute: number;
  usageCount: number;
  lastUsedAt?: string;
  lastUsedIp?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminApiKeysPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const pageSize = 20;

  // Build Refine filters
  const refineFilters = useMemo(() => {
    const filters = [];
    if (search) {
      filters.push({ field: 'name', operator: 'contains', value: search });
    }
    if (statusFilter !== 'all') {
      filters.push({ field: 'status', operator: 'eq', value: statusFilter });
    }
    return filters;
  }, [search, statusFilter]);

  // Use Refine's useList hook for data fetching
  const listResult = useList<ApiKey>({
    resource: 'apiKeys',
    pagination: {
      current: currentPage,
      pageSize,
    } as any,
    filters: refineFilters.length > 0 ? (refineFilters as any) : undefined,
    sorters: [{ field: 'createdAt', order: 'desc' }],
  });

  const { data, isLoading, refetch } = listResult.query;
  const apiKeys = (listResult.result?.data as unknown as ApiKey[]) || [];
  const total = listResult.result?.total || 0;

  // Delete mutation
  const { mutate: deleteApiKey } = useDelete();

  const totalPages = Math.ceil(total / pageSize);

  // Common scopes for filtering
  const commonScopes = ['READ', 'WRITE', 'ADMIN', 'API'];

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'REVOKED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getScopeBadgeColor = (scope: string) => {
    switch (scope.toUpperCase()) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'WRITE':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'READ':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'API':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete API key "${name}"?`)) {
      deleteApiKey(
        { resource: 'apiKey', id },
        {
          onSuccess: () => {
            refetch();
          },
        },
      );
    }
  };

  const toggleShowKey = (id: string) => {
    const newShowKeys = new Set(showKeys);
    if (newShowKeys.has(id)) {
      newShowKeys.delete(id);
    } else {
      newShowKeys.add(id);
    }
    setShowKeys(newShowKeys);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getDisplayName = (user?: ApiKey['user']) => {
    if (!user) return 'Unknown';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const getExpiryStatus = (key: ApiKey) => {
    if (!key.expiresAt) return null;
    const expiryDate = new Date(key.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry < 0) return { status: 'expired', days: daysUntilExpiry };
    if (daysUntilExpiry === 0) return { status: 'today', days: 0 };
    if (daysUntilExpiry <= 7) return { status: 'soon', days: daysUntilExpiry };
    return { status: 'ok', days: daysUntilExpiry };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Key className="h-8 w-8" />
            API Keys
          </h1>
          <p className="text-muted-foreground">Manage API keys for external integrations</p>
        </div>
        <Button onClick={() => router.push('/admin/api-keys/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Keys</h3>
              <Key className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{total}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Active</h3>
              <Shield className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">
              {apiKeys.filter((key) => key.status === 'ACTIVE').length}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Revoked</h3>
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold">
              {apiKeys.filter((key) => key.status === 'REVOKED').length}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Expiring Soon</h3>
              <Calendar className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">
              {
                apiKeys.filter((key) => {
                  const expiry = getExpiryStatus(key);
                  return expiry && (expiry.status === 'soon' || expiry.status === 'today');
                }).length
              }
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All Status
          </Button>
          <Button
            variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('ACTIVE')}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'REVOKED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('REVOKED')}
          >
            Revoked
          </Button>
          <Button
            variant={statusFilter === 'EXPIRED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('EXPIRED')}
          >
            Expired
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* API Keys Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 text-left font-medium text-sm">Name</th>
                <th className="p-4 text-left font-medium text-sm">Key Prefix</th>
                <th className="p-4 text-left font-medium text-sm">User</th>
                <th className="p-4 text-left font-medium text-sm">Scopes</th>
                <th className="p-4 text-left font-medium text-sm">Status</th>
                <th className="p-4 text-left font-medium text-sm">Usage</th>
                <th className="p-4 text-left font-medium text-sm">Expires</th>
                <th className="p-4 text-left font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading API keys...
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No API keys found
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => {
                  const expiry = getExpiryStatus(key);
                  return (
                    <tr key={key.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{key.name}</div>
                          {key.description && (
                            <div className="text-sm text-muted-foreground">{key.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {showKeys.has(key.id) ? `${key.keyPrefix}...` : `${key.keyPrefix}***`}
                        </code>
                      </td>
                      <td className="p-4 text-sm">{getDisplayName(key.user)}</td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {key.scopes.map((scope) => (
                            <span
                              key={scope}
                              className={`px-2 py-1 rounded text-xs font-medium ${getScopeBadgeColor(scope)}`}
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(key.status)}`}
                        >
                          {key.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <div>{key.usageCount} requests</div>
                        {key.lastUsedAt && (
                          <div className="text-xs text-muted-foreground">
                            Last: {new Date(key.lastUsedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {key.expiresAt ? (
                          expiry ? (
                            <div className="flex items-center gap-1">
                              {expiry.status === 'expired' && (
                                <AlertCircle className="h-3 w-3 text-red-500" />
                              )}
                              {expiry.status === 'soon' && (
                                <AlertCircle className="h-3 w-3 text-yellow-500" />
                              )}
                              <span
                                className={
                                  expiry.status === 'expired' || expiry.status === 'soon'
                                    ? 'text-red-500 dark:text-red-400'
                                    : ''
                                }
                              >
                                {new Date(key.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            new Date(key.expiresAt).toLocaleDateString()
                          )
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleShowKey(key.id)}
                            title={showKeys.has(key.id) ? 'Hide key' : 'Show key'}
                          >
                            {showKeys.has(key.id) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`${key.keyPrefix}...`)}
                            title="Copy to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(key.id, key.name)}
                            title="Delete key"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * pageSize + 1, total)} to{' '}
              {Math.min(currentPage * pageSize, total)} of {total} keys
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
