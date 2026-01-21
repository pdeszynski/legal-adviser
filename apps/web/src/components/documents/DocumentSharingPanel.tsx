"use client";

import { useState, useCallback } from "react";
import { useCustomMutation, useCustom, useTranslate } from "@refinedev/core";

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
  permission: "VIEW" | "COMMENT" | "EDIT" | "ADMIN";
  expiresAt?: string | null;
  createdAt: string;
}

interface DocumentSharingPanelProps {
  documentId: string;
}

const PERMISSION_LABELS = {
  VIEW: "View Only",
  COMMENT: "Can Comment",
  EDIT: "Can Edit",
  ADMIN: "Admin",
};

const PERMISSION_DESCRIPTIONS = {
  VIEW: "Can view the document",
  COMMENT: "Can view and comment on the document",
  EDIT: "Can view and edit the document",
  ADMIN: "Full access including sharing with others",
};

export function DocumentSharingPanel({ documentId }: DocumentSharingPanelProps) {
  const translate = useTranslate();
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState<"VIEW" | "COMMENT" | "EDIT" | "ADMIN">("VIEW");
  const [expiresInDays, setExpiresInDays] = useState<number | "">("");

  // Fetch document shares
  const { data: sharesData, isLoading: sharesLoading, refetch: refetchShares } = useCustom<DocumentShare[]>({
    url: "",
    method: "get",
    config: {
      query: {
        operation: "documentShares",
        variables: { documentId },
        fields: [
          "id",
          "sharedWithUserId",
          "sharedByUserId",
          "permission",
          "expiresAt",
          "createdAt",
          { sharedWithUser: ["id", "email", "username", "firstName", "lastName"] },
          { sharedByUser: ["id", "email", "username", "firstName", "lastName"] },
        ],
      },
    },
  });

  // Fetch all users for sharing dropdown
  const { data: usersData } = useCustom<{ data: User[] }>({
    url: "",
    method: "get",
    config: {
      query: {
        operation: "users",
        fields: ["data { id email username firstName lastName }"],
      },
    },
  });

  // Share document mutation
  const { mutate: shareDocument, isLoading: isSharing } = useCustomMutation();

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
        url: "",
        method: "post",
        values: {
          operation: "shareDocument",
          variables: {
            input: {
              documentId,
              sharedWithUserId: selectedUserId,
              permission: selectedPermission,
              ...(expiresAt && { expiresAt }),
            },
          },
          fields: ["id", "permission", "createdAt"],
        },
      },
      {
        onSuccess: () => {
          refetchShares();
          setShowShareModal(false);
          setSelectedUserId("");
          setSelectedPermission("VIEW");
          setExpiresInDays("");
        },
      }
    );
  }, [shareDocument, documentId, selectedUserId, selectedPermission, expiresInDays, refetchShares]);

  const handleRevoke = useCallback(
    (shareId: string) => {
      revokeShare(
        {
          url: "",
          method: "post",
          values: {
            operation: "revokeDocumentShare",
            variables: { shareId },
            fields: ["success"],
          },
        },
        {
          onSuccess: () => {
            refetchShares();
          },
        }
      );
    },
    [revokeShare, refetchShares]
  );

  const handleUpdatePermission = useCallback(
    (shareId: string, newPermission: "VIEW" | "COMMENT" | "EDIT" | "ADMIN") => {
      updatePermission(
        {
          url: "",
          method: "post",
          values: {
            operation: "updateDocumentSharePermission",
            variables: {
              input: {
                shareId,
                permission: newPermission,
              },
            },
            fields: ["id", "permission"],
          },
        },
        {
          onSuccess: () => {
            refetchShares();
          },
        }
      );
    },
    [updatePermission, refetchShares]
  );

  const shares = sharesData?.data || [];
  const users = usersData?.data?.data || [];
  const availableUsers = users.filter((user) => !shares.some((share) => share.sharedWithUserId === user.id));

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email;
  };

  if (sharesLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Sharing & Permissions</h2>
        <button
          onClick={() => setShowShareModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Document
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Share Document</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
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
                  Permission Level
                </label>
                <select
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(PERMISSION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label} - {PERMISSION_DESCRIPTIONS[value as keyof typeof PERMISSION_DESCRIPTIONS]}
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
                  onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="Never expires"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedUserId("");
                  setSelectedPermission("VIEW");
                  setExpiresInDays("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSharing}
              >
                {translate("buttons.cancel", "Cancel")}
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={!selectedUserId || isSharing}
              >
                {isSharing ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shares List */}
      <div className="space-y-3">
        {shares.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            This document has not been shared yet. Click "Share Document" to grant access to other users.
          </p>
        ) : (
          shares.map((share) => (
            <div
              key={share.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {getUserDisplayName(share.sharedWithUser)}
                </div>
                <div className="text-sm text-gray-500">{share.sharedWithUser.email}</div>
                {share.expiresAt && (
                  <div className="text-xs text-orange-600 mt-1">
                    Expires: {new Date(share.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={share.permission}
                  onChange={(e) => handleUpdatePermission(share.id, e.target.value as any)}
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
                  title="Revoke access"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
