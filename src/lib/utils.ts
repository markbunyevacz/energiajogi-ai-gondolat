import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility Functions
 * 
 * This module provides common utility functions used throughout the application
 * for styling, data manipulation, and common operations.
 */

/**
 * Class Name Utility (cn)
 * 
 * Combines and merges Tailwind CSS classes intelligently
 * Uses clsx for conditional classes and tailwind-merge for conflict resolution
 * 
 * @param inputs - Array of class values (strings, objects, arrays)
 * @returns Merged and optimized class string
 * 
 * @example
 * ```typescript
 * cn('text-red-500', 'hover:text-blue-500', { 'font-bold': isActive })
 * // Returns: "text-red-500 hover:text-blue-500 font-bold" (if isActive is true)
 * 
 * cn('p-4', 'p-6') // tailwind-merge resolves conflicts
 * // Returns: "p-6" (later padding overrides earlier one)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Delay/Sleep Utility
 * 
 * Creates a promise that resolves after a specified delay
 * Useful for adding delays in async operations or animations
 * 
 * @param ms - Number of milliseconds to delay
 * @returns Promise that resolves after the delay
 * 
 * @example
 * ```typescript
 * await delay(1000); // Wait 1 second
 * console.log('This runs after 1 second');
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format File Size
 * 
 * Converts bytes to human-readable file size format
 * 
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 * 
 * @example
 * ```typescript
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1048576) // "1.00 MB"
 * formatFileSize(1234567, 1) // "1.2 MB"
 * ```
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Truncate Text
 * 
 * Truncates text to a specified length and adds ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add (default: "...")
 * @returns Truncated text with suffix
 * 
 * @example
 * ```typescript
 * truncateText("This is a very long text", 10) // "This is a..."
 * truncateText("Short", 10) // "Short"
 * ```
 */
export function truncateText(text: string, maxLength: number, suffix: string = "..."): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
}

/**
 * Debounce Function
 * 
 * Creates a debounced version of a function that delays execution
 * until after the specified delay has passed since the last call
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   // API call
 * }, 300);
 * 
 * // Will only execute once after 300ms of no new calls
 * debouncedSearch('search term');
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Generate Random ID
 * 
 * Generates a random alphanumeric ID of specified length
 * 
 * @param length - Length of the ID (default: 8)
 * @returns Random ID string
 * 
 * @example
 * ```typescript
 * generateId() // "A7Bx9K2M"
 * generateId(12) // "A7Bx9K2M5Np3"
 * ```
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Deep Clone Object
 * 
 * Creates a deep copy of an object (handles nested objects and arrays)
 * Note: Does not handle functions, dates, or other complex types
 * 
 * @param obj - Object to clone
 * @returns Deep cloned object
 * 
 * @example
 * ```typescript
 * const original = { a: 1, b: { c: 2 } };
 * const cloned = deepClone(original);
 * cloned.b.c = 3; // original.b.c remains 2
 * ```
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}
