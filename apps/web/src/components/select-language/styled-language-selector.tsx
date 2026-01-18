'use client';

import { useTranslation } from '@refinedev/core';
import { SUPPORTED_LOCALES, LOCALE_METADATA } from '@i18n/config';
import { Globe } from 'lucide-react';

export const StyledLanguageSelector = () => {
  const { getLocale, changeLocale } = useTranslation();
  const currentLocale = getLocale();

  return (
    <div className="relative inline-flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <select
        value={currentLocale}
        onChange={(e) => changeLocale(e.target.value)}
        className="appearance-none bg-transparent border border-muted-foreground/20 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium cursor-pointer hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
        }}
      >
        {SUPPORTED_LOCALES.map((locale) => {
          const metadata = LOCALE_METADATA[locale];
          return (
            <option key={locale} value={locale}>
              {metadata.icon} {metadata.label}
            </option>
          );
        })}
      </select>
    </div>
  );
};
