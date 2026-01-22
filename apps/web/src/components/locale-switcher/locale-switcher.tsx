'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

interface LocaleSwitcherProps {
  className?: string;
}

export const LocaleSwitcher = ({ className }: LocaleSwitcherProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const getCurrentLocale = (): SupportedLocale => {
    // Extract locale from pathname or default to 'en'
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment && SUPPORTED_LOCALES.includes(firstSegment as SupportedLocale)) {
      return firstSegment as SupportedLocale;
    }

    return 'en';
  };

  const currentLocale = getCurrentLocale();
  const currentMetadata = LOCALE_METADATA[currentLocale];

  const handleLocaleChange = (newLocale: SupportedLocale) => {
    startTransition(async () => {
      // Set the locale cookie
      await setUserLocale(newLocale);

      // Update URL to include the new locale prefix
      const segments = pathname.split('/').filter(Boolean);
      const hasLocalePrefix = SUPPORTED_LOCALES.includes(segments[0] as SupportedLocale);

      let newPathname: string;
      if (hasLocalePrefix) {
        // Replace existing locale prefix
        segments[0] = newLocale;
        newPathname = '/' + segments.join('/');
      } else {
        // Add locale prefix
        newPathname = '/' + newLocale + pathname;
      }

      router.push(newPathname);
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
                  <span className="text-xs text-muted-foreground">
                    ({metadata.label})
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
