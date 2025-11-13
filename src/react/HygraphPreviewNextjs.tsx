/**
 * Next.js App Router integration component for Hygraph Preview SDK
 * Provides a clean API for Next.js applications
 *
 * This component expects you to pass a refresh function from your Next.js app.
 * This approach provides the most reliable integration without framework coupling.
 */

import React from 'react';
import { HygraphPreview, type HygraphPreviewProps } from './HygraphPreview';

export interface HygraphPreviewNextjsProps extends Omit<HygraphPreviewProps, 'onSave'> {
  /**
   * Refresh function from Next.js useRouter hook
   * Example: const router = useRouter(); then pass refresh={router.refresh}
   */
  refresh?: () => void;

  /**
   * Optional custom save callback that runs before the refresh
   */
  onSave?: (entryId: string) => void;

  /**
   * Optional custom field focus handler
   * Override the default behavior when Studio requests field focus
   * @param fieldApiId - The field API ID to focus
   * @param locale - The locale of the field (if applicable)
   */
  onFieldFocus?: (fieldApiId: string, locale?: string) => void;

  /**
   * Optional custom field update handler
   * Called when Studio sends field update messages during real-time editing
   * @param update - The field update information
   */
  onFieldUpdate?: (update: import('../types').FieldUpdate) => void;
}

/**
 * HygraphPreview component optimized for Next.js App Router
 * Pass the router.refresh function to enable zero-flicker updates
 *
 * Usage:
 * ```tsx
 * 'use client';
 *
 * import { HygraphPreviewNextjs } from '@hygraph/preview-sdk/react';
 * import { useRouter } from 'next/navigation';
 *
 * export function PreviewProvider({ children }) {
 *   const router = useRouter();
 *
 *   return (
 *     <HygraphPreviewNextjs
 *       endpoint={process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT!}
 *       studioUrl={process.env.NEXT_PUBLIC_HYGRAPH_STUDIO_URL}
 *       debug={process.env.NODE_ENV === 'development'}
 *       refresh={router.refresh}
 *     >
 *       {children}
 *     </HygraphPreviewNextjs>
 *   );
 * }
 * ```
 */
export function HygraphPreviewNextjs({
  children,
  refresh,
  onSave,
  onFieldFocus,
  onFieldUpdate,
  ...props
}: HygraphPreviewNextjsProps) {
  // Combine user's onSave callback with refresh function
  const handleSave = React.useCallback((entryId: string) => {
    // Call user's custom onSave callback first if provided
    onSave?.(entryId);

    // Then refresh using the provided refresh function
    if (refresh) {
      console.log('[Preview] Refreshing with provided refresh function...');
      refresh();
    } else {
      console.warn('[Preview] No refresh function provided to HygraphPreviewNextjs. Content updates may not be visible until manual page refresh.');
    }
  }, [onSave, refresh]);

  return (
    <HygraphPreview
      {...props}
      onSave={handleSave}
      onFieldFocus={onFieldFocus}
      onFieldUpdate={onFieldUpdate}
    >
      {children}
    </HygraphPreview>
  );
}