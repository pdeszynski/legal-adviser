'use client';

import { useForm } from '@refinedev/react-hook-form';
import { useTranslate, useOne, useNavigation } from '@refinedev/core';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageSkeleton } from '@/components/skeleton';
import type {
  UpdateLegalDocumentInput,
  DocumentType,
  LegalDocumentFragmentFragment,
} from '@/generated/graphql';

// Use the generated type from GraphQL Codegen
type LegalDocument = LegalDocumentFragmentFragment;
type UpdateDocumentInput = UpdateLegalDocumentInput;

/**
 * Document Edit Form
 *
 * Allows editing of DRAFT documents:
 * - Title, type, metadata fields, and content
 * - Uses updateOneLegalDocument mutation
 * - Validates that document is in DRAFT status
 */
export default function DocumentEdit() {
  const translate = useTranslate();
  const params = useParams();
  const { show } = useNavigation();
  const id = params?.id as string;
  const [showMetadata, setShowMetadata] = useState(true);

  // Fetch the existing document
  const { result: documentResult, query: documentQuery } = useOne<LegalDocument>({
    resource: 'documents',
    id,
  });

  const document = documentResult;

  // Initialize form with refine's useForm hook
  const {
    refineCore: { onFinish, formLoading },
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<UpdateDocumentInput>({
    refineCoreProps: {
      resource: 'documents',
      action: 'edit',
      id,
      redirect: 'show',
    },
  });

  // Populate form with existing document data
  useEffect(() => {
    if (document) {
      reset({
        title: document.title,
        type: document.type,
        contentRaw: document.contentRaw || '',
        metadata: {
          plaintiffName: document.metadata?.plaintiffName || '',
          defendantName: document.metadata?.defendantName || '',
          claimAmount: document.metadata?.claimAmount,
          claimCurrency: document.metadata?.claimCurrency || '',
        },
      });
    }
  }, [document, reset]);

  const handleFormSubmit = (data: Record<string, unknown>) => {
    const formData = data as unknown as UpdateDocumentInput;
    const input: UpdateDocumentInput = {};

    // Only include fields that have values
    if (formData.title) {
      input.title = formData.title;
    }

    if (formData.type) {
      input.type = formData.type;
    }

    if (formData.contentRaw !== undefined) {
      input.contentRaw = formData.contentRaw;
    }

    // Only include metadata if at least one field has a value
    const metadata = formData.metadata;
    if (metadata) {
      const hasMetadata =
        metadata.plaintiffName ||
        metadata.defendantName ||
        metadata.claimAmount ||
        metadata.claimCurrency;

      if (hasMetadata) {
        input.metadata = {
          ...(metadata.plaintiffName && { plaintiffName: metadata.plaintiffName }),
          ...(metadata.defendantName && { defendantName: metadata.defendantName }),
          ...(metadata.claimAmount && { claimAmount: metadata.claimAmount }),
          ...(metadata.claimCurrency && { claimCurrency: metadata.claimCurrency }),
        };
      }
    }

    onFinish(input);
  };

  // Loading state
  if (documentQuery.isLoading) {
    return <PageSkeleton showHeader={true} showContent={false} />;
  }

  // Document not found
  if (!document) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-red-600">
          {translate('documents.errors.notFound', 'Document not found')}
        </div>
      </div>
    );
  }

  // Check if document can be edited (only DRAFT status)
  if (document.status !== 'DRAFT') {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            {translate('documents.errors.cannotEdit', 'Cannot Edit Document')}
          </h2>
          <p className="text-yellow-700 mb-4">
            {translate(
              'documents.errors.onlyDraftEditable',
              'Only documents in DRAFT status can be edited. This document is currently in ' +
                document.status +
                ' status.',
            )}
          </p>
          <Link
            href={`/documents/show/${id}`}
            className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            {translate('buttons.back', 'Back to Document')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <Link
          href={`/documents/show/${id}`}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← {translate('buttons.back', 'Back to document')}
        </Link>
        <h1 className="text-3xl font-bold mb-2">
          {translate('documents.titles.edit', 'Edit Document')}
        </h1>
        <p className="text-gray-600">
          {translate(
            'documents.form.editDescription',
            'Update document details, metadata, and content',
          )}
        </p>
      </div>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Document Title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            {translate('documents.fields.title')} *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Debt Recovery Lawsuit"
            {...register('title', {
              required: translate('documents.form.errors.requiredTitle'),
              minLength: {
                value: 3,
                message: translate(
                  'documents.form.errors.titleMinLength',
                  'Title must be at least 3 characters',
                ),
              },
              maxLength: {
                value: 500,
                message: translate(
                  'documents.form.errors.titleMaxLength',
                  'Title cannot exceed 500 characters',
                ),
              },
            })}
          />
          {errors.title && (
            <span className="text-sm text-red-600">{errors.title.message?.toString()}</span>
          )}
        </div>

        {/* Document Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">{translate('documents.fields.type')}</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('type')}
          >
            {(['LAWSUIT', 'COMPLAINT', 'CONTRACT', 'OTHER'] as DocumentType[]).map((type) => (
              <option key={type} value={type}>
                {translate(`documents.types.${type}`)}
              </option>
            ))}
          </select>
          {errors.type && (
            <span className="text-sm text-red-600">{errors.type.message?.toString()}</span>
          )}
        </div>

        {/* Metadata Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{translate('documents.form.metadataSection')}</h2>
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showMetadata ? 'Hide' : 'Show'}
            </button>
          </div>

          {showMetadata && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-md">
              {/* Plaintiff Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  {translate('documents.fields.plaintiffName')}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  maxLength={200}
                  {...register('metadata.plaintiffName')}
                />
              </div>

              {/* Defendant Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  {translate('documents.fields.defendantName')}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Smith"
                  maxLength={200}
                  {...register('metadata.defendantName')}
                />
              </div>

              {/* Claim Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    {translate('documents.fields.claimAmount')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999999999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000.00"
                    {...register('metadata.claimAmount', {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    {translate('documents.fields.claimCurrency')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="PLN"
                    maxLength={3}
                    {...register('metadata.claimCurrency', {
                      pattern: {
                        value: /^[A-Z]{3}$/,
                        message: translate(
                          'documents.form.errors.invalidCurrency',
                          'Currency must be 3 uppercase letters (e.g., PLN, EUR, USD)',
                        ),
                      },
                    })}
                  />
                  {errors['metadata.claimCurrency'] && (
                    <span className="text-sm text-red-600">
                      {(
                        errors['metadata.claimCurrency'] as { message?: string }
                      ).message?.toString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="border-t pt-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {translate('documents.fields.contentRaw', 'Document Content')}
            </label>
            <p className="text-sm text-gray-500 mb-2">
              {translate(
                'documents.form.contentHelp',
                'Edit the document content directly. Supports plain text and Markdown.',
              )}
            </p>
            <textarea
              className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={translate(
                'documents.form.contentPlaceholder',
                'Enter document content...',
              )}
              {...register('contentRaw')}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={formLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {formLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {translate('loading')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {translate('buttons.save', 'Save Changes')}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => show('documents', id)}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {translate('buttons.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
