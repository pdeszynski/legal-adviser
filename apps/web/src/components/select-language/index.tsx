"use client";

import { useTranslation } from "@refinedev/core";
import { SUPPORTED_LOCALES, LOCALE_METADATA } from "@i18n/config";

export const SelectLanguage = () => {
  const { getLocale, changeLocale } = useTranslation();
  const currentLocale = getLocale();

  return (
    <div>
      <select
        value={currentLocale}
        onChange={(e) => changeLocale(e.target.value)}
      >
        {SUPPORTED_LOCALES.map((locale) => {
          const metadata = LOCALE_METADATA[locale];
          return (
            <option key={locale} value={locale}>
              {metadata.label} {metadata.icon}
            </option>
          );
        })}
      </select>
    </div>
  );
};
