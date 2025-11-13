import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import '../styles/globals.css';

// Dynamically import PreviewWrapper to avoid SSR issues
const PreviewWrapper = dynamic(
  () => import('../components/PreviewWrapper').then(mod => ({ default: mod.PreviewWrapper })),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  // Only wrap with PreviewWrapper in development
  if (process.env.NODE_ENV === 'development') {
    return (
      <PreviewWrapper>
        <Component {...pageProps} />
      </PreviewWrapper>
    );
  }

  return <Component {...pageProps} />;
}
