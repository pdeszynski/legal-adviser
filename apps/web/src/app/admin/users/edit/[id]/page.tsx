'use client';

import React, { useState, useEffect } from 'react';
import { useOne, useUpdate, useInvalidate, useCustomMutation } from '@refinedev/core';
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
  createdAt: string;
  updatedAt: string;
}

export default function AdminUserEditPage() {
  const params = useParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const invalidate = useInvalidate();

  // Handle Next.js 15 params (could be string or string[] or undefined)
  useEffect(() => {
    const id = params.id;
    if (id && typeof id === 'string') {
      setUserId(id);
    }
  }, [params.id]);

  const { query, result } = useOne<User>({
    resource: 'users',
    id: userId ?? '',
    queryOptions: {
      enabled: !!userId,
    },
  });

  const { data: userData, isLoading, isError } = query;
  const user = result;

  const [formData, setFormData] = useState({
    email: user?.email || '',
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'user',
    isActive: user?.isActive ?? true,
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  const { mutate: updateUser, mutation: updateMutation } = useUpdate();
  const isUpdating =
    (updateMutation as any).isLoading ?? (updateMutation as any).isPending ?? false;

  const { mutate: suspendUser, mutation: suspendMutation } = useCustomMutation();
  const isSuspending =
    (suspendMutation as any).isLoading ?? (suspendMutation as any).isPending ?? false;

  const { mutate: activateUser, mutation: activateMutation } = useCustomMutation();
  const isActivating =
    (activateMutation as any).isLoading ?? (activateMutation as any).isPending ?? false;

  const { mutate: changeUserRole, mutation: changeRoleMutation } = useCustomMutation();
  const isChangingRole =
    (changeRoleMutation as any).isLoading ?? (changeRoleMutation as any).isPending ?? false;

  const { mutate: resetPassword, mutation: resetPasswordMutation } = useCustomMutation();
  const isResetting =
    (resetPasswordMutation as any).isLoading ?? (resetPasswordMutation as any).isPending ?? false;

  React.useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    updateUser(
      {
        resource: 'users',
        id: userId,
        values: {
          email: formData.email,
          username: formData.username || null,
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
        },
      },
      {
        onSuccess: () => {
          invalidate({
            resource: 'users',
            id: userId,
            invalidates: ['list', 'detail'],
          });
          alert('User updated successfully');
        },
        onError: (error: any) => {
          alert(`Failed to update user: ${error.message}`);
        },
      },
    );
  };

  const handleRoleChange = (newRole: 'user' | 'admin') => {
    if (!userId) return;
    changeUserRole(
      {
        url: '/changeUserRole',
        method: 'post',
        values: {
          input: {
            userId,
            role: newRole,
          },
        },
      },
      {
        onSuccess: () => {
          invalidate({
            resource: 'users',
            id: userId,
            invalidates: ['list', 'detail'],
          });
          alert('User role changed successfully');
        },
        onError: (error: any) => {
          alert(`Failed to change user role: ${error.message}`);
        },
      },
    );
  };

  const handleSuspend = () => {
    if (!userId) return;
    if (!suspendReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }
    suspendUser(
      {
        url: '/suspendUser',
        method: 'post',
        values: {
          input: {
            userId,
            reason: suspendReason,
          },
        },
      },
      {
        onSuccess: () => {
          invalidate({
            resource: 'users',
            id: userId,
            invalidates: ['list', 'detail'],
          });
          setShowSuspendDialog(false);
          setSuspendReason('');
          alert('User suspended successfully');
        },
        onError: (error: any) => {
          alert(`Failed to suspend user: ${error.message}`);
        },
      },
    );
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    resetPassword(
      {
        url: '/resetUserPassword',
        method: 'post',
        values: {
          input: {
            userId,
            newPassword: passwordData.newPassword,
          },
        },
      },
      {
        onSuccess: () => {
          setPasswordData({ newPassword: '', confirmPassword: '' });
          setShowPasswordReset(false);
          alert('Password reset successfully');
        },
        onError: (error: any) => {
          alert(`Failed to reset password: ${error.message}`);
        },
      },
    );
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground">Manage user account settings and permissions</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-md hover:bg-accent"
        >
          Back to Users
        </button>
      </div>

      {/* User Info Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{user.email}</h2>
            <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
            <p className="text-sm text-muted-foreground">
              Created: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                user.role === 'admin'
                  ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
                  : 'bg-gray-50 text-gray-700 ring-gray-500/10'
              }`}
            >
              {user.role}
            </span>
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
      </div>

      {/* Profile Update Form */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Role Management */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Role Management</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Current Role:</span>
            <span
              className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset ${
                user.role === 'admin'
                  ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
                  : 'bg-gray-50 text-gray-700 ring-gray-500/10'
              }`}
            >
              {user.role}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRoleChange('admin')}
              disabled={user.role === 'admin' || isChangingRole}
              className="px-4 py-2 border rounded-md hover:bg-accent disabled:opacity-50"
            >
              Make Admin
            </button>
            <button
              onClick={() => handleRoleChange('user')}
              disabled={user.role === 'user' || isChangingRole}
              className="px-4 py-2 border rounded-md hover:bg-accent disabled:opacity-50"
            >
              Make User
            </button>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Account Status</h3>
        <div className="space-y-4">
          {user.isActive ? (
            <button
              onClick={() => setShowSuspendDialog(true)}
              disabled={isSuspending}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
            >
              {isSuspending ? 'Suspending...' : 'Suspend Account'}
            </button>
          ) : (
            <button
              onClick={() =>
                userId &&
                activateUser(
                  {
                    url: '/activateUser',
                    method: 'post',
                    values: {
                      input: { userId },
                    },
                  },
                  {
                    onSuccess: () => {
                      invalidate({
                        resource: 'users',
                        id: userId,
                        invalidates: ['list', 'detail'],
                      });
                      alert('User activated successfully');
                    },
                    onError: (error: any) => {
                      alert(`Failed to activate user: ${error.message}`);
                    },
                  },
                )
              }
              disabled={isActivating}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isActivating ? 'Activating...' : 'Activate Account'}
            </button>
          )}

          {showSuspendDialog && (
            <div className="border rounded-md p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Suspension</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Enter the reason for suspending this account..."
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSuspend}
                  disabled={isSuspending}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isSuspending ? 'Suspending...' : 'Confirm Suspension'}
                </button>
                <button
                  onClick={() => {
                    setShowSuspendDialog(false);
                    setSuspendReason('');
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Password Reset</h3>
          <button
            onClick={() => setShowPasswordReset(!showPasswordReset)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showPasswordReset ? 'Hide' : 'Show'}
          </button>
        </div>

        {showPasswordReset && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isResetting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
