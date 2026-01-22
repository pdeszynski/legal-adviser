"use client";

import { useState } from "react";
import { DocumentComment, CommentResolutionStatus } from "@/hooks";
import { useTranslate } from "@refinedev/core";

interface CommentItemProps {
  comment: DocumentComment;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onResolve?: (id: string) => void;
  onReopen?: (id: string) => void;
  onEdit?: (id: string, text: string) => void;
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * CommentItem Component
 *
 * Displays a single comment with:
 * - Author information
 * - Comment text
 * - Quoted text from document (if available)
 * - Resolution status
 * - Actions (resolve, reopen, edit, delete)
 */
export function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onResolve,
  onReopen,
  onEdit,
  isSelected = false,
  onClick,
}: CommentItemProps) {
  const translate = useTranslate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);

  const isOwner = currentUserId === comment.authorId;
  const isResolved = comment.resolutionStatus === CommentResolutionStatus.RESOLVED;
  const createdAt = new Date(comment.createdAt).toLocaleString();
  const resolvedAt = comment.resolvedAt
    ? new Date(comment.resolvedAt).toLocaleString()
    : null;

  const handleSaveEdit = () => {
    if (editedText.trim() && editedText !== comment.text && onEdit) {
      onEdit(comment.id, editedText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(comment.text);
    setIsEditing(false);
  };

  const getAuthorName = () => {
    if (comment.author?.firstName && comment.author?.lastName) {
      return `${comment.author.firstName} ${comment.author.lastName}`;
    }
    if (comment.author?.username) {
      return comment.author.username;
    }
    if (comment.author?.email) {
      return comment.author.email;
    }
    return translate("comments.anonymous", "Anonymous");
  };

  return (
    <div
      className={`border-l-4 pl-4 py-3 mb-3 transition-colors cursor-pointer ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : isResolved
          ? "border-gray-300 bg-gray-50 opacity-75"
          : "border-yellow-400 bg-yellow-50"
      }`}
      onClick={onClick}
    >
      {/* Header: Author, Date, Status */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900">
              {getAuthorName()}
            </span>
            <span className="text-xs text-gray-500">{createdAt}</span>
            {isResolved && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                {translate("comments.resolved", "Resolved")}
              </span>
            )}
          </div>
          {resolvedAt && (
            <div className="text-xs text-gray-500 mt-1">
              {translate("comments.resolvedAt", "Resolved at")} {resolvedAt}
            </div>
          )}
        </div>

        {/* Actions dropdown */}
        <div className="flex items-center gap-2">
          {!isResolved && onResolve && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve(comment.id);
              }}
              className="text-xs px-2 py-1 rounded hover:bg-green-100 text-green-700 transition-colors"
              title={translate("comments.resolve", "Mark as resolved")}
            >
              {translate("comments.resolve", "Resolve")}
            </button>
          )}
          {isResolved && onReopen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReopen(comment.id);
              }}
              className="text-xs px-2 py-1 rounded hover:bg-yellow-100 text-yellow-700 transition-colors"
              title={translate("comments.reopen", "Reopen comment")}
            >
              {translate("comments.reopen", "Reopen")}
            </button>
          )}
          {isOwner && onEdit && !isResolved && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="text-xs px-2 py-1 rounded hover:bg-blue-100 text-blue-700 transition-colors"
              title={translate("comments.edit", "Edit comment")}
            >
              {translate("comments.edit", "Edit")}
            </button>
          )}
          {isOwner && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    translate(
                      "comments.deleteConfirm",
                      "Are you sure you want to delete this comment?"
                    )
                  )
                ) {
                  onDelete(comment.id);
                }
              }}
              className="text-xs px-2 py-1 rounded hover:bg-red-100 text-red-700 transition-colors"
              title={translate("comments.delete", "Delete comment")}
            >
              {translate("comments.delete", "Delete")}
            </button>
          )}
        </div>
      </div>

      {/* Quoted text from document */}
      {comment.position.text && (
        <div className="mb-2 p-2 bg-gray-100 rounded text-sm text-gray-700 italic border-l-2 border-gray-300">
          "{comment.position.text}"
        </div>
      )}

      {/* Comment text or edit form */}
      {isEditing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={!editedText.trim()}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {translate("buttons.save", "Save")}
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
            >
              {translate("buttons.cancel", "Cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-800 whitespace-pre-wrap">
          {comment.text}
        </div>
      )}
    </div>
  );
}
