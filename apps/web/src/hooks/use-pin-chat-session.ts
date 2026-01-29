'use client';

import { useState, useCallback } from 'react';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import { getCsrfHeaders } from '@/lib/csrf';
import { toast } from '@/hooks/use-toast';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

export interface PinChatSessionOptions {
  onSuccess?: (sessionId: string, isPinned: boolean) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for pinning/unpinning chat sessions with optimistic updates and error handling
 *
 * Provides functionality to toggle the pin state of a chat session with proper
 * authentication, CSRF protection, optimistic UI updates, and user feedback.
 */
export function usePinChatSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pinChatSession = useCallback(
    async (sessionId: string, isPinned: boolean, options: PinChatSessionOptions = {}) => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        const err = new Error('You must be logged in to pin a chat session');
        setError(err);
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to pin a chat session.',
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
              mutation PinChatSession($input: PinChatSessionInput!) {
                pinChatSession(input: $input) {
                  id
                  title
                  isPinned
                  mode
                  messageCount
                  lastMessageAt
                  createdAt
                  updatedAt
                }
              }
            `,
            variables: {
              input: {
                sessionId,
                isPinned,
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors[0].message || 'Failed to update pin status';
          throw new Error(errorMessage);
        }

        const updatedSession = result.data?.pinChatSession;
        if (!updatedSession) {
          throw new Error('Failed to update pin status: No data returned');
        }

        toast({
          title: isPinned ? 'Chat pinned' : 'Chat unpinned',
          description: isPinned
            ? 'The chat has been pinned to the top of your list.'
            : 'The chat has been unpinned.',
        });

        options.onSuccess?.(sessionId, isPinned);
        return true;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to update pin status');
        setError(errorObj);

        toast({
          variant: 'destructive',
          title: 'Update failed',
          description: errorObj.message || 'An error occurred while updating the pin status.',
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
    pinChatSession,
    isLoading,
    error,
  };
}
