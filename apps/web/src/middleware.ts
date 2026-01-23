import createMiddleware from 'next-intl/middleware';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './i18n/config';

export default createMiddleware({
  // A list of all locales that are supported
  locales: SUPPORTED_LOCALES,

  // Used when no locale matches
  defaultLocale: DEFAULT_LOCALE,

  // Don't use locale prefix in URLs (optional, can be enabled later if needed)
  localePrefix: 'as-needed',
});

export const config = {
  // Match only internationalized pathnames
  // Include both locale-prefixed paths (e.g., /pl, /pl/about) and paths without locale
  matcher: ['/', '/(de|en|pl)', '/(de|en|pl)/:path*'],
};
