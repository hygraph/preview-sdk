/**
 * ContentUpdater - Handles seamless content updates without page refresh
 * Supports different field types: text, rich text, assets, components
 */

import type {
  PreviewConfig,
  FieldUpdate,
  UpdateResult,
  RichTextAST,
  RichTextFormats,
  RichTextNode,
  AssetData,
  ComponentData,
  LocationData,
  JsonValue,
  RelationUpdateValue,
} from '../types';

export class ContentUpdater {
  private config: PreviewConfig;
  private updateQueue: Map<string, FieldUpdate> = new Map();
  private isDestroyed = false;

  constructor(config: PreviewConfig) {
    this.config = config;
  }

  /**
   * Update a single field with new content
   */
  async updateField(update: FieldUpdate): Promise<UpdateResult> {
    if (this.isDestroyed) {
      return { success: false, error: 'ContentUpdater is destroyed' };
    }

    try {
      // Debounce updates
      const updateKey = `${update.entryId}:${update.fieldApiId}`;
      this.updateQueue.set(updateKey, update);

      // Wait for debounce delay
      await this.delay(this.config.updateDelay || 50);

      // Check if this update is still the latest
      const latestUpdate = this.updateQueue.get(updateKey);
      if (latestUpdate !== update) {
        return { success: true }; // Superseded by newer update
      }

      // Remove from queue
      this.updateQueue.delete(updateKey);

      // Find target elements
      const elements = this.findElements(update.entryId, update.fieldApiId);
      if (elements.length === 0) {
        return { success: false, error: 'No matching elements found' };
      }

      // Update all matching elements
      let hasError = false;
      let lastError = '';

      for (const element of elements) {
        try {
          await this.updateElement(element, update);
        } catch (error) {
          hasError = true;
          lastError = error instanceof Error ? error.message : String(error);
          console.error('[ContentUpdater] Failed to update element:', error);
        }
      }

      if (hasError) {
        return { success: false, error: lastError };
      }

      if (this.config.debug) {
        console.log('[ContentUpdater] Updated field:', {
          entryId: update.entryId,
          fieldApiId: update.fieldApiId,
          elementsCount: elements.length,
        });
      }

      return { success: true, element: elements[0] };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[ContentUpdater] Update failed:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Destroy content updater
   */
  destroy(): void {
    this.isDestroyed = true;
    this.updateQueue.clear();
  }

  private findElements(entryId: string, fieldApiId?: string): HTMLElement[] {
    const elements: HTMLElement[] = [];

    // Build selector
    let selector = `[data-hygraph-entry-id="${entryId}"]`;
    if (fieldApiId) {
      selector += `[data-hygraph-field-api-id="${fieldApiId}"]`;
    }

    const found = document.querySelectorAll<HTMLElement>(selector);
    elements.push(...Array.from(found));

    return elements;
  }

  private async updateElement(element: HTMLElement, update: FieldUpdate): Promise<void> {
    switch (update.fieldType) {
      case 'STRING':
      case 'ID':
        this.updateTextField(element, update.newValue);
        break;

      case 'RICHTEXT':
        await this.updateRichTextField(element, update.newValue);
        break;

      case 'INT':
      case 'FLOAT':
        this.updateNumberField(element, update.newValue);
        break;

      case 'BOOLEAN':
        this.updateBooleanField(element, update.newValue);
        break;

      case 'DATETIME':
      case 'DATE':
        this.updateDateField(element, update.newValue);
        break;

      case 'ASSET':
        await this.updateAssetField(element, update.newValue);
        break;

      case 'LOCATION':
        this.updateLocationField(element, update.newValue);
        break;

      case 'COLOR':
        this.updateColorField(element, update.newValue);
        break;

      case 'COMPONENT':
        await this.updateComponentField(element, update.newValue);
        break;

      case 'JSON':
        this.updateJsonField(element, update.newValue);
        break;

      case 'ENUMERATION':
        this.updateTextField(element, update.newValue);
        break;

      case 'RELATION':
        this.updateRelationField(element, update.newValue);
        break;

      default:
        throw new Error('Unsupported field type');
    }
  }

  private updateTextField(element: HTMLElement, newValue: string): void {
    if (!newValue && newValue !== '') return;

    // Update text content
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      (element as HTMLInputElement).value = newValue;
    } else {
      element.textContent = newValue;
    }
  }

  private async updateRichTextField(element: HTMLElement, richTextData: RichTextAST | string | RichTextFormats): Promise<void> {
    try {
      let content: string;

      // Handle multiple format types
      if (typeof richTextData === 'string') {
        // Legacy: Studio sent pre-converted string
        content = richTextData;

        if (this.shouldUseInnerHTML(element, content)) {
          element.innerHTML = content;
        } else {
          element.textContent = content;
        }
        return;
      }

      // Handle multi-format objects - select format based on element preference
      if (richTextData && typeof richTextData === 'object') {
        if ('html' in richTextData && 'markdown' in richTextData) {
          // Multi-format object - select based on element's format preference
          const formatPreference = element.getAttribute('data-hygraph-rich-text-format');

          if (this.config.debug) {
            console.log(`[ContentUpdater] Rich Text multi-format update:`, {
              formatPreference,
              availableFormats: Object.keys(richTextData)
            });
          }

          if (formatPreference === 'html' && richTextData.html) {
            content = richTextData.html;
            if (this.hasMorphdom()) {
              const tempElement = document.createElement(element.tagName);
              tempElement.innerHTML = content;
              window.morphdom?.(element, tempElement);
            } else {
              element.innerHTML = content;
            }
          } else if (formatPreference === 'markdown' && richTextData.markdown) {
            content = richTextData.markdown;
            element.textContent = content;
          } else if (formatPreference === 'text' && richTextData.text) {
            content = richTextData.text;
            element.textContent = content;
          } else {
            // Fallback to HTML if no preference or preference not available
            content = richTextData.html || this.richTextToHTML(richTextData.ast || richTextData);
            element.innerHTML = content;
          }

        } else if ('children' in richTextData) {
          // Legacy: AST format
          content = this.richTextToHTML(richTextData as RichTextAST);
          element.innerHTML = content;
        }
      }
    } catch (error) {
      console.error('[ContentUpdater] Rich text update failed:', error);
      throw error;
    }
  }

  private updateNumberField(element: HTMLElement, newValue: number): void {
    if (newValue === null || newValue === undefined) return;

    const stringValue = String(newValue);

    if (element.tagName === 'INPUT') {
      (element as HTMLInputElement).value = stringValue;
    } else {
      element.textContent = stringValue;
    }
  }

  private updateBooleanField(element: HTMLElement, newValue: boolean): void {
    if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'checkbox') {
      (element as HTMLInputElement).checked = newValue;
    } else {
      element.textContent = String(newValue);
    }
  }

  private updateDateField(element: HTMLElement, newValue: string): void {
    if (!newValue) return;

    // Parse and format date appropriately
    const date = new Date(newValue);
    const formattedDate = date.toLocaleDateString();

    if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'date') {
      (element as HTMLInputElement).value = newValue.split('T')[0];
    } else {
      element.textContent = formattedDate;
    }
  }

  private async updateAssetField(element: HTMLElement, asset: AssetData | AssetData[]): Promise<void> {
    if (!asset) return;

    // Handle array of assets
    if (Array.isArray(asset)) {
      if (asset.length > 0) {
        await this.updateSingleAsset(element, asset[0]);
      }
      return;
    }

    await this.updateSingleAsset(element, asset);
  }

  private async updateSingleAsset(element: HTMLElement, asset: AssetData): Promise<void> {
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      img.src = asset.url;
      if (asset.alt) img.alt = asset.alt;
      if (asset.width) img.width = asset.width;
      if (asset.height) img.height = asset.height;
    } else if (element.tagName === 'VIDEO') {
      const video = element as HTMLVideoElement;
      video.src = asset.url;
    } else if (element.tagName === 'AUDIO') {
      const audio = element as HTMLAudioElement;
      audio.src = asset.url;
    } else if (element.tagName === 'A') {
      const link = element as HTMLAnchorElement;
      link.href = asset.url;
      if (!link.textContent) {
        link.textContent = asset.fileName;
      }
    } else {
      // For other elements, create appropriate child element
      element.innerHTML = `<img src="${asset.url}" alt="${asset.alt || ''}" />`;
    }
  }

  private updateLocationField(element: HTMLElement, location: LocationData): void {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return;
    }

    const locationText = `${location.latitude}, ${location.longitude}`;
    element.textContent = locationText;

    // Update data attributes for map integration
    element.setAttribute('data-latitude', String(location.latitude));
    element.setAttribute('data-longitude', String(location.longitude));
  }

  private updateColorField(element: HTMLElement, color: string): void {
    if (!color) return;

    element.textContent = color;

    // Apply color as background or text color
    if (element.style) {
      element.style.backgroundColor = color;
    }
  }

  private async updateComponentField(element: HTMLElement, componentData: ComponentData): Promise<void> {
    if (!componentData) return;

    try {
      // This is a simplified component update - in a real implementation,
      // you might need framework-specific rendering logic
      const componentHtml = this.renderComponent(componentData);

      if (this.hasMorphdom()) {
        const tempElement = document.createElement(element.tagName);
        tempElement.innerHTML = componentHtml;
        window.morphdom?.(element, tempElement);
      } else {
        element.innerHTML = componentHtml;
      }
    } catch (error) {
      console.error('[ContentUpdater] Component update failed:', error);
      throw error;
    }
  }

  private updateJsonField(element: HTMLElement, jsonData: JsonValue): void {
    if (jsonData === null || jsonData === undefined) return;

    const jsonString = JSON.stringify(jsonData, null, 2);
    element.textContent = jsonString;
  }

  private updateRelationField(element: HTMLElement, relation: RelationUpdateValue): void {
    if (relation === null) {
      element.textContent = '';
      return;
    }

    if (Array.isArray(relation)) {
      element.textContent = relation.join(', ');
      return;
    }

    element.textContent = relation;
  }

  private richTextToHTML(richTextAST: RichTextAST): string {
    if (!richTextAST.children) return '';

    return richTextAST.children.map(node => this.renderRichTextNode(node)).join('');
  }

  private renderRichTextNode(node: RichTextNode): string {
    if (typeof node.text === 'string') {
      return this.escapeHtml(node.text);
    }

    const children =
      Array.isArray(node.children)
        ? node.children.map((child) => this.renderRichTextNode(child)).join('')
        : '';

    switch (node.type) {
      case 'paragraph':
        return `<p>${children}</p>`;
      case 'heading-one':
        return `<h1>${children}</h1>`;
      case 'heading-two':
        return `<h2>${children}</h2>`;
      case 'heading-three':
        return `<h3>${children}</h3>`;
      case 'heading-four':
        return `<h4>${children}</h4>`;
      case 'heading-five':
        return `<h5>${children}</h5>`;
      case 'heading-six':
        return `<h6>${children}</h6>`;
      case 'block-quote':
        return `<blockquote>${children}</blockquote>`;
      case 'bulleted-list':
        return `<ul>${children}</ul>`;
      case 'numbered-list':
        return `<ol>${children}</ol>`;
      case 'list-item':
        return `<li>${children}</li>`;
      case 'link': {
        const href = typeof node.href === 'string' ? node.href : '';
        return `<a href="${href}">${children}</a>`;
      }
      case 'bold':
        return `<strong>${children}</strong>`;
      case 'italic':
        return `<em>${children}</em>`;
      case 'underline':
        return `<u>${children}</u>`;
      case 'code':
        return `<code>${children}</code>`;
      default:
        return children;
    }
  }

  private renderComponent(componentData: ComponentData): string {
    // Basic component rendering - this would be more sophisticated in practice
    const typename = componentData.__typename;
    const fields = Object.entries(componentData)
      .filter(([key]) => key !== '__typename' && key !== 'id')
      .map(([key, value]) => `<div data-field="${key}">${this.escapeHtml(this.formatComponentValue(value))}</div>`)
      .join('');

    return `<div data-component="${typename}">${fields}</div>`;
  }

  private formatComponentValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private hasMorphdom(): boolean {
    return typeof window.morphdom === 'function';
  }

  private shouldUseInnerHTML(_element: HTMLElement, content: string): boolean {
    // Use innerHTML if content contains HTML tags
    if (content.includes('<') && content.includes('>')) {
      return true;
    }

    // Otherwise use textContent
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
