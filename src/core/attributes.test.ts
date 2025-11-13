import { describe, it, expect } from 'vitest';
import {
  createPreviewAttributes,
  createComponentChainLink,
  serializeComponentChain,
  withFieldPath,
  type PreviewFieldOptions,
} from './attributes';
import type { ComponentChainLink } from '../types';

describe('attributes helpers', () => {
  it('creates preview attributes with optional field metadata', () => {
    const attributes = createPreviewAttributes({
      entryId: 'entry-1',
      fieldApiId: 'title',
      locale: 'en',
    });

    expect(attributes).toEqual({
      'data-hygraph-entry-id': 'entry-1',
      'data-hygraph-field-api-id': 'title',
      'data-hygraph-field-locale': 'en',
    });
  });

  it('throws when entryId is missing', () => {
    expect(() =>
      createPreviewAttributes({ fieldApiId: 'title' } as unknown as PreviewFieldOptions)
    ).toThrow('[Preview SDK] createPreviewAttributes requires an entryId');
  });

  it('serializes component chains while filtering invalid entries', () => {
    const chain = [
      createComponentChainLink('ingredients', 'component-1'),
      // Invalid link should be ignored
      { fieldApiId: null, instanceId: null } as unknown as ComponentChainLink,
    ];

    const serialized = serializeComponentChain(chain);

    expect(serialized).toBe(
      JSON.stringify([{ fieldApiId: 'ingredients', instanceId: 'component-1' }])
    );
  });

  it('adds field path attribute for debugging', () => {
    const attrs = createPreviewAttributes({ entryId: 'entry', fieldApiId: 'field' });
    const withPath = withFieldPath(attrs, 'components.0.field');

    expect(withPath).toEqual({
      ...attrs,
      'data-hygraph-field-path': 'components.0.field',
    });
  });
});

