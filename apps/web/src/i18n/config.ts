export const I18N_COOKIE_NAME = 'NEXT_LOCALE';
export const DEFAULT_LOCALE = 'en';

/**
 * Supported locales for the application
 * English is the default, with support for German and Polish
 */
export const SUPPORTED_LOCALES = ['en', 'de', 'pl'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Locale display names and metadata
 */
export const LOCALE_METADATA: Record<
  SupportedLocale,
  { label: string; icon: string; nativeName: string }
> = {
  en: {
    label: 'English',
    icon: '🇬🇧',
    nativeName: 'English',
  },
  de: {
    label: 'Deutsch',
    icon: '🇩🇪',
    nativeName: 'Deutsch',
  },
  pl: {
    label: 'Polski',
    icon: '🇵🇱',
    nativeName: 'Polski',
  },
};
