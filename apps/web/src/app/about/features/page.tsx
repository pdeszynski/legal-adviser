'use client';

import { useTranslations } from 'next-intl';
import { PublicLayout } from '@components/layout/public-layout';
import { Button } from '@legal/ui';
import Link from 'next/link';
import {
  FileText,
  MessageSquare,
  Search,
  Share,
  MessageCircle,
  History,
  FileStack,
  Lock,
  Shield,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import { DemoRequestForm } from '@components/demo-request';

const FeaturesPage = () => {
  const t = useTranslations('features');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false);

  const iconMap: Record<string, React.ElementType> = {
    analysis: FileText,
    document: FileStack,
    chat: MessageSquare,
    search: Search,
    share: Share,
    comment: MessageCircle,
    history: History,
    template: FileStack,
    lock: Lock,
    shield: Shield,
  };

  const categories = [
    { key: 'all', label: t('categories.all') },
    { key: 'core', label: t('categories.core.title') },
    { key: 'advanced', label: t('categories.advanced.title') },
    { key: 'collaboration', label: t('categories.collaboration.title') },
    { key: 'security', label: t('categories.security.title') },
  ];

  const categoryMap: Record<string, string[]> = {
    core: ['caseAnalysis', 'documentGeneration', 'legalQA', 'caseLawSearch'],
    advanced: ['caseAnalysis', 'legalQA', 'caseLawSearch'],
    collaboration: ['documentSharing', 'comments', 'versionHistory'],
    security: ['encryption', 'compliance'],
  };

  const features = [
    'caseAnalysis',
    'documentGeneration',
    'legalQA',
    'caseLawSearch',
    'documentSharing',
    'comments',
    'versionHistory',
    'templates',
    'encryption',
    'compliance',
  ];

  const filteredFeatures = activeCategory === 'all'
    ? features
    : categoryMap[activeCategory] || [];

  return (
    <PublicLayout>
      <div className="flex flex-col items-center bg-background text-foreground overflow-hidden">
        {/* Hero Section */}
        <section className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/50 via-background to-background" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors border-amber-200 bg-amber-50 text-amber-700">
                <Lightbulb className="mr-2 h-3 w-3" />
                {t('hero.badge')}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                {t('hero.title')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              <p className="max-w-[700px] text-muted-foreground text-lg sm:text-xl leading-relaxed mx-auto">
                {t('hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Category Tabs */}
        <section className="w-full py-8 bg-background border-b">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category.key
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full py-16 bg-muted/30 min-h-[600px]">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFeatures.map((featureKey) => {
                const feature = t(`features.${featureKey}`) as any;
                const Icon = iconMap[feature.icon] || Sparkles;

                return (
                  <div
                    key={featureKey}
                    className="group relative overflow-hidden rounded-2xl bg-background border p-8 transition-all hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl" />
                    <div className="relative">
                      <div className="mb-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="h-7 w-7 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
                      </div>
                      <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {feature.description}
                      </p>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredFeatures.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">{t('noFeatures')}</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                {t('cta.title')}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={() => setIsDemoFormOpen(true)}
                  className="px-8 h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t('cta.getStarted')}
                </Button>
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 h-12 rounded-full text-lg"
                  >
                    {t('navigation.backToAbout')}
                    <ArrowRight className="ml-2 h-4 w-4" />
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

export default FeaturesPage;
