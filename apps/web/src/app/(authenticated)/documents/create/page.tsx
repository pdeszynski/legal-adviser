"use client";

import { useForm } from "@refinedev/react-hook-form";
import { Link, useTranslate } from "@refinedev/core";
import { useState } from "react";
import {
  LegalGroundSuggestions,
  type LegalGroundSuggestion,
} from "@/components/legal-grounds-suggestions";

/**
 * Document Type enum matching backend GraphQL schema
 */
enum DocumentType {
  LAWSUIT = "LAWSUIT",
  COMPLAINT = "COMPLAINT",
  CONTRACT = "CONTRACT",
  OTHER = "OTHER",
}

/**
 * Metadata input matching GraphQL DocumentMetadataInput
 */
interface DocumentMetadataInput {
  plaintiffName?: string;
  defendantName?: string;
  claimAmount?: number;
  claimCurrency?: string;
}

/**
 * Form data matching GraphQL GenerateDocumentInput
 */
interface GenerateDocumentInput {
  sessionId: string;
  title: string;
  type?: DocumentType;
  metadata?: DocumentMetadataInput;
}

/**
 * Document Generation Form
 *
 * Part of User Story 1: AI Document Generation
 * Uses GraphQL mutation (generateDocument) per constitution.
 */
export default function DocumentCreate() {
  const translate = useTranslate();
  const [showMetadata, setShowMetadata] = useState(true);
  const [suggestions, setSuggestions] = useState<LegalGroundSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const {
    refineCore: { onFinish, formLoading },
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<GenerateDocumentInput>({
    refineCoreProps: {
      resource: "documents",
      action: "create",
      redirect: "show",
    },
  });

  // For MVP, we'll use a temporary session ID
  // TODO: In production, get sessionId from authenticated user context
  const temporarySessionId = "00000000-0000-0000-0000-000000000000";

  // Mock function to load suggestions based on form input
  // TODO: Integrate with AI backend for real suggestions
  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSuggestions([
      {
        id: "1",
        article: "Art. 361 § 1 K.c.",
        title: "Termination of contract without notice",
        explanation:
          "In case of a serious breach of contract by the employer, the employee has the right to terminate the employment contract without notice.",
        confidence: "high",
      },
      {
        id: "2",
        article: "Art. 94 § 1 K.p.",
        title: "Employer's information obligations",
        explanation:
          "The employer is obliged to inform the employee about the type of work, place of work, and date of commencement of employment.",
        confidence: "medium",
      },
    ]);
    setIsLoadingSuggestions(false);
  };

  const handleFormSubmit = (data: Record<string, unknown>) => {
    // Build the GraphQL input object matching GenerateDocumentInput
    const formData = data as unknown as GenerateDocumentInput;
    const input: GenerateDocumentInput = {
      sessionId: temporarySessionId,
      title: formData.title,
      type: formData.type || DocumentType.OTHER,
    };

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

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {translate("documents.titles.create")}
        </h1>
        <p className="text-gray-600">
          {translate("documents.form.description")}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Document Title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            {translate("documents.fields.title")} *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Debt Recovery Lawsuit"
            {...register("title", {
              required: translate("documents.form.errors.requiredTitle"),
            })}
          />
          {errors.title && (
            <span className="text-sm text-red-600">
              {errors.title.message?.toString()}
            </span>
          )}
        </div>

        {/* Document Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            {translate("documents.fields.type")}
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={DocumentType.LAWSUIT}
            {...register("type")}
          >
            {Object.values(DocumentType).map((type) => (
              <option key={type} value={type}>
                {translate(`documents.types.${type}`)}
              </option>
            ))}
          </select>
          {errors.type && (
            <span className="text-sm text-red-600">
              {errors.type.message?.toString()}
            </span>
          )}
        </div>

        {/* Legal Grounds Suggestions */}
        {(suggestions.length > 0 || isLoadingSuggestions) && (
          <div className="space-y-2">
            <LegalGroundSuggestions
              suggestions={suggestions}
              loading={isLoadingSuggestions}
              inline={true}
              onSelect={() => {
                // Handle suggestion selection
                // TODO: Integrate with form to pre-fill or apply suggestion
              }}
            />
          </div>
        )}

        {/* Suggest Legal Grounds Button */}
        {suggestions.length === 0 && !isLoadingSuggestions && (
          <div className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={loadSuggestions}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Get AI suggestions for legal grounds
            </button>
          </div>
        )}

        {/* Metadata Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {translate("documents.form.metadataSection")}
            </h2>
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showMetadata ? "Hide" : "Show"}
            </button>
          </div>

          {showMetadata && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-md">
              {/* Plaintiff Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  {translate("documents.fields.plaintiffName")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  {...register("metadata.plaintiffName")}
                />
              </div>

              {/* Defendant Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  {translate("documents.fields.defendantName")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Smith"
                  {...register("metadata.defendantName")}
                />
              </div>

              {/* Claim Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    {translate("documents.fields.claimAmount")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000.00"
                    {...register("metadata.claimAmount", {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    {translate("documents.fields.claimCurrency")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="PLN"
                    maxLength={3}
                    {...register("metadata.claimCurrency")}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={formLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formLoading
              ? translate("loading")
              : translate("buttons.create")}
          </button>
          <Link to="/documents">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {translate("buttons.cancel")}
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
