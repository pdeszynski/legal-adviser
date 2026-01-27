'use client';

import { useState, useMemo } from 'react';
import { useDocumentComments, DocumentComment, CommentResolutionStatus } from '@/hooks';
import { CommentItem } from './comment-item';
import { useTranslate } from '@refinedev/core';

interface CommentPanelProps {
  documentId: string | undefined;
  currentUserId?: string;
  selectedCommentId?: string | null;
  onCommentSelect?: (commentId: string | null) => void;
  className?: string;
}

/**
 * CommentPanel Component
 *
 * Displays all comments for a document with:
 * - Filter by resolution status (Open/Resolved)
 * - Comment count badges
 * - Create new comment button
 * - List of comments with scroll
 */
export function CommentPanel({
  documentId,
  currentUserId,
  selectedCommentId,
  onCommentSelect,
  className = '',
}: CommentPanelProps) {
  const translate = useTranslate();
  const {
    comments,
    isLoading,
    error,
    createComment,
    updateComment,
    deleteComment,
    resolveComment,
    reopenComment,
  } = useDocumentComments(documentId);

  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  // Filter comments based on selected filter
  const filteredComments = useMemo(() => {
    if (filter === 'open') {
      return comments.filter((c) => c.resolutionStatus === CommentResolutionStatus.OPEN);
    }
    if (filter === 'resolved') {
      return comments.filter((c) => c.resolutionStatus === CommentResolutionStatus.RESOLVED);
    }
    return comments;
  }, [comments, filter]);

  // Count comments by status
  const openCount = comments.filter(
    (c) => c.resolutionStatus === CommentResolutionStatus.OPEN,
  ).length;
  const resolvedCount = comments.filter(
    (c) => c.resolutionStatus === CommentResolutionStatus.RESOLVED,
  ).length;

  const handleDelete = (id: string) => {
    deleteComment(id);
  };

  const handleResolve = (id: string) => {
    resolveComment(id);
  };

  const handleReopen = (id: string) => {
    reopenComment(id);
  };

  const handleEdit = (id: string, text: string) => {
    updateComment(id, { text });
  };

  const handleCommentClick = (commentId: string) => {
    if (onCommentSelect) {
      onCommentSelect(commentId === selectedCommentId ? null : commentId);
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
        <div className="text-center text-gray-500">
          {translate('comments.loading', 'Loading comments...')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
        <div className="text-center text-red-500">
          {translate('comments.error', 'Error loading comments')}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {translate('comments.title', 'Comments')}
        </h3>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {translate('comments.all', 'All')} ({comments.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'open'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {translate('comments.open', 'Open')} ({openCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'resolved'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {translate('comments.resolved', 'Resolved')} ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="px-4 py-3 max-h-[600px] overflow-y-auto">
        {filteredComments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {filter === 'open'
              ? translate('comments.noOpen', 'No open comments')
              : filter === 'resolved'
                ? translate('comments.noResolved', 'No resolved comments')
                : translate('comments.noComments', 'No comments yet')}
          </div>
        ) : (
          <div>
            {filteredComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isSelected={selectedCommentId === comment.id}
                onClick={() => handleCommentClick(comment.id)}
                onDelete={handleDelete}
                onResolve={handleResolve}
                onReopen={handleReopen}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with create button hint */}
      {documentId && (
        <div className="border-t px-4 py-3 bg-gray-50 text-sm text-gray-600">
          {translate('comments.selectTextHint', 'Select text in the document to add a comment')}
        </div>
      )}
    </div>
  );
}
