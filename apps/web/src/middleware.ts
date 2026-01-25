import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, I18N_COOKIE_NAME } from './i18n/config';

// Cookie keys for authentication (must match auth-provider.server.ts)
const AUTH_COOKIE = 'auth';
const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Check if the user is authenticated by verifying auth cookies
 */
function isAuthenticated(request: NextRequest): boolean {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE);
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE);
  const auth = request.cookies.get(AUTH_COOKIE);

  // User is authenticated if they have access token and auth data,
  // or if they have a refresh token (client will handle refresh)
  return !!(accessToken?.value && auth?.value) || !!(refreshToken?.value && auth?.value);
}

/**
 * Check if the user has admin role
 */
function hasAdminRole(request: NextRequest): boolean {
  const auth = request.cookies.get(AUTH_COOKIE);

  if (!auth?.value) {
    return false;
  }

  try {
    const parsedAuth = JSON.parse(auth.value);
    const roles = parsedAuth.roles || [];
    return Array.isArray(roles) && roles.includes('admin');
  } catch {
    return false;
  }
}

/**
 * Check if the pathname is an admin route
 */
function isAdminRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

/**
 * Protected route patterns that require authentication
 */
const PROTECTED_ROUTE_PATTERNS = [
  /^\/dashboard/,
  /^\/settings/,
  /^\/documents/,
  /^\/chat/,
  /^\/rulings/,
  /^\/templates/,
  /^\/notifications/,
  /^\/billing/,
  /^\/usage/,
  /^\/audit-logs/,
  /^\/analyze-case/,
  /^\/advanced-search/,
  /^\/admin/,
];

/**
 * Public routes that should not trigger auth checks
 */
const PUBLIC_ROUTE_PATTERNS = [
  /^\/login/,
  /^\/register/,
  /^\/forgot-password/,
  /^\/update-password/,
  /^\/demo/,
  /^\/waitlist/,
  /^\/$/, // homepage
  /^\/favicon/,
  /^\/_next/,
  /^\/api/,
];

/**
 * Check if a route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  // Skip static files and API routes
  if (PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return false;
  }
  // Check if it matches protected patterns
  return PROTECTED_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protected route authentication check - must come before locale handling
  if (isProtectedRoute(pathname)) {
    // Check if user is authenticated
    if (!isAuthenticated(request)) {
      const loginUrl = new URL('/login', request.url);
      // Include query parameters in the redirect
      const fullPath = request.nextUrl.pathname + request.nextUrl.search;
      loginUrl.searchParams.set('redirect', fullPath);
      return NextResponse.redirect(loginUrl);
    }

    // For admin routes, also check admin role
    if (isAdminRoute(pathname) && !hasAdminRole(request)) {
      // Non-admin users trying to access admin routes are redirected to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

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
