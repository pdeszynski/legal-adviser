import { Skeleton } from '@/*/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

/**
 * Table skeleton component for displaying loading state in tables.
 * Matches the structure of the audit log table.
 */
export function TableSkeleton({ rows = 10, columns = 6, showHeader = true }: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {showHeader && (
            <thead className="bg-gray-50">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th
                    key={i}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 text-sm">
                    {/* Column-specific skeleton sizes to match audit log structure */}
                    {colIndex === 0 ? (
                      // Date & Time column
                      (<div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>)
                    ) : colIndex === 1 ? (
                      // User column
                      (<div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>)
                    ) : colIndex === 2 || colIndex === 3 ? (
                      // Action and Resource columns - badges
                      (<Skeleton className="h-6 w-16 rounded-full" />)
                    ) : colIndex === 4 ? (
                      // Status column
                      (<Skeleton className="h-6 w-12 rounded-full" />)
                    ) : (
                      // Details column
                      (<Skeleton className="h-4 w-40" />)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Audit log table skeleton with specific column layout.
 */
export function AuditLogTableSkeleton({ rows = 10 }: { rows?: number }) {
  return <TableSkeleton rows={rows} columns={6} showHeader={true} />;
}

/**
 * Admin audit log table skeleton with specific column layout (5 columns).
 */
export function AdminAuditLogTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              {Array.from({ length: 5 }).map((_, i) => (
                <th
                  key={i}
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                >
                  <Skeleton className="h-4 w-24" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b transition-colors hover:bg-muted/50">
                {/* Timestamp */}
                <td className="p-4 align-middle whitespace-nowrap">
                  <Skeleton className="h-4 w-32" />
                </td>
                {/* User */}
                <td className="p-4 align-middle font-medium">
                  <Skeleton className="h-4 w-24" />
                </td>
                {/* Action */}
                <td className="p-4 align-middle">
                  <Skeleton className="h-6 w-16 rounded-md" />
                </td>
                {/* Resource Type */}
                <td className="p-4 align-middle">
                  <Skeleton className="h-4 w-20" />
                </td>
                {/* Resource ID */}
                <td className="p-4 align-middle font-mono text-xs">
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
 * Document list table skeleton with specific column layout matching the document table.
 * Columns: Title, Type, Status, Created At, Actions
 */
export function DocumentTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              {Array.from({ length: 5 }).map((_, i) => (
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
              <tr key={rowIndex} className="hover:bg-muted/50 transition-colors">
                {/* Title column - wider */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Skeleton className="h-5 w-48" />
                </td>
                {/* Type column - badge */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Skeleton className="h-6 w-16 rounded-md" />
                </td>
                {/* Status column - rounded badge */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                {/* Created At column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Skeleton className="h-4 w-32" />
                </td>
                {/* Actions column - button */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Skeleton className="h-8 w-12 rounded" />
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
 * Document grid skeleton with card layout.
 * Matches the document card structure in grid view.
 */
export function DocumentGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="h-full bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col"
        >
          {/* Header with icon and status */}
          <div className="flex justify-between items-start mb-4">
            {/* Icon placeholder */}
            <Skeleton className="h-10 w-10 rounded-lg" />
            {/* Status badge placeholder */}
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Title placeholder */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>

          {/* Footer with date and type */}
          <div className="mt-auto pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
