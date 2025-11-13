# Remix Guide

Complete guide for integrating Hygraph Preview SDK with Remix.

## Installation

```bash
npm install @hygraph/preview-sdk
```

## Setup

### 1. Create Preview Wrapper

```tsx
// app/components/PreviewWrapper.tsx
import { useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";

interface PreviewWrapperProps {
  children: React.ReactNode;
}

export function PreviewWrapper({ children }: PreviewWrapperProps) {
  const navigate = useNavigate();
  const [Preview, setPreview] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      import('@hygraph/preview-sdk/react')
        .then((mod) => setPreview(() => mod.HygraphPreview))
        .catch(console.error);
    }
  }, []);

  if (Preview && typeof window !== 'undefined') {
    return (
      <Preview
        endpoint={window.ENV?.HYGRAPH_ENDPOINT}
        studioUrl={window.ENV?.HYGRAPH_STUDIO_URL}
        debug={true}
        onSave={() => {
          console.log('Content saved, refreshing...');
          navigate('.', { replace: true }); // Reloads loaders
        }}
      >
        {children}
      </Preview>
    );
  }

  return <>{children}</>;
}
```

### 2. Add to Root

```tsx
// app/root.tsx
import { PreviewWrapper } from "./components/PreviewWrapper";

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <PreviewWrapper>
          <Outlet />
        </PreviewWrapper>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Pass environment variables to client
export function loader() {
  return json({
    ENV: {
      HYGRAPH_ENDPOINT: process.env.HYGRAPH_ENDPOINT,
      HYGRAPH_STUDIO_URL: process.env.HYGRAPH_STUDIO_URL,
    },
  });
}
```

### 3. Environment Variables

```bash
# .env
HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
HYGRAPH_STUDIO_URL=https://app.hygraph.com
```

### 4. Configure Preview URL in Hygraph Studio

1. Sign in to [Hygraph Studio](https://app.hygraph.com)
2. Head to **Project Settings → Preview URLs**
3. Create a preview that points at your Remix server (for example, `http://localhost:4501/recipes/{entryId}`)
4. Save, then open an entry and choose **Open Preview** to test iframe mode

### 5. Mark Content

```tsx
// app/routes/posts.$slug.tsx
export default function Post() {
  const { post } = useLoaderData<typeof loader>();

  return (
    <article data-hygraph-entry-id={post.id}>
      <h1
        data-hygraph-entry-id={post.id}
        data-hygraph-field-api-id="title"
      >
        {post.title}
      </h1>
    </article>
  );
}
```

## How It Works

The SDK uses `navigate('.', { replace: true })` which:
- Re-runs all loaders
- Preserves scroll position
- Updates the UI without full page reload

## Alternative: useRevalidator

You can also use Remix's `useRevalidator`:

```tsx
import { useRevalidator } from "@remix-run/react";

export function PreviewWrapper({ children }: PreviewWrapperProps) {
  const revalidator = useRevalidator();

  return (
    <HygraphPreview
      onSave={() => {
        revalidator.revalidate();
      }}
    >
      {children}
    </HygraphPreview>
  );
}
```

## Using Hooks

```tsx
import { usePreviewSave } from '@hygraph/preview-sdk/react';
import { useNavigate } from '@remix-run/react';

export default function MyRoute() {
  const navigate = useNavigate();

  usePreviewSave(() => {
    navigate('.', { replace: true });
  });

  return <div>Content</div>;
}
```

## Complete Example

See the [complete Remix example](../../examples/remix-example/) for a working implementation.
