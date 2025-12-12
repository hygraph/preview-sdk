import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FieldRegistry } from './FieldRegistry';
import { createMockDOM, createPreviewElement, waitFor } from '../test-utils';

const previewConfig = {
  endpoint: 'https://example.com/graphql',
};

const previewConfigWithDebug = {
  endpoint: 'https://example.com/graphql',
  debug: true,
};

/**
 * Helper to create an element that inherits entry-id from a parent
 */
function createInheritedElement(options: {
  parentEntryId: string;
  fieldApiId: string;
  componentChain?: string;
  textContent?: string;
}): { parent: HTMLElement; child: HTMLElement } {
  const parent = document.createElement('div');
  parent.setAttribute('data-hygraph-entry-id', options.parentEntryId);

  const child = document.createElement('span');
  child.setAttribute('data-hygraph-field-api-id', options.fieldApiId);
  if (options.componentChain) {
    child.setAttribute('data-hygraph-component-chain', options.componentChain);
  }
  if (options.textContent) {
    child.textContent = options.textContent;
  }

  parent.appendChild(child);
  document.body.appendChild(parent);

  return { parent, child };
}

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

  describe('entry-id inheritance', () => {
    it('inherits entry-id from parent element', () => {
      const { child } = createInheritedElement({
        parentEntryId: 'inherited-entry-1',
        fieldApiId: 'title',
        textContent: 'Inherited title',
      });

      registry.refresh();

      const results = registry.getElementsForEntryField('inherited-entry-1', 'title');
      expect(results).toHaveLength(1);
      expect(results[0].element).toBe(child);
      expect(results[0].entryId).toBe('inherited-entry-1');
      expect(results[0].fieldApiId).toBe('title');
    });

    it('inherits entry-id through multiple ancestor levels', () => {
      // Create: grandparent (entry-id) > parent > child (field-api-id)
      const grandparent = document.createElement('article');
      grandparent.setAttribute('data-hygraph-entry-id', 'deep-entry');

      const parent = document.createElement('div');
      const child = document.createElement('h1');
      child.setAttribute('data-hygraph-field-api-id', 'headline');

      parent.appendChild(child);
      grandparent.appendChild(parent);
      document.body.appendChild(grandparent);

      registry.refresh();

      const results = registry.getElementsForEntryField('deep-entry', 'headline');
      expect(results).toHaveLength(1);
      expect(results[0].element).toBe(child);
    });

    it('explicit entry-id takes precedence over inherited', () => {
      // Parent has entry-id "parent-entry"
      // Child has both entry-id "child-entry" and field-api-id
      const parent = document.createElement('div');
      parent.setAttribute('data-hygraph-entry-id', 'parent-entry');

      const child = document.createElement('span');
      child.setAttribute('data-hygraph-entry-id', 'child-entry');
      child.setAttribute('data-hygraph-field-api-id', 'name');

      parent.appendChild(child);
      document.body.appendChild(parent);

      registry.refresh();

      // Should be registered under child-entry, not parent-entry
      const childResults = registry.getElementsForEntryField('child-entry', 'name');
      expect(childResults).toHaveLength(1);

      const parentResults = registry.getElementsForEntryField('parent-entry', 'name');
      expect(parentResults).toHaveLength(0);
    });

    it('handles dynamic child insertion with inheritance', async () => {
      // First create parent with entry-id
      const parent = document.createElement('div');
      parent.setAttribute('data-hygraph-entry-id', 'dynamic-parent');
      document.body.appendChild(parent);

      // Then dynamically add child with field-api-id
      const child = document.createElement('p');
      child.setAttribute('data-hygraph-field-api-id', 'content');
      parent.appendChild(child);

      await waitFor(() => {
        const results = registry.getElementsForEntryField('dynamic-parent', 'content');
        expect(results).toHaveLength(1);
        expect(results[0].element).toBe(child);
      });
    });

    it('registers multiple fields under same parent entry-id', () => {
      const parent = document.createElement('article');
      parent.setAttribute('data-hygraph-entry-id', 'multi-field-entry');

      const title = document.createElement('h1');
      title.setAttribute('data-hygraph-field-api-id', 'title');

      const description = document.createElement('p');
      description.setAttribute('data-hygraph-field-api-id', 'description');

      const author = document.createElement('span');
      author.setAttribute('data-hygraph-field-api-id', 'author');

      parent.appendChild(title);
      parent.appendChild(description);
      parent.appendChild(author);
      document.body.appendChild(parent);

      registry.refresh();

      expect(registry.getElementsForEntryField('multi-field-entry', 'title')).toHaveLength(1);
      expect(registry.getElementsForEntryField('multi-field-entry', 'description')).toHaveLength(1);
      expect(registry.getElementsForEntryField('multi-field-entry', 'author')).toHaveLength(1);

      const stats = registry.getStats();
      // 4 elements: parent (entry-id only) + 3 children (inherited field-api-ids)
      expect(stats.totalElements).toBe(4);
      expect(stats.entriesCount).toBe(1);
      expect(stats.fieldsCount).toBe(3);
    });

    it('preserves component chain on inherited elements', () => {
      createInheritedElement({
        parentEntryId: 'component-entry',
        fieldApiId: 'heroTitle',
        componentChain: 'hero.0.title',
      });

      registry.refresh();

      const results = registry.getElementsForEntryField('component-entry', 'heroTitle');
      expect(results).toHaveLength(1);
      expect(results[0].componentChainRaw).toBe('hero.0.title');
    });

    it('does not register orphan field elements without ancestor entry-id', () => {
      // Create element with field-api-id but no ancestor with entry-id
      const orphan = document.createElement('div');
      orphan.setAttribute('data-hygraph-field-api-id', 'orphanField');
      document.body.appendChild(orphan);

      registry.refresh();

      const results = registry.getElementsForField('orphanField');
      expect(results).toHaveLength(0);
    });

    it('warns in debug mode when field has no ancestor with entry-id', () => {
      const debugRegistry = new FieldRegistry(previewConfigWithDebug);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const orphan = document.createElement('div');
      orphan.setAttribute('data-hygraph-field-api-id', 'orphanField');
      document.body.appendChild(orphan);

      debugRegistry.refresh();

      expect(warnSpy).toHaveBeenCalledWith(
        '[FieldRegistry] Element has field-api-id but no ancestor with entry-id:',
        orphan
      );

      warnSpy.mockRestore();
      debugRegistry.destroy();
    });
  });
});

