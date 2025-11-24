# Hygraph Preview SDK

Add clickable edit buttons to your Hygraph content preview. Click any content element to jump directly to it in the Hygraph editor.

[![npm version](https://img.shields.io/npm/v/@hygraph/preview-sdk.svg)](https://www.npmjs.com/package/@hygraph/preview-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## What It Does

This SDK adds interactive edit buttons to your content preview that:
- Show up when you hover over content elements
- Open the exact field in Hygraph when clicked
- Automatically refresh your preview when content is saved
- Preserve scroll position and page state during updates

Works with React, Next.js, Remix, Vue, and vanilla JavaScript.

## Installation

```bash
npm install @hygraph/preview-sdk
```

## Quick Start

### Next.js (App Router)

```tsx
// app/layout.tsx
import { PreviewWrapper } from '@/components/PreviewWrapper';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PreviewWrapper>{children}</PreviewWrapper>
      </body>
    </html>
  );
}
```

```tsx
// components/PreviewWrapper.tsx
'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const HygraphPreview = dynamic(
  () => import('@hygraph/preview-sdk/react').then(mod => ({ default: mod.HygraphPreview })),
  { ssr: false }
);

export function PreviewWrapper({ children }) {
  const router = useRouter();

  return (
    <HygraphPreview
      endpoint={process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT}
      onSave={() => router.refresh()}
      debug={process.env.NODE_ENV === 'development'}
    >
      {children}
    </HygraphPreview>
  );
}
```

### Mark Your Content

Add `data-hygraph-*` attributes to make content editable:

```tsx
<article data-hygraph-entry-id="entry-123">
  <h1
    data-hygraph-entry-id="entry-123"
    data-hygraph-field-api-id="title"
  >
    My Article Title
  </h1>

  <p
    data-hygraph-entry-id="entry-123"
    data-hygraph-field-api-id="content"
  >
    Article content here...
  </p>
</article>
```

Required attribute:
- `data-hygraph-entry-id`: The entry ID from Hygraph. Every element you want to make editable must include this.

Common optional attributes:
- `data-hygraph-field-api-id`: Identifies which field to open. Without it the edit button opens the entry without focusing a field.
- `data-hygraph-rich-text-format`: Set to `html`, `markdown`, or `text` so the SDK knows which format to update on field sync.
- `data-hygraph-component-chain`: JSON string describing the path to nested components (see below).

```tsx
<div
  data-hygraph-entry-id={post.id}
  data-hygraph-field-api-id="content"
  data-hygraph-rich-text-format="html"
  dangerouslySetInnerHTML={{ __html: post.content.html }}
/>
```

### Tagging Component Fields

Use the `data-hygraph-component-chain` attribute when a field lives inside a modular component, repeatable component list, or union component. The component chain tells Studio how to navigate from the root entry to the specific nested field.

#### Key Concepts

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `data-hygraph-entry-id` | Always the **root page/entry ID** | Identifies which Hygraph entry contains this content |
| `data-hygraph-field-api-id` | The component field name in your schema | Identifies which field to open in the editor |
| `data-hygraph-component-chain` | JSON array of `{fieldApiId, instanceId}` | Describes the path from root entry to the nested field |

**Important:** `data-hygraph-entry-id` is always the root entry ID (e.g., page or article), even for deeply nested components. The component chain handles the navigation to nested fields—you never use the component's ID as the entry ID.

#### What is `instanceId`?

The `instanceId` is the unique identifier for each component instance, returned by Hygraph in your GraphQL response:

```graphql
query {
  page(where: { id: "page_123" }) {
    id                    # Root entry ID → use for data-hygraph-entry-id
    title
    contentSections {     # Modular component field
      ... on HeroSection {
        id                # ← This is the instanceId for the component chain
        headline
        subheadline
      }
      ... on FeatureGrid {
        id                # ← instanceId
        features {
          id              # ← instanceId for nested components
          title
          description
        }
      }
    }
  }
}
```

#### Single-Level Components

For a field inside a component list (e.g., `Page.contentSections[]`):

```tsx
{page.contentSections.map((section) => {
  const chain = [
    createComponentChainLink('contentSections', section.id)
  ];

  return (
    <h2
      {...createPreviewAttributes({
        entryId: page.id,           // Always the root page ID
        fieldApiId: 'headline',     // Field inside the component
        componentChain: chain,
      })}
    >
      {section.headline}
    </h2>
  );
})}
```

The resulting HTML:
```html
<h2
  data-hygraph-entry-id="page_123"
  data-hygraph-field-api-id="headline"
  data-hygraph-component-chain='[{"fieldApiId":"contentSections","instanceId":"section_abc"}]'
>
  Welcome to Our Site
</h2>
```

#### Deeply Nested Components

For components inside other components (e.g., `Page.contentSections[].features[]`):

```tsx
{page.contentSections.map((section, sectionIndex) => (
  <div key={section.id}>
    {section.features?.map((feature, featureIndex) => {
      // Build the chain: page → contentSections → features
      const chain = [
        createComponentChainLink('contentSections', section.id),
        createComponentChainLink('features', feature.id)
      ];

      return (
        <div key={feature.id}>
          <h3
            {...createPreviewAttributes({
              entryId: page.id,         // Still the root page ID
              fieldApiId: 'title',
              componentChain: chain,
            })}
          >
            {feature.title}
          </h3>
          <p
            {...createPreviewAttributes({
              entryId: page.id,
              fieldApiId: 'description',
              componentChain: chain,
            })}
          >
            {feature.description}
          </p>
        </div>
      );
    })}
  </div>
))}
```

#### Union/Modular Components (Multiple Component Types)

When a field accepts different component types, handle each type in a switch statement:

```tsx
{page.contentSections.map((section) => {
  const chain = [createComponentChainLink('contentSections', section.id)];

  switch (section.__typename) {
    case 'HeroSection':
      return (
        <section key={section.id}>
          <h1
            {...createPreviewAttributes({
              entryId: page.id,
              fieldApiId: 'headline',
              componentChain: chain,
            })}
          >
            {section.headline}
          </h1>
        </section>
      );

    case 'FeatureGrid':
      return (
        <section key={section.id}>
          <h2
            {...createPreviewAttributes({
              entryId: page.id,
              fieldApiId: 'gridTitle',
              componentChain: chain,
            })}
          >
            {section.gridTitle}
          </h2>
          {/* Render nested features with extended chain */}
        </section>
      );

    default:
      return null;
  }
})}
```

#### Complete Example: Page with Modular Content

Here's a full example showing a page template with multiple component types and nesting:

```tsx
import {
  createPreviewAttributes,
  createComponentChainLink,
} from '@hygraph/preview-sdk/core';

interface Page {
  id: string;
  title: string;
  contentSections: Array<HeroSection | FeatureGrid | Testimonial>;
}

export function PageTemplate({ page }: { page: Page }) {
  return (
    <main>
      {/* Simple field - no component chain needed */}
      <h1
        {...createPreviewAttributes({
          entryId: page.id,
          fieldApiId: 'title',
        })}
      >
        {page.title}
      </h1>

      {/* Modular content sections */}
      {page.contentSections.map((section, index) => {
        const sectionChain = [
          createComponentChainLink('contentSections', section.id)
        ];

        switch (section.__typename) {
          case 'HeroSection':
            return (
              <section key={section.id} className="hero">
                <h2
                  {...createPreviewAttributes({
                    entryId: page.id,
                    fieldApiId: 'headline',
                    componentChain: sectionChain,
                  })}
                >
                  {section.headline}
                </h2>
                <div
                  {...createPreviewAttributes({
                    entryId: page.id,
                    fieldApiId: 'content',
                    componentChain: sectionChain,
                  })}
                  data-hygraph-rich-text-format="html"
                  dangerouslySetInnerHTML={{ __html: section.content.html }}
                />
              </section>
            );

          case 'FeatureGrid':
            return (
              <section key={section.id} className="features">
                {section.features.map((feature, featureIndex) => {
                  // Extend the chain for nested components
                  const featureChain = [
                    ...sectionChain,
                    createComponentChainLink('features', feature.id)
                  ];

                  return (
                    <div key={feature.id} className="feature-card">
                      <h3
                        {...createPreviewAttributes({
                          entryId: page.id,
                          fieldApiId: 'title',
                          componentChain: featureChain,
                        })}
                      >
                        {feature.title}
                      </h3>
                      <p
                        {...createPreviewAttributes({
                          entryId: page.id,
                          fieldApiId: 'description',
                          componentChain: featureChain,
                        })}
                      >
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </section>
            );

          case 'Testimonial':
            return (
              <blockquote
                key={section.id}
                {...createPreviewAttributes({
                  entryId: page.id,
                  fieldApiId: 'quote',
                  componentChain: sectionChain,
                })}
              >
                {section.quote}
              </blockquote>
            );

          default:
            return null;
        }
      })}
    </main>
  );
}
```

#### Using Raw HTML Attributes (Without Helpers)

If you prefer not to use the helper functions, you can write the attributes directly:

```html
<!-- Single-level component -->
<span
  data-hygraph-entry-id="page_123"
  data-hygraph-field-api-id="headline"
  data-hygraph-component-chain='[{"fieldApiId":"contentSections","instanceId":"section_abc"}]'
>
  Welcome
</span>

<!-- Deeply nested component -->
<p
  data-hygraph-entry-id="page_123"
  data-hygraph-field-api-id="description"
  data-hygraph-component-chain='[{"fieldApiId":"contentSections","instanceId":"section_abc"},{"fieldApiId":"features","instanceId":"feature_xyz"}]'
>
  Feature description here
</p>
```

> **Note:** Always use double quotes inside the JSON string and single quotes for the HTML attribute value to ensure valid HTML.

## Framework Guides

- [Next.js App Router](docs/frameworks/nextjs-app-router.md)
- [Next.js Pages Router](docs/frameworks/nextjs-pages-router.md)
- [Remix](docs/frameworks/remix.md)
- [Vue 3](docs/frameworks/vue.md)
- [Vanilla JavaScript](docs/frameworks/vanilla.md)

## Configuration

```tsx
<HygraphPreview
  endpoint="https://your-region.cdn.hygraph.com/content/your-project-id/master"
  studioUrl="https://app.hygraph.com"  // Optional: custom Studio URL, required if running outside of the studio interface
  debug={true}                          // Optional: enable console logging
  onSave={(entryId) => {               // Optional: custom save handler
    console.log('Content saved:', entryId);
    router.refresh();
  }}
  overlay={{                            // Optional: customize overlay styling
    style: {
      borderColor: '#3b82f6',
      borderWidth: '2px',
    },
    button: {
      backgroundColor: '#3b82f6',
      color: 'white',
    },
  }}
  sync={{
    fieldFocus: true,                   // Optional: enable field focus sync from Studio
    fieldUpdate: false,                 // Optional: apply live field updates
  }}
/>
```

Key props:
- `endpoint` (required): Hygraph Content API endpoint (with stage)
- `studioUrl` (optional): Custom Studio domain when running outside `app.hygraph.com`
- `debug` (optional): Enables verbose console logs to help diagnose attribute issues
- `onSave` (optional): Runs after Hygraph reports a save; receives the Hygraph entry ID so you can target revalidation logic
- `overlay` (optional): Customize overlay border/button appearance
- `sync.fieldFocus` (optional): Ask Studio to focus the field inside the editor when users click an overlay
- `sync.fieldUpdate` (optional): Opt in to live field updates from Studio (Defaults to `false`)
- `allowedOrigins` (optional): Extend the list of domains that can host your preview iframe

## How It Works

The SDK operates in two modes:

**Studio Mode**: When your preview loads inside Hygraph Studio, the SDK detects it is running inside an iframe (`window.self !== window.top`). Edit buttons talk to Studio via `postMessage`, focusing the exact input in the Studio content editor.

**Standalone Mode**: When your preview loads outside Studio (`window.self === window.top`), the SDK opens Studio in a new tab pointing at the same entry. The `studioUrl` option controls which Studio instance to open (defaults to `https://app.hygraph.com`).

You can force a mode with the `mode` prop (`'iframe' | 'standalone' | 'auto'`), but auto detection covers the majority of cases. If you run Studio on a custom domain, pass that URL via `studioUrl` so the SDK knows where to send editors.

## Setting Up Preview URLs in Hygraph Studio

To see the SDK inside the Studio sidebar:

1. Open your project at [app.hygraph.com](https://app.hygraph.com)
2. Go to **Schema → [Choose a model] → Sidebar**
3. Add the **Preview** widget and paste the URL to your running preview (e.g. `http://localhost:4500/preview/{entryId}`)
4. Save the model configuration, then open an entry of that model and click **Open Preview**
5. The preview loads inside Studio and the SDK switches to iframe mode automatically

> Tip: For shared preview environments (QA, staging), add additional Preview URLs that point to those deployments and ensure their origins are included in `allowedOrigins`.

## API Reference

### React Components

- `<HygraphPreview>` - Main wrapper component
- `usePreview()` - Access preview instance
- `usePreviewSave()` - Subscribe to save events
- `usePreviewEvent()` - Subscribe to any event

### Core API

```javascript
import { Preview } from '@hygraph/preview-sdk/core';

const preview = new Preview({
  endpoint: 'your-endpoint',
  debug: true,
});

// Subscribe to save events
preview.subscribe('save', {
  callback: (entryId) => {
    console.log('Content saved:', entryId);
    window.location.reload();
  }
});

// Clean up
preview.destroy();
```

See the TypeScript definitions in `src/react` and `src/core` for the complete surface area. All helpers and types are exported from the package entry points.

## Examples

Working examples for each framework:

- [Next.js App Router](examples/nextjs-example/)
- [Remix](examples/remix-example/)
- [Vue 3](examples/vue-example/)
- [Vanilla HTML](examples/vanilla-html-example/)

Each example includes a complete recipe application with schema setup instructions.

## Troubleshooting

**Edit buttons not appearing?**
- Check that `data-hygraph-entry-id` is set on your elements
- Enable `debug={true}` to see console logs
- Verify your endpoint is correct

**Preview not refreshing on save?**
- Make sure `onSave` callback is set up
- Check that your framework refresh method is working (e.g., `router.refresh()`)

**Content not updating in real-time?**
- Real-time field updates are optional and disabled by default
- Enable with `sync={{ fieldUpdate: true }}` if needed
- Note: Most users only need the save event for full page refresh

Need more help? Open an issue or start a discussion in the repository.

## License

MIT © [Hygraph](https://hygraph.com)

## Support

- [Documentation](docs/)
- [GitHub Issues](https://github.com/hygraph/preview-sdk/issues)
- [Hygraph Support](https://hygraph.com/support)
