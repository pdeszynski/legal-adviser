import { Skeleton } from '@/*/components/ui/skeleton';

/**
 * Generic page skeleton for full page loading states.
 * Shows a centered loading indicator with proper spacing.
 */
export function PageSkeleton({
  showHeader = true,
  showContent = true,
}: {
  showHeader?: boolean;
  showContent?: boolean;
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      {showHeader && (
        <div className="mb-8 space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
      )}

      {showContent && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
    </div>
  );
}

/**
 * Centered page skeleton for simple loading states.
 * Used when content loads in the center of the page (like template loading).
 */
export function CenteredPageSkeleton({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="inline-block">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        {message && <p className="text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

/**
 * Card grid skeleton for template/card-based layouts.
 */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: cards }).map((_, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-lg shadow-sm p-6 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>

            {/* Description */}
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Settings tab skeleton for settings page content area.
 * Matches the layout of settings forms with proper field structure.
 */
export function SettingsTabSkeleton({
  variant = 'default',
}: {
  variant?: 'profile' | 'preferences' | 'security' | 'notifications' | 'apiKeys' | 'default';
}) {
  // Profile tab: 4 fields (email, username, first/last name in grid)
  if (variant === 'profile') {
    return (
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Username field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* First/Last name grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    );
  }

  // Preferences tab: 5 dropdown fields (3 single, 2 in grid)
  if (variant === 'preferences') {
    return (
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Locale field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Theme field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* AI Model field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Timezone/Date format grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    );
  }

  // Security tab: 3 password fields + security tips
  if (variant === 'security') {
    return (
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Current Password */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-48" />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Security Tips */}
        <div className="p-6 border rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  // Notifications tab: 3 checkbox groups
  if (variant === 'notifications') {
    return (
      <div className="max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Notification Types */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-1 border rounded-xl p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>

        {/* Notification Channels */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="space-y-1 border rounded-xl p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>

        {/* Legacy Settings */}
        <div className="pt-4 border-t">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-1 border rounded-xl p-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    );
  }

  // API Keys tab: Uses the ApiKeysListSkeleton pattern
  // Note: The actual SettingsApiKeys component manages its own loading state
  // This skeleton is used when the parent page is loading initial user data
  if (variant === 'apiKeys') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* API Key Cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 border rounded-xl bg-card">
            <div className="flex justify-between items-start mb-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}

        {/* Security Notice */}
        <div className="p-6 border rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  // Default: Generic settings skeleton
  return (
    <div className="space-y-6">
      {/* Tab header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Content sections */}
      <div className="space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact card skeleton for inline card loading.
 */
export function CompactCardSkeleton() {
  return (
    <div className="p-5 border border-border rounded-xl bg-card">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

/**
 * API keys list skeleton.
 */
export function ApiKeysListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <div className="mb-6 flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {Array.from({ length: count }).map((_, i) => (
        <CompactCardSkeleton key={i} />
      ))}
    </div>
  );
}
