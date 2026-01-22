'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGetIdentity } from '@refinedev/core';
import { getAccessToken } from '@/providers/auth-provider/auth-provider.client';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

export enum SettingValueType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

export enum SettingCategory {
  AI = 'ai',
  FEATURE_FLAGS = 'feature_flags',
  MAINTENANCE = 'maintenance',
  GENERAL = 'general',
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string | null;
  valueType: SettingValueType;
  category: SettingCategory;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseSystemSettingsReturn {
  settings: SystemSetting[];
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string, valueType?: SettingValueType) => Promise<boolean>;
  bulkUpdateSettings: (updates: Array<{ key: string; value: string; valueType?: SettingValueType }>) => Promise<boolean>;
  getSettingValue: <T = string>(key: string, defaultValue?: T) => T | null;
  getSettingsByCategory: (category: SettingCategory) => SystemSetting[];
}

/**
 * useSystemSettings Hook
 *
 * Custom hook for managing system-wide settings.
 * Fetches settings and provides methods to update them.
 * Admin-only access.
 */
export function useSystemSettings(): UseSystemSettingsReturn {
  const { data: user } = useGetIdentity<{ id: string; role?: string }>();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const accessToken = getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const query = `
        query GetSystemSettings {
          systemSettings {
            id
            key
            value
            valueType
            category
            description
            metadata
            createdAt
            updatedAt
          }
        }
      `;

      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message || 'GraphQL error');
      }

      setSettings(result.data?.systemSettings || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch system settings';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const updateSetting = useCallback(
    async (key: string, value: string, valueType: SettingValueType = SettingValueType.STRING): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        const accessToken = getAccessToken();
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const mutation = `
          mutation UpsertSystemSetting($input: SystemSettingInput!) {
            upsertSystemSetting(input: $input) {
              id
              key
              value
              valueType
              category
              description
              metadata
              createdAt
              updatedAt
            }
          }
        `;

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: mutation,
            variables: {
              input: { key, value, valueType },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message || 'GraphQL error');
        }

        // Update local state
        setSettings((prev) => {
          const existing = prev.find((s) => s.key === key);
          if (existing) {
            return prev.map((s) =>
              s.key === key ? { ...s, value, valueType, updatedAt: new Date().toISOString() } : s
            );
          }
          return [...prev, result.data?.upsertSystemSetting];
        });

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update setting';
        setError(errorMessage);
        return false;
      }
    },
    [user?.id]
  );

  const bulkUpdateSettings = useCallback(
    async (
      updates: Array<{ key: string; value: string; valueType?: SettingValueType }>
    ): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        const accessToken = getAccessToken();
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const mutation = `
          mutation BulkUpsertSystemSettings($input: BulkUpdateSettingsInput!) {
            bulkUpsertSystemSettings(input: $input) {
              id
              key
              value
              valueType
              category
              description
              metadata
              createdAt
              updatedAt
            }
          }
        `;

        const settings = updates.map((u) => ({
          key: u.key,
          value: u.value,
          valueType: u.valueType || SettingValueType.STRING,
        }));

        const response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            query: mutation,
            variables: { input: { settings } },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message || 'GraphQL error');
        }

        // Refetch all settings to get the updated state
        await fetchSettings();

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update settings';
        setError(errorMessage);
        return false;
      }
    },
    [user?.id, fetchSettings]
  );

  const getSettingValue = useCallback(
    <T = string>(key: string, defaultValue?: T): T | null => {
      const setting = settings.find((s) => s.key === key);
      if (!setting || setting.value === null) {
        return defaultValue ?? null;
      }

      switch (setting.valueType) {
        case SettingValueType.BOOLEAN:
          return (setting.value === 'true') as T;
        case SettingValueType.NUMBER:
          return parseFloat(setting.value) as T;
        case SettingValueType.JSON:
          try {
            return JSON.parse(setting.value) as T;
          } catch {
            return defaultValue ?? null;
          }
        case SettingValueType.STRING:
        default:
          return setting.value as T;
      }
    },
    [settings]
  );

  const getSettingsByCategory = useCallback(
    (category: SettingCategory): SystemSetting[] => {
      return settings.filter((s) => s.category === category);
    },
    [settings]
  );

  // Fetch settings on mount
  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    }
  }, [user?.id, fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    updateSetting,
    bulkUpdateSettings,
    getSettingValue,
    getSettingsByCategory,
  };
}
