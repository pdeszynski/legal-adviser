'use client';

import { useState, useCallback } from 'react';
import { useCustomMutation, useCustom, useTranslate } from '@refinedev/core';
import { Button } from '@legal/ui';
import { Copy, Link, Plus, Share2, Users, X } from 'lucide-react';

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface DocumentShare {
  id: string;
  sharedWithUserId: string;
  sharedWithUser: User;
  sharedByUserId: string;
  sharedByUser: User;
  permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN';
  expiresAt?: string | null;
  createdAt: string;
}

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

const PERMISSION_LABELS: Record<string, string> = {
  VIEW: 'View Only',
  COMMENT: 'Can Comment',
  EDIT: 'Can Edit',
  ADMIN: 'Admin',
};

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  VIEW: 'Can view the document',
  COMMENT: 'Can view and comment on the document',
  EDIT: 'Can view and edit the document',
  ADMIN: 'Full access including sharing with others',
};

/**
 * Share Dialog Component
 *
 * Modal dialog for sharing documents with users and generating shareable links.
 * Displays current collaborators and allows adding new ones with role assignment.
 */
export function ShareDialog({ open, onClose, documentId, documentTitle }: ShareDialogProps) {
  const translate = useTranslate();
  const [activeTab, setActiveTab] = useState<'people' | 'link'>('people');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<
    'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN'
  >('VIEW');
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Fetch document shares
  const { query: sharesQuery } = useCustom<DocumentShare[]>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'documentShares',
        variables: { documentId },
        fields: [
          'id',
          'sharedWithUserId',
          'sharedByUserId',
          'permission',
          'expiresAt',
          'createdAt',
          { sharedWithUser: ['id', 'email', 'username', 'firstName', 'lastName'] },
          { sharedByUser: ['id', 'email', 'username', 'firstName', 'lastName'] },
        ],
      },
    },
    queryOptions: {
      enabled: open,
    },
  });

  // Fetch all users for sharing dropdown
  const { query: usersQuery } = useCustom<{ data: User[] }>({
    url: '',
    method: 'get',
    config: {
      query: {
        operation: 'users',
        fields: ['data { id email username firstName lastName }'],
      },
    },
    queryOptions: {
      enabled: open,
    },
  });

  // Share document mutation
  const { mutate: shareDocument, mutation: shareMutation } = useCustomMutation();

  // Revoke share mutation
  const { mutate: revokeShare } = useCustomMutation();

  // Update permission mutation
  const { mutate: updatePermission } = useCustomMutation();

  const handleShare = useCallback(() => {
    if (!selectedUserId) {
      return;
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    shareDocument(
      {
        url: '',
        method: 'post',
        values: {
          operation: 'shareDocument',
          variables: {
            input: {
              documentId,
              sharedWithUserId: selectedUserId,
              permission: selectedPermission,
              ...(expiresAt && { expiresAt }),
            },
          },
          fields: ['id', 'permission', 'createdAt'],
        },
      },
      {
        onSuccess: () => {
          sharesQuery.refetch();
          setSelectedUserId('');
          setSelectedPermission('VIEW');
          setExpiresInDays('');
        },
      },
    );
  }, [shareDocument, documentId, selectedUserId, selectedPermission, expiresInDays, sharesQuery]);

  const handleRevoke = useCallback(
    (shareId: string) => {
      revokeShare(
        {
          url: '',
          method: 'post',
          values: {
            operation: 'revokeDocumentShare',
            variables: { shareId },
            fields: ['success'],
          },
        },
        {
          onSuccess: () => {
            sharesQuery.refetch();
          },
        },
      );
    },
    [revokeShare, sharesQuery.refetch],
  );

  const handleUpdatePermission = useCallback(
    (shareId: string, newPermission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN') => {
      updatePermission(
        {
          url: '',
          method: 'post',
          values: {
            operation: 'updateDocumentSharePermission',
            variables: {
              input: {
                shareId,
                permission: newPermission,
              },
            },
            fields: ['id', 'permission'],
          },
        },
        {
          onSuccess: () => {
            sharesQuery.refetch();
          },
        },
      );
    },
    [updatePermission, sharesQuery.refetch],
  );

  const handleCopyLink = useCallback(() => {
    const shareUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/documents/${documentId}` : '';
    navigator.clipboard.writeText(shareUrl);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  }, [documentId]);

  const shares = sharesQuery.data?.data || [];
  const users = usersQuery.data?.data?.data || [];
  const availableUsers = users.filter(
    (user) => !shares.some((share) => share.sharedWithUserId === user.id),
  );

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email;
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2
              id="share-dialog-title"
              className="text-xl font-semibold text-gray-900 flex items-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share "{documentTitle}"
            </h2>
            <p className="text-sm text-gray-600 mt-1">Manage who has access to this document</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('people')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'people'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              People
              {shares.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {shares.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'link'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Link className="w-4 h-4" />
              Share Link
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'people' ? (
            <div className="space-y-4">
              {/* Add People Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Add people</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select user
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a user...</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {getUserDisplayName(user)} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permission level
                    </label>
                    <select
                      value={selectedPermission}
                      onChange={(e) =>
                        setSelectedPermission(
                          e.target.value as 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN',
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(PERMISSION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label} - {PERMISSION_DESCRIPTIONS[value]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expires in (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={expiresInDays}
                      onChange={(e) =>
                        setExpiresInDays(e.target.value ? parseInt(e.target.value) : '')
                      }
                      placeholder="Never expires"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
                  </div>

                  <Button
                    onClick={handleShare}
                    disabled={!selectedUserId || shareMutation.isPending}
                    className="w-full"
                  >
                    {shareMutation.isPending ? 'Sharing...' : 'Share'}
                  </Button>
                </div>
              </div>

              {/* Collaborators List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  People with access ({shares.length})
                </h3>
                {shares.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">
                    No one has been granted access to this document yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                            {getInitials(share.sharedWithUser)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {getUserDisplayName(share.sharedWithUser)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {share.sharedWithUser.email}
                            </div>
                            {share.expiresAt && (
                              <div className="text-xs text-orange-600 mt-1">
                                Expires: {new Date(share.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={share.permission}
                            onChange={(e) =>
                              handleUpdatePermission(
                                share.id,
                                e.target.value as 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN',
                              )
                            }
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Object.entries(PERMISSION_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleRevoke(share.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove access"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Shareable Link
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Anyone with this link can access the document if they have an account.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/documents/${documentId}`}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-md bg-white text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant={copiedToClipboard ? 'outline' : 'default'}
                    className="min-w-[100px]"
                  >
                    {copiedToClipboard ? (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Important Notes</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Users must be logged in to access shared documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Access permissions are enforced for each user</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>You can revoke access at any time from the People tab</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
          <Button onClick={onClose} variant="outline">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
