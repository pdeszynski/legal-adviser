'use client';

import { useState, useEffect } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { Header } from '@components/layout/header';
import { Menu } from '@components/menu';
import { LegalDisclaimerModal } from '@components/legal-disclaimer-modal';
import { CenteredPageSkeleton } from '@/components/skeleton';
import { useAuthGuard } from '@/lib/auth-guard';
import type { SupportedLocale } from '@i18n/config';

interface UserIdentity {
  id: string;
  email: string;
  disclaimerAccepted: boolean;
  [key: string]: unknown;
}

interface MainLayoutProps {
  children: React.ReactNode;
  initialLocale?: SupportedLocale;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, initialLocale }) => {
  const { data: identity, refetch, isLoading: isIdentityLoading } = useGetIdentity<UserIdentity>();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Initialize auth guard for client-side route protection
  useAuthGuard({
    enableFocusRefresh: true,
    expiryBufferSeconds: 60,
  });

  useEffect(() => {
    // Only check disclaimer after identity is fully loaded
    if (!isIdentityLoading && identity) {
      // Show disclaimer modal if user has not accepted it
      if (identity.disclaimerAccepted === false) {
        setShowDisclaimer(true);
      } else {
        setShowDisclaimer(false);
      }
    }
  }, [identity, isIdentityLoading]);

  // Show loading state while identity is being fetched
  if (isIdentityLoading || !identity) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <CenteredPageSkeleton />
      </div>
    );
  }

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    // Refetch user identity to get updated data
    refetch();
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <Header initialLocale={initialLocale} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-muted/40 hidden md:block">
          <Menu />
        </aside>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-6xl w-full">{children}</div>
        </main>
      </div>

      {/* Legal Disclaimer Modal - shown for users who haven't accepted */}
      {showDisclaimer && <LegalDisclaimerModal onAccept={handleDisclaimerAccept} />}
    </div>
  );
};
