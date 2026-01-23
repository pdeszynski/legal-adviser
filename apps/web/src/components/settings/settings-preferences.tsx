'use client';

import { useState } from 'react';
import { useTranslate, useCustomMutation } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@legal/ui';
import { Globe, Moon, Cpu, Clock, Calendar } from 'lucide-react';

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

interface UpdatePreferencesInput {
  locale?: string;
  theme?: string;
  aiModel?: string;
  timezone?: string;
  dateFormat?: string;
}

export function SettingsPreferences({ preferences }: { preferences: UserPreferences }) {
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
    formState: { errors, isDirty },
  } = useForm<UpdatePreferencesInput>({
    defaultValues: {
      locale: preferences.locale,
      theme: preferences.theme,
      aiModel: preferences.aiModel,
      timezone: preferences.timezone || '',
      dateFormat: preferences.dateFormat || '',
    },
  });

  const onSubmit = (data: UpdatePreferencesInput) => {
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
          fields: ['id', 'locale', 'theme', 'aiModel', 'timezone', 'dateFormat'],
        },
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 3000);
        },
        onError: (err: unknown) => {
          setError(
            err instanceof Error ? err.message : translate('settings.preferences.errorMessage'),
          );
        },
      },
    );
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1">{translate('settings.preferences.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {translate('settings.preferences.description')}
        </p>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-700 dark:text-green-300 flex items-center gap-2">
          {translate('settings.preferences.successMessage')}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Locale */}
        <div className="space-y-2">
          <label htmlFor="locale" className="block text-sm font-medium">
            {translate('settings.preferences.fields.locale')}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Globe className="h-4 w-4" />
            </div>
            <select
              id="locale"
              {...register('locale', { required: translate('validation.required') })}
              className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
            >
              <option value="en">English</option>
              <option value="pl">Polski</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          {errors.locale && <p className="text-sm text-red-500">{errors.locale.message}</p>}
        </div>

        {/* Theme */}
        <div className="space-y-2">
          <label htmlFor="theme" className="block text-sm font-medium">
            {translate('settings.preferences.fields.theme')}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Moon className="h-4 w-4" />
            </div>
            <select
              id="theme"
              {...register('theme', { required: translate('validation.required') })}
              className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
            >
              <option value="SYSTEM">System</option>
              <option value="LIGHT">Light</option>
              <option value="DARK">Dark</option>
            </select>
          </div>
          {errors.theme && <p className="text-sm text-red-500">{errors.theme.message}</p>}
        </div>

        {/* AI Model */}
        <div className="space-y-2">
          <label htmlFor="aiModel" className="block text-sm font-medium">
            {translate('settings.preferences.fields.aiModel')}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Cpu className="h-4 w-4" />
            </div>
            <select
              id="aiModel"
              {...register('aiModel', { required: translate('validation.required') })}
              className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
            >
              <option value="GPT_4_TURBO">GPT-4 Turbo (Recommended)</option>
              <option value="GPT_4">GPT-4</option>
              <option value="GPT_3_5_TURBO">GPT-3.5 Turbo</option>
              <option value="CLAUDE_3_OPUS">Claude 3 Opus</option>
              <option value="CLAUDE_3_SONNET">Claude 3 Sonnet</option>
            </select>
          </div>
          {errors.aiModel && <p className="text-sm text-red-500">{errors.aiModel.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timezone */}
          <div className="space-y-2">
            <label htmlFor="timezone" className="block text-sm font-medium">
              {translate('settings.preferences.fields.timezone')}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
              <select
                id="timezone"
                {...register('timezone')}
                className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
              >
                <option value="">Select timezone</option>
                <option value="Europe/Warsaw">Europe/Warsaw</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
          </div>

          {/* Date Format */}
          <div className="space-y-2">
            <label htmlFor="dateFormat" className="block text-sm font-medium">
              {translate('settings.preferences.fields.dateFormat')}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
              </div>
              <select
                id="dateFormat"
                {...register('dateFormat')}
                className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
              >
                <option value="">Select format</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-border mt-8">
          <LoadingButton
            type="submit"
            isLoading={isLoading}
            loadingText={translate('settings.preferences.saving')}
            disabled={!isDirty}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6"
          >
            {translate('settings.preferences.saveButton')}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
