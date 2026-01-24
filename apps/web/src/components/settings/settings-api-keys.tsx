'use client';

import { useState, type Dispatch } from 'react';
import { useTranslate, useCustom, useCustomMutation, useNotification } from '@refinedev/core';
import {
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Key,
  Calendar,
  Activity,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { LoadingButton } from '@legal/ui';
import { ApiKeysListSkeleton } from '@/components/skeleton';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimitPerMinute: number | null;
  status: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateApiKeyInput {
  name: string;
  scopes: string[];
  rateLimitPerMinute?: number | null;
  expiresAt?: string | null;
  description?: string | null;
}

interface CreateApiKeyResponse {
  id: string;
  rawKey: string;
  keyPrefix: string;
  name: string;
  scopes: string[];
  rateLimitPerMinute: number;
  status: string;
  expiresAt: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

const API_KEY_SCOPES = [
  { value: 'documents:read', label: 'Documents: Read' },
  { value: 'documents:write', label: 'Documents: Write' },
  { value: 'documents:delete', label: 'Documents: Delete' },
  { value: 'queries:read', label: 'Queries: Read' },
  { value: 'queries:write', label: 'Queries: Write' },
  { value: 'queries:delete', label: 'Queries: Delete' },
  { value: 'templates:read', label: 'Templates: Read' },
  { value: 'templates:write', label: 'Templates: Write' },
  { value: 'rulings:read', label: 'Rulings: Read' },
  { value: 'rulings:search', label: 'Rulings: Search' },
  { value: 'ai:generate', label: 'AI: Generate' },
  { value: 'ai:analyze', label: 'AI: Analyze' },
  { value: 'profile:read', label: 'Profile: Read' },
  { value: 'profile:write', label: 'Profile: Write' },
];

interface SettingsApiKeysProps {
  readonly isActive: boolean;
}

export function SettingsApiKeys({ isActive }: SettingsApiKeysProps) {
  const translate = useTranslate();
  const { open } = useNotification();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showRawKey, setShowRawKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  // Fetch API keys for current user - only when tab is active
  const { query: apiKeysQuery, result: apiKeysData } = useCustom<ApiKey[]>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'myApiKeys',
        fields: [
          'id',
          'name',
          'keyPrefix',
          'scopes',
          'rateLimitPerMinute',
          'status',
          'expiresAt',
          'lastUsedAt',
          'usageCount',
          'description',
          'createdAt',
          'updatedAt',
        ],
      },
    },
    queryOptions: {
      enabled: isActive, // Only fetch when the tab is active
    },
  });
  const { isLoading, refetch } = apiKeysQuery;

  const apiKeys = Array.isArray(apiKeysData?.data) ? apiKeysData.data : [];

  // Create API key mutation
  const { mutate: createApiKey, mutation: createMutation } =
    useCustomMutation<CreateApiKeyResponse>();
  const isCreating =
    (createMutation as any).isLoading ?? (createMutation as any).isPending ?? false;

  // Revoke API key mutation
  const { mutate: revokeApiKey, mutation: revokeMutation } = useCustomMutation<ApiKey>();
  const isRevoking =
    (revokeMutation as any).isLoading ?? (revokeMutation as any).isPending ?? false;

  // Delete API key mutation
  const { mutate: deleteApiKey, mutation: deleteMutation } = useCustomMutation();
  const isDeleting =
    (deleteMutation as any).isLoading ?? (deleteMutation as any).isPending ?? false;

  const handleCreateApiKey = (data: CreateApiKeyInput) => {
    createApiKey(
      {
        url: '',
        method: 'post',
        values: {
          operation: 'createApiKey',
          variables: {
            input: {
              name: data.name,
              scopes: selectedScopes,
              rateLimitPerMinute: data.rateLimitPerMinute,
              expiresAt: data.expiresAt,
              description: data.description,
            },
          },
          fields: [
            'id',
            'rawKey',
            'keyPrefix',
            'name',
            'scopes',
            'rateLimitPerMinute',
            'status',
            'expiresAt',
            'description',
            'createdAt',
            'updatedAt',
          ],
        },
      },
      {
        onSuccess: (response: any) => {
          setNewlyCreatedKey(response.data);
          setShowRawKey(true);
          setIsCreateModalOpen(false);
          refetch();
          open?.({
            type: 'success',
            message: translate('settings.apiKeys.createSuccess'),
          });
        },
        onError: (err: unknown) => {
          open?.({
            type: 'error',
            message: err instanceof Error ? err.message : translate('settings.apiKeys.createError'),
          });
        },
      },
    );
  };

  const handleRevokeApiKey = (id: string) => {
    if (!confirm(translate('settings.apiKeys.confirmRevoke'))) {
      return;
    }

    revokeApiKey(
      {
        url: '',
        method: 'post',
        values: {
          operation: 'revokeApiKey',
          variables: { id },
          fields: ['id', 'status', 'updatedAt'],
        },
      },
      {
        onSuccess: () => {
          refetch();
          open?.({
            type: 'success',
            message: translate('settings.apiKeys.revokeSuccess'),
          });
        },
        onError: (err: unknown) => {
          open?.({
            type: 'error',
            message: err instanceof Error ? err.message : translate('settings.apiKeys.revokeError'),
          });
        },
      },
    );
  };

  const handleDeleteApiKey = (id: string) => {
    if (!confirm(translate('settings.apiKeys.confirmDelete'))) {
      return;
    }

    deleteApiKey(
      {
        url: '',
        method: 'post',
        values: {
          operation: 'deleteApiKey',
          variables: { id },
        },
      },
      {
        onSuccess: () => {
          refetch();
          open?.({
            type: 'success',
            message: translate('settings.apiKeys.deleteSuccess'),
          });
        },
        onError: (err: unknown) => {
          open?.({
            type: 'error',
            message: err instanceof Error ? err.message : translate('settings.apiKeys.deleteError'),
          });
        },
      },
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    open?.({
      type: 'success',
      message: translate('settings.apiKeys.copiedToClipboard'),
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return translate('settings.apiKeys.never');
    // Use a fixed locale 'en-US' for consistency between server and client to prevent hydration mismatches
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20';
      case 'revoked':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20';
      case 'expired':
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:border-gray-500/20';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:border-gray-500/20';
    }
  };

  if (isLoading) {
    return <ApiKeysListSkeleton count={3} />;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold mb-1">{translate('settings.apiKeys.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {translate('settings.apiKeys.description')}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {translate('settings.apiKeys.createButton')}
        </button>
      </div>

      {/* New API Key Display */}
      {newlyCreatedKey && showRawKey && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {translate('settings.apiKeys.newKeyTitle')}
              </h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-500/90 mt-1">
                {translate('settings.apiKeys.newKeyWarning')}
              </p>
            </div>
            <button
              onClick={() => {
                setNewlyCreatedKey(null);
                setShowRawKey(false);
              }}
              className="text-yellow-700 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <code className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono flex items-center">
              {showRawKey ? newlyCreatedKey.rawKey : '••••••••••••'}
            </code>
            <button
              onClick={() => setShowRawKey(!showRawKey)}
              className="px-3 py-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors"
            >
              {showRawKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => copyToClipboard(newlyCreatedKey.rawKey)}
              className="px-3 py-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border px-4">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">{translate('settings.apiKeys.noKeys')}</h3>
          <p className="text-muted-foreground mb-4 text-sm max-w-sm mx-auto">
            {translate('settings.apiKeys.noKeysDescription')}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            {translate('settings.apiKeys.createFirstButton')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="p-5 border border-border rounded-xl bg-card hover:shadow-sm transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-base truncate">{apiKey.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getStatusBadgeClass(apiKey.status)}`}
                    >
                      {translate(`settings.apiKeys.status.${apiKey.status}`)}
                    </span>
                  </div>
                  {apiKey.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {apiKey.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-muted-foreground mt-4">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                        {apiKey.keyPrefix}...
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      <span>
                        {translate('settings.apiKeys.usageCount')}: {apiKey.usageCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {translate('settings.apiKeys.lastUsed')}: {formatDate(apiKey.lastUsedAt)}
                      </span>
                    </div>
                    {apiKey.expiresAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {translate('settings.apiKeys.expires')}: {formatDate(apiKey.expiresAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {apiKey.scopes?.map((scope) => (
                      <span
                        key={scope}
                        className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20 rounded-md"
                      >
                        {scope.split(':')[1]}
                      </span>
                    )) ?? null}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {apiKey.status === 'active' && (
                    <button
                      onClick={() => handleRevokeApiKey(apiKey.id)}
                      disabled={isRevoking}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title={translate('settings.apiKeys.revokeButton')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {apiKey.status !== 'active' && (
                    <button
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                      disabled={isDeleting}
                      className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                      title={translate('settings.apiKeys.deleteButton')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create API Key Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  {translate('settings.apiKeys.createModalTitle')}
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ×
                </button>
              </div>
              <CreateApiKeyForm
                onSubmit={handleCreateApiKey}
                onCancel={() => setIsCreateModalOpen(false)}
                isLoading={isCreating}
                selectedScopes={selectedScopes}
                setSelectedScopes={setSelectedScopes}
              />
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
        <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          {translate('settings.apiKeys.securityNotice.title')}
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            {translate('settings.apiKeys.securityNotice.tip1')}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            {translate('settings.apiKeys.securityNotice.tip2')}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            {translate('settings.apiKeys.securityNotice.tip3')}
          </li>
        </ul>
      </div>
    </div>
  );
}

interface CreateApiKeyFormProps {
  readonly onSubmit: (data: CreateApiKeyInput) => void;
  readonly onCancel: () => void;
  readonly isLoading: boolean;
  readonly selectedScopes: string[];
  readonly setSelectedScopes: Dispatch<React.SetStateAction<string[]>>;
}

function CreateApiKeyForm({
  onSubmit,
  onCancel,
  isLoading,
  selectedScopes,
  setSelectedScopes,
}: CreateApiKeyFormProps) {
  const translate = useTranslate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rateLimitPerMinute: 60,
    expiresAt: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedScopes.length === 0) {
      alert(translate('settings.apiKeys.errors.noScopes'));
      return;
    }

    onSubmit({
      name: formData.name,
      scopes: selectedScopes,
      rateLimitPerMinute: formData.rateLimitPerMinute || null,
      expiresAt: formData.expiresAt || null,
      description: formData.description || null,
    });
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev: string[]) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            {translate('settings.apiKeys.fields.name')} *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            placeholder={translate('settings.apiKeys.fields.namePlaceholder')}
          />
        </div>

        {/* Rate Limit */}
        <div className="space-y-2">
          <label htmlFor="rateLimit" className="block text-sm font-medium">
            {translate('settings.apiKeys.fields.rateLimit')}
          </label>
          <input
            id="rateLimit"
            type="number"
            min="1"
            value={formData.rateLimitPerMinute}
            onChange={(e) =>
              setFormData({ ...formData, rateLimitPerMinute: Number.parseInt(e.target.value) || 0 })
            }
            className="w-full px-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          {translate('settings.apiKeys.fields.description')}
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
          rows={2}
          placeholder={translate('settings.apiKeys.fields.descriptionPlaceholder')}
        />
      </div>

      {/* Scopes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">
          {translate('settings.apiKeys.fields.scopes')} *
        </label>
        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-border rounded-xl p-4 bg-muted/20">
          {API_KEY_SCOPES.map((scope) => (
            <label
              key={scope.value}
              className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedScopes.includes(scope.value)}
                onChange={() => toggleScope(scope.value)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              {scope.label}
            </label>
          ))}
        </div>
      </div>

      {/* Expiration */}
      <div className="space-y-2">
        <label htmlFor="expiresAt" className="block text-sm font-medium">
          {translate('settings.apiKeys.fields.expiresAt')}
        </label>
        <input
          id="expiresAt"
          type="datetime-local"
          value={formData.expiresAt}
          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          className="w-full px-3 py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
        <p className="text-xs text-muted-foreground">
          {translate('settings.apiKeys.fields.expiresAtHint')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-border mt-8">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
        >
          {translate('settings.apiKeys.cancelButton')}
        </button>
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText={translate('settings.apiKeys.creating')}
          disabled={selectedScopes.length === 0}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6"
        >
          {translate('settings.apiKeys.createButton')}
        </LoadingButton>
      </div>
    </form>
  );
}
