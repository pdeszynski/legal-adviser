import type { Metadata } from 'next';
import type React from 'react';
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { RefineContext } from './_refine_context';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

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

  return (
    <html lang={locale}>
      <body>
        <Suspense>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <RefineContext>{children}</RefineContext>
            <Toaster />
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
