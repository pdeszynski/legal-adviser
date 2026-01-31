'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslate, useOne, useUpdate } from '@refinedev/core';
import {
  TemplateEditor,
  DocumentTemplateFormData,
  TemplateCategory,
} from '@/components/template-editor';
import { Button } from '@legal/ui';
import { CenteredPageSkeleton } from '@/components/skeleton';

interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean';
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
  dateFormat?: 'DD.MM.YYYY' | 'D MMMM YYYY';
  currencyFormat?: 'PLN' | 'EUR' | 'USD';
  addressFormat?: 'polish' | 'standard';
  numberFormat?: 'pl' | 'en';
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

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const translate = useTranslate();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);

  // Next.js 15: params is a Promise
  useEffect(() => {
    params.then((p) => setTemplateId(p.id));
  }, [params]);

  const { query, result } = useOne<DocumentTemplate>({
    resource: 'documentTemplates',
    id: templateId ?? '',
    queryOptions: {
      enabled: !!templateId,
    },
  });

  const { data: templateData, isLoading: isLoadingTemplate, error: templateError } = query;

  const { mutate: updateTemplate, mutation: updateMutation } = useUpdate();
  const isUpdating =
    (updateMutation as any).isLoading ?? (updateMutation as any).isPending ?? false;

  const handleSave = async (data: DocumentTemplateFormData) => {
    if (!templateId) return;
    setError(null);
    try {
      await updateTemplate(
        {
          resource: 'documentTemplates',
          id: templateId,
          values: data,
          meta: {
            operation: 'updateDocumentTemplate',
          },
        },
        {
          onSuccess: () => {
            router.push('/admin/templates');
          },
          onError: (err: any) => {
            setError(err.message || 'Failed to update template');
          },
        },
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update template');
    }
  };

  if (isLoadingTemplate) {
    return <CenteredPageSkeleton message="Loading template..." />;
  }

  if (templateError || !result) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load template</p>
        <Button
          type="button"
          onClick={() => router.push('/admin/templates')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Templates
        </Button>
      </div>
    );
  }

  const template = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Template</h1>
          <p className="text-gray-600 mt-1">Editing: {template.name}</p>
        </div>
        <Button
          type="button"
          onClick={() => router.push('/admin/templates')}
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
        onCancel={() => router.push('/admin/templates')}
      />
    </div>
  );
}
