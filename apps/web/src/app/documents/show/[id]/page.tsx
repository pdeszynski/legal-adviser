"use client";

import { useOne, useTranslate, useInvalidate, useDelete } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Link from "next/link";
import { DocumentGenerationProgress } from "@/components/DocumentGenerationProgress";

interface DocumentMetadata {
  plaintiffName?: string;
  defendantName?: string;
  claimAmount?: number;
  claimCurrency?: string;
  [key: string]: unknown;
}

interface LegalDocument {
  id: string;
  title: string;
  type: string;
  status: string;
  sessionId: string;
  contentRaw?: string | null;
  metadata?: DocumentMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentShow() {
  const translate = useTranslate();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const invalidate = useInvalidate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { query, result } = useOne<LegalDocument>({
    resource: "documents",
    id,
  });
  const isLoading = query.isLoading;
  const document = result;

  const { mutate: deleteDocument } = useDelete();

  /**
   * Handle document generation completion
   * Refetches the document to get the generated content
   */
  const handleGenerationComplete = useCallback(() => {
    // Invalidate and refetch the document to get the generated content
    invalidate({
      resource: "documents",
      invalidates: ["detail"],
      id,
    });
  }, [invalidate, id]);

  /**
   * Handle document generation failure
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGenerationFailed = useCallback((_error: string) => {
    // Invalidate to refresh the failed status
    invalidate({
      resource: "documents",
      invalidates: ["detail"],
      id,
    });
  }, [invalidate, id]);

  /**
   * Handle document deletion
   */
  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    deleteDocument(
      {
        resource: "documents",
        id,
      },
      {
        onSuccess: () => {
          router.push("/documents");
        },
        onError: () => {
          setIsDeleting(false);
        },
      }
    );
  }, [deleteDocument, id, router]);

  /**
   * Start editing mode for DRAFT documents
   */
  const handleStartEdit = useCallback(() => {
    if (document?.contentRaw) {
      setEditedContent(document.contentRaw);
    }
    setIsEditing(true);
  }, [document?.contentRaw]);

  /**
   * Cancel editing mode
   */
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedContent("");
  }, []);

  // Check if document is currently generating
  const isGenerating = document?.status === "GENERATING";

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">{translate("loading")}</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-red-600">Document not found</div>
      </div>
    );
  }

  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800",
    GENERATING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };

  // Check if document can be edited (only DRAFT status)
  const canEdit = document?.status === "DRAFT";
  // Check if document can be regenerated (only FAILED status)
  const canRegenerate = document?.status === "FAILED";

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {translate("buttons.confirm", "Are you sure?")}
            </h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The document &quot;{document.title}&quot; will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isDeleting}
              >
                {translate("buttons.cancel", "Cancel")}
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? translate("loading", "Loading") : translate("buttons.delete", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <Link href="/documents" className="text-blue-600 hover:underline mb-4 inline-block">
          ← {translate("buttons.back", "Back to list")}
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{document.title}</h1>
            <div className="flex gap-3 items-center">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[document.status as keyof typeof statusColors]}`}
              >
                {translate(`documents.statuses.${document.status}`)}
              </span>
              <span className="text-gray-600">
                {translate(`documents.types.${document.type}`)}
              </span>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={handleStartEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {translate("buttons.edit", "Edit")}
              </button>
            )}
            {canRegenerate && (
              <Link href={`/documents/create?regenerate=${document.id}`}>
                <button className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>
              </Link>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {translate("buttons.delete", "Delete")}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Document Details */}
        <div className="grid grid-cols-2 gap-4 border-b pb-4">
          <div>
            <label className="text-sm font-medium text-gray-500">
              {translate("documents.fields.id")}
            </label>
            <p className="text-sm text-gray-900 break-all">{document.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              {translate("documents.fields.sessionId")}
            </label>
            <p className="text-sm text-gray-900 break-all">{document.sessionId}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              {translate("documents.fields.createdAt")}
            </label>
            <p className="text-sm text-gray-900">
              {new Date(document.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              {translate("documents.fields.updatedAt")}
            </label>
            <p className="text-sm text-gray-900">
              {new Date(document.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Metadata */}
        {document.metadata && Object.keys(document.metadata).length > 0 && (
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold mb-3">
              {translate("documents.form.metadataSection")}
            </h2>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              {document.metadata.plaintiffName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translate("documents.fields.plaintiffName")}
                  </label>
                  <p className="text-sm text-gray-900">{document.metadata.plaintiffName}</p>
                </div>
              )}
              {document.metadata.defendantName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translate("documents.fields.defendantName")}
                  </label>
                  <p className="text-sm text-gray-900">{document.metadata.defendantName}</p>
                </div>
              )}
              {document.metadata.claimAmount && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {translate("documents.fields.claimAmount")}
                  </label>
                  <p className="text-sm text-gray-900">
                    {document.metadata.claimAmount.toLocaleString()}{" "}
                    {document.metadata.claimCurrency || "PLN"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time Generation Progress */}
        {isGenerating && (
          <div className="mb-4">
            <DocumentGenerationProgress
              documentId={document.id}
              onComplete={handleGenerationComplete}
              onFailed={handleGenerationFailed}
              enabled={isGenerating}
            />
          </div>
        )}

        {/* Document Content */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">
              {translate("documents.fields.content", "Document Content")}
            </h2>
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  {translate("buttons.cancel", "Cancel")}
                </button>
                <button
                  onClick={() => {
                    // Save functionality would be implemented here
                    // For now, just exit edit mode
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  {translate("buttons.save", "Save")}
                </button>
              </div>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter document content..."
            />
          ) : document.contentRaw ? (
            <div className="prose max-w-none bg-gray-50 p-6 rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{document.contentRaw}</pre>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800 text-sm">
                {document.status === "GENERATING"
                  ? translate("documents.messages.generating", "Document is being generated. Please wait...")
                  : document.status === "FAILED"
                  ? "Document generation failed. Please try again."
                  : translate("documents.messages.noContent", "No content available yet.")}
              </p>
            </div>
          )}
        </div>

        {/* Generation History Section */}
        <div className="border-t pt-4 mt-4">
          <h2 className="text-lg font-semibold mb-3">Generation History</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              <span className="text-gray-600">Document created</span>
              <span className="text-gray-400">{new Date(document.createdAt).toLocaleString()}</span>
            </div>
            {document.status === "GENERATING" && (
              <div className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-blue-600">Generation in progress...</span>
              </div>
            )}
            {document.status === "COMPLETED" && (
              <div className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-green-600">Generation completed</span>
                <span className="text-gray-400">{new Date(document.updatedAt).toLocaleString()}</span>
              </div>
            )}
            {document.status === "FAILED" && (
              <div className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-red-600">Generation failed</span>
                <span className="text-gray-400">{new Date(document.updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
