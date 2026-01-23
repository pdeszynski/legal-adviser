'use client';

import { useState } from 'react';
import { useTranslate, useCustomMutation } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@legal/ui';
import { Lock, KeyRound, ShieldCheck } from 'lucide-react';

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function SettingsSecurity() {
  const translate = useTranslate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate, mutation } = useCustomMutation();
  const isLoading = (mutation as any).isLoading ?? (mutation as any).isPending ?? false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ChangePasswordInput) => {
    setIsSuccess(false);
    setError(null);

    if (data.newPassword !== data.confirmPassword) {
      setError(translate('settings.security.errors.passwordsDoNotMatch'));
      return;
    }

    mutate(
      {
        url: '',
        method: 'post',
        values: {
          operation: 'changePassword',
          variables: {
            input: {
              currentPassword: data.currentPassword,
              newPassword: data.newPassword,
            },
          },
          fields: [],
        },
        successNotification: {
          message: translate('settings.security.successMessage'),
          type: 'success',
        },
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          reset();
          setTimeout(() => setIsSuccess(false), 3000);
        },
        onError: (err: unknown) => {
          setError(
            err instanceof Error ? err.message : translate('settings.security.errorMessage'),
          );
        },
      },
    );
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1">{translate('settings.security.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {translate('settings.security.description')}
        </p>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-700 dark:text-green-300 flex items-center gap-2">
          {translate('settings.security.successMessage')}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="block text-sm font-medium">
            {translate('settings.security.fields.currentPassword')}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="currentPassword"
              type="password"
              {...register('currentPassword', {
                required: translate('validation.required'),
              })}
              className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          {errors.currentPassword && (
            <p className="text-sm text-red-500">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <label htmlFor="newPassword" className="block text-sm font-medium">
            {translate('settings.security.fields.newPassword')}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <KeyRound className="h-4 w-4" />
            </div>
            <input
              id="newPassword"
              type="password"
              {...register('newPassword', {
                required: translate('validation.required'),
                minLength: {
                  value: 8,
                  message: translate('validation.minLength', { min: 8 }),
                },
                maxLength: {
                  value: 128,
                  message: translate('validation.maxLength', { max: 128 }),
                },
              })}
              className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {translate('settings.security.passwordHint')}
          </p>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            {translate('settings.security.fields.confirmPassword')}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <KeyRound className="h-4 w-4" />
            </div>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword', {
                required: translate('validation.required'),
                minLength: {
                  value: 8,
                  message: translate('validation.minLength', { min: 8 }),
                },
              })}
              className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-border mt-8">
          <LoadingButton
            type="submit"
            isLoading={isLoading}
            loadingText={translate('settings.security.changing')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6"
          >
            {translate('settings.security.changeButton')}
          </LoadingButton>
        </div>
      </form>

      {/* Security Tips */}
      <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-2xl">
        <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          {translate('settings.security.tips.title')}
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            {translate('settings.security.tips.tip1')}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            {translate('settings.security.tips.tip2')}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            {translate('settings.security.tips.tip3')}
          </li>
        </ul>
      </div>
    </div>
  );
}
