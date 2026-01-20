'use server';

import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  I18N_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from './config';

/**
 * Detect locale from browser's Accept-Language header
 */
async function detectBrowserLocale(): Promise<SupportedLocale> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');

  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  // Parse Accept-Language header (e.g., "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7")
  const languages = acceptLanguage
    .split(',')
    .map((lang: string) => {
      const [locale, qValue] = lang.trim().split(';');
      const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
      // Extract base language code (e.g., "pl" from "pl-PL")
      const baseLocale = locale.split('-')[0].toLowerCase();
      return { locale: baseLocale, quality };
    })
    .sort(
      (a: { locale: string; quality: number }, b: { locale: string; quality: number }) =>
        b.quality - a.quality,
    );

  // Find first supported locale
  for (const { locale } of languages) {
    if (SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
      return locale as SupportedLocale;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Get the user's preferred locale from cookies, falling back to browser locale, then default
 * Validates that the locale is supported
 */
export async function getUserLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(I18N_COOKIE_NAME)?.value;

  // First priority: cookie value
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)) {
    return cookieLocale as SupportedLocale;
  }

  // Second priority: browser locale (without setting cookie during render)
  const browserLocale = await detectBrowserLocale();
  return browserLocale;
}

/**
 * Set the user's preferred locale in cookies
 * Validates that the locale is supported before setting
 */
export async function setUserLocale(locale: string): Promise<void> {
  const cookieStore = await cookies();

  // Validate locale is supported
  if (SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    cookieStore.set(I18N_COOKIE_NAME, locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
  } else {
    // Fallback to default if invalid locale provided
    cookieStore.set(I18N_COOKIE_NAME, DEFAULT_LOCALE, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
  }
}
