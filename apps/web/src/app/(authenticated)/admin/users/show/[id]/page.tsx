'use client';

import React from 'react';
import { useOne } from '@refinedev/core';
import { useRouter, useParams } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin';
  isActive: boolean;
  disclaimerAccepted: boolean;
  disclaimerAcceptedAt: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUserShowPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { query, result } = useOne<User>({
    resource: 'users',
    id: userId,
  });

  const { isLoading, isError } = query;
  const user = result;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading user...</div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Failed to load user</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground">View user information and account details</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-md hover:bg-accent"
          >
            Back to Users
          </button>
          <a
            href={`/admin/users/edit/${user.id}`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Edit User
          </a>
        </div>
      </div>

      {/* User Information */}
      <div className="rounded-xl border bg-card">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold">Profile Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="mt-1 text-sm">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1 text-sm">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <p className="mt-1 text-sm">{user.username || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="mt-1 text-sm">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">First Name</label>
              <p className="mt-1 text-sm">{user.firstName || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Name</label>
              <p className="mt-1 text-sm">{user.lastName || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="rounded-xl border bg-card">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold">Account Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    user.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
                      : 'bg-gray-50 text-gray-700 ring-gray-500/10'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    user.isActive
                      ? 'bg-green-50 text-green-700 ring-green-600/20'
                      : 'bg-red-50 text-red-700 ring-red-600/20'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Disclaimer Accepted
              </label>
              <p className="mt-1 text-sm">{user.disclaimerAccepted ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Disclaimer Accepted At
              </label>
              <p className="mt-1 text-sm">
                {user.disclaimerAcceptedAt
                  ? new Date(user.disclaimerAcceptedAt).toLocaleString()
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Stripe Customer ID
              </label>
              <p className="mt-1 text-sm font-mono">{user.stripeCustomerId || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="rounded-xl border bg-card">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold">Timestamps</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created At</label>
              <p className="mt-1 text-sm">{new Date(user.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Updated At</label>
              <p className="mt-1 text-sm">{new Date(user.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
