'use client';

import { useState, useEffect } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { Header } from '@components/layout/header';
import { Menu } from '@components/menu';
import { LegalDisclaimerModal } from '@components/legal-disclaimer-modal';

interface UserIdentity {
  id: string;
  email: string;
  disclaimerAccepted: boolean;
  [key: string]: unknown;
}

export const MainLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: identity, refetch, isLoading: isIdentityLoading } = useGetIdentity<UserIdentity>();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
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
      <Header />
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
