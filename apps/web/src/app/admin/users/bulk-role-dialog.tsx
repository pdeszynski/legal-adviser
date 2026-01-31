'use client';

import React, { useState, useCallback } from 'react';
import { Shield, ShieldAlert, UserX, X, Loader2 } from 'lucide-react';
import { Button } from '@legal/ui';
import { dataProvider } from '@providers/data-provider';
import type { GraphQLMutationConfig } from '@providers/data-provider';
import type { User } from '@/generated/graphql';

interface BulkRoleDialogProps {
  open: boolean;
  onClose: () => void;
  users: User[];
  onUpdate: () => void;
}

type RoleAction = 'promote' | 'demote' | 'set-admin' | 'set-client';

// Helper to safely get user role
const getUserRole = (user: User): string => user.role || 'client';

export function BulkRoleDialog({ open, onClose, users, onUpdate }: BulkRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<RoleAction | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setSelectedAction(null);
    setErrors([]);
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

  const getActionDescription = (): string => {
    switch (selectedAction) {
      case 'promote':
        return 'Promote selected users to Admin';
      case 'demote':
        return 'Demote selected users to Client';
      case 'set-admin':
        return 'Set all selected users to Admin';
      case 'set-client':
        return 'Set all selected users to Client';
      default:
        return '';
    }
  };

  const handleBulkRoleChange = useCallback(async () => {
    if (!selectedAction) return;

    const dp = dataProvider;
    if (!dp) {
      setErrors(['Data provider not available']);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    const userIds = users.map((u) => u.id);
    const role =
      selectedAction === 'promote' || selectedAction === 'set-admin' ? 'admin' : 'client';

    try {
      const mutationConfig: GraphQLMutationConfig<{ userIds: string[]; role: string }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'bulkChangeUserRoles',
            fields: ['success', 'failed { id error }'],
            variables: {
              input: { userIds, role },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await (dp as any).custom(mutationConfig);

      if (result?.failed?.length > 0) {
        setErrors(result.failed.map((e: { error: string }) => e.error));
      }

      onUpdate();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to change user roles:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to change user roles']);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAction, users, onUpdate, onClose]);

  if (!open || users.length === 0) return null;

  const adminsCount = users.filter((u) => getUserRole(u) === 'admin').length;
  const usersCount = users.filter((u) => getUserRole(u) === 'client').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-role-title"
    >
      <div className="bg-background rounded-lg shadow-2xl max-w-md w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 id="bulk-role-title" className="text-xl font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Bulk Role Assignment
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
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm font-medium text-destructive mb-1">Some operations failed:</p>
              <ul className="text-sm text-destructive list-disc list-inside">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm font-medium">{users.length} users selected</p>
            <p className="text-xs text-muted-foreground">
              {adminsCount} admin{adminsCount !== 1 ? 's' : ''}, {usersCount} client
              {usersCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Users list */}
          <div className="mb-4 max-h-32 overflow-y-auto">
            <ul className="text-sm text-muted-foreground space-y-1">
              {users.map((user) => {
                const role = getUserRole(user);
                return (
                  <li key={user.id} className="flex items-center gap-2">
                    {role === 'admin' ? (
                      <Shield className="h-3 w-3 text-primary" />
                    ) : (
                      <ShieldAlert className="h-3 w-3 text-muted-foreground" />
                    )}
                    {user.email}
                    <span className="text-xs">({role})</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Role assignment options */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Choose action:</p>

            <button
              type="button"
              onClick={() => setSelectedAction('promote')}
              disabled={isLoading}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                selectedAction === 'promote'
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card hover:bg-muted/50 border-border'
              }`}
            >
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Promote to Admin</p>
                <p className="text-xs text-muted-foreground">
                  Promote {usersCount} user{usersCount !== 1 ? 's' : ''} to admin role
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction('demote')}
              disabled={isLoading}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                selectedAction === 'demote'
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card hover:bg-muted/50 border-border'
              }`}
            >
              <UserX className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Demote to Client</p>
                <p className="text-xs text-muted-foreground">
                  Demote {adminsCount} admin{adminsCount !== 1 ? 's' : ''} to client role
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction('set-admin')}
              disabled={isLoading}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                selectedAction === 'set-admin'
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card hover:bg-muted/50 border-border'
              }`}
            >
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Set All to Admin</p>
                <p className="text-xs text-muted-foreground">
                  Set all {users.length} users to admin role
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction('set-client')}
              disabled={isLoading}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                selectedAction === 'set-client'
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card hover:bg-muted/50 border-border'
              }`}
            >
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Set All to Client</p>
                <p className="text-xs text-muted-foreground">
                  Set all {users.length} users to client role
                </p>
              </div>
            </button>
          </div>

          {selectedAction && (
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Action:</strong> {getActionDescription()}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 rounded-b-lg flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleBulkRoleChange} disabled={isLoading || !selectedAction}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Apply Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
