import { Skeleton } from '@/*/components/ui/skeleton';

export interface FormSkeletonProps {
  /**
   * Number of input fields to display
   */
  fieldCount?: number;
  /**
   * Whether to show header section
   */
  showHeader?: boolean;
  /**
   * Whether to show action buttons
   */
  showActions?: boolean;
  /**
   * Layout variant
   */
  variant?: 'default' | 'settings' | 'compact';
}

/**
 * Generic form skeleton with typical form field patterns.
 * Automatically generates matching skeleton elements based on field count.
 */
export function FormSkeleton({
  fieldCount = 5,
  showHeader = true,
  showActions = true,
  variant = 'default',
}: FormSkeletonProps) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        {Array.from({ length: Math.min(fieldCount, 3) }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}

        {/* Two column layout for remaining fields if needed */}
        {fieldCount > 3 && (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: Math.min(fieldCount - 3, 4) }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Textarea field */}
        {fieldCount > 7 && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
      </div>

      {/* Checkbox section */}
      {variant === 'default' && fieldCount > 5 && (
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      )}
    </div>
  );
}

/**
 * Settings form skeleton with checkbox groups.
 * Matches the settings page form structure.
 */
export function SettingsFormSkeleton({
  sectionCount = 2,
  showActions = true,
}: {
  sectionCount?: number;
  showActions?: boolean;
}) {
  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Form sections with checkboxes */}
      {Array.from({ length: sectionCount }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>

          <div className="space-y-1 bg-card border border-border rounded-xl p-4">
            {Array.from({ length: 3 + (sectionIndex % 2) }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-64" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      {showActions && (
        <div className="flex justify-end pt-4 border-t">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      )}
    </div>
  );
}

/**
 * Compact form skeleton for inline forms.
 */
export function CompactFormSkeleton({ fieldCount = 3 }: { fieldCount?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Wizard/stepper form skeleton.
 * Matches multi-step form structure.
 */
export function WizardFormSkeleton({ stepCount = 3 }: { stepCount?: number }) {
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        {Array.from({ length: stepCount }).map((_, i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            {i < stepCount - 1 && <Skeleton className="h-0.5 w-16" />}
          </div>
        ))}
      </div>

      {/* Form content */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
