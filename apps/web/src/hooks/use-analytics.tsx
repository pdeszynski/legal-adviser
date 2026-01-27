'use client';

import { useCallback } from 'react';
import {
  trackCTAClick,
  trackDemoFormOpened,
  trackDemoFormSubmitted,
  trackEvent,
  trackPageView,
  trackConversion,
  trackError,
  getStoredUTMParams,
  trackInterestPageView,
  trackInterestFormImpression,
  trackInterestFormFieldFocus,
  trackInterestFormError,
  trackInterestFormSubmitStart,
  trackInterestFormSubmitSuccess,
  trackInterestFormSubmitFailure,
  trackInterestFaqToggle,
  trackInterestPageEngagement,
  type UTMParams,
} from '@/lib/analytics';

/**
 * React hook for analytics tracking.
 * Provides convenient methods to track user interactions throughout the app.
 */
export function useAnalytics() {
  /**
   * Track a CTA button click.
   * @param location - Where the CTA was clicked (e.g., 'hero', 'feature-drafting', 'sticky-bar')
   * @param buttonText - The text on the button that was clicked
   * @param destination - Where the click leads to (e.g., 'demo-form', 'login')
   */
  const trackCtaClick = useCallback(
    (location: string, buttonText?: string, destination?: string) => {
      trackCTAClick(location, buttonText, destination);
    },
    [],
  );

  /**
   * Track when the demo form is opened.
   * @param source - What triggered the form to open (e.g., 'hero-cta', 'exit-intent')
   */
  const trackDemoFormOpen = useCallback((source: string) => {
    trackDemoFormOpened(source);
  }, []);

  /**
   * Track a successful demo form submission.
   * @param data - Form data to include in the event
   */
  const trackDemoSubmit = useCallback(
    (data: { email?: string; companySize?: string; industry?: string; timeline?: string }) => {
      trackDemoFormSubmitted(data);
    },
    [],
  );

  /**
   * Track a custom analytics event.
   * @param name - Event name
   * @param params - Event parameters
   */
  const trackCustomEvent = useCallback(
    (name: string, params?: Record<string, string | number | boolean | undefined>) => {
      trackEvent(name, params);
    },
    [],
  );

  /**
   * Track a page view.
   * @param pageTitle - Page title
   * @param pageLocation - Page URL
   */
  const trackPageViewEvent = useCallback((pageTitle?: string, pageLocation?: string) => {
    trackPageView(pageTitle, pageLocation);
  }, []);

  /**
   * Track a conversion event.
   * @param value - Conversion value
   * @param currency - Currency code (default: USD)
   */
  const trackConversionEvent = useCallback((value: number, currency = 'USD') => {
    trackConversion(value, currency);
  }, []);

  /**
   * Track an error event.
   * @param errorName - Error name/type
   * @param errorMessage - Error message
   */
  const trackErrorEvent = useCallback((errorName: string, errorMessage?: string) => {
    trackError(errorName, errorMessage);
  }, []);

  /**
   * Get stored UTM parameters.
   */
  const getUtmParams = useCallback((): UTMParams => {
    return getStoredUTMParams();
  }, []);

  // Interest form analytics methods
  const trackInterestPage = useCallback(() => {
    trackInterestPageView();
  }, []);

  const trackInterestFormView = useCallback(() => {
    trackInterestFormImpression();
  }, []);

  const trackInterestFieldFocus = useCallback((fieldName: string) => {
    trackInterestFormFieldFocus(fieldName);
  }, []);

  const trackInterestValidationError = useCallback((fieldName: string, errorType: string) => {
    trackInterestFormError(fieldName, errorType);
  }, []);

  const trackInterestSubmitStart = useCallback(
    (formData: { hasCompany: boolean; hasRole: boolean; source?: string }) => {
      trackInterestFormSubmitStart(formData);
    },
    [],
  );

  const trackInterestSubmitSuccess = useCallback(
    (data: {
      email?: string;
      company?: string;
      companyProvided: boolean;
      roleProvided: boolean;
      source?: string;
      referenceId?: string;
    }) => {
      trackInterestFormSubmitSuccess(data);
    },
    [],
  );

  const trackInterestSubmitFailure = useCallback((errorType: string, errorMessage?: string) => {
    trackInterestFormSubmitFailure(errorType, errorMessage);
  }, []);

  const trackInterestFaq = useCallback(
    (faqIndex: number, faqQuestion: string, expanded: boolean) => {
      trackInterestFaqToggle(faqIndex, faqQuestion, expanded);
    },
    [],
  );

  const trackInterestEngagement = useCallback((timeSpentSeconds: number, scrollDepth: number) => {
    trackInterestPageEngagement(timeSpentSeconds, scrollDepth);
  }, []);

  return {
    trackCtaClick,
    trackDemoFormOpen,
    trackDemoSubmit,
    trackCustomEvent,
    trackPageViewEvent,
    trackConversionEvent,
    trackErrorEvent,
    getUtmParams,
    // Interest form analytics
    trackInterestPage,
    trackInterestFormView,
    trackInterestFieldFocus,
    trackInterestValidationError,
    trackInterestSubmitStart,
    trackInterestSubmitSuccess,
    trackInterestSubmitFailure,
    trackInterestFaq,
    trackInterestEngagement,
  };
}

export type UseAnalyticsReturn = ReturnType<typeof useAnalytics>;
