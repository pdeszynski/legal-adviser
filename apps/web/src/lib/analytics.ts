/**
 * Analytics utility for tracking user events and conversions.
 * Supports Google Analytics 4 and other analytics platforms.
 */

export interface AnalyticsEvent {
  name: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
}

/**
 * Get UTM parameters from URL and store them for later use.
 * Persists to sessionStorage so they can be attached to conversion events.
 */
export function captureUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};

  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: UTMParams = {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    referrer: document.referrer || undefined,
  };

  // Filter out undefined values
  const filteredParams = Object.fromEntries(
    Object.entries(utmParams).filter(([, value]) => value !== undefined),
  ) as UTMParams;

  // Store in sessionStorage for later use
  if (Object.keys(filteredParams).length > 0) {
    try {
      sessionStorage.setItem('utm_params', JSON.stringify(filteredParams));
    } catch {
      // Ignore sessionStorage errors
    }
  }

  return filteredParams;
}

/**
 * Retrieve stored UTM parameters from sessionStorage.
 */
export function getStoredUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};

  try {
    const stored = sessionStorage.getItem('utm_params');
    if (stored) {
      return JSON.parse(stored) as UTMParams;
    }
  } catch {
    // Ignore JSON parse errors
  }

  return {};
}

/**
 * Clear stored UTM parameters from sessionStorage.
 */
export function clearStoredUTMParams(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('utm_params');
  } catch {
    // Ignore sessionStorage errors
  }
}

/**
 * Track a page view in Google Analytics 4.
 */
export function trackPageView(pageTitle?: string, pageLocation?: string): void {
  if (typeof window === 'undefined') return;

  const gtagWindow = window as unknown as {
    gtag?: (command: string, targetId: string, config: Record<string, string>) => void;
  };

  if (typeof gtagWindow.gtag === 'function') {
    gtagWindow.gtag('event', 'page_view', {
      page_title: pageTitle || document.title,
      page_location: pageLocation || window.location.href,
    });
  }
}

/**
 * Track a CTA button click event.
 * @param location - Where the CTA was clicked (e.g., 'hero', 'feature-drafting', 'sticky-bar')
 * @param buttonText - The text on the button that was clicked
 * @param destination - Where the click leads to (e.g., 'demo-form', 'login')
 */
export function trackCTAClick(location: string, buttonText?: string, destination?: string): void {
  trackEvent('cta_click', {
    cta_location: location,
    cta_text: buttonText,
    cta_destination: destination || 'demo-form',
    ...getStoredUTMParams(),
  });
}

/**
 * Track a demo form opened event.
 */
export function trackDemoFormOpened(source: string): void {
  trackEvent('demo_form_opened', {
    source,
    ...getStoredUTMParams(),
  });
}

/**
 * Track a demo form submission.
 */
export function trackDemoFormSubmitted(data: {
  email?: string;
  companySize?: string;
  industry?: string;
  timeline?: string;
}): void {
  trackEvent('demo_form_submitted', {
    company_size: data.companySize,
    industry: data.industry,
    timeline: data.timeline,
    ...getStoredUTMParams(),
  });

  // Clear UTM params after successful conversion
  clearStoredUTMParams();
}

/**
 * Track a generic analytics event.
 * Sends to Google Analytics 4 if available.
 */
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean | undefined>): void {
  if (typeof window === 'undefined') return;

  const gtagWindow = window as unknown as {
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  };

  if (typeof gtagWindow.gtag === 'function') {
    gtagWindow.gtag('event', eventName, params);
  }

  // Log to console in development for debugging
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console -- Intentional debug logging
    console.log('[Analytics]', eventName, params);
  }
}

/**
 * Track a conversion event.
 * Use for key business actions like sign-ups, purchases, etc.
 */
export function trackConversion(value: number, currency = 'USD'): void {
  trackEvent('conversion', {
    value,
    currency,
    ...getStoredUTMParams(),
  });
}

/**
 * Track an error event for monitoring.
 */
export function trackError(errorName: string, errorMessage?: string): void {
  trackEvent('error', {
    error_name: errorName,
    error_message: errorMessage,
  });
}

/**
 * Initialize analytics on page load.
 * Captures UTM parameters and tracks initial page view.
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  // Capture UTM parameters on page load
  captureUTMParams();

  // Track initial page view
  trackPageView();
}

// ============================================================================
// Interest Page Analytics (/early-access)
// ============================================================================

/**
 * Track interest page view.
 * Includes UTM parameters for traffic source tracking.
 */
export function trackInterestPageView(): void {
  trackEvent('interest_page_view', {
    page_title: 'Early Access',
    page_location: '/early-access',
    ...getStoredUTMParams(),
  });
}

/**
 * Track when the interest form becomes visible/impression.
 * Fires when the form component renders in the viewport.
 */
export function trackInterestFormImpression(): void {
  trackEvent('interest_form_impression', {
    page: 'early-access',
    ...getStoredUTMParams(),
  });
}

/**
 * Track when a user focuses on a form field.
 * Helps understand form field engagement and drop-off points.
 * @param fieldName - Name of the field being focused (e.g., 'name', 'email', 'company')
 */
export function trackInterestFormFieldFocus(fieldName: string): void {
  trackEvent('interest_form_field_focus', {
    page: 'early-access',
    field_name: fieldName,
    ...getStoredUTMParams(),
  });
}

/**
 * Track form validation errors.
 * Helps identify problematic fields causing user frustration.
 * @param fieldName - Name of the field with the error
 * @param errorType - Type of validation error (e.g., 'required', 'invalid_format')
 */
export function trackInterestFormError(fieldName: string, errorType: string): void {
  trackEvent('interest_form_error', {
    page: 'early-access',
    field_name: fieldName,
    error_type: errorType,
    ...getStoredUTMParams(),
  });
}

/**
 * Track when user clicks submit to start the submission process.
 * @param formData - Partial form data for analysis (email domain, company provided, etc.)
 */
export function trackInterestFormSubmitStart(formData: {
  hasCompany: boolean;
  hasRole: boolean;
  source?: string;
}): void {
  trackEvent('interest_form_submit_start', {
    page: 'early-access',
    has_company: formData.hasCompany,
    has_role: formData.hasRole,
    lead_source: formData.source,
    ...getStoredUTMParams(),
  });
}

/**
 * Track successful interest form submission/conversion.
 * This is the key conversion event for the early access funnel.
 * @param data - Submission data including email, company, and lead source
 */
export function trackInterestFormSubmitSuccess(data: {
  email?: string;
  company?: string;
  companyProvided: boolean;
  roleProvided: boolean;
  source?: string;
  referenceId?: string;
}): void {
  // Extract email domain for lead quality analysis
  const emailDomain = data.email ? data.email.split('@')[1] : undefined;
  const isCompanyEmail = emailDomain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailDomain.toLowerCase());

  trackEvent('interest_form_submit_success', {
    page: 'early-access',
    email_domain: emailDomain,
    is_company_email: isCompanyEmail,
    has_company: data.companyProvided,
    company_name: data.company,
    has_role: data.roleProvided,
    lead_source: data.source,
    reference_id: data.referenceId,
    ...getStoredUTMParams(),
  });

  // Track as a conversion event
  trackConversion(1, 'USD');

  // Clear UTM params after successful conversion
  clearStoredUTMParams();
}

/**
 * Track failed interest form submission.
 * Helps identify technical issues or validation problems.
 * @param errorType - Type of error (e.g., 'network_error', 'validation_error', 'server_error')
 * @param errorMessage - Human-readable error message
 */
export function trackInterestFormSubmitFailure(errorType: string, errorMessage?: string): void {
  trackEvent('interest_form_submit_failure', {
    page: 'early-access',
    error_type: errorType,
    error_message: errorMessage,
    ...getStoredUTMParams(),
  });
}

/**
 * Track FAQ expansion/collapse.
 * Helps understand what information users are looking for.
 * @param faqIndex - Index of the FAQ item
 * @param faqQuestion - The question text (for analysis)
 * @param expanded - Whether the FAQ was expanded or collapsed
 */
export function trackInterestFaqToggle(faqIndex: number, faqQuestion: string, expanded: boolean): void {
  trackEvent('interest_faq_toggle', {
    page: 'early-access',
    faq_index: faqIndex,
    faq_question: faqQuestion.substring(0, 50), // Truncate for privacy
    expanded,
  });
}

/**
 * Track time on page / engagement.
 * Call this when user leaves the page to measure engagement.
 * @param timeSpentSeconds - Time spent on page in seconds
 * @param scrollDepth - Maximum scroll depth achieved (0-100)
 */
export function trackInterestPageEngagement(timeSpentSeconds: number, scrollDepth: number): void {
  trackEvent('interest_page_engagement', {
    page: 'early-access',
    time_spent_seconds: timeSpentSeconds,
    scroll_depth_percent: scrollDepth,
    ...getStoredUTMParams(),
  });
}
