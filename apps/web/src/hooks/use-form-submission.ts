import { useState, useCallback } from 'react';

/**
 * Hook to manage form submission state with loading, success, and error states
 * Provides consistent state management across all forms
 */
export interface UseFormSubmissionOptions<TData = unknown, TError = Error> {
  /** Callback called on successful submission */
  onSuccess?: (data: TData) => void | Promise<void>;
  /** Callback called on failed submission */
  onError?: (error: TError) => void | Promise<void>;
  /** Success message duration in milliseconds (default: 3000) */
  successDuration?: number;
}

export interface UseFormSubmissionReturn<TData = unknown, TError = Error> {
  /** Whether the form is currently submitting */
  isLoading: boolean;
  /** Whether the form submission was successful */
  isSuccess: boolean;
  /** Error from the last submission */
  error: string | null;
  /** Submit handler wrapper */
  handleSubmit: (submitFn: () => Promise<TData>) => Promise<void>;
  /** Reset the form state */
  reset: () => void;
  /** Set loading state manually */
  setIsLoading: (loading: boolean) => void;
}

export function useFormSubmission<TData = unknown, TError = Error>(
  options: UseFormSubmissionOptions<TData, TError> = {},
): UseFormSubmissionReturn<TData, TError> {
  const { onSuccess, onError, successDuration = 3000 } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsSuccess(false);
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (submitFn: () => Promise<TData>) => {
      setIsSuccess(false);
      setError(null);
      setIsLoading(true);

      try {
        const result = await submitFn();
        setIsSuccess(true);

        // Auto-hide success message after duration
        if (successDuration > 0) {
          setTimeout(() => setIsSuccess(false), successDuration);
        }

        await onSuccess?.(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        await onError?.(err as TError);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError, successDuration],
  );

  return {
    isLoading,
    isSuccess,
    error,
    handleSubmit,
    reset,
    setIsLoading,
  };
}

/**
 * Extract loading state from refine mutation objects
 * Handles both isLoading (older) and isPending (newer) properties
 */
export function getMutationLoadingState(mutation: unknown): boolean {
  return (
    (mutation as { isLoading?: boolean } | undefined)?.isLoading ??
    (mutation as { isPending?: boolean } | undefined)?.isPending ??
    false
  );
}
