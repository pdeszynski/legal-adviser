import { Skeleton } from '@/*/components/ui/skeleton';

/**
 * Billing subscription tab skeleton.
 * Shows card-shaped skeletons for subscription status and billing period.
 */
export function BillingSubscriptionSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="h-7 w-48 mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Plan Info Card */}
        <div className="border border-border rounded-lg p-4">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-8 w-40 mb-3" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>

        {/* Billing Period Card */}
        <div className="border border-border rounded-lg p-4">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-6 w-56 mb-2" />
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>

      {/* Usage Stats Section */}
      <div className="mb-8">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Billing payment history tab skeleton.
 * Shows table-shaped skeleton for payment history rows.
 */
export function BillingPaymentHistorySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="p-6">
      <Skeleton className="h-7 w-48 mb-6" />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              {Array.from({ length: 6 }).map((_, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-6 py-4 text-sm">
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-28" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Skeleton className="h-4 w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Billing plan change tab skeleton.
 * Shows card-shaped skeletons for plan options.
 */
export function BillingPlanChangeSkeleton({ plans = 3 }: { plans?: number }) {
  return (
    <div className="p-6">
      <Skeleton className="h-7 w-56 mb-2" />
      <Skeleton className="h-5 w-64 mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: plans }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
            <Skeleton className="h-8 w-24 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <ul className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <li key={j} className="flex items-center text-sm">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex space-x-4">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Billing payment methods tab skeleton.
 * Shows card-shaped skeletons for payment methods.
 */
export function BillingPaymentMethodsSkeleton({ methods = 2 }: { methods?: number }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {Array.from({ length: methods }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4 relative">
            <Skeleton className="h-5 w-16 rounded absolute top-2 right-2" />
            <div className="flex items-center mb-3">
              <Skeleton className="h-8 w-8 mr-3 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Note Section */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

/**
 * Main billing page skeleton wrapper.
 * Shows the appropriate skeleton based on the active tab.
 */
export function BillingSkeleton({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case 'subscription':
      return <BillingSubscriptionSkeleton />;
    case 'paymentHistory':
      return <BillingPaymentHistorySkeleton />;
    case 'planChange':
      return <BillingPlanChangeSkeleton />;
    case 'paymentMethods':
      return <BillingPaymentMethodsSkeleton />;
    default:
      return <BillingSubscriptionSkeleton />;
  }
}
