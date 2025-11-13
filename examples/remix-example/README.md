# Remix Example

Remix example showing Hygraph Preview SDK integration.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```bash
   HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/your-project-id/master
   HYGRAPH_STUDIO_URL=https://app.hygraph.com
   ```

3. Run the server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:4501](http://localhost:4501)

## How It Works

The wrapper component (`app/components/PreviewWrapper.tsx`) loads the Preview SDK and refreshes content when saved using `navigate('.', { replace: true })`.

## Testing

**Standalone:** Open in your browser, hover over content to see edit buttons.

**Studio Integration:** Use this URL in your Hygraph preview settings.

## Schema

Uses the recipe schema from `../schema.json`. See main examples README for setup.
