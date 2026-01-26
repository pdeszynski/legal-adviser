'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initAnalytics, trackPageView } from '@/lib/analytics';

interface GoogleAnalyticsProps {
  measurementId: string;
}

/**
 * Google Analytics 4 initialization script.
 * This component injects the GA4 script into the page.
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !measurementId) return;

    // Initialize gtag if it doesn't exist
    const w = window as unknown as {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };

    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params -- Required for gtag
      w.dataLayer?.push(arguments);
    };

    // Initialize GA4
    w.gtag('js', new Date());
    w.gtag('config', measurementId, {
      send_page_view: false, // We'll handle page views manually
    });
  }, [measurementId]);

  return null;
}

/**
 * Analytics provider component.
 * Initializes analytics on the client side and tracks page views.
 * Add this to the root layout to enable analytics across the app.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize analytics on mount
    initAnalytics();
  }, []);

  // Track page views when route changes
  useEffect(() => {
    if (!pathname) return;

    const url = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    trackPageView(undefined, url);
  }, [pathname, searchParams]);

  return <>{children}</>;
}

/**
 * Get the Google Analytics measurement ID from environment variables.
 */
export function getGaMeasurementId(): string | undefined {
  if (typeof process === 'undefined') return undefined;

  // Check for GA4 measurement ID in environment variables
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID;
}
