"use client";

import { useEffect } from "react";
import { useDocumentProgress, ConnectionState } from "@/hooks/useDocumentProgress";

interface DocumentGenerationProgressProps {
  /** Document ID to track */
  documentId: string;
  /** Called when generation completes successfully */
  onComplete?: () => void;
  /** Called when generation fails */
  onFailed?: (error: string) => void;
  /** Whether to enable progress tracking */
  enabled?: boolean;
}

/**
 * DocumentGenerationProgress Component
 *
 * Displays real-time progress during document generation.
 * Connects to backend SSE endpoint for live updates.
 *
 * Features:
 * - Animated progress bar
 * - Status messages
 * - Connection state indicator
 * - Completion/failure callbacks
 */
export function DocumentGenerationProgress({
  documentId,
  onComplete,
  onFailed,
  enabled = true,
}: DocumentGenerationProgressProps) {
  const {
    progress,
    message,
    connectionState,
    isComplete,
    isFailed,
    error,
  } = useDocumentProgress(documentId, enabled);

  // Trigger callbacks on completion/failure
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
    if (isFailed && onFailed && error) {
      onFailed(error);
    }
  }, [isComplete, isFailed, error, onComplete, onFailed]);

  // Connection state colors
  const connectionColors: Record<ConnectionState, string> = {
    connecting: "bg-yellow-500",
    connected: "bg-green-500",
    disconnected: "bg-gray-400",
    error: "bg-red-500",
  };

  // Don't render if not generating
  if (!enabled) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      {/* Header with connection indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${connectionColors[connectionState]} animate-pulse`}
            title={`Connection: ${connectionState}`}
          />
          <span className="text-sm font-medium text-blue-800">
            Document Generation
          </span>
        </div>
        <span className="text-sm text-blue-600 font-mono">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status message */}
      {message && (
        <p className="text-sm text-blue-700">{message}</p>
      )}

      {/* Error message */}
      {isFailed && error && (
        <div className="bg-red-100 border border-red-300 rounded p-2 mt-2">
          <p className="text-sm text-red-700">
            <span className="font-medium">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Completion message */}
      {isComplete && (
        <div className="bg-green-100 border border-green-300 rounded p-2 mt-2">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Document generated successfully!
          </p>
        </div>
      )}
    </div>
  );
}
