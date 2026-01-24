'use client';

import { useState } from 'react';
import { useTranslate, useCustom, useGetIdentity } from '@refinedev/core';
import { SettingsProfile } from '@/components/settings/settings-profile';
import { SettingsPreferences } from '@/components/settings/settings-preferences';
import { SettingsSecurity } from '@/components/settings/settings-security';
import { SettingsNotifications } from '@/components/settings/settings-notifications';
import { SettingsApiKeys } from '@/components/settings/settings-api-keys';
import { SettingsTabSkeleton } from '@/components/skeleton';
import { User, Settings, Shield, Bell, Key, Menu } from 'lucide-react';
import { cn } from '@legal/ui';

type SettingsTab = 'profile' | 'preferences' | 'security' | 'notifications' | 'apiKeys';

interface UserIdentity {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface UserPreferences {
  id: string;
  userId: string;
  locale: string;
  theme: string;
  aiModel: string;
  notificationPreferences: {
    documentUpdates: boolean;
    queryResponses: boolean;
    systemAlerts: boolean;
    marketingEmails: boolean;
    channels: {
      email: boolean;
      inApp: boolean;
      push: boolean;
    };
  };
  emailNotifications: boolean;
  inAppNotifications: boolean;
  timezone?: string | null;
  dateFormat?: string | null;
}

export default function SettingsPage() {
  const translate = useTranslate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Fetch current user data
  const { data: userData, isLoading: userLoading, refetch: refetchUser } = useGetIdentity<UserIdentity>();

  // Fetch user preferences
  const { query: preferencesQuery, result: preferencesData } = useCustom<UserPreferences>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'myPreferences',
        fields: [
          'id',
          'userId',
          'locale',
          'theme',
          'aiModel',
          'notificationPreferences',
          'emailNotifications',
          'inAppNotifications',
          'timezone',
          'dateFormat',
        ],
      },
    },
  });
  const { isLoading: preferencesLoading } = preferencesQuery;

  const tabs = [
    { id: 'profile' as const, label: translate('settings.tabs.profile'), icon: User },
    { id: 'preferences' as const, label: translate('settings.tabs.preferences'), icon: Settings },
    { id: 'security' as const, label: translate('settings.tabs.security'), icon: Shield },
    { id: 'notifications' as const, label: translate('settings.tabs.notifications'), icon: Bell },
    { id: 'apiKeys' as const, label: translate('settings.tabs.apiKeys'), icon: Key },
  ];

  const user = userData;
  const preferences = preferencesData?.data;
  const isLoading = userLoading || preferencesLoading;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{translate('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{translate('settings.subtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap md:whitespace-normal',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-h-[500px]">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {isLoading ? (
              <SettingsTabSkeleton variant={activeTab} />
            ) : (
              <>
                <div className="mb-6 pb-6 border-b border-border">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    {tabs.find((t) => t.id === activeTab)?.label}
                  </h2>
                </div>

                {activeTab === 'profile' && user && <SettingsProfile user={user} onProfileUpdate={refetchUser} />}
                {activeTab === 'preferences' && preferences && (
                  <SettingsPreferences preferences={preferences} />
                )}
                {activeTab === 'security' && <SettingsSecurity />}
                {activeTab === 'notifications' && preferences && (
                  <SettingsNotifications preferences={preferences} />
                )}
                {activeTab === 'apiKeys' && <SettingsApiKeys isActive={activeTab === 'apiKeys'} />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
