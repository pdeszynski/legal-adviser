"use client";

import { useState } from "react";
import { useTranslate, useMutation } from "@refinedev/core";
import { useForm } from "react-hook-form";

interface User {
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

export function SettingsProfile({ user }: { user: User }) {
  const translate = useTranslate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate, isLoading } = useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    defaultValues: {
      email: user.email,
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    setIsSuccess(false);
    setError(null);

    mutate(
      {
        resource: "updateProfile",
        values: {
          input: data,
        },
        successNotification: {
          message: translate("settings.profile.successMessage"),
          type: "success",
        },
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 3000);
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : translate("settings.profile.errorMessage"));
        },
      },
    );
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">
          {translate("settings.profile.title")}
        </h2>
        <p className="text-gray-600">
          {translate("settings.profile.description")}
        </p>
      </div>

      {isSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {translate("settings.profile.successMessage")}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            {translate("settings.profile.fields.email")}
          </label>
          <input
            id="email"
            type="email"
            {...register("email", {
              required: translate("validation.required"),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: translate("validation.email"),
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            {translate("settings.profile.fields.username")}
          </label>
          <input
            id="username"
            type="text"
            {...register("username", {
              minLength: {
                value: 3,
                message: translate("validation.minLength", { min: 3 }),
              },
              maxLength: {
                value: 50,
                message: translate("validation.maxLength", { max: 50 }),
              },
              pattern: {
                value: /^[a-zA-Z0-9_.\-]+$/,
                message: translate("settings.profile.errors.invalidUsername"),
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            {translate("settings.profile.fields.firstName")}
          </label>
          <input
            id="firstName"
            type="text"
            {...register("firstName", {
              maxLength: {
                value: 255,
                message: translate("validation.maxLength", { max: 255 }),
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            {translate("settings.profile.fields.lastName")}
          </label>
          <input
            id="lastName"
            type="text"
            {...register("lastName", {
              maxLength: {
                value: 255,
                message: translate("validation.maxLength", { max: 255 }),
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading
              ? translate("settings.profile.saving")
              : translate("settings.profile.saveButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
