'use client';

import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useDeleteChatSession } from '@/hooks/use-delete-chat-session';

export interface ChatSession {
  id: string;
  title: string | null;
  mode: 'LAWYER' | 'SIMPLE';
  messageCount: number;
}

interface ChatDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  session: ChatSession | null;
  onDelete?: () => void;
}

/**
 * Chat Session Delete Confirmation Dialog
 *
 * Shows a confirmation dialog before deleting a chat session.
 * The session is soft-deleted (marked as deleted but can be restored).
 *
 * Features:
 * - Clear warning message about permanent action
 * - Displays session title/message count for confirmation
 * - Loading state during deletion
 * - Error handling with user-friendly messages
 * - Uses trash icon from lucide-react for visual clarity
 */
export function ChatDeleteDialog({
  open,
  onClose,
  session,
  onDelete,
}: ChatDeleteDialogProps) {
  const { deleteChatSession, isLoading } = useDeleteChatSession();
  const [error, setError] = useState<string>('');

  // Reset error when dialog closes
  useEffect(() => {
    if (!open) {
      setError('');
    }
  }, [open]);

  const handleDelete = useCallback(async () => {
    if (!session) return;

    try {
      const success = await deleteChatSession(session.id, {
        onSuccess: () => {
          onDelete?.();
          onClose();
        },
        onError: (err) => {
          setError(err.message || 'Failed to delete chat session');
        },
      });

      if (!success && !error) {
        setError('Failed to delete chat session');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    }
  }, [session, deleteChatSession, onDelete, onClose, error]);

  if (!open || !session) return null;

  const title = session.title || 'New Chat';
  const modeLabel = session.mode === 'LAWYER' ? 'Pro' : 'Simple';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-delete-title"
      data-testid="delete-chat-dialog"
    >
      <div className="bg-background rounded-lg shadow-2xl max-w-md w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2
              id="chat-delete-title"
              className="text-xl font-semibold flex items-center gap-2 text-destructive"
            >
              <AlertTriangle className="w-5 h-5" />
              Delete Chat
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

          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4">
            <p className="text-sm font-medium text-destructive mb-2">
              Are you sure you want to delete this chat?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The chat will be marked as deleted and removed from your
              chat history.
            </p>
          </div>

          {/* Session Info */}
          <div className="mb-4 p-4 bg-muted/50 rounded-md">
            <p className="text-sm font-medium mb-1">{title}</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{session.messageCount} messages</span>
              <span>•</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                {modeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 rounded-b-lg flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="delete-dialog-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            data-testid="delete-dialog-confirm-button"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Chat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
