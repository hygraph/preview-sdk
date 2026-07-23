# Hygraph Preview SDK

Add clickable edit buttons to your Hygraph content preview. Hover a tagged element to show **Edit**, open the matching field in Studio, and refresh the preview when content is saved.

[![npm version](https://img.shields.io/npm/v/@hygraph/preview-sdk.svg)](https://www.npmjs.com/package/@hygraph/preview-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Works with React, Next.js, Remix, Vue, Nuxt, and vanilla JavaScript.

## Installation

```bash
npm install @hygraph/preview-sdk
```

## Documentation

Full setup, framework guides, and API reference live in the Hygraph docs:

- [Click to Edit setup](https://hygraph.com/docs/developer-guides/schema/click-to-edit) — install, attributes, Studio widget, troubleshooting
- [Advanced API](https://hygraph.com/docs/developer-guides/schema/click-to-edit-advanced-api) — React hooks, Preview methods, DOM events, helpers
- Framework guides:
  - [Next.js App Router](https://hygraph.com/docs/developer-guides/schema/click-to-edit-next-js-app-router)
  - [Next.js Pages Router](https://hygraph.com/docs/developer-guides/schema/click-to-edit-next-js-pages-router)
  - [Remix](https://hygraph.com/docs/developer-guides/schema/click-to-edit-remix)
  - [Vue / Nuxt](https://hygraph.com/docs/developer-guides/schema/click-to-edit-vue-nuxt)
  - [Vanilla JavaScript](https://hygraph.com/docs/developer-guides/schema/click-to-edit-vanilla-js)

## Quick peek

```tsx
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const HygraphPreview = dynamic(
  () => import('@hygraph/preview-sdk/react').then((mod) => ({ default: mod.HygraphPreview })),
  { ssr: false }
);

export function PreviewWrapper({ children }) {
  const router = useRouter();

  return (
    <HygraphPreview
      endpoint={process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT}
      studioUrl={process.env.NEXT_PUBLIC_HYGRAPH_STUDIO_URL}
      onSave={() => router.refresh()}
    >
      {children}
    </HygraphPreview>
  );
}
```

Mark content with `data-hygraph-*` attributes (or the helpers from `@hygraph/preview-sdk/core`). See the [setup guide](https://hygraph.com/docs/developer-guides/schema/click-to-edit) for the full walkthrough.

## Examples

Runnable apps in this repository:

- [Next.js App Router](examples/nextjs-example/)
- [Next.js Pages Router](examples/nextjs-pages-example/)
- [Remix](examples/remix-example/)
- [Vue 3](examples/vue-example/)
- [Vanilla HTML](examples/vanilla-html-example/)

See [examples/README.md](examples/README.md) for schema setup and how to run them.

## Support

- [Hygraph documentation](https://hygraph.com/docs/developer-guides/schema/click-to-edit)
- [GitHub Issues](https://github.com/hygraph/preview-sdk/issues)
- [Hygraph Support](https://hygraph.com/support)

## License

MIT © [Hygraph](https://hygraph.com)
