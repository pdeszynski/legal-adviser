import { Skeleton } from '@/*/components/ui/skeleton';

/**
 * Skeleton loader for individual notification items.
 * Matches the notification item layout including icon, message, timestamp, and action buttons.
 */
export function NotificationItemSkeleton() {
  return (
    <div className="w-full text-left p-4">
      <div className="flex items-start gap-3">
        {/* Icon placeholder */}
        <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            {/* Title/type placeholder */}
            <Skeleton className="h-4 w-24" />
            {/* Unread indicator placeholder */}
            <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
          </div>
          {/* Message line 1 */}
          <Skeleton className="h-3 w-full" />
          {/* Message line 2 */}
          <Skeleton className="h-3 w-2/3" />
          <div className="flex items-center gap-2">
            {/* Timestamp placeholder */}
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for notification center page with stats cards.
 * Shows statistics cards and filter section skeleton.
 */
export function NotificationCenterStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for notification center filters section.
 */
export function NotificationCenterFiltersSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="min-w-[200px]">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="min-w-[200px]">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for notification center list header.
 */
export function NotificationCenterListHeaderSkeleton() {
  return (
    <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-4">
      <Skeleton className="h-4 w-4" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for notification bell icon.
 * Shows a bell icon with a pulsing loading indicator.
 */
export function NotificationBellSkeleton() {
  return (
    <div className="relative p-2">
      {/* Bell icon skeleton */}
      <Skeleton className="h-6 w-6" />
      {/* Loading indicator */}
      <span className="absolute top-0 right-0 inline-flex items-center justify-center w-2 h-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
      </span>
    </div>
  );
}

/**
 * Skeleton loader for notification center page.
 * Shows the full notification center layout with stats, filters, and notification list.
 */
export function NotificationCenterSkeleton({ items = 8 }: { items?: number }) {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Statistics Cards */}
      <NotificationCenterStatsSkeleton />

      {/* Filters Section */}
      <NotificationCenterFiltersSkeleton />

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow">
        {/* List Header */}
        <NotificationCenterListHeaderSkeleton />

        {/* Notification Items */}
        <div className="divide-y">
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <Skeleton className="mt-1 w-4 h-4 rounded" />
                {/* Icon */}
                <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                {/* Content */}
                <div className="flex-1">
                  {/* Type badge and unread indicator */}
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                  </div>
                  {/* Message */}
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  {/* Timestamp and action */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for notification dropdown items.
 * Shows a few notification item skeletons in a dropdown format.
 */
export function NotificationDropdownSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: items }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  );
}
