'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslate, useCreate } from '@refinedev/core';
import { TemplateEditor, DocumentTemplateFormData } from '@/components/template-editor';
import { Button } from '@legal/ui';

export default function NewTemplatePage() {
  const translate = useTranslate();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { mutate: createTemplate, mutation: createMutation } = useCreate();
  const isLoading = (createMutation as any).isLoading ?? (createMutation as any).isPending ?? false;

  const handleSave = async (data: DocumentTemplateFormData) => {
    setError(null);
    try {
      await createTemplate(
        {
          resource: 'documentTemplates',
          values: data,
          meta: {
            operation: 'createDocumentTemplate',
          },
        },
        {
          onSuccess: () => {
            router.push('/admin/templates');
          },
          onError: (err: any) => {
            setError(err.message || 'Failed to create template');
          },
        },
      );
    } catch (err: any) {
      setError(err.message || 'Failed to create template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Template</h1>
          <p className="text-gray-600 mt-1">
            Design a new document template with variables and conditional sections
          </p>
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
        onSave={handleSave}
        isLoading={isLoading}
        onCancel={() => router.push('/admin/templates')}
      />
    </div>
  );
}
