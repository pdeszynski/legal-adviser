'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useIsAuthenticated, useGo } from '@refinedev/core';
import { useTranslations } from 'next-intl';
import { PublicLayout } from '@components/layout/public-layout';
import { Button } from '@legal/ui';
import { useAnalytics } from '@/hooks/use-analytics';
import { initAnalytics } from '@/lib/analytics';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Star, X, Loader2, ArrowUpRight } from 'lucide-react';

const LandingContent = () => {
  const t = useTranslations('landing');
  const analytics = useAnalytics();
  const router = useRouter();
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const hasShownExitModal = useRef(false);
  const [navigatingFrom, setNavigatingFrom] = useState<string | null>(null);

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Sticky CTA on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling past hero section
      const heroSection = document.getElementById('hero-section');
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        setShowStickyCta(heroBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Exit intent detection
  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // Only show if mouse leaves from the top of the viewport
      if (e.clientY <= 0 && !hasShownExitModal.current) {
        hasShownExitModal.current = true;
        setShowExitModal(true);
      }
    },
    [],
  );

  useEffect(() => {
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [handleMouseLeave]);

  // Track CTA clicks and navigate to early-access page
  // Analytics tracking is non-blocking - navigation happens immediately
  const handleEarlyAccessNavigation = useCallback(
    (location: string) => {
      if (navigatingFrom) return; // Prevent double-clicks

      // Non-blocking analytics - don't await
      Promise.resolve().then(() => {
        analytics.trackCtaClick(location, 'Get Early Access', 'early-access-page');
      });

      setNavigatingFrom(location);
      router.push('/early-access');
    },
    [analytics, router, navigatingFrom],
  );

  return (
    <PublicLayout>
      <div className="flex flex-col items-center bg-background text-foreground overflow-hidden">
        {/* Hero Section */}
        <section
          id="hero-section"
          className="relative w-full pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05] pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-background to-background pointer-events-none" />

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
                  <Link href="/early-access" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      onClick={() => handleEarlyAccessNavigation('hero')}
                      disabled={!!navigatingFrom}
                      className="w-full px-8 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 rounded-full text-base font-semibold"
                    >
                      {navigatingFrom === 'hero' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Get Early Access
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full sm:w-auto px-8 h-14 border-muted-foreground/20 hover:bg-muted/50 backdrop-blur-sm rounded-full text-base"
                  >
                    {t('hero.cta.secondary')}
                  </Button>
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
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full mix-blend-multiply opacity-30 animate-blob pointer-events-none"></div>
                  <div className="absolute top-0 right-0 bg-cyan-500/20 blur-3xl rounded-full mix-blend-multiply opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="mb-6 relative h-48 w-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>
                  <Image
                    src="/feature-drafting.png"
                    alt={t('features.drafting.title')}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{t('features.drafting.title')}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t('features.drafting.description')}
                </p>
                <Link href="/early-access" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400"
                    onClick={() => handleEarlyAccessNavigation('feature-drafting')}
                    disabled={!!navigatingFrom}
                  >
                    {navigatingFrom === 'feature-drafting' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Get Early Access
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Link>
              </div>

              {/* Feature 2 */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 dark:bg-black/20 backdrop-blur-xl p-8 transition-all hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="mb-6 relative h-48 w-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl group-hover:bg-purple-500/20 transition-all pointer-events-none"></div>
                  <Image
                    src="/feature-analysis.png"
                    alt={t('features.analysis.title')}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{t('features.analysis.title')}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t('features.analysis.description')}
                </p>
                <Link href="/early-access" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-400"
                    onClick={() => handleEarlyAccessNavigation('feature-analysis')}
                    disabled={!!navigatingFrom}
                  >
                    {navigatingFrom === 'feature-analysis' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Get Early Access
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Link>
              </div>

              {/* Feature 3 */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 dark:bg-black/20 backdrop-blur-xl p-8 transition-all hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="mb-6 relative h-48 w-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>
                  <Image
                    src="/feature-qa.png"
                    alt={t('features.qa.title')}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{t('features.qa.title')}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t('features.qa.description')}
                </p>
                <Link href="/early-access" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400"
                    onClick={() => handleEarlyAccessNavigation('feature-qa')}
                    disabled={!!navigatingFrom}
                  >
                    {navigatingFrom === 'feature-qa' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Get Early Access
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="w-full py-24 bg-background">
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

            {/* How It Works CTA */}
            <div className="mt-16 text-center">
              <Link href="/early-access">
                <Button
                  size="lg"
                  onClick={() => handleEarlyAccessNavigation('how-it-works')}
                  disabled={!!navigatingFrom}
                  className="px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 rounded-full text-base"
                >
                  {navigatingFrom === 'how-it-works' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Join Waitlist
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </Link>
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
                  &ldquo;{t('testimonials.testimonial1.quote')}&rdquo;
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
                  &ldquo;{t('testimonials.testimonial2.quote')}&rdquo;
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
                  &ldquo;{t('testimonials.testimonial3.quote')}&rdquo;
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
                <Link href="/early-access">
                  <Button
                    size="lg"
                    onClick={() => handleEarlyAccessNavigation('bottom-cta')}
                    disabled={!!navigatingFrom}
                    className="px-8 h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
                  >
                    {navigatingFrom === 'bottom-cta' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Get Early Access
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Link>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="px-8 h-12 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm rounded-full text-lg"
                >
                  <Link href="/login">{t('cta.primaryButton')}</Link>
                </Button>
              </div>
              <p className="text-sm text-blue-200 mt-4">{t('cta.disclaimer')}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky CTA Bar (appears after scrolling past hero) */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 shadow-2xl border-t border-blue-400/20">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="text-white">
                <p className="font-semibold text-sm sm:text-base">
                  Ready to transform your legal practice?
                </p>
                <p className="text-blue-100 text-xs hidden sm:inline">
                  Get early access to our AI-powered platform
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/early-access">
                  <Button
                    size="sm"
                    onClick={() => handleEarlyAccessNavigation('sticky-bar')}
                    disabled={!!navigatingFrom}
                    className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg rounded-full px-6"
                  >
                    {navigatingFrom === 'sticky-bar' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Join Waitlist
                        <ArrowUpRight className="ml-2 h-3 w-3" />
                      </>
                    )}
                  </Button>
                </Link>
                <button
                  onClick={() => setShowStickyCta(false)}
                  className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exit Intent Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
          <div className="relative bg-background border rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowExitModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-8 w-8 text-blue-600" />
              </div>

              <h3 className="text-2xl font-bold">Wait! Don&apos;t miss out</h3>

              <p className="text-muted-foreground">
                Get exclusive early access to our AI-powered legal platform. Join our waitlist
                to be among the first to transform your practice.
              </p>

              <div className="space-y-3 pt-2">
                <Link href="/early-access" className="w-full">
                  <Button
                    size="lg"
                    onClick={() => handleEarlyAccessNavigation('exit-intent')}
                    disabled={!!navigatingFrom}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {navigatingFrom === 'exit-intent' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Get Early Access
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowExitModal(false)}
                  className="w-full"
                >
                  No thanks, I&apos;ll explore more
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                No commitment required. Join thousands of legal professionals waiting for early access.
              </p>
            </div>
          </div>
        </div>
      )}

    </PublicLayout>
  );
};

const IndexPageContent = () => {
  const { data, isLoading } = useIsAuthenticated();
  const go = useGo();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (!isLoading && data?.authenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      // Use a small delay to ensure smooth transition
      const redirectTimer = setTimeout(() => {
        go({ to: '/dashboard', type: 'replace' });
      }, 100);
      return () => clearTimeout(redirectTimer);
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
