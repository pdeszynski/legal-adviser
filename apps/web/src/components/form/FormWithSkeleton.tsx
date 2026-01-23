'use client';

import type { ReactNode } from 'react';
import type { BaseRecord, HttpError } from '@refinedev/core';
import {
  useFormWithSkeleton,
  type UseFormWithSkeletonResult,
  type UseFormWithSkeletonProps,
} from '@/hooks/use-form-with-skeleton';
import { FormSkeleton, type FormSkeletonProps } from '@/components/skeleton/FormSkeleton';

/**
 * Props for the FormWithSkeleton component
 */
export interface FormWithSkeletonProps<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TVariables extends BaseRecord = TQueryFnData,
> {
  /**
   * Props passed to useFormWithSkeleton hook
   */
  useFormProps: UseFormWithSkeletonProps<TQueryFnData, TError, TVariables>;
  /**
   * Render function when data is loaded.
   * Receives the form hook result as a parameter.
   */
  children: (form: UseFormWithSkeletonResult<TQueryFnData, TError, TVariables>) => ReactNode;
  /**
   * Custom skeleton component to override default.
   * Can be a React component or null to disable skeleton.
   */
  skeletonComponent?: ReactNode;
  /**
   * Props to pass to the default FormSkeleton if no custom skeleton is provided.
   */
  skeletonProps?: FormSkeletonProps;
  /**
   * Optional fallback component to show on error.
   */
  errorFallback?: (error: Error) => ReactNode;
}

/**
 * Wrapper component that automatically shows skeleton placeholders for forms while data is loading.
 *
 * This component wraps any form and provides a loading skeleton during initial data fetch.
 * It automatically detects form field structure and generates matching skeleton elements.
 * Supports both React Hook Form and Refine form integrations.
 *
 * @example
 * Basic usage with Refine
 * ```tsx
 * <FormWithSkeleton
 *   useFormProps={{
 *     refineCoreProps: {
 *       resource: 'documents',
 *       action: 'edit',
 *       id: documentId,
 *     },
 *   }}
 * >
 *   {({ register, handleSubmit, refineCore: { onFinish } }) => (
 *     <form onSubmit={handleSubmit(onFinish)}>
 *       <input {...register('title')} />
 *       <button type="submit">Save</button>
 *     </form>
 *   )}
 * </FormWithSkeleton>
 * ```
 *
 * @example
 * With custom skeleton
 * ```tsx
 * <FormWithSkeleton
 *   useFormProps={{ ... }}
 *   skeletonComponent={<CustomFormSkeleton />}
 * >
 *   {(form) => <MyForm {...form} />}
 * </FormWithSkeleton>
 * ```
 *
 * @example
 * With skeleton props
 * ```tsx
 * <FormWithSkeleton
 *   useFormProps={{ ... }}
 *   skeletonProps={{ fieldCount: 8, variant: 'settings' }}
 * >
 *   {(form) => <MyForm {...form} />}
 * </FormWithSkeleton>
 * ```
 */
export function FormWithSkeleton<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TVariables extends BaseRecord = TQueryFnData,
>({
  useFormProps,
  children,
  skeletonComponent,
  skeletonProps,
  errorFallback,
}: FormWithSkeletonProps<TQueryFnData, TError, TVariables>) {
  const formResult = useFormWithSkeleton<TQueryFnData, TError, TVariables>(useFormProps);

  // Handle error state if error fallback is provided
  if (errorFallback && formResult.refineCore?.query?.error) {
    return <>{errorFallback(formResult.refineCore.query.error as unknown as Error)}</>;
  }

  // Show skeleton during initial load
  if (formResult.isLoading) {
    if (skeletonComponent !== undefined) {
      return <>{skeletonComponent}</>;
    }
    return <FormSkeleton {...skeletonProps} />;
  }

  // Render form when data is loaded
  return <>{children(formResult)}</>;
}

/**
 * HOC version that wraps a form component with skeleton loading.
 *
 * @example
 * ```tsx
 * const DocumentFormWithSkeleton = withFormSkeleton(DocumentForm, {
 *   refineCoreProps: {
 *     resource: 'documents',
 *     action: 'edit',
 *   },
 * });
 * ```
 */
export function withFormSkeleton<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TVariables extends BaseRecord = TQueryFnData,
  P extends object = object,
>(
  Component: (
    props: P & { form: UseFormWithSkeletonResult<TQueryFnData, TError, TVariables> },
  ) => ReactNode,
  useFormProps: UseFormWithSkeletonProps<TQueryFnData, TError, TVariables>,
  skeletonProps?: FormSkeletonProps,
): (props: Omit<P, 'form'>) => ReactNode {
  return function WrappedComponent(props: Omit<P, 'form'>) {
    return (
      <FormWithSkeleton useFormProps={useFormProps} skeletonProps={skeletonProps}>
        {(form) => <Component {...(props as P)} form={form} />}
      </FormWithSkeleton>
    );
  };
}
