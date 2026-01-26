'use client';

import { useState } from 'react';
import { useTranslate } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@legal/ui';
import { Globe, Moon, Clock, Calendar } from 'lucide-react';
import {
  useUpdateMyPreferencesMutation,
  type ThemePreference,
} from '@/generated/graphql';

interface PreferencesFormData {
  locale?: string;
  theme?: ThemePreference;
  timezone?: string;
  dateFormat?: string;
}

interface UserPreferencesData {
  id: string;
  locale: string;
  theme: ThemePreference;
  timezone?: string | null;
  dateFormat?: string | null;
}

interface SettingsPreferencesProps {
  readonly preferences: UserPreferencesData;
  readonly onUpdateSuccess?: () => void;
}

export function SettingsPreferences({ preferences, onUpdateSuccess }: SettingsPreferencesProps) {
  const translate = useTranslate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the generated GraphQL Codegen hook
  const updatePreferencesMutation = useUpdateMyPreferencesMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PreferencesFormData>({
    defaultValues: {
      locale: preferences.locale,
      theme: preferences.theme,
      timezone: preferences.timezone || '',
      dateFormat: preferences.dateFormat || '',
    },
  });

  const onSubmit = async (data: PreferencesFormData) => {
    setIsSuccess(false);
    setError(null);

    try {
      // Use the generated mutation hook with type-safe input
      await updatePreferencesMutation.mutateAsync({
        input: {
          locale: data.locale,
          theme: data.theme,
          timezone: data.timezone || null,
          dateFormat: data.dateFormat || null,
        },
      });

      setIsSuccess(true);
      onUpdateSuccess?.();
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : translate('settings.preferences.errorMessage'));
    }
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
            isLoading={updatePreferencesMutation.isPending}
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
