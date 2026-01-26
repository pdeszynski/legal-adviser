import type { Metadata } from 'next';
import type React from 'react';
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { RefineContext } from './_refine_context';
import { Toaster } from '@/components/ui/toaster';
import { initializePersistedQueries } from '@/lib/persisted-queries';
import { GoogleAnalytics, AnalyticsProvider } from '@/providers/analytics-provider';
import './globals.css';

// Initialize persisted queries client-side manifest
// This loads the operation name -> hash mapping for APQ
void initializePersistedQueries();

export const metadata: Metadata = {
  title: 'Legal AI',
  description: 'AI-powered legal document generation and analysis',
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  // Get GA ID from environment directly (server-safe)
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={locale}>
      <body>
        <Suspense>
          {gaMeasurementId && <GoogleAnalytics measurementId={gaMeasurementId} />}
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AnalyticsProvider>
              <RefineContext>{children}</RefineContext>
              <Toaster />
            </AnalyticsProvider>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
