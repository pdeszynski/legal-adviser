'use server';

import { getUserLocale } from '@i18n';
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './config';

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  // Ensure locale is supported, fallback to default
  const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;

  return {
    locale: validLocale,
    messages: (await import(`../../public/locales/${validLocale}/common.json`)).default,
  };
});
