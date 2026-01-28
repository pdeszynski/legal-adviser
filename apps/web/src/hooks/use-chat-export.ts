'use client';

import { useCallback, useState } from 'react';

/**
 * Chat export format options
 */
export type ChatExportFormat = 'PDF' | 'MARKDOWN' | 'JSON';

/**
 * Export result interface
 */
export interface ChatExportResult {
  sessionId: string;
  format: ChatExportFormat;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  contentBase64: string;
  exportedAt: string;
  pageCount?: number; // For PDF exports
}

/**
 * Hook for exporting chat sessions
 *
 * Provides functionality to export chat sessions to PDF, Markdown, or JSON format.
 * Downloads the exported file automatically.
 */
export function useChatExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Export a chat session to the specified format
   *
   * @param sessionId - ID of the session to export
   * @param format - Export format (PDF, MARKDOWN, JSON)
   * @param filename - Optional custom filename (without extension)
   */
  const exportSession = useCallback(
    async (sessionId: string, format: ChatExportFormat, filename?: string) => {
      setIsExporting(true);
      setError(null);

      const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

      // Get auth token
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: `
              mutation ExportChatSession($input: ExportChatSessionInput!) {
                exportChatSession(input: $input) {
                  sessionId
                  format
                  filename
                  mimeType
                  fileSizeBytes
                  contentBase64
                  exportedAt
                  ... on ChatExportPdfResult {
                    pageCount
                  }
                }
              }
            `,
            variables: {
              input: {
                sessionId,
                format,
                filename,
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Export failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Export failed');
        }

        const exportData: ChatExportResult = result.data.exportChatSession;

        // Decode base64 content and trigger download
        const binaryString = atob(exportData.contentBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: exportData.mimeType });

        // Create download link and trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportData.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return exportData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to export chat session';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return {
    exportSession,
    isExporting,
    error,
  };
}
