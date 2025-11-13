# Next.js Pages Router Guide

Complete guide for integrating Hygraph Preview SDK with Next.js Pages Router (Next.js < 13 or projects using the pages directory).

## Installation

```bash
npm install @hygraph/preview-sdk
```

## Setup

### 1. Create Preview Wrapper Component

Create a client component that wraps your app:

```tsx
// components/PreviewWrapper.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface PreviewWrapperProps {
  children: React.ReactNode;
}

export function PreviewWrapper({ children }: PreviewWrapperProps) {
  const router = useRouter();
  const [Preview, setPreview] = useState<any>(null);

  useEffect(() => {
    // Only load in development and client-side
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      import('@hygraph/preview-sdk/react')
        .then((mod) => setPreview(() => mod.HygraphPreview))
        .catch(console.error);
    }
  }, []);

  // Render Preview when loaded
  if (Preview && typeof window !== 'undefined') {
    return (
      <Preview
        endpoint={process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT}
        studioUrl={process.env.NEXT_PUBLIC_HYGRAPH_STUDIO_URL}
        debug={true}
        onSave={() => {
          console.log('Content saved, refreshing...');
          router.replace(router.asPath); // Refresh without losing scroll
        }}
      >
        {children}
      </Preview>
    );
  }

  return <>{children}</>;
}
```

### 2. Add to _app.tsx

Wrap your app in `_app.tsx`:

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { PreviewWrapper } from '@/components/PreviewWrapper';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PreviewWrapper>
      <Component {...pageProps} />
    </PreviewWrapper>
  );
}
```

### 3. Set Environment Variables

```bash
# .env.local
NEXT_PUBLIC_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
NEXT_PUBLIC_HYGRAPH_STUDIO_URL=https://app.hygraph.com
```

### 4. Configure Preview URL in Hygraph Studio

1. Log into [Hygraph Studio](https://app.hygraph.com)
2. Open **Project Settings → Preview URLs**
3. Add a preview URL that matches your Pages Router app (e.g. `http://localhost:4500/posts/{entryId}`)
4. Save and click **Open Preview** on an entry to verify iframe mode

### 5. Add Data Attributes to Content

Mark your content elements with Hygraph data attributes:

```tsx
// pages/posts/[slug].tsx
import { GetServerSideProps } from 'next';

export default function PostPage({ post }) {
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

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const post = await getPost(params.slug);
  return { props: { post } };
};
```

## Refresh Strategies

The Pages Router doesn't have `router.refresh()` like the App Router, so you have a few options:

### Option 1: router.replace() (Recommended)

Replaces the current route without adding to history:

```tsx
<HygraphPreview
  onSave={() => {
    router.replace(router.asPath);
  }}
/>
```

This works well with `getServerSideProps` as it re-runs on each navigation.

### Option 2: Full Page Reload

Simple but loses scroll position:

```tsx
<HygraphPreview
  onSave={() => {
    window.location.reload();
  }}
/>
```

### Option 3: SWR/React Query

If using SWR or React Query for data fetching:

```tsx
import { useSWRConfig } from 'swr';

export function PreviewWrapper({ children }) {
  const { mutate } = useSWRConfig();

  return (
    <HygraphPreview
      onSave={() => {
        mutate(() => true); // Revalidate all SWR keys
      }}
    >
      {children}
    </HygraphPreview>
  );
}
```

## Using with Different Data Fetching Methods

### getServerSideProps

Best for preview as it re-fetches on every request:

```tsx
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params;
  const post = await fetchPost(slug);

  return {
    props: { post },
  };
};
```

Use with `router.replace(router.asPath)` to refresh.

### getStaticProps with ISR

If using Static Site Generation with Incremental Static Regeneration:

```tsx
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = await fetchPost(params.slug);

  return {
    props: { post },
    revalidate: 10, // Revalidate every 10 seconds
  };
};
```

For instant updates, trigger on-demand revalidation:

```tsx
// pages/api/revalidate.ts
export default async function handler(req, res) {
  const { path } = req.query;

  try {
    await res.revalidate(path);
    return res.json({ revalidated: true });
  } catch (err) {
    return res.status(500).send('Error revalidating');
  }
}
```

Then call it from your preview wrapper:

```tsx
<HygraphPreview
  onSave={async () => {
    await fetch(`/api/revalidate?path=${router.asPath}`);
    router.replace(router.asPath);
  }}
/>
```

## Advanced Usage

### Using Preview Hooks

```tsx
import { usePreviewSave } from '@hygraph/preview-sdk/react';
import { useRouter } from 'next/router';

export default function MyPage() {
  const router = useRouter();

  usePreviewSave((entryId) => {
    console.log('Saved:', entryId);
    router.replace(router.asPath);
  });

  return <div>My Page</div>;
}
```

### Conditional Preview

Only enable in specific pages:

```tsx
export function PreviewWrapper({ children }) {
  const router = useRouter();
  const isPreviewPage = router.pathname.startsWith('/preview');

  if (!isPreviewPage) {
    return <>{children}</>;
  }

  // ... setup HygraphPreview
}
```

## Troubleshooting

### TypeError: Cannot read property 'useState' of null

This error occurs if the SDK tries to render on the server. Make sure you're using the client-side only pattern shown above:

```tsx
useEffect(() => {
  if (typeof window !== 'undefined') {
    import('@hygraph/preview-sdk/react')
      .then((mod) => setPreview(() => mod.HygraphPreview));
  }
}, []);
```

### Preview Not Updating

1. Check that you're using `getServerSideProps` (not `getStaticProps`)
2. Verify `router.replace(router.asPath)` is being called
3. Enable `debug={true}` to see console logs

### Edit Buttons Not Appearing

1. Ensure `data-hygraph-entry-id` is set on elements
2. Check environment variables are correct
3. Verify the component loaded (check dev console)

## Production

The wrapper automatically disables in production:

```tsx
if (process.env.NODE_ENV === 'development') {
  // Load preview
}
```

For production previews, use a feature flag or environment variable.

## Migration from Pages to App Router

If you're migrating to the App Router:

1. Replace `router.replace(router.asPath)` with `router.refresh()`
2. Use dynamic import with `next/dynamic` instead of `useEffect`
3. Remove `useState` for component loading
4. Update `_app.tsx` → `layout.tsx`

See the [App Router guide](nextjs-app-router.md) for details.
