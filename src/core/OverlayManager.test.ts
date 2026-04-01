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

  describe('entry-id inheritance', () => {
    it('shows overlay on element with inherited entry-id', () => {
      // Create parent with entry-id, child with only field-api-id
      const parent = document.createElement('article');
      parent.setAttribute('data-hygraph-entry-id', 'inherited-overlay-entry');

      const child = document.createElement('h1');
      child.setAttribute('data-hygraph-field-api-id', 'title');
      child.textContent = 'Inherited field';

      parent.appendChild(child);
      document.body.appendChild(parent);

      const registered: RegisteredElement = {
        element: child,
        entryId: 'inherited-overlay-entry',
        fieldApiId: 'title',
      };

      manager.showOverlay(child, registered);

      expect(overlayElement?.style.display).toBe('block');
      expect(editButton?.style.display).toBe('flex');
    });

    it('positions overlay on the field element, not the ancestor', () => {
      const parent = document.createElement('article');
      parent.setAttribute('data-hygraph-entry-id', 'position-test-entry');
      parent.style.cssText = 'width: 500px; height: 400px; position: relative;';

      const child = document.createElement('span');
      child.setAttribute('data-hygraph-field-api-id', 'smallField');
      child.style.cssText = 'width: 100px; height: 20px; display: inline-block;';
      child.textContent = 'Small field';

      parent.appendChild(child);
      document.body.appendChild(parent);

      const registered: RegisteredElement = {
        element: child,
        entryId: 'position-test-entry',
        fieldApiId: 'smallField',
      };

      manager.showOverlay(child, registered);

      // Overlay should match child dimensions, not parent
      const childRect = child.getBoundingClientRect();
      expect(overlayElement?.style.width).toBe(`${childRect.width}px`);
      expect(overlayElement?.style.height).toBe(`${childRect.height}px`);
    });

    it('dispatches edit event with inherited entry-id', () => {
      const parent = document.createElement('div');
      parent.setAttribute('data-hygraph-entry-id', 'inherited-click-entry');

      const child = document.createElement('p');
      child.setAttribute('data-hygraph-field-api-id', 'description');

      parent.appendChild(child);
      document.body.appendChild(parent);

      const registered: RegisteredElement = {
        element: child,
        entryId: 'inherited-click-entry',
        fieldApiId: 'description',
      };

      const listener = vi.fn();
      document.addEventListener('hygraph-edit-click', listener as EventListener);

      manager.showOverlay(child, registered);
      editButton?.click();

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.entryId).toBe('inherited-click-entry');
      expect(event.detail.fieldApiId).toBe('description');

      document.removeEventListener('hygraph-edit-click', listener as EventListener);
    });
  });
});

