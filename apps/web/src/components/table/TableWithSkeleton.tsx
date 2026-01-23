'use client';

import { useTableWithSkeleton } from '@/hooks/use-table-with-skeleton';
import type { ColumnDef } from '@tanstack/react-table';
import type { BaseRecord, HttpError } from '@refinedev/core';
import type { UseTableProps } from '@/hooks/use-table-with-skeleton';
import { TableSkeleton } from '@/components/skeleton/TableSkeleton';

/**
 * Props for TableWithSkeleton component
 */
export interface TableWithSkeletonProps<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TData extends BaseRecord = TQueryFnData,
> {
  /**
   * Props passed to useTableWithSkeleton hook
   */
  useTableProps: UseTableProps<TQueryFnData, TError, TData>;
  /**
   * Render function called when data is loaded.
   * Receives the result from useTableWithSkeleton.
   */
  children: (
    result: ReturnType<typeof useTableWithSkeleton<TQueryFnData, TError, TData>>,
  ) => React.ReactNode;
  /**
   * Custom skeleton component. Defaults to TableSkeleton.
   */
  skeletonComponent?: (props: { rows: number; columns: number }) => React.ReactNode;
}

/**
 * Reusable wrapper component that handles skeleton loading for tables.
 *
 * This component automatically shows a skeleton while data is loading
 * and renders the provided children when data is ready.
 *
 * @example
 * ```tsx
 * <TableWithSkeleton
 *   useTableProps={{
 *     columns,
 *     refineCoreProps: { resource: 'documents' },
 *   }}
 * >
 *   {({ reactTable, refineCore }) => (
 *     <table>
 *       <tbody>
 *         {reactTable.getRowModel().rows.map(row => (
 *           <tr key={row.id}>...</tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   )}
 * </TableWithSkeleton>
 * ```
 */
export function TableWithSkeleton<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TData extends BaseRecord = TQueryFnData,
>({
  useTableProps,
  children,
  skeletonComponent,
}: TableWithSkeletonProps<TQueryFnData, TError, TData>) {
  const result = useTableWithSkeleton<TQueryFnData, TError, TData>(useTableProps);
  const { isLoading, skeletonRowCount } = result;

  if (isLoading) {
    const DefaultSkeleton = skeletonComponent ?? TableSkeleton;
    const columns = (useTableProps.columns as ColumnDef<TData>[]).length;

    return <DefaultSkeleton rows={skeletonRowCount} columns={columns} />;
  }

  return <>{children(result)}</>;
}
