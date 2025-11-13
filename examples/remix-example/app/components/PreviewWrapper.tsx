/**
 * Hygraph Preview wrapper for Remix
 * Minimal setup for content preview integration
 */

import { useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";

interface PreviewWrapperProps {
  children: React.ReactNode;
}

export function PreviewWrapper({ children }: PreviewWrapperProps) {
  const navigate = useNavigate();
  const [Preview, setPreview] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    // Only load in development and on client-side
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      import('@hygraph/preview-sdk/react')
        .then((module) => setPreview(() => module.HygraphPreview))
        .catch(console.error);
    }
  }, []);

  // Render Preview when loaded
  if (Preview && typeof window !== 'undefined') {
    return (
      <Preview
        endpoint={window.ENV?.HYGRAPH_ENDPOINT}
        studioUrl={window.ENV?.HYGRAPH_STUDIO_URL}
        debug={true}
        onSave={() => {
          console.log('Content saved, refreshing...');
          navigate('.', { replace: true });
        }}
      >
        {children}
      </Preview>
    );
  }

  return <>{children}</>;
}
