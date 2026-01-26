'use client';

import { useTranslations } from 'next-intl';
import { PublicLayout } from '@components/layout/public-layout';
import { Button } from '@legal/ui';
import Link from 'next/link';
import {
  Heart,
  Target,
  Lightbulb,
  Shield,
  Users,
  Award,
  Code,
  Mail,
  MapPin,
  Linkedin,
  Twitter,
  Github,
  ArrowRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { DemoRequestForm } from '@components/demo-request';

const AboutUsPage = () => {
  const t = useTranslations('aboutUs');
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false);

  const values = [
    {
      icon: Target,
      key: 'excellence',
    },
    {
      icon: Shield,
      key: 'integrity',
    },
    {
      icon: Lightbulb,
      key: 'innovation',
    },
    {
      icon: Heart,
      key: 'accessibility',
    },
  ];

  const journeySteps = [
    { year: '2024', key: 'step1' },
    { year: '2025', key: 'step2' },
    { year: '2026', key: 'step3' },
  ];

  const teamMembers = [
    {
      icon: Users,
      key: 'founders',
    },
    {
      icon: Award,
      key: 'advisors',
    },
    {
      icon: Code,
      key: 'engineers',
    },
  ];

  return (
    <PublicLayout>
      <div className="flex flex-col items-center bg-background text-foreground overflow-hidden">
        {/* Hero Section */}
        <section className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50/50 via-background to-background" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors border-rose-200 bg-rose-50 text-rose-700">
                <Heart className="mr-2 h-3 w-3" />
                {t('hero.badge')}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                {t('hero.title')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              <p className="max-w-[700px] text-muted-foreground text-lg sm:text-xl leading-relaxed mx-auto">
                {t('hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="w-full py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8 mb-16">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('mission.title')}</h2>
              <p className="text-lg text-muted-foreground">{t('mission.subtitle')}</p>
              <p className="text-base leading-relaxed">{t('mission.description')}</p>
            </div>

            <div className="max-w-5xl mx-auto">
              <h3 className="text-2xl font-bold text-center mb-12">{t('mission.values.title')}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value) => {
                  const Icon = value.icon;
                  return (
                    <div key={value.key} className="text-center">
                      <div className="mb-4 h-16 w-16 rounded-2xl bg-rose-100 dark:bg-rose-900 flex items-center justify-center mx-auto">
                        <Icon className="h-8 w-8 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
                      </div>
                      <h4 className="mb-2 font-bold">{t(`mission.values.${value.key}.title`)}</h4>
                      <p className="text-sm text-muted-foreground">{t(`mission.values.${value.key}.description`)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="w-full py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">{t('story.title')}</h2>
                <p className="text-lg text-muted-foreground mb-8">{t('story.subtitle')}</p>
                <p className="text-base leading-relaxed max-w-3xl mx-auto">
                  <span className="font-semibold text-rose-600 dark:text-rose-400">{t('story.founded')}</span>. {t('story.description')}
                </p>
              </div>

              <h3 className="text-2xl font-bold text-center mb-12">{t('story.journey.title')}</h3>
              <div className="relative">
                {/* Timeline Line */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-500 to-pink-500 -translate-x-1/2" />

                <div className="space-y-12">
                  {journeySteps.map((step, index) => {
                    const isEven = index % 2 === 0;
                    return (
                      <div
                        key={step.key}
                        className={`relative flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-center`}
                      >
                        {/* Year Badge */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                            {step.year}
                          </div>
                        </div>

                        {/* Content */}
                        <div className={`flex-1 ${isEven ? 'lg:text-right lg:pr-16' : 'lg:text-left lg:pl-16'} pt-8 lg:pt-0`}>
                          <div className="bg-background p-6 rounded-2xl border shadow-sm">
                            <div className="lg:hidden mb-4">
                              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white font-bold">
                                {step.year}
                              </div>
                            </div>
                            <h4 className="text-xl font-bold mb-2">{t(`story.journey.${step.key}.title`)}</h4>
                            <p className="text-muted-foreground">{t(`story.journey.${step.key}.description`)}</p>
                          </div>
                        </div>

                        {/* Empty space for alternating layout */}
                        <div className="flex-1 hidden lg:block" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="w-full py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">{t('team.title')}</h2>
              <p className="text-lg text-muted-foreground mb-4">{t('team.subtitle')}</p>
              <p className="text-base max-w-3xl mx-auto mb-16">{t('team.description')}</p>

              <div className="grid md:grid-cols-3 gap-8">
                {teamMembers.map((member) => {
                  const Icon = member.icon;
                  return (
                    <div key={member.key} className="p-8 rounded-2xl border bg-card hover:shadow-xl transition-shadow">
                      <div className="mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mx-auto">
                        <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{t(`team.members.${member.key}.title`)}</h3>
                      <p className="text-muted-foreground">{t(`team.members.${member.key}.description`)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="w-full py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">{t('contact.title')}</h2>
              <p className="text-lg text-muted-foreground mb-12">{t('contact.subtitle')}</p>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <a
                  href={`mailto:${t('contact.email')}`}
                  className="p-6 rounded-2xl bg-background border hover:shadow-lg transition-shadow"
                >
                  <Mail className="h-8 w-8 text-rose-600 mx-auto mb-4" />
                  <p className="font-semibold">{t('contact.email')}</p>
                </a>
                <div className="p-6 rounded-2xl bg-background border">
                  <MapPin className="h-8 w-8 text-rose-600 mx-auto mb-4" />
                  <p className="font-semibold">{t('contact.address')}</p>
                </div>
                <div className="p-6 rounded-2xl bg-background border">
                  <Users className="h-8 w-8 text-rose-600 mx-auto mb-4" />
                  <p className="font-semibold">{t('contact.socials.title')}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={() => setIsDemoFormOpen(true)}
                  className="px-8 h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('cta.getStarted')}
                </Button>
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 h-12 rounded-full text-lg"
                  >
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

export default AboutUsPage;
