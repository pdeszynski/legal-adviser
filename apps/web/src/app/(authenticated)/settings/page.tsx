'use client';

import { useState } from 'react';
import { useTranslate, useCustom } from '@refinedev/core';
import { SettingsProfile } from '@/components/settings/settings-profile';
import { SettingsPreferences } from '@/components/settings/settings-preferences';
import { SettingsSecurity } from '@/components/settings/settings-security';
import { SettingsNotifications } from '@/components/settings/settings-notifications';
import { SettingsApiKeys } from '@/components/settings/settings-api-keys';

type SettingsTab = 'profile' | 'preferences' | 'security' | 'notifications' | 'apiKeys';

interface User {
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
  const { query: userQuery, result: userData } = useCustom<User>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'me',
        fields: ['id', 'email', 'username', 'firstName', 'lastName'],
      },
    },
  });
  const { isLoading: userLoading } = userQuery;

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
    { id: 'profile' as const, label: translate('settings.tabs.profile') },
    { id: 'preferences' as const, label: translate('settings.tabs.preferences') },
    { id: 'security' as const, label: translate('settings.tabs.security') },
    { id: 'notifications' as const, label: translate('settings.tabs.notifications') },
    { id: 'apiKeys' as const, label: translate('settings.tabs.apiKeys') },
  ];

  const user = userData?.data;
  const preferences = preferencesData?.data;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{translate('settings.title')}</h1>
        <p className="text-gray-600">{translate('settings.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {userLoading || preferencesLoading ? (
          <div className="p-8 text-center text-gray-500">{translate('loading')}</div>
        ) : (
          <>
            {activeTab === 'profile' && user && <SettingsProfile user={user} />}
            {activeTab === 'preferences' && preferences && (
              <SettingsPreferences preferences={preferences} />
            )}
            {activeTab === 'security' && <SettingsSecurity />}
            {activeTab === 'notifications' && preferences && (
              <SettingsNotifications preferences={preferences} />
            )}
            {activeTab === 'apiKeys' && <SettingsApiKeys />}
          </>
        )}
      </div>
    </div>
  );
}
