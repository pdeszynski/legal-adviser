'use client';

import React from 'react';
import { StyledLanguageSelector } from '@components/select-language/styled-language-selector';
import Link from 'next/link';

import { useTranslations } from 'next-intl';

export const PublicLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const t = useTranslations('landing.footer');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center px-4 py-4">
          <Link href="/" className="font-bold text-xl hover:opacity-80 transition-opacity">
            Legal AI
          </Link>
          <div className="flex items-center gap-4">
            <StyledLanguageSelector />
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-background pt-16 pb-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-8 text-sm">
            <div className="space-y-4">
              <h4 className="font-bold text-lg">{t('brand.title')}</h4>
              <p className="text-muted-foreground max-w-xs">{t('brand.description')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('product.title')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('product.features')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('product.pricing')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('product.security')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('company.title')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('company.about')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('company.careers')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('company.contact')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('legal.title')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('legal.privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('legal.terms')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    {t('legal.cookie')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
            <p>{t('copyright', { year: new Date().getFullYear() })}</p>
            <div className="flex gap-4">
              {/* Social icons placeholders or simple links */}
              <Link href="#" className="hover:text-foreground transition-colors">
                Twitter
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                LinkedIn
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
