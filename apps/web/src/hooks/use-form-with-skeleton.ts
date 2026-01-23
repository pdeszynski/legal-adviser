'use client';

import { useForm as useRefineForm } from '@refinedev/react-hook-form';
import type { UseFormProps, UseFormReturnType } from '@refinedev/react-hook-form';
import type { BaseRecord, HttpError } from '@refinedev/core';

/**
 * Props for the useFormWithSkeleton hook
 */
export interface UseFormWithSkeletonProps<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TVariables extends BaseRecord = TQueryFnData,
> extends UseFormProps<TQueryFnData, TError, TVariables> {
  /**
   * Whether to show skeleton while initializing form data.
   * Set to false to disable skeleton loading.
   * @default true
   */
  showSkeletonOnInitialLoad?: boolean;
  /**
   * Custom loading state logic.
   * When provided, this function determines the loading state.
   * Useful for custom form implementations.
   */
  isLoadingFn?: (formResult: UseFormReturnType<TQueryFnData, TError, TVariables>) => boolean;
}

/**
 * Return value of useFormWithSkeleton hook
 */
export interface UseFormWithSkeletonResult<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TVariables extends BaseRecord = TQueryFnData,
> extends UseFormReturnType<TQueryFnData, TError, TVariables> {
  /**
   * Whether the form is currently in skeleton loading state.
   * This is true only during initial data loading, not during form submission.
   */
  isLoading: boolean;
  /**
   * Whether the form is currently submitting.
   * Use this to disable submit buttons during submission.
   */
  isSubmitting: boolean;
}

/**
 * Wrapper hook around Refine's useForm that provides skeleton loading state.
 *
 * This hook wraps @refinedev/react-hook-form's useForm and adds convenient
 * properties for implementing skeleton loading states in forms.
 *
 * @example
 * ```tsx
 * const {
 *   refineCore: { queryResult, onFinish, formLoading },
 *   register,
 *   handleSubmit,
 *   control,
 *   formState: { errors },
 *   isLoading,
 *   isSubmitting,
 * } = useFormWithSkeleton({
 *   refineCoreProps: {
 *     resource: 'documents',
 *     action: 'create',
 *   },
 * });
 *
 * return (
 *   <>
 *     {isLoading ? (
 *       <FormSkeleton />
 *     ) : (
 *       <form onSubmit={handleSubmit(onFinish)}>...</form>
 *     )}
 *   </>
 * );
 * ```
 *
 * @example
 * With React Hook Form directly
 * ```tsx
 * const { register, handleSubmit, isLoading, isSubmitting } = useFormWithSkeleton({
 *   showSkeletonOnInitialLoad: false, // Disable auto skeleton
 *   isLoadingFn: (form) => form.refineCore.queryResult.isLoading,
 * });
 * ```
 */
export function useFormWithSkeleton<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TVariables extends BaseRecord = TQueryFnData,
>(
  props: UseFormWithSkeletonProps<TQueryFnData, TError, TVariables> = {},
): UseFormWithSkeletonResult<TQueryFnData, TError, TVariables> {
  const { showSkeletonOnInitialLoad = true, isLoadingFn, ...formProps } = props;

  const formResult = useRefineForm<TQueryFnData, TError, TVariables>(formProps);

  // Determine loading state
  const isLoading =
    showSkeletonOnInitialLoad && isLoadingFn
      ? isLoadingFn(formResult)
      : showSkeletonOnInitialLoad
        ? Boolean(formResult.refineCore?.query?.isLoading ?? false)
        : false;

  // Determine submission state (from formLoading)
  const isSubmitting = Boolean(formResult.refineCore?.formLoading ?? false);

  return {
    ...formResult,
    isLoading,
    isSubmitting,
  };
}

export type { UseFormProps, UseFormReturnType } from '@refinedev/react-hook-form';
