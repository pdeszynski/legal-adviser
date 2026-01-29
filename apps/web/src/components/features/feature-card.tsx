'use client';

import * as React from 'react';
import { cn } from '@legal/ui';
import { Badge, type BadgeProps } from '@legal/ui';
import { Button } from '@legal/ui';
import { ArrowRight, LucideIcon } from 'lucide-react';

export type FeatureStatus = 'beta' | 'new' | 'coming-soon' | 'stable';
export type CTAAction = 'link' | 'demo' | 'documentation' | 'disabled';

export interface FeatureCardProps {
  /** Unique identifier for the feature */
  id: string;
  /** Icon or illustration component */
  icon?: LucideIcon | React.ReactNode;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Optional status badge */
  status?: FeatureStatus;
  /** Custom status badge text (overrides default) */
  statusText?: string;
  /** CTA button label */
  ctaLabel?: string;
  /** CTA button action type */
  ctaAction?: CTAAction;
  /** CTA button href (for link action) */
  ctaHref?: string;
  /** CTA button click handler (for demo action) */
  onCtaClick?: () => void;
  /** Color theme for the card */
  color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';
  /** Additional className */
  className?: string;
  /** Delay for entrance animation (in ms) */
  animationDelay?: number;
}

const colorConfig = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-cyan-500',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/50',
    badgeVariant: 'info' as BadgeProps['variant'],
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-pink-500',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-950/50',
    badgeVariant: 'default' as BadgeProps['variant'],
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500 to-teal-500',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/50',
    badgeVariant: 'success' as BadgeProps['variant'],
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500 to-orange-500',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-950/50',
    badgeVariant: 'warning' as BadgeProps['variant'],
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    gradient: 'from-rose-500 to-red-500',
    hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-950/50',
    badgeVariant: 'destructive' as BadgeProps['variant'],
  },
};

const statusConfig: Record<FeatureStatus, { text: string; variant: BadgeProps['variant'] }> = {
  beta: { text: 'Beta', variant: 'secondary' },
  new: { text: 'New', variant: 'default' },
  'coming-soon': { text: 'Coming Soon', variant: 'outline' },
  stable: { text: 'Stable', variant: 'success' },
};

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      id,
      icon: Icon,
      title,
      description,
      status,
      statusText,
      ctaLabel = 'Learn More',
      ctaAction = 'link',
      ctaHref,
      onCtaClick,
      color = 'blue',
      className,
      animationDelay = 0,
    },
    ref,
  ) => {
    const colors = colorConfig[color];
    const [isHovered, setIsHovered] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), animationDelay);
      return () => clearTimeout(timer);
    }, [animationDelay]);

    const statusInfo = status ? statusConfig[status] : null;
    const displayStatusText = statusText || statusInfo?.text;

    const handleCtaClick = () => {
      if (ctaAction === 'demo' && onCtaClick) {
        onCtaClick();
      }
    };

    const cardContent = (
      <div
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 dark:bg-black/20 backdrop-blur-xl p-8',
          'transition-all duration-300',
          'hover:shadow-2xl hover:-translate-y-2',
          colors.hoverBg,
          !isVisible && 'opacity-0 translate-y-4',
          isVisible && 'opacity-100 translate-y-0 transition-all duration-500',
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient overlay on hover */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
            colors.gradient,
          )}
          style={{
            background: `linear-gradient(to bottom right, ${colors.gradient})`,
            opacity: isHovered ? 0.05 : 0,
          }}
        />

        <div className="relative">
          {/* Icon/Illustration slot */}
          {Icon && (
            <div
              className={cn(
                'mb-6 h-12 w-12 rounded-xl flex items-center justify-center',
                colors.bg,
                colors.text,
                'group-hover:scale-110 transition-transform duration-300',
              )}
            >
              {React.isValidElement(Icon) ? Icon : typeof Icon === 'function' ? <Icon className="h-6 w-6" strokeWidth={1.5} /> : null}
            </div>
          )}

          {/* Status Badge */}
          {displayStatusText && statusInfo && (
            <div className="mb-3">
              <Badge variant={statusInfo.variant} className="text-xs">
                {displayStatusText}
              </Badge>
            </div>
          )}

          {/* Title */}
          <h3 className={cn('mb-3 text-2xl font-bold', colors.text)}>{title}</h3>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed mb-6">{description}</p>

          {/* CTA Button */}
          {ctaAction !== 'disabled' && (
            <Button
              variant="outline"
              className={cn(
                'w-full group-hover:border-transparent transition-all duration-300',
                colors.border,
                colors.text,
                ctaAction === 'demo' && 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
              onClick={handleCtaClick}
              {...(ctaAction === 'link' && ctaHref ? { asChild: true } : {})}
            >
              {ctaAction === 'link' && ctaHref ? (
                <a href={ctaHref} className="flex items-center w-full justify-center">
                  {ctaLabel}
                  <ArrowRight
                    className={cn(
                      'ml-2 h-4 w-4 transition-transform duration-300',
                      isHovered && 'translate-x-1',
                    )}
                  />
                </a>
              ) : (
                <>
                  {ctaLabel}
                  <ArrowRight
                    className={cn(
                      'ml-2 h-4 w-4 transition-transform duration-300',
                      isHovered && 'translate-x-1',
                    )}
                  />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );

    return cardContent;
  },
);

FeatureCard.displayName = 'FeatureCard';
