import { describe, it, expect, beforeEach } from 'vitest';
import { ContentUpdater } from './ContentUpdater';
import { createMockDOM, createPreviewElement } from '../test-utils';

const config = {
  endpoint: 'https://example.com/graphql',
};

describe('ContentUpdater', () => {
  let updater: ContentUpdater;

  beforeEach(() => {
    createMockDOM();
    updater = new ContentUpdater(config);
  });

  it('updates text fields', async () => {
    const element = createPreviewElement({
      entryId: 'entry-text',
      fieldApiId: 'title',
      textContent: 'Original',
    });

    const result = await updater.updateField({
      entryId: 'entry-text',
      fieldApiId: 'title',
      fieldType: 'STRING',
      newValue: 'Updated Title',
    });

    expect(result.success).toBe(true);
    expect(element.textContent).toBe('Updated Title');
  });

  it('returns failure when no matching elements exist', async () => {
    const result = await updater.updateField({
      entryId: 'missing-entry',
      fieldApiId: 'title',
      fieldType: 'STRING',
      newValue: 'Will not render',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('No matching elements found');
  });

  it('applies multi-format rich text updates based on element preference', async () => {
    const element = createPreviewElement({
      entryId: 'entry-rich-text',
      fieldApiId: 'content',
    });
    element.setAttribute('data-hygraph-rich-text-format', 'html');

    const result = await updater.updateField({
      entryId: 'entry-rich-text',
      fieldApiId: 'content',
      fieldType: 'RICHTEXT',
      newValue: {
        html: '<p>HTML content</p>',
        markdown: 'Markdown content',
        text: 'Plain text',
        ast: { children: [] },
      },
    });

    expect(result.success).toBe(true);
    expect(element.innerHTML).toBe('<p>HTML content</p>');
  });

  it('updates image asset fields', async () => {
    const element = createPreviewElement({
      entryId: 'entry-asset',
      fieldApiId: 'coverImage',
      tagName: 'img',
    }) as HTMLImageElement;

    const result = await updater.updateField({
      entryId: 'entry-asset',
      fieldApiId: 'coverImage',
      fieldType: 'ASSET',
      newValue: {
        id: 'asset-1',
        url: 'https://example.com/image.jpg',
        alt: 'Alt text',
        width: 100,
        height: 200,
        fileName: 'image.jpg',
        mimeType: 'image/jpeg',
        size: 12345,
      },
    });

    expect(result.success).toBe(true);
    expect(element.src).toBe('https://example.com/image.jpg');
    expect(element.alt).toBe('Alt text');
    expect(element.width).toBe(100);
    expect(element.height).toBe(200);
  });

  describe('Component chain filtering', () => {
    it('updates only elements with matching component chain', async () => {
      const componentChain = [{ fieldApiId: 'hero', instanceId: 'instance-1' }];

      // Create element with matching component chain
      const matchingElement = createPreviewElement({
        entryId: 'entry-component',
        fieldApiId: 'title',
        componentChain,
        textContent: 'Original',
      });

      // Create element with different component chain
      const differentElement = createPreviewElement({
        entryId: 'entry-component',
        fieldApiId: 'title',
        componentChain: [{ fieldApiId: 'hero', instanceId: 'instance-2' }],
        textContent: 'Should not change',
      });

      const result = await updater.updateField({
        entryId: 'entry-component',
        fieldApiId: 'title',
        fieldType: 'STRING',
        newValue: 'Updated',
        componentChain,
      });

      expect(result.success).toBe(true);
      expect(matchingElement.textContent).toBe('Updated');
      expect(differentElement.textContent).toBe('Should not change');
    });

    it('updates only elements with exact component chain match', async () => {
      const componentChain = [
        { fieldApiId: 'section', instanceId: 'section-1' },
        { fieldApiId: 'hero', instanceId: 'hero-1' },
      ];

      // Create element with exact matching chain
      const matchingElement = createPreviewElement({
        entryId: 'entry-nested',
        fieldApiId: 'title',
        componentChain,
        textContent: 'Original',
      });

      // Create element with partial chain (only first link)
      const partialElement = createPreviewElement({
        entryId: 'entry-nested',
        fieldApiId: 'title',
        componentChain: [{ fieldApiId: 'section', instanceId: 'section-1' }],
        textContent: 'Should not change',
      });

      const result = await updater.updateField({
        entryId: 'entry-nested',
        fieldApiId: 'title',
        fieldType: 'STRING',
        newValue: 'Updated',
        componentChain,
      });

      expect(result.success).toBe(true);
      expect(matchingElement.textContent).toBe('Updated');
      expect(partialElement.textContent).toBe('Should not change');
    });

    it('falls back to all elements when none have component chain attribute', async () => {
      // Create element WITHOUT component chain attribute (backward compatibility)
      const element = document.createElement('div');
      element.setAttribute('data-hygraph-entry-id', 'entry-legacy');
      element.setAttribute('data-hygraph-field-api-id', 'title');
      element.textContent = 'Original';
      document.body.appendChild(element);

      const result = await updater.updateField({
        entryId: 'entry-legacy',
        fieldApiId: 'title',
        fieldType: 'STRING',
        newValue: 'Updated',
        componentChain: [{ fieldApiId: 'hero', instanceId: 'instance-1' }],
      });

      // Should still update since there are no elements with component chain
      expect(result.success).toBe(true);
      expect(element.textContent).toBe('Updated');
    });

    it('excludes elements without component chain when other elements have it', async () => {
      const componentChain = [{ fieldApiId: 'hero', instanceId: 'instance-1' }];

      // Create element WITH component chain
      const withChain = createPreviewElement({
        entryId: 'entry-mixed',
        fieldApiId: 'title',
        componentChain,
        textContent: 'Has chain',
      });

      // Create element WITHOUT component chain attribute
      const withoutChain = document.createElement('div');
      withoutChain.setAttribute('data-hygraph-entry-id', 'entry-mixed');
      withoutChain.setAttribute('data-hygraph-field-api-id', 'title');
      withoutChain.textContent = 'No chain';
      document.body.appendChild(withoutChain);

      const result = await updater.updateField({
        entryId: 'entry-mixed',
        fieldApiId: 'title',
        fieldType: 'STRING',
        newValue: 'Updated',
        componentChain,
      });

      expect(result.success).toBe(true);
      expect(withChain.textContent).toBe('Updated');
      expect(withoutChain.textContent).toBe('No chain');
    });

    it('updates all elements when no component chain is provided', async () => {
      // Create multiple elements with different chains
      const element1 = createPreviewElement({
        entryId: 'entry-all',
        fieldApiId: 'title',
        componentChain: [{ fieldApiId: 'hero', instanceId: 'instance-1' }],
        textContent: 'Original 1',
      });

      const element2 = createPreviewElement({
        entryId: 'entry-all',
        fieldApiId: 'title',
        componentChain: [{ fieldApiId: 'hero', instanceId: 'instance-2' }],
        textContent: 'Original 2',
      });

      // Update without component chain should update all
      const result = await updater.updateField({
        entryId: 'entry-all',
        fieldApiId: 'title',
        fieldType: 'STRING',
        newValue: 'Updated',
      });

      expect(result.success).toBe(true);
      expect(element1.textContent).toBe('Updated');
      expect(element2.textContent).toBe('Updated');
    });
  });

  describe('Component array updates', () => {
    it('updates component array with multiple items', async () => {
      const element = createPreviewElement({
        entryId: 'entry-array',
        fieldApiId: 'sections',
        textContent: '', // Will be replaced with rendered components
      });

      const componentArray = [
        {
          __typename: 'Hero',
          id: 'hero-1',
          title: 'Hero Title 1',
        },
        {
          __typename: 'Hero',
          id: 'hero-2',
          title: 'Hero Title 2',
        },
      ];

      const result = await updater.updateField({
        entryId: 'entry-array',
        fieldApiId: 'sections',
        fieldType: 'COMPONENT_ARRAY',
        newValue: componentArray,
      });

      expect(result.success).toBe(true);
      // Check that both components were rendered
      expect(element.innerHTML).toContain('Hero');
      expect(element.innerHTML).toContain('Hero Title 1');
      expect(element.innerHTML).toContain('Hero Title 2');
    });

    it('updates component array when items are reordered', async () => {
      const element = createPreviewElement({
        entryId: 'entry-reorder',
        fieldApiId: 'sections',
      });

      // Initial array
      const initialArray = [
        { __typename: 'Section', id: 'section-1', title: 'First' },
        { __typename: 'Section', id: 'section-2', title: 'Second' },
        { __typename: 'Section', id: 'section-3', title: 'Third' },
      ];

      await updater.updateField({
        entryId: 'entry-reorder',
        fieldApiId: 'sections',
        fieldType: 'COMPONENT_ARRAY',
        newValue: initialArray,
      });

      const initialHTML = element.innerHTML;

      // Reordered array
      const reorderedArray = [
        { __typename: 'Section', id: 'section-3', title: 'Third' },
        { __typename: 'Section', id: 'section-1', title: 'First' },
        { __typename: 'Section', id: 'section-2', title: 'Second' },
      ];

      const result = await updater.updateField({
        entryId: 'entry-reorder',
        fieldApiId: 'sections',
        fieldType: 'COMPONENT_ARRAY',
        newValue: reorderedArray,
      });

      expect(result.success).toBe(true);
      expect(element.innerHTML).not.toBe(initialHTML);
      // Verify all components are still present
      expect(element.innerHTML).toContain('First');
      expect(element.innerHTML).toContain('Second');
      expect(element.innerHTML).toContain('Third');
    });

    it('updates component array when item is deleted', async () => {
      const element = createPreviewElement({
        entryId: 'entry-delete',
        fieldApiId: 'sections',
      });

      // Initial array with 3 items
      const initialArray = [
        { __typename: 'Section', id: 'section-1', title: 'First' },
        { __typename: 'Section', id: 'section-2', title: 'Second' },
        { __typename: 'Section', id: 'section-3', title: 'Third' },
      ];

      await updater.updateField({
        entryId: 'entry-delete',
        fieldApiId: 'sections',
        fieldType: 'COMPONENT_ARRAY',
        newValue: initialArray,
      });

      expect(element.innerHTML).toContain('Second');

      // Array with one item deleted
      const deletedArray = [
        { __typename: 'Section', id: 'section-1', title: 'First' },
        { __typename: 'Section', id: 'section-3', title: 'Third' },
      ];

      const result = await updater.updateField({
        entryId: 'entry-delete',
        fieldApiId: 'sections',
        fieldType: 'COMPONENT_ARRAY',
        newValue: deletedArray,
      });

      expect(result.success).toBe(true);
      expect(element.innerHTML).toContain('First');
      expect(element.innerHTML).not.toContain('Second');
      expect(element.innerHTML).toContain('Third');
    });

    it('updates component array when item is added', async () => {
      const element = createPreviewElement({
        entryId: 'entry-add',
        fieldApiId: 'sections',
      });

      // Initial array with 2 items
      const initialArray = [
        { __typename: 'Section', id: 'section-1', title: 'First' },
        { __typename: 'Section', id: 'section-2', title: 'Second' },
      ];

      await updater.updateField({
        entryId: 'entry-add',
        fieldApiId: 'sections',
        fieldType: 'COMPONENT_ARRAY',
        newValue: initialArray,
      });

      expect(element.innerHTML).not.toContain('Third');

      // Array with new item added
      const addedArray = [
        { __typename: 'Section', id: 'section-1', title: 'First' },
        { __typename: 'Section', id: 'section-2', title: 'Second' },
        { __typename: 'Section', id: 'section-3', title: 'Third' },
      ];

      const result = await updater.updateField({
        entryId: 'entry-add',
        fieldApiId: 'sections',
        fieldType: 'COMPONENT_ARRAY',
        newValue: addedArray,
      });

      expect(result.success).toBe(true);
      expect(element.innerHTML).toContain('First');
      expect(element.innerHTML).toContain('Second');
      expect(element.innerHTML).toContain('Third');
    });

    it('handles empty component array', async () => {
      const element = createPreviewElement({
        entryId: 'entry-empty',
        fieldApiId: 'sections',
      });

      // Set initial content
      element.innerHTML = '<div>Some content</div>';

      const result = await updater.updateField({
        entryId: 'entry-empty',
        fieldApiId: 'sections',
        fieldType: 'COMPONENT_ARRAY',
        newValue: [],
      });

      expect(result.success).toBe(true);
      expect(element.innerHTML).toBe('');
    });

    it('preserves hygraph data attributes during array update', async () => {
      const element = createPreviewElement({
        entryId: 'entry-preserve',
        fieldApiId: 'sections',
        componentChain: [{ fieldApiId: 'parent', instanceId: 'parent-1' }],
      });

      const componentArray = [
        { __typename: 'Section', id: 'section-1', title: 'First' },
      ];

      const result = await updater.updateField({
        entryId: 'entry-preserve',
        fieldApiId: 'sections',
        fieldType: 'COMPONENT_ARRAY',
        newValue: componentArray,
      });

      expect(result.success).toBe(true);
      // Verify data attributes are preserved
      expect(element.getAttribute('data-hygraph-entry-id')).toBe('entry-preserve');
      expect(element.getAttribute('data-hygraph-field-api-id')).toBe('sections');
      expect(element.getAttribute('data-hygraph-component-chain')).toBeTruthy();
    });

    it('filters component arrays by component chain', async () => {
      const componentChain = [{ fieldApiId: 'parent', instanceId: 'parent-1' }];

      // Create element with matching component chain
      const matchingElement = createPreviewElement({
        entryId: 'entry-chain',
        fieldApiId: 'sections',
        componentChain,
      });

      // Create element with different component chain
      const differentElement = createPreviewElement({
        entryId: 'entry-chain',
        fieldApiId: 'sections',
        componentChain: [{ fieldApiId: 'parent', instanceId: 'parent-2' }],
      });

      const componentArray = [
        { __typename: 'Section', id: 'section-1', title: 'Updated' },
      ];

      const result = await updater.updateField({
        entryId: 'entry-chain',
        fieldApiId: 'sections',
        fieldType: 'COMPONENT_ARRAY',
        newValue: componentArray,
        componentChain,
      });

      expect(result.success).toBe(true);
      expect(matchingElement.innerHTML).toContain('Updated');
      expect(differentElement.innerHTML).not.toContain('Updated');
    });
  });
});

