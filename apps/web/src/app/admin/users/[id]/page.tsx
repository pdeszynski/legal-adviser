'use client';

/* eslint-disable max-lines */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Shield,
  Calendar,
  Check,
  UserX,
  Edit2,
  Save,
  XCircle,
  FileText,
  MessageSquare,
  Settings,
  History,
  Key,
  AlertCircle,
  Clock,
  DollarSign,
  Zap,
} from 'lucide-react';
import { Button, Input } from '@legal/ui';
import { Label } from '@legal/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@legal/ui';
import { dataProvider } from '@providers/data-provider';
import type { GraphQLMutationConfig } from '@providers/data-provider';

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  role: 'user' | 'admin';
  disclaimerAccepted: boolean;
  disclaimerAcceptedAt?: string;
  stripeCustomerId?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LegalDocument {
  id: string;
  title?: string;
  documentType?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

interface LegalQuery {
  id: string;
  question: string;
  answerMarkdown?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserSession {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  createdAt: string;
}

interface UsageStats {
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
}

type TabType = 'overview' | 'documents' | 'queries' | 'settings' | 'audit';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'queries', label: 'Queries', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'audit', label: 'Audit Log', icon: History },
];

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = (params.id as string) || '';

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab-specific data
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [queries, setQueries] = useState<LegalQuery[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Edit mode for settings tab
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'user' | 'admin',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Suspension dialog
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // 2FA force-disable dialog
  const [disable2faDialogOpen, setDisable2faDialogOpen] = useState(false);

  // Fetch user data
  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dp = dataProvider;
      if (!dp) throw new Error('Data provider not available');

      const result = await dp.getOne<User>({
        resource: 'users',
        id: userId,
      });
      setUser(result.data);
      setEditForm({
        email: result.data.email,
        username: result.data.username || '',
        firstName: result.data.firstName || '',
        lastName: result.data.lastName || '',
        role: result.data.role,
        isActive: result.data.isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch user's documents
  const fetchDocuments = useCallback(async () => {
    try {
      const dp = dataProvider;
      if (!dp) return;

      const result = await dp.getList<LegalDocument>({
        resource: 'legalDocuments',
        pagination: { currentPage: 1, pageSize: 20 },
        filters: [{ field: 'userId', operator: 'eq', value: userId }],
        sorters: [{ field: 'createdAt', order: 'desc' }],
      });
      setDocuments(result.data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  }, [userId]);

  // Fetch user's queries
  const fetchQueries = useCallback(async () => {
    try {
      const dp = dataProvider;
      if (!dp) return;

      const result = await dp.getList<LegalQuery>({
        resource: 'legalQueries',
        pagination: { currentPage: 1, pageSize: 20 },
        filters: [{ field: 'userId', operator: 'eq', value: userId }],
        sorters: [{ field: 'createdAt', order: 'desc' }],
      });
      setQueries(result.data);
    } catch (err) {
      console.error('Failed to fetch queries:', err);
    }
  }, [userId]);

  // Fetch user's sessions
  const fetchSessions = useCallback(async () => {
    try {
      const dp = dataProvider;
      if (!dp) return;

      const result = await dp.getList<UserSession>({
        resource: 'user-sessions',
        pagination: { currentPage: 1, pageSize: 10 },
        filters: [{ field: 'userId', operator: 'eq', value: userId }],
        sorters: [{ field: 'createdAt', order: 'desc' }],
      });
      setSessions(result.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, [userId]);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const dp = dataProvider;
      if (!dp) return;

      const result = await dp.getList<AuditLog>({
        resource: 'audit-logs',
        pagination: { currentPage: 1, pageSize: 50 },
        filters: [{ field: 'userId', operator: 'eq', value: userId }],
        sorters: [{ field: 'createdAt', order: 'desc' }],
      });
      setAuditLogs(result.data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  }, [userId]);

  // Fetch usage stats
  const fetchUsageStats = useCallback(async () => {
    try {
      const dp = dataProvider;
      if (!dp) return;

      const result = await (dp as any).custom({
        url: '',
        method: 'post',
        config: {
          query: {
            operation: 'usageStats',
            fields: ['totalCost', 'totalRequests', 'totalTokens'],
            variables: {
              query: {
                userId,
              },
            },
          },
        },
      });
      setUsageStats(result.data);
    } catch (err) {
      console.error('Failed to fetch usage stats:', err);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (!user) return;
    switch (activeTab) {
      case 'documents':
        fetchDocuments();
        break;
      case 'queries':
        fetchQueries();
        break;
      case 'overview':
        fetchSessions();
        fetchUsageStats();
        break;
      case 'audit':
        fetchAuditLogs();
        break;
    }
  }, [
    activeTab,
    user,
    fetchDocuments,
    fetchQueries,
    fetchSessions,
    fetchAuditLogs,
    fetchUsageStats,
  ]);

  const handleEditFieldChange = (field: keyof typeof editForm, value: string | boolean) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = useCallback(async () => {
    if (!user) return;

    const newErrors: Record<string, string> = {};
    if (!editForm.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      const dp = dataProvider;
      if (!dp) throw new Error('Data provider not available');

      await (dp as any).custom({
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'updateOneUser',
            fields: [
              'id',
              'email',
              'username',
              'firstName',
              'lastName',
              'role',
              'isActive',
              'updatedAt',
            ],
            variables: {
              input: {
                id: { value: userId },
                update: {
                  ...(editForm.email !== user.email && { email: editForm.email }),
                  ...(editForm.username !== user.username && {
                    username: editForm.username || undefined,
                  }),
                  ...(editForm.firstName !== user.firstName && {
                    firstName: editForm.firstName || undefined,
                  }),
                  ...(editForm.lastName !== user.lastName && {
                    lastName: editForm.lastName || undefined,
                  }),
                  ...(editForm.role !== user.role && { role: editForm.role }),
                  ...(editForm.isActive !== user.isActive && { isActive: editForm.isActive }),
                },
              },
            },
          },
        },
      });

      setIsEditing(false);
      fetchUser();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to update user',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, editForm, userId, fetchUser]);

  const handleToggleStatus = useCallback(async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const dp = dataProvider;
      if (!dp) throw new Error('Data provider not available');

      const mutationConfig: GraphQLMutationConfig<{ userId: string; reason?: string }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: user.isActive ? 'suspendUser' : 'activateUser',
            fields: ['id', 'isActive'],
            variables: {
              input: user.isActive
                ? { userId: user.id, reason: suspendReason || 'Admin action via user details' }
                : { userId: user.id },
            },
          },
        },
      };

      await (dp as any).custom({
        url: '',
        method: 'post',
        config: mutationConfig.config,
      });
      setSuspendDialogOpen(false);
      setSuspendReason('');
      fetchUser();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to update user status',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, suspendReason, fetchUser]);

  const handlePasswordReset = useCallback(async () => {
    if (!user) return;

    const newPassword = Math.random().toString(36).slice(-8);
    setIsSaving(true);
    try {
      const dp = dataProvider;
      if (!dp) throw new Error('Data provider not available');

      const mutationConfig: GraphQLMutationConfig<{ userId: string; newPassword: string }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'resetUserPassword',
            fields: ['id', 'email'],
            variables: {
              input: { userId: user.id, newPassword },
            },
          },
        },
      };

      await (dp as any).custom({
        url: '',
        method: 'post',
        config: mutationConfig.config,
      });

      alert(
        `Password reset successful. New password: ${newPassword}\n\nThis would normally be sent to the user's email.`,
      );
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to reset password',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const handleRoleChange = useCallback(
    async (newRole: 'user' | 'admin') => {
      if (!user) return;

      setIsSaving(true);
      try {
        const dp = dataProvider;
        if (!dp) throw new Error('Data provider not available');

        const mutationConfig: GraphQLMutationConfig<{ userId: string; role: string }> = {
          url: '',
          method: 'post',
          config: {
            mutation: {
              operation: 'changeUserRole',
              fields: ['id', 'role'],
              variables: {
                input: { userId: user.id, role: newRole },
              },
            },
          },
        };

        await (dp as any).custom({
          url: '',
          method: 'post',
          config: mutationConfig.config,
        });
        fetchUser();
      } catch (err) {
        setErrors({
          submit: err instanceof Error ? err.message : 'Failed to change role',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [user, fetchUser],
  );

  const handleForceDisable2fa = useCallback(async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const dp = dataProvider;
      if (!dp) throw new Error('Data provider not available');

      const mutationConfig: GraphQLMutationConfig<{ userId: string }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'adminForceDisableTwoFactor',
            fields: ['id', 'twoFactorEnabled'],
            variables: {
              input: { userId: user.id },
            },
          },
        },
      };

      await (dp as any).custom({
        url: '',
        method: 'post',
        config: mutationConfig.config,
      });
      setDisable2faDialogOpen(false);
      fetchUser();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to disable 2FA',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, fetchUser]);

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email;
  };

  const formatDate = (dateString: string) => {
    return (
      new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-lg font-semibold">Error Loading User</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
              <p className="text-muted-foreground">
                {getDisplayName(user)} ({user.email})
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePasswordReset} disabled={isSaving}>
              <Key className="mr-2 h-4 w-4" />
              Reset Password
            </Button>
            <Button
              variant={user.isActive ? 'destructive' : 'default'}
              onClick={() => setSuspendDialogOpen(true)}
              disabled={isSaving}
            >
              {user.isActive ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Suspend
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error display */}
        {errors.submit && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{errors.submit}</p>
          </div>
        )}

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Basic user information and account status</CardDescription>
              </div>
              <div className="flex gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    user.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {user.isActive ? <Check className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                  {user.isActive ? 'Active' : 'Suspended'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {user.role}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <div className="p-2 bg-muted/30 rounded">
                  {user.username || <span className="text-muted-foreground">Not set</span>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>First Name</Label>
                <div className="p-2 bg-muted/30 rounded">
                  {user.firstName || <span className="text-muted-foreground">Not set</span>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <div className="p-2 bg-muted/30 rounded">
                  {user.lastName || <span className="text-muted-foreground">Not set</span>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Joined</Label>
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(user.createdAt)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(user.updatedAt)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                {user.disclaimerAccepted ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Disclaimer accepted</span>
                    {user.disclaimerAcceptedAt && (
                      <span className="text-muted-foreground">
                        on {new Date(user.disclaimerAcceptedAt).toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span>Disclaimer not accepted</span>
                  </>
                )}
              </div>
              {user.stripeCustomerId && (
                <div className="flex items-center gap-2 text-sm mt-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Stripe Customer:</span>
                  <span className="font-mono text-xs">{user.stripeCustomerId}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2FA Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>User 2FA status and security settings</CardDescription>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  user.twoFactorEnabled
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}
              >
                {user.twoFactorEnabled ? (
                  <>
                    <Check className="h-3 w-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Disabled
                  </>
                )}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded">
                <div className="flex items-center gap-3">
                  {user.twoFactorEnabled ? (
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {user.twoFactorEnabled ? '2FA is Active' : '2FA is Not Enabled'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.twoFactorEnabled
                        ? 'This user has two-factor authentication enabled on their account'
                        : 'This user has not set up two-factor authentication'}
                    </p>
                  </div>
                </div>
                {user.twoFactorEnabled && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDisable2faDialogOpen(true)}
                    disabled={isSaving}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Force Disable
                  </Button>
                )}
              </div>
              {user.twoFactorEnabled && user.twoFactorSecret && (
                <div className="text-sm text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-100 dark:border-blue-900/30">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Admin Override Available
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    You can force-disable 2FA for this user if they are locked out of their
                    authenticator app. This will remove their 2FA secret and backup codes.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Usage Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {usageStats ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Tokens</span>
                        <span className="font-semibold">
                          {usageStats.totalTokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Requests</span>
                        <span className="font-semibold">
                          {usageStats.totalRequests.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Cost</span>
                        <span className="font-semibold">${usageStats.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No usage data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Documents Created</span>
                      <span className="font-semibold">{documents.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Queries Submitted</span>
                      <span className="font-semibold">{queries.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Active Sessions</span>
                      <span className="font-semibold">{sessions.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sessions */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                  <CardDescription>User login history and sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.length > 0 ? (
                    <div className="space-y-2">
                      {sessions.slice(0, 5).map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded"
                        >
                          <span className="text-sm font-mono">{session.id.slice(0, 8)}...</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(session.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No sessions recorded</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <Card>
              <CardHeader>
                <CardTitle>User Documents</CardTitle>
                <CardDescription>All legal documents created by this user</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.title || 'Untitled Document'}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.documentType || 'Unknown'} • Created{' '}
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            doc.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : doc.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {doc.status || 'DRAFT'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No documents found</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'queries' && (
            <Card>
              <CardHeader>
                <CardTitle>User Queries</CardTitle>
                <CardDescription>Q&A history and legal questions asked</CardDescription>
              </CardHeader>
              <CardContent>
                {queries.length > 0 ? (
                  <div className="space-y-4">
                    {queries.map((query) => (
                      <div key={query.id} className="p-4 bg-muted/30 rounded">
                        <p className="font-medium mb-1">{query.question}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {query.answerMarkdown || 'No answer yet'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Asked {new Date(query.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No queries found</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle>User Settings</CardTitle>
                <CardDescription>Manage user role and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Role Assignment */}
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={user.role === 'user' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => user.role !== 'user' && handleRoleChange('user')}
                        disabled={isSaving}
                      >
                        User
                      </Button>
                      <Button
                        variant={user.role === 'admin' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => user.role !== 'admin' && handleRoleChange('admin')}
                        disabled={isSaving}
                      >
                        Admin
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Admins have full access to the admin panel and user management features.
                    </p>
                  </div>

                  {/* Account Status */}
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded">
                      {user.isActive ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Account is active</span>
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 text-destructive" />
                          <span>Account is suspended</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Email Settings */}
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <div className="p-3 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer Status */}
                  <div className="space-y-2">
                    <Label>Legal Disclaimer</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded">
                      {user.disclaimerAccepted ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Accepted</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span>Not accepted</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'audit' && (
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>User actions and system events</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded"
                      >
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.resourceType}
                            {log.resourceId && ` • ${log.resourceId.slice(0, 8)}...`}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No audit logs found</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Suspend Dialog */}
      {suspendDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-background rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {user.isActive ? 'Suspend Account' : 'Activate Account'}
              </h2>
            </div>
            <div className="px-6 py-4">
              {user.isActive ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to suspend this account? The user will not be able to
                    access the system.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (optional)</Label>
                    <Input
                      id="reason"
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="e.g., Policy violation"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to activate this account? The user will regain access to the
                  system.
                </p>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-muted/30 rounded-b-lg flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSuspendDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant={user.isActive ? 'destructive' : 'default'}
                onClick={handleToggleStatus}
                disabled={isSaving}
              >
                {isSaving ? 'Processing...' : user.isActive ? 'Suspend' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Force-Disable 2FA Dialog */}
      {disable2faDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-background rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Key className="h-5 w-5 text-destructive" />
                Force Disable 2FA
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to force-disable two-factor authentication for this user?
                </p>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-900/30">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    This action will:
                  </p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 list-disc list-inside">
                    <li>Remove the user's TOTP secret</li>
                    <li>Delete all backup codes</li>
                    <li>Disable 2FA requirement for login</li>
                    <li>Invalidate all existing sessions</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  This should only be done if the user is locked out of their authenticator app and
                  cannot use backup codes.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-muted/30 rounded-b-lg flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDisable2faDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleForceDisable2fa} disabled={isSaving}>
                {isSaving ? 'Processing...' : 'Force Disable 2FA'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
