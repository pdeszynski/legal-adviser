'use client';

import React, { useState } from 'react';
import { useSystemSettings, SettingCategory, SettingValueType } from '@/hooks/use-system-settings';

export default function AdminSettingsPage() {
  const { settings, isLoading, error, updateSetting, bulkUpdateSettings, getSettingsByCategory } =
    useSystemSettings();

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'features' | 'maintenance' | 'general'>(
    'features',
  );

  // Get settings by category
  const aiSettings = getSettingsByCategory(SettingCategory.AI);
  const featureSettings = getSettingsByCategory(SettingCategory.FEATURE_FLAGS);
  const maintenanceSettings = getSettingsByCategory(SettingCategory.MAINTENANCE);
  const generalSettings = getSettingsByCategory(SettingCategory.GENERAL);

  // Helper to get setting value
  const getSetting = (key: string, defaultValue = '') => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value ?? defaultValue;
  };

  // Handle form submission
  const handleSave = async (category: SettingCategory) => {
    setIsSaving(true);
    setSaveSuccess(false);

    const updates: Array<{ key: string; value: string; valueType: SettingValueType }> = [];

    if (category === SettingCategory.AI) {
      updates.push(
        {
          key: 'ai.default_model',
          value:
            (document.getElementById('ai.default_model') as HTMLInputElement)?.value || 'gpt-4',
          valueType: SettingValueType.STRING,
        },
        {
          key: 'ai.temperature',
          value: (document.getElementById('ai.temperature') as HTMLInputElement)?.value || '0.7',
          valueType: SettingValueType.NUMBER,
        },
        {
          key: 'ai.max_tokens',
          value: (document.getElementById('ai.max_tokens') as HTMLInputElement)?.value || '2000',
          valueType: SettingValueType.NUMBER,
        },
      );
    } else if (category === SettingCategory.FEATURE_FLAGS) {
      updates.push(
        {
          key: 'features.chat_enabled',
          value: (document.getElementById('features.chat_enabled') as HTMLInputElement)?.checked
            ? 'true'
            : 'false',
          valueType: SettingValueType.BOOLEAN,
        },
        {
          key: 'features.document_upload_enabled',
          value: (document.getElementById('features.document_upload_enabled') as HTMLInputElement)
            ?.checked
            ? 'true'
            : 'false',
          valueType: SettingValueType.BOOLEAN,
        },
        {
          key: 'features.advanced_search_enabled',
          value: (document.getElementById('features.advanced_search_enabled') as HTMLInputElement)
            ?.checked
            ? 'true'
            : 'false',
          valueType: SettingValueType.BOOLEAN,
        },
        {
          key: 'features.templates_enabled',
          value: (document.getElementById('features.templates_enabled') as HTMLInputElement)
            ?.checked
            ? 'true'
            : 'false',
          valueType: SettingValueType.BOOLEAN,
        },
        {
          key: 'features.collaboration_enabled',
          value: (document.getElementById('features.collaboration_enabled') as HTMLInputElement)
            ?.checked
            ? 'true'
            : 'false',
          valueType: SettingValueType.BOOLEAN,
        },
        {
          key: 'features.notifications_enabled',
          value: (document.getElementById('features.notifications_enabled') as HTMLInputElement)
            ?.checked
            ? 'true'
            : 'false',
          valueType: SettingValueType.BOOLEAN,
        },
      );
    } else if (category === SettingCategory.MAINTENANCE) {
      updates.push(
        {
          key: 'maintenance.enabled',
          value: (document.getElementById('maintenance.enabled') as HTMLInputElement)?.checked
            ? 'true'
            : 'false',
          valueType: SettingValueType.BOOLEAN,
        },
        {
          key: 'maintenance.message',
          value: (document.getElementById('maintenance.message') as HTMLInputElement)?.value || '',
          valueType: SettingValueType.STRING,
        },
        {
          key: 'maintenance.scheduled_start',
          value:
            (document.getElementById('maintenance.scheduled_start') as HTMLInputElement)?.value ||
            '',
          valueType: SettingValueType.STRING,
        },
      );
    } else if (category === SettingCategory.GENERAL) {
      updates.push(
        {
          key: 'general.max_upload_size_mb',
          value:
            (document.getElementById('general.max_upload_size_mb') as HTMLInputElement)?.value ||
            '10',
          valueType: SettingValueType.NUMBER,
        },
        {
          key: 'general.support_email',
          value:
            (document.getElementById('general.support_email') as HTMLInputElement)?.value || '',
          valueType: SettingValueType.STRING,
        },
      );
    }

    const success = await bulkUpdateSettings(updates);
    setIsSaving(false);
    setSaveSuccess(success);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings and feature flags</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">Settings saved successfully!</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('features')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'features'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
            }`}
          >
            Feature Flags
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'ai'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
            }`}
          >
            AI Configuration
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'maintenance'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
            }`}
          >
            Maintenance
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
            }`}
          >
            General
          </button>
        </nav>
      </div>

      {/* Feature Flags Tab */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Feature Flags</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Enable or disable features across the platform
            </p>

            <div className="space-y-4">
              {featureSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div>
                    <label htmlFor={setting.key} className="font-medium">
                      {setting.description || setting.key}
                    </label>
                    <p className="text-sm text-muted-foreground">{setting.key}</p>
                  </div>
                  <input
                    id={setting.key}
                    type="checkbox"
                    defaultChecked={setting.value === 'true'}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={() => handleSave(SettingCategory.FEATURE_FLAGS)}
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Configuration Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">AI Model Configuration</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Configure AI model settings for legal queries
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="ai.default_model" className="block text-sm font-medium mb-1">
                  Default AI Model
                </label>
                <select
                  id="ai.default_model"
                  defaultValue={getSetting('ai.default_model', 'gpt-4')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div>
                <label htmlFor="ai.temperature" className="block text-sm font-medium mb-1">
                  Temperature (0.0 - 2.0)
                </label>
                <input
                  type="number"
                  id="ai.temperature"
                  step="0.1"
                  min="0"
                  max="2"
                  defaultValue={getSetting('ai.temperature', '0.7')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower values make output more deterministic, higher values more random
                </p>
              </div>

              <div>
                <label htmlFor="ai.max_tokens" className="block text-sm font-medium mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="ai.max_tokens"
                  min="100"
                  max="8000"
                  defaultValue={getSetting('ai.max_tokens', '2000')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum length of AI response in tokens
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => handleSave(SettingCategory.AI)}
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Maintenance Mode</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Configure maintenance mode to temporarily disable access to the platform
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="maintenance.enabled" className="font-medium">
                    Enable Maintenance Mode
                  </label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, users will see a maintenance message
                  </p>
                </div>
                <input
                  id="maintenance.enabled"
                  type="checkbox"
                  defaultChecked={getSetting('maintenance.enabled') === 'true'}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="maintenance.message" className="block text-sm font-medium mb-1">
                  Maintenance Message
                </label>
                <textarea
                  id="maintenance.message"
                  rows={3}
                  defaultValue={getSetting(
                    'maintenance.message',
                    'System is under maintenance. Please try again later.',
                  )}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="maintenance.scheduled_start"
                  className="block text-sm font-medium mb-1"
                >
                  Scheduled Start (ISO 8601 format)
                </label>
                <input
                  type="text"
                  id="maintenance.scheduled_start"
                  defaultValue={getSetting('maintenance.scheduled_start', '')}
                  placeholder="2024-01-01T00:00:00Z"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Schedule maintenance to start at a specific time
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => handleSave(SettingCategory.MAINTENANCE)}
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">General Settings</h3>
            <p className="text-sm text-muted-foreground mb-6">General platform configuration</p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="general.max_upload_size_mb"
                  className="block text-sm font-medium mb-1"
                >
                  Max Upload Size (MB)
                </label>
                <input
                  type="number"
                  id="general.max_upload_size_mb"
                  min="1"
                  max="100"
                  defaultValue={getSetting('general.max_upload_size_mb', '10')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum file upload size in megabytes
                </p>
              </div>

              <div>
                <label htmlFor="general.support_email" className="block text-sm font-medium mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  id="general.support_email"
                  defaultValue={getSetting('general.support_email', 'support@legalai.com')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email address displayed for user support
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => handleSave(SettingCategory.GENERAL)}
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
