import type { ComponentChainLink, ElementAttributes } from '../types';

export interface PreviewFieldOptions {
  entryId: string;
  fieldApiId?: string;
  locale?: string;
  componentChain?: ComponentChainLink[];
}

export function createPreviewAttributes(options: PreviewFieldOptions): ElementAttributes {
  const { entryId, fieldApiId, locale, componentChain } = options;

  if (!entryId) {
    throw new Error('[Preview SDK] createPreviewAttributes requires an entryId');
  }

  const attributes: ElementAttributes = {
    'data-hygraph-entry-id': entryId,
  };

  if (fieldApiId) {
    attributes['data-hygraph-field-api-id'] = fieldApiId;
  }

  if (locale) {
    attributes['data-hygraph-field-locale'] = locale;
  }

  const serializedChain = serializeComponentChain(componentChain);
  if (serializedChain) {
    attributes['data-hygraph-component-chain'] = serializedChain;
  }

  return attributes;
}

export function createComponentChainLink(fieldApiId: string, instanceId: string): ComponentChainLink {
  if (!fieldApiId) {
    throw new Error('[Preview SDK] createComponentChainLink requires a fieldApiId');
  }
  if (!instanceId) {
    throw new Error('[Preview SDK] createComponentChainLink requires an instanceId');
  }

  return { fieldApiId, instanceId };
}

export function serializeComponentChain(chain?: ComponentChainLink[]): string | undefined {
  if (!chain || chain.length === 0) {
    return undefined;
  }

  const normalized = chain
    .filter((link): link is ComponentChainLink => Boolean(link && typeof link.fieldApiId === 'string' && typeof link.instanceId === 'string'))
    .map((link) => ({
      fieldApiId: link.fieldApiId,
      instanceId: link.instanceId,
    }));

  if (!normalized.length) {
    return undefined;
  }

  return JSON.stringify(normalized);
}

/**
 * Add a field path attribute to preview attributes
 * Useful for debugging and identifying nested fields in complex structures
 * 
 * @param attributes - Preview attributes from createPreviewAttributes
 * @param fieldPath - Dot-notation path to the field (e.g., "ingredients.0.quantity")
 * @returns Attributes with the field path added
 * 
 * @example
 * ```tsx
 * const attrs = createPreviewAttributes({
 *   entryId: recipe.id,
 *   fieldApiId: 'quantity',
 *   componentChain: chain,
 * });
 * const attrsWithPath = withFieldPath(attrs, 'ingredients.0.quantity');
 * ```
 */
export function withFieldPath(attributes: ElementAttributes, fieldPath: string): ElementAttributes & { 'data-hygraph-field-path': string } {
  return {
    ...attributes,
    'data-hygraph-field-path': fieldPath,
  };
}
