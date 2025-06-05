import React from 'react';

/**
 * Loading Spinner Component Props
 * 
 * Configuration options for the loading spinner appearance and behavior
 */
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';    // Predefined size options
  className?: string;                      // Additional CSS classes for customization
}

/**
 * Loading Spinner Component
 * 
 * A reusable loading spinner component with multiple size options and customizable styling.
 * Uses Tailwind CSS classes for styling and animation.
 * 
 * Features:
 * - Three predefined sizes (small, medium, large)
 * - Customizable with additional CSS classes
 * - Accessible with proper ARIA attributes
 * - Smooth spinning animation using CSS animations
 * - Responsive design that works in various contexts
 * 
 * @param size - Size variant of the spinner (default: 'medium')
 * @param className - Additional CSS classes for custom styling
 * @returns JSX element containing the animated spinner
 * 
 * @example
 * ```tsx
 * // Basic usage with default medium size
 * <LoadingSpinner />
 * 
 * // Large spinner with custom margin
 * <LoadingSpinner size="large" className="mt-8" />
 * 
 * // Small spinner for inline usage
 * <LoadingSpinner size="small" className="inline-block ml-2" />
 * ```
 */
export function LoadingSpinner({ size = 'medium', className = '' }: LoadingSpinnerProps) {
  /**
   * Size Configuration
   * 
   * Maps size props to corresponding Tailwind CSS classes
   * Each size provides width and height dimensions
   */
  const sizeClasses = {
    small: 'w-4 h-4',      // 16px x 16px - for inline usage, buttons
    medium: 'w-8 h-8',     // 32px x 32px - default size for most cases
    large: 'w-12 h-12'     // 48px x 48px - for full-page loading states
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          border-4 
          border-gray-200 
          border-t-indigo-600 
          rounded-full 
          animate-spin
        `}
        role="status"
        aria-label="Loading"
      />
      {/* Screen reader text for accessibility */}
      <span className="sr-only">Loading...</span>
    </div>
  );
} 