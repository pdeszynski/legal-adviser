'use client';

import { useTranslate, useList } from '@refinedev/core';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { InAppNotification, InAppNotificationType } from '@/hooks/useNotifications';

/**
 * Notification type enum matching backend
 */
type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';

/**
 * Read status filter
 */
type ReadStatusFilter = 'all' | 'read' | 'unread';

/**
 * Notification Center Page
 *
 * Displays all notifications with filtering by type and read status.
 * Supports bulk mark as read and individual notification actions.
 */
export default function NotificationCenter() {
  const translate = useTranslate();
  const router = useRouter();

  // Filter state
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('');
  const [readStatusFilter, setReadStatusFilter] = useState<ReadStatusFilter>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Fetch notifications using nestjs-query auto-generated resolver
  const { query, result } = useList<InAppNotification>({
    resource: 'inAppNotifications',
    pagination: {
      pageSize: 50,
    },
    sorters: [
      {
        field: 'createdAt',
        order: 'desc',
      },
    ],
  });

  const { data, isLoading, error, refetch } = query;

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (!result?.data) return [];

    let notifications = [...result.data];

    // Filter by type
    if (typeFilter) {
      notifications = notifications.filter((n) => n.type === typeFilter);
    }

    // Filter by read status
    if (readStatusFilter === 'read') {
      notifications = notifications.filter((n) => n.read);
    } else if (readStatusFilter === 'unread') {
      notifications = notifications.filter((n) => !n.read);
    }

    return notifications;
  }, [data, typeFilter, readStatusFilter]);

  // Get statistics
  const stats = useMemo(() => {
    if (!result?.data) return { total: 0, unread: 0, byType: {} as Record<string, number> };

    const byType: Record<string, number> = {};
    let unread = 0;

    result.data.forEach((n) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
      if (!n.read) unread++;
    });

    return { total: result.data.length, unread, byType };
  }, [result]);

  // Handle notification click
  const handleNotificationClick = (notification: InAppNotification) => {
    // If notification has an action link, navigate to it
    if (notification.actionLink) {
      if (notification.actionLink.startsWith('http')) {
        window.open(notification.actionLink, '_blank');
      } else {
        router.push(notification.actionLink);
      }
    }
  };

  // Handle select/deselect all
  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  // Handle select individual
  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setTypeFilter('');
    setReadStatusFilter('all');
  };

  // Get notification icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return (
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'system':
        return (
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  // Get notification type color for badge
  const getTypeBadgeColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'system':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const hasActiveFilters = typeFilter || readStatusFilter !== 'all';
  const allSelected =
    filteredNotifications.length > 0 && selectedNotifications.size === filteredNotifications.length;
  const someSelected =
    selectedNotifications.size > 0 && selectedNotifications.size < filteredNotifications.length;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {translate('notificationCenter.title') || 'Notification Center'}
        </h1>
        <p className="text-gray-600">
          {translate('notificationCenter.description') || 'View and manage all your notifications'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">
            {translate('notificationCenter.stats.total') || 'Total'}
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">
            {translate('notificationCenter.stats.unread') || 'Unread'}
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">
            {translate('notificationCenter.types.info') || 'Info'}
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.byType.info || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">
            {translate('notificationCenter.types.system') || 'System'}
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.byType.system || 0}</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Type Filter */}
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translate('notificationCenter.filters.type') || 'Type'}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as NotificationType | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{translate('common.all') || 'All'}</option>
              <option value="info">{translate('notificationCenter.types.info') || 'Info'}</option>
              <option value="success">
                {translate('notificationCenter.types.success') || 'Success'}
              </option>
              <option value="warning">
                {translate('notificationCenter.types.warning') || 'Warning'}
              </option>
              <option value="error">
                {translate('notificationCenter.types.error') || 'Error'}
              </option>
              <option value="system">
                {translate('notificationCenter.types.system') || 'System'}
              </option>
            </select>
          </div>

          {/* Read Status Filter */}
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translate('notificationCenter.filters.status') || 'Status'}
            </label>
            <select
              value={readStatusFilter}
              onChange={(e) => setReadStatusFilter(e.target.value as ReadStatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{translate('notificationCenter.status.all') || 'All'}</option>
              <option value="unread">
                {translate('notificationCenter.status.unread') || 'Unread'}
              </option>
              <option value="read">{translate('notificationCenter.status.read') || 'Read'}</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              {translate('buttons.clear') || 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{translate('loading') || 'Loading...'}</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">
            {translate('notificationCenter.errors.loadingFailed') || 'Failed to load notifications'}
          </p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {hasActiveFilters
              ? translate('notificationCenter.noFilteredResults') ||
                'No notifications match your filters'
              : translate('notificationCenter.noNotifications') || 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Bulk Actions Header */}
          {selectedNotifications.size > 0 && (
            <div className="bg-blue-50 px-6 py-3 border-b flex items-center justify-between">
              <span className="text-sm text-blue-800 font-medium">
                {translate('notificationCenter.selectedCount', {
                  count: selectedNotifications.size,
                }) || `${selectedNotifications.size} selected`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedNotifications(new Set());
                  }}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {translate('notificationCenter.actions.deselect') || 'Deselect'}
                </button>
              </div>
            </div>
          )}

          {/* List Header */}
          <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-4">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (someSelected && input) {
                  input.indeterminate = true;
                }
              }}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div className="flex-1 text-sm font-medium text-gray-700">
              {translate('notificationCenter.headers.notifications') || 'Notifications'}
            </div>
          </div>

          {/* Notifications */}
          <div className="divide-y">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />

                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(
                              notification.type,
                            )}`}
                          >
                            {translate(`notificationCenter.types.${notification.type}`) ||
                              notification.type.charAt(0).toUpperCase() +
                                notification.type.slice(1)}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        <p
                          className={`text-sm mb-1 ${
                            !notification.read ? 'text-gray-900 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatTimestamp(notification.createdAt)}</span>
                          {notification.actionLabel && (
                            <>
                              <span>·</span>
                              <span className="text-blue-600 font-medium">
                                {notification.actionLabel}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
