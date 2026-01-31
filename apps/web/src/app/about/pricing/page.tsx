'use client';

import { useTranslations } from 'next-intl';
import { PublicLayout } from '@components/layout/public-layout';
import { Button } from '@legal/ui';
import Link from 'next/link';
import { Check, X, CreditCard, Calendar, Sparkles, ArrowLeft, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { DemoRequestForm } from '@components/demo-request';

const PricingPage = () => {
  const t = useTranslations('pricing');
  const [isYearly, setIsYearly] = useState(false);
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false);

  const plans = ['free', 'professional', 'team', 'enterprise'] as const;

  const getMonthlyPrice = (plan: string, price: string) => {
    if (plan === 'free') return '0';
    if (plan === 'enterprise') return price;
    if (!isYearly) return price;
    // Calculate yearly price (20% off)
    const numPrice = parseInt(price);
    return String(Math.round(numPrice * 0.8));
  };

  return (
    <PublicLayout>
      <div className="flex flex-col items-center bg-background text-foreground overflow-hidden">
        {/* Hero Section */}
        <section className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/50 via-background to-background" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors border-emerald-200 bg-emerald-50 text-emerald-700">
                <CreditCard className="mr-2 h-3 w-3" />
                {t('hero.badge')}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                {t('hero.title')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              <p className="max-w-[700px] text-muted-foreground text-lg sm:text-xl leading-relaxed mx-auto">
                {t('hero.subtitle')}
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <span
                  className={`text-sm ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}
                >
                  {t('toggle.monthly')}
                </span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative h-7 w-12 rounded-full transition-colors border-2 ${isYearly ? 'bg-emerald-600 border-emerald-600' : 'bg-muted border-muted'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${isYearly ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
                <span className={`text-sm ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
                  {t('toggle.yearly')}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  {t('toggle.save')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {plans.map((planKey) => {
                const plan = t.raw(`plans.${planKey}`) as any;
                const price = getMonthlyPrice(planKey, plan.price);
                const isPopular = plan.popular;

                return (
                  <div
                    key={planKey}
                    className={`relative rounded-3xl border p-8 transition-all hover:shadow-xl ${
                      isPopular
                        ? 'bg-gradient-to-b from-emerald-50 to-background dark:from-emerald-950 dark:to-background border-emerald-200 dark:border-emerald-800 scale-105'
                        : 'bg-background border-border hover:border-emerald-200 dark:hover:border-emerald-800'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center px-4 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold shadow-lg">
                          <Sparkles className="mr-1 h-3 w-3" />
                          {t('popular')}
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-extrabold">
                          {planKey === 'enterprise' ? t('customPricing') : price}
                        </span>
                        {planKey !== 'enterprise' && (
                          <span className="text-muted-foreground">
                            {planKey === 'free' ? t('forever') : `/${t('month')}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="lg"
                      onClick={() =>
                        planKey === 'enterprise' || planKey === 'team'
                          ? setIsDemoFormOpen(true)
                          : null
                      }
                      asChild={planKey !== 'enterprise' && planKey !== 'team'}
                      className={`w-full mb-8 rounded-full ${
                        isPopular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {planKey === 'enterprise' || planKey === 'team' ? (
                        <span>{plan.cta}</span>
                      ) : (
                        <Link href="/login">{plan.cta}</Link>
                      )}
                    </Button>

                    <div className="space-y-4">
                      <div className="text-sm font-semibold text-center mb-4">{t('included')}</div>
                      {plan.features.included.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                      {plan.features.excluded.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 opacity-50">
                          <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
                  {t('faq.title')}
                </h2>
              </div>

              <div className="space-y-6">
                {t.raw('faq.items').map((item: any, idx: number) => (
                  <div key={idx} className="p-6 rounded-2xl border bg-card">
                    <h3 className="font-bold mb-2 flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      {item.question}
                    </h3>
                    <p className="text-muted-foreground ml-8">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('cta.title')}</h2>
              <p className="text-lg text-muted-foreground">{t('cta.description')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={() => setIsDemoFormOpen(true)}
                  className="px-8 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('cta.getStarted')}
                </Button>
                <Link href="/about">
                  <Button variant="outline" size="lg" className="px-8 h-12 rounded-full text-lg">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('navigation.backToAbout')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Demo Request Form Modal */}
      <DemoRequestForm isOpen={isDemoFormOpen} onClose={() => setIsDemoFormOpen(false)} />
    </PublicLayout>
  );
};

export default PricingPage;
