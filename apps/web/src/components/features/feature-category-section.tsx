'use client';

import * as React from 'react';
import { cn } from '@legal/ui';
import { FeatureCard, type FeatureCardProps } from './feature-card';

export interface FeatureCategory {
  id: string;
  title: string;
  description?: string;
  features: FeatureCardProps[];
  color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';
}

export interface FeatureCategorySectionProps {
  /** Category data */
  category: FeatureCategory;
  /** Optional className */
  className?: string;
  /** Number of columns for grid layout */
  columns?: 1 | 2 | 3;
  /** Show category header */
  showHeader?: boolean;
}

const gridColumns = {
  1: 'grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
};

export const FeatureCategorySection = React.forwardRef<
  HTMLDivElement,
  FeatureCategorySectionProps
>(({ category, className, columns = 3, showHeader = true }, ref) => {
  return (
    <div ref={ref} className={cn('w-full py-16', className)}>
      <div className="container mx-auto px-4 md:px-6">
        {/* Category Header */}
        {showHeader && (
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              {category.title}
            </h2>
            {category.description && (
              <p className="text-lg text-muted-foreground">
                {category.description}
              </p>
            )}
          </div>
        )}

        {/* Features Grid */}
        <div className={cn(
          'grid gap-8',
          gridColumns[columns]
        )}>
          {category.features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              {...feature}
              animationDelay={index * 100}
              color={category.color || feature.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

FeatureCategorySection.displayName = 'FeatureCategorySection';
