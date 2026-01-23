'use client';

import { useState } from 'react';
import { useTranslate, useCustomMutation } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@legal/ui';
import { Bell, Mail } from 'lucide-react';

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
        documentUpdates: preferences?.notificationPreferences?.documentUpdates ?? false,
        queryResponses: preferences?.notificationPreferences?.queryResponses ?? false,
        systemAlerts: preferences?.notificationPreferences?.systemAlerts ?? false,
        marketingEmails: preferences?.notificationPreferences?.marketingEmails ?? false,
        channels: {
          email: preferences?.notificationPreferences?.channels?.email ?? false,
          inApp: preferences?.notificationPreferences?.channels?.inApp ?? false,
          push: preferences?.notificationPreferences?.channels?.push ?? false,
        },
      },
      emailNotifications: preferences?.emailNotifications ?? false,
      inAppNotifications: preferences?.inAppNotifications ?? false,
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
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1">{translate('settings.notifications.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {translate('settings.notifications.description')}
        </p>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-700 dark:text-green-300 flex items-center gap-2">
          {translate('settings.notifications.successMessage')}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Notification Types */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {translate('settings.notifications.sections.types')}
          </h3>
          <div className="space-y-1 bg-card border border-border rounded-xl p-4">
            <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                {...register('notificationPreferences.documentUpdates')}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <span className="ml-3 text-sm">
                {translate('settings.notifications.fields.documentUpdates')}
              </span>
            </label>

            <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                {...register('notificationPreferences.queryResponses')}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <span className="ml-3 text-sm">
                {translate('settings.notifications.fields.queryResponses')}
              </span>
            </label>

            <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                {...register('notificationPreferences.systemAlerts')}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <span className="ml-3 text-sm">
                {translate('settings.notifications.fields.systemAlerts')}
              </span>
            </label>

            <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                {...register('notificationPreferences.marketingEmails')}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <span className="ml-3 text-sm">
                {translate('settings.notifications.fields.marketingEmails')}
              </span>
            </label>
          </div>
        </div>

        {/* Notification Channels */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {translate('settings.notifications.sections.channels')}
          </h3>
          <div className="space-y-1 bg-card border border-border rounded-xl p-4">
            <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                {...register('notificationPreferences.channels.email')}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <span className="ml-3 text-sm">
                {translate('settings.notifications.fields.email')}
              </span>
            </label>

            <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                {...register('notificationPreferences.channels.inApp')}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <span className="ml-3 text-sm">
                {translate('settings.notifications.fields.inApp')}
              </span>
            </label>

            <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                {...register('notificationPreferences.channels.push')}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <span className="ml-3 text-sm">
                {translate('settings.notifications.fields.push')}
              </span>
            </label>
          </div>
        </div>

        {/* Legacy Settings (for backward compatibility) */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
            {translate('settings.notifications.sections.legacy')}
          </h3>
          <div className="space-y-1 bg-muted/30 border border-border rounded-xl p-4">
            <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                {...register('emailNotifications')}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <span className="ml-3 text-sm">
                {translate('settings.notifications.fields.emailNotifications')}
              </span>
            </label>

            <label className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                {...register('inAppNotifications')}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <span className="ml-3 text-sm">
                {translate('settings.notifications.fields.inAppNotifications')}
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-border mt-8">
          <LoadingButton
            type="submit"
            isLoading={isLoading}
            loadingText={translate('settings.notifications.saving')}
            disabled={!isDirty}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6"
          >
            {translate('settings.notifications.saveButton')}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
