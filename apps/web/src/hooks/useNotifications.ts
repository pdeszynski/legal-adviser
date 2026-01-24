'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';
import {
  GetRecentNotificationsDocument,
  MarkNotificationAsReadDocument,
  MarkAllNotificationsAsReadDocument,
  InAppNotificationCreatedDocument,
  type InAppNotification as GraphQLInAppNotification,
  type InAppNotificationType as GraphQLInAppNotificationType,
  type InAppNotificationCreatedSubscriptionVariables,
} from '@/generated/graphql';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

// Lowercase notification type for UI components (matches component expectations)
export type InAppNotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';

// Convert generated enum to lowercase type
const toLowercaseNotificationType = (type: GraphQLInAppNotificationType): InAppNotificationType => {
  const typeMap: Record<GraphQLInAppNotificationType, InAppNotificationType> = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    SYSTEM: 'system',
  };
  return typeMap[type] ?? 'info';
};

// Convert generated notification to UI-friendly format
const toUiNotification = (notification: GraphQLInAppNotification): InAppNotification => ({
  id: notification.id,
  userId: notification.userId,
  type: toLowercaseNotificationType(notification.type),
  message: notification.message,
  read: notification.read,
  actionLink: notification.actionLink,
  actionLabel: notification.actionLabel,
  metadata: notification.metadata as Record<string, unknown> | null,
  createdAt:
    notification.createdAt instanceof Date
      ? notification.createdAt.toISOString()
      : (notification.createdAt as string),
});

// UI-friendly notification interface (lowercase types)
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

// Re-export generated types for advanced usage
export type { InAppNotificationCreatedSubscriptionVariables } from '@/generated/graphql';
// Export the generated GraphQL types with different names to avoid conflicts
// Use a type import with an alias, then export it
export type GeneratedInAppNotification = GraphQLInAppNotification;
export type GeneratedInAppNotificationType = GraphQLInAppNotificationType;

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
 *
 * Uses GraphQL documents defined in src/graphql/notifications.graphql
 * for type safety and consistency.
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

      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          query: GetRecentNotificationsDocument,
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

      setNotifications((result.data?.recentNotifications || []).map(toUiNotification));
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

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: MarkNotificationAsReadDocument,
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
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently handle error - notification remain unread
      }
    },
    [user?.id],
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

      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          query: MarkAllNotificationsAsReadDocument,
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

// Export the subscription document for use in components
export { InAppNotificationCreatedDocument };
