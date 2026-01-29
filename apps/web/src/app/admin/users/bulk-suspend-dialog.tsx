'use client';

import React, { useState, useCallback } from 'react';
import { UserX, X, Loader2, AlertTriangle } from 'lucide-react';
import { Button, Input } from '@legal/ui';
import { Label } from '@legal/ui';
import { dataProvider } from '@providers/data-provider';
import type { GraphQLMutationConfig } from '@providers/data-provider';

interface User {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
}

interface BulkSuspendDialogProps {
  open: boolean;
  onClose: () => void;
  users: User[];
  onUpdate: () => void;
}

export function BulkSuspendDialog({ open, onClose, users, onUpdate }: BulkSuspendDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  const resetForm = useCallback(() => {
    setReason('');
    setError('');
    setSuccessCount(0);
  }, []);

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email;
  };

  const handleBulkSuspend = useCallback(async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for suspension');
      return;
    }

    const dp = dataProvider;
    if (!dp) {
      setError('Data provider not available');
      return;
    }

    setIsLoading(true);
    setError('');

    const userIds = users.map((u) => u.id);

    try {
      const mutationConfig: GraphQLMutationConfig<{ userIds: string[]; reason: string }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'bulkSuspendUsers',
            fields: ['success', 'failed { id error }'],
            variables: {
              input: { userIds, reason },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await (dp as any).custom(mutationConfig);

      const successCount = result?.success?.length || 0;
      setSuccessCount(successCount);

      if (result?.failed?.length > 0) {
        setError(`${result.failed.length} user(s) could not be suspended`);
      }

      // Only close if all succeeded
      if (result?.failed?.length === 0) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to suspend users:', error);
      setError(error instanceof Error ? error.message : 'Failed to suspend users');
    } finally {
      setIsLoading(false);
    }
  }, [reason, users, onUpdate, onClose]);

  if (!open || users.length === 0) return null;

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-suspend-title"
    >
      <div className="bg-background rounded-lg shadow-2xl max-w-md w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2
              id="bulk-suspend-title"
              className="text-xl font-semibold flex items-center gap-2 text-destructive"
            >
              <UserX className="w-5 h-5" />
              Suspend {users.length} User{users.length !== 1 ? 's' : ''}
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
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {successCount > 0 && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-400">
                {successCount} user(s) suspended successfully
              </p>
            </div>
          )}

          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4">
            <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warning
            </p>
            <p className="text-sm text-muted-foreground">
              Suspended users will not be able to access their accounts. They will need to be
              manually reactivated to regain access.
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium">{users.length} users selected</p>
            <p className="text-xs text-muted-foreground">
              {activeCount} active user{activeCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Users list */}
          <div className="mb-4 max-h-32 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Users to be suspended:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {users.map((user) => (
                <li key={user.id} className="flex items-center gap-2">
                  <UserX className="h-3 w-3 text-destructive" />
                  {user.email}
                </li>
              ))}
            </ul>
          </div>

          {/* Reason input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for suspension *</Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for suspending these user accounts..."
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-destructive resize-none"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded in the audit log for each suspended user.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 rounded-b-lg flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              onUpdate();
              onClose();
            }}
            disabled={isLoading}
          >
            {successCount > 0 ? 'Close' : 'Cancel'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleBulkSuspend}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suspending...
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Suspend {users.length} User{users.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
