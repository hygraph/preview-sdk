# Next.js App Router Guide

Complete guide for integrating Hygraph Preview SDK with Next.js 13+ App Router.

## Installation

```bash
npm install @hygraph/preview-sdk
```

## Setup

### 1. Create Preview Wrapper Component

Create a client component that wraps your app with the Preview SDK:

```tsx
// components/PreviewWrapper.tsx
'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

interface PreviewWrapperProps {
  children: React.ReactNode;
}

// Dynamic import to avoid SSR issues
const HygraphPreview = dynamic(
  () => import('@hygraph/preview-sdk/react').then(mod => ({
    default: mod.HygraphPreview
  })),
  { ssr: false }
);

export function PreviewWrapper({ children }: PreviewWrapperProps) {
  const router = useRouter();

  // Only enable in development
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }

  return (
    <HygraphPreview
      endpoint={process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT!}
      studioUrl={process.env.NEXT_PUBLIC_HYGRAPH_STUDIO_URL}
      debug={true}
      onSave={() => {
        console.log('Content saved, refreshing...');
        router.refresh(); // Preserves scroll position and state
      }}
    >
      {children}
    </HygraphPreview>
  );
}
```

### 2. Add to Root Layout

Wrap your app in the root layout:

```tsx
// app/layout.tsx
import { PreviewWrapper } from '@/components/PreviewWrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PreviewWrapper>{children}</PreviewWrapper>
      </body>
    </html>
  );
}
```

### 3. Set Environment Variables

```bash
# .env.local
NEXT_PUBLIC_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
NEXT_PUBLIC_HYGRAPH_STUDIO_URL=https://app.hygraph.com
HYGRAPH_TOKEN=your-permanent-auth-token  # Optional: Required if your project uses authentication
```

**Note:** `HYGRAPH_TOKEN` is only needed if your Hygraph project requires authentication for Content API requests. You can create a Permanent Auth Token in your Hygraph project settings under Settings → API Access → Permanent Auth Tokens.

### 4. Configure Preview URL in Hygraph Studio

1. Open your project in [Hygraph Studio](https://app.hygraph.com)
2. Go to **Project Settings → Preview URLs**
3. Add a new preview that points at your running Next.js app (e.g. `http://localhost:4500/recipes/{entryId}`)
4. Save the configuration and open an entry to test **Open Preview**

When the preview loads inside Studio, the SDK automatically switches to iframe mode and `router.refresh()` continues to handle save events.

### 5. Add Data Attributes to Content

Mark your content elements with Hygraph data attributes:

```tsx
// app/posts/[slug]/page.tsx
export default async function PostPage({ params }) {
  const post = await getPost(params.slug);

  return (
    <article data-hygraph-entry-id={post.id}>
      <h1
        data-hygraph-entry-id={post.id}
        data-hygraph-field-api-id="title"
      >
        {post.title}
      </h1>

      <div
        data-hygraph-entry-id={post.id}
        data-hygraph-field-api-id="content"
        dangerouslySetInnerHTML={{ __html: post.content.html }}
      />
    </article>
  );
}
```

## How It Works

The Preview SDK uses `router.refresh()` which:
- Re-fetches data from Server Components
- Preserves client-side state (scroll position, form inputs, etc.)
- Updates the UI without a full page reload

This gives you smooth, flicker-free updates when content is saved in Hygraph.

## Advanced Usage

### Custom Save Handler

```tsx
<HygraphPreview
  endpoint={process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT!}
  onSave={async (entryId) => {
    console.log('Saved entry:', entryId);

    // Invalidate specific cache tags
    revalidateTag(`post-${entryId}`);

    // Or refresh the router
    router.refresh();
  }}
/>
```

### Conditional Preview Mode

Only enable preview in specific routes:

```tsx
'use client';

import { usePathname } from 'next/navigation';

export function PreviewWrapper({ children }) {
  const pathname = usePathname();
  const isPreviewRoute = pathname.startsWith('/preview');

  if (!isPreviewRoute) {
    return <>{children}</>;
  }

  // ... HygraphPreview setup
}
```

### Using Preview Hooks

Access preview functionality in any client component:

```tsx
'use client';

import { usePreviewSave, usePreviewEvent } from '@hygraph/preview-sdk/react';
import { useRouter } from 'next/navigation';

export function MyComponent() {
  const router = useRouter();

  usePreviewSave((entryId) => {
    console.log('Content saved:', entryId);
    router.refresh();
  });

  usePreviewEvent('preview:field-click', (detail) => {
    console.log('Field clicked:', detail);
  });

  return <div>My Component</div>;
}
```

## Troubleshooting

### Hydration Errors

If you see hydration mismatches, ensure you're using dynamic import with `ssr: false`:

```tsx
const HygraphPreview = dynamic(
  () => import('@hygraph/preview-sdk/react').then(mod => ({
    default: mod.HygraphPreview
  })),
  { ssr: false } // Important!
);
```

### Preview Not Refreshing

Make sure you're calling `router.refresh()` in the `onSave` callback:

```tsx
<HygraphPreview
  onSave={() => router.refresh()} // Don't forget this!
/>
```

### Edit Buttons Not Showing

1. Check that `data-hygraph-entry-id` is set on your elements
2. Enable `debug={true}` to see console logs
3. Verify environment variables are set correctly

## Production Deployment

The preview wrapper automatically disables itself in production:

```tsx
if (process.env.NODE_ENV !== 'development') {
  return <>{children}</>;
}
```

For production preview environments, conditionally enable based on a feature flag or route.

## Complete Example

See the [complete Next.js App Router example](../../examples/nextjs-example/) for a working implementation.
