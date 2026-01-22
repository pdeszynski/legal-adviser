"use client";

import { useState } from "react";
import { useTranslate, useMutation } from "@refinedev/core";
import { useForm } from "react-hook-form";

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function SettingsSecurity() {
  const translate = useTranslate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate, isLoading } = useMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ChangePasswordInput) => {
    setIsSuccess(false);
    setError(null);

    if (data.newPassword !== data.confirmPassword) {
      setError(translate("settings.security.errors.passwordsDoNotMatch"));
      return;
    }

    mutate(
      {
        resource: "changePassword",
        values: {
          input: {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
        },
        successNotification: {
          message: translate("settings.security.successMessage"),
          type: "success",
        },
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          reset();
          setTimeout(() => setIsSuccess(false), 3000);
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : translate("settings.security.errorMessage"));
        },
      },
    );
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">
          {translate("settings.security.title")}
        </h2>
        <p className="text-gray-600">
          {translate("settings.security.description")}
        </p>
      </div>

      {isSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {translate("settings.security.successMessage")}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
            {translate("settings.security.fields.currentPassword")}
          </label>
          <input
            id="currentPassword"
            type="password"
            {...register("currentPassword", {
              required: translate("validation.required"),
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            {translate("settings.security.fields.newPassword")}
          </label>
          <input
            id="newPassword"
            type="password"
            {...register("newPassword", {
              required: translate("validation.required"),
              minLength: {
                value: 8,
                message: translate("validation.minLength", { min: 8 }),
              },
              maxLength: {
                value: 128,
                message: translate("validation.maxLength", { max: 128 }),
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {translate("settings.security.passwordHint")}
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            {translate("settings.security.fields.confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword", {
              required: translate("validation.required"),
              minLength: {
                value: 8,
                message: translate("validation.minLength", { min: 8 }),
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading
              ? translate("settings.security.changing")
              : translate("settings.security.changeButton")}
          </button>
        </div>
      </form>

      {/* Security Tips */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">
          {translate("settings.security.tips.title")}
        </h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• {translate("settings.security.tips.tip1")}</li>
          <li>• {translate("settings.security.tips.tip2")}</li>
          <li>• {translate("settings.security.tips.tip3")}</li>
        </ul>
      </div>
    </div>
  );
}
