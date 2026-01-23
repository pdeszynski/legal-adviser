import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, I18N_COOKIE_NAME } from './i18n/config';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  // If pathname has a locale prefix, strip it and redirect to the path without locale
  // Set the locale cookie based on the URL locale
  if (pathnameHasLocale) {
    const localeMatch = pathname.match(/^\/(en|de|pl)(\/.*)?$/);
    if (localeMatch) {
      const locale = localeMatch[1];
      const rest = localeMatch[2] || '/';

      // Create a redirect response that sets the locale cookie
      const response = NextResponse.redirect(new URL(rest, request.url));
      response.cookies.set(I18N_COOKIE_NAME, locale, {
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax',
      });
      return response;
    }
  }

  // No locale in path - ensure locale cookie is set
  const cookieLocale = request.cookies.get(I18N_COOKIE_NAME)?.value;

  // If no cookie locale, detect from header and set cookie
  if (!cookieLocale) {
    const acceptLanguageLocale = request.headers
      .get('accept-language')
      ?.split(',')[0]
      ?.split('-')[0];
    const detectedLocale =
      acceptLanguageLocale && SUPPORTED_LOCALES.includes(acceptLanguageLocale as any)
        ? acceptLanguageLocale
        : DEFAULT_LOCALE;

    const response = NextResponse.next();
    response.cookies.set(I18N_COOKIE_NAME, detectedLocale, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
    return response;
  }

  // Validate that the cookie locale is still supported
  if (!SUPPORTED_LOCALES.includes(cookieLocale as any)) {
    const response = NextResponse.next();
    response.cookies.set(I18N_COOKIE_NAME, DEFAULT_LOCALE, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Match all pathnames except for API routes, _next, and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
