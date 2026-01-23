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
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ) : colIndex === 1 ? (
                      // User column
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    ) : colIndex === 2 || colIndex === 3 ? (
                      // Action and Resource columns - badges
                      <Skeleton className="h-6 w-16 rounded-full" />
                    ) : colIndex === 4 ? (
                      // Status column
                      <Skeleton className="h-6 w-12 rounded-full" />
                    ) : (
                      // Details column
                      <Skeleton className="h-4 w-40" />
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
