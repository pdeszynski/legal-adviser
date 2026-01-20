'use client';

import { Suspense, useEffect } from 'react';
import { useIsAuthenticated, useGo } from '@refinedev/core';
import { useTranslations } from 'next-intl';
import { PublicLayout } from '@components/layout/public-layout';
import { Button } from '@legal/ui';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, Lock, Star } from 'lucide-react';

const LandingContent = () => {
  const t = useTranslations('landing');

  return (
    <PublicLayout>
      <div className="flex flex-col items-center bg-background text-foreground overflow-hidden">
        {/* Hero Section */}
        <section className="relative w-full pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-background to-background" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <div className="flex flex-col items-start space-y-8 text-left">
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors border-blue-200 bg-blue-50 text-blue-700">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                    {t('hero.badge')}
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                    {t('hero.title')}{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                      {t('hero.titleHighlight')}
                    </span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground text-lg sm:text-xl leading-relaxed">
                    {t('hero.subtitle')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 rounded-full text-base"
                    >
                      {t('hero.cta.primary')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/about" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto px-8 h-12 border-muted-foreground/20 hover:bg-muted/50 backdrop-blur-sm rounded-full text-base"
                    >
                      {t('hero.cta.secondary')}
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <span>{t('hero.features.secure')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-500" />
                    <span>{t('hero.features.encryption')}</span>
                  </div>
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end items-center">
                <div className="relative w-[350px] h-[350px] sm:w-[500px] sm:h-[500px]">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full mix-blend-multiply opacity-30 animate-blob"></div>
                  <div className="absolute top-0 right-0 bg-cyan-500/20 blur-3xl rounded-full mix-blend-multiply opacity-30 animate-blob animation-delay-2000"></div>
                  <Image
                    src="/hero-illustration.png"
                    alt="Legal AI Illustration"
                    fill
                    className="object-contain drop-shadow-2xl relative z-10 animate-float"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 bg-muted/30 relative">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-20 max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                {t('features.title')}
              </h2>
              <p className="text-lg text-muted-foreground">{t('features.subtitle')}</p>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 dark:bg-black/20 backdrop-blur-xl p-8 transition-all hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="mb-6 relative h-48 w-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                  <Image
                    src="/feature-drafting.png"
                    alt={t('features.drafting.title')}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{t('features.drafting.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.drafting.description')}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 dark:bg-black/20 backdrop-blur-xl p-8 transition-all hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="mb-6 relative h-48 w-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl group-hover:bg-purple-500/20 transition-all"></div>
                  <Image
                    src="/feature-analysis.png"
                    alt={t('features.analysis.title')}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{t('features.analysis.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.analysis.description')}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 dark:bg-black/20 backdrop-blur-xl p-8 transition-all hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="mb-6 relative h-48 w-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
                  <Image
                    src="/feature-qa.png"
                    alt={t('features.qa.title')}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{t('features.qa.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.qa.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="w-full py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                {t('howItWorks.title')}
              </h2>
              <p className="text-lg text-muted-foreground">{t('howItWorks.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 dark:from-blue-900 dark:via-blue-800 dark:to-blue-900 -z-10"></div>

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-background border-4 border-blue-100 dark:border-blue-900 flex items-center justify-center z-10 shadow-sm transition-transform hover:scale-110">
                  <span className="text-4xl font-black text-blue-600/50">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{t('howItWorks.step1.title')}</h3>
                  <p className="text-muted-foreground">{t('howItWorks.step1.description')}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-background border-4 border-blue-100 dark:border-blue-900 flex items-center justify-center z-10 shadow-sm transition-transform hover:scale-110">
                  <span className="text-4xl font-black text-purple-600/50">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{t('howItWorks.step2.title')}</h3>
                  <p className="text-muted-foreground">{t('howItWorks.step2.description')}</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-background border-4 border-blue-100 dark:border-blue-900 flex items-center justify-center z-10 shadow-sm transition-transform hover:scale-110">
                  <span className="text-4xl font-black text-emerald-600/50">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{t('howItWorks.step3.title')}</h3>
                  <p className="text-muted-foreground">{t('howItWorks.step3.description')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials (Mock) */}
        <section className="w-full py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                {t('testimonials.title')}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-background border shadow-sm">
                <div className="flex gap-1 text-yellow-500 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={`star-1-${i}`} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">
                  "{t('testimonials.testimonial1.quote')}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                    {t('testimonials.testimonial1.author').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{t('testimonials.testimonial1.author')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('testimonials.testimonial1.role')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8 rounded-2xl bg-background border shadow-sm">
                <div className="flex gap-1 text-yellow-500 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={`star-2-${i}`} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">
                  "{t('testimonials.testimonial2.quote')}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700">
                    {t('testimonials.testimonial2.author').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{t('testimonials.testimonial2.author')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('testimonials.testimonial2.role')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8 rounded-2xl bg-background border shadow-sm md:col-span-2 lg:col-span-1">
                <div className="flex gap-1 text-yellow-500 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={`star-3-${i}`} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">
                  "{t('testimonials.testimonial3.quote')}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                    {t('testimonials.testimonial3.author').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{t('testimonials.testimonial3.author')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('testimonials.testimonial3.role')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-32 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600 dark:bg-blue-900 clip-path-slant z-0"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 z-0"></div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 text-white">
            <div className="flex flex-col items-center space-y-8 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{t('cta.title')}</h2>
              <p className="text-xl text-blue-100">{t('cta.subtitle')}</p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="px-8 h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
                  >
                    {t('cta.primaryButton')}
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 h-12 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm rounded-full text-lg"
                  >
                    {t('cta.secondaryButton')}
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-blue-200 mt-4">{t('cta.disclaimer')}</p>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

const IndexPageContent = () => {
  const { data, isLoading } = useIsAuthenticated();
  const go = useGo();

  useEffect(() => {
    if (!isLoading && data?.authenticated) {
      go({ to: '/documents', type: 'replace' });
    }
  }, [data, isLoading, go]);

  // We render LandingContent immediately even if loading, for better perceived performance.
  // Ideally we might want a spinner but landing page usually renders instantly.
  // If authenticated, the redirect happens.
  return <LandingContent />;
};

export default function IndexPage() {
  return (
    <Suspense>
      <IndexPageContent />
    </Suspense>
  );
}
