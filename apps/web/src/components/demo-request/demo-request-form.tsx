/* eslint-disable max-lines -- Multi-step form component with multiple states and validations */
'use client';

import { useState, useCallback, useEffect, memo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@legal/ui';
import { Button } from '@legal/ui';
import { Input } from '@legal/ui';
import { Label } from '@legal/ui';
import { Textarea } from '@legal/ui';
import { Progress } from '@legal/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@legal/ui';
import {
  User,
  Building,
  MessageSquare,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useDataProvider } from '@refinedev/core';
import { useAnalytics } from '@/hooks/use-analytics';
import type { GraphQLMutationConfig } from '@/providers/data-provider';

// Local storage key for tracking last shown timestamp (for analytics/cooldown, not for blocking)
const DEMO_REQUEST_LAST_SHOWN_KEY = 'demo-request-last-shown';

// Get the last time the demo form was shown (for analytics purposes)
function getLastShownTime(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem(DEMO_REQUEST_LAST_SHOWN_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

// Record when the form was shown (for analytics)
function recordFormShown(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_REQUEST_LAST_SHOWN_KEY, Date.now().toString());
  } catch {
    // Ignore localStorage errors
  }
}

// Note: We no longer use localStorage to block the form from showing.
// Submission cooldown is enforced on the backend to prevent spam.
// This allows users to open and view the form multiple times.

// Step 1: Contact Information Schema with enhanced email validation
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used for type inference
const _contactStepSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  workEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email')
    .refine((email) => {
      // Block common disposable email domains
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
  phone: z.string().optional(),
});

// Step 2: Company Information Schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used for type inference
const _companyStepSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companySize: z.string().min(1, 'Please select company size'),
  industry: z.string().min(1, 'Please select your industry'),
});

// Step 3: Use Case Schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used for type inference
const _useCaseStepSchema = z.object({
  legalProblems: z
    .string()
    .min(10, 'Please describe the problems you want to solve (at least 10 characters)'),
  currentChallenges: z
    .string()
    .min(10, 'Please describe your current challenges (at least 10 characters)'),
});

// Step 4: Timeline Schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used for type inference
const _timelineStepSchema = z.object({
  implementationTimeline: z.string().min(1, 'Please select your timeline'),
  budgetRange: z.string().min(1, 'Please select your budget range'),
});

// Step 5: Demo Time Schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used for type inference
const _demoTimeStepSchema = z.object({
  preferredDate: z.string().min(1, 'Please select a preferred date'),
  preferredTimeSlot: z.string().min(1, 'Please select a time slot'),
  additionalNotes: z.string().optional(),
});

// GDPR Consent Schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used for type inference
const _gdprConsentSchema = z.boolean().refine(
  (val) => val === true,
  'You must agree to the privacy policy and data processing consent to continue',
);

// Form type combining all step schemas
type DemoRequestForm = z.infer<typeof _contactStepSchema> &
  z.infer<typeof _companyStepSchema> &
  z.infer<typeof _useCaseStepSchema> &
  z.infer<typeof _timelineStepSchema> &
  z.infer<typeof _demoTimeStepSchema> & { gdprConsent: boolean };

type FormStep = 'contact' | 'company' | 'useCase' | 'timeline' | 'demoTime' | 'success';

const steps: FormStep[] = ['contact', 'company', 'useCase', 'timeline', 'demoTime'];
const totalSteps = steps.length;

const stepInfo = {
  contact: {
    title: 'Contact Information',
    description: 'Let us know how to reach you',
    icon: User,
  },
  company: {
    title: 'Company Information',
    description: 'Tell us about your organization',
    icon: Building,
  },
  useCase: {
    title: 'Use Case',
    description: 'What legal problems do you want to solve?',
    icon: MessageSquare,
  },
  timeline: {
    title: 'Timeline & Budget',
    description: 'When are you looking to implement?',
    icon: Clock,
  },
  demoTime: {
    title: 'Schedule Demo',
    description: 'Pick a time that works for you',
    icon: Calendar,
  },
  success: {
    title: 'Success',
    description: 'Your demo request has been submitted',
    icon: CheckCircle2,
  },
} as const;

// Form values to backend enum mapping
const mapCompanySize = (value: string): string => {
  const mapping: Record<string, string> = {
    '1': 'SOLO',
    '1-10': 'SMALL_2_10',
    '11-50': 'SMALL_11_50',
    '51-200': 'MEDIUM_51_200',
    '201-500': 'LARGE_201_500',
    '501-1000': 'ENTERPRISE_500_PLUS',
    '1000+': 'ENTERPRISE_500_PLUS',
  };
  return mapping[value] || value;
};

const mapIndustry = (value: string): string => {
  const mapping: Record<string, string> = {
    law_firm: 'LAW_FIRM',
    corporate_legal: 'LEGAL_DEPARTMENT',
    corporate_legal_department: 'LEGAL_DEPARTMENT',
    government: 'GOVERNMENT',
    legal_tech: 'TECHNOLOGY',
    consulting: 'CONSULTING',
  };
  return mapping[value] || value.toUpperCase();
};

const mapTimeline = (value: string): string => {
  const mapping: Record<string, string> = {
    immediate: 'ASAP',
    '1-3_months': 'WITHIN_MONTH',
    '3-6_months': 'WITHIN_QUARTER',
    '6-12_months': 'WITHIN_QUARTER',
    exploring: 'EXPLORING',
  };
  return mapping[value] || value.toUpperCase();
};

const mapBudget = (value: string): string => {
  const mapping: Record<string, string> = {
    under_5k: 'UNDER_5K',
    '5k-15k': 'RANGE_5K_10K',
    '15k-50k': 'RANGE_25K_50K',
    '50k-100k': 'RANGE_50K_100K',
    over_100k: 'OVER_100K',
    to_be_determined: 'NOT_SPECIFIED',
  };
  return mapping[value] || value.toUpperCase();
};

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const industries = [
  { value: 'law_firm', label: 'Law Firm' },
  { value: 'corporate_legal', label: 'Corporate Legal Department' },
  { value: 'government', label: 'Government' },
  { value: 'legal_tech', label: 'Legal Tech' },
  { value: 'consulting', label: 'Legal Consulting' },
  { value: 'other', label: 'Other' },
];

const timelines = [
  { value: 'immediate', label: 'Immediately' },
  { value: '1-3_months', label: '1-3 months' },
  { value: '3-6_months', label: '3-6 months' },
  { value: '6-12_months', label: '6-12 months' },
  { value: 'exploring', label: 'Just exploring options' },
];

const budgetRanges = [
  { value: 'under_5k', label: 'Under $5,000' },
  { value: '5k-15k', label: '$5,000 - $15,000' },
  { value: '15k-50k', label: '$15,000 - $50,000' },
  { value: '50k-100k', label: '$50,000 - $100,000' },
  { value: 'over_100k', label: 'Over $100,000' },
  { value: 'to_be_determined', label: 'To be determined' },
];

const timeSlots = [
  { value: 'morning', label: 'Morning (9AM - 12PM)' },
  { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
  { value: 'evening', label: 'Evening (5PM - 7PM)' },
];

interface DemoRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DemoRequestResponse {
  submitDemoRequest: {
    success: boolean;
    message: string;
    referenceId?: string;
    qualified?: boolean;
  };
}

export function DemoRequestForm({ isOpen, onClose }: DemoRequestFormProps) {
  const analytics = useAnalytics();
  const [currentStep, setCurrentStep] = useState<FormStep>('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    referenceId?: string;
    email: string;
    qualified?: boolean;
  } | null>(null);

  const dataProvider = useDataProvider();

  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
    reset,
  } = useForm<DemoRequestForm>({
    mode: 'onChange',
    defaultValues: {
      gdprConsent: false,
    },
  });

  const watchedFields = watch();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Record when form was shown for analytics
      recordFormShown();
      setCurrentStep('contact');
      setSubmitError(null);
      setSuccessData(null);
      reset();
    }
  }, [isOpen, reset]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    let fieldsToValidate: (keyof DemoRequestForm)[] = [];

    switch (currentStep) {
      case 'contact':
        fieldsToValidate = ['fullName', 'workEmail'];
        break;
      case 'company':
        fieldsToValidate = ['companyName', 'companySize', 'industry'];
        break;
      case 'useCase':
        fieldsToValidate = ['legalProblems', 'currentChallenges'];
        break;
      case 'timeline':
        fieldsToValidate = ['implementationTimeline', 'budgetRange'];
        break;
      case 'demoTime':
        fieldsToValidate = ['preferredDate', 'preferredTimeSlot', 'gdprConsent'];
        break;
    }

    // Trigger validation for current step fields
    const result = await trigger(fieldsToValidate);
    return result;
  }, [currentStep, trigger]);

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
      setSubmitError(null);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
      setSubmitError(null);
    }
  };

  const onSubmit = async (data: DemoRequestForm) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const dp = dataProvider?.();
      if (!dp) {
        throw new Error('Data provider not available');
      }

      // Combine legal problems and current challenges into use case
      const useCaseText = `Problems to solve: ${data.legalProblems}\n\nCurrent challenges: ${data.currentChallenges}`;

      // Map form values to backend enum values
      const mutationInput = {
        fullName: data.fullName,
        email: data.workEmail,
        company: data.companyName,
        companySize: mapCompanySize(data.companySize),
        industry: mapIndustry(data.industry),
        useCase: useCaseText,
        timeline: mapTimeline(data.implementationTimeline),
        budget: mapBudget(data.budgetRange),
        preferredDemoTime: data.preferredTimeSlot.toUpperCase(),
      };

      // Filter out undefined values
      const filteredInput = Object.fromEntries(
        Object.entries(mutationInput).filter(([, v]) => v !== undefined && v !== ''),
      );

      const mutationConfig: GraphQLMutationConfig<typeof filteredInput> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'SubmitDemoRequest',
            fields: ['success', 'message', 'referenceId', 'qualified'],
            variables: {
              input: filteredInput,
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
        // Track analytics with the useAnalytics hook
        analytics.trackDemoSubmit({
          email: data.workEmail,
          companySize: data.companySize,
          industry: data.industry,
          timeline: data.implementationTimeline,
        });

        // Set success data
        setSuccessData({
          referenceId: result.submitDemoRequest.referenceId,
          email: data.workEmail,
          qualified: result.submitDemoRequest.qualified,
        });

        setCurrentStep('success');
      } else {
        throw new Error(result?.submitDemoRequest?.message || 'Failed to submit demo request');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

      // Check for specific error types
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        setSubmitError('You have submitted too many requests. Please try again later.');
      } else if (errorMessage.includes('HubSpot') || errorMessage.includes('CRM')) {
        setSubmitError(
          'Your request was received but there was an issue syncing with our CRM. Our team will contact you manually.',
        );
      } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        setSubmitError(`Validation error: ${errorMessage}`);
      } else {
        setSubmitError(`Failed to submit demo request: ${errorMessage}`);
      }

      // eslint-disable-next-line no-console -- Log errors for debugging
      console.error('Demo request submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Close the dialog and reset form state
    setCurrentStep('contact');
    setSubmitError(null);
    setSuccessData(null);
    reset();
    onClose();
  };

  // Handle Radix UI's onOpenChange callback
  // This is called when the user clicks outside, presses ESC, etc.
  const handleDialogOpenChange = (open: boolean) => {
    // Only close if Radix UI is requesting to close (open === false)
    // and the dialog is currently open
    if (open === false && isOpen) {
      handleClose();
    }
  };

  const StepIcon = stepInfo[currentStep].icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {currentStep === 'success' && successData && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Demo Request Submitted!
              </DialogTitle>
              <DialogDescription>
                Thank you for your interest. We&apos;ll be in touch shortly.
              </DialogDescription>
            </DialogHeader>

            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">We&apos;ve received your request</h3>
                <p className="text-muted-foreground">
                  A member of our team will reach out to you at {successData.email} to confirm your
                  demo slot.
                </p>
                {successData.referenceId && (
                  <p className="text-sm text-muted-foreground">
                    Reference ID: <span className="font-mono">{successData.referenceId}</span>
                  </p>
                )}
              </div>

              {successData.qualified && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
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
                <ul className="space-y-1 text-muted-foreground">
                  <li>• You&apos;ll receive a calendar invite within 24 hours</li>
                  <li>• We&apos;ll send a pre-demo questionnaire to tailor the session</li>
                  <li>• The demo will include a Q&A session with our legal experts</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}

        {currentStep !== 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <StepIcon className="h-5 w-5 text-primary" />
                {stepInfo[currentStep].title}
              </DialogTitle>
              <DialogDescription>{stepInfo[currentStep].description}</DialogDescription>
            </DialogHeader>

            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} />
              <div className="flex justify-between">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 mx-0.5 rounded-full ${
                      index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            <form
              id="demo-request-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 py-4"
            >
              {currentStep === 'contact' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      {...register('fullName')}
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workEmail">Work Email *</Label>
                    <Input
                      id="workEmail"
                      type="email"
                      placeholder="john@company.com"
                      {...register('workEmail')}
                      className={errors.workEmail ? 'border-destructive' : ''}
                    />
                    {errors.workEmail && (
                      <p className="text-sm text-destructive">{errors.workEmail.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Please use your work email. Temporary emails are not accepted.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      {...register('phone')}
                    />
                  </div>
                </div>
              )}

              {currentStep === 'company' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Acme Legal LLP"
                      {...register('companyName')}
                      className={errors.companyName ? 'border-destructive' : ''}
                    />
                    {errors.companyName && (
                      <p className="text-sm text-destructive">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size *</Label>
                    <Select
                      value={watchedFields.companySize}
                      onValueChange={(value) => setValue('companySize', value)}
                    >
                      <SelectTrigger className={errors.companySize ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.companySize && (
                      <p className="text-sm text-destructive">{errors.companySize.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Select
                      value={watchedFields.industry}
                      onValueChange={(value) => setValue('industry', value)}
                    >
                      <SelectTrigger className={errors.industry ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.value} value={industry.value}>
                            {industry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.industry && (
                      <p className="text-sm text-destructive">{errors.industry.message}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 'useCase' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="legalProblems">
                      What legal problems do you want to solve? *
                    </Label>
                    <Textarea
                      id="legalProblems"
                      placeholder="E.g., Contract review automation, legal research acceleration, document drafting assistance..."
                      rows={4}
                      {...register('legalProblems')}
                      className={errors.legalProblems ? 'border-destructive' : ''}
                    />
                    {errors.legalProblems && (
                      <p className="text-sm text-destructive">{errors.legalProblems.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentChallenges">What are your current challenges? *</Label>
                    <Textarea
                      id="currentChallenges"
                      placeholder="E.g., Manual document review takes too long, inconsistent legal research results..."
                      rows={4}
                      {...register('currentChallenges')}
                      className={errors.currentChallenges ? 'border-destructive' : ''}
                    />
                    {errors.currentChallenges && (
                      <p className="text-sm text-destructive">{errors.currentChallenges.message}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 'timeline' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="implementationTimeline">
                      When are you looking to implement? *
                    </Label>
                    <Select
                      value={watchedFields.implementationTimeline}
                      onValueChange={(value) => setValue('implementationTimeline', value)}
                    >
                      <SelectTrigger
                        className={errors.implementationTimeline ? 'border-destructive' : ''}
                      >
                        <SelectValue placeholder="Select your timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        {timelines.map((timeline) => (
                          <SelectItem key={timeline.value} value={timeline.value}>
                            {timeline.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.implementationTimeline && (
                      <p className="text-sm text-destructive">
                        {errors.implementationTimeline.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetRange">Budget Range *</Label>
                    <Select
                      value={watchedFields.budgetRange}
                      onValueChange={(value) => setValue('budgetRange', value)}
                    >
                      <SelectTrigger className={errors.budgetRange ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select your budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((budget) => (
                          <SelectItem key={budget.value} value={budget.value}>
                            {budget.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.budgetRange && (
                      <p className="text-sm text-destructive">{errors.budgetRange.message}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 'demoTime' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date *</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...register('preferredDate')}
                      className={errors.preferredDate ? 'border-destructive' : ''}
                    />
                    {errors.preferredDate && (
                      <p className="text-sm text-destructive">{errors.preferredDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredTimeSlot">Preferred Time Slot *</Label>
                    <Select
                      value={watchedFields.preferredTimeSlot}
                      onValueChange={(value) => setValue('preferredTimeSlot', value)}
                    >
                      <SelectTrigger
                        className={errors.preferredTimeSlot ? 'border-destructive' : ''}
                      >
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.preferredTimeSlot && (
                      <p className="text-sm text-destructive">{errors.preferredTimeSlot.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="additionalNotes"
                      placeholder="Any specific topics you'd like us to cover during the demo..."
                      rows={3}
                      {...register('additionalNotes')}
                    />
                  </div>

                  {/* GDPR Consent */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-start gap-3">
                      <input
                        id="gdprConsent"
                        type="checkbox"
                        {...register('gdprConsent', {
                          required: 'You must agree to the privacy policy to continue',
                        })}
                        disabled={isSubmitting}
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
                          . I understand that my data will be used to process my demo request and may
                          be stored in HubSpot CRM for follow-up communications. *
                        </Label>
                        {errors.gdprConsent && (
                          <p className="text-sm text-destructive mt-1">{errors.gdprConsent.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </form>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {currentStepIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              )}

              {currentStepIndex < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="demo-request-form"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Demo Request'
                  )}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Memoize component to prevent unnecessary re-renders when parent state changes
// Only re-render when isOpen or onClose props change
export const MemoizedDemoRequestForm = memo(DemoRequestForm, (prevProps, nextProps) => {
  return prevProps.isOpen === nextProps.isOpen && prevProps.onClose === nextProps.onClose;
});

MemoizedDemoRequestForm.displayName = 'MemoizedDemoRequestForm';
