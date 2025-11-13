/**
 * React component wrapper for the Hygraph Preview SDK
 * Provides React-friendly interface with hooks and context
 */

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { Preview } from '../core/Preview';
import type { PreviewConfig, SaveCallback } from '../types';

interface HygraphPreviewContextType {
  preview: Preview | null;
  isReady: boolean;
  isConnected: boolean;
}

const HygraphPreviewContext = createContext<HygraphPreviewContextType>({
  preview: null,
  isReady: false,
  isConnected: false,
});

export interface HygraphPreviewProps extends PreviewConfig {
  children: ReactNode;
  onReady?: (preview: Preview) => void;
  onConnected?: (studioOrigin: string) => void;
  onDisconnected?: () => void;
  onSave?: SaveCallback;
  onError?: (error: Error) => void;
  onFieldFocus?: (fieldApiId: string, locale?: string) => void;
  onFieldUpdate?: (update: import('../types').FieldUpdate) => void;
}

/**
 * HygraphPreview React component
 * Wraps your app to enable live preview functionality
 */
export function HygraphPreview({
  children,
  onReady,
  onConnected,
  onDisconnected,
  onSave,
  onError,
  onFieldFocus,
  onFieldUpdate,
  ...config
}: HygraphPreviewProps) {
  const previewRef = useRef<Preview | null>(null);
  const [contextValue, setContextValue] = React.useState<HygraphPreviewContextType>({
    preview: null,
    isReady: false,
    isConnected: false,
  });

  useEffect(() => {
    // Initialize Preview
    try {
      const preview = new Preview({
        ...config,
        onFieldFocus,
        onFieldUpdate,
      });
      previewRef.current = preview;

      // Set up event listeners
      const handleReady = (event: CustomEvent<{ preview: Preview }>) => {
        setContextValue(prev => ({
          ...prev,
          preview: event.detail.preview,
          isReady: true,
        }));
        onReady?.(event.detail.preview);
      };

      const handleConnected = (event: CustomEvent<{ studioOrigin: string }>) => {
        setContextValue(prev => ({
          ...prev,
          isConnected: true,
        }));
        onConnected?.(event.detail.studioOrigin);
      };

      const handleDisconnected = () => {
        setContextValue(prev => ({
          ...prev,
          isConnected: false,
        }));
        onDisconnected?.();
      };

      const handleError = (event: CustomEvent<{ error: Error }>) => {
        onError?.(event.detail.error);
      };

      // Add event listeners
      document.addEventListener('preview:ready', handleReady as EventListener);
      document.addEventListener('preview:connected', handleConnected as EventListener);
      document.addEventListener('preview:disconnected', handleDisconnected as EventListener);
      document.addEventListener('preview:error', handleError as EventListener);

      // Set up save subscription
      let unsubscribe: (() => void) | undefined;
      if (onSave) {
        unsubscribe = preview.subscribe('save', { callback: onSave });
      }

      return () => {
        // Cleanup
        document.removeEventListener('preview:ready', handleReady as EventListener);
        document.removeEventListener('preview:connected', handleConnected as EventListener);
        document.removeEventListener('preview:disconnected', handleDisconnected as EventListener);
        document.removeEventListener('preview:error', handleError as EventListener);

        unsubscribe?.();
        preview.destroy();
      };
    } catch (error) {
      console.error('[HygraphPreview] Failed to initialize:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return () => {}; // Return cleanup function even on error
    }
  }, [
    config.endpoint,
    config.debug,
    config.studioUrl,
    config.mode,
    config.overlayEnabled,
    JSON.stringify(config.overlay), // Track overlay config changes
    JSON.stringify(config.sync), // Track sync config changes
    onReady,
    onConnected,
    onDisconnected,
    onSave,
    onError,
    onFieldFocus,
    onFieldUpdate,
  ]);

  return (
    <HygraphPreviewContext.Provider value={contextValue}>
      {children}
    </HygraphPreviewContext.Provider>
  );
}

/**
 * Hook to access the Preview instance from React components
 */
export function usePreview(): HygraphPreviewContextType {
  const context = useContext(HygraphPreviewContext);
  if (!context) {
    throw new Error('usePreview must be used within a HygraphPreview component');
  }
  return context;
}

/**
 * Hook specifically for save event subscription
 * Automatically sets up and cleans up the subscription
 */
export function usePreviewSave(callback: SaveCallback): void {
  const { preview } = usePreview();

  useEffect(() => {
    if (!preview) return;

    const unsubscribe = preview.subscribe('save', { callback });
    return unsubscribe;
  }, [preview, callback]);
}

/**
 * Hook for accessing Preview events
 */
export function usePreviewEvent<K extends keyof import('../types').PreviewEvents>(
  eventType: K,
  handler: (event: import('../types').PreviewEvents[K]) => void
): void {
  useEffect(() => {
    const eventHandler = (event: Event) => {
      handler(event as import('../types').PreviewEvents[K]);
    };

    document.addEventListener(eventType, eventHandler);
    return () => document.removeEventListener(eventType, eventHandler);
  }, [eventType, handler]);
}