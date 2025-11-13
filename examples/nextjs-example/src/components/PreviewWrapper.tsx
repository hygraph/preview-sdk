/**
 * Hygraph Preview wrapper for Next.js App Router
 * Minimal setup for content preview integration
 */

'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

interface PreviewWrapperProps {
  children: React.ReactNode;
}

// Dynamically import to avoid SSR issues
const HygraphPreview = dynamic(
  async () => {
    const { HygraphPreview } = await import('@hygraph/preview-sdk/react');
    return { default: HygraphPreview };
  },
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
        router.refresh();
      }}
      sync={{
        fieldFocus: true,
      }}
    >
      {children}
    </HygraphPreview>
  );
}
