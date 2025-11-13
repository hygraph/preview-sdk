import { useRouter } from 'next/router';
import { useEffect, useState, useMemo, useLayoutEffect } from 'react';
import type { ComponentType, ReactNode } from 'react';

interface PreviewWrapperProps {
  children: ReactNode;
}

export function PreviewWrapper({ children }: PreviewWrapperProps) {
  const router = useRouter();
  const [PreviewComponent, setPreviewComponent] = useState<ComponentType<any> | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Use useLayoutEffect to ensure React is fully initialized before loading SDK
  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only proceed if mounted and in development
    if (!isMounted || process.env.NODE_ENV !== 'development') return;

    // Load SDK module
    import('@hygraph/preview-sdk/react')
      .then((mod) => {
        setPreviewComponent(() => mod.HygraphPreview);
      })
      .catch((error) => {
        console.error('Failed to load Hygraph Preview SDK:', error);
      });
  }, [isMounted]);

  const handleSave = useMemo(() => {
    return () => {
      console.log('Content saved, refreshing...');
      router.replace(router.asPath);
    };
  }, [router]);

  // Don't render Preview until mounted and component is loaded
  if (!isMounted || !PreviewComponent || process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }

  return (
    <PreviewComponent
      endpoint={process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT}
      studioUrl={process.env.NEXT_PUBLIC_HYGRAPH_STUDIO_URL}
      debug={true}
      onSave={handleSave}
    >
      {children}
    </PreviewComponent>
  );
}
