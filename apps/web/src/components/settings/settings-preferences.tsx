'use client';

import { useState } from 'react';
import { useTranslate, useCustomMutation } from '@refinedev/core';
import { useForm } from 'react-hook-form';

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
  const isLoading = (mutation as any).isLoading ?? (mutation as any).isPending ?? false;

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
        url: '/updateMyPreferences',
        method: 'post',
        values: {
          input: data,
        },
        successNotification: {
          message: translate('settings.preferences.successMessage'),
          type: 'success',
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
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">{translate('settings.preferences.title')}</h2>
        <p className="text-gray-600">{translate('settings.preferences.description')}</p>
      </div>

      {isSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {translate('settings.preferences.successMessage')}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Locale */}
        <div>
          <label htmlFor="locale" className="block text-sm font-medium text-gray-700 mb-1">
            {translate('settings.preferences.fields.locale')}
          </label>
          <select
            id="locale"
            {...register('locale', { required: translate('validation.required') })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="pl">Polski</option>
            <option value="de">Deutsch</option>
          </select>
          {errors.locale && <p className="mt-1 text-sm text-red-600">{errors.locale.message}</p>}
        </div>

        {/* Theme */}
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
            {translate('settings.preferences.fields.theme')}
          </label>
          <select
            id="theme"
            {...register('theme', { required: translate('validation.required') })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="SYSTEM">System</option>
            <option value="LIGHT">Light</option>
            <option value="DARK">Dark</option>
          </select>
          {errors.theme && <p className="mt-1 text-sm text-red-600">{errors.theme.message}</p>}
        </div>

        {/* AI Model */}
        <div>
          <label htmlFor="aiModel" className="block text-sm font-medium text-gray-700 mb-1">
            {translate('settings.preferences.fields.aiModel')}
          </label>
          <select
            id="aiModel"
            {...register('aiModel', { required: translate('validation.required') })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="GPT_4_TURBO">GPT-4 Turbo (Recommended)</option>
            <option value="GPT_4">GPT-4</option>
            <option value="GPT_3_5_TURBO">GPT-3.5 Turbo</option>
            <option value="CLAUDE_3_OPUS">Claude 3 Opus</option>
            <option value="CLAUDE_3_SONNET">Claude 3 Sonnet</option>
          </select>
          {errors.aiModel && <p className="mt-1 text-sm text-red-600">{errors.aiModel.message}</p>}
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            {translate('settings.preferences.fields.timezone')}
          </label>
          <select
            id="timezone"
            {...register('timezone')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Date Format */}
        <div>
          <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
            {translate('settings.preferences.fields.dateFormat')}
          </label>
          <select
            id="dateFormat"
            {...register('dateFormat')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select format</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading
              ? translate('settings.preferences.saving')
              : translate('settings.preferences.saveButton')}
          </button>
        </div>
      </form>
    </div>
  );
}
