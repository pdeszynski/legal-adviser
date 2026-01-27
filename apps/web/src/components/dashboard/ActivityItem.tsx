import React from 'react';
import Link from 'next/link';

interface ActivityItemProps {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  action,
  resourceType,
  resourceId,
  userName,
  timestamp,
}) => {
  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'created':
        return 'text-green-600 bg-green-50';
      case 'update':
      case 'updated':
        return 'text-blue-600 bg-blue-50';
      case 'delete':
      case 'deleted':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'created':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'update':
      case 'updated':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        );
      case 'delete':
      case 'deleted':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-full ${getActionColor(action)}`}>{getActionIcon(action)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          {userName && <span className="font-medium">{userName} </span>}
          <span className="text-gray-600">{action} </span>
          <Link
            href={`/${resourceType}/${resourceId}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {resourceType}
          </Link>
        </p>
        <p className="text-xs text-gray-500 mt-1">{formatTimestamp(timestamp)}</p>
      </div>
    </div>
  );
};
