'use client';

import React from 'react';
import {
  Database,
  X,
  Check,
  AlertCircle,
  Download,
  Loader2,
} from 'lucide-react';
import { useChatMigration, MigrationState } from '@/hooks/use-chat-migration';
import { cn } from '@legal/ui';

interface ChatMigrationPromptProps {
  /** Additional className for styling */
  className?: string;
  /** Callback when migration is complete */
  onComplete?: () => void;
  /** Callback when migration is dismissed */
  onDismiss?: () => void;
}

/**
 * ChatMigrationPrompt Component
 *
 * Displays a prompt to users when localStorage chat sessions are detected.
 * Offers options to migrate, dismiss, or view progress.
 *
 * States:
 * - pending: Show migration prompt with session count
 * - migrating: Show progress indicator
 * - completed: Show success message
 * - error: Show error message with retry option
 */
export function ChatMigrationPrompt({
  className,
  onComplete,
  onDismiss,
}: ChatMigrationPromptProps) {
  const {
    migrationState,
    startMigration,
    dismissMigration,
  } = useChatMigration({
    onMigrationComplete: () => {
      onComplete?.();
    },
    onMigrationError: () => {
      // Error is shown in UI
    },
  });

  // Don't render if no migration needed
  if (migrationState.status === 'idle' || migrationState.status === 'checking') {
    return null;
  }

  const handleDismiss = () => {
    dismissMigration();
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300',
        className,
      )}
    >
      <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            {getStateIcon(migrationState.status)}
            <h3 className="font-semibold text-sm">
              {getStateTitle(migrationState.status)}
            </h3>
          </div>
          {migrationState.status !== 'migrating' && (
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {migrationState.status === 'pending' && (
            <PendingContent
              sessionCount={migrationState.sessionCount}
              onMigrate={startMigration}
              onDismiss={handleDismiss}
            />
          )}

          {migrationState.status === 'migrating' && (
            <MigratingContent
              current={migrationState.currentSession}
              total={migrationState.sessionCount}
              progress={migrationState.progress}
            />
          )}

          {migrationState.status === 'completed' && (
            <CompletedContent
              sessionCount={migrationState.sessionCount}
              onDismiss={handleDismiss}
            />
          )}

          {migrationState.status === 'error' && (
            <ErrorContent
              error={migrationState.error}
              onRetry={startMigration}
              onDismiss={handleDismiss}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get icon for current state
 */
function getStateIcon(status: MigrationState['status']) {
  switch (status) {
    case 'pending':
      return (
        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      );
    case 'migrating':
      return (
        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      );
    case 'completed':
      return (
        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
      );
    case 'error':
      return (
        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
      );
    default:
      return null;
  }
}

/**
 * Get title for current state
 */
function getStateTitle(status: MigrationState['status']): string {
  switch (status) {
    case 'pending':
      return 'Chat Migration Available';
    case 'migrating':
      return 'Migrating Chats...';
    case 'completed':
      return 'Migration Complete';
    case 'error':
      return 'Migration Failed';
    default:
      return '';
  }
}

/**
 * Pending state content
 */
function PendingContent({
  sessionCount,
  onMigrate,
  onDismiss,
}: {
  sessionCount: number;
  onMigrate: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        We found {sessionCount} chat {sessionCount === 1 ? 'conversation' : 'conversations'}{' '}
        from a previous version. Would you like to restore them to your account?
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
        <Download className="h-3 w-3" />
        <span>Your chats will be stored securely in the cloud</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onMigrate}
          className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Restore Chats
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

/**
 * Migrating state content
 */
function MigratingContent({
  current,
  total,
  progress,
}: {
  current: number;
  total: number;
  progress: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Migrating your chat conversations to the cloud...
      </p>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{current} of {total} sessions</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Please don't close this page
      </p>
    </div>
  );
}

/**
 * Completed state content
 */
function CompletedContent({
  sessionCount,
  onDismiss,
}: {
  sessionCount: number;
  onDismiss: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Successfully migrated {sessionCount} chat {sessionCount === 1 ? 'conversation' : 'conversations'}!
      </p>

      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md p-2">
        <Check className="h-3 w-3" />
        <span>Your chats are now safely stored in the cloud</span>
      </div>

      <button
        onClick={onDismiss}
        className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Done
      </button>
    </div>
  );
}

/**
 * Error state content
 */
function ErrorContent({
  error,
  onRetry,
  onDismiss,
}: {
  error: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        There was a problem migrating your chats.
      </p>

      {error && (
        <div className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-md p-2">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Your chats are still safe in your browser. You can try again or skip for now.
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={onRetry}
          className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

/**
 * Export a simplified version for use in other components
 */
export function useMigrationPrompt() {
  const {
    migrationState,
    startMigration,
    dismissMigration,
  } = useChatMigration();

  return {
    showPrompt: migrationState.status === 'pending' ||
                migrationState.status === 'migrating' ||
                migrationState.status === 'completed' ||
                migrationState.status === 'error',
    migrationState,
    startMigration,
    dismissMigration,
  };
}
