'use client';

import { Suspense } from 'react';
import { PublicLayout } from '@components/layout/public-layout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const NotFoundContent = () => {
  const t = useTranslations('notFound');

  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">
          {/* 404 Number with decorative elements */}
          <div className="relative mb-8">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 blur-2xl" />
            <h1 className="relative text-[180px] font-bold leading-none text-primary/10 select-none">
              404
            </h1>
          </div>

          {/* Main content */}
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">{t('description')}</p>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                {t('goHome')}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {t('signIn')}
              </Link>
            </div>

            {/* Help section */}
            <div className="mt-12 rounded-lg border border-dashed border-border bg-muted/30 p-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{t('help.title')}</span>{' '}
                {t('help.text')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default function NotFound() {
  return (
    <Suspense
      fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}
    >
      <NotFoundContent />
    </Suspense>
  );
}
