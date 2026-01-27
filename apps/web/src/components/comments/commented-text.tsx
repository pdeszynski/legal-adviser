'use client';

import { memo } from 'react';
import { DocumentComment, CommentResolutionStatus } from '@/hooks';

interface CommentedTextProps {
  content: string;
  comments: DocumentComment[];
  onAnnotationClick?: (commentId: string) => void;
  selectedCommentId?: string | null;
  className?: string;
}

interface CommentAnnotation {
  commentId: string;
  startOffset: number;
  endOffset: number;
  status: CommentResolutionStatus;
  commentCount: number; // For overlapping annotations
}

/**
 * CommentedText Component
 *
 * Renders document content with inline comment annotations:
 * - Highlights commented text ranges
 * - Shows visual indicators for open/resolved comments
 * - Handles overlapping annotations
 * - Click to select and view comment
 */
export const CommentedText = memo(function CommentedText({
  content,
  comments,
  onAnnotationClick,
  selectedCommentId = null,
  className = '',
}: CommentedTextProps) {
  // Sort annotations by start position
  const annotations: CommentAnnotation[] = comments
    .filter((c) => c.position.startOffset >= 0 && c.position.endOffset <= content.length)
    .map((comment) => ({
      commentId: comment.id,
      startOffset: comment.position.startOffset,
      endOffset: comment.position.endOffset,
      status: comment.resolutionStatus,
      commentCount: 1, // Will be calculated for overlaps
    }))
    .sort((a, b) => a.startOffset - b.startOffset);

  // Calculate overlaps and comment counts
  for (let i = 0; i < annotations.length; i++) {
    let count = 1;
    for (let j = i + 1; j < annotations.length; j++) {
      if (
        annotations[j].startOffset < annotations[i].endOffset &&
        annotations[j].endOffset > annotations[i].startOffset
      ) {
        count++;
      }
    }
    annotations[i].commentCount = count;
  }

  if (annotations.length === 0) {
    return <pre className={`whitespace-pre-wrap text-sm ${className}`}>{content}</pre>;
  }

  // Split content and insert annotations
  const segments: Array<
    | { type: 'text'; content: string }
    | { type: 'annotation'; content: string; annotation: CommentAnnotation }
  > = [];

  let lastIndex = 0;

  for (const annotation of annotations) {
    // Add text before annotation
    if (annotation.startOffset > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, annotation.startOffset),
      });
    }

    // Add annotated text
    segments.push({
      type: 'annotation',
      content: content.slice(annotation.startOffset, annotation.endOffset),
      annotation,
    });

    lastIndex = annotation.endOffset;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  /**
   * Get CSS classes for annotation based on status and selection
   */
  const getAnnotationClasses = (annotation: CommentAnnotation): string => {
    const isSelected = selectedCommentId === annotation.commentId;
    const isOpen = annotation.status === CommentResolutionStatus.OPEN;

    const baseClasses = 'cursor-pointer transition-all relative inline';

    const statusClasses = isOpen
      ? 'bg-yellow-200 hover:bg-yellow-300'
      : 'bg-green-200 hover:bg-green-300';

    const selectedClasses = isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : '';

    const borderClasses =
      annotation.commentCount > 1 ? 'border-b-2 border-dashed border-yellow-500' : '';

    return `${baseClasses} ${statusClasses} ${selectedClasses} ${borderClasses}`;
  };

  return (
    <pre className={`whitespace-pre-wrap text-sm ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={`text-${index}`}>{segment.content}</span>;
        }

        const { content, annotation } = segment;
        return (
          <span
            key={`annotation-${index}`}
            className={getAnnotationClasses(annotation)}
            onClick={() => onAnnotationClick?.(annotation.commentId)}
            title={`Click to view comment (${annotation.commentCount} comment${
              annotation.commentCount > 1 ? 's' : ''
            })`}
          >
            {content}
            {annotation.commentCount > 1 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {annotation.commentCount}
              </span>
            )}
          </span>
        );
      })}
    </pre>
  );
});
