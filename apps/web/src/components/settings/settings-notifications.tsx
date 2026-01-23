'use client';

import { useState } from 'react';
import { useTranslate, useCustomMutation } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@legal/ui';

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

interface UpdateNotificationsInput {
  notificationPreferences?: {
    documentUpdates?: boolean;
    queryResponses?: boolean;
    systemAlerts?: boolean;
    marketingEmails?: boolean;
    channels?: {
      email?: boolean;
      inApp?: boolean;
      push?: boolean;
    };
  };
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
}

export function SettingsNotifications({ preferences }: { preferences: UserPreferences }) {
  const translate = useTranslate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate, mutation } = useCustomMutation();
  const isLoading =
    (mutation as { isLoading?: boolean } | undefined)?.isLoading ??
    (mutation as { isPending?: boolean } | undefined)?.isPending ??
    false;

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<UpdateNotificationsInput>({
    defaultValues: {
      notificationPreferences: {
        documentUpdates: preferences.notificationPreferences.documentUpdates,
        queryResponses: preferences.notificationPreferences.queryResponses,
        systemAlerts: preferences.notificationPreferences.systemAlerts,
        marketingEmails: preferences.notificationPreferences.marketingEmails,
        channels: {
          email: preferences.notificationPreferences.channels.email,
          inApp: preferences.notificationPreferences.channels.inApp,
          push: preferences.notificationPreferences.channels.push,
        },
      },
      emailNotifications: preferences.emailNotifications,
      inAppNotifications: preferences.inAppNotifications,
    },
  });

  const onSubmit = (data: UpdateNotificationsInput) => {
    setIsSuccess(false);
    setError(null);

    mutate(
      {
        url: '',
        method: 'post',
        values: {
          operation: 'updateMyPreferences',
          variables: {
            input: data,
          },
          fields: ['id', 'notificationPreferences', 'emailNotifications', 'inAppNotifications'],
        },
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 3000);
        },
        onError: (err: unknown) => {
          setError(
            err instanceof Error ? err.message : translate('settings.notifications.errorMessage'),
          );
        },
      },
    );
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">{translate('settings.notifications.title')}</h2>
        <p className="text-gray-600">{translate('settings.notifications.description')}</p>
      </div>

      {isSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {translate('settings.notifications.successMessage')}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            {translate('settings.notifications.sections.types')}
          </h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('notificationPreferences.documentUpdates')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                {translate('settings.notifications.fields.documentUpdates')}
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('notificationPreferences.queryResponses')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                {translate('settings.notifications.fields.queryResponses')}
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('notificationPreferences.systemAlerts')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                {translate('settings.notifications.fields.systemAlerts')}
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('notificationPreferences.marketingEmails')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                {translate('settings.notifications.fields.marketingEmails')}
              </span>
            </label>
          </div>
        </div>

        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            {translate('settings.notifications.sections.channels')}
          </h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('notificationPreferences.channels.email')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                {translate('settings.notifications.fields.email')}
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('notificationPreferences.channels.inApp')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                {translate('settings.notifications.fields.inApp')}
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('notificationPreferences.channels.push')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                {translate('settings.notifications.fields.push')}
              </span>
            </label>
          </div>
        </div>

        {/* Legacy Settings (for backward compatibility) */}
        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            {translate('settings.notifications.sections.legacy')}
          </h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('emailNotifications')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                {translate('settings.notifications.fields.emailNotifications')}
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('inAppNotifications')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                {translate('settings.notifications.fields.inAppNotifications')}
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <LoadingButton
            type="submit"
            isLoading={isLoading}
            loadingText={translate('settings.notifications.saving')}
            disabled={!isDirty}
          >
            {translate('settings.notifications.saveButton')}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
