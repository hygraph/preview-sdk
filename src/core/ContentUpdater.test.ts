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
});

