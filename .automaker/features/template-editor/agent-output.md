I'll implement the template editor feature for the legal AI platform. Let me start by exploring the codebase to understand the existing structure.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase structure and existing template implementation",
      "status": "in_progress",
      "activeForm": "Exploring codebase structure and existing template implementation"
    },
    {
      "content": "Design template editor UI component with rich text editor",
      "status": "pending",
      "activeForm": "Designing template editor UI component with rich text editor"
    },
    {
      "content": "Implement backend GraphQL mutations for template CRUD",
      "status": "pending",
      "activeForm": "Implementing backend GraphQL mutations for template CRUD"
    },
    {
      "content": "Create template editor page in frontend",
      "status": "pending",
      "activeForm": "Creating template editor page in frontend"
    },
    {
      "content": "Add variable insertion and preview functionality",
      "status": "pending",
      "activeForm": "Adding variable insertion and preview functionality"
    },
    {
      "content": "Verify implementation with Playwright test",
      "status": "pending",
      "activeForm": "Verifying implementation with Playwright test"
    }
  ]
}

🔧 Tool: Task
Input: {
  "subagent_type": "Explore",
  "description": "Explore template implementation",
  "prompt": "I need to understand the existing template-related code in this legal AI platform. Please explore:\n\n1. **Backend template implementation**: Look for template entities, DTOs, resolvers, and services in `apps/backend/src/modules/documents/`\n2. **Frontend template pages**: Check if there are any template-related pages in `apps/web/src/app/`\n3. **Shared types and interfaces**: Look for template types in shared packages\n4. **GraphQL schema**: Check the existing GraphQL schema for template-related types and operations\n5. **UI component patterns**: Look at existing admin pages and forms to understand the UI patterns used\n\nPlease provide:\n- List of existing template-related files and their purpose\n- GraphQL schema/types already defined for templates\n- UI component patterns used in the app (especially for admin interfaces)\n- Any rich text editor components already in use\n\nThoroughness level: medium"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/template*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/**/*template*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/*template*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/app/**/template*"
}

🔧 Tool: Grep
Input: {
  "output_mode": "content",
  "path": "apps/backend/src/schema.gql",
  "pattern": "type.*Template|input.*Template|Template.*type"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/entities/document-template.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/document-templates.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/template-engine.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/dto/document-template.dto.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/components/**/admin*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/layout/admin-main-layout.tsx"
}

🔧 Tool: Grep
Input: {
  "output_mode": "files_with_matches",
  "path": "apps/web/src",
  "pattern": "react-quill|@uiw/react|@mantine|rich.*text|editor"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/collaboration/collaborative-textarea.tsx"
}

🔧 Tool: Grep
Input: {
  "output_mode": "files_with_matches",
  "path": "apps/web/src",
  "pattern": "@mantine|shadcn|ui|form.*input|select.*input"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/templates/page.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/shared-kernel/**/*"
}

🔧 Tool: Grep
Input: {
  "-A": 5,
  "output_mode": "content",
  "path": "apps/backend/src/schema.gql",
  "pattern": "createDocumentTemplate|updateDocumentTemplate|generateDocumentFromTemplate|renderTemplate|documentTemplates|documentTemplate"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/components/ui/*"
}

🔧 Tool: Grep
Input: {
  "output_mode": "files_with_matches",
  "path": "apps/web/src",
  "pattern": "@/components/ui"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/package.json",
  "limit": 50
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/ui/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/packages/ui/src/components/index.ts"
}
Now let me look at the existing template entity and DTOs to understand the data structure better:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/entities/document-template.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/dto/document-template.dto.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/templates/page.tsx"
}
Now let me check the UI package to see what components are available:

🔧 Tool: Glob
Input: {
  "pattern": "packages/ui/src/**/*.tsx"
}
Let me check the package.json for the web app to see what packages are available:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/package.json"
}
Now let me check the admin layout to understand the structure:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/layout/admin-main-layout.tsx"
}
Perfect! Now I have a good understanding of the codebase. Let me update the todo list and start implementing the template editor. Based on my exploration, I need to:

1. Create a template editor page in the admin section
2. Add a rich text editor component (I'll use a simple but effective approach with textarea enhanced with variable insertion)
3. Create the necessary UI for managing variables
4. Add preview functionality

Let me start by implementing the template editor:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure and existing template implementation",
      "content": "Explore codebase structure and existing template implementation",
      "status": "completed"
    },
    {
      "activeForm": "Creating template editor component with rich text editor",
      "content": "Create template editor component with rich text editor",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating template editor page in admin section",
      "content": "Create template editor page in admin section",
      "status": "pending"
    },
    {
      "activeForm": "Adding variable management UI",
      "content": "Add variable management UI",
      "status": "pending"
    },
    {
      "activeForm": "Adding template preview functionality",
      "content": "Add template preview functionality",
      "status": "pending"
    },
    {
      "activeForm": "Updating admin layout to include templates",
      "content": "Update admin layout to include templates",
      "status": "pending"
    },
    {
      "activeForm": "Verifying implementation with Playwright test",
      "content": "Verify implementation with Playwright test",
      "status": "pending"
    }
  ]
}
Now let me create the template editor component. First, I'll create the main template editor component:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/template-editor/template-editor.tsx",
  "content": "\"use client\";\n\nimport { useState, useCallback } from \"react\";\nimport { useForm, FormProvider } from \"react-hook-form\";\nimport { useTranslate } from \"@refinedev/core\";\nimport { Button } from \"@legal/ui/components/Button\";\nimport { Input } from \"@legal/ui/components/Input\";\nimport { Label } from \"@legal/ui/components/Label\";\nimport { Card } from \"@legal/ui/components/Card\";\n\n/**\n * Template Category enum matching backend GraphQL schema\n */\nexport enum TemplateCategory {\n  LAWSUIT = \"LAWSUIT\",\n  COMPLAINT = \"COMPLAINT\",\n  CONTRACT = \"CONTRACT\",\n  MOTION = \"MOTION\",\n  LETTER = \"LETTER\",\n  OTHER = \"OTHER\",\n}\n\n/**\n * Template Variable interface matching backend\n */\nexport interface TemplateVariable {\n  name: string;\n  label: string;\n  type: \"text\" | \"number\" | \"date\" | \"currency\" | \"boolean\";\n  required: boolean;\n  defaultValue?: string | number | boolean;\n  description?: string;\n  validation?: {\n    min?: number;\n    max?: number;\n    pattern?: string;\n    minLength?: number;\n    maxLength?: number;\n  };\n}\n\n/**\n * Conditional Section interface\n */\nexport interface ConditionalSection {\n  id: string;\n  condition: string;\n  description?: string;\n}\n\n/**\n * Polish Formatting Rules interface\n */\nexport interface PolishFormattingRules {\n  dateFormat?: \"DD.MM.YYYY\" | \"D MMMM YYYY\";\n  currencyFormat?: \"PLN\" | \"EUR\" | \"USD\";\n  addressFormat?: \"polish\" | \"standard\";\n  numberFormat?: \"pl\" | \"en\";\n  legalCitations?: boolean;\n}\n\n/**\n * Document Template form data\n */\nexport interface DocumentTemplateFormData {\n  name: string;\n  category: TemplateCategory;\n  description?: string;\n  content: string;\n  variables: TemplateVariable[];\n  conditionalSections?: ConditionalSection[];\n  polishFormattingRules?: PolishFormattingRules;\n  isActive: boolean;\n}\n\ninterface TemplateEditorProps {\n  initialData?: Partial<DocumentTemplateFormData>;\n  onSave: (data: DocumentTemplateFormData) => Promise<void>;\n  onCancel?: () => void;\n  isLoading?: boolean;\n}\n\n/**\n * Variable Editor Component\n */\ninterface VariableEditorProps {\n  variables: TemplateVariable[];\n  onChange: (variables: TemplateVariable[]) => void;\n}\n\nconst VariableEditor: React.FC<VariableEditorProps> = ({ variables, onChange }) => {\n  const [editingIndex, setEditingIndex] = useState<number | null>(null);\n\n  const addVariable = useCallback(() => {\n    const newVariable: TemplateVariable = {\n      name: `variable_${variables.length + 1}`,\n      label: `Variable ${variables.length + 1}`,\n      type: \"text\",\n      required: false,\n    };\n    onChange([...variables, newVariable]);\n    setEditingIndex(variables.length);\n  }, [variables, onChange]);\n\n  const updateVariable = useCallback((index: number, updates: Partial<TemplateVariable>) => {\n    const newVariables = [...variables];\n    newVariables[index] = { ...newVariables[index], ...updates };\n    onChange(newVariables);\n  }, [variables, onChange]);\n\n  const removeVariable = useCallback((index: number) => {\n    onChange(variables.filter((_, i) => i !== index));\n    if (editingIndex === index) {\n      setEditingIndex(null);\n    }\n  }, [variables, onChange, editingIndex]);\n\n  return (\n    <div className=\"space-y-4\">\n      <div className=\"flex items-center justify-between\">\n        <h3 className=\"text-lg font-semibold\">Template Variables</h3>\n        <Button\n          type=\"button\"\n          onClick={addVariable}\n          className=\"px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700\"\n        >\n          Add Variable\n        </Button>\n      </div>\n\n      {variables.length === 0 ? (\n        <div className=\"text-center py-8 bg-gray-50 rounded-md border border-dashed border-gray-300\">\n          <p className=\"text-gray-500\">No variables defined yet. Add variables to create dynamic templates.</p>\n        </div>\n      ) : (\n        <div className=\"space-y-3\">\n          {variables.map((variable, index) => (\n            <Card key={index} className=\"p-4\">\n              {editingIndex === index ? (\n                <VariableForm\n                  variable={variable}\n                  onUpdate={(updates) => updateVariable(index, updates)}\n                  onCancel={() => setEditingIndex(null)}\n                  onRemove={() => removeVariable(index)}\n                />\n              ) : (\n                <VariableDisplay\n                  variable={variable}\n                  onEdit={() => setEditingIndex(index)}\n                  onRemove={() => removeVariable(index)}\n                />\n              )}\n            </Card>\n          ))}\n        </div>\n      )}\n    </div>\n  );\n};\n\n/**\n * Variable Form Component\n */\ninterface VariableFormProps {\n  variable: TemplateVariable;\n  onUpdate: (updates: Partial<TemplateVariable>) => void;\n  onCancel: () => void;\n  onRemove: () => void;\n}\n\nconst VariableForm: React.FC<VariableFormProps> = ({ variable, onUpdate, onCancel, onRemove }) => {\n  return (\n    <div className=\"space-y-3\">\n      <div className=\"grid grid-cols-2 gap-3\">\n        <div>\n          <Label htmlFor={`var-name-${variable.name}`}>Variable Name</Label>\n          <Input\n            id={`var-name-${variable.name}`}\n            value={variable.name}\n            onChange={(e) => onUpdate({ name: e.target.value })}\n            placeholder=\"variable_name\"\n            className=\"w-full\"\n          />\n        </div>\n        <div>\n          <Label htmlFor={`var-label-${variable.name}`}>Label</Label>\n          <Input\n            id={`var-label-${variable.name}`}\n            value={variable.label}\n            onChange={(e) => onUpdate({ label: e.target.value })}\n            placeholder=\"Variable Label\"\n            className=\"w-full\"\n          />\n        </div>\n      </div>\n\n      <div className=\"grid grid-cols-2 gap-3\">\n        <div>\n          <Label htmlFor={`var-type-${variable.name}`}>Type</Label>\n          <select\n            id={`var-type-${variable.name}`}\n            value={variable.type}\n            onChange={(e) => onUpdate({ type: e.target.value as TemplateVariable[\"type\"] })}\n            className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"\n          >\n            <option value=\"text\">Text</option>\n            <option value=\"number\">Number</option>\n            <option value=\"date\">Date</option>\n            <option value=\"currency\">Currency</option>\n            <option value=\"boolean\">Boolean</option>\n          </select>\n        </div>\n        <div className=\"flex items-end\">\n          <label className=\"flex items-center gap-2\">\n            <input\n              type=\"checkbox\"\n              checked={variable.required}\n              onChange={(e) => onUpdate({ required: e.target.checked })}\n              className=\"w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500\"\n            />\n            <span className=\"text-sm font-medium\">Required</span>\n          </label>\n        </div>\n      </div>\n\n      <div>\n        <Label htmlFor={`var-desc-${variable.name}`}>Description</Label>\n        <Input\n          id={`var-desc-${variable.name}`}\n          value={variable.description || \"\"}\n          onChange={(e) => onUpdate({ description: e.target.value })}\n          placeholder=\"Variable description (optional)\"\n          className=\"w-full\"\n        />\n      </div>\n\n      <div>\n        <Label htmlFor={`var-default-${variable.name}`}>Default Value</Label>\n        <Input\n          id={`var-default-${variable.name}`}\n          value={variable.defaultValue?.toString() || \"\"}\n          onChange={(e) => onUpdate({ defaultValue: e.target.value })}\n          placeholder=\"Default value (optional)\"\n          className=\"w-full\"\n        />\n      </div>\n\n      <div className=\"flex gap-2 pt-2\">\n        <Button\n          type=\"button\"\n          onClick={onCancel}\n          className=\"px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50\"\n        >\n          Done\n        </Button>\n        <Button\n          type=\"button\"\n          onClick={onRemove}\n          className=\"px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700\"\n        >\n          Remove\n        </Button>\n      </div>\n    </div>\n  );\n};\n\n/**\n * Variable Display Component\n */\ninterface VariableDisplayProps {\n  variable: TemplateVariable;\n  onEdit: () => void;\n  onRemove: () => void;\n}\n\nconst VariableDisplay: React.FC<VariableDisplayProps> = ({ variable, onEdit, onRemove }) => {\n  return (\n    <div className=\"flex items-start justify-between gap-4\">\n      <div className=\"flex-1\">\n        <div className=\"flex items-center gap-2 mb-1\">\n          <span className=\"font-medium text-gray-900\">{variable.label}</span>\n          {variable.required && (\n            <span className=\"text-red-500 text-xs\">*</span>\n          )}\n          <span className=\"px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded\">\n            {variable.type}\n          </span>\n        </div>\n        <div className=\"text-sm text-gray-600\">\n          <code className=\"px-1 py-0.5 bg-gray-100 rounded text-xs\">\n            {\"{{\" + variable.name + \"}}\"}\n          </code>\n        </div>\n        {variable.description && (\n          <p className=\"text-sm text-gray-500 mt-1\">{variable.description}</p>\n        )}\n      </div>\n      <div className=\"flex gap-2\">\n        <Button\n          type=\"button\"\n          onClick={onEdit}\n          className=\"px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50\"\n        >\n          Edit\n        </Button>\n        <Button\n          type=\"button\"\n          onClick={onRemove}\n          className=\"px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700\"\n        >\n          Remove\n        </Button>\n      </div>\n    </div>\n  );\n};\n\n/**\n * Rich Text Editor with Variable Insertion\n */\ninterface RichTextEditorProps {\n  value: string;\n  onChange: (value: string) => void;\n  variables: TemplateVariable[];\n}\n\nconst RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, variables }) => {\n  const [showVariableMenu, setShowVariableMenu] = useState(false);\n\n  const insertVariable = useCallback((variableName: string) => {\n    const textarea = document.getElementById(\"template-content\") as HTMLTextAreaElement;\n    if (!textarea) return;\n\n    const start = textarea.selectionStart;\n    const end = textarea.selectionEnd;\n    const text = value;\n    const before = text.substring(0, start);\n    const after = text.substring(end);\n    const insertion = `{{${variableName}}}`;\n\n    onChange(before + insertion + after);\n\n    // Set cursor position after insertion\n    setTimeout(() => {\n      textarea.focus();\n      textarea.setSelectionRange(start + insertion.length, start + insertion.length);\n    }, 0);\n\n    setShowVariableMenu(false);\n  }, [value, onChange]);\n\n  return (\n    <div className=\"relative\">\n      <div className=\"flex items-center gap-2 mb-2\">\n        <Label htmlFor=\"template-content\">Content</Label>\n        <div className=\"relative\">\n          <Button\n            type=\"button\"\n            onClick={() => setShowVariableMenu(!showVariableMenu)}\n            className=\"px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50\"\n          >\n            Insert Variable {\"▼\"}\n          </Button>\n          {showVariableMenu && variables.length > 0 && (\n            <div className=\"absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[200px]\">\n              {variables.map((variable, index) => (\n                <button\n                  key={index}\n                  type=\"button\"\n                  onClick={() => insertVariable(variable.name)}\n                  className=\"block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-md last:rounded-b-md\"\n                >\n                  <div className=\"font-medium\">{variable.label}</div>\n                  <div className=\"text-xs text-gray-500\">\n                    {\"{{\" + variable.name + \"}}\"}\n                  </div>\n                </button>\n              ))}\n            </div>\n          )}\n        </div>\n      </div>\n      <textarea\n        id=\"template-content\"\n        value={value}\n        onChange={(e) => onChange(e.target.value)}\n        placeholder=\"Enter template content. Use {{variable_name}} to insert variables.\"\n        className=\"w-full min-h-[400px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm\"\n      />\n      <div className=\"mt-2 text-xs text-gray-500\">\n        <p>Tip: Use {\"{{variable_name}}\"} syntax to insert variables. Conditional sections: {\"{{#if variable}}...{{/if}}\"}</p>\n      </div>\n    </div>\n  );\n};\n\n/**\n * Main Template Editor Component\n */\nexport const TemplateEditor: React.FC<TemplateEditorProps> = ({\n  initialData,\n  onSave,\n  onCancel,\n  isLoading = false,\n}) => {\n  const translate = useTranslate();\n  const methods = useForm<DocumentTemplateFormData>({\n    defaultValues: {\n      name: initialData?.name || \"\",\n      category: initialData?.category || TemplateCategory.OTHER,\n      description: initialData?.description || \"\",\n      content: initialData?.content || \"\",\n      variables: initialData?.variables || [],\n      conditionalSections: initialData?.conditionalSections || [],\n      polishFormattingRules: initialData?.polishFormattingRules || {},\n      isActive: initialData?.isActive ?? true,\n    },\n  });\n\n  const { handleSubmit, watch, setValue } = methods;\n  const content = watch(\"content\");\n  const variables = watch(\"variables\");\n\n  const onSubmit = useCallback(async (data: DocumentTemplateFormData) => {\n    await onSave(data);\n  }, [onSave]);\n\n  return (\n    <FormProvider {...methods}>\n      <form onSubmit={handleSubmit(onSubmit)} className=\"space-y-6\">\n        {/* Basic Information */}\n        <Card className=\"p-6\">\n          <h2 className=\"text-xl font-semibold mb-4\">Basic Information</h2>\n          <div className=\"space-y-4\">\n            <div>\n              <Label htmlFor=\"name\">Template Name</Label>\n              <Input\n                id=\"name\"\n                {...methods.register(\"name\", { required: true })}\n                placeholder=\"e.g., Employment Contract Template\"\n                className=\"w-full\"\n              />\n            </div>\n\n            <div>\n              <Label htmlFor=\"category\">Category</Label>\n              <select\n                id=\"category\"\n                {...methods.register(\"category\")}\n                className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"\n              >\n                {Object.values(TemplateCategory).map((category) => (\n                  <option key={category} value={category}>\n                    {translate(`templates.categories.${category}`) || category}\n                  </option>\n                ))}\n              </select>\n            </div>\n\n            <div>\n              <Label htmlFor=\"description\">Description</Label>\n              <textarea\n                id=\"description\"\n                {...methods.register(\"description\")}\n                placeholder=\"Brief description of this template...\"\n                rows={3}\n                className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"\n              />\n            </div>\n\n            <div className=\"flex items-center gap-2\">\n              <input\n                type=\"checkbox\"\n                id=\"isActive\"\n                {...methods.register(\"isActive\")}\n                className=\"w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500\"\n              />\n              <Label htmlFor=\"isActive\" className=\"cursor-pointer\">\n                Active (visible to users)\n              </Label>\n            </div>\n          </div>\n        </Card>\n\n        {/* Variables */}\n        <Card className=\"p-6\">\n          <VariableEditor\n            variables={variables}\n            onChange={(newVariables) => setValue(\"variables\", newVariables)}\n          />\n        </Card>\n\n        {/* Content Editor */}\n        <Card className=\"p-6\">\n          <h2 className=\"text-xl font-semibold mb-4\">Template Content</h2>\n          <RichTextEditor\n            value={content}\n            onChange={(newValue) => setValue(\"content\", newValue)}\n            variables={variables}\n          />\n        </Card>\n\n        {/* Actions */}\n        <div className=\"flex gap-3 justify-end\">\n          {onCancel && (\n            <Button\n              type=\"button\"\n              onClick={onCancel}\n              className=\"px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50\"\n              disabled={isLoading}\n            >\n              Cancel\n            </Button>\n          )}\n          <Button\n            type=\"submit\"\n            disabled={isLoading}\n            className=\"px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400\"\n          >\n            {isLoading ? \"Saving...\" : \"Save Template\"}\n          </Button>\n        </div>\n      </form>\n    </FormProvider>\n  );\n};\n"
}
Now let me create an index file for the template editor:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/template-editor/index.ts",
  "content": "export { TemplateEditor } from \"./template-editor\";\nexport type {\n  TemplateVariable,\n  ConditionalSection,\n  PolishFormattingRules,\n  DocumentTemplateFormData,\n} from \"./template-editor\";\nexport { TemplateCategory } from \"./template-editor\";\n"
}
Now let me update the todo list and create the template editor page:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure and existing template implementation",
      "content": "Explore codebase structure and existing template implementation",
      "status": "completed"
    },
    {
      "activeForm": "Creating template editor component with rich text editor",
      "content": "Create template editor component with rich text editor",
      "status": "completed"
    },
    {
      "activeForm": "Creating template editor page in admin section",
      "content": "Create template editor page in admin section",
      "status": "in_progress"
    },
    {
      "activeForm": "Adding variable management UI",
      "content": "Add variable management UI",
      "status": "completed"
    },
    {
      "activeForm": "Adding template preview functionality",
      "content": "Add template preview functionality",
      "status": "pending"
    },
    {
      "activeForm": "Updating admin layout to include templates",
      "content": "Update admin layout to include templates",
      "status": "pending"
    },
    {
      "activeForm": "Verifying implementation with Playwright test",
      "content": "Verify implementation with Playwright test",
      "status": "pending"
    }
  ]
}
Now let me create the admin template editor pages. First, let me check if the admin directory exists:

🔧 Tool: Bash
Input: {
  "command": "ls -la apps/web/src/app/(authenticated)/admin/ 2>/dev/null || echo \"Admin directory does not exist\"",
  "description": "Check if admin directory exists"
}
Let me check the correct path:

🔧 Tool: Bash
Input: {
  "command": "find apps/web/src/app -type d -name \"admin\" 2>/dev/null",
  "description": "Find admin directory"
}
Good, the admin directory exists. Let me check what's in it:

🔧 Tool: Bash
Input: {
  "command": "ls -la apps/web/src/app/\\(authenticated\\)/admin/",
  "description": "List admin directory contents"
}
Good! Now let me create the templates directory and pages. First, let me create a page to list and manage templates:

🔧 Tool: Bash
Input: {
  "command": "mkdir -p apps/web/src/app/\\(authenticated\\)/admin/templates",
  "description": "Create admin templates directory"
}
Now let me create the template list page:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/admin/templates/page.tsx",
  "content": "\"use client\";\n\nimport { useState } from \"react\";\nimport { useList, useNavigation, useTranslate } from \"@refinedev/core\";\nimport Link from \"next/link\";\nimport { TemplateCategory } from \"@/components/template-editor\";\n\ninterface DocumentTemplate {\n  id: string;\n  name: string;\n  category: TemplateCategory;\n  description?: string;\n  content: string;\n  variables: Array<{\n    name: string;\n    label: string;\n    type: string;\n    required: boolean;\n  }>;\n  conditionalSections?: Array<{\n    id: string;\n    condition: string;\n    description?: string;\n  }>;\n  isActive: boolean;\n  usageCount: number;\n  createdAt: string;\n  updatedAt: string;\n}\n\nconst categoryColors: Record<string, string> = {\n  LAWSUIT: \"bg-red-100 text-red-800\",\n  COMPLAINT: \"bg-orange-100 text-orange-800\",\n  CONTRACT: \"bg-blue-100 text-blue-800\",\n  MOTION: \"bg-purple-100 text-purple-800\",\n  LETTER: \"bg-green-100 text-green-800\",\n  OTHER: \"bg-gray-100 text-gray-800\",\n};\n\nexport default function AdminTemplatesPage() {\n  const translate = useTranslate();\n  const { push } = useNavigation();\n  const [searchFilter, setSearchFilter] = useState(\"\");\n  const [categoryFilter, setCategoryFilter] = useState(\"\");\n\n  const { data, isLoading, error } = useList<DocumentTemplate>({\n    resource: \"documentTemplates\",\n    pagination: {\n      pageSize: 100,\n    },\n    sorters: [\n      {\n        field: \"updatedAt\",\n        order: \"desc\",\n      },\n    ],\n  });\n\n  const filteredTemplates = data?.data?.filter((template) => {\n    const matchesSearch =\n      !searchFilter ||\n      template.name.toLowerCase().includes(searchFilter.toLowerCase()) ||\n      template.description?.toLowerCase().includes(searchFilter.toLowerCase());\n\n    const matchesCategory =\n      !categoryFilter || template.category === categoryFilter;\n\n    return matchesSearch && matchesCategory;\n  }) || [];\n\n  const categories = Array.from(\n    new Set(data?.data?.map((t) => t.category) || [])\n  );\n\n  return (\n    <div className=\"space-y-6\">\n      {/* Header */}\n      <div className=\"flex items-center justify-between\">\n        <div>\n          <h1 className=\"text-3xl font-bold\">Template Management</h1>\n          <p className=\"text-gray-600 mt-1\">\n            Create and manage document templates\n          </p>\n        </div>\n        <Link\n          href=\"/admin/templates/new\"\n          className=\"px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors\"\n        >\n          Create Template\n        </Link>\n      </div>\n\n      {/* Filters */}\n      <div className=\"bg-white rounded-lg shadow p-4\">\n        <div className=\"flex flex-wrap gap-4 items-end\">\n          <div className=\"flex-1 min-w-[200px]\">\n            <label className=\"block text-sm font-medium text-gray-700 mb-1\">\n              Search\n            </label>\n            <input\n              type=\"text\"\n              placeholder=\"Search templates...\"\n              value={searchFilter}\n              onChange={(e) => setSearchFilter(e.target.value)}\n              className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"\n            />\n          </div>\n          <div className=\"min-w-[200px]\">\n            <label className=\"block text-sm font-medium text-gray-700 mb-1\">\n              Category\n            </label>\n            <select\n              value={categoryFilter}\n              onChange={(e) => setCategoryFilter(e.target.value)}\n              className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"\n            >\n              <option value=\"\">All Categories</option>\n              {Object.values(TemplateCategory).map((category) => (\n                <option key={category} value={category}>\n                  {translate(`templates.categories.${category}`) || category}\n                </option>\n              ))}\n            </select>\n          </div>\n        </div>\n      </div>\n\n      {/* Templates List */}\n      {isLoading ? (\n        <div className=\"text-center py-12\">\n          <div className=\"inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600\"></div>\n          <p className=\"mt-4 text-gray-600\">Loading templates...</p>\n        </div>\n      ) : error ? (\n        <div className=\"text-center py-12\">\n          <p className=\"text-red-600\">Failed to load templates</p>\n        </div>\n      ) : filteredTemplates.length === 0 ? (\n        <div className=\"text-center py-12\">\n          <p className=\"text-gray-500\">\n            {searchFilter || categoryFilter\n              ? \"No templates match your filters\"\n              : \"No templates yet. Create your first template!\"}\n          </p>\n        </div>\n      ) : (\n        <div className=\"bg-white rounded-lg shadow overflow-hidden\">\n          <table className=\"min-w-full divide-y divide-gray-200\">\n            <thead className=\"bg-gray-50\">\n              <tr>\n                <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                  Name\n                </th>\n                <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                  Category\n                </th>\n                <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                  Variables\n                </th>\n                <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                  Usage\n                </th>\n                <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                  Status\n                </th>\n                <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n                  Actions\n                </th>\n              </tr>\n            </thead>\n            <tbody className=\"bg-white divide-y divide-gray-200\">\n              {filteredTemplates.map((template) => (\n                <tr key={template.id} className=\"hover:bg-gray-50\">\n                  <td className=\"px-6 py-4 whitespace-nowrap\">\n                    <div className=\"text-sm font-medium text-gray-900\">\n                      {template.name}\n                    </div>\n                    {template.description && (\n                      <div className=\"text-sm text-gray-500 truncate max-w-xs\">\n                        {template.description}\n                      </div>\n                    )}\n                  </td>\n                  <td className=\"px-6 py-4 whitespace-nowrap\">\n                    <span\n                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${\n                        categoryColors[template.category] || categoryColors.OTHER\n                      }`}\n                    >\n                      {translate(`templates.categories.${template.category}`) ||\n                        template.category}\n                    </span>\n                  </td>\n                  <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">\n                    {template.variables.length}\n                  </td>\n                  <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">\n                    {template.usageCount}\n                  </td>\n                  <td className=\"px-6 py-4 whitespace-nowrap\">\n                    <span\n                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${\n                        template.isActive\n                          ? \"bg-green-100 text-green-800\"\n                          : \"bg-gray-100 text-gray-800\"\n                      }`}\n                    >\n                      {template.isActive ? \"Active\" : \"Inactive\"}\n                    </span>\n                  </td>\n                  <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2\">\n                    <Link\n                      href={`/admin/templates/${template.id}`}\n                      className=\"text-blue-600 hover:text-blue-900\"\n                    >\n                      Edit\n                    </Link>\n                    <Link\n                      href={`/admin/templates/${template.id}/preview`}\n                      className=\"text-green-600 hover:text-green-900\"\n                    >\n                      Preview\n                    </Link>\n                  </td>\n                </tr>\n              ))}\n            </tbody>\n          </table>\n        </div>\n      )}\n    </div>\n  );\n}\n"
}
Now let me create the new template page (create form):

🔧 Tool: Bash
Input: {
  "command": "mkdir -p apps/web/src/app/\\(authenticated\\)/admin/templates/new",
  "description": "Create new template directory"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/admin/templates/new/page.tsx",
  "content": "\"use client\";\n\nimport { useState } from \"react\";\nimport { useNavigation, useTranslate } from \"@refinedev/core\";\nimport { useMutation } from \"@refinedev/core\";\nimport { TemplateEditor, DocumentTemplateFormData } from \"@/components/template-editor\";\nimport { Button } from \"@legal/ui/components/Button\";\n\nexport default function NewTemplatePage() {\n  const translate = useTranslate();\n  const { push } = useNavigation();\n  const [error, setError] = useState<string | null>(null);\n\n  const { mutate: createTemplate, isLoading } = useMutation();\n\n  const handleSave = async (data: DocumentTemplateFormData) => {\n    setError(null);\n    try {\n      await createTemplate(\n        {\n          resource: \"documentTemplates\",\n          values: data,\n          meta: {\n            operation: \"createOneDocumentTemplate\",\n          },\n        },\n        {\n          onSuccess: () => {\n            push(\"/admin/templates\");\n          },\n          onError: (err: any) => {\n            setError(err.message || \"Failed to create template\");\n          },\n        }\n      );\n    } catch (err: any) {\n      setError(err.message || \"Failed to create template\");\n    }\n  };\n\n  return (\n    <div className=\"space-y-6\">\n      <div className=\"flex items-center justify-between\">\n        <div>\n          <h1 className=\"text-3xl font-bold\">Create New Template</h1>\n          <p className=\"text-gray-600 mt-1\">\n            Design a new document template with variables and conditional sections\n          </p>\n        </div>\n        <Button\n          type=\"button\"\n          onClick={() => push(\"/admin/templates\")}\n          className=\"px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50\"\n        >\n          Back to Templates\n        </Button>\n      </div>\n\n      {error && (\n        <div className=\"bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md\">\n          <strong className=\"font-medium\">Error:</strong> {error}\n        </div>\n      )}\n\n      <TemplateEditor onSave={handleSave} isLoading={isLoading} onCancel={() => push(\"/admin/templates\")} />\n    </div>\n  );\n}\n"
}
Now let me create the edit template page:

🔧 Tool: Bash
Input: {
  "command": "mkdir -p apps/web/src/app/\\(authenticated\\)/admin/templates/\\[id\\]",
  "description": "Create template edit directory"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/admin/templates/[id]/page.tsx",
  "content": "\"use client\";\n\nimport { useState, useEffect } from \"react\";\nimport { useNavigation, useTranslate, useOne } from \"@refinedev/core\";\nimport { useMutation } from \"@refinedev/core\";\nimport { TemplateEditor, DocumentTemplateFormData, TemplateCategory } from \"@/components/template-editor\";\nimport { Button } from \"@legal/ui/components/Button\";\n\ninterface TemplateVariable {\n  name: string;\n  label: string;\n  type: \"text\" | \"number\" | \"date\" | \"currency\" | \"boolean\";\n  required: boolean;\n  defaultValue?: string | number | boolean;\n  description?: string;\n  validation?: {\n    min?: number;\n    max?: number;\n    pattern?: string;\n    minLength?: number;\n    maxLength?: number;\n  };\n}\n\ninterface ConditionalSection {\n  id: string;\n  condition: string;\n  description?: string;\n}\n\ninterface PolishFormattingRules {\n  dateFormat?: \"DD.MM.YYYY\" | \"D MMMM YYYY\";\n  currencyFormat?: \"PLN\" | \"EUR\" | \"USD\";\n  addressFormat?: \"polish\" | \"standard\";\n  numberFormat?: \"pl\" | \"en\";\n  legalCitations?: boolean;\n}\n\ninterface DocumentTemplate {\n  id: string;\n  name: string;\n  category: TemplateCategory;\n  description?: string;\n  content: string;\n  variables: TemplateVariable[];\n  conditionalSections?: ConditionalSection[];\n  polishFormattingRules?: PolishFormattingRules;\n  isActive: boolean;\n  usageCount: number;\n  createdAt: string;\n  updatedAt: string;\n}\n\nexport default function EditTemplatePage({ params }: { params: { id: string } }) {\n  const translate = useTranslate();\n  const { push } = useNavigation();\n  const [error, setError] = useState<string | null>(null);\n\n  const { data: templateData, isLoading: isLoadingTemplate, error: templateError } = useOne<DocumentTemplate>({\n    resource: \"documentTemplates\",\n    id: params.id,\n  });\n\n  const { mutate: updateTemplate, isLoading: isUpdating } = useMutation();\n\n  const handleSave = async (data: DocumentTemplateFormData) => {\n    setError(null);\n    try {\n      await updateTemplate(\n        {\n          resource: \"documentTemplates\",\n          id: params.id,\n          values: data,\n          meta: {\n            operation: \"updateOneDocumentTemplate\",\n          },\n        },\n        {\n          onSuccess: () => {\n            push(\"/admin/templates\");\n          },\n          onError: (err: any) => {\n            setError(err.message || \"Failed to update template\");\n          },\n        }\n      );\n    } catch (err: any) {\n      setError(err.message || \"Failed to update template\");\n    }\n  };\n\n  if (isLoadingTemplate) {\n    return (\n      <div className=\"flex items-center justify-center min-h-[400px]\">\n        <div className=\"text-center\">\n          <div className=\"inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600\"></div>\n          <p className=\"mt-4 text-gray-600\">Loading template...</p>\n        </div>\n      </div>\n    );\n  }\n\n  if (templateError || !templateData?.data) {\n    return (\n      <div className=\"text-center py-12\">\n        <p className=\"text-red-600\">Failed to load template</p>\n        <Button\n          type=\"button\"\n          onClick={() => push(\"/admin/templates\")}\n          className=\"mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700\"\n        >\n          Back to Templates\n        </Button>\n      </div>\n    );\n  }\n\n  const template = templateData.data;\n\n  return (\n    <div className=\"space-y-6\">\n      <div className=\"flex items-center justify-between\">\n        <div>\n          <h1 className=\"text-3xl font-bold\">Edit Template</h1>\n          <p className=\"text-gray-600 mt-1\">\n            Editing: {template.name}\n          </p>\n        </div>\n        <Button\n          type=\"button\"\n          onClick={() => push(\"/admin/templates\")}\n          className=\"px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50\"\n        >\n          Back to Templates\n        </Button>\n      </div>\n\n      {error && (\n        <div className=\"bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md\">\n          <strong className=\"font-medium\">Error:</strong> {error}\n        </div>\n      )}\n\n      <TemplateEditor\n        initialData={template}\n        onSave={handleSave}\n        isLoading={isUpdating}\n        onCancel={() => push(\"/admin/templates\")}\n      />\n    </div>\n  );\n}\n"
}
Now let me create the preview page:

🔧 Tool: Bash
Input: {
  "command": "mkdir -p apps/web/src/app/\\(authenticated\\)/admin/templates/\\[id\\]/preview",
  "description": "Create template preview directory"
}
