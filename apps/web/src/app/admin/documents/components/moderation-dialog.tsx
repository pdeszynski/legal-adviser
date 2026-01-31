'use client';

import { useState, useEffect } from 'react';
import { X, Flag, Check, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@legal/ui';

type ModerationAction = 'flag' | 'approve' | 'reject';

interface ModerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  action: ModerationAction | null;
  onConfirm: (documentId: string, action: ModerationAction, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

const actionConfig = {
  flag: {
    title: 'Flag for Moderation',
    description:
      'Flag this document for content moderation review. This will mark the document as pending review.',
    icon: Flag,
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    confirmButton: 'Flag Document',
    confirmButtonVariant: 'default' as const,
    requiresReason: false,
    reasonLabel: 'Reason for flagging (optional)',
    reasonPlaceholder: 'e.g., Content needs review, Potential policy violation...',
  },
  approve: {
    title: 'Approve Document',
    description:
      'Approve this document after moderation review. The document will be marked as approved and visible to users.',
    icon: Check,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    confirmButton: 'Approve',
    confirmButtonVariant: 'default' as const,
    requiresReason: false,
    reasonLabel: 'Approval reason (optional)',
    reasonPlaceholder: 'e.g., Content reviewed and approved, No issues found...',
  },
  reject: {
    title: 'Reject Document',
    description:
      'Reject this document after moderation review. The document will be marked as rejected and hidden from users.',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    confirmButton: 'Reject',
    confirmButtonVariant: 'destructive' as const,
    requiresReason: true,
    reasonLabel: 'Reason for rejection (required)',
    reasonPlaceholder: 'e.g., Violates content policy, Inappropriate content, Legal concerns...',
  },
};

export function ModerationDialog({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  action,
  onConfirm,
  isLoading = false,
}: ModerationDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Handle null action by not rendering
  if (!action) return null;

  const config = actionConfig[action];
  const Icon = config.icon;

  // Reset state when dialog opens or action changes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen, action]);

  const handleSubmit = async () => {
    // Validate reason for rejection
    if (config.requiresReason && !reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      await onConfirm(documentId, action, reason.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative bg-card rounded-lg shadow-lg max-w-md w-full mx-4 border border-border"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="moderation-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.iconBg}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <h2 id="moderation-title" className="text-lg font-semibold">
              {config.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-4">
          <p className="text-muted-foreground text-sm mb-4">{config.description}</p>

          <div className="bg-muted/50 rounded-md p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-1">Document</p>
            <p className="text-sm font-medium truncate" title={documentTitle}>
              {documentTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-1">ID: {documentId.slice(0, 8)}...</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="moderation-reason" className="block text-sm font-medium">
              {config.reasonLabel}
              {config.requiresReason && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id="moderation-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder={config.reasonPlaceholder}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-none"
              disabled={isLoading}
              autoFocus={!config.requiresReason}
            />
            {error && (
              <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
            {action === 'flag' && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  Flagged documents will be reviewed by an admin. The document owner may be notified
                  after review.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 flex justify-end gap-3 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={config.confirmButtonVariant}
            onClick={handleSubmit}
            disabled={isLoading || (config.requiresReason && !reason.trim())}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              config.confirmButton
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
