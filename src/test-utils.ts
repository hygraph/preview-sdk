import { vi, type Mock } from 'vitest';
import type { SDKMessage, StudioMessage, ElementAttributes } from './types';
import { createPreviewAttributes, type PreviewFieldOptions } from './core/attributes';

/**
 * Reset the DOM to a known state and optionally inject markup.
 */
export function createMockDOM(html: string = '<div id="root"></div>'): void {
  document.body.innerHTML = html;
  document.head.innerHTML = '';
}

/**
 * Create and append a preview-enabled element to the document using the
 * provided options.
 */
export function createPreviewElement(
  options: PreviewFieldOptions & {
    tagName?: keyof HTMLElementTagNameMap;
    textContent?: string;
  }
): HTMLElement {
  const { tagName = 'div', textContent } = options;
  const element = document.createElement(tagName);
  const attributes = createPreviewAttributes(options) as ElementAttributes;

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined) {
      element.setAttribute(key, value);
    }
  });

  if (typeof textContent === 'string') {
    element.textContent = textContent;
  }

  document.body.appendChild(element);
  return element;
}

interface MockMessageBridge {
  postMessage: Mock<[message: unknown, targetOrigin: string], void>;
  messages: Array<{ message: unknown; targetOrigin: string }>;
  dispatch: (message: StudioMessage, origin?: string) => void;
  restore: () => void;
}

/**
 * Mock `window.parent.postMessage` to capture outgoing SDK messages and expose
 * helpers for dispatching Studio messages back into the SDK.
 */
export function createMockMessageBridge(): MockMessageBridge {
  const messages: Array<{ message: unknown; targetOrigin: string }> = [];
  const originalPostMessage = window.parent.postMessage?.bind(window.parent);

  const postMessage = vi.fn<[unknown, string], void>((message, targetOrigin) => {
    messages.push({ message, targetOrigin });
  });

  Object.defineProperty(window.parent, 'postMessage', {
    configurable: true,
    writable: true,
    value: postMessage,
  });

  return {
    postMessage,
    messages,
    dispatch: (message: StudioMessage, origin = 'https://app.hygraph.com') => {
      window.dispatchEvent(new MessageEvent('message', { data: message, origin }));
    },
    restore: () => {
      Object.defineProperty(window.parent, 'postMessage', {
        configurable: true,
        writable: true,
        value: originalPostMessage ?? (() => undefined),
      });
    },
  };
}

/**
 * Collect and return the latest SDK message of a specific type captured by the
 * provided mock bridge.
 */
export function findPostedMessage<T extends SDKMessage['type']>(
  bridge: MockMessageBridge,
  type: T
): Extract<SDKMessage, { type: T }> | undefined {
  const record = [...bridge.messages].reverse().find(({ message }) => {
    return typeof message === 'object' && message !== null && (message as SDKMessage).type === type;
  });
  return record?.message as Extract<SDKMessage, { type: T }> | undefined;
}

/**
 * Simple async wait helper that repeatedly executes a callback until it stops
 * throwing or the timeout elapses.
 */
export async function waitFor<T>(
  callback: () => T | Promise<T>,
  { timeout = 1000, interval = 20 }: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const start = Date.now();

  /* eslint-disable no-constant-condition */
  while (true) {
    try {
      return await callback();
    } catch (error) {
      if (Date.now() - start >= timeout) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
  /* eslint-enable no-constant-condition */
}

