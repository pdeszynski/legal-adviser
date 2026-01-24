'use client';

import { useState, useEffect } from 'react';
import { useTranslate, useDataProvider, useGetIdentity } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@legal/ui';
import { User, Mail, UserCircle } from 'lucide-react';
import type { GraphQLMutationConfig } from '@providers/data-provider';

interface UserIdentity {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface UpdateProfileInput {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface SettingsProfileProps {
  user: UserIdentity;
  onProfileUpdate?: () => void;
}

export function SettingsProfile({ user, onProfileUpdate }: SettingsProfileProps) {
  const translate = useTranslate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { refetch: refetchIdentity } = useGetIdentity();
  const dataProvider = useDataProvider();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<UpdateProfileInput>({
    defaultValues: {
      email: user.email,
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    },
  });

  // Update form values when user prop changes
  useEffect(() => {
    if (user) {
      setValue('email', user.email);
      setValue('username', user.username || '');
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      reset({
        email: user.email,
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user, setValue, reset]);

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSuccess(false);
    setError(null);
    setIsLoading(true);

    try {
      const dp = dataProvider();
      if (!dp) throw new Error('Data provider not available');
      const mutationConfig: GraphQLMutationConfig<UpdateProfileInput> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'updateProfile',
            fields: ['id', 'email', 'username', 'firstName', 'lastName'],
            variables: {
              input: data,
            },
          },
        },
      };
      await (dp as any).custom(mutationConfig);

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      refetchIdentity();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : translate('settings.profile.errorMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1">{translate('settings.profile.title')}</h2>
        <p className="text-sm text-muted-foreground">{translate('settings.profile.description')}</p>
      </div>
      {isSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-700 dark:text-green-300 flex items-center gap-2">
          <span>{translate('settings.profile.successMessage')}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            {translate('settings.profile.fields.email')}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              type="email"
              {...register('email', {
                required: translate('validation.required'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: translate('validation.email'),
                },
              })}
              className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium">
            {translate('settings.profile.fields.username')}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <UserCircle className="h-4 w-4" />
            </div>
            <input
              id="username"
              type="text"
              {...register('username', {
                minLength: {
                  value: 3,
                  message: translate('validation.minLength', { min: 3 }),
                },
                maxLength: {
                  value: 50,
                  message: translate('validation.maxLength', { max: 50 }),
                },
                pattern: {
                  value: /^[a-zA-Z0-9_.\-]+$/,
                  message: translate('settings.profile.errors.invalidUsername'),
                },
              })}
              className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium">
              {translate('settings.profile.fields.firstName')}
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName', {
                maxLength: {
                  value: 255,
                  message: translate('validation.maxLength', { max: 255 }),
                },
              })}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium">
              {translate('settings.profile.fields.lastName')}
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName', {
                maxLength: {
                  value: 255,
                  message: translate('validation.maxLength', { max: 255 }),
                },
              })}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-border mt-8">
          <LoadingButton
            type="submit"
            isLoading={isLoading}
            loadingText={translate('settings.profile.saving')}
            disabled={!isDirty}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6"
          >
            {translate('settings.profile.saveButton')}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
