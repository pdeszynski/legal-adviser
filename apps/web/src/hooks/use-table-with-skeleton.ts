'use client';

import { useTable as useRefineTable } from '@refinedev/react-table';
import type { UseTableProps, UseTableReturnType } from '@refinedev/react-table';
import type { BaseRecord, HttpError } from '@refinedev/core';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Props for the useTableWithSkeleton hook
 */
export interface UseTableWithSkeletonProps<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TData extends BaseRecord = TQueryFnData,
> extends UseTableProps<TQueryFnData, TError, TData> {
  /**
   * Number of skeleton rows to show during loading.
   * Defaults to the pagination.pageSize from refineCoreProps.
   */
  skeletonRowCount?: number;
}

/**
 * Return value of useTableWithSkeleton hook
 */
export interface UseTableWithSkeletonResult<
  TData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
> extends UseTableReturnType<TData, TError> {
  /**
   * Whether the table is currently loading data
   */
  isLoading: boolean;
  /**
   * Number of skeleton rows to display based on page size or prop
   */
  skeletonRowCount: number;
}

/**
 * Wrapper hook around Refine's useTable that provides skeleton loading state.
 *
 * This hook wraps @refinedev/react-table's useTable and adds convenient
 * properties for implementing skeleton loading states.
 *
 * @example
 * ```tsx
 * const { reactTable, refineCore, isLoading, skeletonRowCount } = useTableWithSkeleton({
 *   columns,
 *   refineCoreProps: { resource: 'documents' },
 * });
 *
 * return (
 *   <>
 *     {isLoading ? (
 *       <TableSkeleton rows={skeletonRowCount} columns={columns.length} />
 *     ) : (
 *       <Table>{...}</Table>
 *     )}
 *   </>
 * );
 * ```
 */
export function useTableWithSkeleton<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TData extends BaseRecord = TQueryFnData,
>(
  props: UseTableWithSkeletonProps<TQueryFnData, TError, TData>,
): UseTableWithSkeletonResult<TData, TError> {
  const { skeletonRowCount, ...refineTableProps } = props;

  const result = useRefineTable<TQueryFnData, TError, TData>(refineTableProps);

  const isLoading = result.refineCore.tableQuery.isLoading;

  // Determine skeleton row count from provided prop or pagination pageSize
  const paginationPageSize = refineTableProps.refineCoreProps?.pagination?.pageSize;
  const rows = skeletonRowCount ?? paginationPageSize ?? 10;

  return {
    ...result,
    isLoading,
    skeletonRowCount: rows,
  };
}

export type { UseTableProps, UseTableReturnType } from '@refinedev/react-table';
