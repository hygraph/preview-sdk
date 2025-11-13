import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Preview } from './Preview';
import { createMockDOM, createPreviewElement, createMockMessageBridge, waitFor } from '../test-utils';

const endpoint = 'https://example.com/graphql';
const allowedOrigin = 'https://app.hygraph.com';

describe('Preview', () => {
  let preview: Preview | null;
  let bridgeMock: ReturnType<typeof createMockMessageBridge>;

  beforeEach(() => {
    createMockDOM();
    bridgeMock = createMockMessageBridge();
    preview = null;
  });

  afterEach(() => {
    preview?.destroy();
    bridgeMock.restore();
    vi.restoreAllMocks();
    delete (window as typeof window & { __HYGRAPH_PREVIEW__?: Preview }).__HYGRAPH_PREVIEW__;
  });

  it('emits preview:ready event on initialization', () => {
    const listener = vi.fn();
    const handler = ((event: Event) => {
      listener((event as CustomEvent<{ preview: Preview }>).detail.preview);
    }) as EventListener;
    document.addEventListener('preview:ready', handler);

    preview = new Preview({ endpoint, mode: 'iframe', allowedOrigins: [allowedOrigin] });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toBeInstanceOf(Preview);

    document.removeEventListener('preview:ready', handler);
  });

  it('detects standalone mode by default', () => {
    preview = new Preview({ endpoint, mode: 'iframe', allowedOrigins: [allowedOrigin] });
    expect(preview.getMode()).toBe('iframe');
  });

  it('invokes save callbacks when content-saved message is received', async () => {
    preview = new Preview({ endpoint, debug: false, mode: 'iframe', allowedOrigins: [allowedOrigin] });

    bridgeMock.dispatch(
      {
        type: 'init',
        studioOrigin: allowedOrigin,
        timestamp: Date.now(),
      },
      allowedOrigin
    );

    const saveCallback = vi.fn();
    preview.subscribe('save', { callback: saveCallback });

    bridgeMock.dispatch(
      {
        type: 'content-saved',
        entryId: 'entry-save',
        timestamp: Date.now(),
      },
      allowedOrigin
    );

    await waitFor(() => {
      expect(saveCallback).toHaveBeenCalledWith('entry-save');
    });
  });

  it('handles field focus messages by highlighting matching elements', async () => {
    const element = createPreviewElement({
      entryId: 'entry-focus',
      fieldApiId: 'title',
    });
    element.scrollIntoView = vi.fn();

    preview = new Preview({ endpoint, debug: false, mode: 'iframe', allowedOrigins: [allowedOrigin] });

    bridgeMock.dispatch(
      {
        type: 'init',
        studioOrigin: allowedOrigin,
        timestamp: Date.now(),
      },
      allowedOrigin
    );

    bridgeMock.dispatch(
      {
        type: 'field-focus',
        entryId: 'entry-focus',
        fieldApiId: 'title',
        timestamp: Date.now(),
      },
      allowedOrigin
    );

    await waitFor(() => {
      expect(element.classList.contains('hygraph-field-highlight')).toBe(true);
    });
    expect(element.scrollIntoView).toHaveBeenCalled();
  });

  it('registers global debug helper when debug mode is enabled', () => {
    preview = new Preview({ endpoint, debug: true, mode: 'iframe', allowedOrigins: [allowedOrigin] });
    expect((window as typeof window & { __HYGRAPH_PREVIEW__?: Preview }).__HYGRAPH_PREVIEW__).toBe(preview);
    preview.destroy();
    expect((window as typeof window & { __HYGRAPH_PREVIEW__?: Preview }).__HYGRAPH_PREVIEW__).toBeUndefined();
  });
});

