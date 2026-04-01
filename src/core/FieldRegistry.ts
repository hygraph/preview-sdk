/**
 * FieldRegistry - Tracks and manages DOM elements with Hygraph data attributes
 * Maintains mapping of entryId:fieldApiId → HTMLElements for content updates
 */

import type {
  PreviewConfig,
  RegisteredElement,
  ElementRegistry,
  RegistryKey,
} from '../types';

export class FieldRegistry {
  private config: PreviewConfig;
  private registry: ElementRegistry = {};
  private observer: MutationObserver | null = null;
  private isDestroyed = false;

  constructor(config: PreviewConfig) {
    this.config = config;
    this.initializeObserver();
    this.scanExistingElements();
  }

  /**
   * Get all elements for a specific field
   */
  getElementsForField(fieldApiId: string): RegisteredElement[] {
    const elements: RegisteredElement[] = [];

    // Search through all registry entries for matching fieldApiId
    for (const elementList of Object.values(this.registry)) {
      for (const element of elementList) {
        if (element.fieldApiId === fieldApiId) {
          elements.push(element);
        }
      }
    }

    return elements;
  }

  /**
   * Get elements for a specific entry + field combination
   */
  getElementsForEntryField(entryId: string, fieldApiId: string): RegisteredElement[] {
    const elements: RegisteredElement[] = [];

    // Search through all registry entries for matching entryId and fieldApiId
    for (const elementList of Object.values(this.registry)) {
      for (const element of elementList) {
        if (element.entryId === entryId && element.fieldApiId === fieldApiId) {
          elements.push(element);
        }
      }
    }

    return elements;
  }

  /**
   * Get all elements for a specific entry
   */
  getElementsForEntry(entryId: string): RegisteredElement[] {
    const elements: RegisteredElement[] = [];

    for (const elementList of Object.values(this.registry)) {
      for (const element of elementList) {
        if (element.entryId === entryId) {
          elements.push(element);
        }
      }
    }

    return elements;
  }

  /**
   * Get specific element by exact match
   */
  getElement(entryId: string, fieldApiId?: string): RegisteredElement | null {
    const key = this.createRegistryKey(entryId, fieldApiId);
    const elements = this.registry[key];
    return elements?.[0] || null;
  }

  /**
   * Refresh registry - scan for new elements
   */
  refresh(): void {
    if (this.isDestroyed) return;
    this.scanExistingElements();
  }

  /**
   * Destroy registry and clean up observers
   */
  destroy(): void {
    this.isDestroyed = true;
    this.observer?.disconnect();
    this.registry = {};
  }

  private initializeObserver(): void {
    // Set up MutationObserver to watch for DOM changes
    this.observer = new MutationObserver((mutations) => {
      if (this.isDestroyed) return;

      for (const mutation of mutations) {
        // Handle added nodes
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              this.scanElement(element);

              // Also check if this element has field-api-id without entry-id (inherited)
              if (
                element.hasAttribute('data-hygraph-field-api-id') &&
                !element.hasAttribute('data-hygraph-entry-id')
              ) {
                this.registerInheritedElement(element);
              }
            }
          }
        }

        // Handle attribute changes
        if (mutation.type === 'attributes' && mutation.attributeName?.startsWith('data-hygraph-')) {
          this.updateElementRegistration(mutation.target as HTMLElement);
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'data-hygraph-entry-id',
        'data-hygraph-field-api-id',
        'data-hygraph-component-chain',
      ],
    });
  }

  private scanExistingElements(): void {
    // Scan elements with explicit entry-id (existing behavior)
    const explicitElements = document.querySelectorAll('[data-hygraph-entry-id]');
    explicitElements.forEach((element) => this.scanElement(element as HTMLElement));

    // Scan elements with field-api-id that inherit entry-id from ancestors
    const inheritedElements = document.querySelectorAll(
      '[data-hygraph-field-api-id]:not([data-hygraph-entry-id])'
    );
    inheritedElements.forEach((element) =>
      this.registerInheritedElement(element as HTMLElement)
    );
  }

  private scanElement(element: HTMLElement): void {
    if (this.hasHygraphAttributes(element)) {
      this.registerElement(element);
    }

    // Also scan children with explicit entry-id
    const children = element.querySelectorAll('[data-hygraph-entry-id]');
    children.forEach((child) => this.registerElement(child as HTMLElement));

    // Scan children that inherit entry-id (field-api-id without entry-id)
    const inheritedChildren = element.querySelectorAll(
      '[data-hygraph-field-api-id]:not([data-hygraph-entry-id])'
    );
    inheritedChildren.forEach((child) =>
      this.registerInheritedElement(child as HTMLElement)
    );
  }

  private hasHygraphAttributes(element: HTMLElement): boolean {
    return element.hasAttribute('data-hygraph-entry-id');
  }

  private registerElement(element: HTMLElement): void {
    const entryId = element.getAttribute('data-hygraph-entry-id');
    if (!entryId) return;

    const fieldApiId = element.getAttribute('data-hygraph-field-api-id') || undefined;
    const componentChainRaw = element.getAttribute('data-hygraph-component-chain') || undefined;

    const registeredElement: RegisteredElement = {
      element,
      entryId,
      fieldApiId,
      componentChainRaw,
      lastUpdated: Date.now(),
    };

    const key = this.createRegistryKey(entryId, fieldApiId);

    // Initialize array if it doesn't exist
    if (!this.registry[key]) {
      this.registry[key] = [];
    }

    // Check if element is already registered
    const existingIndex = this.registry[key].findIndex((reg) => reg.element === element);
    if (existingIndex >= 0) {
      // Update existing registration
      this.registry[key][existingIndex] = registeredElement;
    } else {
      // Add new registration
      this.registry[key].push(registeredElement);
    }

    if (this.config.debug) {
      console.log(`[FieldRegistry] Registered element:`, {
        entryId,
        fieldApiId,
        element: element.tagName,
      });
    }
  }

  /**
   * Register an element that inherits entry-id from an ancestor
   */
  private registerInheritedElement(element: HTMLElement): void {
    const fieldApiId = element.getAttribute('data-hygraph-field-api-id');
    if (!fieldApiId) return;

    // Find ancestor with entry-id
    const ancestor = element.closest('[data-hygraph-entry-id]');
    if (!ancestor) {
      if (this.config.debug) {
        console.warn(
          '[FieldRegistry] Element has field-api-id but no ancestor with entry-id:',
          element
        );
      }
      return;
    }

    const entryId = ancestor.getAttribute('data-hygraph-entry-id');
    if (!entryId) return;

    const componentChainRaw =
      element.getAttribute('data-hygraph-component-chain') || undefined;

    const registeredElement: RegisteredElement = {
      element,
      entryId,
      fieldApiId,
      componentChainRaw,
      lastUpdated: Date.now(),
    };

    const key = this.createRegistryKey(entryId, fieldApiId);

    // Initialize array if it doesn't exist
    if (!this.registry[key]) {
      this.registry[key] = [];
    }

    // Check if element is already registered
    const existingIndex = this.registry[key].findIndex((reg) => reg.element === element);
    if (existingIndex >= 0) {
      // Update existing registration
      this.registry[key][existingIndex] = registeredElement;
    } else {
      // Add new registration
      this.registry[key].push(registeredElement);
    }

    if (this.config.debug) {
      console.log(`[FieldRegistry] Registered inherited element:`, {
        entryId,
        fieldApiId,
        element: element.tagName,
        inheritedFrom: (ancestor as HTMLElement).tagName,
      });
    }
  }

  private updateElementRegistration(element: HTMLElement): void {
    // Remove old registrations for this element
    this.unregisterElement(element);

    // Re-register with new attributes
    if (this.hasHygraphAttributes(element)) {
      this.registerElement(element);
    } else if (element.hasAttribute('data-hygraph-field-api-id')) {
      // Element has field-api-id but no entry-id - try inheritance
      this.registerInheritedElement(element);
    }
  }

  private unregisterElement(element: HTMLElement): void {
    for (const [key, elements] of Object.entries(this.registry)) {
      const filteredElements = elements.filter((reg) => reg.element !== element);
      if (filteredElements.length === 0) {
        delete this.registry[key];
      } else {
        this.registry[key] = filteredElements;
      }
    }
  }

  private createRegistryKey(entryId: string, fieldApiId?: string): RegistryKey {
    const parts = [entryId];
    if (fieldApiId) parts.push(fieldApiId);
    return parts.join(':');
  }

  /**
   * Get registry statistics for debugging
   */
  getStats(): {
    totalElements: number;
    entriesCount: number;
    fieldsCount: number;
  } {
    const entries = new Set<string>();
    const fields = new Set<string>();
    let totalElements = 0;

    for (const elements of Object.values(this.registry)) {
      totalElements += elements.length;
      for (const element of elements) {
        entries.add(element.entryId);
        if (element.fieldApiId) {
          fields.add(`${element.entryId}:${element.fieldApiId}`);
        }
      }
    }

    return {
      totalElements,
      entriesCount: entries.size,
      fieldsCount: fields.size,
    };
  }

  /**
   * Get all registry keys (for debugging)
   */
  getRegistryKeys(): RegistryKey[] {
    return Object.keys(this.registry);
  }
}
