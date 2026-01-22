"use client";

import { useState } from "react";
import { useTranslate, useCustom, useCustomMutation, useNotification } from "@refinedev/core";
import { Copy, Eye, EyeOff, Trash2, Plus } from "lucide-react";

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
  { value: "documents:read", label: "Documents: Read" },
  { value: "documents:write", label: "Documents: Write" },
  { value: "documents:delete", label: "Documents: Delete" },
  { value: "queries:read", label: "Queries: Read" },
  { value: "queries:write", label: "Queries: Write" },
  { value: "queries:delete", label: "Queries: Delete" },
  { value: "templates:read", label: "Templates: Read" },
  { value: "templates:write", label: "Templates: Write" },
  { value: "rulings:read", label: "Rulings: Read" },
  { value: "rulings:search", label: "Rulings: Search" },
  { value: "ai:generate", label: "AI: Generate" },
  { value: "ai:analyze", label: "AI: Analyze" },
  { value: "profile:read", label: "Profile: Read" },
  { value: "profile:write", label: "Profile: Write" },
];

export function SettingsApiKeys() {
  const translate = useTranslate();
  const { open } = useNotification();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showRawKey, setShowRawKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  // Fetch API keys for current user
  const { data: apiKeysData, isLoading, refetch } = useCustom<ApiKey[]>({
    url: "",
    method: "get",
    config: {
      query: {
        operation: "myApiKeys",
        fields: [
          "id",
          "name",
          "keyPrefix",
          "scopes",
          "rateLimitPerMinute",
          "status",
          "expiresAt",
          "lastUsedAt",
          "usageCount",
          "description",
          "createdAt",
          "updatedAt",
        ],
      },
    },
  });

  const apiKeys = apiKeysData?.data ?? [];

  // Create API key mutation
  const { mutate: createApiKey, isLoading: isCreating } = useCustomMutation<CreateApiKeyResponse>();

  // Revoke API key mutation
  const { mutate: revokeApiKey, isLoading: isRevoking } = useCustomMutation<ApiKey>();

  // Delete API key mutation
  const { mutate: deleteApiKey, isLoading: isDeleting } = useCustomMutation<boolean>();

  const handleCreateApiKey = (data: CreateApiKeyInput) => {
    createApiKey(
      {
        url: "",
        method: "post",
        config: {
          query: {
            operation: "createApiKey",
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
              "id",
              "rawKey",
              "keyPrefix",
              "name",
              "scopes",
              "rateLimitPerMinute",
              "status",
              "expiresAt",
              "description",
              "createdAt",
              "updatedAt",
            ],
          },
        },
      },
      {
        onSuccess: (response) => {
          setNewlyCreatedKey(response.data);
          setShowRawKey(true);
          setIsCreateModalOpen(false);
          refetch();
          open?.({
            type: "success",
            message: translate("settings.apiKeys.createSuccess"),
          });
        },
        onError: (err: unknown) => {
          open?.({
            type: "error",
            message: err instanceof Error ? err.message : translate("settings.apiKeys.createError"),
          });
        },
      },
    );
  };

  const handleRevokeApiKey = (id: string) => {
    if (!confirm(translate("settings.apiKeys.confirmRevoke"))) {
      return;
    }

    revokeApiKey(
      {
        url: "",
        method: "post",
        config: {
          query: {
            operation: "revokeApiKey",
            variables: { id },
            fields: ["id", "status"],
          },
        },
      },
      {
        onSuccess: () => {
          refetch();
          open?.({
            type: "success",
            message: translate("settings.apiKeys.revokeSuccess"),
          });
        },
        onError: (err: unknown) => {
          open?.({
            type: "error",
            message: err instanceof Error ? err.message : translate("settings.apiKeys.revokeError"),
          });
        },
      },
    );
  };

  const handleDeleteApiKey = (id: string) => {
    if (!confirm(translate("settings.apiKeys.confirmDelete"))) {
      return;
    }

    deleteApiKey(
      {
        url: "",
        method: "post",
        config: {
          query: {
            operation: "deleteApiKey",
            variables: { id },
          },
        },
      },
      {
        onSuccess: () => {
          refetch();
          open?.({
            type: "success",
            message: translate("settings.apiKeys.deleteSuccess"),
          });
        },
        onError: (err: unknown) => {
          open?.({
            type: "error",
            message: err instanceof Error ? err.message : translate("settings.apiKeys.deleteError"),
          });
        },
      },
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    open?.({
      type: "success",
      message: translate("settings.apiKeys.copiedToClipboard"),
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return translate("settings.apiKeys.never");
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "revoked":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">{translate("loading")}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold mb-2">
            {translate("settings.apiKeys.title")}
          </h2>
          <p className="text-gray-600">
            {translate("settings.apiKeys.description")}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {translate("settings.apiKeys.createButton")}
        </button>
      </div>

      {/* New API Key Display */}
      {newlyCreatedKey && showRawKey && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-yellow-900">
                {translate("settings.apiKeys.newKeyTitle")}
              </h3>
              <p className="text-sm text-yellow-700">
                {translate("settings.apiKeys.newKeyWarning")}
              </p>
            </div>
            <button
              onClick={() => {
                setNewlyCreatedKey(null);
                setShowRawKey(false);
              }}
              className="text-yellow-700 hover:text-yellow-900"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-yellow-300 rounded text-sm font-mono">
              {showRawKey ? newlyCreatedKey.rawKey : "••••••••••••"}
            </code>
            <button
              onClick={() => setShowRawKey(!showRawKey)}
              className="px-3 py-2 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200"
            >
              {showRawKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => copyToClipboard(newlyCreatedKey.rawKey)}
              className="px-3 py-2 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">{translate("settings.apiKeys.noKeys")}</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {translate("settings.apiKeys.createFirstButton")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="p-4 border rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-lg">{apiKey.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(apiKey.status)}`}>
                      {translate(`settings.apiKeys.status.${apiKey.status}`)}
                    </span>
                  </div>
                  {apiKey.description && (
                    <p className="text-sm text-gray-600 mb-2">{apiKey.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-mono">{apiKey.keyPrefix}...</span>
                    <span>
                      {translate("settings.apiKeys.usageCount")}: {apiKey.usageCount}
                    </span>
                    <span>
                      {translate("settings.apiKeys.lastUsed")}: {formatDate(apiKey.lastUsedAt)}
                    </span>
                    {apiKey.expiresAt && (
                      <span>
                        {translate("settings.apiKeys.expires")}: {formatDate(apiKey.expiresAt)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {apiKey.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {apiKey.status === "active" && (
                    <button
                      onClick={() => handleRevokeApiKey(apiKey.id)}
                      disabled={isRevoking}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title={translate("settings.apiKeys.revokeButton")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {apiKey.status !== "active" && (
                    <button
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                      disabled={isDeleting}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      title={translate("settings.apiKeys.deleteButton")}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {translate("settings.apiKeys.createModalTitle")}
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
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
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">
          {translate("settings.apiKeys.securityNotice.title")}
        </h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• {translate("settings.apiKeys.securityNotice.tip1")}</li>
          <li>• {translate("settings.apiKeys.securityNotice.tip2")}</li>
          <li>• {translate("settings.apiKeys.securityNotice.tip3")}</li>
        </ul>
      </div>
    </div>
  );
}

interface CreateApiKeyFormProps {
  onSubmit: (data: CreateApiKeyInput) => void;
  onCancel: () => void;
  isLoading: boolean;
  selectedScopes: string[];
  setSelectedScopes: (scopes: string[]) => void;
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
    name: "",
    description: "",
    rateLimitPerMinute: 60,
    expiresAt: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedScopes.length === 0) {
      alert(translate("settings.apiKeys.errors.noScopes"));
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
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          {translate("settings.apiKeys.fields.name")} *
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={translate("settings.apiKeys.fields.namePlaceholder")}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          {translate("settings.apiKeys.fields.description")}
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder={translate("settings.apiKeys.fields.descriptionPlaceholder")}
        />
      </div>

      {/* Scopes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {translate("settings.apiKeys.fields.scopes")} *
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
          {API_KEY_SCOPES.map((scope) => (
            <label key={scope.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedScopes.includes(scope.value)}
                onChange={() => toggleScope(scope.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {scope.label}
            </label>
          ))}
        </div>
      </div>

      {/* Rate Limit */}
      <div>
        <label htmlFor="rateLimit" className="block text-sm font-medium text-gray-700 mb-1">
          {translate("settings.apiKeys.fields.rateLimit")}
        </label>
        <input
          id="rateLimit"
          type="number"
          min="1"
          value={formData.rateLimitPerMinute}
          onChange={(e) => setFormData({ ...formData, rateLimitPerMinute: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">{translate("settings.apiKeys.fields.rateLimitHint")}</p>
      </div>

      {/* Expiration */}
      <div>
        <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
          {translate("settings.apiKeys.fields.expiresAt")}
        </label>
        <input
          id="expiresAt"
          type="datetime-local"
          value={formData.expiresAt}
          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">{translate("settings.apiKeys.fields.expiresAtHint")}</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {translate("settings.apiKeys.cancelButton")}
        </button>
        <button
          type="submit"
          disabled={isLoading || selectedScopes.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? translate("settings.apiKeys.creating") : translate("settings.apiKeys.createButton")}
        </button>
      </div>
    </form>
  );
}
