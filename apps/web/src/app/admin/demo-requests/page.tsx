'use client';

/* eslint-disable max-lines */

import React, { useState, useCallback } from 'react';
import {
  Search,
  Download,
  Loader2,
  Mail,
  Building2,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Eye,
} from 'lucide-react';
import { Button, Input } from '@legal/ui';
import { dataProvider } from '@providers/data-provider';
import type { GraphQLMutationConfig } from '@providers/data-provider';

// Demo request status enum
type DemoRequestStatus = 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'QUALIFIED' | 'CLOSED';
type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';

interface DemoRequest {
  id: string;
  fullName: string;
  email: string;
  company: string | null;
  companySize: CompanySize | null;
  industry: string | null;
  useCase: string;
  timeline: string | null;
  budget: string | null;
  preferredDemoTime: string | null;
  status: DemoRequestStatus;
  hubspotContactId: string | null;
  submittedAt: string;
  contactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DemoRequestFilter {
  status?: DemoRequestStatus | 'all';
  companySize?: CompanySize | 'all';
  dateFrom?: string;
  dateTo?: string;
  search: string;
}

const statusLabels: Record<DemoRequestStatus, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  CONTACTED: {
    label: 'Contacted',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  SCHEDULED: {
    label: 'Scheduled',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  QUALIFIED: {
    label: 'Qualified',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  CLOSED: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

const companySizeLabels: Record<CompanySize, string> = {
  '1-10': '1-10',
  '11-50': '11-50',
  '51-200': '51-200',
  '201-500': '201-500',
  '500+': '500+',
};

export default function AdminDemoRequestsPage() {
  const [filters, setFilters] = useState<DemoRequestFilter>({
    status: 'all',
    companySize: 'all',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isLoading, setIsLoading] = useState(false);
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [total, setTotal] = useState(0);

  // Detail dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);

  const fetchDemoRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const dp = dataProvider;
      if (!dp) return;

      const filterList: Array<{
        field: string;
        operator: 'eq' | 'contains' | 'gte' | 'lte';
        value: string | boolean | DemoRequestStatus;
      }> = [];

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        filterList.push({
          field: 'status',
          operator: 'eq',
          value: filters.status as DemoRequestStatus,
        });
      }

      // Apply company size filter
      if (filters.companySize && filters.companySize !== 'all') {
        filterList.push({
          field: 'companySize',
          operator: 'eq',
          value: filters.companySize as CompanySize,
        });
      }

      // Apply search filter
      if (filters.search) {
        filterList.push({ field: 'email', operator: 'contains', value: filters.search });
      }

      // Apply date range filter
      if (filters.dateFrom) {
        filterList.push({ field: 'submittedAt', operator: 'gte', value: filters.dateFrom });
      }
      if (filters.dateTo) {
        filterList.push({ field: 'submittedAt', operator: 'lte', value: filters.dateTo });
      }

      const result = await dp.getList<DemoRequest>({
        resource: 'demoRequests',
        pagination: { currentPage, pageSize },
        filters: filterList.length > 0 ? filterList : undefined,
        sorters: [{ field: 'submittedAt', order: 'desc' }],
      });

      setDemoRequests(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch demo requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  React.useEffect(() => {
    fetchDemoRequests();
  }, [fetchDemoRequests]);

  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: DemoRequestStatus | 'all') => {
    setFilters({ ...filters, status });
    setCurrentPage(1);
  };

  const handleCompanySizeFilterChange = (companySize: CompanySize | 'all') => {
    setFilters({ ...filters, companySize });
    setCurrentPage(1);
  };

  const openDetailDialog = useCallback((request: DemoRequest) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (demoRequests.length === 0) return;

    // CSV headers
    const headers = [
      'Name',
      'Email',
      'Company',
      'Company Size',
      'Industry',
      'Use Case',
      'Timeline',
      'Budget',
      'Status',
      'Submitted Date',
    ];

    // Convert demo requests to CSV rows
    const rows = demoRequests.map((req) => [
      req.fullName,
      req.email,
      req.company || '',
      req.companySize || '',
      req.industry || '',
      req.useCase,
      req.timeline || '',
      req.budget || '',
      req.status,
      new Date(req.submittedAt).toLocaleDateString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(','),
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `demo-requests-export-${new Date().toISOString().split('T')[0]}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [demoRequests]);

  const totalPages = Math.ceil(total / pageSize);

  // Count by status
  const statusCounts = demoRequests.reduce(
    (acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    },
    {} as Partial<Record<DemoRequestStatus, number>>,
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Demo Requests</h1>
            <p className="text-muted-foreground">Manage demo requests and sales pipeline</p>
          </div>
          <Button onClick={exportToCSV} disabled={demoRequests.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Total</h3>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{total}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">New</h3>
                <span className="text-2xl text-blue-600">🆕</span>
              </div>
              <div className="text-2xl font-bold">{statusCounts.NEW || 0}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Contacted</h3>
                <Mail className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold">{statusCounts.CONTACTED || 0}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Scheduled</h3>
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">{statusCounts.SCHEDULED || 0}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Qualified</h3>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold">{statusCounts.QUALIFIED || 0}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filters.status === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('all')}
            >
              All Status
            </Button>
            <Button
              variant={filters.status === 'NEW' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('NEW')}
            >
              New
            </Button>
            <Button
              variant={filters.status === 'CONTACTED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('CONTACTED')}
            >
              Contacted
            </Button>
            <Button
              variant={filters.status === 'SCHEDULED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('SCHEDULED')}
            >
              Scheduled
            </Button>
            <Button
              variant={filters.status === 'QUALIFIED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('QUALIFIED')}
            >
              Qualified
            </Button>
            <Button
              variant={filters.status === 'CLOSED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('CLOSED')}
            >
              Closed
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filters.companySize === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCompanySizeFilterChange('all')}
            >
              All Sizes
            </Button>
            <Button
              variant={filters.companySize === '1-10' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCompanySizeFilterChange('1-10')}
            >
              1-10
            </Button>
            <Button
              variant={filters.companySize === '11-50' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCompanySizeFilterChange('11-50')}
            >
              11-50
            </Button>
            <Button
              variant={filters.companySize === '500+' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCompanySizeFilterChange('500+')}
            >
              500+
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilters({ status: 'all', companySize: 'all', search: '' });
              setCurrentPage(1);
            }}
          >
            Reset
          </Button>
        </div>

        {/* Demo Requests Table */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-4 text-left font-medium text-sm">Name</th>
                  <th className="p-4 text-left font-medium text-sm">Company</th>
                  <th className="p-4 text-left font-medium text-sm">Size</th>
                  <th className="p-4 text-left font-medium text-sm">Status</th>
                  <th className="p-4 text-left font-medium text-sm">Submitted</th>
                  <th className="p-4 text-left font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading demo requests...
                      </div>
                    </td>
                  </tr>
                ) : demoRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No demo requests found
                    </td>
                  </tr>
                ) : (
                  demoRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <button
                          onClick={() => openDetailDialog(request)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          <div className="font-medium">{request.fullName}</div>
                          <div className="text-sm text-muted-foreground">{request.email}</div>
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {request.company || '—'}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{request.companySize || '—'}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            statusLabels[request.status].color
                          }`}
                        >
                          {statusLabels[request.status].label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(request)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => (window.location.href = `mailto:${request.email}`)}
                            title="Email lead"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
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
                {Math.min(currentPage * pageSize, total)} of {total} requests
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

      {/* Detail Dialog */}
      {selectedRequest && (
        <DemoRequestDetailDialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          request={selectedRequest}
          onUpdate={fetchDemoRequests}
        />
      )}
    </>
  );
}

interface DemoRequestDetailDialogProps {
  open: boolean;
  onClose: () => void;
  request: DemoRequest;
  onUpdate: () => void;
}

function DemoRequestDetailDialog({
  open,
  onClose,
  request,
  onUpdate,
}: DemoRequestDetailDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  const updateStatus = async (newStatus: DemoRequestStatus) => {
    setIsUpdating(true);
    try {
      const dp = dataProvider;
      if (!dp) return;

      const mutationConfig: GraphQLMutationConfig<{
        demoRequestId: string;
        status: DemoRequestStatus;
      }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'updateDemoRequestStatus',
            fields: ['id', 'status', 'contactedAt'],
            variables: {
              input: {
                demoRequestId: request.id,
                status: newStatus,
              },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dp as any).custom({
        url: '',
        method: 'post',
        config: mutationConfig.config,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const scheduleDemo = async () => {
    if (!scheduledDate) {
      alert('Please select a date and time for the demo');
      return;
    }

    setIsUpdating(true);
    try {
      const dp = dataProvider;
      if (!dp) return;

      const mutationConfig: GraphQLMutationConfig<{
        demoRequestId: string;
        scheduledTime: string;
      }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'scheduleDemo',
            fields: ['id', 'status', 'preferredDemoTime'],
            variables: {
              input: {
                demoRequestId: request.id,
                scheduledTime: new Date(scheduledDate).toISOString(),
              },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dp as any).custom({
        url: '',
        method: 'post',
        config: mutationConfig.config,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to schedule demo:', error);
      alert(`Failed to schedule demo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!open) return null;

  const statusConfig = statusLabels[request.status];
  const canTransitionTo: DemoRequestStatus[] = {
    NEW: ['CONTACTED', 'CLOSED'],
    CONTACTED: ['SCHEDULED', 'CLOSED'],
    SCHEDULED: ['QUALIFIED', 'CLOSED'],
    QUALIFIED: ['CLOSED'],
    CLOSED: [],
  }[request.status] as DemoRequestStatus[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Demo Request Details</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            <span className="text-sm text-muted-foreground">
              Submitted {new Date(request.submittedAt).toLocaleString()}
            </span>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{request.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                  {request.email}
                </a>
              </div>
              {request.company && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{request.company}</span>
                </div>
              )}
              {request.companySize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company Size:</span>
                  <span>{request.companySize}</span>
                </div>
              )}
              {request.industry && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry:</span>
                  <span>{request.industry}</span>
                </div>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Request Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Use Case:</span>
                <p className="p-3 bg-muted/50 rounded">{request.useCase}</p>
              </div>
              {request.timeline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeline:</span>
                  <span>{request.timeline}</span>
                </div>
              )}
              {request.budget && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget:</span>
                  <span>{request.budget}</span>
                </div>
              )}
              {request.preferredDemoTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preferred Time:</span>
                  <span>{new Date(request.preferredDemoTime).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* HubSpot Integration */}
          {request.hubspotContactId && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span>Synced to HubSpot (Contact ID: {request.hubspotContactId})</span>
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div>
            <h3 className="font-medium mb-3">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {canTransitionTo.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatus(status)}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Mark as {statusLabels[status].label}
                </Button>
              ))}
            </div>
          </div>

          {/* Schedule Demo */}
          {request.status === 'CONTACTED' || request.status === 'SCHEDULED' ? (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Demo
              </h3>
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={scheduleDemo} disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Phone className="h-4 w-4 mr-2" />
                  )}
                  Schedule
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t bg-muted/30 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
