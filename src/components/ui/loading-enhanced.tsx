import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'pulse' | 'bounce' | 'wave' | 'dots';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  if (variant === 'pulse') {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className={cn('bg-primary/20 rounded-full', sizeClasses[size])} />
      </div>
    );
  }

  if (variant === 'bounce') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-primary rounded-full animate-bounce',
              size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={cn('flex items-end space-x-1', className)}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-primary animate-pulse',
              size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : 'w-2',
              'h-8'
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              height: `${20 + (i % 3) * 10}px`
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-primary rounded-full opacity-40',
              size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4',
              'animate-[pulse_1.4s_ease-in-out_infinite]'
            )}
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-muted border-t-primary',
        sizeClasses[size],
        className
      )}
    />
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  animation = 'pulse'
}) => {
  return (
    <div
      className={cn(
        'bg-muted',
        {
          'rounded-md': variant === 'rectangular',
          'rounded-full': variant === 'circular',
          'rounded': variant === 'text',
          'animate-pulse': animation === 'pulse',
          'animate-[wave_1.6s_ease-in-out_0.5s_infinite]': animation === 'wave'
        },
        className
      )}
    />
  );
};

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max = 100,
  variant = 'linear',
  size = 'md',
  showValue = false,
  className
}) => {
  const percentage = (value / max) * 100;

  if (variant === 'circular') {
    const radius = size === 'sm' ? 20 : size === 'md' ? 30 : 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg
          className={cn(
            'transform -rotate-90',
            size === 'sm' ? 'w-12 h-12' : size === 'md' ? 'w-16 h-16' : 'w-20 h-20'
          )}
          viewBox={`0 0 ${(radius + 10) * 2} ${(radius + 10) * 2}`}
        >
          <circle
            cx={radius + 10}
            cy={radius + 10}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-muted"
          />
          <circle
            cx={radius + 10}
            cy={radius + 10}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-primary transition-all duration-300 ease-in-out"
          />
        </svg>
        {showValue && (
          <span className="absolute text-sm font-medium">{Math.round(percentage)}%</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'bg-muted rounded-full overflow-hidden',
          size === 'sm' ? 'h-2' : size === 'md' ? 'h-3' : 'h-4'
        )}
      >
        <div
          className="bg-primary h-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="mt-1 text-sm text-muted-foreground text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  spinnerVariant?: 'default' | 'pulse' | 'bounce' | 'wave' | 'dots';
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  loadingText = 'Loading...',
  spinnerVariant = 'default',
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner variant={spinnerVariant} size="lg" />
            <p className="text-sm text-muted-foreground">{loadingText}</p>
          </div>
        </div>
      )}
    </div>
  );
};