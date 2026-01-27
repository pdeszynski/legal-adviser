'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useCallback } from 'react';
import { PublicLayout } from '@components/layout/public-layout';
import { Button } from '@legal/ui';
import Link from 'next/link';
import {
  FileText,
  MessageSquare,
  Search,
  Users,
  CreditCard,
  HelpCircle,
  Sparkles,
  Heart,
  Target,
  Lightbulb,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';
import { initAnalytics } from '@/lib/analytics';

const AboutPage = () => {
  const t = useTranslations();
  const analytics = useAnalytics();

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track CTA clicks
  const handleCtaClick = useCallback(
    (location: string, destination: string) => {
      analytics.trackCtaClick(location, 'Get Started', destination);
    },
    [analytics],
  );

  const sections = [
    {
      key: 'howItWorks',
      icon: Sparkles,
      color: 'blue',
      href: '/about/how-it-works',
      title: t('aboutUs.navigation.howItWorks'),
      description: t('aboutUs.navigation.howItWorksDescription'),
    },
    {
      key: 'aboutUs',
      icon: Heart,
      color: 'rose',
      href: '/about/about-us',
      title: t('aboutUs.navigation.aboutUs'),
      description: t('aboutUs.navigation.aboutUsDescription'),
    },
    {
      key: 'features',
      icon: Lightbulb,
      color: 'amber',
      href: '/about/features',
      title: t('aboutUs.navigation.features'),
      description: t('aboutUs.navigation.featuresDescription'),
    },
    {
      key: 'pricing',
      icon: CreditCard,
      color: 'emerald',
      href: '/about/pricing',
      title: t('aboutUs.navigation.pricing'),
      description: t('aboutUs.navigation.pricingDescription'),
    },
    {
      key: 'faq',
      icon: HelpCircle,
      color: 'purple',
      href: '/about/faq',
      title: t('aboutUs.navigation.faq'),
      description: t('aboutUs.navigation.faqDescription'),
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      gradient: 'from-blue-500 to-cyan-500',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
      gradient: 'from-rose-500 to-red-500',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      gradient: 'from-amber-500 to-orange-500',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      gradient: 'from-emerald-500 to-teal-500',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      gradient: 'from-purple-500 to-pink-500',
    },
  };

  return (
    <PublicLayout>
      <div className="flex flex-col items-center bg-background text-foreground overflow-hidden">
        {/* Hero Section */}
        <section className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-background to-background" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors border-blue-200 bg-blue-50 text-blue-700">
                <Target className="mr-2 h-3 w-3" />
                {t('aboutUs.hero.badge')}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                {t('aboutUs.hero.title')}
              </h1>
              <p className="max-w-[700px] text-muted-foreground text-lg sm:text-xl leading-relaxed mx-auto">
                {t('aboutUs.hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Navigation Cards Section */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section) => {
                const Icon = section.icon;
                const colors = colorClasses[section.color as keyof typeof colorClasses];

                return (
                  <Link key={section.key} href={section.href}>
                    <div className="group relative h-full p-6 rounded-2xl bg-background border shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}
                      />
                      <div className="relative">
                        <div
                          className={`mb-4 h-12 w-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="h-6 w-6" strokeWidth={1.5} />
                        </div>
                        <h3 className={`mb-2 text-xl font-bold ${colors.text}`}>{section.title}</h3>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                          {section.description}
                        </p>
                        <div
                          className={`flex items-center ${colors.text} font-medium text-sm group-hover:gap-2 transition-all`}
                        >
                          {t('aboutUs.navigation.learnMore')}
                          <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                {t('aboutUs.cta.title')}
              </h2>
              <p className="text-lg text-muted-foreground">{t('aboutUs.cta.description')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => handleCtaClick('about-page-cta', 'login')}
                  className="px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
                >
                  {t('aboutUs.cta.getStarted')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleCtaClick('about-page-contact', 'contact')}
                  className="px-8 h-12 rounded-full text-lg"
                >
                  {t('aboutUs.cta.contactUs')}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default AboutPage;
