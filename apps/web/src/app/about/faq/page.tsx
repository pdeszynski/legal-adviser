'use client';

import { useTranslations } from 'next-intl';
import { PublicLayout } from '@components/layout/public-layout';
import { Button } from '@legal/ui';
import Link from 'next/link';
import { HelpCircle, Mail, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const FAQPage = () => {
  const t = useTranslations('faqPage');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    general: true,
  });

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const categoryKeys = ['general', 'pricing', 'features', 'security', 'technical'] as const;
  const categoryIcons: Record<string, React.ElementType> = {
    general: HelpCircle,
    pricing: HelpCircle,
    features: HelpCircle,
    security: HelpCircle,
    technical: HelpCircle,
  };

  return (
    <PublicLayout>
      <div className="flex flex-col items-center bg-background text-foreground overflow-hidden">
        {/* Hero Section */}
        <section className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-50/50 via-background to-background" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors border-purple-200 bg-purple-50 text-purple-700">
                <HelpCircle className="mr-2 h-3 w-3" />
                {t('hero.badge')}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                {t('hero.title')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              <p className="max-w-[700px] text-muted-foreground text-lg sm:text-xl leading-relaxed mx-auto">
                {t('hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {categoryKeys.map((categoryKey) => {
                const category = t(`questions.${categoryKey}`) as any;
                const Icon = categoryIcons[categoryKey];
                const isOpen = openCategories[categoryKey];

                return (
                  <div
                    key={categoryKey}
                    className="bg-background rounded-2xl border overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(categoryKey)}
                      className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-lg">{category.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category.items.length} {t('questions')}
                          </p>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-6 space-y-4">
                        {category.items.map((item: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl bg-muted/50">
                            <h4 className="font-semibold mb-2">{item.question}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="w-full py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                {t('contact.title')}
              </h2>
              <p className="text-lg text-muted-foreground">{t('contact.description')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href={`mailto:${t('contact.email')}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {t('contact.cta')}
                </a>
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
    </PublicLayout>
  );
};

export default FAQPage;
