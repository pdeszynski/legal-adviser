'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@legal/ui';
import { Input } from '@legal/ui';
import { Label } from '@legal/ui';
import { Textarea } from '@legal/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@legal/ui';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Mail,
  Building,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import { useDataProvider } from '@refinedev/core';
import { useAnalytics } from '@/hooks/use-analytics';
import type { GraphQLMutationConfig } from '@/providers/data-provider';

// Local storage key for tracking interest requests
const INTEREST_REQUEST_STORAGE_KEY = 'interest-request-submitted';

// Check if user has already submitted an interest request
function hasAlreadyRequested(email?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(INTEREST_REQUEST_STORAGE_KEY);
    if (!stored) return false;

    const data = JSON.parse(stored);
    const submissionDate = new Date(data.submittedAt);
    const daysSinceSubmission = (Date.now() - submissionDate.getTime()) / (1000 * 60 * 60 * 24);

    // If email provided, check if it matches
    if (email && data.email !== email) {
      return false;
    }

    return daysSinceSubmission < 30;
  } catch {
    return false;
  }
}

// Mark that user has submitted an interest request
function markInterestRequestSubmitted(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      INTEREST_REQUEST_STORAGE_KEY,
      JSON.stringify({
        email,
        submittedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Ignore localStorage errors
  }
}

// Form type definition
export interface InterestFormInput {
  fullName: string;
  email: string;
  company?: string;
  role?: string;
  useCase?: string;
  leadSource?: string;
  gdprConsent: boolean;
}

interface InterestRequestResponse {
  submitInterestRequest: {
    success: boolean;
    message: string;
    referenceId?: string;
  };
}

interface InterestFormProps {
  source?: string;
  className?: string;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error' | 'alreadySubmitted';

// Lead source options matching requirements
const leadSourceOptions = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'search', label: 'Search' },
  { value: 'friend_colleague', label: 'Friend/Colleague' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

/**
 * Interest Registration Form Component
 *
 * Features:
 * - Standalone form with GraphQL mutation to submitInterestRequest
 * - Form fields: full name, email, company, role, use case, lead source
 * - GDPR consent checkbox required
 * - Validation matching backend DTO
 * - HubSpot sync via backend GraphQL mutation
 * - Analytics tracking: form_view, form_submit_start, form_submit_success, form_submit_error
 * - localStorage 'already requested' state
 * - Loading state with disabled submit button
 * - User-friendly error messages with retry option
 */
export function InterestForm({ source = 'early-access', className = '' }: InterestFormProps) {
  const analytics = useAnalytics();
  const [formState, setFormState] = useState<FormState>(() => {
    return hasAlreadyRequested() ? 'alreadySubmitted' : 'idle';
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    referenceId?: string;
    email: string;
  } | null>(null);

  const dataProvider = useDataProvider();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<InterestFormInput>({
    mode: 'onChange',
    defaultValues: {
      gdprConsent: false,
    },
  });

  const watchedFields = watch();

  // Track form view on mount
  useEffect(() => {
    analytics.trackInterestFormView();
  }, [analytics]);

  // Track field focus for analytics
  const handleFieldFocus = useCallback(
    (fieldName: string) => {
      analytics.trackInterestFieldFocus(fieldName);
    },
    [analytics],
  );

  // Manual validation matching backend DTO
  const validateForm = useCallback((data: InterestFormInput): string | null => {
    // Full name validation: 2-255 characters
    if (!data.fullName || data.fullName.trim().length < 2) {
      return 'Full name must be at least 2 characters';
    }
    if (data.fullName.trim().length > 255) {
      return 'Full name must be at most 255 characters';
    }

    // Email validation
    if (!data.email || data.email.trim().length === 0) {
      return 'Email is required';
    }
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(data.email)) {
      return 'Please enter a valid email';
    }
    if (data.email.length > 255) {
      return 'Email must be at most 255 characters';
    }

    // Company validation: max 255 characters (optional)
    if (data.company && data.company.length > 255) {
      return 'Company name must be at most 255 characters';
    }

    // Role validation: max 255 characters (optional)
    if (data.role && data.role.length > 255) {
      return 'Role must be at most 255 characters';
    }

    // Use case validation: 10-2000 characters (optional)
    if (data.useCase && data.useCase.length < 10) {
      return 'Use case must be at least 10 characters';
    }
    if (data.useCase && data.useCase.length > 2000) {
      return 'Use case must be at most 2000 characters';
    }

    // Lead source validation: max 255 characters (optional)
    if (data.leadSource && data.leadSource.length > 255) {
      return 'Lead source must be at most 255 characters';
    }

    // GDPR consent validation
    if (!data.gdprConsent) {
      return 'You must agree to the privacy policy to continue';
    }

    return null;
  }, []);

  const onSubmit = async (data: InterestFormInput) => {
    // Validate form
    const validationError = validateForm(data);
    if (validationError) {
      setErrorMessage(validationError);
      setFormState('error');
      analytics.trackInterestValidationError('form', 'validation_error');
      return;
    }

    setFormState('submitting');
    setErrorMessage(null);

    // Track submission start
    analytics.trackInterestSubmitStart({
      hasCompany: !!data.company,
      hasRole: !!data.role,
      source: data.leadSource,
    });

    try {
      const dp = dataProvider?.();
      if (!dp) {
        throw new Error('Data provider not available');
      }

      // Prepare mutation input matching backend DTO
      const mutationInput = {
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        company: data.company?.trim() || undefined,
        role: data.role?.trim() || undefined,
        useCase: data.useCase?.trim() || undefined,
        leadSource: data.leadSource?.trim() || undefined,
        consent: data.gdprConsent,
      };

      const mutationConfig: GraphQLMutationConfig<typeof mutationInput> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'SubmitInterestRequest',
            fields: ['success', 'message', 'referenceId'],
            variables: {
              input: mutationInput,
            },
          },
        },
      };

      const result = await (
        dp as unknown as {
          custom: <T>(config: GraphQLMutationConfig<unknown>) => Promise<T>;
        }
      ).custom<InterestRequestResponse>(mutationConfig);

      if (result?.submitInterestRequest?.success) {
        markInterestRequestSubmitted(data.email);

        // Track success
        analytics.trackInterestSubmitSuccess({
          email: data.email,
          company: data.company,
          companyProvided: !!data.company,
          roleProvided: !!data.role,
          source: data.leadSource,
          referenceId: result.submitInterestRequest.referenceId,
        });

        setSuccessData({
          referenceId: result.submitInterestRequest.referenceId,
          email: data.email,
        });

        setFormState('success');
      } else {
        throw new Error(result?.submitInterestRequest?.message || 'Failed to submit request');
      }
    } catch (err) {
      const errorDetails = err instanceof Error ? err.message : 'An unexpected error occurred';

      // Determine error type for analytics
      let errorType = 'unknown_error';
      if (errorDetails.includes('rate limit') || errorDetails.includes('too many requests')) {
        errorType = 'rate_limit_error';
        setErrorMessage('You have submitted too many requests. Please try again later.');
      } else if (errorDetails.includes('HubSpot') || errorDetails.includes('CRM')) {
        errorType = 'crm_sync_error';
        setErrorMessage(
          'Your request was received but there was an issue syncing with our CRM. Our team will contact you manually.',
        );
      } else if (errorDetails.includes('validation') || errorDetails.includes('invalid')) {
        errorType = 'validation_error';
        setErrorMessage(`Validation error: ${errorDetails}`);
      } else if (errorDetails.includes('network') || errorDetails.includes('fetch')) {
        errorType = 'network_error';
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setErrorMessage(`Failed to submit request: ${errorDetails}`);
      }

      // Track failure
      analytics.trackInterestSubmitFailure(errorType, errorDetails);

      setFormState('error');

      // eslint-disable-next-line no-console -- Log errors for debugging
      console.error('Interest form submission error:', err);
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setFormState('idle');
  };

  // Already submitted state
  if (formState === 'alreadySubmitted') {
    return (
      <div className={`bg-card border rounded-lg p-6 sm:p-8 text-center ${className}`}>
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold mb-2">Request Already Submitted</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Thank you for your interest! We&apos;ve already received your request and will be in touch
          soon. You can submit another request in 30 days.
        </p>

        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 text-sm text-left space-y-2">
          <p className="font-medium text-sm">What you can do now:</p>
          <ul className="space-y-1 text-muted-foreground text-xs sm:text-sm">
            <li>• Check your email for a confirmation message</li>
            <li>• Follow us on social media for updates</li>
            <li>• Contact us directly at support@example.com</li>
          </ul>
        </div>
      </div>
    );
  }

  // Success state
  if (formState === 'success' && successData) {
    return (
      <div className={`bg-card border rounded-lg p-6 sm:p-8 text-center ${className}`}>
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold mb-2">Thank You for Your Interest!</h3>
        <p className="text-muted-foreground text-sm mb-4">
          We&apos;ll be in touch soon at {successData.email}.
        </p>

        {successData.referenceId && (
          <p className="text-xs text-muted-foreground mb-4 break-all">
            Reference ID: <span className="font-mono">{successData.referenceId}</span>
          </p>
        )}

        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 text-sm text-left space-y-2">
          <p className="font-medium text-sm">What happens next:</p>
          <ul className="space-y-1 text-muted-foreground text-xs sm:text-sm">
            <li>• We&apos;ll review your information and get back to you shortly</li>
            <li>• You may receive an email with additional information</li>
            <li>• We&apos;ll keep you updated on our early access program</li>
          </ul>
        </div>
      </div>
    );
  }

  // Default form state
  return (
    <div className={`bg-card border rounded-lg p-4 sm:p-6 ${className}`}>
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Request Early Access</h3>
        <p className="text-sm text-muted-foreground">
          Join our early access program and be among the first to experience the platform.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name Field */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            Full Name *
          </Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            autoComplete="name"
            inputMode="text"
            {...register('fullName', {
              required: 'Full name is required',
              minLength: { value: 2, message: 'Full name must be at least 2 characters' },
            })}
            onFocus={() => handleFieldFocus('fullName')}
            className={`h-11 sm:h-10 text-base sm:text-sm ${errors.fullName ? 'border-destructive' : ''}`}
            disabled={formState === 'submitting'}
          />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@company.com"
            autoComplete="email"
            inputMode="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email',
              },
            })}
            onFocus={() => handleFieldFocus('email')}
            className={`h-11 sm:h-10 text-base sm:text-sm ${errors.email ? 'border-destructive' : ''}`}
            disabled={formState === 'submitting'}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        {/* Company Field (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company (Optional)
          </Label>
          <Input
            id="company"
            placeholder="Acme Legal LLP"
            autoComplete="organization"
            inputMode="text"
            {...register('company')}
            onFocus={() => handleFieldFocus('company')}
            className={`h-11 sm:h-10 text-base sm:text-sm ${errors.company ? 'border-destructive' : ''}`}
            disabled={formState === 'submitting'}
          />
          {errors.company && <p className="text-sm text-destructive">{errors.company.message}</p>}
        </div>

        {/* Role Field (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="role" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Role/Title (Optional)
          </Label>
          <Input
            id="role"
            placeholder="Lawyer, Partner, Legal Tech Specialist..."
            autoComplete="organization-title"
            inputMode="text"
            {...register('role')}
            onFocus={() => handleFieldFocus('role')}
            className={`h-11 sm:h-10 text-base sm:text-sm ${errors.role ? 'border-destructive' : ''}`}
            disabled={formState === 'submitting'}
          />
          {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
        </div>

        {/* Use Case Field (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="useCase" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Use Case/Interest (Optional)
          </Label>
          <Textarea
            id="useCase"
            placeholder="Tell us what you're looking for or what problems you want to solve..."
            rows={4}
            {...register('useCase')}
            onFocus={() => handleFieldFocus('useCase')}
            className={`text-base sm:text-sm resize-none ${errors.useCase ? 'border-destructive' : ''}`}
            disabled={formState === 'submitting'}
          />
          {errors.useCase && <p className="text-sm text-destructive">{errors.useCase.message}</p>}
          <p className="text-xs text-muted-foreground">Minimum 10 characters if provided</p>
        </div>

        {/* Lead Source Dropdown (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="leadSource">How did you hear about us? (Optional)</Label>
          <Select
            value={watchedFields.leadSource}
            onValueChange={(value) => setValue('leadSource', value)}
          >
            <SelectTrigger
              className={`h-11 sm:h-10 text-base sm:text-sm ${errors.leadSource ? 'border-destructive' : ''}`}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {leadSourceOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-base sm:text-sm"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.leadSource && (
            <p className="text-sm text-destructive">{errors.leadSource.message}</p>
          )}
        </div>

        {/* GDPR Consent */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <input
              id="gdprConsent"
              type="checkbox"
              {...register('gdprConsent', {
                required: 'You must agree to the privacy policy to continue',
              })}
              disabled={formState === 'submitting'}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600 focus:ring-2"
              style={{ minWidth: '20px' }}
            />
            <div className="flex-1">
              <Label
                htmlFor="gdprConsent"
                className="text-sm font-normal cursor-pointer leading-relaxed"
              >
                I agree to the processing of my personal data in accordance with the{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </a>
                . I understand that my data will be sent to HubSpot CRM for follow-up
                communications. *
              </Label>
              {errors.gdprConsent && (
                <p className="text-sm text-destructive mt-1">{errors.gdprConsent.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={handleRetry}
                className="ml-2 underline hover:no-underline"
                disabled={formState === 'submitting'}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={formState === 'submitting'}
          className="w-full min-h-[48px] active:scale-[0.98]"
          size="lg"
        >
          {formState === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Request Early Access'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By submitting this form, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </div>
  );
}

// Export a function to clear the interest request record (for testing)
export function clearInterestFormRecord(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(INTEREST_REQUEST_STORAGE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

// Export a function to check if already submitted (for testing)
export function checkAlreadyRequested(email?: string): boolean {
  return hasAlreadyRequested(email);
}
