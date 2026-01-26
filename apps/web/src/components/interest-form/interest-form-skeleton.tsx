'use client';

import { Skeleton } from '@legal/ui';

/**
 * Interest Form Skeleton Component
 *
 * Provides a loading placeholder that matches the exact layout
 * of the InterestForm component to prevent layout shift.
 *
 * Layout matches:
 * - Header section with title and subtitle
 * - Form fields: name, email, company, role, use case (textarea), lead source (select)
 * - Checkbox for GDPR consent
 * - Submit button
 */
export function InterestFormSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-card border rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl ${className}`}>
      {/* Header Section */}
      <div className="text-center mb-6 sm:mb-8 space-y-3">
        <Skeleton width="60%" height="2rem" className="mx-auto" />
        <Skeleton width="80%" height="1.25rem" className="mx-auto" />
      </div>

      {/* Form Fields */}
      <form className="space-y-5">
        {/* Name Field */}
        <div className="space-y-2">
          <Skeleton width="30%" height="1rem" />
          <Skeleton width="100%" height="2.75rem" variant="default" className="rounded-xl" />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Skeleton width="25%" height="1rem" />
          <Skeleton width="100%" height="2.75rem" variant="default" className="rounded-xl" />
        </div>

        {/* Company Field */}
        <div className="space-y-2">
          <Skeleton width="25%" height="1rem" />
          <Skeleton width="100%" height="2.75rem" variant="default" className="rounded-xl" />
        </div>

        {/* Role Field */}
        <div className="space-y-2">
          <Skeleton width="25%" height="1rem" />
          <Skeleton width="100%" height="2.75rem" variant="default" className="rounded-xl" />
        </div>

        {/* Use Case Textarea */}
        <div className="space-y-2">
          <Skeleton width="40%" height="1rem" />
          <Skeleton width="100%" height="7.5rem" variant="default" className="rounded-xl" />
        </div>

        {/* Lead Source Select */}
        <div className="space-y-2">
          <Skeleton width="45%" height="1rem" />
          <Skeleton width="100%" height="2.75rem" variant="default" className="rounded-xl" />
        </div>

        {/* GDPR Consent Checkbox */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Skeleton width="1.25rem" height="1.25rem" variant="circular" className="mt-1 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton width="95%" height="1rem" />
              <Skeleton width="70%" height="1rem" />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Skeleton width="100%" height="3rem" variant="default" className="rounded-full" />
        </div>

        {/* Privacy Notice */}
        <div className="pt-2">
          <Skeleton width="70%" height="0.875rem" className="mx-auto" />
        </div>
      </form>
    </div>
  );
}
