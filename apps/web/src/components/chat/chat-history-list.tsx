'use client';

import { useState, useCallback, startTransition } from 'react';
import { ChatSession } from '@/hooks/use-chat-history';
import { cn } from '@legal/ui';
import { formatRelativeTime } from '@/lib/format-relative-time';
import {
  Scale,
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  Loader2,
} from 'lucide-react';
import { ChatDeleteDialog } from './chat-delete-dialog';
import { usePinChatSession } from '@/hooks/use-pin-chat-session';

interface ChatHistoryListProps {
  sessions: ChatSession[];
  isLoading: boolean;
  onSessionClick: (sessionId: string) => void;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onSessionDeleted?: (sessionId: string) => void;
  onSessionPinned?: (sessionId: string, isPinned: boolean) => void;
}

/**
 * Chat History List Component
 *
 * Displays a list of chat sessions with session info, mode indicator,
 * pinned status, timestamp, and delete functionality.
 *
 * Sessions are automatically sorted by pinned status (pinned first) via backend.
 * Pinned sessions are visually grouped at the top with a section header and separator.
 */
export function ChatHistoryList({
  sessions,
  isLoading,
  onSessionClick,
  hasNextPage,
  onLoadMore,
  onSessionDeleted,
  onSessionPinned,
}: ChatHistoryListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingPinId, setPendingPinId] = useState<string | null>(null);

  const { pinChatSession } = usePinChatSession();

  // Split sessions into pinned and unpinned for visual grouping
  const pinnedSessions = sessions.filter((s) => s.isPinned);
  const unpinnedSessions = sessions.filter((s) => !s.isPinned);
  const hasPinnedSessions = pinnedSessions.length > 0;
  const hasUnpinnedSessions = unpinnedSessions.length > 0;

  const handleDeleteClick = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleDeleteComplete = () => {
    if (sessionToDelete) {
      onSessionDeleted?.(sessionToDelete.id);
    }
    setPendingDeleteId(null);
    setSessionToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handlePinToggle = useCallback(
    async (session: ChatSession, e: React.MouseEvent) => {
      e.stopPropagation();

      const newIsPinned = !session.isPinned;
      setPendingPinId(session.id);

      // Optimistically update the UI
      startTransition(() => {
        onSessionPinned?.(session.id, newIsPinned);
      });

      const success = await pinChatSession(session.id, newIsPinned, {
        onSuccess: () => {
          setPendingPinId(null);
        },
        onError: () => {
          // Revert optimistic update on error
          setPendingPinId(null);
          startTransition(() => {
            onSessionPinned?.(session.id, session.isPinned);
          });
        },
      });

      if (!success) {
        setPendingPinId(null);
      }
    },
    [pinChatSession, onSessionPinned],
  );

  const isDeleting = (sessionId: string) => pendingDeleteId === sessionId;
  const isPinning = (sessionId: string) => pendingPinId === sessionId;

  if (isLoading && sessions.length === 0) {
    return <ChatHistoryListSkeleton />;
  }

  if (sessions.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No chat history yet</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Start a conversation to see it here. Your chat history will be saved automatically.
        </p>
      </div>
    );
  }

  return (
    <>
      <ChatDeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSessionToDelete(null);
        }}
        session={sessionToDelete}
        onDelete={handleDeleteComplete}
      />
      <div className="space-y-4" data-testid="chat-history-list">
        {/* Pinned Sessions Section */}
        {hasPinnedSessions && (
          <div className="space-y-2" data-testid="pinned-sessions-section">
            <div className="flex items-center gap-2 px-1">
              <Pin className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Pinned
              </h2>
              {hasUnpinnedSessions && (
                <div className="flex-1 h-px bg-border" />
              )}
            </div>
            {pinnedSessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                onClick={() => onSessionClick(session.id)}
                onDelete={handleDeleteClick}
                onPinToggle={handlePinToggle}
                isDeleting={isDeleting(session.id)}
                isPinning={isPinning(session.id)}
              />
            ))}
          </div>
        )}

        {/* Unpinned Sessions Section */}
        {hasUnpinnedSessions && (
          <div className="space-y-2" data-testid="unpinned-sessions-section">
            {hasPinnedSessions && (
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                Recent
              </h2>
            )}
            {unpinnedSessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                onClick={() => onSessionClick(session.id)}
                onDelete={handleDeleteClick}
                onPinToggle={handlePinToggle}
                isDeleting={isDeleting(session.id)}
                isPinning={isPinning(session.id)}
              />
            ))}

            {isLoading && unpinnedSessions.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading more...
                </div>
              </div>
            )}

            {hasNextPage && !isLoading && (
              <button
                onClick={onLoadMore}
                className="w-full py-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Load more conversations
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

interface ChatSessionItemProps {
  session: ChatSession;
  onClick: () => void;
  onDelete: (session: ChatSession, e: React.MouseEvent) => void;
  onPinToggle: (session: ChatSession, e: React.MouseEvent) => void;
  isDeleting: boolean;
  isPinning: boolean;
}

function ChatSessionItem({ session, onClick, onDelete, onPinToggle, isDeleting, isPinning }: ChatSessionItemProps) {
  const title = session.title || 'New Chat';
  const ModeIcon = session.mode === 'LAWYER' ? Scale : MessageSquare;

  // Get the last message time for display
  const lastMessageTime = session.lastMessageAt
    ? formatRelativeTime(new Date(session.lastMessageAt))
    : formatRelativeTime(new Date(session.createdAt));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent hover:border-accent transition-all group cursor-pointer"
      aria-label={`Open chat: ${title}`}
      data-testid="chat-session-item"
      data-session-id={session.id}
      data-session-pinned={session.isPinned}
    >
      <div className="flex items-start gap-3">
        {/* Mode Icon */}
        <div
          className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
            session.mode === 'LAWYER'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
          )}
        >
          <ModeIcon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate flex-1">{title}</h3>
            {session.isPinned && (
              <Pin className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              {session.messageCount} {session.messageCount === 1 ? 'message' : 'messages'}
            </span>
            <span>•</span>
            <span>{lastMessageTime}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {session.mode === 'LAWYER' ? 'Pro' : 'Simple'}
            </span>
          </div>
        </div>

        {/* Hover Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={(e) => onPinToggle(session, e)}
            disabled={isPinning}
            className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={session.isPinned ? 'Unpin' : 'Pin'}
            data-testid="pin-session-button"
            data-session-id={session.id}
          >
            {isPinning ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : session.isPinned ? (
              <PinOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Pin className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={(e) => onDelete(session, e)}
            disabled={isDeleting}
            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete"
            data-testid="delete-session-button"
            data-session-id={session.id}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 text-destructive animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for chat history list
 */
export function ChatHistoryListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-full p-4 rounded-lg border border-border animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
