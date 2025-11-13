import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OverlayManager } from './OverlayManager';
import { createMockDOM, createPreviewElement } from '../test-utils';
import type { RegisteredElement } from '../types';

const config = {
  endpoint: 'https://example.com/graphql',
  overlayEnabled: true,
  debug: false,
};

describe('OverlayManager', () => {
  let manager: OverlayManager;
  let overlayElement: HTMLElement | null;
  let editButton: HTMLElement | null;

  beforeEach(() => {
    createMockDOM();
    manager = new OverlayManager(config);
    overlayElement = document.getElementById('hygraph-preview-overlay');
    editButton = document.getElementById('hygraph-preview-edit-button');
  });

  afterEach(() => {
    manager.destroy();
  });

  it('shows overlay and edit button for registered elements', () => {
    const element = createPreviewElement({
      entryId: 'entry-overlay',
      fieldApiId: 'title',
      textContent: 'Overlay target',
    });

    const registered: RegisteredElement = {
      element,
      entryId: 'entry-overlay',
      fieldApiId: 'title',
    };

    manager.showOverlay(element, registered);

    expect(overlayElement?.style.display).toBe('block');
    expect(editButton?.style.display).toBe('flex');
  });

  it('hides overlay elements when requested', () => {
    const element = createPreviewElement({
      entryId: 'entry-hide',
      fieldApiId: 'description',
    });
    const registered: RegisteredElement = {
      element,
      entryId: 'entry-hide',
      fieldApiId: 'description',
    };

    manager.showOverlay(element, registered);
    manager.hideOverlay();

    expect(overlayElement?.style.display).toBe('none');
    expect(editButton?.style.display).toBe('none');
  });

  it('dispatches edit event when edit button is clicked', () => {
    const element = createPreviewElement({
      entryId: 'entry-edit',
      fieldApiId: 'cta',
    });
    const registered: RegisteredElement = {
      element,
      entryId: 'entry-edit',
      fieldApiId: 'cta',
    };

    const listener = vi.fn();
    document.addEventListener('hygraph-edit-click', listener as EventListener);

    manager.showOverlay(element, registered);
    editButton?.click();

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.entryId).toBe('entry-edit');

    document.removeEventListener('hygraph-edit-click', listener as EventListener);
  });
});

