'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SUPPORTED_LOCALES, LOCALE_METADATA, type SupportedLocale } from '@i18n/config';
import { setUserLocale } from '@i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/*/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { cn } from '@/*/lib/utils';
import { useEffect, useState } from 'react';

interface LocaleSwitcherProps {
  className?: string;
  initialLocale?: SupportedLocale;
}

export const LocaleSwitcher = ({ className, initialLocale }: LocaleSwitcherProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(
    initialLocale || ('en' as SupportedLocale),
  );

  // Update current locale when initialLocale changes (e.g., after page refresh)
  useEffect(() => {
    if (initialLocale) {
      setCurrentLocale(initialLocale);
    }
  }, [initialLocale]);

  const currentMetadata = LOCALE_METADATA[currentLocale];

  const handleLocaleChange = (newLocale: SupportedLocale) => {
    if (newLocale === currentLocale) return;

    startTransition(async () => {
      // Set the locale cookie
      await setUserLocale(newLocale);

      // Update local state immediately for better UX
      setCurrentLocale(newLocale);

      // Refresh the page to apply the new locale
      // We don't navigate to a locale-prefixed path since we use localePrefix: 'never'
      router.refresh();
    });
  };

  return (
    <div className={cn('relative', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md border border-input bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentMetadata.icon} {currentMetadata.nativeName}
          </span>
          <span className="sm:hidden">{currentMetadata.icon}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {SUPPORTED_LOCALES.map((locale) => {
            const metadata = LOCALE_METADATA[locale];
            const isActive = locale === currentLocale;

            return (
              <DropdownMenuItem
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className="flex items-center gap-2 cursor-pointer"
                disabled={isPending || isActive}
              >
                <span className="text-base">{metadata.icon}</span>
                <span className="flex-1">{metadata.nativeName}</span>
                {isActive && (
                  <span className="text-xs text-muted-foreground">({metadata.label})</span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
