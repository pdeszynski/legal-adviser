'use client';

import { useGetIdentity, useLogout, useTranslation } from '@refinedev/core';
import { LocaleSwitcher } from '@components/locale-switcher';
import { Button } from '@legal/ui';
import { NotificationBell } from '@components/dashboard';
import { useNotifications, type InAppNotification } from '@/hooks/useNotifications';
import { OmnisearchBar } from '@components/search';
import type { SupportedLocale } from '@i18n/config';

interface UserIdentity {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface HeaderProps {
  initialLocale?: SupportedLocale;
}

export const Header = ({ initialLocale }: HeaderProps) => {
  const { translate } = useTranslation();
  const { mutate: logout } = useLogout();
  const { data: user, isLoading: isUserLoading } = useGetIdentity<UserIdentity>();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const displayName =
    user?.name ||
    (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email);

  const handleNotificationClick = (notification: InAppNotification) => {
    // Mark the notification as read
    markAsRead(notification.id);
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6 shadow-sm">
      <div className="flex flex-1 items-center gap-4">
        <OmnisearchBar />
      </div>

      <div className="flex items-center gap-4">
        <LocaleSwitcher initialLocale={initialLocale} />

        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={markAllAsRead}
        />

        {!isUserLoading && displayName && (
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
