'use client';

import { useTranslations } from 'next-intl';
import { PublicLayout } from '@components/layout/public-layout';
import { Button } from '@legal/ui';
import { DemoRequestForm } from '@components/demo-request';
import Link from 'next/link';
import {
  Calendar,
  FileText,
  MessageSquare,
  Search,
  Users,
  CheckCircle2,
  Sparkles,
  Shield,
  Clock,
  Scale,
} from 'lucide-react';
import { useState } from 'react';

const HowItWorksContent = () => {
  const t = useTranslations('howItWorksPage');
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false);

  const steps = [
    {
      number: 1,
      icon: FileText,
      color: 'blue',
      title: t('steps.caseAnalysis.title'),
      description: t('steps.caseAnalysis.description'),
      details: t('steps.caseAnalysis.details'),
      features: [
        t('steps.caseAnalysis.feature1'),
        t('steps.caseAnalysis.feature2'),
        t('steps.caseAnalysis.feature3'),
      ],
    },
    {
      number: 2,
      icon: MessageSquare,
      color: 'purple',
      title: t('steps.legalQa.title'),
      description: t('steps.legalQa.description'),
      details: t('steps.legalQa.details'),
      features: [
        t('steps.legalQa.feature1'),
        t('steps.legalQa.feature2'),
        t('steps.legalQa.feature3'),
      ],
    },
    {
      number: 3,
      icon: Sparkles,
      color: 'emerald',
      title: t('steps.documentGeneration.title'),
      description: t('steps.documentGeneration.description'),
      details: t('steps.documentGeneration.details'),
      features: [
        t('steps.documentGeneration.feature1'),
        t('steps.documentGeneration.feature2'),
        t('steps.documentGeneration.feature3'),
      ],
    },
    {
      number: 4,
      icon: Search,
      color: 'amber',
      title: t('steps.caseLawResearch.title'),
      description: t('steps.caseLawResearch.description'),
      details: t('steps.caseLawResearch.details'),
      features: [
        t('steps.caseLawResearch.feature1'),
        t('steps.caseLawResearch.feature2'),
        t('steps.caseLawResearch.feature3'),
      ],
    },
    {
      number: 5,
      icon: Users,
      color: 'rose',
      title: t('steps.collaboration.title'),
      description: t('steps.collaboration.description'),
      details: t('steps.collaboration.details'),
      features: [
        t('steps.collaboration.feature1'),
        t('steps.collaboration.feature2'),
        t('steps.collaboration.feature3'),
      ],
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: t('benefits.time.title'),
      description: t('benefits.time.description'),
    },
    {
      icon: Scale,
      title: t('benefits.accuracy.title'),
      description: t('benefits.accuracy.description'),
    },
    {
      icon: Shield,
      title: t('benefits.security.title'),
      description: t('benefits.security.description'),
    },
  ];

  const testimonials = [
    {
      quote: t('testimonials.t1.quote'),
      author: t('testimonials.t1.author'),
      role: t('testimonials.t1.role'),
      color: 'blue',
    },
    {
      quote: t('testimonials.t2.quote'),
      author: t('testimonials.t2.author'),
      role: t('testimonials.t2.role'),
      color: 'purple',
    },
    {
      quote: t('testimonials.t3.quote'),
      author: t('testimonials.t3.author'),
      role: t('testimonials.t3.role'),
      color: 'emerald',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      gradient: 'from-blue-500 to-cyan-500',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      gradient: 'from-purple-500 to-pink-500',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      gradient: 'from-emerald-500 to-teal-500',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      gradient: 'from-amber-500 to-orange-500',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
      gradient: 'from-rose-500 to-red-500',
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
                <Sparkles className="mr-2 h-3 w-3" />
                {t('hero.badge')}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                {t('hero.title')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              <p className="max-w-[700px] text-muted-foreground text-lg sm:text-xl leading-relaxed mx-auto">
                {t('hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="space-y-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const colors = colorClasses[step.color as keyof typeof colorClasses];
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={step.number}
                    className={`relative flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-center`}
                  >
                    {/* Number Badge */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:flex">
                      <div
                        className={`w-16 h-16 rounded-full ${colors.bg} ${colors.text} border-4 ${colors.border} flex items-center justify-center font-black text-2xl shadow-lg`}
                      >
                        {step.number}
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`flex-1 ${isEven ? 'lg:text-right lg:pr-16' : 'lg:text-left lg:pl-16'} pt-8 lg:pt-0`}>
                      <div className="space-y-4">
                        <div className={`inline-flex items-center gap-2 ${colors.text} font-semibold`}>
                          <Icon className="h-5 w-5" />
                          <span className="text-sm uppercase tracking-wider">
                            {t('step')} {step.number}
                          </span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">{step.title}</h2>
                        <p className="text-lg text-muted-foreground">{step.description}</p>
                        <p className="text-muted-foreground">{step.details}</p>

                        {/* Features List */}
                        <ul className={`space-y-2 ${isEven ? 'lg:ml-auto' : 'lg:mr-auto'} max-w-md`}>
                          {step.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle2 className={`h-4 w-4 ${colors.text} flex-shrink-0`} />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Visual */}
                    <div className="flex-1 max-w-md w-full">
                      <div
                        className={`relative rounded-3xl ${colors.bg} border ${colors.border} p-8 transition-all hover:shadow-xl`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-3xl`} />
                        <div className="relative h-64 flex items-center justify-center">
                          <div className={`w-32 h-32 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center`}>
                            <Icon className="h-16 w-16" strokeWidth={1.5} />
                          </div>
                        </div>
                        <div className="text-center mt-4">
                          <p className={`font-semibold ${colors.text}`}>{step.title}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{t('benefits.title')}</h2>
              <p className="text-lg text-muted-foreground">{t('benefits.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="mb-6 h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('testimonials.title')}</h2>
              <p className="text-lg text-muted-foreground mt-4">{t('testimonials.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => {
                const colors = colorClasses[testimonial.color as keyof typeof colorClasses];
                return (
                  <div
                    key={index}
                    className="p-8 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className={`mb-4 h-12 w-12 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center text-xl font-bold`}>
                      {testimonial.author.substring(0, 2).toUpperCase()}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                );
              })}
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
                <Button
                  size="lg"
                  onClick={() => setIsDemoFormOpen(true)}
                  className="px-8 h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('cta.primaryButton')}
                </Button>
                <Link href="/login">
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

      {/* Demo Request Form Modal */}
      <DemoRequestForm isOpen={isDemoFormOpen} onClose={() => setIsDemoFormOpen(false)} />
    </PublicLayout>
  );
};

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
