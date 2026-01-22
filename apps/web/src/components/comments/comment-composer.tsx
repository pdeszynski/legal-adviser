"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslate } from "@refinedev/core";
import { CommentPosition, CreateCommentInput } from "@/hooks";

interface CommentComposerProps {
  documentId: string | undefined;
  onCreate: (input: CreateCommentInput) => void;
  onCancel?: () => void;
  initialText?: string;
  initialPosition?: CommentPosition;
  autoFocus?: boolean;
}

/**
 * CommentComposer Component
 *
 * Form for creating new comments with:
 * - Text input with character limit
 * - Preview of selected text
 * - Cancel and submit buttons
 */
export function CommentComposer({
  documentId,
  onCreate,
  onCancel,
  initialText = "",
  initialPosition,
  autoFocus = false,
}: CommentComposerProps) {
  const translate = useTranslate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState(initialText);
  const [position] = useState<CommentPosition | undefined>(initialPosition);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = useCallback(() => {
    const trimmedText = text.trim();

    if (!trimmedText || !documentId) {
      return;
    }

    if (!position) {
      // No position - it's a general comment
      onCreate({
        documentId,
        text: trimmedText,
        position: {
          startOffset: 0,
          endOffset: 0,
        },
      });
    } else {
      onCreate({
        documentId,
        text: trimmedText,
        position,
      });
    }

    setText("");
  }, [documentId, text, position, onCreate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Submit on Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      // Cancel on Escape
      if (e.key === "Escape" && onCancel) {
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  const characterCount = text.length;
  const maxCharacters = 10000;
  const remainingCharacters = maxCharacters - characterCount;

  return (
    <div className="border border-blue-300 rounded-lg bg-blue-50 p-4 mb-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">
        {translate("comments.newComment", "New Comment")}
      </h4>

      {/* Selected text preview */}
      {position?.text && (
        <div className="mb-3 p-2 bg-white rounded border-l-4 border-blue-400">
          <div className="text-xs text-gray-500 mb-1">
            {translate("comments.selectedText", "Selected text:")}
          </div>
          <div className="text-sm text-gray-700 italic">
            "{position.text}"
          </div>
        </div>
      )}

      {/* Text input */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={translate(
          "comments.placeholder",
          "Write your comment here..."
        )}
        className="w-full p-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
        maxLength={maxCharacters}
      />

      {/* Footer with character count and actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-500">
          {translate("comments.characters", "characters")}: {characterCount}
          {remainingCharacters < 100 && (
            <span
              className={`ml-2 ${
                remainingCharacters < 20 ? "text-red-500" : "text-yellow-600"
              }`}
            >
              ({remainingCharacters} {translate("comments.remaining", "remaining")})
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {translate("buttons.cancel", "Cancel")}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || !documentId}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {translate("comments.submit", "Submit")}
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-gray-400 mt-2">
        <span className="font-medium">Ctrl+Enter</span> {" "}
        {translate("comments.toSubmit", "to submit")}
        {onCancel && (
          <>
            {" • "}
            <span className="font-medium">Esc</span> {" "}
            {translate("comments.toCancel", "to cancel")}
          </>
        )}
      </div>
    </div>
  );
}
