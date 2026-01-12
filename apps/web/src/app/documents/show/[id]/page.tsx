"use client";

import { useOne, useTranslate } from "@refinedev/core";
import { useParams } from "next/navigation";
import Link from "next/link";

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
  const id = params?.id as string;

  const { data, isLoading } = useOne<LegalDocument>({
    resource: "documents",
    id,
  });

  const document = data?.data;

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
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

        {/* Document Content */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {translate("documents.fields.content", "Document Content")}
          </h2>
          {document.contentRaw ? (
            <div className="prose max-w-none bg-gray-50 p-6 rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{document.contentRaw}</pre>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800 text-sm">
                {document.status === "GENERATING"
                  ? "Document is being generated. Please wait..."
                  : "No content available yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
