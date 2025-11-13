import type { NextRouterLike, RemixRevalidator } from '../types';

/**
 * FrameworkIntegration - Utilities for integrating with different frontend frameworks
 * Provides framework-specific refresh mechanisms for content saves
 */

export type FrameworkType = 'nextjs' | 'remix' | 'gatsby' | 'nuxt' | 'sveltekit' | 'vanilla';

export interface FrameworkDetection {
  type: FrameworkType;
  version?: string;
  router?: NextRouterLike | null;
  revalidator?: RemixRevalidator | null;
}

export class FrameworkIntegration {
  private detectedFramework: FrameworkDetection | null = null;

  constructor() {
    this.detectFramework();
  }

  /**
   * Get the detected framework
   */
  getFramework(): FrameworkDetection | null {
    return this.detectedFramework;
  }

  /**
   * Get a framework-native refresh function
   */
  getRefreshFunction(): (() => void | Promise<void>) | null {
    if (!this.detectedFramework) return null;

    switch (this.detectedFramework.type) {
      case 'nextjs':
        return this.getNextjsRefresh();
      case 'remix':
        return this.getRemixRefresh();
      case 'gatsby':
        return this.getGatsbyRefresh();
      case 'nuxt':
        return this.getNuxtRefresh();
      case 'sveltekit':
        return this.getSveltekitRefresh();
      default:
        return this.getVanillaRefresh();
    }
  }

  /**
   * Execute framework-appropriate refresh
   */
  async refresh(): Promise<void> {
    const refreshFn = this.getRefreshFunction();
    if (refreshFn) {
      await refreshFn();
    } else {
      // Fallback to page reload
      window.location.reload();
    }
  }

  private detectFramework(): void {
    // Next.js detection
    if (this.hasNextjs()) {
      this.detectedFramework = {
        type: 'nextjs',
        router: this.getNextjsRouter(),
      };
      return;
    }

    // Remix detection
    if (this.hasRemix()) {
      this.detectedFramework = {
        type: 'remix',
        revalidator: this.getRemixRevalidator(),
      };
      return;
    }

    // Gatsby detection
    if (this.hasGatsby()) {
      this.detectedFramework = {
        type: 'gatsby',
      };
      return;
    }

    // Nuxt detection
    if (this.hasNuxt()) {
      this.detectedFramework = {
        type: 'nuxt',
      };
      return;
    }

    // SvelteKit detection
    if (this.hasSveltekit()) {
      this.detectedFramework = {
        type: 'sveltekit',
      };
      return;
    }

    // Fallback to vanilla
    this.detectedFramework = {
      type: 'vanilla',
    };
  }

  private hasNextjs(): boolean {
    return (
      typeof window !== 'undefined' &&
      (Boolean(window.__NEXT_DATA__) ||
       Boolean(window.next) ||
       document.querySelector('script[src*="/_next/"]') !== null)
    );
  }

  private hasRemix(): boolean {
    return (
      typeof window !== 'undefined' &&
      (Boolean(window.__remixContext) ||
       Boolean(window.__remixRouterContext) ||
       document.querySelector('script[src*="/build/"]') !== null)
    );
  }

  private hasGatsby(): boolean {
    return (
      typeof window !== 'undefined' &&
      (Boolean(window.___gatsby) ||
       Boolean(window.__GATSBY) ||
       document.querySelector('[data-gatsby-browser-entry]') !== null)
    );
  }

  private hasNuxt(): boolean {
    return (
      typeof window !== 'undefined' &&
      (Boolean(window.__NUXT__) ||
       Boolean(window.$nuxt) ||
       document.querySelector('#__nuxt') !== null)
    );
  }

  private hasSveltekit(): boolean {
    return (
      typeof window !== 'undefined' &&
      (Boolean(window.__SVELTEKIT__) ||
       document.querySelector('[data-sveltekit-preload-data]') !== null)
    );
  }

  private getNextjsRouter(): NextRouterLike | null {
    if (typeof window === 'undefined') return null;

    // Try to get Next.js router from various sources
    return window.next?.router ?? window.__NEXT_DATA__?.router ?? null;
  }

  private getRemixRevalidator(): RemixRevalidator | null {
    if (typeof window === 'undefined') return null;

    // Try to get Remix revalidator
    return window.__remixRevalidator ?? window.__remixRouterContext?.revalidator ?? null;
  }

  private getNextjsRefresh(): (() => void) | null {
    const router = this.getNextjsRouter();
    if (router && typeof router.replace === 'function') {
      const replace = router.replace.bind(router);
      return () => {
        // Use router.replace to refresh the current page
        replace(router.asPath || window.location.pathname);
      };
    }

    // Fallback: try to use Next.js global refresh
    if (typeof window.location.reload === 'function') {
      return () => window.location.reload();
    }

    return null;
  }

  private getRemixRefresh(): (() => void) | null {
    const revalidator = this.getRemixRevalidator();
    if (revalidator && typeof revalidator.revalidate === 'function') {
      return () => revalidator.revalidate();
    }

    // Try to find Remix's global revalidate function
    const revalidate = window.__remixRevalidate;
    if (typeof revalidate === 'function') {
      return () => revalidate();
    }

    return null;
  }

  private getGatsbyRefresh(): (() => void) | null {
    // Gatsby typically requires full page reload for content updates
    return () => window.location.reload();
  }

  private getNuxtRefresh(): (() => void) | null {
    const nuxtApp = window.$nuxt;
    if (nuxtApp && typeof nuxtApp.refresh === 'function') {
      const refresh = nuxtApp.refresh.bind(nuxtApp);
      return () => refresh();
    }

    // Try Nuxt 3 approach
    const refreshCookie = window.refreshCookie;
    if (typeof refreshCookie === 'function') {
      return () => refreshCookie();
    }

    return () => window.location.reload();
  }

  private getSveltekitRefresh(): (() => void) | null {
    // SvelteKit: try to use invalidateAll
    const invalidateAll = window.invalidateAll;
    if (typeof invalidateAll === 'function') {
      return () => invalidateAll();
    }

    // Fallback to page reload
    return () => window.location.reload();
  }

  private getVanillaRefresh(): () => void {
    return () => window.location.reload();
  }

  /**
   * Get recommended setup instructions for the detected framework
   */
  getSetupInstructions(): string {
    if (!this.detectedFramework) return '';

    switch (this.detectedFramework.type) {
      case 'nextjs':
        return `
// Next.js setup:
import { HygraphPreview } from '@hygraph/preview-sdk/react';
import { useRouter } from 'next/router';

function App() {
  const router = useRouter();

  return (
    <HygraphPreview
      endpoint="your-endpoint"
      onSave={() => router.replace(router.asPath)}
    >
      {/* Your content */}
    </HygraphPreview>
  );
}`;

      case 'remix':
        return `
// Remix setup:
import { HygraphPreview } from '@hygraph/preview-sdk/react';
import { useRevalidator } from '@remix-run/react';

export default function App() {
  const revalidator = useRevalidator();

  return (
    <HygraphPreview
      endpoint="your-endpoint"
      onSave={() => revalidator.revalidate()}
    >
      {/* Your content */}
    </HygraphPreview>
  );
}`;

      case 'vanilla':
        return `
// Vanilla JS setup:
import { Preview } from '@hygraph/preview-sdk';

const preview = new Preview({
  endpoint: 'your-endpoint'
});

preview.subscribe('save', {
  callback: () => window.location.reload()
});`;

      default:
        return `
// ${this.detectedFramework.type} setup:
import { Preview } from '@hygraph/preview-sdk';

const preview = new Preview({
  endpoint: 'your-endpoint'
});

preview.subscribe('save', {
  callback: () => {
    // Add framework-specific refresh logic here
    window.location.reload();
  }
});`;
    }
  }
}