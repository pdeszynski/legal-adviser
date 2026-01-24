'use client';

/* eslint-disable max-lines */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@legal/ui';
import {
  Search,
  Plus,
  Shield,
  ShieldAlert,
  UserX,
  Check,
  Trash2,
  RefreshCw,
  Eye,
  Key,
  Download,
  Loader2,
} from 'lucide-react';
import { dataProvider } from '@providers/data-provider';
import type { GraphQLMutationConfig } from '@providers/data-provider';
import { UserDetailDialog } from './user-detail-dialog';
import { UserPasswordDialog } from './user-password-dialog';
import { UserDeleteDialog } from './user-delete-dialog';
import { BulkRoleDialog } from './bulk-role-dialog';
import { BulkSuspendDialog } from './bulk-suspend-dialog';
import type { User } from '@/generated/graphql';

// Use generated User type from admin.graphql

interface RoleFilter {
  role?: 'user' | 'admin' | 'all';
  status?: 'active' | 'suspended' | 'all';
  search: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<RoleFilter>({
    role: 'all',
    status: 'all',
    search: '',
  });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState<User[]>([]);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const dp = dataProvider;
      if (!dp) return;

      const filterList: Array<{ field: string; operator: string; value: string | boolean }> = [];

      // Apply role filter
      if (filters.role && filters.role !== 'all') {
        filterList.push({ field: 'role', operator: 'eq', value: filters.role });
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        filterList.push({
          field: 'isActive',
          operator: 'eq',
          value: filters.status === 'active',
        });
      }

      // Apply search filter
      if (filters.search) {
        filterList.push({ field: 'email', operator: 'contains', value: filters.search });
      }

      const result = await dp.getList<User>({
        resource: 'users',
        pagination: { currentPage, pageSize },
        filters: filterList.length > 0 ? filterList : undefined,
        sorters: [{ field: 'createdAt', order: 'desc' }],
      });

      setUsers(result.data);
      setTotal(result.total);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (role: 'user' | 'admin' | 'all') => {
    setFilters({ ...filters, role });
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: 'active' | 'suspended' | 'all') => {
    setFilters({ ...filters, status });
    setCurrentPage(1);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const handleUserAction = async (
    userId: string,
    action: 'suspend' | 'activate' | 'promote' | 'demote',
  ) => {
    const dp = dataProvider;
    if (!dp) return;

    const mutationConfig: GraphQLMutationConfig<{
      userId: string;
      reason?: string;
      role?: string;
    }> = {
      url: '',
      method: 'post',
      config: {
        mutation: {
          operation:
            action === 'suspend'
              ? 'suspendUser'
              : action === 'activate'
                ? 'activateUser'
                : 'changeUserRole',
          fields: ['id', 'email', 'isActive', 'role'],
          variables: {
            input:
              action === 'suspend'
                ? { userId, reason: 'Admin action' }
                : action === 'activate'
                  ? { userId }
                  : { userId, role: action === 'promote' ? 'admin' : 'user' },
          },
        },
      },
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dp as any).custom({
        url: '',
        method: 'post',
        config: mutationConfig.config,
      });
      fetchUsers();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to ${action} user:`, error);
      alert(
        `Failed to ${action} user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  const handleBulkAction = async (action: 'suspend' | 'delete') => {
    if (selectedUsers.size === 0) return;

    if (action === 'delete') {
      const usersToDelete = users.filter((u) => selectedUsers.has(u.id));
      setUsersToDelete(usersToDelete);
      setDeleteDialogOpen(true);
      return;
    }

    if (action === 'suspend') {
      openBulkSuspendDialog();
    }
  };

  const openDetailDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  }, []);

  const openPasswordDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setPasswordDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((user: User) => {
    setUsersToDelete([user]);
    setDeleteDialogOpen(true);
  }, []);

  // Export selected users to CSV
  const exportSelectedToCSV = useCallback(() => {
    if (selectedUsers.size === 0) return;

    const selectedUsersData = users.filter((u) => selectedUsers.has(u.id));

    // CSV headers
    const headers = ['Email', 'Username', 'First Name', 'Last Name', 'Role', 'Status', 'Joined'];

    // Convert users to CSV rows
    const rows = selectedUsersData.map((user) => [
      user.email,
      user.username || '',
      user.firstName || '',
      user.lastName || '',
      user.role,
      user.isActive ? 'Active' : 'Suspended',
      new Date(user.createdAt).toLocaleDateString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"')) {
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
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [selectedUsers, users]);

  // Bulk activate with progress tracking
  const handleBulkActivate = useCallback(async () => {
    if (selectedUsers.size === 0) return;

    const dp = dataProvider;
    if (!dp) return;

    const userIds = Array.from(selectedUsers);
    setBulkProgress({ current: 0, total: userIds.length });

    try {
      const mutationConfig: GraphQLMutationConfig<{ userIds: string[] }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'bulkActivateUsers',
            fields: ['success', { failed: ['id', 'error'] }],
            variables: {
              input: { userIds },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dp as any).custom(mutationConfig);

      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to activate users:', error);
      alert(
        `Failed to activate users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setBulkProgress(null);
    }
  }, [selectedUsers, fetchUsers]);

  // Open bulk role dialog
  const openBulkRoleDialog = useCallback(() => {
    if (selectedUsers.size === 0) return;
    setRoleDialogOpen(true);
  }, [selectedUsers.size]);

  // Open bulk suspend dialog
  const openBulkSuspendDialog = useCallback(() => {
    if (selectedUsers.size === 0) return;
    setSuspendDialogOpen(true);
  }, []);

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
          </div>
          <Button onClick={() => router.push('/admin/users/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Total Users</h3>
                <span className="text-2xl">👥</span>
              </div>
              <div className="text-2xl font-bold">{total}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Active</h3>
                <span className="text-2xl text-green-600">✓</span>
              </div>
              <div className="text-2xl font-bold">{users.filter((u) => u.isActive).length}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Admins</h3>
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === 'admin').length}
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Suspended</h3>
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div className="text-2xl font-bold">{users.filter((u) => !u.isActive).length}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filters.role === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleFilterChange('all')}
            >
              All Roles
            </Button>
            <Button
              variant={filters.role === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleFilterChange('admin')}
            >
              Admins
            </Button>
            <Button
              variant={filters.role === 'user' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleFilterChange('user')}
            >
              Users
            </Button>
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
              variant={filters.status === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('active')}
            >
              Active
            </Button>
            <Button
              variant={filters.status === 'suspended' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('suspended')}
            >
              Suspended
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
              {bulkProgress && (
                <span className="text-sm text-muted-foreground">
                  (Processing: {bulkProgress.current}/{bulkProgress.total})
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkActivate}
                disabled={!!bulkProgress}
              >
                {bulkProgress ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('suspend')}
                disabled={!!bulkProgress}
              >
                {bulkProgress ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4 mr-2" />
                )}
                Suspend
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openBulkRoleDialog}
                disabled={!!bulkProgress}
              >
                {bulkProgress ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Change Role
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportSelectedToCSV}
                disabled={!!bulkProgress}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                disabled={!!bulkProgress}
              >
                {bulkProgress ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-4 text-left font-medium text-sm">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={toggleAllSelection}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="p-4 text-left font-medium text-sm">User</th>
                  <th className="p-4 text-left font-medium text-sm">Role</th>
                  <th className="p-4 text-left font-medium text-sm">Status</th>
                  <th className="p-4 text-left font-medium text-sm">Disclaimer</th>
                  <th className="p-4 text-left font-medium text-sm">Joined</th>
                  <th className="p-4 text-left font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          <div className="font-medium">{getDisplayName(user)}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </button>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <ShieldAlert className="h-3 w-3" />
                          )}
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <Check className="h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3" />
                              Suspended
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        {user.disclaimerAccepted ? (
                          <span className="text-green-600">
                            <Check className="h-4 w-4 inline" />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(user)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPasswordDialog(user)}
                            title="Reset password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          {user.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              title="Suspend user"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'activate')}
                              title="Activate user"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {user.role === 'user' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'promote')}
                              title="Promote to admin"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'demote')}
                              title="Demote to user"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            title="Delete user"
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
                {Math.min(currentPage * pageSize, total)} of {total} users
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

      {/* Dialogs */}
      <UserDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        user={selectedUser}
        onUpdate={fetchUsers}
      />

      <UserPasswordDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        user={selectedUser}
        onUpdate={fetchUsers}
      />

      <UserDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        users={usersToDelete}
        onDelete={() => {
          setSelectedUsers(new Set());
          fetchUsers();
        }}
      />

      <BulkRoleDialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        users={users.filter((u) => selectedUsers.has(u.id))}
        onUpdate={() => {
          setSelectedUsers(new Set());
          fetchUsers();
        }}
      />

      <BulkSuspendDialog
        open={suspendDialogOpen}
        onClose={() => setSuspendDialogOpen(false)}
        users={users.filter((u) => selectedUsers.has(u.id))}
        onUpdate={() => {
          setSelectedUsers(new Set());
          fetchUsers();
        }}
      />
    </>
  );
}
