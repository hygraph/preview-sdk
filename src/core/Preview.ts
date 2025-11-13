/**
 * Core Preview class - Main orchestrator for the Hygraph Preview SDK
 * Handles element tracking, overlay creation, Studio communication, and content updates
 */

import { FieldRegistry } from './FieldRegistry';
import { MessageBridge } from './MessageBridge';
import { ContentUpdater } from './ContentUpdater';
import { OverlayManager } from './OverlayManager';
import { FrameworkIntegration } from './FrameworkIntegration';
import type {
  PreviewConfig,
  SaveCallback,
  SubscriptionConfig,
  SDKMessage,
  StudioMessage,
  SDKCapabilities,
  RichTextFormatType,
  ComponentChainLink,
  RegistryKey,
} from '../types';

export class Preview {
  private config: PreviewConfig;
  private fieldRegistry: FieldRegistry;
  private messageBridge: MessageBridge | null = null;
  private contentUpdater: ContentUpdater;
  private overlayManager: OverlayManager;
  private frameworkIntegration: FrameworkIntegration;
  private saveCallbacks = new Set<SaveCallback>();
  private mode: 'iframe' | 'standalone';

  constructor(config: PreviewConfig) {
    this.config = {
      debug: false,
      overlayEnabled: true,
      updateDelay: 50,
      retryAttempts: 3,
      autoConnect: true,
      allowedOrigins: ['https://app.hygraph.com', 'http://localhost:3000'],
      ...config,
    };

    this.frameworkIntegration = new FrameworkIntegration();

    // Determine operating mode
    this.mode = this.determineMode();

    // Initialize core components
    this.fieldRegistry = new FieldRegistry(this.config);
    this.contentUpdater = new ContentUpdater(this.config);
    this.overlayManager = new OverlayManager(this.config);

    // Initialize based on mode
    if (this.mode === 'iframe') {
      this.initializeIframeMode();
    } else {
      this.initializeStandaloneMode();
    }

    // Set up edit click handler
    this.setupEditClickHandler();

    // Make SDK available globally for debugging
    if (this.config.debug) {
      window.__HYGRAPH_PREVIEW__ = this;
    }

    this.emitEvent('preview:ready', { preview: this });
  }

  /**
   * Subscribe to save events - for framework refresh integration
   */
  subscribe(eventType: 'save', config: SubscriptionConfig): () => void {
    if (eventType === 'save') {
      this.saveCallbacks.add(config.callback);
      return () => this.saveCallbacks.delete(config.callback);
    }
    throw new Error(`Unknown event type: ${eventType}`);
  }

  /**
   * Get current SDK version
   */
  getVersion(): string {
    return '2.0.0';
  }

  /**
   * Get current mode
   */
  getMode(): 'iframe' | 'standalone' {
    return this.mode;
  }

  /**
   * Access the framework integration utilities
   */
  getFrameworkIntegration(): FrameworkIntegration {
    return this.frameworkIntegration;
  }

  /**
   * Get statistics from the field registry
   */
  getFieldRegistryStats(): ReturnType<FieldRegistry['getStats']> {
    return this.fieldRegistry.getStats();
  }

  /**
   * Get all registered field registry keys
   */
  getFieldRegistryKeys(): RegistryKey[] {
    return this.fieldRegistry.getRegistryKeys();
  }

  /**
   * Check if Preview is connected to Studio
   */
  isConnected(): boolean {
    return this.messageBridge?.isConnectedToStudio() ?? false;
  }

  /**
   * Refresh element registry - scan for new elements
   */
  refresh(): void {
    this.fieldRegistry.refresh();
  }

  /**
   * Configure overlay styling at runtime
   */
  configureOverlay(overlayConfig: Partial<NonNullable<PreviewConfig['overlay']>>): void {
    // Update the config
    if (!this.config.overlay) {
      this.config.overlay = {};
    }

    if (overlayConfig.style) {
      this.config.overlay.style = { ...this.config.overlay.style, ...overlayConfig.style };
    }

    if (overlayConfig.button) {
      this.config.overlay.button = { ...this.config.overlay.button, ...overlayConfig.button };
    }

    // Recreate overlay elements with new styling
    this.overlayManager.destroy();
    this.overlayManager = new OverlayManager(this.config);

    if (this.config.debug) {
      console.log('[Preview] Overlay configuration updated:', overlayConfig);
    }
  }

  /**
   * Destroy Preview and clean up resources
   */
  destroy(): void {
    this.fieldRegistry.destroy();
    this.messageBridge?.destroy();
    this.contentUpdater.destroy();
    this.overlayManager.destroy();
    this.saveCallbacks.clear();

    document.removeEventListener('hygraph-edit-click', this.handleEditClick as EventListener);

    if (window.__HYGRAPH_PREVIEW__ === this) {
      delete window.__HYGRAPH_PREVIEW__;
    }
  }

  private determineMode(): 'iframe' | 'standalone' {
    if (this.config.mode === 'iframe') return 'iframe';
    if (this.config.mode === 'standalone') return 'standalone';

    // Auto-detect mode
    try {
      return window.self === window.top ? 'standalone' : 'iframe';
    } catch (e) {
      // Cross-origin restrictions may throw an error
      return 'iframe';
    }
  }

  private initializeIframeMode(): void {
    if (this.config.debug) {
      console.log('[Preview] Initializing in iframe mode');
    }

    // Initialize MessageBridge for Studio communication
    this.messageBridge = new MessageBridge({
      debug: this.config.debug,
      allowedOrigins: this.getAllowedOrigins(),
      onMessage: this.handleStudioMessage.bind(this),
      onReady: () => {
        if (this.config.debug) {
          console.log('[Preview] MessageBridge ready, sending ready message to Studio');
        }
        // Send ready message to Studio only after MessageBridge is ready
        if (this.config.autoConnect) {
          this.sendReadyMessage();
        }
      },
    });

    // Set up edit button handlers for postMessage
    this.setupIframeEditHandlers();
  }

  private initializeStandaloneMode(): void {
    if (this.config.debug) {
      console.log('[Preview] Initializing in standalone mode');
    }

    // Validate required config for standalone mode
    if (!this.config.studioUrl && !this.isProductionEndpoint()) {
      console.warn('[Preview] Consider setting studioUrl for development endpoints');
    }

    // Set up edit button handlers for new tab opening
    this.setupStandaloneEditHandlers();
  }

  private getAllowedOrigins(): string[] {
    const origins = [...(this.config.allowedOrigins || [])];

    // Add custom studio URL if provided
    if (this.config.studioUrl) {
      origins.push(new URL(this.config.studioUrl).origin);
    }

    return origins;
  }

  private isProductionEndpoint(): boolean {
    if (!this.config.endpoint) {
      return false;
    }
    return this.config.endpoint.includes('api.hygraph.com') ||
           this.config.endpoint.includes('.hygraph.com') ||
           this.config.endpoint.includes('.hygraph.dev');
  }

  /**
   * Scan DOM for Rich Text format preferences
   * Returns a map of fieldKey -> format preference
   */
  private scanRichTextFormatPreferences(): { [fieldKey: string]: RichTextFormatType } {
    const formatPreferences: { [fieldKey: string]: RichTextFormatType } = {};
    const duplicateFields: { [fieldKey: string]: RichTextFormatType[] } = {};

    // Find all elements with Rich Text format preferences
    document.querySelectorAll('[data-hygraph-entry-id][data-hygraph-rich-text-format]')
      .forEach(element => {
        const entryId = element.getAttribute('data-hygraph-entry-id');
        const fieldApiId = element.getAttribute('data-hygraph-field-api-id');
        const format = element.getAttribute('data-hygraph-rich-text-format') as RichTextFormatType;
        const locale = element.getAttribute('data-hygraph-field-locale') || '';

        if (entryId && fieldApiId && format && ['html', 'markdown', 'text'].includes(format)) {
          const fieldKey = `${entryId}:${fieldApiId}:${locale}`;

          // Check for duplicate field usage (UNSUPPORTED)
          if (formatPreferences[fieldKey]) {
            // Track duplicates for warning
            if (!duplicateFields[fieldKey]) {
              duplicateFields[fieldKey] = [formatPreferences[fieldKey]];
            }
            duplicateFields[fieldKey].push(format);
          } else {
            formatPreferences[fieldKey] = format;
          }

          if (this.config.debug) {
            console.log(`[Preview] Rich Text format preference detected: ${fieldKey} -> ${format}`);
          }
        }
      });

    // 🚨 VALIDATION: Warn about unsupported duplicate field usage with DIFFERENT formats
    Object.entries(duplicateFields).forEach(([fieldKey, formats]) => {
      // Only warn if the formats are actually different
      const uniqueFormats = [...new Set(formats)];
      if (uniqueFormats.length > 1) {
        console.warn(
          `🚨 [Preview] UNSUPPORTED USAGE: Rich Text field "${fieldKey}" appears multiple times with different formats: [${formats.join(', ')}].\n\n` +
          `⚠️  LIMITATION: Each Rich Text field should appear only ONCE per format in your preview.\n` +
          `✅ SOLUTION: Use different field API IDs or choose one format.\n\n` +
          `Example:\n` +
          `❌ <div data-hygraph-field-api-id="description" data-hygraph-rich-text-format="html">\n` +
          `❌ <div data-hygraph-field-api-id="description" data-hygraph-rich-text-format="markdown">\n\n` +
          `✅ <div data-hygraph-field-api-id="description" data-hygraph-rich-text-format="html">\n` +
          `✅ <div data-hygraph-field-api-id="descriptionMd" data-hygraph-rich-text-format="markdown">\n\n` +
          `📖 See: https://docs.claude.com/preview-sdk#rich-text-limitations`
        );
      }
    });

    return formatPreferences;
  }

  private sendReadyMessage(): void {
    if (!this.messageBridge) return;

    // Build capabilities based on config
    const capabilities: SDKCapabilities = {
      fieldFocusSync: this.config.sync?.fieldFocus ?? false,  // Default: disabled
      fieldUpdateSync: this.config.sync?.fieldUpdate ?? false, // Default: disabled
      richTextFormatPreferences: this.scanRichTextFormatPreferences() // Scan DOM for format preferences
    };

    const message: SDKMessage = {
      type: 'ready',
      sdkVersion: this.getVersion(),
      capabilities,
      timestamp: Date.now(),
    };

    // Use sendReadyMessage for initial connection (doesn't require known studioOrigin)
    this.messageBridge.sendReadyMessage(message);
  }

  private handleStudioMessage(message: StudioMessage): void {
    console.log('[Preview] handleStudioMessage called with:', message.type, message);

    switch (message.type) {
      case 'init':
        this.handleInitMessage(message);
        break;
      case 'field-update':
        this.handleFieldUpdate(message);
        break;
      case 'field-focus':
        console.log('[Preview] Routing to handleFieldFocus');
        this.handleFieldFocus(message);
        break;
      case 'content-saved':
        this.handleContentSaved(message);
        break;
      case 'disconnect':
        this.handleDisconnect();
        break;
    }
  }

  private handleInitMessage(message: StudioMessage & { type: 'init' }): void {
    if (this.config.debug) {
      console.log('[Preview] Connected to Studio:', message.studioOrigin);
    }
    this.emitEvent('preview:connected', { studioOrigin: message.studioOrigin });
  }

  private async handleFieldUpdate(message: StudioMessage & { type: 'field-update' }): Promise<void> {
    // Call user's custom handler if provided
    if (this.config.onFieldUpdate) {
      console.log('[Preview] Using custom onFieldUpdate handler');
      this.config.onFieldUpdate(message);
    } else {
      // Use built-in ContentUpdater only when no custom handler is provided
      console.log('[Preview] Using built-in ContentUpdater');
      await this.contentUpdater.updateField(message);

      // Note: Field updates happen automatically via ContentUpdater
      // No user-facing events emitted as this is internal behavior
    }
  }

  private handleFieldFocus(message: StudioMessage & { type: 'field-focus' }): void {
    console.log('[Preview] Received field-focus message:', {
      entryId: message.entryId,
      fieldApiId: message.fieldApiId,
      componentChain: message.componentChain,
      locale: message.locale,
    });

    // Emit event for listeners
    this.emitEvent('preview:field-focus', {
      entryId: message.entryId,
      fieldApiId: message.fieldApiId,
      locale: message.locale,
    });

    // Use custom handler if provided
    if (this.config.onFieldFocus) {
      console.log('[Preview] Using custom onFieldFocus handler');
      this.config.onFieldFocus(message.fieldApiId, message.locale);
      return;
    }

    // Default behavior: Find and focus the specific field element for this entry
    console.log('[Preview] Searching for field in registry...');
    let elements = this.fieldRegistry.getElementsForEntryField(
      message.entryId,
      message.fieldApiId,
      undefined // locale not supported yet
    );

    console.log('[Preview] Initial registry search result:', {
      foundCount: elements.length,
      foundElements: elements.map(e => ({
        fieldApiId: e.fieldApiId,
        entryId: e.entryId,
        element: e.element.tagName,
        componentChainRaw: e.componentChainRaw,
      })),
    });

    // Filter by component chain if provided
    if (message.componentChain && message.componentChain.length > 0) {
      console.log('[Preview] Filtering by component chain:', message.componentChain);

      const targetChainString = JSON.stringify(message.componentChain);

      elements = elements.filter(el => {
        if (!el.componentChainRaw) {
          console.log('[Preview] Element has no component chain, skipping');
          return false;
        }

        try {
          const elementChainString = el.componentChainRaw;
          console.log('[Preview] Comparing chains:', {
            target: targetChainString,
            element: elementChainString,
          });

          // Compare the stringified chains
          return elementChainString === targetChainString;
        } catch (e) {
          console.log('[Preview] Error comparing chains:', e);
          return false;
        }
      });

      console.log('[Preview] After filtering by component chain:', {
        foundCount: elements.length,
      });
    }

    if (elements.length > 0) {
      const element = elements[0].element;
      console.log('[Preview] Scrolling to element:', element);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add highlight class for visual feedback
      element.classList.add('hygraph-field-highlight');

      // Remove highlight class after animation
      setTimeout(() => {
        element.classList.remove('hygraph-field-highlight');
      }, 2000);

      // Try to focus if it's a focusable element
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.focus();
      }
    } else {
      console.warn('[Preview] Could not find element for field focus:', {
        entryId: message.entryId,
        fieldApiId: message.fieldApiId,
        componentChain: message.componentChain,
        locale: message.locale,
      });

      // Debug: Log all registered elements
      console.log('[Preview] All registered elements:', this.fieldRegistry.getRegistryKeys());
    }
  }


  private async handleContentSaved(message: StudioMessage & { type: 'content-saved' }): Promise<void> {
    if (this.config.debug) {
      console.log('[Preview] Content saved, triggering framework refresh');
    }

    // Emit save event
    this.emitEvent('preview:content-saved', {
      entryId: message.entryId,
      timestamp: message.timestamp
    });

    // Execute save callbacks for framework integration
    for (const callback of this.saveCallbacks) {
      try {
        await callback(message.entryId);
      } catch (error) {
        console.error('[Preview] Save callback failed:', error);
      }
    }
  }

  private handleDisconnect(): void {
    if (this.config.debug) {
      console.log('[Preview] Disconnected from Studio');
    }
    this.emitEvent('preview:disconnected', {});
  }

  private setupEditClickHandler(): void {
    // Set up edit click handler for overlay manager
    document.addEventListener('hygraph-edit-click', this.handleEditClick as EventListener);
  }

  private handleEditClick = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const registeredElement = customEvent.detail;
    const element = registeredElement.element;

    if (this.mode === 'iframe') {
      this.handleIframeEditClick(element);
    } else {
      this.handleStandaloneEditClick(element);
    }
  };

  private setupIframeEditHandlers(): void {
    // Edit handlers are now managed by OverlayManager
    // This method is kept for compatibility but overlay handles the clicks
  }

  private setupStandaloneEditHandlers(): void {
    // Edit handlers are now managed by OverlayManager
    // This method is kept for compatibility but overlay handles the clicks
  }

  private handleIframeEditClick(element: HTMLElement): void {
    const entryId = element.getAttribute('data-hygraph-entry-id');
    const fieldApiId = element.getAttribute('data-hygraph-field-api-id') || undefined;
    const locale = element.getAttribute('data-hygraph-field-locale') || undefined;
    const componentChain = this.parseComponentChain(
      element.getAttribute('data-hygraph-component-chain') || undefined
    );

    if (!entryId) return;

    // Send field click message to Studio
    if (this.messageBridge) {
      const message: SDKMessage = {
        type: 'field-click',
        entryId,
        fieldApiId,
        locale,
        componentChain,
        timestamp: Date.now(),
      };

      const success = this.messageBridge.sendMessage(message);

      // Fallback to standalone mode if not connected
      if (!success && this.config.standalone?.fallbackToNewTab !== false) {
        if (this.config.debug) {
          console.log('[Preview] Studio not connected, falling back to new tab');
        }
        this.handleStandaloneEditClick(element);
      }
    }

    // Emit event
    this.emitEvent('preview:field-click', {
      entryId,
      fieldApiId,
      locale,
       componentChain,
      mode: this.mode
    });
  }

  private handleStandaloneEditClick(element: HTMLElement): void {
    const entryId = element.getAttribute('data-hygraph-entry-id');
    const fieldApiId = element.getAttribute('data-hygraph-field-api-id') || undefined;
    const locale = element.getAttribute('data-hygraph-field-locale') || undefined;
    const componentChain = this.parseComponentChain(
      element.getAttribute('data-hygraph-component-chain') || undefined
    );

    if (!entryId) return;

    if (!this.config.endpoint) {
      console.error('[Preview] Cannot open Studio - no endpoint configured');
      return;
    }

    // Construct Studio resource route URL
    const studioUrl = this.buildStudioUrl(entryId, fieldApiId, locale, componentChain);

    // Open in new tab
    window.open(studioUrl, '_blank', 'noopener,noreferrer');

    if (this.config.debug) {
      console.log('[Preview] Opened Studio in new tab:', studioUrl);
    }

    // Emit event
    this.emitEvent('preview:field-click', {
      entryId,
      fieldApiId,
      locale,
      componentChain,
      mode: this.mode
    });
  }

  private buildStudioUrl(entryId: string, fieldApiId?: string, locale?: string, componentChain?: ComponentChainLink[]): string {
    const baseUrl = this.config.studioUrl || 'https://app.hygraph.com';
    const params = new URLSearchParams({
      endpoint: this.config.endpoint,
      entryId,
    });

    if (fieldApiId) params.set('fieldApiId', fieldApiId);
    if (locale) params.set('locale', locale);
    if (componentChain && componentChain.length > 0) {
      params.set('componentChain', JSON.stringify(componentChain));
    }

    return `${baseUrl}/entry?${params.toString()}`;
  }

  private parseComponentChain(raw?: string | null): ComponentChainLink[] | undefined {
    if (!raw) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return undefined;
      }

      const links = parsed
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const { fieldApiId, instanceId } = item as Record<string, unknown>;
          if (typeof fieldApiId !== 'string' || typeof instanceId !== 'string' || !instanceId) {
            return null;
          }
          return { fieldApiId, instanceId } as ComponentChainLink;
        })
        .filter((link): link is ComponentChainLink => Boolean(link));

      return links.length > 0 ? links : undefined;
    } catch (error) {
      if (this.config.debug) {
        console.warn('[Preview] Failed to parse component chain attribute', raw, error);
      }
      return undefined;
    }
  }

  private emitEvent<K extends keyof import('../types').PreviewEvents>(
    type: K,
    detail: import('../types').PreviewEvents[K]['detail']
  ): void {
    const event = new CustomEvent(type, { detail });
    document.dispatchEvent(event);
  }
}
