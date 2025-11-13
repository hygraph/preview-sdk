/**
 * MessageBridge - Handles postMessage communication with Studio
 * Provides reliable message sending with origin validation and error handling
 */

import type { SDKMessage, StudioMessage } from '../types';

export interface MessageBridgeConfig {
  debug?: boolean;
  allowedOrigins: string[];
  onMessage: (message: StudioMessage) => void;
  onReady?: () => void;
}

export class MessageBridge {
  private config: MessageBridgeConfig;
  private isConnected = false;
  private studioOrigin: string | null = null;
  private messageQueue: SDKMessage[] = [];
  private isDestroyed = false;

  constructor(config: MessageBridgeConfig) {
    this.config = config;
    this.setupMessageListener();
  }

  /**
   * Send message to Studio
   */
  sendMessage(message: SDKMessage): boolean {
    if (this.isDestroyed) return false;

    if (!this.isConnected || !this.studioOrigin) {
      // Queue message for when connection is established
      this.messageQueue.push(message);
      return false;
    }

    try {
      window.parent.postMessage(message, this.studioOrigin);

      if (this.config.debug) {
        console.log('[MessageBridge] Sent message:', message);
      }

      return true;
    } catch (error) {
      console.error('[MessageBridge] Failed to send message:', error);
      return false;
    }
  }

  /**
   * Send initial ready message to all allowed origins
   * Used to establish initial connection when studioOrigin is unknown
   */
  sendReadyMessage(message: SDKMessage & { type: 'ready' }): boolean {
    if (this.isDestroyed) return false;

    let sentSuccessfully = false;

    // Try sending to each allowed origin
    for (const origin of this.config.allowedOrigins) {
      try {
        window.parent.postMessage(message, origin);

        if (this.config.debug) {
          console.log('[MessageBridge] Sent ready message to origin:', origin, 'message:', message);
        }

        sentSuccessfully = true;
      } catch (error) {
        if (this.config.debug) {
          console.log('[MessageBridge] Failed to send ready message to origin:', origin, 'error:', error);
        }
      }
    }

    return sentSuccessfully;
  }

  /**
   * Check if connected to Studio
   */
  isConnectedToStudio(): boolean {
    return this.isConnected;
  }

  /**
   * Get Studio origin
   */
  getStudioOrigin(): string | null {
    return this.studioOrigin;
  }

  /**
   * Destroy message bridge
   */
  destroy(): void {
    this.isDestroyed = true;
    this.isConnected = false;
    this.studioOrigin = null;
    this.messageQueue = [];
    window.removeEventListener('message', this.handleMessage);
  }

  private setupMessageListener(): void {
    if (this.config.debug) {
      console.log('[MessageBridge] Setting up message listener, allowed origins:', this.config.allowedOrigins);
    }
    window.addEventListener('message', this.handleMessage);

    // Notify that MessageBridge is ready to receive messages
    if (this.config.onReady) {
      // Use setTimeout to ensure the event listener is fully registered
      setTimeout(() => {
        this.config.onReady!();
      }, 0);
    }
  }

  private handleMessage = (event: MessageEvent): void => {
    if (this.isDestroyed) return;

    // Validate origin
    if (!this.isOriginAllowed(event.origin)) {
      if (this.config.debug) {
        console.log('[MessageBridge] Ignored message from disallowed origin:', event.origin);
      }
      return;
    }

    // Validate message structure
    const message = event.data;
    if (!this.isValidStudioMessage(message)) {
      if (this.config.debug) {
        console.log('[MessageBridge] Ignored invalid message:', message);
      }
      return;
    }

    if (this.config.debug) {
      console.log('[MessageBridge] Received message:', message);
    }

    // Handle connection establishment
    if (message.type === 'init') {
      this.handleConnection(event.origin);
    }

    // Forward message to handler
    this.config.onMessage(message);
  };

  private isOriginAllowed(origin: string): boolean {
    return this.config.allowedOrigins.includes(origin) ||
           this.config.allowedOrigins.some(allowed => {
             // Support wildcard origins like *.hygraph.com
             if (allowed.includes('*')) {
               const pattern = allowed.replace(/\*/g, '.*');
               return new RegExp(`^${pattern}$`).test(origin);
             }
             return false;
           });
  }

  private isValidStudioMessage(message: unknown): message is StudioMessage {
    if (typeof message !== 'object' || message === null) return false;

    const candidate = message as Record<string, unknown>;

    if (typeof candidate.type !== 'string') return false;
    if (typeof candidate.timestamp !== 'number') return false;

    // Type-specific validation
    switch (candidate.type) {
      case 'init':
        return typeof candidate.studioOrigin === 'string';

      case 'field-update':
        return (
          typeof candidate.entryId === 'string' &&
          typeof candidate.fieldApiId === 'string' &&
          typeof candidate.fieldType === 'string' &&
          candidate.newValue !== undefined
        );

      case 'field-focus':
        return (
          typeof candidate.entryId === 'string' &&
          typeof candidate.fieldApiId === 'string'
        );

      case 'content-saved':
        return typeof candidate.entryId === 'string';

      case 'disconnect':
        return true;

      default:
        return false;
    }
  }

  private handleConnection(origin: string): void {
    if (!this.isConnected) {
      this.isConnected = true;
      this.studioOrigin = origin;

      if (this.config.debug) {
        console.log('[MessageBridge] Connected to Studio:', origin);
      }

      // Send queued messages
      this.flushMessageQueue();
    }
  }

  private flushMessageQueue(): void {
    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      this.sendMessage(message);
    }

    if (this.config.debug && messages.length > 0) {
      console.log(`[MessageBridge] Sent ${messages.length} queued messages`);
    }
  }
}