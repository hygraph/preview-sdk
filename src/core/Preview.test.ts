import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Preview } from './Preview';
import { createMockDOM, createPreviewElement, createMockMessageBridge, findPostedMessage, waitFor } from '../test-utils';
import type { FieldUpdate, PreviewConfig, StudioMessage } from '../types';

const endpoint = 'https://example.com/graphql';
const allowedOrigin = 'https://app.hygraph.com';

describe('Preview', () => {
  let preview: Preview | null;
  let bridgeMock: ReturnType<typeof createMockMessageBridge>;
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    createMockDOM();
    bridgeMock = createMockMessageBridge();
    preview = null;
  });

  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
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

  describe('scalar list updates', () => {
    /** Collect the details of every event of this type until the test ends */
    const captureEvent = (type: string) => {
      const details: unknown[] = [];
      const listener = ((event: Event) => details.push((event as CustomEvent).detail)) as EventListener;

      document.addEventListener(type, listener);
      cleanups.push(() => document.removeEventListener(type, listener));

      return details;
    };

    const connect = (config: Partial<PreviewConfig> = {}) => {
      const instance = new Preview({
        endpoint,
        mode: 'iframe',
        allowedOrigins: [allowedOrigin],
        updateDelay: 0,
        ...config,
      });

      bridgeMock.dispatch({ type: 'init', studioOrigin: allowedOrigin, timestamp: Date.now() }, allowedOrigin);

      return instance;
    };

    const sendFieldUpdate = (update: Partial<FieldUpdate> = {}) =>
      bridgeMock.dispatch(
        {
          type: 'field-update',
          entryId: 'entry-list-sync',
          fieldApiId: 'tags',
          fieldType: 'STRING',
          newValue: 'hello',
          timestamp: Date.now(),
          ...update,
        } as StudioMessage,
        allowedOrigin
      );

    // Studio withholds list updates from an SDK that does not announce this, because an SDK without
    // list support writes the array straight into the bound element and destroys container markup
    it('announces scalarListSync in the ready message', async () => {
      preview = connect();

      await waitFor(() => {
        expect(findPostedMessage(bridgeMock, 'ready')?.capabilities?.scalarListSync).toBe(true);
      });
    });

    it('announces scalarListSync regardless of the sync options the consumer set', async () => {
      preview = connect({ sync: { fieldUpdate: false, fieldFocus: false } });

      await waitFor(() => {
        const capabilities = findPostedMessage(bridgeMock, 'ready')?.capabilities;
        expect(capabilities).toMatchObject({ scalarListSync: true, fieldUpdateSync: false, fieldFocusSync: false });
      });
    });

    it('applies a scalar list update received from Studio', async () => {
      const element = createPreviewElement({
        entryId: 'entry-list-sync',
        fieldApiId: 'tags',
        textContent: 'Original',
      });

      preview = connect();
      sendFieldUpdate({ isList: true, newValue: ['a', 'b'] } as Partial<FieldUpdate>);

      await waitFor(() => {
        expect(element.textContent).toBe('a, b');
      });
    });

    it('hands a scalar list to a custom onFieldUpdate handler untouched', async () => {
      const received: FieldUpdate[] = [];

      preview = connect({ onFieldUpdate: (update) => received.push(update) });
      sendFieldUpdate({
        isList: true,
        newValue: ['a', 'b'],
        componentChain: [{ fieldApiId: 'sections', instanceId: 'inst-1' }],
      } as Partial<FieldUpdate>);

      await waitFor(() => {
        expect(received).toHaveLength(1);
      });
      expect(received[0].isList).toBe(true);
      expect(received[0].newValue).toEqual(['a', 'b']);
      expect(received[0].componentChain).toEqual([{ fieldApiId: 'sections', instanceId: 'inst-1' }]);
    });

    it('emits preview:field-updated once the built-in updater applied the change', async () => {
      createPreviewElement({ entryId: 'entry-list-sync', fieldApiId: 'tags', textContent: 'Original' });

      preview = connect();
      const updated = captureEvent('preview:field-updated');
      sendFieldUpdate({ isList: true, newValue: ['a'] } as Partial<FieldUpdate>);

      await waitFor(() => {
        expect(updated).toHaveLength(1);
      });
      expect(updated[0]).toMatchObject({ entryId: 'entry-list-sync', fieldApiId: 'tags', isList: true });
    });

    it('emits preview:update-failed instead when no element on the page carries the field', async () => {
      preview = connect();
      const updated = captureEvent('preview:field-updated');
      const failed = captureEvent('preview:update-failed');
      sendFieldUpdate({ isList: true, newValue: ['a'] } as Partial<FieldUpdate>);

      await waitFor(() => {
        expect(failed).toHaveLength(1);
      });
      expect(updated).toHaveLength(0);
      expect(failed[0]).toMatchObject({ entryId: 'entry-list-sync', fieldApiId: 'tags' });
    });
  });

});
