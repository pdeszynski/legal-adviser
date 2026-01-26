'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@legal/ui';
import { Input } from '@legal/ui';
import { Label } from '@legal/ui';
import { Textarea } from '@legal/ui';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Mail,
  Building,
  FileText,
} from 'lucide-react';
import { useDataProvider } from '@refinedev/core';
import type { GraphQLMutationConfig } from '@/providers/data-provider';

// Environment-based configuration
const HUBSPOT_FORM_ID = process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID || '';
const HUBSPOT_PORTAL_ID = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || '';
const USE_HUBSPOT_EMBED = process.env.NEXT_PUBLIC_USE_HUBSPOT_EMBED === 'true';

// Local storage key for tracking demo requests
const DEMO_REQUEST_STORAGE_KEY = 'demo-request-submitted';

// Check if user has already submitted a demo request
function hasAlreadyRequested(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(DEMO_REQUEST_STORAGE_KEY);
    if (!stored) return false;

    const data = JSON.parse(stored);
    const submissionDate = new Date(data.submittedAt);
    const daysSinceSubmission = (Date.now() - submissionDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceSubmission < 30;
  } catch {
    return false;
  }
}

// Mark that user has submitted a demo request
function markDemoRequestSubmitted(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      DEMO_REQUEST_STORAGE_KEY,
      JSON.stringify({
        email,
        submittedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Ignore localStorage errors
  }
}

// GDPR Consent Schema
const gdprConsentSchema = z.boolean().refine(
  (val) => val === true,
  'You must agree to the privacy policy to continue',
);

// Form validation schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used for type inference
const _hubspotFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  workEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email')
    .refine((email) => {
      const disposableDomains = [
        'tempmail.com',
        'guerrillamail.com',
        'mailinator.com',
        '10minutemail.com',
        'throwaway.email',
        'fakeinbox.com',
      ];
      const domain = email.split('@')[1]?.toLowerCase();
      return !domain || !disposableDomains.includes(domain);
    }, 'Please use your work email instead of a temporary email'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  useCase: z
    .string()
    .min(10, 'Please describe your use case (at least 10 characters)'),
  gdprConsent: gdprConsentSchema,
});

type HubSpotEmbedForm = z.infer<typeof _hubspotFormSchema>;

interface DemoRequestResponse {
  submitDemoRequest: {
    success: boolean;
    message: string;
    referenceId?: string;
    qualified?: boolean;
  };
}

interface HubSpotEmbedFormProps {
  source?: 'demo' | 'waitlist';
  className?: string;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error' | 'alreadySubmitted';

// Form values to backend enum mapping
const mapTimeline = (value: string): string => {
  const mapping: Record<string, string> = {
    immediate: 'ASAP',
    '1-3_months': 'WITHIN_MONTH',
    '3-6_months': 'WITHIN_QUARTER',
    exploring: 'EXPLORING',
  };
  return mapping[value] || value.toUpperCase();
};

/**
 * HubSpot Embedded Form Component
 *
 * Provides a simplified form interface that:
 * - Can use HubSpot's embedded form script (when configured)
 * - Falls back to GraphQL mutation that syncs to HubSpot backend
 * - Includes GDPR consent checkbox
 * - Tracks form submissions for analytics
 *
 * Configuration via environment variables:
 * - NEXT_PUBLIC_HUBSPOT_FORM_ID: HubSpot form ID for embed script
 * - NEXT_PUBLIC_HUBSPOT_PORTAL_ID: HubSpot portal ID
 * - NEXT_PUBLIC_USE_HUBSPOT_EMBED: Set to 'true' to use HubSpot embed script
 */
export function HubSpotEmbedForm({
  source = 'demo',
  className = '',
}: HubSpotEmbedFormProps) {
  const [formState, setFormState] = useState<FormState>(() => {
    return hasAlreadyRequested() ? 'alreadySubmitted' : 'idle';
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    referenceId?: string;
    email: string;
    qualified?: boolean;
  } | null>(null);

  const dataProvider = useDataProvider();
  const scriptLoadedRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HubSpotEmbedForm>({
    mode: 'onChange',
    defaultValues: {
      gdprConsent: false,
    },
  });

  // Track analytics event
  const trackFormSubmission = useCallback((data: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: unknown }).gtag) {
      const gtagWindow = window as unknown as {
        gtag?: (event: string, name: string, params: Record<string, unknown>) => void;
      };
      gtagWindow.gtag?.('event', 'demo_request_submitted', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  // Load HubSpot embed script if configured
  useEffect(() => {
    if (USE_HUBSPOT_EMBED && HUBSPOT_FORM_ID && HUBSPOT_PORTAL_ID && !scriptLoadedRef.current) {
      const script = document.createElement('script');
      script.src = 'https://js.hsforms.net/forms/v2.js';
      script.async = true;
      script.onload = () => {
        if (typeof window !== 'undefined' && (window as unknown).hbspt) {
          const hbspt = (window as unknown as { hbspt: { forms: { create: (config: unknown) => void } } }).hbspt;
          hbspt.forms.create({
            portalId: HUBSPOT_PORTAL_ID,
            formId: HUBSPOT_FORM_ID,
            target: `#hubspot-form-${HUBSPOT_FORM_ID}`,
            onFormSubmit: () => {
              setFormState('success');
              trackFormSubmission({ method: 'hubspot_embed', source });
            },
            onFormFailed: () => {
              setFormState('error');
              setErrorMessage('HubSpot form submission failed. Please try again.');
            },
          });
        }
      };
      document.body.appendChild(script);
      scriptLoadedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const onSubmit = async (data: HubSpotEmbedForm) => {
    setFormState('submitting');
    setErrorMessage(null);

    try {
      const dp = dataProvider?.();
      if (!dp) {
        throw new Error('Data provider not available');
      }

      // Prepare mutation input
      const mutationInput = {
        fullName: data.fullName,
        email: data.workEmail,
        company: data.company,
        companySize: 'SMALL_11_50', // Default, can be enhanced
        industry: 'OTHER',
        useCase: data.useCase,
        timeline: mapTimeline('exploring'),
        gdprConsent: data.gdprConsent,
      };

      const mutationConfig: GraphQLMutationConfig<typeof mutationInput> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'SubmitDemoRequest',
            fields: ['success', 'message', 'referenceId', 'qualified'],
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
      ).custom<DemoRequestResponse>(mutationConfig);

      if (result?.submitDemoRequest?.success) {
        markDemoRequestSubmitted(data.workEmail);
        trackFormSubmission({
          method: 'graphql_fallback',
          source,
          email: data.workEmail,
        });

        setSuccessData({
          referenceId: result.submitDemoRequest.referenceId,
          email: data.workEmail,
          qualified: result.submitDemoRequest.qualified,
        });

        setFormState('success');
      } else {
        throw new Error(result?.submitDemoRequest?.message || 'Failed to submit demo request');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

      if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        setErrorMessage('You have submitted too many requests. Please try again later.');
      } else if (errorMessage.includes('HubSpot') || errorMessage.includes('CRM')) {
        setErrorMessage(
          'Your request was received but there was an issue syncing with our CRM. Our team will contact you manually.',
        );
      } else {
        setErrorMessage(`Failed to submit demo request: ${errorMessage}`);
      }

      setFormState('error');

      // eslint-disable-next-line no-console -- Log errors for debugging
      console.error('HubSpot form submission error:', err);
    }
  };

  // Already submitted state
  if (formState === 'alreadySubmitted') {
    return (
      <div className={`bg-card border rounded-lg p-8 text-center ${className}`}>
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-blue-600" />
        </div>

        <h3 className="text-lg font-semibold mb-2">Request Already Submitted</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Thank you for your interest! Our team has already received your demo request and will be
          in touch soon. You can submit another request in 30 days.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
          <p className="font-medium">What you can do now:</p>
          <ul className="space-y-1 text-muted-foreground text-sm">
            <li>• Check your email for a calendar invite</li>
            <li>• Review our documentation for more information</li>
            <li>• Contact us directly at support@example.com</li>
          </ul>
        </div>
      </div>
    );
  }

  // Success state
  if (formState === 'success' && successData) {
    return (
      <div className={`bg-card border rounded-lg p-8 text-center ${className}`}>
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>

        <h3 className="text-lg font-semibold mb-2">Request Submitted Successfully!</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Thank you for your interest. We&apos;ll be in touch shortly at {successData.email}.
        </p>

        {successData.referenceId && (
          <p className="text-xs text-muted-foreground mb-4">
            Reference ID: <span className="font-mono">{successData.referenceId}</span>
          </p>
        )}

        {successData.qualified && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm mb-4">
            <p className="font-medium text-blue-700 dark:text-blue-400">
              Your request has been prioritized!
            </p>
            <p className="text-blue-600/70 dark:text-blue-400/70 mt-1">
              We&apos;ll expedite our response based on your requirements.
            </p>
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
          <p className="font-medium">What happens next:</p>
          <ul className="space-y-1 text-muted-foreground text-sm">
            <li>• You&apos;ll receive a calendar invite within 24 hours</li>
            <li>• We&apos;ll send a pre-demo questionnaire to tailor the session</li>
            <li>• The demo will include a Q&A session with our legal experts</li>
          </ul>
        </div>
      </div>
    );
  }

  // HubSpot embed container (when configured)
  if (USE_HUBSPOT_EMBED && HUBSPOT_FORM_ID && HUBSPOT_PORTAL_ID) {
    return (
      <div className={`bg-card border rounded-lg p-6 ${className}`}>
        <div id={`hubspot-form-${HUBSPOT_FORM_ID}`} />
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Powered by HubSpot
        </div>
      </div>
    );
  }

  // Default form with GraphQL fallback
  return (
    <div className={`bg-card border rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">
          {source === 'waitlist' ? 'Join the Waitlist' : 'Request a Demo'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {source === 'waitlist'
            ? 'Be among the first to experience the future of legal AI.'
            : 'Fill out the form below and our team will contact you shortly.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Full Name *
          </Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            {...register('fullName', {
              required: 'Full name is required',
              minLength: { value: 2, message: 'Full name must be at least 2 characters' },
            })}
            className={errors.fullName ? 'border-destructive' : ''}
            disabled={formState === 'submitting'}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="workEmail">Work Email *</Label>
          <Input
            id="workEmail"
            type="email"
            placeholder="john@company.com"
            {...register('workEmail', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email',
              },
            })}
            className={errors.workEmail ? 'border-destructive' : ''}
            disabled={formState === 'submitting'}
          />
          {errors.workEmail && (
            <p className="text-sm text-destructive">{errors.workEmail.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Please use your work email. Temporary emails are not accepted.
          </p>
        </div>

        {/* Company Field */}
        <div className="space-y-2">
          <Label htmlFor="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company Name *
          </Label>
          <Input
            id="company"
            placeholder="Acme Legal LLP"
            {...register('company', {
              required: 'Company name is required',
              minLength: { value: 2, message: 'Company name must be at least 2 characters' },
            })}
            className={errors.company ? 'border-destructive' : ''}
            disabled={formState === 'submitting'}
          />
          {errors.company && (
            <p className="text-sm text-destructive">{errors.company.message}</p>
          )}
        </div>

        {/* Use Case Field */}
        <div className="space-y-2">
          <Label htmlFor="useCase" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            What problems do you want to solve? *
          </Label>
          <Textarea
            id="useCase"
            placeholder="E.g., Contract review automation, legal research acceleration, document drafting assistance..."
            rows={4}
            {...register('useCase', {
              required: 'Please describe your use case',
              minLength: {
                value: 10,
                message: 'Please describe your use case (at least 10 characters)',
              },
            })}
            className={errors.useCase ? 'border-destructive' : ''}
            disabled={formState === 'submitting'}
          />
          {errors.useCase && (
            <p className="text-sm text-destructive">{errors.useCase.message}</p>
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
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <div className="flex-1">
              <Label htmlFor="gdprConsent" className="text-sm font-normal cursor-pointer">
                I agree to the processing of my personal data in accordance with the{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </a>
                . I understand that my data will be used to process my demo request and may be
                stored in HubSpot CRM for follow-up communications. *
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
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={formState === 'submitting'}
          className="w-full"
          size="lg"
        >
          {formState === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : source === 'waitlist' ? (
            'Join Waitlist'
          ) : (
            'Request Demo'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By submitting this form, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </div>
  );
}

// Export a function to clear the demo request record (for testing)
export function clearHubSpotFormRecord(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DEMO_REQUEST_STORAGE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}
