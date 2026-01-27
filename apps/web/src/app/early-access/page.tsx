'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  Sparkles,
  Shield,
  Gift,
  HeadphonesIcon,
  ChevronDown,
  ChevronUp,
  Mail,
  Building,
  Briefcase,
  MessageSquare,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PublicLayout } from '@components/layout/public-layout';
import { Button } from '@legal/ui';
import { useAnalytics } from '@/hooks/use-analytics';
import { useDataProvider } from '@refinedev/core';
import type { GraphQLMutationConfig } from '@/providers/data-provider';
import { InterestFormSkeleton } from '@components/interest-form';

interface InterestFormData {
  fullName: string;
  email: string;
  company: string;
  role: string;
  useCase: string;
  leadSource: string;
  consent: boolean;
}

interface InterestRequestResponse {
  submitInterestRequest: {
    success: boolean;
    message: string;
    referenceId?: string;
  };
}

interface FAQItem {
  question: string;
  answer: string;
}

const InterestPage = () => {
  const t = useTranslations('interest');
  const analytics = useAnalytics();
  const dataProvider = useDataProvider();

  // Refs for analytics tracking
  const formSectionRef = useRef<HTMLDivElement>(null);
  const pageLoadTimeRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);
  const formImpressionTrackedRef = useRef(false);
  const fieldFocusTrackedRef = useRef<Set<string>>(new Set());

  const [formData, setFormData] = useState<InterestFormData>({
    fullName: '',
    email: '',
    company: '',
    role: '',
    useCase: '',
    leadSource: '',
    consent: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InterestFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track page view on mount
  useEffect(() => {
    analytics.trackInterestPage();
  }, [analytics]);

  // Simulate initial page load with skeleton display
  // Shows skeleton immediately, then transitions to actual form
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Delay to show skeleton on initial load (800ms)
    return () => clearTimeout(timer);
  }, []);

  // Track form impression when form section becomes visible
  useEffect(() => {
    if (formImpressionTrackedRef.current || !formSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !formImpressionTrackedRef.current) {
            analytics.trackInterestFormView();
            formImpressionTrackedRef.current = true;
          }
        });
      },
      { threshold: 0.5 }, // Track when 50% of form is visible
    );

    observer.observe(formSectionRef.current);
    return () => observer.disconnect();
  }, [analytics]);

  // Track scroll depth for engagement metrics
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const scrolled = (window.scrollY / scrollHeight) * 100;
        maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, Math.min(scrolled, 100));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track engagement when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - pageLoadTimeRef.current) / 1000);
      analytics.trackInterestEngagement(timeSpent, Math.round(maxScrollDepthRef.current));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [analytics]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InterestFormData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('form.errors.nameRequired');
      analytics.trackInterestValidationError('fullName', 'required');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('form.errors.emailRequired');
      analytics.trackInterestValidationError('email', 'required');
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = t('form.errors.emailInvalid');
      analytics.trackInterestValidationError('email', 'invalid_format');
    }

    if (!formData.useCase.trim()) {
      newErrors.useCase = t('form.errors.useCaseRequired');
      analytics.trackInterestValidationError('useCase', 'required');
    }

    if (!formData.consent) {
      newErrors.consent = 'You must agree to the privacy policy to continue';
      analytics.trackInterestValidationError('consent', 'required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Track form submission start with form data
    analytics.trackInterestSubmitStart({
      hasCompany: Boolean(formData.company.trim()),
      hasRole: Boolean(formData.role.trim()),
      source: formData.leadSource || undefined,
    });

    try {
      const dp = dataProvider?.();
      if (!dp) {
        throw new Error('Data provider not available');
      }

      // Build mutation input with only non-empty optional fields
      const mutationInput: Record<string, string | boolean> = {
        fullName: formData.fullName,
        email: formData.email,
        consent: formData.consent,
      };

      // Add optional fields only if they have values
      if (formData.company.trim()) {
        mutationInput.company = formData.company.trim();
      }
      if (formData.role.trim()) {
        mutationInput.role = formData.role.trim();
      }
      if (formData.useCase.trim()) {
        mutationInput.useCase = formData.useCase.trim();
      }
      if (formData.leadSource.trim()) {
        mutationInput.leadSource = formData.leadSource;
      }

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
        // Track successful submission with conversion data
        analytics.trackInterestSubmitSuccess({
          email: formData.email,
          company: formData.company || undefined,
          companyProvided: Boolean(formData.company.trim()),
          roleProvided: Boolean(formData.role.trim()),
          source: formData.leadSource || undefined,
          referenceId: result.submitInterestRequest.referenceId,
        });
        setIsSuccess(true);

        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            fullName: '',
            email: '',
            company: '',
            role: '',
            useCase: '',
            leadSource: '',
            consent: false,
          });
          setIsSuccess(false);
        }, 10000);
      } else {
        throw new Error(
          result?.submitInterestRequest?.message || 'Failed to submit interest request',
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

      // Determine error type for analytics
      let errorType = 'unknown_error';
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        errorType = 'rate_limit';
        setSubmitError('You have submitted too many requests. Please try again later.');
      } else if (errorMessage.includes('HubSpot') || errorMessage.includes('CRM')) {
        errorType = 'crm_error';
        setSubmitError(
          'Your request was received but there was an issue syncing with our CRM. Our team will contact you manually.',
        );
      } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        errorType = 'validation_error';
        setSubmitError(`Validation error: ${errorMessage}`);
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorType = 'network_error';
        setSubmitError('Network error. Please check your connection and try again.');
      } else {
        setSubmitError(`Failed to submit request: ${errorMessage}`);
      }

      // Track submission failure
      analytics.trackInterestSubmitFailure(errorType, errorMessage);

      // eslint-disable-next-line no-console -- Log errors for debugging
      console.error('Interest request submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof InterestFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Track field focus for engagement analysis
  const handleFieldFocus = (fieldName: string) => {
    if (!fieldFocusTrackedRef.current.has(fieldName)) {
      analytics.trackInterestFieldFocus(fieldName);
      fieldFocusTrackedRef.current.add(fieldName);
    }
  };

  const toggleFaq = (index: number) => {
    const isExpanded = expandedFaq === index;
    setExpandedFaq(isExpanded ? null : index);

    // Track FAQ toggle
    const faqQuestion = faqs[index]?.question || '';
    analytics.trackInterestFaq(index, faqQuestion, !isExpanded);
  };

  const faqs: FAQItem[] = [
    { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
    { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
    { question: t('faq.item3.question'), answer: t('faq.item3.answer') },
    { question: t('faq.item4.question'), answer: t('faq.item4.answer') },
    { question: t('faq.item5.question'), answer: t('faq.item5.answer') },
    { question: t('faq.item6.question'), answer: t('faq.item6.answer') },
  ];

  const valueProps = [
    {
      icon: Sparkles,
      title: t('valueProp.benefits.exclusiveFeatures.title'),
      description: t('valueProp.benefits.exclusiveFeatures.description'),
      features: [
        t('valueProp.benefits.exclusiveFeatures.features.0'),
        t('valueProp.benefits.exclusiveFeatures.features.1'),
        t('valueProp.benefits.exclusiveFeatures.features.2'),
      ],
    },
    {
      icon: Gift,
      title: t('valueProp.benefits.pricingBenefits.title'),
      description: t('valueProp.benefits.pricingBenefits.description'),
      features: [
        t('valueProp.benefits.pricingBenefits.features.0'),
        t('valueProp.benefits.pricingBenefits.features.1'),
        t('valueProp.benefits.pricingBenefits.features.2'),
      ],
    },
    {
      icon: HeadphonesIcon,
      title: t('valueProp.benefits.prioritySupport.title'),
      description: t('valueProp.benefits.prioritySupport.description'),
      features: [
        t('valueProp.benefits.prioritySupport.features.0'),
        t('valueProp.benefits.prioritySupport.features.1'),
        t('valueProp.benefits.prioritySupport.features.2'),
      ],
    },
  ];

  const whatToExpectSteps = [
    {
      number: 1,
      title: t('whatToExpect.steps.confirmation.title'),
      description: t('whatToExpect.steps.confirmation.description'),
    },
    {
      number: 2,
      title: t('whatToExpect.steps.updates.title'),
      description: t('whatToExpect.steps.updates.description'),
    },
    {
      number: 3,
      title: t('whatToExpect.steps.invitation.title'),
      description: t('whatToExpect.steps.invitation.description'),
    },
    {
      number: 4,
      title: t('whatToExpect.steps.timeline.title'),
      description: t('whatToExpect.steps.timeline.description'),
    },
  ];

  return (
    <PublicLayout>
      <div className="flex flex-col bg-background text-foreground">
        {/* Hero Section */}
        <section className="relative w-full pt-16 pb-12 sm:pt-20 sm:pb-16 md:pt-32 md:pb-24 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-background to-background" />

          <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
            <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors border-amber-200 bg-amber-50 text-amber-700">
                <Clock className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                {t('hero.badge')}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl leading-tight px-2">
                {t('hero.title')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  {t('hero.highlight')}
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto px-2">
                {t('hero.subtitle')}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-xs sm:text-sm">{t('hero.trustBadge')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="w-full py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                {t('valueProp.title')}
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg px-2">
                {t('valueProp.subtitle')}
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {valueProps.map((prop, index) => {
                const Icon = prop.icon;
                return (
                  <div
                    key={index}
                    className="flex flex-col p-5 sm:p-6 rounded-2xl bg-background border shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="mb-4 h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg mb-2">{prop.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{prop.description}</p>
                    <ul className="space-y-2 mt-auto">
                      {prop.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* What to Expect Section */}
        <section className="w-full py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                  {t('whatToExpect.title')}
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg px-2">
                  {t('whatToExpect.subtitle')}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                {whatToExpectSteps.map((step) => (
                  <div key={step.number} className="flex gap-3 sm:gap-4 p-4 rounded-xl bg-muted/30">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {step.number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base sm:text-lg mb-1">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="w-full py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                  {t('socialProof.title')}
                </h2>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span className="text-base sm:text-lg">{t('socialProof.waitlist')}</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-5 sm:p-6 rounded-2xl bg-background border">
                  <p className="text-muted-foreground text-sm mb-4">
                    &ldquo;{t('socialProof.testimonial1.quote')}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-700 text-sm flex-shrink-0">
                      {t('socialProof.testimonial1.author').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {t('socialProof.testimonial1.author')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t('socialProof.testimonial1.role')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-background border">
                  <p className="text-muted-foreground text-sm mb-4">
                    &ldquo;{t('socialProof.testimonial2.quote')}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-bold text-purple-700 text-sm flex-shrink-0">
                      {t('socialProof.testimonial2.author').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {t('socialProof.testimonial2.author')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t('socialProof.testimonial2.role')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-background border sm:col-span-2 lg:col-span-1">
                  <p className="text-muted-foreground text-sm mb-4">
                    &ldquo;{t('socialProof.testimonial3.quote')}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-700 text-sm flex-shrink-0">
                      {t('socialProof.testimonial3.author').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {t('socialProof.testimonial3.author')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t('socialProof.testimonial3.role')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="w-full py-12 sm:py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="max-w-xl mx-auto" ref={formSectionRef}>
              {isLoading ? (
                <InterestFormSkeleton />
              ) : (
                <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-6 sm:p-8 md:p-10 shadow-xl">
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('form.title')}</h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {t('form.subtitle')}
                    </p>
                  </div>

                  {isSuccess ? (
                    <div className="py-8 text-center space-y-6">
                      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold">{t('form.success.title')}</h3>
                      <p className="text-muted-foreground">{t('form.success.message')}</p>
                      <div className="bg-muted/50 rounded-xl p-4 text-left">
                        <p className="font-semibold text-sm mb-3">{t('form.success.nextSteps')}</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {t('form.success.step1')}
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {t('form.success.step2')}
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {t('form.success.step3')}
                          </li>
                        </ul>
                      </div>
                      <Link href="/">
                        <Button variant="outline" className="mt-4">
                          {t('form.success.backButton')}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Name */}
                      <div className="space-y-2">
                        <label htmlFor="fullName" className="block text-sm font-medium">
                          {t('form.fields.name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          autoComplete="name"
                          inputMode="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          onFocus={() => handleFieldFocus('fullName')}
                          placeholder={t('form.placeholders.name')}
                          className="w-full px-4 py-3.5 min-h-[44px] bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base"
                        />
                        {errors.fullName && (
                          <p className="text-sm text-red-500">{errors.fullName}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium">
                          {t('form.fields.email')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            onFocus={() => handleFieldFocus('email')}
                            placeholder={t('form.placeholders.email')}
                            className="w-full pl-10 pr-4 py-3.5 min-h-[44px] bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base"
                          />
                        </div>
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                      </div>

                      {/* Company (Optional) */}
                      <div className="space-y-2">
                        <label htmlFor="company" className="block text-sm font-medium">
                          {t('form.fields.company')}
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <input
                            id="company"
                            type="text"
                            autoComplete="organization"
                            inputMode="text"
                            value={formData.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            onFocus={() => handleFieldFocus('company')}
                            placeholder={t('form.placeholders.company')}
                            className="w-full pl-10 pr-4 py-3.5 min-h-[44px] bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base"
                          />
                        </div>
                      </div>

                      {/* Role */}
                      <div className="space-y-2">
                        <label htmlFor="role" className="block text-sm font-medium">
                          {t('form.fields.role')}
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <input
                            id="role"
                            type="text"
                            autoComplete="organization-title"
                            inputMode="text"
                            value={formData.role}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                            onFocus={() => handleFieldFocus('role')}
                            placeholder={t('form.placeholders.role')}
                            className="w-full pl-10 pr-4 py-3.5 min-h-[44px] bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base"
                          />
                        </div>
                      </div>

                      {/* Use Case */}
                      <div className="space-y-2">
                        <label htmlFor="useCase" className="block text-sm font-medium">
                          {t('form.fields.useCase')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <textarea
                            id="useCase"
                            value={formData.useCase}
                            onChange={(e) => handleInputChange('useCase', e.target.value)}
                            onFocus={() => handleFieldFocus('useCase')}
                            placeholder={t('form.placeholders.useCase')}
                            rows={3}
                            className="w-full pl-10 pr-4 py-3.5 min-h-[44px] bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-base"
                          />
                        </div>
                        {errors.useCase && <p className="text-sm text-red-500">{errors.useCase}</p>}
                      </div>

                      {/* Source */}
                      <div className="space-y-2">
                        <label htmlFor="leadSource" className="block text-sm font-medium">
                          {t('form.fields.source')}
                        </label>
                        <div className="relative">
                          <select
                            id="leadSource"
                            value={formData.leadSource}
                            onChange={(e) => handleInputChange('leadSource', e.target.value)}
                            onFocus={() => handleFieldFocus('leadSource')}
                            className="w-full px-4 py-3.5 min-h-[44px] bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer text-base"
                          >
                            <option value="">{t('form.placeholders.source')}</option>
                            <option value="searchEngine">{t('form.sources.searchEngine')}</option>
                            <option value="socialMedia">{t('form.sources.socialMedia')}</option>
                            <option value="referral">{t('form.sources.referral')}</option>
                            <option value="event">{t('form.sources.event')}</option>
                            <option value="article">{t('form.sources.article')}</option>
                            <option value="other">{t('form.sources.other')}</option>
                          </select>
                          {/* Custom dropdown arrow */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg
                              className="h-4 w-4 text-muted-foreground"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* GDPR Consent */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="relative flex items-start pt-1">
                            <input
                              id="consent"
                              type="checkbox"
                              checked={formData.consent}
                              onChange={(e) => handleInputChange('consent', e.target.checked)}
                              disabled={isSubmitting}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600 focus:ring-2"
                              style={{ minWidth: '20px' }}
                            />
                          </div>
                          <div className="flex-1">
                            <label
                              htmlFor="consent"
                              className="text-sm font-normal cursor-pointer leading-relaxed"
                            >
                              I agree to receive product updates and my data being processed in
                              accordance with the{' '}
                              <a
                                href="/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Privacy Policy
                              </a>
                              . *
                            </label>
                            {errors.consent && (
                              <p className="text-sm text-red-500 mt-1">{errors.consent}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Error message */}
                      {submitError && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] rounded-full text-base font-medium mt-6 active:scale-[0.98]"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('form.submitting')}
                          </>
                        ) : (
                          <>
                            {t('form.submit')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground mt-4">
                        {t('form.privacyNotice')}
                      </p>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
                {t('faq.title')}
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/50 transition-colors min-h-[48px]"
                    >
                      <span className="font-medium pr-4 text-sm sm:text-base">{faq.question}</span>
                      {expandedFaq === index ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-muted-foreground border-t border-border/50">
                        <p className="pt-3 sm:pt-4 text-sm sm:text-base">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="max-w-2xl mx-auto text-center space-y-4 sm:space-y-6 px-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">{t('bottomCta.title')}</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                {t('bottomCta.subtitle')}
              </p>
              <Link href="/early-access">
                <Button
                  size="lg"
                  onClick={() => {
                    document.getElementById('fullName')?.scrollIntoView({ behavior: 'smooth' });
                    (document.getElementById('fullName') as HTMLInputElement)?.focus();
                  }}
                  className="px-6 sm:px-8 min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 rounded-full"
                >
                  {t('bottomCta.button')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default InterestPage;
