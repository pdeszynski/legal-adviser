'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

export type InAppNotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';

export interface InAppNotification {
  id: string;
  userId: string;
  type: InAppNotificationType;
  message: string;
  read: boolean;
  actionLink?: string | null;
  actionLabel?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface UseNotificationsReturn {
  notifications: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

/**
 * useNotifications Hook
 *
 * Custom hook for managing in-app notifications.
 * Fetches notifications for the current user and provides
 * methods to mark them as read.
 */
export function useNotifications(limit: number = 20): UseNotificationsReturn {
  const { data: user } = useGetIdentity<{ id: string }>();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const query = `
        query GetRecentNotifications($userId: String!, $limit: Int) {
          recentNotifications(userId: $userId, limit: $limit) {
            id
            userId
            type
            message
            read
            actionLink
            actionLabel
            metadata
            createdAt
          }
          unreadNotificationCount(userId: $userId)
        }
      `;

      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          query,
          variables: { userId: user.id, limit },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message || 'GraphQL error');
      }

      setNotifications(result.data?.recentNotifications || []);
      setUnreadCount(result.data?.unreadNotificationCount || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, limit]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        const accessToken = getAccessToken();
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const mutation = `
          mutation MarkNotificationAsRead($notificationId: String!, $userId: String!) {
            markNotificationAsRead(notificationId: $notificationId, userId: $userId)
          }
        `;

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: mutation,
            variables: { notificationId, userId: user.id },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message || 'GraphQL error');
        }

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently handle error - notification remains unread
      }
    },
    [user?.id]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const mutation = `
        mutation MarkAllNotificationsAsRead($userId: String!) {
          markAllNotificationsAsRead(userId: $userId)
        }
      `;

      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          query: mutation,
          variables: { userId: user.id },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message || 'GraphQL error');
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently handle error - notifications remain unread
    }
  }, [user?.id]);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
