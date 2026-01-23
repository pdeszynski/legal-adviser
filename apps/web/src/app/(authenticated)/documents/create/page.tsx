'use client';

import { useForm } from '@refinedev/react-hook-form';
import { useTranslate, useGo } from '@refinedev/core';
import { useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import {
  FileText,
  Scale,
  ScrollText,
  Files,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@legal/ui';

enum DocumentType {
  LAWSUIT = 'LAWSUIT',
  COMPLAINT = 'COMPLAINT',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

interface DocumentMetadataInput {
  plaintiffName?: string;
  defendantName?: string;
  claimAmount?: number;
  claimCurrency?: string;
}

interface GenerateDocumentInput {
  sessionId: string;
  title: string;
  type: DocumentType;
  metadata?: DocumentMetadataInput;
}

const STEPS = [
  { id: 1, title: 'Type', description: 'Select document type' },
  { id: 2, title: 'Details', description: 'Basic information' },
  { id: 3, title: 'Parties', description: 'Involved parties' },
  { id: 4, title: 'Review', description: 'Confirm & Generate' },
];

export default function DocumentCreateWizard() {
  const translate = useTranslate();
  const go = useGo();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);

  const {
    refineCore: { onFinish, formLoading },
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GenerateDocumentInput>({
    refineCoreProps: {
      resource: 'documents',
      action: 'create',
      redirect: 'show',
    },
    defaultValues: {
      sessionId: '00000000-0000-0000-0000-000000000000',
      type: DocumentType.LAWSUIT,
      metadata: { claimCurrency: 'PLN' },
    },
  });

  const formData = watch();

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = (data: FieldValues) => {
    onFinish(data as GenerateDocumentInput);
  };

  const setType = (type: DocumentType) => {
    setSelectedType(type);
    setValue('type', type);
    handleNext();
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">{translate('documents.titles.create')}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {translate('documents.form.description')}
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="mb-12">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />

          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-semibold',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-md'
                      : isCompleted
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-background text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <div className="hidden sm:block text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-card border border-border rounded-xl shadow-lg p-6 md:p-8 min-h-[400px] flex flex-col relative overflow-hidden">
        <form id="wizard-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          {/* Step 1: Type Selection */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div
                onClick={() => setType(DocumentType.LAWSUIT)}
                className="cursor-pointer group relative p-6 border-2 border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
              >
                <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Scale className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Lawsuit</h3>
                <p className="text-sm text-muted-foreground">
                  Formal legal action against a party to recover debt or damages.
                </p>
                {watch('type') === DocumentType.LAWSUIT && (
                  <div className="absolute top-4 right-4 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div
                onClick={() => setType(DocumentType.CONTRACT)}
                className="cursor-pointer group relative p-6 border-2 border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
              >
                <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ScrollText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Contract</h3>
                <p className="text-sm text-muted-foreground">
                  Legally binding agreement between two or more parties.
                </p>
                {watch('type') === DocumentType.CONTRACT && (
                  <div className="absolute top-4 right-4 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div
                onClick={() => setType(DocumentType.COMPLAINT)}
                className="cursor-pointer group relative p-6 border-2 border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
              >
                <div className="h-12 w-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Complaint</h3>
                <p className="text-sm text-muted-foreground">
                  Formal complaint to an authority or organization.
                </p>
                {watch('type') === DocumentType.COMPLAINT && (
                  <div className="absolute top-4 right-4 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div
                onClick={() => setType(DocumentType.OTHER)}
                className="cursor-pointer group relative p-6 border-2 border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
              >
                <div className="h-12 w-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Files className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Other</h3>
                <p className="text-sm text-muted-foreground">
                  Generic document type for other needs.
                </p>
                {watch('type') === DocumentType.OTHER && (
                  <div className="absolute top-4 right-4 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Basic Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-lg mx-auto w-full">
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register('title', { required: true })}
                    type="text"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                    placeholder="e.g. Agreement for Sale of Car"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                </div>
                {errors.title && <span className="text-sm text-red-500">Title is required</span>}
                <p className="text-xs text-muted-foreground">
                  Give your document a clear, descriptive name.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Parties & Metadata */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Plaintiff / First Party</label>
                  <input
                    {...register('metadata.plaintiffName')}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Full Name or Company"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Defendant / Second Party</label>
                  <input
                    {...register('metadata.defendantName')}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Full Name or Company"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Claim Amount (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('metadata.claimAmount', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Currency</label>
                  <select
                    {...register('metadata.claimCurrency')}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="PLN">PLN (Polish Złoty)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-lg mx-auto w-full text-center space-y-8">
              <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                <Sparkles className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Ready to Generate?</h2>
                <p className="text-muted-foreground">
                  Our AI will analyze your inputs and draft a professional{' '}
                  {formData.type?.toLowerCase().replace('_', ' ')} for you.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-xl text-left space-y-3 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{formData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-medium">{formData.title}</span>
                </div>
                {formData.metadata?.plaintiffName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plaintiff:</span>
                    <span className="font-medium">{formData.metadata.plaintiffName}</span>
                  </div>
                )}
                {formData.metadata?.defendantName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Defendant:</span>
                    <span className="font-medium">{formData.metadata.defendantName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center border-t border-border pt-6">
            <button
              type="button"
              onClick={
                currentStep === 1
                  ? () => go({ to: { resource: 'documents', action: 'list' } })
                  : handleBack
              }
              className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {currentStep === 1 ? (
                'Cancel'
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" /> Back
                </>
              )}
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 2 && !formData.title}
                className={cn(
                  'flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm',
                  currentStep === 2 && !formData.title && 'opacity-50 cursor-not-allowed',
                )}
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={formLoading}
                className="flex items-center gap-2 px-8 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {formLoading ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate Document
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
