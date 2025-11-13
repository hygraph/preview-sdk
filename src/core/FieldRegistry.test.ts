import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FieldRegistry } from './FieldRegistry';
import { createMockDOM, createPreviewElement, waitFor } from '../test-utils';

const previewConfig = {
  endpoint: 'https://example.com/graphql',
};

describe('FieldRegistry', () => {
  let registry: FieldRegistry;

  beforeEach(() => {
    createMockDOM();
    // Create registry after DOM reset so constructor can discover existing nodes.
    registry = new FieldRegistry(previewConfig);
  });

  afterEach(() => {
    registry.destroy();
  });

  it('registers existing elements on construction', () => {
    // Add an element before refreshing registry manually.
    const element = createPreviewElement({
      entryId: 'entry-1',
      fieldApiId: 'title',
      textContent: 'Hello world',
    });

    registry.refresh();

    const results = registry.getElementsForEntryField('entry-1', 'title');
    expect(results).toHaveLength(1);
    expect(results[0].element).toBe(element);
  });

  it('tracks elements added after construction via mutation observers', async () => {
    createPreviewElement({
      entryId: 'entry-2',
      fieldApiId: 'description',
      textContent: 'Details',
    });

    await waitFor(() => {
      const results = registry.getElementsForEntryField('entry-2', 'description');
      expect(results).toHaveLength(1);
    });
  });

  it('updates registrations when element attributes change', async () => {
    const element = createPreviewElement({
      entryId: 'entry-3',
      fieldApiId: 'oldField',
    });

    registry.refresh();

    expect(registry.getElementsForEntryField('entry-3', 'oldField')).toHaveLength(1);

    element.setAttribute('data-hygraph-field-api-id', 'newField');

    await waitFor(() => {
      expect(registry.getElementsForEntryField('entry-3', 'oldField')).toHaveLength(0);
      expect(registry.getElementsForEntryField('entry-3', 'newField')).toHaveLength(1);
    });
  });

  it('provides registry statistics', () => {
    createPreviewElement({ entryId: 'entry-4', fieldApiId: 'name' });
    createPreviewElement({ entryId: 'entry-4', fieldApiId: 'summary' });
    registry.refresh();

    const stats = registry.getStats();
    expect(stats.totalElements).toBe(2);
    expect(stats.entriesCount).toBe(1);
    expect(stats.fieldsCount).toBe(2);
  });
});

