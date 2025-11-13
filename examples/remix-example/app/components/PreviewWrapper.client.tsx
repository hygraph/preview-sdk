/**
 * Client-side only Preview wrapper for Remix
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
    // Only load Preview in development and on client
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      import('@hygraph/preview-sdk/react').then((module) => {
        setPreview(() => module.HygraphPreview);
      }).catch(console.error);
    }
  }, []);

  // Only render Preview in development
  if (process.env.NODE_ENV !== 'development' || !Preview) {
    return <>{children}</>;
  }

  return (
    <Preview
      endpoint={process.env.HYGRAPH_ENDPOINT!}
      studioUrl={process.env.HYGRAPH_STUDIO_URL}
      refresh={() => navigate(".", { replace: true })}
      debug={true}
      overlay={{
        style: {
          borderColor: '#3b82f6',
          borderWidth: '2px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
        button: {
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '4px',
        },
      }}
      onReady={(preview: { getVersion: () => string }) => {
        console.log('Live Preview ready:', preview.getVersion());
      }}
      onSave={(entryId: string) => {
        console.log(`[Preview] Content saved for entry: ${entryId}`);
        navigate(".", { replace: true });
      }}
      onError={(error: Error) => {
        console.error('Live Preview error:', error);
      }}
    >
      {children}
    </Preview>
  );
}
