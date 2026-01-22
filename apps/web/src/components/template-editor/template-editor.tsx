"use client";

import { useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslate } from "@refinedev/core";
import { Button } from "@legal/ui/components/Button";
import { Input } from "@legal/ui/components/Input";
import { Label } from "@legal/ui/components/Label";
import { Card } from "@legal/ui/components/Card";

/**
 * Template Category enum matching backend GraphQL schema
 */
export enum TemplateCategory {
  LAWSUIT = "LAWSUIT",
  COMPLAINT = "COMPLAINT",
  CONTRACT = "CONTRACT",
  MOTION = "MOTION",
  LETTER = "LETTER",
  OTHER = "OTHER",
}

/**
 * Template Variable interface matching backend
 */
export interface TemplateVariable {
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

/**
 * Conditional Section interface
 */
export interface ConditionalSection {
  id: string;
  condition: string;
  description?: string;
}

/**
 * Polish Formatting Rules interface
 */
export interface PolishFormattingRules {
  dateFormat?: "DD.MM.YYYY" | "D MMMM YYYY";
  currencyFormat?: "PLN" | "EUR" | "USD";
  addressFormat?: "polish" | "standard";
  numberFormat?: "pl" | "en";
  legalCitations?: boolean;
}

/**
 * Document Template form data
 */
export interface DocumentTemplateFormData {
  name: string;
  category: TemplateCategory;
  description?: string;
  content: string;
  variables: TemplateVariable[];
  conditionalSections?: ConditionalSection[];
  polishFormattingRules?: PolishFormattingRules;
  isActive: boolean;
}

interface TemplateEditorProps {
  initialData?: Partial<DocumentTemplateFormData>;
  onSave: (data: DocumentTemplateFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

/**
 * Variable Editor Component
 */
interface VariableEditorProps {
  variables: TemplateVariable[];
  onChange: (variables: TemplateVariable[]) => void;
}

const VariableEditor: React.FC<VariableEditorProps> = ({ variables, onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addVariable = useCallback(() => {
    const newVariable: TemplateVariable = {
      name: `variable_${variables.length + 1}`,
      label: `Variable ${variables.length + 1}`,
      type: "text",
      required: false,
    };
    onChange([...variables, newVariable]);
    setEditingIndex(variables.length);
  }, [variables, onChange]);

  const updateVariable = useCallback((index: number, updates: Partial<TemplateVariable>) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], ...updates };
    onChange(newVariables);
  }, [variables, onChange]);

  const removeVariable = useCallback((index: number) => {
    onChange(variables.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  }, [variables, onChange, editingIndex]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Template Variables</h3>
        <Button
          type="button"
          onClick={addVariable}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Variable
        </Button>
      </div>

      {variables.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed border-gray-300">
          <p className="text-gray-500">No variables defined yet. Add variables to create dynamic templates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {variables.map((variable, index) => (
            <Card key={index} className="p-4">
              {editingIndex === index ? (
                <VariableForm
                  variable={variable}
                  onUpdate={(updates) => updateVariable(index, updates)}
                  onCancel={() => setEditingIndex(null)}
                  onRemove={() => removeVariable(index)}
                />
              ) : (
                <VariableDisplay
                  variable={variable}
                  onEdit={() => setEditingIndex(index)}
                  onRemove={() => removeVariable(index)}
                />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Variable Form Component
 */
interface VariableFormProps {
  variable: TemplateVariable;
  onUpdate: (updates: Partial<TemplateVariable>) => void;
  onCancel: () => void;
  onRemove: () => void;
}

const VariableForm: React.FC<VariableFormProps> = ({ variable, onUpdate, onCancel, onRemove }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`var-name-${variable.name}`}>Variable Name</Label>
          <Input
            id={`var-name-${variable.name}`}
            value={variable.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="variable_name"
            className="w-full"
          />
        </div>
        <div>
          <Label htmlFor={`var-label-${variable.name}`}>Label</Label>
          <Input
            id={`var-label-${variable.name}`}
            value={variable.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Variable Label"
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`var-type-${variable.name}`}>Type</Label>
          <select
            id={`var-type-${variable.name}`}
            value={variable.type}
            onChange={(e) => onUpdate({ type: e.target.value as TemplateVariable["type"] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="currency">Currency</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={variable.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Required</span>
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor={`var-desc-${variable.name}`}>Description</Label>
        <Input
          id={`var-desc-${variable.name}`}
          value={variable.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Variable description (optional)"
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor={`var-default-${variable.name}`}>Default Value</Label>
        <Input
          id={`var-default-${variable.name}`}
          value={variable.defaultValue?.toString() || ""}
          onChange={(e) => onUpdate({ defaultValue: e.target.value })}
          placeholder="Default value (optional)"
          className="w-full"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Done
        </Button>
        <Button
          type="button"
          onClick={onRemove}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Remove
        </Button>
      </div>
    </div>
  );
};

/**
 * Variable Display Component
 */
interface VariableDisplayProps {
  variable: TemplateVariable;
  onEdit: () => void;
  onRemove: () => void;
}

const VariableDisplay: React.FC<VariableDisplayProps> = ({ variable, onEdit, onRemove }) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{variable.label}</span>
          {variable.required && (
            <span className="text-red-500 text-xs">*</span>
          )}
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
            {variable.type}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">
            {"{{" + variable.name + "}}"}
          </code>
        </div>
        {variable.description && (
          <p className="text-sm text-gray-500 mt-1">{variable.description}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onEdit}
          className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Edit
        </Button>
        <Button
          type="button"
          onClick={onRemove}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Remove
        </Button>
      </div>
    </div>
  );
};

/**
 * Rich Text Editor with Variable Insertion
 */
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables: TemplateVariable[];
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, variables }) => {
  const [showVariableMenu, setShowVariableMenu] = useState(false);

  const insertVariable = useCallback((variableName: string) => {
    const textarea = document.getElementById("template-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const insertion = `{{${variableName}}}`;

    onChange(before + insertion + after);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);

    setShowVariableMenu(false);
  }, [value, onChange]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="template-content">Content</Label>
        <div className="relative">
          <Button
            type="button"
            onClick={() => setShowVariableMenu(!showVariableMenu)}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Insert Variable {"▼"}
          </Button>
          {showVariableMenu && variables.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[200px]">
              {variables.map((variable, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertVariable(variable.name)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                >
                  <div className="font-medium">{variable.label}</div>
                  <div className="text-xs text-gray-500">
                    {"{{" + variable.name + "}}"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <textarea
        id="template-content"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter template content. Use {{variable_name}} to insert variables."
        className="w-full min-h-[400px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
      />
      <div className="mt-2 text-xs text-gray-500">
        <p>Tip: Use {"{{variable_name}}"} syntax to insert variables. Conditional sections: {"{{#if variable}}...{{/if}}"}</p>
      </div>
    </div>
  );
};

/**
 * Main Template Editor Component
 */
export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const translate = useTranslate();
  const methods = useForm<DocumentTemplateFormData>({
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || TemplateCategory.OTHER,
      description: initialData?.description || "",
      content: initialData?.content || "",
      variables: initialData?.variables || [],
      conditionalSections: initialData?.conditionalSections || [],
      polishFormattingRules: initialData?.polishFormattingRules || {},
      isActive: initialData?.isActive ?? true,
    },
  });

  const { handleSubmit, watch, setValue } = methods;
  const content = watch("content");
  const variables = watch("variables");

  const onSubmit = useCallback(async (data: DocumentTemplateFormData) => {
    await onSave(data);
  }, [onSave]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                {...methods.register("name", { required: true })}
                placeholder="e.g., Employment Contract Template"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...methods.register("category")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(TemplateCategory).map((category) => (
                  <option key={category} value={category}>
                    {translate(`templates.categories.${category}`) || category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...methods.register("description")}
                placeholder="Brief description of this template..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...methods.register("isActive")}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (visible to users)
              </Label>
            </div>
          </div>
        </Card>

        {/* Variables */}
        <Card className="p-6">
          <VariableEditor
            variables={variables}
            onChange={(newVariables) => setValue("variables", newVariables)}
          />
        </Card>

        {/* Content Editor */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Template Content</h2>
          <RichTextEditor
            value={content}
            onChange={(newValue) => setValue("content", newValue)}
            variables={variables}
          />
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
