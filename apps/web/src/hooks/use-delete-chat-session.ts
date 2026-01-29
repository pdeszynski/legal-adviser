'use client';

import { useState, useCallback } from 'react';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';
import { toast } from '@/hooks/use-toast';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

export interface DeleteChatSessionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for deleting chat sessions with confirmation and error handling
 *
 * Provides functionality to soft delete a chat session with proper
 * authentication, CSRF protection, and user feedback.
 */
export function useDeleteChatSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteChatSession = useCallback(
    async (sessionId: string, options: DeleteChatSessionOptions = {}) => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        const err = new Error('You must be logged in to delete a chat session');
        setError(err);
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to delete a chat session.',
        });
        options.onError?.(err);
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          ...getCsrfHeaders(),
        };

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: `
              mutation DeleteChatSession($input: DeleteChatSessionInput!) {
                deleteChatSession(input: $input) {
                  id
                  title
                  deletedAt
                }
              }
            `,
            variables: {
              input: {
                sessionId,
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors[0].message || 'Failed to delete chat session';
          throw new Error(errorMessage);
        }

        const deletedSession = result.data?.deleteChatSession;
        if (!deletedSession) {
          throw new Error('Failed to delete chat session: No data returned');
        }

        toast({
          title: 'Chat deleted',
          description: 'The chat has been successfully deleted.',
        });

        options.onSuccess?.();
        return true;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to delete chat session');
        setError(errorObj);

        toast({
          variant: 'destructive',
          title: 'Delete failed',
          description: errorObj.message || 'An error occurred while deleting the chat.',
        });

        options.onError?.(errorObj);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    deleteChatSession,
    isLoading,
    error,
  };
}
