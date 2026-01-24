'use client';

import React, { useState, useCallback } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@legal/ui';
import { dataProvider } from '@providers/data-provider';

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface UserDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  users: User[];
  onDelete: () => void;
}

export function UserDeleteDialog({ open, onClose, users, onDelete }: UserDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [errors, setErrors] = useState('');

  const resetForm = useCallback(() => {
    setConfirmText('');
    setErrors('');
  }, []);

  // Reset form when dialog closes or users change
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

  const handleDelete = useCallback(async () => {
    const dp = dataProvider;
    if (!dp) {
      setErrors('Data provider not available');
      return;
    }

    // For single user, require typing email to confirm
    if (users.length === 1 && confirmText !== users[0].email) {
      setErrors('Please type the email address to confirm deletion');
      return;
    }

    // For bulk delete, require count
    if (users.length > 1 && confirmText !== users.length.toString()) {
      setErrors(`Please type "${users.length}" to confirm deletion`);
      return;
    }

    setIsLoading(true);
    setErrors('');

    try {
      for (const user of users) {
        await dp.deleteOne({ resource: 'users', id: user.id });
      }
      onDelete();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete user(s):', error);
      setErrors(error instanceof Error ? error.message : 'Failed to delete user(s)');
    } finally {
      setIsLoading(false);
    }
  }, [users, confirmText, onDelete, onClose]);

  if (!open || users.length === 0) return null;

  const isBulkDelete = users.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
    >
      <div className="bg-background rounded-lg shadow-2xl max-w-md w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2
              id="delete-confirm-title"
              className="text-xl font-semibold flex items-center gap-2 text-destructive"
            >
              <AlertTriangle className="w-5 h-5" />
              {isBulkDelete ? `Delete ${users.length} Users` : 'Delete User'}
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
          {errors && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{errors}</p>
            </div>
          )}

          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4">
            <p className="text-sm font-medium text-destructive mb-2">
              Warning: This action cannot be undone!
            </p>
            <p className="text-sm text-muted-foreground">
              {isBulkDelete
                ? `You are about to delete ${users.length} user accounts. All associated data will be permanently removed.`
                : 'You are about to delete this user account. All associated data will be permanently removed.'}
            </p>
          </div>

          {!isBulkDelete && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">{getDisplayName(users[0])}</p>
              <p className="text-sm text-muted-foreground">{users[0].email}</p>
            </div>
          )}

          {isBulkDelete && (
            <div className="mb-4 max-h-32 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Users to be deleted:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {users.map((user) => (
                  <li key={user.id} className="flex items-center gap-2">
                    <Trash2 className="h-3 w-3 text-destructive" />
                    {user.email}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type {!isBulkDelete ? 'the email address' : `the number "${users.length}"`} to
              confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={!isBulkDelete ? users[0].email : users.length.toString()}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-destructive"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">
              <strong>What happens when you delete a user:</strong>
            </p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
              <li>• User account and login credentials are removed</li>
              <li>• User sessions are terminated</li>
              <li>• Associated data may be anonymized or removed</li>
              <li>• This action is permanent and cannot be undone</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 rounded-b-lg flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading || !confirmText}>
            {isLoading ? (
              <>Deleting...</>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {isBulkDelete ? `${users.length} Users` : 'User'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
