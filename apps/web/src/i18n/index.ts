"use server";

import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  I18N_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "./config";

/**
 * Get the user's preferred locale from cookies, falling back to default
 * Validates that the locale is supported
 */
export async function getUserLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(I18N_COOKIE_NAME)?.value;

  // Validate locale is supported, fallback to default if not
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)) {
    return cookieLocale as SupportedLocale;
  }

  return DEFAULT_LOCALE;
}

/**
 * Set the user's preferred locale in cookies
 * Validates that the locale is supported before setting
 */
export async function setUserLocale(locale: string): Promise<void> {
  const cookieStore = await cookies();

  // Validate locale is supported
  if (SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    cookieStore.set(I18N_COOKIE_NAME, locale);
  } else {
    // Fallback to default if invalid locale provided
    cookieStore.set(I18N_COOKIE_NAME, DEFAULT_LOCALE);
  }
}
