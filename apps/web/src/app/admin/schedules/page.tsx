'use client';

/* eslint-disable max-lines */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Search,
  Plus,
  Clock,
  Pause,
  Play,
  Trash2,
  RefreshCw,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { Button, Input } from '@legal/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@legal/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@legal/ui';
import { dataProvider } from '@providers/data-provider';
import type { GraphQLMutationConfig } from '@providers/data-provider';

// Types for Temporal Schedule data
interface ScheduleActionDetails {
  workflowType: string;
  workflowId: string;
  taskQueue: string;
  args?: string;
}

interface ScheduleSpecDetails {
  cronExpression?: string;
  intervalSeconds?: number;
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

interface ScheduleStateInfo {
  missedActions?: number;
  totalActions?: number;
  successfulActions?: number;
  failedActions?: number;
  runningActions?: number;
}

interface ScheduleDetails {
  scheduleId: string;
  exists: boolean;
  action?: ScheduleActionDetails;
  spec?: ScheduleSpecDetails;
  overlap?: 'SKIP' | 'ALLOW_ALL' | 'BUFFER_ONE';
  paused?: boolean;
  missedActions?: string;
  totalActions?: string;
  successfulActions?: string;
  failedActions?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  state?: ScheduleStateInfo;
}

interface ScheduleListItem {
  scheduleId: string;
  details?: ScheduleDetails;
}

type OverlapPolicy = 'SKIP' | 'ALLOW_ALL' | 'BUFFER_ONE';

const OVERLAP_POLICIES: { value: OverlapPolicy; label: string; description: string }[] = [
  { value: 'SKIP', label: 'Skip', description: 'Skip new execution if previous is still running' },
  { value: 'ALLOW_ALL', label: 'Allow All', description: 'Allow all executions to run concurrently' },
  { value: 'BUFFER_ONE', label: 'Buffer One', description: 'Allow one execution to buffer while another runs' },
];

const COMMON_CRON_EXPRESSIONS: { expression: string; label: string }[] = [
  { expression: '0 2 * * *', label: 'Daily at 2:00 AM' },
  { expression: '0 3 * * *', label: 'Daily at 3:00 AM' },
  { expression: '0 0 * * *', label: 'Daily at Midnight' },
  { expression: '0 */1 * * *', label: 'Every Hour' },
  { expression: '*/30 * * * *', label: 'Every 30 Minutes' },
  { expression: '0 0 * * 0', label: 'Weekly on Sunday' },
  { expression: '0 0 * * 1', label: 'Weekly on Monday' },
  { expression: '0 3 * * 0', label: 'Weekly on Sunday at 3 AM' },
  { expression: '0 0 1 * *', label: 'Monthly on 1st at Midnight' },
];

const DEFAULT_WORKFLOWS = [
  'rulingIndexing',
  'dataSyncWorkflow',
  'cleanupWorkflow',
  'reportGeneration',
  'healthCheck',
];

export default function AdminSchedulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleDetails | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    scheduleId: '',
    workflowType: '',
    workflowId: '',
    taskQueue: 'legal-ai-task-queue',
    cronExpression: '0 2 * * *',
    overlap: 'SKIP' as OverlapPolicy,
    paused: false,
    args: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const dp = dataProvider;
      if (!dp) return;

      const queryConfig = {
        url: '',
        method: 'post',
        config: {
          query: {
            operation: 'temporalSchedules',
            fields: ['scheduleIds', 'totalCount', 'nextPageToken'],
            variables: {
              input: { pageSize: 100 },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (dp as any).custom(queryConfig);

      if (response.data?.temporalSchedules) {
        const scheduleIds = response.data.temporalSchedules.scheduleIds || [];
        setTotal(scheduleIds.length);

        // Filter by search query
        const filteredIds = searchQuery
          ? scheduleIds.filter((id: string) => id.toLowerCase().includes(searchQuery.toLowerCase()))
          : scheduleIds;

        // Paginate
        const start = (currentPage - 1) * pageSize;
        const paginatedIds = filteredIds.slice(start, start + pageSize);

        // Fetch details for each schedule
        const schedulePromises = paginatedIds.map((id: string) =>
          fetchScheduleDetails(id).then((details) => ({ scheduleId: id, details })),
        );

        const scheduleResults = await Promise.all(schedulePromises);
        setSchedules(scheduleResults);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch schedules:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]);

  const fetchScheduleDetails = async (scheduleId: string): Promise<ScheduleDetails | undefined> => {
    try {
      const dp = dataProvider;
      if (!dp) return undefined;

      const queryConfig = {
        url: '',
        method: 'post',
        config: {
          query: {
            operation: 'describeSchedule',
            fields: [
              'scheduleId',
              'exists',
              { action: ['workflowType', 'workflowId', 'taskQueue', 'args'] },
              { spec: ['cronExpression', 'intervalSeconds', 'startTime', 'endTime', 'timezone'] },
              'overlap',
              'paused',
              'missedActions',
              'totalActions',
              'successfulActions',
              'failedActions',
              'lastRunAt',
              'nextRunAt',
              { state: ['missedActions', 'totalActions', 'successfulActions', 'failedActions', 'runningActions'] },
            ],
            variables: {
              scheduleId,
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (dp as any).custom(queryConfig);
      return response.data?.describeSchedule;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch details for schedule ${scheduleId}:`, error);
      return undefined;
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSchedules();
    setIsRefreshing(false);
  };

  const handlePauseResume = async (scheduleId: string, currentlyPaused: boolean) => {
    setActionLoading((prev) => ({ ...prev, [scheduleId]: true }));
    try {
      const dp = dataProvider;
      if (!dp) return;

      const mutationConfig: GraphQLMutationConfig<{ scheduleId: string; reason?: string }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: currentlyPaused ? 'resumeSchedule' : 'pauseSchedule',
            fields: ['scheduleId', 'success'],
            variables: {
              input: { scheduleId, reason: `Manual ${currentlyPaused ? 'resume' : 'pause'} via admin UI` },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dp as any).custom(mutationConfig);
      await fetchSchedules();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to ${currentlyPaused ? 'resume' : 'pause'} schedule:`, error);
      alert(
        `Failed to ${currentlyPaused ? 'resume' : 'pause'} schedule: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [scheduleId]: false }));
    }
  };

  const handleDelete = async () => {
    if (!selectedSchedule || !deleteConfirm) return;

    setDeleteLoading(true);
    try {
      const dp = dataProvider;
      if (!dp) return;

      const mutationConfig: GraphQLMutationConfig<{ scheduleId: string; confirm: boolean; reason?: string }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'deleteSchedule',
            fields: ['scheduleId', 'success', 'message'],
            variables: {
              input: {
                scheduleId: selectedSchedule.scheduleId,
                confirm: true,
                reason: deleteReason || undefined,
              },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (dp as any).custom(mutationConfig);

      if (response.data?.deleteSchedule?.success) {
        setDeleteDialogOpen(false);
        setSelectedSchedule(null);
        setDeleteConfirm(false);
        setDeleteReason('');
        await fetchSchedules();
      } else {
        alert(response.data?.deleteSchedule?.message || 'Failed to delete schedule');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete schedule:', error);
      alert(
        `Failed to delete schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDetailDialog = useCallback((schedule: ScheduleDetails | { scheduleId: string }) => {
    // If only scheduleId is provided, fetch full details first
    if (!('exists' in schedule)) {
      fetchScheduleDetails(schedule.scheduleId).then((details) => {
        if (details) {
          setSelectedSchedule(details);
          setDetailDialogOpen(true);
        }
      });
      return;
    }
    setSelectedSchedule(schedule);
    setDetailDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((schedule: ScheduleDetails | { scheduleId: string }) => {
    // If only scheduleId is provided, create a minimal schedule object
    if (!('exists' in schedule)) {
      setSelectedSchedule({
        scheduleId: schedule.scheduleId,
        exists: true,
      });
      setDeleteDialogOpen(true);
      return;
    }
    setSelectedSchedule(schedule);
    setDeleteDialogOpen(true);
  }, []);

  const handleCreateSchedule = async () => {
    setCreateError('');
    if (!createForm.scheduleId || !createForm.workflowType || !createForm.workflowId) {
      setCreateError('Please fill in all required fields');
      return;
    }

    setCreateLoading(true);
    try {
      const dp = dataProvider;
      if (!dp) return;

      const mutationConfig: GraphQLMutationConfig<Record<string, unknown>> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'createSchedule',
            fields: ['scheduleId', 'success', 'message'],
            variables: {
              input: {
                scheduleId: createForm.scheduleId,
                action: {
                  type: 'startWorkflow',
                  workflowType: createForm.workflowType,
                  workflowId: createForm.workflowId,
                  taskQueue: createForm.taskQueue,
                  args: createForm.args || undefined,
                },
                spec: {
                  cronExpression: createForm.cronExpression,
                },
                policies: {
                  overlap: createForm.overlap,
                },
                paused: createForm.paused,
              },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (dp as any).custom(mutationConfig);

      if (response.data?.createSchedule?.success) {
        setCreateDialogOpen(false);
        resetCreateForm();
        await fetchSchedules();
      } else {
        setCreateError(response.data?.createSchedule?.message || 'Failed to create schedule');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create schedule:', error);
      setCreateError(
        `Failed to create schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      scheduleId: '',
      workflowType: '',
      workflowId: '',
      taskQueue: 'legal-ai-task-queue',
      cronExpression: '0 2 * * *',
      overlap: 'SKIP',
      paused: false,
      args: '',
    });
    setCreateError('');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getCronDescription = (cronExpression?: string) => {
    if (!cronExpression) return '—';
    const preset = COMMON_CRON_EXPRESSIONS.find((c) => c.expression === cronExpression);
    return preset ? preset.label : cronExpression;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Temporal Schedules</h1>
            <p className="text-muted-foreground">
              Manage recurring workflow execution schedules
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Total Schedules</h3>
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{total}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Active</h3>
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold">
                {schedules.filter((s) => s.details && !s.details.paused).length}
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Paused</h3>
                <Pause className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold">
                {schedules.filter((s) => s.details && s.details.paused).length}
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Running Actions</h3>
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">
                {schedules.reduce(
                  (sum, s) => sum + (s.details?.state?.runningActions || 0),
                  0,
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search schedules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Schedules Table */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-4 text-left font-medium text-sm">Schedule ID</th>
                  <th className="p-4 text-left font-medium text-sm">Workflow</th>
                  <th className="p-4 text-left font-medium text-sm">Schedule</th>
                  <th className="p-4 text-left font-medium text-sm">State</th>
                  <th className="p-4 text-left font-medium text-sm">Executions</th>
                  <th className="p-4 text-left font-medium text-sm">Next Run</th>
                  <th className="p-4 text-left font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading schedules...
                      </div>
                    </td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {searchQuery ? 'No schedules match your search' : 'No schedules found'}
                    </td>
                  </tr>
                ) : (
                  schedules.map(({ scheduleId, details }) => (
                    <tr key={scheduleId} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-sm">{scheduleId}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {details?.spec?.timezone && `TZ: ${details.spec.timezone}`}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium">
                          {details?.action?.workflowType || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Queue: {details?.action?.taskQueue || '—'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{getCronDescription(details?.spec?.cronExpression)}</div>
                        {details?.spec?.cronExpression && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {details.spec.cronExpression}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {details?.paused ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <Pause className="h-3 w-3" />
                              Paused
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <Play className="h-3 w-3" />
                              Active
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {details?.overlap || 'SKIP'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <span className="text-green-600">
                            {details?.state?.successfulActions || details?.successfulActions || '0'}
                          </span>
                          {' / '}
                          <span className="text-red-600">
                            {details?.state?.failedActions || details?.failedActions || '0'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total: {details?.state?.totalActions || details?.totalActions || '0'}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(details?.nextRunAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(details || { scheduleId })}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handlePauseResume(scheduleId, details?.paused ?? false)
                            }
                            disabled={actionLoading[scheduleId]}
                            title={details?.paused ? 'Resume schedule' : 'Pause schedule'}
                          >
                            {actionLoading[scheduleId] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : details?.paused ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openDeleteDialog(details || { scheduleId })
                            }
                            title="Delete schedule"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
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
                {Math.min(currentPage * pageSize, total)} of {total} schedules
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

      {/* Create Schedule Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Temporal Schedule</DialogTitle>
            <DialogDescription>
              Create a new recurring schedule for workflow execution
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {createError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {createError}
              </div>
            )}

            {/* Schedule ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Schedule ID *</label>
              <Input
                placeholder="e.g., ruling-indexing-saos-nightly"
                value={createForm.scheduleId}
                onChange={(e) => setCreateForm({ ...createForm, scheduleId: e.target.value })}
              />
            </div>

            {/* Workflow Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Workflow Type *</label>
              <Select
                value={createForm.workflowType}
                onValueChange={(value) => setCreateForm({ ...createForm, workflowType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or enter workflow type" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_WORKFLOWS.map((wf) => (
                    <SelectItem key={wf} value={wf}>
                      {wf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or enter custom workflow type"
                value={createForm.workflowType}
                onChange={(e) => setCreateForm({ ...createForm, workflowType: e.target.value })}
                className="mt-2"
              />
            </div>

            {/* Workflow ID Template */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Workflow ID Template *</label>
              <Input
                placeholder="e.g., scheduled-${source}-${Date.now()}"
                value={createForm.workflowId}
                onChange={(e) => setCreateForm({ ...createForm, workflowId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use template variables like ${'{'}timestamp{'}'} for dynamic IDs
              </p>
            </div>

            {/* Task Queue */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Queue</label>
              <Input
                placeholder="legal-ai-task-queue"
                value={createForm.taskQueue}
                onChange={(e) => setCreateForm({ ...createForm, taskQueue: e.target.value })}
              />
            </div>

            {/* Cron Expression */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Schedule (Cron Expression) *</label>
              <Select
                value={createForm.cronExpression}
                onValueChange={(value) => setCreateForm({ ...createForm, cronExpression: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CRON_EXPRESSIONS.map((preset) => (
                    <SelectItem key={preset.expression} value={preset.expression}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or enter custom cron (e.g., 0 2 * * *)"
                value={createForm.cronExpression}
                onChange={(e) => setCreateForm({ ...createForm, cronExpression: e.target.value })}
                className="mt-2 font-mono"
              />
            </div>

            {/* Overlap Policy */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Overlap Policy</label>
              <Select
                value={createForm.overlap}
                onValueChange={(value: OverlapPolicy) =>
                  setCreateForm({ ...createForm, overlap: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OVERLAP_POLICIES.map((policy) => (
                    <SelectItem key={policy.value} value={policy.value}>
                      <div className="flex flex-col">
                        <span>{policy.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {policy.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Initial State */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="paused"
                checked={createForm.paused}
                onChange={(e) => setCreateForm({ ...createForm, paused: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="paused" className="text-sm">
                Start paused (schedule won&apos;t execute until resumed)
              </label>
            </div>

            {/* Optional Args */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Workflow Arguments (JSON, optional)</label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                placeholder='{"source": "saos", "batchSize": 100}'
                value={createForm.args}
                onChange={(e) => setCreateForm({ ...createForm, args: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule} disabled={createLoading}>
              {createLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Details</DialogTitle>
            <DialogDescription>Detailed information about the schedule</DialogDescription>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Schedule ID</label>
                  <p className="font-mono text-sm">{selectedSchedule.scheduleId}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <p className="flex items-center gap-2 mt-1">
                      {selectedSchedule.paused ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Pause className="h-3 w-3" />
                          Paused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <Play className="h-3 w-3" />
                          Active
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        ({selectedSchedule.overlap} overlap)
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Exists</label>
                    <p className="mt-1">
                      {selectedSchedule.exists ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Details */}
                {selectedSchedule.action && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Action
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Workflow Type:</span>{' '}
                        <span className="font-mono">{selectedSchedule.action.workflowType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Workflow ID:</span>{' '}
                        <span className="font-mono">{selectedSchedule.action.workflowId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Task Queue:</span>{' '}
                        <span className="font-mono">{selectedSchedule.action.taskQueue}</span>
                      </div>
                      {selectedSchedule.action.args && (
                        <div>
                          <span className="text-muted-foreground">Arguments:</span>{' '}
                          <pre className="font-mono text-xs bg-background p-2 rounded mt-1 overflow-x-auto">
                            {selectedSchedule.action.args}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule Spec */}
                {selectedSchedule.spec && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Schedule Specification
                    </h4>
                    <div className="space-y-1 text-sm">
                      {selectedSchedule.spec.cronExpression && (
                        <div>
                          <span className="text-muted-foreground">Cron Expression:</span>{' '}
                          <span className="font-mono">{selectedSchedule.spec.cronExpression}</span>
                        </div>
                      )}
                      {selectedSchedule.spec.intervalSeconds && (
                        <div>
                          <span className="text-muted-foreground">Interval:</span>{' '}
                          <span>{selectedSchedule.spec.intervalSeconds}s</span>
                        </div>
                      )}
                      {selectedSchedule.spec.timezone && (
                        <div>
                          <span className="text-muted-foreground">Timezone:</span>{' '}
                          <span>{selectedSchedule.spec.timezone}</span>
                        </div>
                      )}
                      {selectedSchedule.spec.startTime && (
                        <div>
                          <span className="text-muted-foreground">Start Time:</span>{' '}
                          <span>{formatDate(selectedSchedule.spec.startTime)}</span>
                        </div>
                      )}
                      {selectedSchedule.spec.endTime && (
                        <div>
                          <span className="text-muted-foreground">End Time:</span>{' '}
                          <span>{formatDate(selectedSchedule.spec.endTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Execution Statistics */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Execution Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Last Run:</span>{' '}
                      <span>{formatDate(selectedSchedule.lastRunAt)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next Run:</span>{' '}
                      <span>{formatDate(selectedSchedule.nextRunAt)}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Successful:</span>{' '}
                      <span>
                        {selectedSchedule.state?.successfulActions ||
                          selectedSchedule.successfulActions ||
                          '0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-red-600">Failed:</span>{' '}
                      <span>
                        {selectedSchedule.state?.failedActions ||
                          selectedSchedule.failedActions ||
                          '0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Actions:</span>{' '}
                      <span>
                        {selectedSchedule.state?.totalActions ||
                          selectedSchedule.totalActions ||
                          '0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Missed:</span>{' '}
                      <span>
                        {selectedSchedule.state?.missedActions ||
                          selectedSchedule.missedActions ||
                          '0'}
                      </span>
                    </div>
                    {selectedSchedule.state?.runningActions !== undefined && (
                      <div>
                        <span className="text-blue-600">Running Now:</span>{' '}
                        <span>{selectedSchedule.state.runningActions}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The schedule will be permanently removed from
              Temporal.
            </DialogDescription>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <p className="font-medium">{selectedSchedule.scheduleId}</p>
                {selectedSchedule.action && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Workflow: {selectedSchedule.action.workflowType}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Type <span className="font-mono bg-muted px-1 rounded">confirm</span> to delete
                </label>
                <Input
                  placeholder="confirm"
                  value={deleteConfirm ? 'confirm' : ''}
                  onChange={(e) => setDeleteConfirm(e.target.value === 'confirm')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason (optional)</label>
                <Input
                  placeholder="Why are you deleting this schedule?"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!deleteConfirm || deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
