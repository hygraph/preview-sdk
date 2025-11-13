# Next.js Pages Router Example

Next.js Pages Router example showing Hygraph Preview SDK integration for Next.js < 13 or projects using the pages directory.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```bash
   NEXT_PUBLIC_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
   NEXT_PUBLIC_HYGRAPH_STUDIO_URL=https://app.hygraph.com
   ```

3. Run the server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:4503](http://localhost:4503)

## How It Works

The wrapper component (`components/PreviewWrapper.tsx`) loads the Preview SDK client-side and uses `router.replace(router.asPath)` to refresh content when saved.

## Key Differences from App Router

- Uses `useEffect` + dynamic import instead of `next/dynamic`
- Uses `router.replace(router.asPath)` instead of `router.refresh()`
- Works with `getServerSideProps` or `getStaticProps`

## Testing

**Standalone:** Open in your browser, hover over content to see edit buttons.

**Studio Integration:** Use this URL in your Hygraph preview settings.

## Documentation

See the complete [Pages Router guide](../../docs/frameworks/nextjs-pages-router.md) for detailed setup and advanced usage.

## Schema

Uses the recipe schema from `../schema.json`. See main examples README for setup.
