'use client';

import React, { useState, useCallback } from 'react';
import { X, Mail, Shield, Calendar, Check, UserX, Edit2, Save, XCircle } from 'lucide-react';
import { Button, Input } from '@legal/ui';
import { Label } from '@legal/ui';
import { dataProvider } from '@providers/data-provider';

// Use the generated User type from GraphQL
import type { User } from '@/generated/graphql';

interface UserDetailDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: () => void;
}

export function UserDetailDialog({ open, onClose, user, onUpdate }: UserDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    email: user?.email || '',
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'user',
    isActive: user?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when user changes
  React.useEffect(() => {
    if (user) {
      setEditForm({
        email: user.email,
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user]);

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

    // Validate
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

    setIsLoading(true);
    try {
      const dp = dataProvider;
      if (!dp) throw new Error('Data provider not available');

      // Build the input object with only changed fields
      const inputUpdate: Record<string, unknown> = {};
      if (editForm.email !== user.email) inputUpdate.email = editForm.email;
      if (editForm.username !== (user.username ?? '')) inputUpdate.username = editForm.username || undefined;
      if (editForm.firstName !== (user.firstName ?? '')) inputUpdate.firstName = editForm.firstName || undefined;
      if (editForm.lastName !== (user.lastName ?? '')) inputUpdate.lastName = editForm.lastName || undefined;
      if (editForm.role !== user.role) inputUpdate.role = editForm.role;
      if (editForm.isActive !== user.isActive) inputUpdate.isActive = editForm.isActive;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dp as any).custom({
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'updateOneUser',
            fields: ['id', 'email', 'username', 'firstName', 'lastName', 'role', 'isActive', 'updatedAt'],
            variables: {
              id: user.id,
              input: inputUpdate,
            },
          },
        },
      });
      setIsEditing(false);
      onUpdate();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update user:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to update user',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, editForm, onUpdate, onClose]);

  const handleToggleStatus = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const dp = dataProvider;
      if (!dp) throw new Error('Data provider not available');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dp as any).custom({
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: user.isActive ? 'suspendUser' : 'activateUser',
            fields: ['id', 'isActive'],
            variables: {
              input: user.isActive
                ? { userId: user.id, reason: 'Admin action via user details' }
                : { userId: user.id },
            },
          },
        },
      });
      onUpdate();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to toggle user status:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to update user status',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, onUpdate]);

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email;
  };

  if (!open || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-detail-title"
    >
      <div className="bg-background rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 id="user-detail-title" className="text-xl font-semibold flex items-center gap-2">
              {isEditing ? <Edit2 className="w-5 h-5" /> : null}
              User Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Close dialog"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {errors.submit && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                  {getDisplayName(user)
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="font-semibold">{getDisplayName(user)}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
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

            {/* Form Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleEditFieldChange('email', e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                      disabled={isLoading}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                {isEditing ? (
                  <Input
                    id="username"
                    value={editForm.username}
                    onChange={(e) => handleEditFieldChange('username', e.target.value)}
                    disabled={isLoading}
                  />
                ) : (
                  <div className="p-2 bg-muted/30 rounded">
                    {user.username || <span className="text-muted-foreground">Not set</span>}
                  </div>
                )}
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    value={editForm.firstName}
                    onChange={(e) => handleEditFieldChange('firstName', e.target.value)}
                    disabled={isLoading}
                  />
                ) : (
                  <div className="p-2 bg-muted/30 rounded">
                    {user.firstName || <span className="text-muted-foreground">Not set</span>}
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    value={editForm.lastName}
                    onChange={(e) => handleEditFieldChange('lastName', e.target.value)}
                    disabled={isLoading}
                  />
                ) : (
                  <div className="p-2 bg-muted/30 rounded">
                    {user.lastName || <span className="text-muted-foreground">Not set</span>}
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                {isEditing ? (
                  <select
                    id="role"
                    value={editForm.role}
                    onChange={(e) =>
                      handleEditFieldChange('role', e.target.value as 'user' | 'admin')
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={isLoading}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{user.role}</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                {isEditing ? (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <input
                      id="status"
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => handleEditFieldChange('isActive', e.target.checked)}
                      className="h-4 w-4 rounded"
                      disabled={isLoading}
                    />
                    <label htmlFor="status" className="text-sm cursor-pointer">
                      Account is active
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    {user.isActive ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 text-destructive" />
                        <span>Suspended</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Section */}
            {!isEditing && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Account Information</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span>
                      {new Date(user.createdAt).toLocaleDateString()} at{' '}
                      {new Date(user.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>
                      {new Date(user.updatedAt).toLocaleDateString()} at{' '}
                      {new Date(user.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {user.disclaimerAccepted && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">Disclaimer accepted:</span>
                      <span>
                        {user.disclaimerAcceptedAt
                          ? new Date(user.disclaimerAcceptedAt).toLocaleDateString()
                          : 'Yes'}
                      </span>
                    </div>
                  )}
                  {user.stripeCustomerId && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Stripe Customer:</span>
                      <span className="font-mono text-xs">{user.stripeCustomerId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 rounded-b-lg flex justify-between">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={handleToggleStatus} disabled={isLoading}>
                {user.isActive ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Suspend Account
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Activate Account
                  </>
                )}
              </Button>
              <div className="flex gap-2">
                <Button onClick={onClose} variant="outline" disabled={isLoading}>
                  Close
                </Button>
                <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setErrors({});
                }}
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
