'use client';

import { useEffect, useRef, useState } from 'react';
import { useCollaboration, UserCursor } from '../../hooks/use-collaboration';

/**
 * Collaborative Textarea Props
 */
interface CollaborativeTextareaProps {
  documentId: string;
  userId: string;
  userName: string;
  initialContent: string;
  onContentChange: (content: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Cursor overlay component
 * Shows where other users are editing
 */
function CursorOverlay({
  cursors,
  contentHeight,
}: {
  cursors: UserCursor[];
  contentHeight: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute flex items-center gap-1 transition-all duration-150"
          style={{
            top: `${Math.min(cursor.position * 0.5, contentHeight)}px`, // Rough position estimation
            left: `${(cursor.position % 80) * 8}px`, // Rough column position
          }}
        >
          {/* Cursor indicator */}
          <div
            className="w-0.5 h-5"
            style={{
              backgroundColor: cursor.color || '#3B82F6',
            }}
          />
          {/* User label */}
          <span
            className="text-xs px-1.5 py-0.5 rounded text-white whitespace-nowrap"
            style={{
              backgroundColor: cursor.color || '#3B82F6',
            }}
          >
            {cursor.userName}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Active users indicator
 * Shows who is currently viewing/editing the document
 */
function ActiveUsersIndicator({
  users,
  currentUser,
}: {
  users: UserCursor[];
  currentUser: string | null;
}) {
  const otherUsers = users.filter((u) => u.userId !== currentUser);

  if (otherUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-md border border-gray-200">
      <span className="text-sm text-gray-600">Active users:</span>
      <div className="flex gap-2">
        {otherUsers.map((user) => (
          <div
            key={user.userId}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-gray-200"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: user.color || '#3B82F6' }}
            />
            <span className="text-xs text-gray-700">{user.userName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Collaborative Textarea Component
 *
 * A textarea that supports real-time collaborative editing.
 * Shows other users' cursors and handles operational transformation.
 *
 * Features:
 * - Real-time cursor tracking
 * - Visual indicators for other users
 * - Operational transformation for conflict resolution
 * - Connection status indicator
 */
export function CollaborativeTextarea({
  documentId,
  userId,
  userName,
  initialContent,
  onContentChange,
  className = '',
  disabled = false,
}: CollaborativeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialContent);
  const [lastCursorPosition, setLastCursorPosition] = useState(0);
  const [contentHeight, setContentHeight] = useState(500); // Approximate height

  const { state, actions } = useCollaboration();

  // Join document when component mounts
  useEffect(() => {
    actions.joinDocument(documentId, userId, userName);

    return () => {
      actions.leaveDocument();
    };
  }, [documentId, userId, userName, actions]);

  // Listen for remote edits
  useEffect(() => {
    const handleDocumentEdited = (event: CustomEvent) => {
      const { operation, userId: editorUserId } = event.detail;

      // Don't apply if it's our own operation (already applied locally)
      if (editorUserId === userId) return;

      // Apply the remote operation
      setContent((prevContent) => {
        let newContent = prevContent;

        switch (operation.operationType) {
          case 'INSERT':
            newContent =
              prevContent.slice(0, operation.position) +
              (operation.text || '') +
              prevContent.slice(operation.position);
            break;
          case 'DELETE':
            if (operation.length && operation.length > 0) {
              newContent =
                prevContent.slice(0, operation.position) +
                prevContent.slice(operation.position + operation.length);
            }
            break;
          case 'REPLACE':
            if (operation.length && operation.length > 0) {
              newContent =
                prevContent.slice(0, operation.position) +
                (operation.text || '') +
                prevContent.slice(operation.position + operation.length);
            }
            break;
        }

        // Notify parent of content change
        onContentChange(newContent);
        return newContent;
      });
    };

    // Add event listener
    window.addEventListener('documentEdited', handleDocumentEdited as EventListener);

    return () => {
      window.removeEventListener('documentEdited', handleDocumentEdited as EventListener);
    };
  }, [userId, onContentChange]);

  // Track cursor position
  const handleCursorPositionChange = () => {
    if (!textareaRef.current) return;

    const position = textareaRef.current.selectionStart;
    setLastCursorPosition(position);

    // Send cursor update to server
    actions.updateCursor(position);
  };

  // Handle content changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const position = textareaRef.current?.selectionStart || 0;

    // Detect the type of operation
    let operationType: 'INSERT' | 'DELETE' | 'REPLACE' = 'REPLACE';
    const length = content.length;
    const newLength = newContent.length;

    if (newLength > length) {
      operationType = 'INSERT';
    } else if (newLength < length) {
      operationType = 'DELETE';
    }

    // Send operation to server
    actions.sendOperation({
      operationType,
      position: lastCursorPosition,
      length: Math.abs(newLength - length),
      text:
        operationType === 'DELETE'
          ? undefined
          : newContent.slice(lastCursorPosition, lastCursorPosition + Math.abs(newLength - length)),
      version: state.documentVersion,
    });

    setContent(newContent);
    onContentChange(newContent);
    setLastCursorPosition(position);
  };

  // Connection status indicator
  const ConnectionStatus = () => {
    if (state.error) {
      return (
        <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{state.error}</span>
        </div>
      );
    }

    if (!state.isConnected) {
      return (
        <div className="flex items-center gap-2 text-yellow-600 text-sm mb-2">
          <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          <span>Connecting to collaboration server...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>Collaboration active</span>
      </div>
    );
  };

  return (
    <div className="relative">
      <ConnectionStatus />
      <ActiveUsersIndicator users={state.activeUsers} currentUser={userId} />

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onSelect={handleCursorPositionChange}
          onKeyUp={handleCursorPositionChange}
          onClick={handleCursorPositionChange}
          disabled={disabled}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          style={{ minHeight: '400px' }}
          placeholder="Enter document content..."
        />

        {/* Cursor overlay */}
        {state.isConnected && state.activeUsers.length > 0 && (
          <CursorOverlay
            cursors={state.activeUsers.filter((u) => u.userId !== userId)}
            contentHeight={contentHeight}
          />
        )}
      </div>
    </div>
  );
}
