/**
 * Reusable Spinner Component for Supplier Portal
 * 
 * Location: supplier-portal/src/components/ui/Spinner.jsx
 */

import { clsx } from 'clsx';

const sizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
};

// Main Spinner Component
export default function Spinner({ 
  size = 'md', 
  className = '',
  color = 'blue'
}) {
  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600',
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-t-transparent',
        sizes[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Full Page Spinner
export function FullPageSpinner({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" className="mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
}

// Inline Spinner with Text
export function SpinnerWithText({ 
  message = 'Loading...', 
  size = 'md',
  className = '' 
}) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <Spinner size={size} />
      <span className="text-gray-600">{message}</span>
    </div>
  );
}

// Overlay Spinner (for modals/cards)
export function OverlaySpinner({ message = 'Loading...' }) {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-3" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// Dots Spinner (alternative style)
export function DotsSpinner({ className = '' }) {
  return (
    <div className={clsx('flex gap-1.5', className)}>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Pulse Spinner (alternative style)
export function PulseSpinner({ size = 'md', className = '' }) {
  return (
    <div className={clsx('relative', sizes[size], className)}>
      <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
      <div className="relative rounded-full bg-blue-600 w-full h-full" />
    </div>
  );
}

// Skeleton Loader (for content placeholders)
export function Skeleton({ 
  width = 'w-full',
  height = 'h-4',
  className = '',
  rounded = 'rounded',
  count = 1
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'bg-gray-200 animate-pulse',
            width,
            height,
            rounded,
            className
          )}
        />
      ))}
    </div>
  );
}

// Card Skeleton (for loading cards)
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        <Skeleton width="w-3/4" height="h-6" />
        <Skeleton count={3} />
        <div className="flex gap-3">
          <Skeleton width="w-24" height="h-8" rounded="rounded-lg" />
          <Skeleton width="w-24" height="h-8" rounded="rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="h-8" width="w-full" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="h-6" width="w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}