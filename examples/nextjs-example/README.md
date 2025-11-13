# Next.js Example

Next.js App Router example showing Hygraph Preview SDK integration.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```bash
   NEXT_PUBLIC_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
   NEXT_PUBLIC_HYGRAPH_STUDIO_URL=https://app.hygraph.com
   HYGRAPH_TOKEN=your-permanent-auth-token  # Optional: Required if your project uses authentication
   ```

3. Run the server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:4500](http://localhost:4500)

## How It Works

The wrapper component (`src/components/PreviewWrapper.tsx`) loads the Preview SDK and refreshes content when saved using `router.refresh()`.

## Testing

**Standalone:** Open in your browser, hover over content to see edit buttons.

**Studio Integration:** Use this URL in your Hygraph preview settings.

## Schema

Uses the recipe schema from `../schema.json`. See main examples README for setup.
