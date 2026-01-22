"use client";

import { useState, useCallback, useMemo } from "react";
import {
  CommentPanel,
  CommentComposer,
  CommentedText,
  CreateCommentInput,
  CommentPosition,
} from "@/components/comments";
import { useDocumentComments, CommentResolutionStatus } from "@/hooks";
import { useTranslate } from "@refinedev/core";

interface DocumentWithCommentsProps {
  documentId: string | undefined;
  content: string;
  currentUserId?: string;
  className?: string;
}

/**
 * DocumentWithComments Component
 *
 * Example integration showing how to combine:
 * - Document viewer with inline annotations (CommentedText)
 * - Comment panel (CommentPanel)
 * - Comment composer (CommentComposer)
 *
 * Features:
 * - Select text to create inline comments
 * - Click annotations to highlight and scroll to comment
 * - Resolve/reopen comments
 * - Filter comments by status
 */
export function DocumentWithComments({
  documentId,
  content,
  currentUserId,
  className = "",
}: DocumentWithCommentsProps) {
  const translate = useTranslate();
  const { comments, createComment } = useDocumentComments(documentId);

  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [selection, setSelection] = useState<{
    startOffset: number;
    endOffset: number;
    text: string;
  } | null>(null);

  // Group open comments for display
  const openComments = useMemo(
    () => comments.filter((c) => c.resolutionStatus === CommentResolutionStatus.OPEN),
    [comments]
  );

  /**
   * Handle text selection for creating inline comments
   */
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();

    // Only allow selections within the content
    if (!text || range.startContainer !== range.endContainer) {
      return;
    }

    // Get the text content offset
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(range.startContainer.parentElement || document.body);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preCaretRange.toString().length;
    const endOffset = startOffset + text.length;

    setSelection({
      startOffset,
      endOffset,
      text,
    });

    setIsComposing(true);

    // Clear selection after a short delay
    setTimeout(() => {
      selection.removeAllRanges();
    }, 100);
  }, []);

  /**
   * Handle mouse up on document to detect text selection
   */
  const handleMouseUp = useCallback(() => {
    handleTextSelection();
  }, [handleTextSelection]);

  /**
   * Create a new comment
   */
  const handleCreateComment = useCallback(
    (input: CreateCommentInput) => {
      if (!documentId) return;

      // If we have a selection, use its position
      const position = selection
        ? {
            startOffset: selection.startOffset,
            endOffset: selection.endOffset,
            text: selection.text,
          }
        : input.position;

      createComment({
        ...input,
        position,
      });

      // Reset composer
      setIsComposing(false);
      setSelection(null);
    },
    [documentId, selection, createComment]
  );

  /**
   * Cancel comment creation
   */
  const handleCancelCompose = useCallback(() => {
    setIsComposing(false);
    setSelection(null);
  }, []);

  /**
   * Handle clicking on an annotation
   */
  const handleAnnotationClick = useCallback((commentId: string) => {
    setSelectedCommentId(commentId);

    // Scroll to the comment in the panel
    setTimeout(() => {
      const commentElement = document.getElementById(`comment-${commentId}`);
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }, []);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Document Content with Annotations (2/3 width) */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6" onMouseUp={handleMouseUp}>
          <h2 className="text-xl font-semibold mb-4">
            {translate("documents.fields.content", "Document Content")}
          </h2>

          {/* Hint for selecting text */}
          {documentId && !isComposing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
              <span className="font-medium">
                {translate("comments.selectionHint", "Tip:")}
              </span>{" "}
              {translate(
                "comments.selectionHintText",
                "Select any text in the document to add a comment"
              )}
            </div>
          )}

          {/* Comment composer (shown when composing) */}
          {isComposing && documentId && (
            <div className="mb-4">
              <CommentComposer
                documentId={documentId}
                onCreate={handleCreateComment}
                onCancel={handleCancelCompose}
                initialPosition={
                  selection
                    ? {
                        startOffset: selection.startOffset,
                        endOffset: selection.endOffset,
                        text: selection.text,
                      }
                    : undefined
                }
                autoFocus={true}
              />
            </div>
          )}

          {/* Document content with inline annotations */}
          <div className="prose max-w-none">
            <CommentedText
              content={content}
              comments={comments}
              onAnnotationClick={handleAnnotationClick}
              selectedCommentId={selectedCommentId}
              className="whitespace-pre-wrap text-sm leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Comment Panel (1/3 width) */}
      <div className="lg:col-span-1">
        <CommentPanel
          documentId={documentId}
          currentUserId={currentUserId}
          selectedCommentId={selectedCommentId}
          onCommentSelect={setSelectedCommentId}
          className="sticky top-4"
        />
      </div>
    </div>
  );
}
