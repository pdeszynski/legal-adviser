'use client';

import { useGetIdentity, useLogout, useTranslation } from '@refinedev/core';
import { SelectLanguage } from '@components/select-language';
import { Button } from '@legal/ui';

interface UserIdentity {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const Header = () => {
  const { translate } = useTranslation();
  const { mutate: logout } = useLogout();
  const { data: user } = useGetIdentity<UserIdentity>();

  const displayName =
    user?.name ||
    (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6 shadow-sm">
      <div className="flex flex-1 items-center gap-4">
        {/* Placeholder for future specific header content (e.g. Breadcrumbs) */}
      </div>

      <div className="flex items-center gap-4">
        <SelectLanguage />

        {displayName && (
          <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
            {displayName}
          </span>
        )}

        <Button variant="outline" size="sm" onClick={() => logout()}>
          {translate('buttons.logout')}
        </Button>
      </div>
    </header>
  );
};
