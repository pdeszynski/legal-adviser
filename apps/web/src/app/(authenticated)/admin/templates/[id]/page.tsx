"use client";

import { useState, useEffect } from "react";
import { useNavigation, useTranslate, useOne } from "@refinedev/core";
import { useMutation } from "@refinedev/core";
import { TemplateEditor, DocumentTemplateFormData, TemplateCategory } from "@/components/template-editor";
import { Button } from "@legal/ui/components/Button";

interface TemplateVariable {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "boolean";
  required: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

interface ConditionalSection {
  id: string;
  condition: string;
  description?: string;
}

interface PolishFormattingRules {
  dateFormat?: "DD.MM.YYYY" | "D MMMM YYYY";
  currencyFormat?: "PLN" | "EUR" | "USD";
  addressFormat?: "polish" | "standard";
  numberFormat?: "pl" | "en";
  legalCitations?: boolean;
}

interface DocumentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  content: string;
  variables: TemplateVariable[];
  conditionalSections?: ConditionalSection[];
  polishFormattingRules?: PolishFormattingRules;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const translate = useTranslate();
  const { push } = useNavigation();
  const [error, setError] = useState<string | null>(null);

  const { data: templateData, isLoading: isLoadingTemplate, error: templateError } = useOne<DocumentTemplate>({
    resource: "documentTemplates",
    id: params.id,
  });

  const { mutate: updateTemplate, isLoading: isUpdating } = useMutation();

  const handleSave = async (data: DocumentTemplateFormData) => {
    setError(null);
    try {
      await updateTemplate(
        {
          resource: "documentTemplates",
          id: params.id,
          values: data,
          meta: {
            operation: "updateOneDocumentTemplate",
          },
        },
        {
          onSuccess: () => {
            push("/admin/templates");
          },
          onError: (err: any) => {
            setError(err.message || "Failed to update template");
          },
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to update template");
    }
  };

  if (isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (templateError || !templateData?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load template</p>
        <Button
          type="button"
          onClick={() => push("/admin/templates")}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Templates
        </Button>
      </div>
    );
  }

  const template = templateData.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Template</h1>
          <p className="text-gray-600 mt-1">
            Editing: {template.name}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => push("/admin/templates")}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Back to Templates
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <strong className="font-medium">Error:</strong> {error}
        </div>
      )}

      <TemplateEditor
        initialData={template}
        onSave={handleSave}
        isLoading={isUpdating}
        onCancel={() => push("/admin/templates")}
      />
    </div>
  );
}
