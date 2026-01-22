'use client';

import React, { useState } from 'react';
import { useList, useInvalidate, useMutation } from '@refinedev/core';

interface User {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin';
  isActive: boolean;
  disclaimerAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const invalidate = useInvalidate();

  const { queryResult } = useList<User>({
    resource: 'users',
    pagination: { pageSize: 20 },
    filters: [
      ...(filter !== 'all'
        ? [
            {
              field: 'isActive',
              operator: 'eq' as const,
              value: filter === 'active',
            },
          ]
        : []),
      ...(roleFilter !== 'all'
        ? [
            {
              field: 'role',
              operator: 'eq' as const,
              value: roleFilter,
            },
          ]
        : []),
    ],
  });

  const { data, isLoading, refetch } = queryResult;
  const users = data?.data || [];

  const { mutate: suspendUser } = useMutation({
    resource: 'users',
    action: 'suspendUser',
    method: 'post',
    onSuccess: () => {
      invalidate({
        resource: 'users',
        invalidates: ['list'],
      });
    },
  });

  const { mutate: activateUser } = useMutation({
    resource: 'users',
    action: 'activateUser',
    method: 'post',
    onSuccess: () => {
      invalidate({
        resource: 'users',
        invalidates: ['list'],
      });
    },
  });

  const handleQuickToggle = (user: User) => {
    if (user.isActive) {
      const reason = prompt('Enter reason for suspension:');
      if (reason) {
        suspendUser({
          input: {
            userId: user.id,
            reason,
          },
        });
      }
    } else {
      activateUser({
        input: {
          userId: user.id,
        },
      });
    }
  };

  const filteredUsers = users;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, permissions, and access
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-sm font-medium">Status:</label>
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as 'all' | 'active' | 'inactive')
            }
            className="ml-2 px-3 py-2 border rounded-md"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Role:</label>
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as 'all' | 'user' | 'admin')
            }
            className="ml-2 px-3 py-2 border rounded-md"
          >
            <option value="all">All</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading users...</div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Username
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Disclaimer
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle font-medium">
                        {user.email}
                      </td>
                      <td className="p-4 align-middle">
                        {user.username || '-'}
                      </td>
                      <td className="p-4 align-middle">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : '-'}
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            user.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
                              : 'bg-gray-50 text-gray-700 ring-gray-500/10'
                          }`}
                        >
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            user.isActive
                              ? 'bg-green-50 text-green-700 ring-green-600/20'
                              : 'bg-red-50 text-red-700 ring-red-600/20'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            user.disclaimerAccepted
                              ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                              : 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                          }`}
                        >
                          {user.disclaimerAccepted ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/admin/users/show/${user.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View
                          </a>
                          <a
                            href={`/admin/users/edit/${user.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </a>
                          <button
                            onClick={() => handleQuickToggle(user)}
                            className={`text-sm hover:underline ${
                              user.isActive
                                ? 'text-orange-600 hover:text-orange-800'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {user.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* User count summary */}
          <div className="border-t p-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} user(s)
          </div>
        </div>
      )}
    </div>
  );
}
