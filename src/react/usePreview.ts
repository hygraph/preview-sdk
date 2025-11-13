/**
 * React hooks for the Hygraph Preview SDK
 * Provides convenient hooks for common Preview operations
 */

import { useEffect, useCallback, useRef } from 'react';
import type { PreviewEvents } from '../types';
import type { Preview } from '../core/Preview';
import type { FrameworkDetection } from '../core/FrameworkIntegration';
import { usePreview, usePreviewSave, usePreviewEvent } from './HygraphPreview';

type FieldUpdateEventDetail = PreviewEvents['preview:field-updated']['detail'];
type UpdateFailedEventDetail = PreviewEvents['preview:update-failed']['detail'];

/**
 * Hook for framework-specific refresh integration
 * Automatically detects the framework and provides appropriate refresh
 */
export function usePreviewRefresh(): {
  refresh: () => void | Promise<void>;
  framework: string | null;
} {
  const { preview } = usePreview();
  const frameworkRef = useRef<string | null>(null);

  // Detect framework on mount
  useEffect(() => {
    if (!preview) return;

    const integration = preview.getFrameworkIntegration();
    const framework = integration?.getFramework();
    frameworkRef.current = framework?.type ?? null;
  }, [preview]);

  const refresh = useCallback(async () => {
    if (!preview) return;

    const integration = preview.getFrameworkIntegration();
    if (integration) {
      await integration.refresh();
    } else {
      window.location.reload();
    }
  }, [preview]);

  return {
    refresh,
    framework: frameworkRef.current,
  };
}


/**
 * Hook for Remix integration
 * Provides automatic refresh using Remix revalidator
 */
export function usePreviewRemix(): void {
  const { refresh } = usePreviewRefresh();

  const getRemixRevalidator = useCallback(() => {
    if (typeof window === 'undefined') return null;

    return (
      window.__remixRevalidator ||
      window.__remixRouterContext?.revalidator ||
      null
    );
  }, []);

  const remixRefresh = useCallback(() => {
    const revalidator = getRemixRevalidator();
    if (revalidator && typeof revalidator.revalidate === 'function') {
      revalidator.revalidate();
    } else {
      refresh();
    }
  }, [refresh, getRemixRevalidator]);

  usePreviewSave(remixRefresh);
}

/**
 * Hook for field update events
 * Provides callbacks for when fields are updated
 */
export function usePreviewFieldUpdates(
  onUpdate?: (update: FieldUpdateEventDetail) => void,
  onError?: (error: UpdateFailedEventDetail) => void
): void {
  usePreviewEvent('preview:field-updated', (event) => {
    onUpdate?.(event.detail);
  });

  usePreviewEvent('preview:update-failed', (event) => {
    onError?.(event.detail);
  });
}

/**
 * Hook for Preview connection status
 * Provides current connection state and callbacks
 */
export function usePreviewConnection(): {
  isConnected: boolean;
  isReady: boolean;
  mode: 'iframe' | 'standalone' | null;
} {
  const { preview, isReady, isConnected } = usePreview();

  const mode = preview?.getMode() || null;

  return {
    isConnected,
    isReady,
    mode,
  };
}

/**
 * Hook for manual Preview operations
 * Provides methods to manually control the Preview
 */
export function usePreviewActions(): {
  refresh: () => void;
  destroy: () => void;
  getVersion: () => string | null;
  getMode: () => 'iframe' | 'standalone' | null;
} {
  const { preview } = usePreview();

  const refresh = useCallback(() => {
    preview?.refresh();
  }, [preview]);

  const destroy = useCallback(() => {
    preview?.destroy();
  }, [preview]);

  const getVersion = useCallback(() => {
    return preview?.getVersion() || null;
  }, [preview]);

  const getMode = useCallback(() => {
    return preview?.getMode() || null;
  }, [preview]);

  return {
    refresh,
    destroy,
    getVersion,
    getMode,
  };
}

/**
 * Hook for debugging and development
 * Provides debugging information and utilities
 */
export function usePreviewDebug(): {
  preview: Preview | null;
  stats: ReturnType<Preview['getFieldRegistryStats']> | null;
  registryKeys: string[];
  framework: FrameworkDetection | null;
} {
  const { preview } = usePreview();

  const getStats = useCallback(() => {
    if (!preview) return null;
    return preview.getFieldRegistryStats();
  }, [preview]);

  const getRegistryKeys = useCallback(() => {
    if (!preview) return [];
    return preview.getFieldRegistryKeys();
  }, [preview]);

  const getFramework = useCallback(() => {
    if (!preview) return null;
    return preview.getFrameworkIntegration().getFramework();
  }, [preview]);

  return {
    preview,
    stats: getStats(),
    registryKeys: getRegistryKeys(),
    framework: getFramework(),
  };
}