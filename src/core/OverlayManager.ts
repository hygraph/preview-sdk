/**
 * OverlayManager - Creates and manages visual overlays for Preview elements
 * Provides hover effects and edit buttons for content elements
 */

import type { PreviewConfig, RegisteredElement } from '../types';

export class OverlayManager {
  private config: PreviewConfig;
  private overlayElement: HTMLElement | null = null;
  private editButtonElement: HTMLElement | null = null;
  private currentTarget: HTMLElement | null = null;
  private isDestroyed = false;
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: PreviewConfig) {
    this.config = config;
    this.createOverlayElements();
    this.setupEventListeners();
  }

  /**
   * Show overlay for a specific element
   */
  showOverlay(element: HTMLElement, registeredElement: RegisteredElement): void {
    if (this.isDestroyed || !this.config.overlayEnabled) return;

    this.currentTarget = element;
    this.updateOverlayPosition(element);
    this.updateEditButton(registeredElement);
    this.showOverlayElements();
  }

  /**
   * Hide overlay
   */
  hideOverlay(): void {
    if (this.isDestroyed) return;

    this.currentTarget = null;
    this.hideOverlayElements();
  }

  /**
   * Destroy overlay manager
   */
  destroy(): void {
    this.isDestroyed = true;

    // Clear any pending hover timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    this.removeOverlayElements();
    this.removeEventListeners();
  }

  private createOverlayElements(): void {
    // Get overlay configuration with defaults
    const overlayStyle = this.config.overlay?.style || {};
    const borderColor = overlayStyle.borderColor || '#3B82F6';
    const borderWidth = overlayStyle.borderWidth || '2px';
    const backgroundColor = overlayStyle.backgroundColor || 'rgba(59, 130, 246, 0.1)';
    const opacity = overlayStyle.opacity !== undefined ? overlayStyle.opacity : 1;
    const borderRadius = overlayStyle.borderRadius || '4px';

    // Debug logging
    if (this.config.debug) {
      console.log('[OverlayManager] Creating overlay with config:', {
        borderColor,
        borderWidth,
        backgroundColor,
        opacity,
        borderRadius,
      });
    }

    // Create overlay border element
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'hygraph-preview-overlay';
    this.overlayElement.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      border: ${borderWidth} solid ${borderColor};
      background: ${backgroundColor};
      border-radius: ${borderRadius};
      display: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
      opacity: ${opacity};
    `;

    // Get button configuration with defaults
    const buttonStyle = this.config.overlay?.button || {};
    const buttonBackgroundColor = buttonStyle.backgroundColor || '#3B82F6';
    const buttonColor = buttonStyle.color || 'white';
    const buttonBorderRadius = buttonStyle.borderRadius || '6px';
    const buttonFontSize = buttonStyle.fontSize || '14px';
    const buttonPadding = buttonStyle.padding || '8px 12px';

    // Create edit button element
    this.editButtonElement = document.createElement('button');
    this.editButtonElement.id = 'hygraph-preview-edit-button';
    this.editButtonElement.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Edit
    `;
    this.editButtonElement.style.cssText = `
      position: fixed;
      z-index: 10000;
      background: ${buttonBackgroundColor};
      color: ${buttonColor};
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: ${buttonBorderRadius};
      padding: ${buttonPadding};
      font-size: ${buttonFontSize};
      font-weight: 500;
      cursor: pointer;
      display: none;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      pointer-events: auto;
      width: 72px;
      height: 32px;
      justify-content: center;
      box-sizing: border-box;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    `;

    // Add hover effects
    const hoverColor = this.darkenColor(buttonBackgroundColor, 0.1);
    this.editButtonElement.addEventListener('mouseenter', () => {
      this.editButtonElement!.style.background = hoverColor;
      this.editButtonElement!.style.transform = 'scale(1.05)';
    });

    this.editButtonElement.addEventListener('mouseleave', () => {
      this.editButtonElement!.style.background = buttonBackgroundColor;
      this.editButtonElement!.style.transform = 'scale(1)';
    });

    // Append to body
    document.body.appendChild(this.overlayElement);
    document.body.appendChild(this.editButtonElement);
  }

  private setupEventListeners(): void {
    // Mouse move for overlay positioning
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseleave', this.handleMouseLeave);

    // Scroll handling
    document.addEventListener('scroll', this.handleScroll, true);
    window.addEventListener('resize', this.handleResize);
  }

  private removeEventListeners(): void {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('scroll', this.handleScroll, true);
    window.removeEventListener('resize', this.handleResize);
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (this.isDestroyed) return;

    const target = event.target as HTMLElement;

    // Don't hide overlay if mouse is over our edit button
    if (target === this.editButtonElement || this.editButtonElement?.contains(target)) {
      return;
    }

    // Find closest element with field-api-id OR entry-id
    const hygraphElement = target.closest(
      '[data-hygraph-field-api-id], [data-hygraph-entry-id]'
    ) as HTMLElement | null;

    if (hygraphElement && hygraphElement !== this.currentTarget) {
      // Clear any pending hover timeout
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }

      // Get registered element data
      const fieldApiId = hygraphElement.getAttribute('data-hygraph-field-api-id');

      // Get entry-id: explicit or inherited from ancestor
      let entryId = hygraphElement.getAttribute('data-hygraph-entry-id');
      if (!entryId) {
        const ancestor = hygraphElement.closest('[data-hygraph-entry-id]') as HTMLElement | null;
        entryId = ancestor?.getAttribute('data-hygraph-entry-id') ?? null;
      }

      if (entryId) {
        const registeredElement: RegisteredElement = {
          element: hygraphElement,
          entryId,
          fieldApiId: fieldApiId || undefined,
        };

        // Show overlay immediately
        this.showOverlay(hygraphElement, registeredElement);
      }
    } else if (!hygraphElement && this.currentTarget) {
      // Clear any pending hover timeout
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }

      // Add small delay to prevent flicker when moving to edit button
      setTimeout(() => {
        if (this.currentTarget && !this.isMouseOverEditButton(event)) {
          this.hideOverlay();
        }
      }, 50);
    }
  };

  private isMouseOverEditButton(event: MouseEvent): boolean {
    if (!this.editButtonElement) return false;

    const rect = this.editButtonElement.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }

  private handleMouseLeave = (): void => {
    this.hideOverlay();
  };

  private handleScroll = (): void => {
    if (this.currentTarget) {
      this.updateOverlayPosition(this.currentTarget);
    }
  };

  private handleResize = (): void => {
    if (this.currentTarget) {
      this.updateOverlayPosition(this.currentTarget);
    }
  };

  private updateOverlayPosition(element: HTMLElement): void {
    if (!this.overlayElement) return;

    const rect = element.getBoundingClientRect();

    this.overlayElement.style.left = `${rect.left}px`;
    this.overlayElement.style.top = `${rect.top}px`;
    this.overlayElement.style.width = `${rect.width}px`;
    this.overlayElement.style.height = `${rect.height}px`;
  }

  private updateEditButton(registeredElement: RegisteredElement): void {
    if (!this.editButtonElement || !this.currentTarget) return;

    const rect = this.currentTarget.getBoundingClientRect();
    const buttonWidth = 72;
    const buttonHeight = 32;
    const padding = 4; // Reduced padding for tighter positioning

    // Always position button inside the element bounds - no gaps!
    // Try top-right corner first
    let buttonTop = rect.top + padding;
    let buttonLeft = rect.right - buttonWidth - padding;

    // If button doesn't fit in top-right, try other corners
    if (buttonLeft < rect.left + padding) {
      // Element too narrow - use left edge
      buttonLeft = rect.left + padding;
    }

    if (buttonTop + buttonHeight + padding > rect.bottom) {
      // Element too short - use bottom edge
      buttonTop = Math.max(rect.top + padding, rect.bottom - buttonHeight - padding);
    }

    // Final bounds checking - ensure button stays within element
    buttonLeft = Math.max(rect.left + padding, Math.min(buttonLeft, rect.right - buttonWidth - padding));
    buttonTop = Math.max(rect.top + padding, Math.min(buttonTop, rect.bottom - buttonHeight - padding));

    this.editButtonElement.style.left = `${buttonLeft}px`;
    this.editButtonElement.style.top = `${buttonTop}px`;

    // Update button click handler
    this.editButtonElement.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.handleEditClick(registeredElement);
    };

    // Update button tooltip
    const fieldName = registeredElement.fieldApiId || 'entry';
    this.editButtonElement.title = `Edit ${fieldName}`;
  }

  private handleEditClick(registeredElement: RegisteredElement): void {
    // Emit custom event that the Preview will handle
    const event = new CustomEvent('hygraph-edit-click', {
      detail: registeredElement,
      bubbles: true,
    });

    document.dispatchEvent(event);

    if (this.config.debug) {
      console.log('[OverlayManager] Edit button clicked:', registeredElement);
    }
  }

  private showOverlayElements(): void {
    if (this.overlayElement) {
      this.overlayElement.style.display = 'block';
    }
    if (this.editButtonElement) {
      this.editButtonElement.style.display = 'flex';
    }
  }

  private hideOverlayElements(): void {
    if (this.overlayElement) {
      this.overlayElement.style.display = 'none';
    }
    if (this.editButtonElement) {
      this.editButtonElement.style.display = 'none';
    }
  }

  private removeOverlayElements(): void {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }
    if (this.editButtonElement) {
      this.editButtonElement.remove();
      this.editButtonElement = null;
    }
  }

  private darkenColor(color: string, amount: number): string {
    // Simple color darkening - works for hex and common color names
    if (color.startsWith('#')) {
      // Handle hex colors
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      const darkR = Math.floor(r * (1 - amount));
      const darkG = Math.floor(g * (1 - amount));
      const darkB = Math.floor(b * (1 - amount));

      return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
    }

    // For non-hex colors, return a default darker version
    return color === '#3B82F6' ? '#2563EB' : color;
  }
}