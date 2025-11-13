/**
 * TypeScript type definitions for the Hygraph Preview SDK
 */

// Shared JSON value shape
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

// Relations can be represented by single or multiple identifiers
export type RelationUpdateValue = string | string[] | null;

// ========== MESSAGE TYPES ==========

// Component chain for nested component fields
export interface ComponentChainLink {
  fieldApiId: string;
  instanceId: string;
}

// Messages sent from Studio to SDK
export type StudioMessage =
  | { type: 'init'; studioOrigin: string; timestamp: number }
  | (FieldUpdate & { type: 'field-update'; timestamp: number })
  | { type: 'field-focus'; entryId: string; fieldApiId: string; componentChain?: ComponentChainLink[]; locale?: string; timestamp: number }
  | { type: 'content-saved'; entryId: string; timestamp: number }
  | { type: 'disconnect'; timestamp: number };

// SDK capabilities for Studio communication
export interface SDKCapabilities {
  fieldFocusSync?: boolean;  // Whether SDK wants field focus sync messages
  fieldUpdateSync?: boolean; // Whether SDK wants field update sync messages
  richTextFormatPreferences?: { [fieldKey: string]: RichTextFormatType }; // Format preferences per field (one format per field)
}

/**
 * Supported Rich Text format types
 *
 * IMPORTANT: These correspond to data-hygraph-rich-text-format attribute values
 */
export type RichTextFormatType = 'html' | 'markdown' | 'text';

/**
 * Rich Text Update Value Types (Discriminated Union)
 *
 * CRITICAL: Rich Text fields can receive different value types:
 * - RichTextFormats: Multi-format object (RECOMMENDED - elements choose format)
 * - string: Pre-converted string (legacy)
 * - RichTextAST: Raw AST (legacy)
 */
export type RichTextUpdateValue =
  | RichTextFormats  // RECOMMENDED: Multi-format object
  | string           // Legacy: Pre-converted HTML/Markdown/Text
  | RichTextAST;     // Legacy: Raw AST structure

// Messages sent from SDK to Studio
export type SDKMessage =
  | { type: 'ready'; sdkVersion: string; capabilities?: SDKCapabilities; timestamp: number }
  | {
      type: 'field-click';
      entryId: string;
      fieldApiId?: string;
      locale?: string;
      componentChain?: ComponentChainLink[];
      timestamp: number;
    };

// ========== FIELD TYPES ==========

// All supported field types in Hygraph
export type FieldType =
  | 'ID'
  | 'STRING'
  | 'RICHTEXT'
  | 'INT'
  | 'FLOAT'
  | 'BOOLEAN'
  | 'JSON'
  | 'DATETIME'
  | 'DATE'
  | 'LOCATION'
  | 'COLOR'
  | 'ASSET'
  | 'COMPONENT'
  | 'RELATION'
  | 'ENUMERATION';

// ========== FIELD UPDATE STRUCTURES ==========

interface FieldUpdateBase {
  entryId: string;
  fieldApiId: string;
  locale?: string;
  updateId?: string;
}

type TextFieldType = 'STRING' | 'ID' | 'ENUMERATION';
type NumberFieldType = 'INT' | 'FLOAT';
type DateFieldType = 'DATETIME' | 'DATE';

export type FieldUpdate =
  | (FieldUpdateBase & { fieldType: TextFieldType; newValue: string })
  | (FieldUpdateBase & { fieldType: 'RICHTEXT'; newValue: RichTextUpdateValue })
  | (FieldUpdateBase & { fieldType: NumberFieldType; newValue: number })
  | (FieldUpdateBase & { fieldType: 'BOOLEAN'; newValue: boolean })
  | (FieldUpdateBase & { fieldType: DateFieldType; newValue: string })
  | (FieldUpdateBase & { fieldType: 'ASSET'; newValue: AssetData | AssetData[] })
  | (FieldUpdateBase & { fieldType: 'LOCATION'; newValue: LocationData })
  | (FieldUpdateBase & { fieldType: 'COLOR'; newValue: string })
  | (FieldUpdateBase & { fieldType: 'COMPONENT'; newValue: ComponentData })
  | (FieldUpdateBase & { fieldType: 'JSON'; newValue: JsonValue })
  | (FieldUpdateBase & { fieldType: 'RELATION'; newValue: RelationUpdateValue });

export type FieldUpdateValue = FieldUpdate['newValue'];

// Rich text AST structure (simplified)
export interface RichTextAST {
  children: RichTextNode[];
}

export interface RichTextNode {
  type: string;
  children?: RichTextNode[];
  text?: string;
  href?: string;
  [key: string]: unknown;
}

/**
 * Rich Text Multi-Format Object
 *
 * CRITICAL: This object contains the SAME content in multiple formats.
 * Each element with data-hygraph-rich-text-format will automatically
 * select its preferred format from this object.
 *
 * @example
 * ```typescript
 * // Studio sends ONE message with all formats:
 * {
 *   html: "<strong>Bold text</strong>",
 *   markdown: "**Bold text**",
 *   text: "Bold text",
 *   ast: { children: [...] }
 * }
 *
 * // Elements automatically select their format:
 * // <div data-hygraph-rich-text-format="html"> → uses .html
 * // <div data-hygraph-rich-text-format="markdown"> → uses .markdown
 * ```
 */
export interface RichTextFormats {
  /** HTML representation for dangerouslySetInnerHTML */
  readonly html: string;
  /** Markdown representation for ReactMarkdown, marked.js, etc. */
  readonly markdown: string;
  /** Plain text representation (no formatting) */
  readonly text: string;
  /** Original AST structure (for custom rendering) */
  readonly ast: RichTextAST;
}

// Asset data structure
export interface AssetData {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
}

// Component data structure
export interface ComponentData {
  __typename: string;
  id?: string;
  [fieldApiId: string]: unknown;
}

// Location data structure
export interface LocationData {
  latitude: number;
  longitude: number;
}

// Framework integration helpers
export interface NextRouterLike {
  asPath?: string;
  replace?: (url: string, as?: string, options?: Record<string, unknown>) => Promise<unknown> | void;
}

export interface RemixRevalidator {
  revalidate: () => void;
}

export interface RemixRouterContext {
  revalidator?: RemixRevalidator;
}

export interface NextRouterData {
  router?: NextRouterLike;
  [key: string]: unknown;
}

export interface NuxtAppLike {
  refresh?: () => void;
  [key: string]: unknown;
}

// ========== CONFIGURATION ==========

// Main Preview configuration
export interface PreviewConfig {
  endpoint: string; // Required: Hygraph endpoint URL
  debug?: boolean;
  overlayEnabled?: boolean;
  updateDelay?: number;
  retryAttempts?: number;
  autoConnect?: boolean;
  allowedOrigins?: string[];
  studioUrl?: string; // Allow custom Studio URL (for development)
  mode?: 'auto' | 'iframe' | 'standalone'; // Force specific mode
  onFieldFocus?: (fieldApiId: string, locale?: string) => void; // Custom field focus handler
  onFieldUpdate?: (update: FieldUpdate) => void; // Custom field update handler

  // Studio sync capabilities
  sync?: {
    fieldFocus?: boolean;   // Enable field focus sync from Studio (default: false)
    fieldUpdate?: boolean;  // Enable field update sync from Studio (default: false)
  };

  // Overlay configuration
  overlay?: {
    style?: {
      borderColor?: string;
      borderWidth?: string;
      backgroundColor?: string;
      opacity?: number;
      borderRadius?: string;
    };
    button?: {
      backgroundColor?: string;
      color?: string;
      borderRadius?: string;
      fontSize?: string;
      padding?: string;
    };
  };

  // Standalone mode settings
  standalone?: {
    openInNewTab?: boolean; // Default: true
    studioUrl?: string; // Override default Studio URL
    includeReferrer?: boolean; // Include current page as referrer
    fallbackToNewTab?: boolean; // Fallback to new tab if iframe mode fails
  };
}

// Overlay configuration
export interface OverlayConfig {
  enabled: boolean;
  showOnHover: boolean;
  style?: {
    borderColor?: string;
    borderWidth?: string;
    backgroundColor?: string;
    opacity?: number;
  };
}

// ========== ELEMENT TRACKING ==========

// Data attributes used for tracking elements
export interface ElementAttributes {
  'data-hygraph-entry-id': string;
  'data-hygraph-field-api-id'?: string;
  'data-hygraph-field-locale'?: string;
  'data-hygraph-component-chain'?: string;
}

// Registered element information
export interface RegisteredElement {
  element: HTMLElement;
  entryId: string;
  fieldApiId?: string;
  locale?: string;
  componentChainRaw?: string;
  lastUpdated?: number;
}

// Element registry map structure
export interface ElementRegistry {
  [key: string]: RegisteredElement[];
}

// ========== EVENT TYPES ==========

// Custom events dispatched by the SDK
export interface PreviewEvents {
  'preview:ready': CustomEvent<{ preview: unknown }>;
  'preview:connected': CustomEvent<{ studioOrigin: string }>;
  'preview:disconnected': CustomEvent<Record<string, never>>;
  'preview:field-focus': CustomEvent<{ entryId: string; fieldApiId: string; locale?: string }>;
  'preview:field-click': CustomEvent<{
    entryId: string;
    fieldApiId?: string;
    locale?: string;
    componentChain?: ComponentChainLink[];
    mode?: 'iframe' | 'standalone';
  }>;
  'preview:content-saved': CustomEvent<{ entryId: string; timestamp: number }>;
  'preview:field-updated': CustomEvent<{ entryId: string; fieldApiId: string; newValue: FieldUpdateValue }>;
  'preview:update-failed': CustomEvent<{ entryId: string; fieldApiId: string; error: string }>;
}

// ========== UTILITY TYPES ==========

// Function type for update handlers
export type UpdateHandler = (update: FieldUpdate) => Promise<boolean>;

// Function type for error handlers
export type ErrorHandler = (error: Error) => void;

// Function type for event listeners
export type PreviewEventListener<T = unknown> = (event: CustomEvent<T>) => void;

// Function type for save callbacks
export type SaveCallback = (entryId: string) => void | Promise<void>;

// Subscription configuration
export interface SubscriptionConfig {
  callback: SaveCallback;
}

// Registry key format: "entryId:fieldApiId:locale?"
export type RegistryKey = string;

// Update result
export interface UpdateResult {
  success: boolean;
  error?: string;
  element?: HTMLElement;
}

// ========== BROWSER GLOBALS ==========

declare global {
  interface Window {
    __HYGRAPH_PREVIEW__?: unknown;
    morphdom?: (fromNode: Element | HTMLElement, toNode: Element | HTMLElement) => void;
    __NEXT_DATA__?: NextRouterData;
    next?: { router?: NextRouterLike };
    __remixContext?: unknown;
    __remixRouterContext?: RemixRouterContext;
    __remixRevalidator?: RemixRevalidator;
    __remixRevalidate?: () => void;
    ___gatsby?: unknown;
    __GATSBY?: unknown;
    __NUXT__?: unknown;
    $nuxt?: NuxtAppLike;
    refreshCookie?: () => void;
    invalidateAll?: () => void;
    __SVELTEKIT__?: unknown;
  }

  interface HTMLElement {
    'data-hygraph-entry-id'?: string;
    'data-hygraph-field-api-id'?: string;
    'data-hygraph-field-locale'?: string;
  }
}
